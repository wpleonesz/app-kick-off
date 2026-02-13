/**
 * Session Guard Service
 *
 * Protege la sesión del usuario:
 * - Detecta si la sesión se está cerrando (logout en progreso)
 * - Bloquea nuevos requests si se está cerrando
 * - Verifica periódicamente si la cuenta sigue activa
 * - Logout forzado si la cuenta fue desactivada
 */

import { Preferences } from '@capacitor/preferences';
import api from '../lib/api';
import { authService } from './auth.service';

interface SessionStatus {
  isValid: boolean;
  isActive: boolean;
  lastCheck?: number;
}

class SessionGuardService {
  /** Flag que indica si la sesión se está cerrando */
  isSessionClosing = false;

  /** Intervalo de verificación de sesión (5 minutos) */
  private checkInterval = 5 * 60 * 1000;

  /** Último time que se verificó la sesión */
  private lastSessionCheck = 0;

  /** Intervalo para chequear sesión */
  private sessionCheckTimer: NodeJS.Timeout | null = null;

  /**
   * Inicializar el session guard
   * Debe llamarse cuando la app inicia sesión
   */
  init() {
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
    }

    // Verificar sesión cada 5 minutos
    this.sessionCheckTimer = setInterval(() => {
      this.verifySession();
    }, this.checkInterval);

    console.log('[SessionGuard] Initialized - checking every 5 minutes');
  }

  /**
   * Cleanup del session guard
   * Debe llamarse cuando el usuario hace logout
   */
  cleanup() {
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
      this.sessionCheckTimer = null;
    }
    this.isSessionClosing = false;
    console.log('[SessionGuard] Cleaned up');
  }

  /**
   * Marcar que la sesión se está cerrando
   * Esto previene que se hagan nuevos requests durante el logout
   */
  setSessionClosing() {
    this.isSessionClosing = true;
    console.log('[SessionGuard] Session is closing');
  }

  /**
   * Verificar si la sesión sigue siendo válida
   * Contacta al servidor para validar que la cuenta sigue activa
   */
  async verifySession(): Promise<boolean> {
    try {
      const now = Date.now();

      // Evitar verificaciones muy frecuentes (esperar 1 min mínimo)
      if (now - this.lastSessionCheck < 60_000) {
        return true;
      }

      console.log('[SessionGuard] Verifying session...');
      this.lastSessionCheck = now;

      // Intentar obtener el usuario actual
      const user = await api.get('/api/auth/user', true);

      if (!user) {
        console.warn('[SessionGuard] User not found on server');
        this.forceLogout();
        return false;
      }

      // Guardar estado en Preferences
      await Preferences.set({
        key: 'session_valid',
        value: 'true',
      });

      console.log('[SessionGuard] Session verified ✅');
      return true;
    } catch (error) {
      // Si falla la verificación, asumir que la sesión expiró
      console.error('[SessionGuard] Verification failed:', error);

      // Si es 401 o 403, logout forzado
      if (error instanceof Error) {
        if (
          error.message.includes('No autorizado') ||
          error.message.includes('Sesión expirada')
        ) {
          this.forceLogout();
          return false;
        }
      }

      // En otros errores, mantener sesión activa (podría ser error de red)
      return true;
    }
  }

  /**
   * Logout forzado (cuando la sesión se detecta como inválida)
   */
  async forceLogout() {
    console.warn('[SessionGuard] Forcing logout due to invalid session');

    this.setSessionClosing();

    try {
      await authService.signout();
    } catch (err) {
      console.error('[SessionGuard] Error during forced logout:', err);
    }

    // Redirigir a login
    window.location.href = '/login';
  }

  /**
   * Obtener estado actual de la sesión
   */
  async getStatus(): Promise<SessionStatus> {
    return {
      isValid: !this.isSessionClosing,
      isActive: await this.verifySession(),
      lastCheck: this.lastSessionCheck,
    };
  }
}

/** Singleton — una sola instancia para toda la app */
export const sessionGuard = new SessionGuardService();
