import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourtSchedules,
  getCourtScheduleById,
  getPublicCourtSchedules,
  createCourtSchedule,
  updateCourtSchedule,
  deleteCourtSchedule,
} from "../services/court-schedules.service";
import type { CourtScheduleInput } from "../interfaces";

// ─────────────────────────────────────────────
// Query Keys centralizados
// ─────────────────────────────────────────────
const SCHEDULES_KEY = ["courtSchedules"] as const;
const PUBLIC_SCHEDULES_KEY = ["courtSchedules", "public"] as const;

// ─────────────────────────────────────────────
// Queries (lectura)
// ─────────────────────────────────────────────

/**
 * Lista todos los horarios (requiere auth)
 */
export function useCourtSchedules() {
  return useQuery({
    queryKey: SCHEDULES_KEY,
    queryFn: getCourtSchedules,
    staleTime: 1000 * 60 * 2, // 2 min (horarios cambian poco)
    gcTime: 1000 * 60 * 10, // Mantener en cache 10 min
  });
}

/**
 * Obtiene un horario por ID (requiere auth)
 */
export function useCourtSchedule(id: number) {
  return useQuery({
    queryKey: [...SCHEDULES_KEY, id],
    queryFn: () => getCourtScheduleById(id),
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Lista horarios activos (sin auth, público)
 * @param courtId - Opcional: filtrar por cancha específica
 *
 * Ideal para mostrar disponibilidad de una cancha sin login
 */
export function usePublicCourtSchedules(courtId?: number) {
  return useQuery({
    queryKey: courtId
      ? [...PUBLIC_SCHEDULES_KEY, courtId]
      : PUBLIC_SCHEDULES_KEY,
    queryFn: () => getPublicCourtSchedules(courtId),
    staleTime: 1000 * 60 * 3, // 3 min (datos públicos, estable)
    gcTime: 1000 * 60 * 10,
  });
}

// ─────────────────────────────────────────────
// Mutations (escritura)
// ─────────────────────────────────────────────

/**
 * Crear un nuevo horario
 * Invalida automáticamente la lista de horarios al completar
 */
export function useCreateCourtSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CourtScheduleInput) => createCourtSchedule(data),
    onSuccess: () => {
      // Invalidar queries para refrescar listas
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_SCHEDULES_KEY });
    },
  });
}

/**
 * Actualizar un horario existente
 * Invalida la lista y el detalle del horario modificado
 */
export function useUpdateCourtSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CourtScheduleInput>;
    }) => updateCourtSchedule(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_SCHEDULES_KEY });
      queryClient.invalidateQueries({
        queryKey: [...SCHEDULES_KEY, variables.id],
      });
    },
  });
}

/**
 * Desactivar un horario (soft delete)
 * Invalida la lista de horarios al completar
 */
export function useDeleteCourtSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCourtSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_SCHEDULES_KEY });
    },
  });
}
