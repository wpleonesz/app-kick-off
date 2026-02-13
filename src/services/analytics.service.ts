/**
 * Analytics Service
 *
 * Centraliza el tracking de eventos y comportamiento del usuario:
 * - Eventos de usuario (login, registro, logout, etc)
 * - Eventos de app (error, screen view, etc)
 * - Información de sesión y dispositivo
 * - Almacenamiento local para offline
 * - Envío al servidor cuando está disponible
 */

import { Preferences } from '@capacitor/preferences';
import api from '../lib/api';
import { device } from '../lib/device';

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  eventName: string;
  category: 'user' | 'app' | 'error' | 'performance' | 'other';
  properties: Record<string, any>;
  userId?: string;
  deviceUuid?: string;
  platform?: string;
  appVersion?: string;
  sessionId?: string;
  synced?: boolean;
}

interface EventQueue {
  events: AnalyticsEvent[];
  lastSync: number;
}

class AnalyticsService {
  /** Cola local de eventos */
  private eventQueue: AnalyticsEvent[] = [];

  /** ID de sesión (generado al inicializar) */
  private sessionId: string = '';

  /** Usuario actual (si está autenticado) */
  private currentUserId: string | null = null;

  /** Intervalo para sincronizar eventos (1 minuto) */
  private syncInterval = 60_000;

  /** Timer para sincronización automática */
  private syncTimer: NodeJS.Timeout | null = null;

  /** Máximo de eventos a almacenar localmente */
  private maxLocalEvents = 100;

