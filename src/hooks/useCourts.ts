import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourts,
  getCourtById,
  getPublicCourts,
  createCourt,
  updateCourt,
  deleteCourt,
} from "../services/courts.service";
import type { CourtInput } from "../interfaces";

// ─────────────────────────────────────────────
// Query Keys centralizados
// ─────────────────────────────────────────────
const COURTS_KEY = ["courts"] as const;
const PUBLIC_COURTS_KEY = ["courts", "public"] as const;

// ─────────────────────────────────────────────
// Queries (lectura)
// ─────────────────────────────────────────────

/**
 * Lista todas las canchas (requiere auth)
 * Similar a useRoles() pero para canchas
 */
export function useCourts() {
  return useQuery({
    queryKey: COURTS_KEY,
    queryFn: getCourts,
    staleTime: 1000 * 60 * 2, // 2 min (las canchas cambian poco)
    gcTime: 1000 * 60 * 10, // Mantener en cache 10 min
  });
}

/**
 * Obtiene una cancha por ID (requiere auth)
 */
export function useCourt(id: number) {
  return useQuery({
    queryKey: [...COURTS_KEY, id],
    queryFn: () => getCourtById(id),
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Lista canchas activas (sin auth, público)
 * Ideal para mostrar canchas disponibles al usuario sin login
 */
export function usePublicCourts() {
  return useQuery({
    queryKey: PUBLIC_COURTS_KEY,
    queryFn: getPublicCourts,
    staleTime: 1000 * 60 * 5, // 5 min (datos públicos, más estable)
    gcTime: 1000 * 60 * 10,
  });
}

// ─────────────────────────────────────────────
// Mutations (escritura)
// ─────────────────────────────────────────────

/**
 * Crear una nueva cancha
 * Invalida automáticamente la lista de canchas al completar
 */
export function useCreateCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CourtInput) => createCourt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURTS_KEY });
    },
    onError: (error) => {
      console.error("[useCreateCourt] Error:", error);
      console.error("[useCreateCourt] Error type:", typeof error);
      console.error(
        "[useCreateCourt] Error JSON:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    },
  });
}

/**
 * Actualizar una cancha existente
 * Invalida la lista y el detalle de la cancha modificada
 */
export function useUpdateCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CourtInput> }) =>
      updateCourt(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: COURTS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...COURTS_KEY, variables.id],
      });
    },
    onError: (error) => {
      console.error("[useUpdateCourt] Error:", error);
      console.error(
        "[useUpdateCourt] Error JSON:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    },
  });
}

/**
 * Desactivar una cancha (soft delete)
 * Invalida la lista de canchas al completar
 */
export function useDeleteCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCourt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURTS_KEY });
    },
  });
}
