import { useState, useCallback } from "react";
import { Geolocation, type Position } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para obtener la ubicación GPS del dispositivo.
 * Usa el plugin nativo de Capacitor en iOS/Android
 * y la Web Geolocation API como fallback.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
  });

  const getCurrentPosition = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // En plataformas nativas, solicitar permisos primero
      if (Capacitor.isNativePlatform()) {
        const permStatus = await Geolocation.checkPermissions();

        if (permStatus.location === "denied") {
          const reqResult = await Geolocation.requestPermissions();
          if (reqResult.location === "denied") {
            setState((prev) => ({
              ...prev,
              loading: false,
              error:
                "Permiso de ubicación denegado. Actívalo en la configuración del dispositivo.",
            }));
            return null;
          }
        }
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      const result = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setState({
        ...result,
        loading: false,
        error: null,
      });

      return result;
    } catch (err: any) {
      const errorMessage =
        err?.message || "No se pudo obtener la ubicación. Intenta de nuevo.";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const clearPosition = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    getCurrentPosition,
    clearPosition,
  };
}
