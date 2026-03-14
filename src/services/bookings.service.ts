import api from "../lib/api";
import type { Booking, BookingInput } from "../interfaces";

// ─────────────────────────────────────────────
// Endpoints con autenticación (/api/courts/bookings)
// ─────────────────────────────────────────────

/**
 * Lista todas las reservas (activas)
 * GET /api/courts/bookings — requiere auth
 */
export async function getBookings(): Promise<Booking[]> {
  return api.get<Booking[]>("/api/courts/bookings");
}

/**
 * Lista reservas filtradas por cancha (filtrado client-side)
 * GET /api/courts/bookings — requiere auth
 */
export async function getBookingsByCourtId(
  courtId: number,
): Promise<Booking[]> {
  const all = await api.get<Booking[]>("/api/courts/bookings");
  return (all ?? []).filter(
    (b) => b.courtId === courtId && b.active,
  );
}

/**
 * Lista reservas del usuario actual (filtrado client-side)
 * GET /api/courts/bookings — requiere auth
 */
export async function getMyBookings(userId: number): Promise<Booking[]> {
  const all = await api.get<Booking[]>("/api/courts/bookings");
  return (all ?? []).filter(
    (b) => b.userId === userId && b.active,
  );
}

/**
 * Obtiene una reserva por ID
 * GET /api/courts/bookings/{id} — requiere auth
 */
export async function getBookingById(id: number): Promise<Booking> {
  return api.get<Booking>(`/api/courts/bookings/${id}`);
}

/**
 * Crea una nueva reserva
 * POST /api/courts/bookings — requiere auth
 */
export async function createBooking(data: BookingInput): Promise<Booking> {
  return api.post<Booking>("/api/courts/bookings", data);
}

/**
 * Actualiza una reserva existente
 * PUT /api/courts/bookings/{id} — requiere auth
 */
export async function updateBooking(
  id: number,
  data: Partial<BookingInput>,
): Promise<Booking> {
  return api.put<Booking>(`/api/courts/bookings/${id}`, data);
}

/**
 * Cancela una reserva (soft delete: active=false, status=cancelled)
 * DELETE /api/courts/bookings/{id} — requiere auth
 */
export async function cancelBooking(id: number): Promise<Booking> {
  return api.delete<Booking>(`/api/courts/bookings/${id}`);
}
