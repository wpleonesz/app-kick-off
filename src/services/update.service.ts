import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface UpdateInfo {
  currentVersion: string;
  latestVersion?: string;
  updateAvailable: boolean;
  bundleId?: string;
}

export interface BundleInfo {
  bundleId: string;
  version: string;
  downloadUrl: string;
}

// URL base del servidor de actualizaciones - configurar según tu backend
const UPDATE_SERVER_URL = import.meta.env.VITE_UPDATE_SERVER_URL || 'https://tu-servidor.com/api/updates';

class UpdateService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Obtiene información de la versión actual de la app
   */
  async getCurrentVersion(): Promise<string> {
    if (!this.isNative) {
      return '1.0.0-web';
    }

    try {
      const info = await App.getInfo();
      return info.version;
    } catch (error) {
      console.error('Error obteniendo versión:', error);
      return '1.0.0';
    }
  }

  /**
   * Verifica si hay actualizaciones disponibles consultando el servidor
   */
  async checkForUpdate(): Promise<UpdateInfo> {
    const currentVersion = await this.getCurrentVersion();

    if (!this.isNative) {
      return {
        currentVersion,
        updateAvailable: false,
      };
    }

    try {
      // Consulta tu servidor para verificar actualizaciones
      const response = await fetch(`${UPDATE_SERVER_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentVersion,
          platform: Capacitor.getPlatform(),
          appId: 'com.example.appkickoff',
        }),
      });

      if (!response.ok) {
        throw new Error('Error en servidor de actualizaciones');
      }

      const data = await response.json();

      return {
        currentVersion,
        latestVersion: data.latestVersion,
        updateAvailable: data.updateAvailable || false,
        bundleId: data.bundleId,
      };
    } catch (error) {
      console.error('Error verificando actualizaciones:', error);
      return {
        currentVersion,
        updateAvailable: false,
      };
    }
  }

  /**
   * Descarga y aplica una actualización usando Live Update
   */
  async downloadAndApplyUpdate(bundleUrl: string, bundleId: string): Promise<boolean> {
    if (!this.isNative) {
      console.log('Actualizaciones no disponibles en web');
      return false;
    }

    try {
      // 1. Descargar el bundle
      console.log('Descargando actualización...', bundleUrl);
      await LiveUpdate.downloadBundle({
        bundleId,
        url: bundleUrl,
      });

      // 2. Establecer como bundle activo
      console.log('Configurando bundle...');
      await LiveUpdate.setNextBundle({
        bundleId,
      });

      // 3. Recargar la app para aplicar
      console.log('Aplicando actualización...');
      await LiveUpdate.reload();

      return true;
    } catch (error) {
      console.error('Error aplicando actualización:', error);
      return false;
    }
  }

  /**
   * Sincroniza automáticamente con el servidor de actualizaciones
   */
  async sync(): Promise<{ updated: boolean; version?: string }> {
    if (!this.isNative) {
      return { updated: false };
    }

    try {
      const updateInfo = await this.checkForUpdate();

      if (updateInfo.updateAvailable && updateInfo.bundleId) {
        // Obtener URL del bundle
        const bundleResponse = await fetch(`${UPDATE_SERVER_URL}/bundle/${updateInfo.bundleId}`);

        if (bundleResponse.ok) {
          const bundleData: BundleInfo = await bundleResponse.json();
          const success = await this.downloadAndApplyUpdate(
            bundleData.downloadUrl,
            bundleData.bundleId
          );

          return {
            updated: success,
            version: bundleData.version,
          };
        }
      }

      return { updated: false };
    } catch (error) {
      console.error('Error en sync:', error);
      return { updated: false };
    }
  }

  /**
   * Obtiene la lista de bundles descargados
   */
  async getDownloadedBundles(): Promise<string[]> {
    if (!this.isNative) {
      return [];
    }

    try {
      const result = await LiveUpdate.getBundles();
      return result.bundleIds || [];
    } catch (error) {
      console.error('Error obteniendo bundles:', error);
      return [];
    }
  }

  /**
   * Elimina un bundle específico
   */
  async deleteBundle(bundleId: string): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await LiveUpdate.deleteBundle({ bundleId });
    } catch (error) {
      console.error('Error eliminando bundle:', error);
    }
  }

  /**
   * Restablece al bundle original (sin actualizaciones)
   */
  async reset(): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await LiveUpdate.reset();
      await LiveUpdate.reload();
    } catch (error) {
      console.error('Error reseteando:', error);
    }
  }

  /**
   * Marca el bundle actual como listo (previene rollback automático)
   */
  async ready(): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await LiveUpdate.ready();
    } catch (error) {
      console.error('Error marcando ready:', error);
    }
  }

  /**
   * Obtiene el bundle actualmente activo
   */
  async getCurrentBundle(): Promise<string | undefined> {
    if (!this.isNative) {
      return undefined;
    }

    try {
      const result = await LiveUpdate.getBundle();
      return result.bundleId ?? undefined;
    } catch (error) {
      console.error('Error obteniendo bundle actual:', error);
      return undefined;
    }
  }
}

export const updateService = new UpdateService();
