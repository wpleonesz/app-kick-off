import api from "../lib/api";
import type { CourtSchedule, CourtScheduleInput } from "../interfaces";

// ─────────────────────────────────────────────
// Endpoints con autenticación (/api/courts/schedules)
// ─────────────────────────────────────────────

/**
 * Lista todos los horarios (activos e inactivos)
 * GET /api/courts/schedules — requiere auth
 */
export async function getCourtSchedules(): Promise<CourtSchedule[]> {
  return api.get<CourtSchedule[]>("/api/courts/schedules");
  // requiresAuth = true por defecto
}

/**
 * Obtiene un horario por ID
 * GET /api/courts/schedules/{id} — requiere auth
 */
export async function getCourtScheduleById(id: number): Promise<CourtSchedule> {
  return api.get<CourtSchedule>(`/api/courts/schedules/${id}`);
}

/**
 * Crea un nuevo horario
 * POST /api/courts/schedules — requiere auth
 */
export async function createCourtSchedule(
  data: CourtScheduleInput,
): Promise<CourtSchedule> {
  return api.post<CourtSchedule>("/api/courts/schedules", data);
}

/**
 * Actualiza un horario existente
 * PUT /api/courts/schedules/{id} — requiere auth
 */
export async function updateCourtSchedule(
  id: number,
  data: Partial<CourtScheduleInput>,
): Promise<CourtSchedule> {
  return api.put<CourtSchedule>(`/api/courts/schedules/${id}`, data);
}

/**
 * Desactiva un horario (soft delete)
 * DELETE /api/courts/schedules/{id} — requiere auth
 */
export async function deleteCourtSchedule(id: number): Promise<void> {
  return api.delete<void>(`/api/courts/schedules/${id}`);
}

// ─────────────────────────────────────────────
// Endpoint público (/api/public/court-schedules)
// ─────────────────────────────────────────────

/**
 * Lista horarios activos (sin autenticación)
 * GET /api/public/court-schedules?courtId={id} — público
 *
 * @param courtId - Opcional: filtrar horarios de una cancha específica
 *
 * Casos de uso:
 * - Mostrar disponibilidad de canchas sin login
 * - Calendario de horarios disponibles para reserva
 * - Filtrar horarios por cancha específica
 */
export async function getPublicCourtSchedules(
  courtId?: number,
): Promise<CourtSchedule[]> {
  const url = courtId
    ? `/api/public/court-schedules?courtId=${courtId}`
    : `/api/public/court-schedules`;

  return api.get<CourtSchedule[]>(url, false);
  // false = no requiere autenticación
}
