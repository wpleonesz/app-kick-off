import api from "../lib/api";
import type { Court, CourtInput } from "../interfaces";

// ─────────────────────────────────────────────
// Endpoints con autenticación (/api/courts)
// ─────────────────────────────────────────────

/**
 * Lista todas las canchas (activas e inactivas)
 * GET /api/courts — requiere auth
 */
export async function getCourts(): Promise<Court[]> {
  return api.get<Court[]>("/api/courts");
  // requiresAuth = true por defecto
}

/**
 * Obtiene una cancha por ID
 * GET /api/courts/{id} — requiere auth
 */
export async function getCourtById(id: number): Promise<Court> {
  return api.get<Court>(`/api/courts/${id}`);
}

/**
 * Crea una nueva cancha
 * POST /api/courts — requiere auth
 */
export async function createCourt(data: CourtInput): Promise<Court> {
  return api.post<Court>("/api/courts", data);
}

/**
 * Actualiza una cancha existente
 * PUT /api/courts/{id} — requiere auth
 */
export async function updateCourt(
  id: number,
  data: Partial<CourtInput>,
): Promise<Court> {
  return api.put<Court>(`/api/courts/${id}`, data);
}

/**
 * Desactiva una cancha (soft delete)
 * DELETE /api/courts/{id} — requiere auth
 */
export async function deleteCourt(id: number): Promise<void> {
  return api.delete<void>(`/api/courts/${id}`);
}

// ─────────────────────────────────────────────
// Endpoint público (/api/public/courts)
// ─────────────────────────────────────────────

/**
 * Lista canchas activas (sin autenticación)
 * GET /api/public/courts — público, para la app móvil
 *
 * Este endpoint es ideal para:
 * - Mostrar mapa de canchas disponibles sin login
 * - Landing page o pantalla de inicio de la app
 * - Permitir exploración antes de registrarse
 * - Solo devuelve canchas con active=true
 */
export async function getPublicCourts(): Promise<Court[]> {
  return api.get<Court[]>("/api/public/courts", false);
  // false = no requiere autenticación
}