  /**
   * Inicializar el servicio de analytics
   */
  async init(): Promise<void> {
    try {
      // Generar ID de sesión
      this.sessionId = this.generateSessionId();

      // Cargar eventos previos de storage
      await this.loadEventQueue();

      // Sincronizar eventos pendientes
      await this.syncEvents();

      // Iniciar sincronización automática
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
      }
      this.syncTimer = setInterval(() => {
        this.syncEvents();
      }, this.syncInterval);

      console.log('[Analytics] Initialized with session:', this.sessionId);
    } catch (error) {
      console.error('[Analytics] Error initializing:', error);
    }
  }

  /**
   * Limpiar el servicio
   */
  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Intentar sincronizar eventos pendientes antes de limpiar
    this.syncEvents().catch((err) =>
      console.warn('[Analytics] Error syncing on cleanup:', err),
    );

    console.log('[Analytics] Cleaned up');
  }

  /**
   * Establecer el usuario actual (se llama al login)
   */
  setUser(userId: string): void {
    this.currentUserId = userId;
    console.debug('[Analytics] User set:', userId);
  }

  /**
   * Limpiar usuario (se llama al logout)
   */
  clearUser(): void {
    this.currentUserId = null;
    console.debug('[Analytics] User cleared');
  }

  /**
   * Rastrear evento de usuario
   */
  async trackUserEvent(
    eventName: string,
    properties?: Record<string, any>,
  ): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventName,
      category: 'user',
      properties: properties || {},
      userId: this.currentUserId || undefined,
      deviceUuid: await device.getId(),
      platform: (await device.getPlatform()) as string,
      appVersion: (await device.getInfo()).appVersion,
      sessionId: this.sessionId,
      synced: false,
    };

    this.eventQueue.push(event);
    await this.saveEventQueue();

    console.debug('[Analytics] User event tracked:', eventName, properties);
  }

  /**
   * Rastrear evento de app
   */
  async trackAppEvent(
    eventName: string,
    properties?: Record<string, any>,
  ): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventName,
      category: 'app',
      properties: properties || {},
      deviceUuid: await device.getId(),
      platform: (await device.getPlatform()) as string,
      appVersion: (await device.getInfo()).appVersion,
      sessionId: this.sessionId,
      synced: false,
    };

    this.eventQueue.push(event);
    await this.saveEventQueue();

    console.debug('[Analytics] App event tracked:', eventName);
  }

  /**
   * Rastrear error
   */
  async trackError(
    errorName: string,
    errorMessage: string,
    stackTrace?: string,
    properties?: Record<string, any>,
  ): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventName: errorName,
      category: 'error',
      properties: {
        message: errorMessage,
        stackTrace,
        ...properties,
      },
      userId: this.currentUserId || undefined,
      deviceUuid: await device.getId(),
      platform: (await device.getPlatform()) as string,
      appVersion: (await device.getInfo()).appVersion,
      sessionId: this.sessionId,
      synced: false,
    };

    this.eventQueue.push(event);
    await this.saveEventQueue();

    console.error('[Analytics] Error tracked:', errorName, errorMessage);
  }

  /**
   * Rastrear métrica de performance
   */
  async trackPerformance(
    metricName: string,
    duration: number,
    properties?: Record<string, any>,
  ): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventName: metricName,
      category: 'performance',
      properties: {
        duration,
        ...properties,
      },
      deviceUuid: await device.getId(),
      platform: (await device.getPlatform()) as string,
      appVersion: (await device.getInfo()).appVersion,
      sessionId: this.sessionId,
      synced: false,
    };

    this.eventQueue.push(event);
    await this.saveEventQueue();

    console.debug('[Analytics] Performance tracked:', metricName, `${duration}ms`);
  }

  /**
   * Sincronizar eventos con el servidor
   */
  async syncEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const unsyncedEvents = this.eventQueue.filter((e) => !e.synced);

    if (unsyncedEvents.length === 0) {
      return;
    }

    try {
      console.debug(
        `[Analytics] Syncing ${unsyncedEvents.length} events to server`,
      );

      // Enviar eventos al servidor
      await api.post(
        '/api/analytics/events',
        { events: unsyncedEvents },
        true, // requiresAuth
      );

      // Marcar como sincronizados
      unsyncedEvents.forEach((e) => {
        const idx = this.eventQueue.indexOf(e);
        if (idx >= 0) {
          this.eventQueue[idx].synced = true;
        }
      });

      // Limpiar eventos antiguos sincronizados
      this.eventQueue = this.eventQueue.filter((e) => {
        if (!e.synced) return true;
        // Guardar eventos sincronizados por 24 horas, luego descartar
        return Date.now() - e.timestamp < 24 * 60 * 60 * 1000;
      });

      await this.saveEventQueue();
      console.log('[Analytics] Sync successful');
    } catch (error) {
      console.warn('[Analytics] Sync failed:', error);
      // No lanzar error, solo intentar más tarde
    }
  }

  /**
   * Obtener eventos pendientes de sincronizar
   */
  getPendingEvents(): AnalyticsEvent[] {
    return this.eventQueue.filter((e) => !e.synced);
  }

  /**
   * Obtener estadísticas de eventos
   */
  getStatistics() {
    return {
      totalEvents: this.eventQueue.length,
      unsyncedEvents: this.eventQueue.filter((e) => !e.synced).length,
      syncedEvents: this.eventQueue.filter((e) => e.synced).length,
      sessionId: this.sessionId,
      currentUserId: this.currentUserId,
    };
  }

  /**
   * Limpiar todo (para testing)
   */
  async clear(): Promise<void> {
    this.eventQueue = [];
    await Preferences.remove({ key: 'analytics_events' });
    console.log('[Analytics] Cleared all events');
  }

  // ────────────────────────────────────────────────────────
  //  Private helpers
  // ────────────────────────────────────────────────────────

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveEventQueue(): Promise<void> {
    try {
      // Limitar a maxLocalEvents
      if (this.eventQueue.length > this.maxLocalEvents) {
        this.eventQueue = this.eventQueue.slice(-this.maxLocalEvents);
      }

      const queueData: EventQueue = {
        events: this.eventQueue,
        lastSync: Date.now(),
      };

      await Preferences.set({
        key: 'analytics_events',
        value: JSON.stringify(queueData),
      });
    } catch (error) {
      console.warn('[Analytics] Error saving event queue:', error);
    }
  }

  private async loadEventQueue(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'analytics_events' });

      if (value) {
        const queueData: EventQueue = JSON.parse(value);
        this.eventQueue = queueData.events || [];
        console.debug(`[Analytics] Loaded ${this.eventQueue.length} events from storage`);
      }
    } catch (error) {
      console.warn('[Analytics] Error loading event queue:', error);
      this.eventQueue = [];
    }
  }
}

/** Singleton — una sola instancia para toda la app */
export const analytics = new AnalyticsService();
