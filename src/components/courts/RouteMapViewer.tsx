import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonNote,
  IonChip,
  IonLabel,
} from "@ionic/react";
import {
  navigateOutline,
  locateOutline,
  walkOutline,
  carOutline,
  locationOutline,
} from "ionicons/icons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix iconos Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Íconos personalizados
const userIcon = L.divIcon({
  html: '<div style="background:#1877f2;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.3)"></div>',
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const courtIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export interface RouteMapViewerProps {
  courtLat: number;
  courtLng: number;
  courtName: string;
  userLat: number | null;
  userLng: number | null;
  userLoading: boolean;
  userError: string | null;
  onDetectLocation: () => void;
  visible?: boolean;
}

interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
}

/**
 * Componente que muestra un mapa con la ubicación del usuario y la cancha,
 * calcula la distancia y traza la ruta usando OSRM (gratuito, sin API key).
 */
export const RouteMapViewer: React.FC<RouteMapViewerProps> = ({
  courtLat,
  courtLng,
  courtName,
  userLat,
  userLng,
  userLoading,
  userError,
  onDetectLocation,
  visible = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const courtMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const hasUserCoords =
    userLat != null && userLng != null && !isNaN(userLat) && !isNaN(userLng);

  // Diferir render del mapa hasta que el contenedor sea visible
  useEffect(() => {
    if (!visible) {
      setShowMap(false);
      return;
    }
    const timer = setTimeout(() => setShowMap(true), 400);
    return () => clearTimeout(timer);
  }, [visible]);

  // Distancia en línea recta (Haversine) para mostrar rápido
  const straightDistance = useCallback(() => {
    if (!hasUserCoords) return null;
    const R = 6371;
    const dLat = ((courtLat - userLat!) * Math.PI) / 180;
    const dLng = ((courtLng - userLng!) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLat! * Math.PI) / 180) *
        Math.cos((courtLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, [hasUserCoords, userLat, userLng, courtLat, courtLng]);

  // Obtener ruta de OSRM
  const fetchRoute = useCallback(async () => {
    if (!hasUserCoords) return;

    setRouteLoading(true);
    setRouteError(null);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${courtLng},${courtLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.length) {
        setRouteError("No se pudo calcular la ruta");
        setRouteLoading(false);
        return;
      }

      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]], // GeoJSON es [lng, lat], Leaflet es [lat, lng]
      );

      setRouteInfo({
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        geometry: coords,
      });
    } catch {
      setRouteError("Error al obtener la ruta");
    } finally {
      setRouteLoading(false);
    }
  }, [hasUserCoords, userLat, userLng, courtLat, courtLng]);

  // Fetch route cuando se obtiene la ubicación del usuario
  useEffect(() => {
    if (hasUserCoords) {
      fetchRoute();
    } else {
      setRouteInfo(null);
    }
  }, [hasUserCoords, fetchRoute]);

  // Inicializar mapa
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        /* ignore */
      }
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
      courtMarkerRef.current = null;
      routeLayerRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [courtLat, courtLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      // Marcador de la cancha
      const cm = L.marker([courtLat, courtLng], { icon: courtIcon }).addTo(map);
      cm.bindPopup(`<strong>${courtName}</strong>`);
      courtMarkerRef.current = cm;

      mapInstanceRef.current = map;

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          /* ignore */
        }
      }, 200);
    } catch {
      setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          /* ignore */
        }
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        courtMarkerRef.current = null;
        routeLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  // Actualizar marcador de usuario + ruta
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !showMap) return;

    try {
      // Marcador del usuario
      if (hasUserCoords) {
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([userLat!, userLng!]);
        } else {
          const um = L.marker([userLat!, userLng!], { icon: userIcon }).addTo(
            map,
          );
          um.bindPopup("Tu ubicación");
          userMarkerRef.current = um;
        }
      } else if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      // Ruta
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }

      if (routeInfo && routeInfo.geometry.length > 0) {
        const polyline = L.polyline(routeInfo.geometry, {
          color: "#1877f2",
          weight: 5,
          opacity: 0.8,
          lineJoin: "round",
        }).addTo(map);
        routeLayerRef.current = polyline;

        // Ajustar vista para ver ambos puntos + ruta
        const bounds = polyline.getBounds();
        map.fitBounds(bounds, { padding: [40, 40], animate: true });
      } else if (hasUserCoords) {
        // Sin ruta pero con ubicación: ajustar a ambos puntos
        const bounds = L.latLngBounds(
          [userLat!, userLng!],
          [courtLat, courtLng],
        );
        map.fitBounds(bounds, { padding: [40, 40], animate: true });
      }
    } catch (err) {
      console.warn("[RouteMapViewer] Error updating map:", err);
    }
  }, [
    hasUserCoords,
    userLat,
    userLng,
    courtLat,
    courtLng,
    routeInfo,
    showMap,
  ]);

  const dist = straightDistance();

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Header con botón detectar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 600 }}>
          <IonIcon
            icon={navigateOutline}
            style={{ verticalAlign: "middle", marginRight: "4px" }}
          />
          Ruta a la cancha
        </span>
        <IonButton
          size="small"
          fill="outline"
          onClick={onDetectLocation}
          disabled={userLoading}
        >
          {userLoading ? (
            <IonSpinner
              name="crescent"
              style={{ width: "16px", height: "16px" }}
            />
          ) : (
            <>
              <IonIcon icon={locateOutline} slot="start" />
              {hasUserCoords ? "Actualizar" : "Mi ubicación"}
            </>
          )}
        </IonButton>
      </div>

      {/* Error de geolocalización */}
      {userError && (
        <IonNote
          color="danger"
          style={{ fontSize: "12px", display: "block", marginBottom: "8px" }}
        >
          {userError}
        </IonNote>
      )}

      {/* Info de distancia y duración */}
      {hasUserCoords && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          {routeLoading ? (
            <IonChip style={{ height: "28px", margin: 0 }}>
              <IonSpinner
                name="dots"
                style={{ width: "16px", height: "16px" }}
              />
              <IonLabel style={{ fontSize: "12px", marginLeft: "4px" }}>
                Calculando ruta...
              </IonLabel>
            </IonChip>
          ) : routeInfo ? (
            <>
              <IonChip
                color="primary"
                style={{ height: "28px", margin: 0 }}
              >
                <IonIcon icon={carOutline} />
                <IonLabel style={{ fontSize: "12px" }}>
                  {routeInfo.distanceKm < 1
                    ? `${Math.round(routeInfo.distanceKm * 1000)} m`
                    : `${routeInfo.distanceKm.toFixed(1)} km`}
                </IonLabel>
              </IonChip>
              <IonChip
                color="tertiary"
                style={{ height: "28px", margin: 0 }}
              >
                <IonIcon icon={walkOutline} />
                <IonLabel style={{ fontSize: "12px" }}>
                  {routeInfo.durationMin < 1
                    ? "< 1 min"
                    : routeInfo.durationMin < 60
                      ? `~${Math.round(routeInfo.durationMin)} min`
                      : `~${Math.floor(routeInfo.durationMin / 60)}h ${Math.round(routeInfo.durationMin % 60)}min`}
                </IonLabel>
              </IonChip>
              {dist != null && (
                <IonChip style={{ height: "28px", margin: 0 }}>
                  <IonIcon icon={locationOutline} />
                  <IonLabel style={{ fontSize: "12px" }}>
                    {dist < 1
                      ? `${Math.round(dist * 1000)} m directo`
                      : `${dist.toFixed(1)} km directo`}
                  </IonLabel>
                </IonChip>
              )}
            </>
          ) : routeError ? (
            <>
              <IonNote
                color="warning"
                style={{ fontSize: "12px" }}
              >
                {routeError}
              </IonNote>
              {dist != null && (
                <IonChip
                  color="primary"
                  style={{ height: "28px", margin: 0 }}
                >
                  <IonIcon icon={locationOutline} />
                  <IonLabel style={{ fontSize: "12px" }}>
                    {dist < 1
                      ? `${Math.round(dist * 1000)} m (línea recta)`
                      : `${dist.toFixed(1)} km (línea recta)`}
                  </IonLabel>
                </IonChip>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Mapa */}
      <div
        style={{
          width: "100%",
          height: "260px",
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
      {!hasUserCoords && (
        <IonNote
          style={{ fontSize: "11px", display: "block", marginTop: "4px" }}
          color="medium"
        >
          Toca "Mi ubicación" para ver la distancia y ruta hacia la cancha
        </IonNote>
      )}
    </div>
  );
};
