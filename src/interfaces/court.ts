/**
 * Interfaz para datos de cancha
 * Refleja la estructura del endpoint /api/courts del backend
 */

export interface Court {
  id: number;
  name: string;
  location: string; // Dirección textual (ej: "Av. Principal 123, Quito")
  latitude?: number; // Coordenada GPS - Latitud (ej: -0.180653)
  longitude?: number; // Coordenada GPS - Longitud (ej: -78.467834)
  userId: number; // ID del dueño/administrador de la cancha
  User?: {
    // Información del usuario propietario (opcional)
    id: number;
    username: string;
    email: string;
  };
  isIndoor: boolean; // true = cancha techada, false = cancha al aire libre
  active: boolean; // true = cancha disponible, false = desactivada
  createdAt: string; // Timestamp ISO de creación
  updatedAt: string; // Timestamp ISO de última modificación
}

/**
 * Datos para crear o actualizar una cancha
 * Omitimos campos auto-generados (id, createdAt, updatedAt, User)
 */
export interface CourtInput {
  name: string; // Nombre de la cancha (obligatorio)
  location: string; // Dirección textual (obligatorio)
  latitude?: number; // Opcional: GPS latitud (recomendado para mapa)
  longitude?: number; // Opcional: GPS longitud (recomendado para mapa)
  userId: number; // ID del propietario (obligatorio)
  isIndoor?: boolean; // Opcional: por defecto false
  active?: boolean; // Opcional: por defecto true
}
