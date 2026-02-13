/**
 * Device Service
 *
 * Identifica y maneja información del dispositivo:
 * - UUID único del dispositivo (generado o del SO)
 * - Información del platform (iOS, Android, Web)
 * - Información del navegador/app
 * - Envío automático en headers de requests
 */

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

interface DeviceInfo {
  uuid: string;
  platform: string;
  isNative: boolean;
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
}

/**
 * Generar un UUID v4 sin dependencias externas
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class DeviceService {
  private deviceInfo: DeviceInfo | null = null;

  /**
   * Inicializar y obtener información del dispositivo
   */
  async init(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    try {
      // Obtener UUID
      const uuid = await this.getOrCreateUUID();

      // Obtener info del dispositivo según platform
      const platform = Capacitor.getPlatform();
      const isNative = Capacitor.isNativePlatform();

      let manufacturer: string | undefined;
      let model: string | undefined;
      let osVersion: string | undefined;

      // Si es nativo, intentar obtener info del SO (opcional)
      // NOTA: En web, estos campos quedarán undefined
      if (isNative && typeof (window as any).capacitorDevice !== 'undefined') {
        try {
          // Para evitar problemas de build, accedemos al API a través de window
          const device = (window as any).capacitorDevice;
          if (device && device.getInfo) {
            const deviceInfo = await device.getInfo();
            manufacturer = deviceInfo.manufacturer;
            model = deviceInfo.model;
            osVersion = deviceInfo.osVersion;
          }
        } catch (err) {
          console.debug('[Device] Could not load Device API:', err);
        }
      }

      // Obtener versión de la app
      const appVersion = await this.getAppVersion();

      this.deviceInfo = {
        uuid,
        platform,
        isNative,
        manufacturer,
        model,
        osVersion,
        appVersion,
      };

      console.log('[Device] Initialized:', this.deviceInfo);
      return this.deviceInfo;
    } catch (error) {
      console.error('[Device] Error initializing:', error);
      throw new Error('Failed to initialize device service');
    }
  }

  /**
   * Obtener o crear UUID del dispositivo
   * Se guarda en Preferences para persistencia
   */
  private async getOrCreateUUID(): Promise<string> {
    try {
      // Intentar obtener UUID guardado
      const { value } = await Preferences.get({ key: 'device_uuid' });

      if (value) {
        console.log('[Device] Using existing UUID');
        return value;
      }

      // Generar nuevo UUID
      const newUUID = generateUUID();
      await Preferences.set({
        key: 'device_uuid',
        value: newUUID,
      });

      console.log('[Device] Generated new UUID:', newUUID);
      return newUUID;
    } catch (error) {
      console.warn('[Device] Error managing UUID, generating temporary:', error);
      // Fallback: generar UUID en memoria (se perderá al cerrar app)
      return generateUUID();
    }
  }

  /**
   * Obtener versión de la app
   */
  private async getAppVersion(): Promise<string> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { App } = await import('@capacitor/app');
        const info = await App.getInfo();
        return info.version;
      }

      // Para web, intentar desde package.json o window
      return (window as any).__APP_VERSION__ || '1.0.0';
    } catch (error) {
      console.warn('[Device] Could not get app version:', error);
      return '1.0.0';
    }
  }

  /**
   * Obtener UUID del dispositivo
   */
  async getId(): Promise<string> {
    if (!this.deviceInfo) {
      await this.init();
    }
    return this.deviceInfo!.uuid;
  }

  /**
   * Obtener información completa del dispositivo
   */
  async getInfo(): Promise<DeviceInfo> {
    if (!this.deviceInfo) {
      await this.init();
    }
    return this.deviceInfo!;
  }

  /**
   * Obtener plataforma
   */
  async getPlatform(): Promise<string> {
    if (!this.deviceInfo) {
      await this.init();
    }
    return this.deviceInfo!.platform;
  }

  /**
   * Obtener headers personalizados para requests
   */
  async getHeaders(): Promise<Record<string, string>> {
    const info = await this.getInfo();

    return {
      'X-Device-UUID': info.uuid,
      'X-Device-Platform': info.platform,
      'X-App-Version': info.appVersion || '1.0.0',
    };
  }

  /**
   * Log de información del dispositivo para debugging
   */
  async debugInfo(): Promise<void> {
    const info = await this.getInfo();
    console.group('[Device] Debug Info');
    console.log('UUID:', info.uuid);
    console.log('Platform:', info.platform);
    console.log('Is Native:', info.isNative);
    console.log('Manufacturer:', info.manufacturer);
    console.log('Model:', info.model);
    console.log('OS Version:', info.osVersion);
    console.log('App Version:', info.appVersion);
    console.groupEnd();
  }
}

/** Singleton — una sola instancia para toda la app */
export const device = new DeviceService();
