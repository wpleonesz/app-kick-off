/**
 * Interfaz para datos de horario de cancha
 * Refleja la estructura del endpoint /api/courts/schedules del backend
 */

export interface CourtSchedule {
  id: number;
  courtId: number; // ID de la cancha asociada
  Court?: {
    // Información de la cancha (opcional, incluida en queries)
    id: number;
    name: string;
    location: string;
  };
  dayOfWeek: number; // 1=Lunes, 2=Martes, ..., 7=Domingo
  duration: number; // Duración en minutos (ej: 60, 90, 120)
  startTime: string; // Formato "HH:MM" (ej: "08:00")
  endTime: string; // Formato "HH:MM" (ej: "10:00")
  active: boolean; // true = disponible, false = desactivado
  createdAt: string; // Timestamp ISO de creación
  updatedAt: string; // Timestamp ISO de última modificación
}

/**
 * Datos para crear o actualizar un horario
 * Omitimos campos auto-generados (id, createdAt, updatedAt, Court)
 */
export interface CourtScheduleInput {
  courtId: number; // ID de la cancha (obligatorio)
  dayOfWeek: number; // Día de la semana 1-7 (obligatorio)
  duration?: number; // Opcional: por defecto 60 minutos
  startTime: string; // Hora de inicio "HH:MM" (obligatorio)
  endTime: string; // Hora de fin "HH:MM" (obligatorio)
  active?: boolean; // Opcional: por defecto true
}

/**
 * Helper: Mapeo de días de la semana
 */
export const DAYS_OF_WEEK = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
} as const;

/**
 * Helper: Obtener nombre del día
 */
export function getDayName(dayOfWeek: number): string {
  return DAYS_OF_WEEK[dayOfWeek as keyof typeof DAYS_OF_WEEK] || "Desconocido";
}
