/**
 * Interfaz para datos de reserva de cancha
 * Refleja la estructura del endpoint /api/courts/bookings del backend
 */

export interface Booking {
  id: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  date: string; // ISO date (normalizada a UTC 00:00:00)
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  requiresReferee: boolean;
  courtId: number;
  court?: {
    id: number;
    name: string;
    location: string;
  };
  scheduleId: number;
  schedule?: {
    id: number;
    dayOfWeek: number;
    duration: number;
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
  };
  userId: number;
  user?: {
    id: number;
    username: string;
    email: string;
    name?: string;
  };
  refereeId?: number | null;
  referee?: {
    id: number;
    username: string;
    email: string;
    name?: string;
  } | null;
}

/**
 * Datos para crear o actualizar una reserva
 */
export interface BookingInput {
  courtId: number;
  scheduleId: number;
  userId: number;
  date: string; // ISO date
  status?: "pending" | "confirmed" | "cancelled";
  active?: boolean;
  notes?: string;
  requiresReferee?: boolean;
  refereeId?: number | null;
}

/**
 * Helper: Mapeo de estados de reserva
 */
export const BOOKING_STATUS = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
} as const;

/**
 * Helper: Color del chip según estado
 */
export function getBookingStatusColor(
  status: string,
): "warning" | "success" | "danger" {
  switch (status) {
    case "confirmed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "warning";
  }
}
