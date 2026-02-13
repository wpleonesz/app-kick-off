/**
 * Logger Service
 *
 * Sistema centralizado de logging con múltiples niveles:
 * - debug: información detallada de desarrollo
 * - info: eventos normales de la aplicación
 * - warn: advertencias y situaciones anómalas
 * - error: errores que requieren atención
 * - fatal: errores críticos que detienen la app
 *
 * Características:
 * - Almacenamiento local de logs
 * - Sincronización con servidor
 * - Tamaño máximo de logs para no saturar storage
 * - Timestamps y contexto automático
 */

import { Preferences } from '@capacitor/preferences';
import api from '../lib/api';
import { device } from '../lib/device';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  deviceUuid?: string;
  sessionId?: string;
  synced?: boolean;
}

interface LogStore {
  entries: LogEntry[];
  lastSync: number;
}

class LoggerService {
  /** Cola de logs */
  private logQueue: LogEntry[] = [];

  /** ID de sesión */
  private sessionId: string = '';

  /** Usuario actual */
  private currentUserId: string | null = null;

  /** Intervalo para sincronizar logs (5 minutos) */
  private syncInterval = 5 * 60 * 1000;

  /** Timer para sincronización automática */
  private syncTimer: NodeJS.Timeout | null = null;

  /** Máximo de logs a almacenar localmente */
  private maxLocalLogs = 50;

  /** Nivel mínimo de log a registrar */
  private minLogLevel: LogLevel = 'debug';

  /**
   * Inicializar el logger
   */
  async init(sessionId: string): Promise<void> {
    try {
      this.sessionId = sessionId;

      // Cargar logs previos
      await this.loadLogQueue();

      // Sincronizar logs pendientes
      await this.syncLogs();

      // Iniciar sincronización automática
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
      }
      this.syncTimer = setInterval(() => {
        this.syncLogs();
      }, this.syncInterval);

      console.log('[Logger] Initialized');

      // Capturar errores no capturados globalmente
      window.addEventListener('error', (event) => {
        this.error(
          'Uncaught Error',
          {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
          event.error?.stack,
        );
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error(
          'Unhandled Promise Rejection',
          { reason: event.reason },
          event.reason?.stack,
        );
      });
    } catch (error) {
      console.error('[Logger] Error initializing:', error);
    }
  }

  /**
   * Limpiar el logger
   */
  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Intentar sincronizar logs antes de cerrar
    this.syncLogs().catch((err) =>
      console.warn('[Logger] Error syncing on cleanup:', err),
    );

