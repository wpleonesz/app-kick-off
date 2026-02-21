import React, { useEffect, useState, useRef, useCallback } from "react";
import { IonButton, IonIcon, IonSpinner, IonText, IonNote } from "@ionic/react";
import { locateOutline, locationOutline } from "ionicons/icons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix iconos Leaflet — CDN URLs para compatibilidad con WebViews nativos (Capacitor)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface LocationMapPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  loading: boolean;
  error: string | null;
  onDetectLocation: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  /** Indica si el contenedor padre (modal) ya es visible. El mapa no se renderiza hasta que sea true. */
  visible?: boolean;
  label?: string;
}

/**
 * Componente que muestra un botón para detectar ubicación GPS
 * y un mapa interactivo con la posición actual.
 * Usa Leaflet puro (sin react-leaflet) para máxima compatibilidad
 * con WebViews nativos de Capacitor (iOS/Android).
 */
export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  loading,
  error,
  onDetectLocation,
  onMapClick,
  visible = true,
  label = "Ubicación GPS",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Diferir render del mapa hasta que el modal esté visible
  useEffect(() => {
    if (!visible) {
      setShowMap(false);
      return;
    }
    const timer = setTimeout(() => setShowMap(true), 500);
    return () => clearTimeout(timer);
  }, [visible]);

  const hasCoords =
    latitude != null &&
    longitude != null &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  const displayLat = hasCoords ? latitude! : -0.1807;
  const displayLng = hasCoords ? longitude! : -78.4678;

  // Inicializar mapa Leaflet de forma imperativa
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;

    // Si ya existe una instancia, destruirla primero
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (_) {
        /* ignore */
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [displayLat, displayLng],
        zoom: hasCoords ? 15 : 12,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      // Marcador si hay coordenadas
      if (hasCoords) {
        const marker = L.marker([displayLat, displayLng]).addTo(map);
        marker.bindPopup(
          `📍 Ubicación seleccionada<br/>${displayLat.toFixed(6)}, ${displayLng.toFixed(6)}`,
        );
        markerRef.current = marker;
      }

      // Click en mapa para seleccionar ubicación
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      mapInstanceRef.current = map;

      // Forzar recalcular dimensiones después de que el DOM se estabilice
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (_) {
          /* ignore */
        }
      }, 200);
    } catch (err) {
      console.warn("[LocationMapPicker] Failed to init map:", err);
      setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {
          /* ignore */
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // Solo re-inicializar cuando showMap cambia (no en cada coord change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  // Actualizar marcador y vista cuando cambian las coordenadas (sin re-crear el mapa)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !showMap) return;

    try {
      if (hasCoords) {
        // Mover o crear marcador
        if (markerRef.current) {
          markerRef.current.setLatLng([displayLat, displayLng]);
          markerRef.current.setPopupContent(
            `📍 Ubicación seleccionada<br/>${displayLat.toFixed(6)}, ${displayLng.toFixed(6)}`,
          );
        } else {
          const marker = L.marker([displayLat, displayLng]).addTo(map);
          marker.bindPopup(
            `📍 Ubicación seleccionada<br/>${displayLat.toFixed(6)}, ${displayLng.toFixed(6)}`,
          );
          markerRef.current = marker;
        }
        map.setView([displayLat, displayLng], 15, { animate: true });
      } else {
        // Sin coordenadas: quitar marcador si existía
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
      }
    } catch (err) {
      console.warn("[LocationMapPicker] Error updating marker:", err);
    }
  }, [displayLat, displayLng, hasCoords, showMap]);

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Label + Botón detectar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600 }}>
          <IonIcon
            icon={locationOutline}
            style={{ verticalAlign: "middle", marginRight: "4px" }}
          />
          {label}
        </span>
        <IonButton
          size="small"
          fill="outline"
          onClick={onDetectLocation}
          disabled={loading}
        >
          {loading ? (
            <IonSpinner
              name="crescent"
              style={{ width: "16px", height: "16px" }}
            />
          ) : (
            <>
              <IonIcon icon={locateOutline} slot="start" />
              Detectar
            </>
          )}
        </IonButton>
      </div>

      {/* Error */}
      {error && (
        <IonNote
          color="danger"
          style={{
            fontSize: "12px",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {error}
        </IonNote>
      )}

      {/* Coordenadas detectadas */}
      {hasCoords && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "8px",
            fontSize: "13px",
          }}
        >
          <IonText color="medium">
            <strong>Lat:</strong> {latitude!.toFixed(6)}
          </IonText>
          <IonText color="medium">
            <strong>Lng:</strong> {longitude!.toFixed(6)}
          </IonText>
        </div>
      )}

      {/* Mapa */}
      <div
        style={{
          width: "100%",
          height: "220px",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--ion-border-color, #e0e0e0)",
        }}
      >
        {mapError ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              backgroundColor: "#f5f5f5",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <IonIcon
              icon={locationOutline}
              style={{ fontSize: "32px", color: "#999", marginBottom: "8px" }}
            />
            <IonText color="medium" style={{ fontSize: "13px" }}>
              Mapa no disponible
            </IonText>
            <IonNote style={{ fontSize: "11px", marginTop: "4px" }}>
              Las coordenadas GPS siguen funcionando
            </IonNote>
          </div>
        ) : showMap ? (
          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f5f5f5",
            }}
          >
            <IonSpinner name="dots" />
          </div>
        )}
      </div>

      {/* Hint */}
      <IonNote
        style={{ fontSize: "11px", display: "block", marginTop: "4px" }}
        color="medium"
      >
        Toca "Detectar" para usar GPS o pulsa en el mapa para elegir ubicación
      </IonNote>
    </div>
  );
};
