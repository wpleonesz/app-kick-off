// Configuración de API - se determina automáticamente según plataforma.
// Puedes sobreescribir mediante las variables de entorno:
// - VITE_API_URL (valor por defecto para web)
// - VITE_API_URL_IOS (valor para iOS nativo)
// - VITE_API_URL_ANDROID (valor para Android nativo)
// Nota: en un dispositivo Android/emulador el host local suele ser 10.0.2.2
// para el emulator de Android Studio. En iOS simulator puede usarse localhost.

import { Capacitor } from "@capacitor/core";

// @ts-ignore - Vite env variables are available at runtime
const DEFAULT_WEB = import.meta.env.VITE_API_URL || "http://localhost:3000";
// @ts-ignore
const OVERRIDE_IOS = import.meta.env.VITE_API_URL_IOS;
// @ts-ignore
const OVERRIDE_ANDROID = import.meta.env.VITE_API_URL_ANDROID;

function resolveApiBase(): string {
  try {
    // Si estamos en ejecución nativa (iOS/Android), usar rutas apropiadas
    if (
      Capacitor &&
      Capacitor.isNativePlatform &&
      Capacitor.isNativePlatform()
    ) {
      const platform = Capacitor.getPlatform();
      if (platform === "android") {
        return OVERRIDE_ANDROID || "http://localhost:3000";
      }
      if (platform === "ios") {
        return OVERRIDE_IOS || "http://localhost:3000";
      }
    }
  } catch (e) {
    // Ignorar y usar valor por defecto
    console.debug("resolveApiBase: unable to detect Capacitor platform", e);
  }

  // Por defecto, usar URL de entorno o localhost para web
  return DEFAULT_WEB;
}

export const API_BASE = resolveApiBase();

// Si true, ante fallo de red usa mock local para desarrollo sin backend
export const USE_MOCK_FALLBACK = false;