    console.log('[Logger] Cleaned up');
  }

  /**
   * Establecer usuario
   */
  setUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Limpiar usuario
   */
  clearUser(): void {
    this.currentUserId = null;
  }

  /**
   * Log de nivel debug
   */
  debug(message: string, context?: Record<string, any>, stack?: string): void {
    if (this.shouldLog('debug')) {
      this.addLogEntry('debug', message, context, stack);
    }
    console.debug(`[DEBUG] ${message}`, context);
  }

  /**
   * Log de nivel info
   */
  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      this.addLogEntry('info', message, context);
    }
    console.info(`[INFO] ${message}`, context);
  }

  /**
   * Log de nivel warn
   */
  warn(message: string, context?: Record<string, any>, stack?: string): void {
    if (this.shouldLog('warn')) {
      this.addLogEntry('warn', message, context, stack);
    }
    console.warn(`[WARN] ${message}`, context);
  }

  /**
   * Log de nivel error
   */
  error(message: string, context?: Record<string, any>, stack?: string): void {
    if (this.shouldLog('error')) {
      this.addLogEntry('error', message, context, stack);
    }
    console.error(`[ERROR] ${message}`, context, stack);
  }

  /**
   * Log de nivel fatal
   */
  fatal(message: string, context?: Record<string, any>, stack?: string): void {
    if (this.shouldLog('fatal')) {
      this.addLogEntry('fatal', message, context, stack);
    }
    console.error(`[FATAL] ${message}`, context, stack);
  }

  /**
   * Sincronizar logs con servidor
   */
  async syncLogs(): Promise<void> {
    const unsyncedLogs = this.logQueue.filter((l) => !l.synced);

    if (unsyncedLogs.length === 0) {
      return;
    }

    try {
      console.debug(`[Logger] Syncing ${unsyncedLogs.length} logs to server`);

      // Enviar logs al servidor
      await api.post(
        '/api/logs',
        { logs: unsyncedLogs },
        true, // requiresAuth
      );

      // Marcar como sincronizados
      unsyncedLogs.forEach((l) => {
        const idx = this.logQueue.indexOf(l);
        if (idx >= 0) {
          this.logQueue[idx].synced = true;
        }
      });

      // Limpiar logs antiguos sincronizados
      this.logQueue = this.logQueue.filter((l) => {
        if (!l.synced) return true;
        // Guardar logs sincronizados por 24 horas
        return Date.now() - l.timestamp < 24 * 60 * 60 * 1000;
      });

      await this.saveLogQueue();
    } catch (error) {
      console.warn('[Logger] Sync failed:', error);
    }
  }

  /**
   * Obtener estadísticas del logger
   */
  getStatistics() {
    return {
      totalLogs: this.logQueue.length,
      unsyncedLogs: this.logQueue.filter((l) => !l.synced).length,
      syncedLogs: this.logQueue.filter((l) => l.synced).length,
      byLevel: {
        debug: this.logQueue.filter((l) => l.level === 'debug').length,
        info: this.logQueue.filter((l) => l.level === 'info').length,
        warn: this.logQueue.filter((l) => l.level === 'warn').length,
        error: this.logQueue.filter((l) => l.level === 'error').length,
        fatal: this.logQueue.filter((l) => l.level === 'fatal').length,
      },
    };
  }

  /**
   * Obtener logs recientes
   */
  getRecentLogs(count: number = 20): LogEntry[] {
    return this.logQueue.slice(-count);
  }

  /**
   * Limpiar logs (para testing)
   */
  async clear(): Promise<void> {
    this.logQueue = [];
    await Preferences.remove({ key: 'logger_logs' });
    console.log('[Logger] Cleared all logs');
  }

  // ────────────────────────────────────────────────────────
  //  Private helpers
  // ────────────────────────────────────────────────────────

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentIndex = levels.indexOf(this.minLogLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= currentIndex;
  }

  private async addLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stack?: string,
  ): Promise<void> {
    try {
      const entry: LogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        level,
        message,
        context,
        stackTrace: stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.currentUserId || undefined,
        deviceUuid: await device.getId(),
        sessionId: this.sessionId,
        synced: false,
      };

      this.logQueue.push(entry);
      await this.saveLogQueue();
    } catch (error) {
      console.warn('[Logger] Error adding log entry:', error);
    }
  }

  private async saveLogQueue(): Promise<void> {
    try {
      // Limitar a maxLocalLogs
      if (this.logQueue.length > this.maxLocalLogs) {
        this.logQueue = this.logQueue.slice(-this.maxLocalLogs);
      }

      const store: LogStore = {
        entries: this.logQueue,
        lastSync: Date.now(),
      };

      await Preferences.set({
        key: 'logger_logs',
        value: JSON.stringify(store),
      });
    } catch (error) {
      console.warn('[Logger] Error saving log queue:', error);
    }
  }

  private async loadLogQueue(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'logger_logs' });

      if (value) {
        const store: LogStore = JSON.parse(value);
        this.logQueue = store.entries || [];
        console.debug(`[Logger] Loaded ${this.logQueue.length} logs from storage`);
      }
    } catch (error) {
      console.warn('[Logger] Error loading log queue:', error);
      this.logQueue = [];
    }
  }
}

/** Singleton — una sola instancia para toda la app */
export const logger = new LoggerService();
