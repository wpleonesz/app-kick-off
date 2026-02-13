/**
 * Request Balancer — Balanceador de carga del lado del cliente.
 *
 * Características:
 * 1. Cola con concurrencia limitada (máx N requests simultáneos)
 * 2. Caché en memoria con TTL para GETs (evita requests duplicados)
 * 3. Deduplicación: misma URL al mismo tiempo = 1 sola petición real
 * 4. Retry con backoff exponencial (429 / 503 / errores de red)
 * 5. Prioridad: peticiones críticas pasan primero en la cola
 */

/** Niveles de prioridad — menor número = mayor prioridad */
export enum RequestPriority {
  CRITICAL = 0, // login, signup, auth
  HIGH = 1, // datos del usuario, menú
  NORMAL = 2, // listados, historial
  LOW = 3, // noticias, avisos
}

/** Rutas críticas que reciben prioridad automática */
const CRITICAL_PATTERNS = [
  '/api/auth',
  '/api/user/profile',
];

const HIGH_PATTERNS = [
  '/api/user',
  '/api/public/roles',
];

interface QueueItem {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: RequestPriority;
  timestamp: number;
}

interface CacheEntry {
  data: any;
  expiry: number;
}

class RequestBalancer {
  /** Máximo de peticiones HTTP simultáneas */
  private maxConcurrent = 6;
  /** Peticiones activas en este momento */
  private activeCount = 0;
  /** Cola de peticiones pendientes (ordenada por prioridad) */
  private queue: QueueItem[] = [];

  /** Caché de GETs en memoria con TTL */
  private cache = new Map<string, CacheEntry>();
  /** TTL por defecto: 30 segundos */
  private defaultTTL = 30_000;

  /** Deduplicación: promesas en vuelo por clave */
  private inFlight = new Map<string, Promise<any>>();

  /** Config de retry */
  private maxRetries = 2;
  private baseDelay = 1_000; // 1 segundo

  /** Métricas para debug */
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    deduplicated: 0,
    retries: 0,
    queued: 0,
  };

  // ────────────────────────────────────────────
  //  API Pública
  // ────────────────────────────────────────────

  /**
   * Ejecuta un GET con caché + deduplicación + cola.
   * @param key   Clave única (normalmente la URL)
   * @param fn    Función que realiza el request real
   * @param ttl   TTL del caché en ms (0 = sin caché)
   */
  async get<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    this.metrics.totalRequests++;

    // 1️⃣ Revisar caché
    const cached = this.getFromCache(key);
    if (cached !== undefined) {
      this.metrics.cacheHits++;
      console.debug(`[RequestBalancer] Cache hit: ${key}`);
      return cached as T;
    }

    // 2️⃣ Deduplicar: si ya hay un request en vuelo para esta key, esperar
    const existing = this.inFlight.get(key);
    if (existing) {
      this.metrics.deduplicated++;
      console.debug(`[RequestBalancer] Deduplicated: ${key}`);
      return existing as Promise<T>;
    }

    // 3️⃣ Encolar el request real
    const priority = this.detectPriority(key);
    const promise = this.enqueue(() => fn(), priority)
      .then((data) => {
        // Guardar en caché
        const cacheTTL = ttl ?? this.defaultTTL;
        if (cacheTTL > 0) {
          this.setCache(key, data, cacheTTL);
        }
        this.inFlight.delete(key);
        return data;
      })
      .catch((err) => {
        this.inFlight.delete(key);
        throw err;
      });

    this.inFlight.set(key, promise);
    return promise as Promise<T>;
  }

  /**
   * Ejecuta un POST/PUT sin caché pero con cola + retry.
   * Invalida el caché de la URL base automáticamente.
   */
  async mutate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;
    const priority = this.detectPriority(key);

    // Invalidar caché relacionado
    this.invalidateCache(key);

    return this.enqueue(() => fn(), priority);
  }

  /** Invalida una entrada específica o todas las que matcheen un patrón */
  invalidateCache(pattern: string): void {
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        this.cache.delete(key);
        console.debug(`[RequestBalancer] Cache invalidated: ${key}`);
      }
    });
  }

  /** Limpiar todo el caché (ej: al hacer logout) */
  clearCache(): void {
    this.cache.clear();
    this.inFlight.clear();
    console.debug(`[RequestBalancer] Cache cleared`);
  }

  /** Obtener métricas para debug/monitoreo */
  getMetrics() {
    return {
      ...this.metrics,
      activeRequests: this.activeCount,
      queueLength: this.queue.length,
      cacheSize: this.cache.size,
    };
  }

  /** Reset métricas */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      deduplicated: 0,
      retries: 0,
      queued: 0,
    };
  }

  // ────────────────────────────────────────────
  //  Cola con concurrencia limitada
  // ────────────────────────────────────────────

  private enqueue<T>(
    fn: () => Promise<T>,
    priority: RequestPriority,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: fn,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
      });

      // Ordenar por prioridad (menor = más urgente), luego por antigüedad
      this.queue.sort(
        (a, b) => a.priority - b.priority || a.timestamp - b.timestamp,
      );

      this.metrics.queued++;
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;
    try {
      const result = await this.executeWithRetry(item.execute);
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.activeCount--;
      // Procesar siguiente en la cola
      this.processQueue();
    }
  }

  // ────────────────────────────────────────────
  //  Retry con backoff exponencial
  // ────────────────────────────────────────────

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt = 0,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const isRetryable =
        status === 429 || // Too Many Requests
        status === 503 || // Service Unavailable
        status === 502 || // Bad Gateway
        error?.message?.includes('network') ||
        error?.message?.includes('timeout');

      if (isRetryable && attempt < this.maxRetries) {
        this.metrics.retries++;
        const delay = this.baseDelay * Math.pow(2, attempt);
        // Añadir jitter aleatorio (±25%) para evitar thundering herd
        const jitter = delay * (0.75 + Math.random() * 0.5);

        console.warn(
          `[RequestBalancer] Retry ${attempt + 1}/${this.maxRetries} after ${Math.round(jitter)}ms`,
        );

        await new Promise((r) => setTimeout(r, jitter));
        return this.executeWithRetry(fn, attempt + 1);
      }

      throw error;
    }
  }

  // ────────────────────────────────────────────
  //  Caché en memoria
  // ────────────────────────────────────────────

  private getFromCache(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, { data, expiry: Date.now() + ttl });

    // Limpieza periódica: si el caché crece mucho, limpiar entradas expiradas
    if (this.cache.size > 200) {
      this.cleanExpiredCache();
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    });
  }

  // ────────────────────────────────────────────
  //  Detección automática de prioridad
  // ────────────────────────────────────────────

  private detectPriority(url: string): RequestPriority {
    if (CRITICAL_PATTERNS.some((p) => url.includes(p))) {
      return RequestPriority.CRITICAL;
    }
    if (HIGH_PATTERNS.some((p) => url.includes(p))) {
      return RequestPriority.HIGH;
    }
    return RequestPriority.NORMAL;
  }
}

/** Singleton — una sola instancia para toda la app */
export const requestBalancer = new RequestBalancer();
