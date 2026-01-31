import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import api from "../lib/api";
import { API_BASE } from "../config";

// Tipos
export interface User {
  id?: number;
  username: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  mobile?: string;
  avatar?: string;
  role?: string;
}

// Función para hacer fetch con autenticación
async function fetchWithAuth<T>(endpoint: string): Promise<T> {
  // Usar el servicio centralizado `api` que encapsula Capacitor HTTP
  return api.get<T>(endpoint);
}

// Función para actualizar datos con autenticación
async function updateWithAuth<T>(
  endpoint: string,
  data: Partial<T>,
): Promise<T> {
  return api.put<T>(endpoint, data);
}

/**
 * Hook para obtener el perfil del usuario con actualización automática
 * - Se actualiza cada 30 segundos en segundo plano
 * - Se actualiza cuando la app vuelve al primer plano
 * - Se actualiza cuando hay conexión a internet de nuevo
 */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchWithAuth<User>("/api/auth/user"),
    staleTime: 1000 * 30, // Datos considerados frescos por 30 segundos
    refetchInterval: 1000 * 30, // Refetch cada 30 segundos
    refetchOnWindowFocus: true, // Refetch cuando la app vuelve al frente
    refetchOnReconnect: true, // Refetch cuando hay internet de nuevo
    retry: 3, // Reintentar 3 veces si falla
  });
}

/**
 * Hook para actualizar el perfil
 * - Actualiza el caché inmediatamente (optimistic update)
 * - Si falla, revierte al estado anterior
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) =>
      updateWithAuth<User>("/api/auth/user", data),

    // Antes de la mutación: guardar estado anterior y actualizar optimistamente
    onMutate: async (newData) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      // Guardar estado anterior
      const previousProfile = queryClient.getQueryData<User>(["profile"]);

      // Actualizar caché optimistamente (inmediatamente en UI)
      queryClient.setQueryData<User>(
        ["profile"],
        (old) =>
          ({
            ...old,
            ...newData,
          }) as User,
      );

      // Retornar contexto para rollback
      return { previousProfile };
    },

    // Si hay error, revertir al estado anterior
    onError: (_err, _newData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
      }
    },

    // Después de éxito o error, refetch para asegurar sincronización
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

/**
 * Hook genérico para cualquier lista de datos con actualización en tiempo real
 */
export function useRealtimeList<T>(
  key: string,
  endpoint: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: [key],
    queryFn: () => fetchWithAuth<T[]>(endpoint),
    staleTime: 1000 * 10, // 10 segundos
    refetchInterval: options?.refetchInterval ?? 1000 * 15, // 15 segundos por defecto
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para forzar actualización manual de cualquier query
 */
export function useRefreshData() {
  const queryClient = useQueryClient();

  return {
    refreshProfile: () =>
      queryClient.invalidateQueries({ queryKey: ["profile"] }),
    refreshAll: () => queryClient.invalidateQueries(),
    refetchProfile: () => queryClient.refetchQueries({ queryKey: ["profile"] }),
  };
}
