import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBookings,
  getBookingsByCourtId,
  getMyBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
} from "../services/bookings.service";
import type { BookingInput } from "../interfaces";

// ─────────────────────────────────────────────
// Query Keys centralizados
// ─────────────────────────────────────────────
const BOOKINGS_KEY = ["bookings"] as const;
const MY_BOOKINGS_KEY = ["bookings", "mine"] as const;

// ─────────────────────────────────────────────
// Queries (lectura)
// ─────────────────────────────────────────────

/**
 * Lista todas las reservas (requiere auth)
 */
export function useBookings() {
  return useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: getBookings,
    staleTime: 1000 * 60 * 1, // 1 min (reservas cambian frecuentemente)
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Reservas filtradas por cancha
 */
export function useBookingsByCourtId(courtId?: number) {
  return useQuery({
    queryKey: [...BOOKINGS_KEY, "court", courtId],
    queryFn: () => getBookingsByCourtId(courtId!),
    enabled: !!courtId,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Reservas del usuario actual
 */
export function useMyBookings(userId?: number) {
  return useQuery({
    queryKey: MY_BOOKINGS_KEY,
    queryFn: () => getMyBookings(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Obtiene una reserva por ID
 */
export function useBooking(id: number) {
  return useQuery({
    queryKey: [...BOOKINGS_KEY, id],
    queryFn: () => getBookingById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });
}

// ─────────────────────────────────────────────
// Mutations (escritura)
// ─────────────────────────────────────────────

/**
 * Crear una nueva reserva
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookingInput) => createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
    },
  });
}

/**
 * Actualizar una reserva existente
 */
export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<BookingInput>;
    }) => updateBooking(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...BOOKINGS_KEY, variables.id],
      });
    },
  });
}

/**
 * Cancelar una reserva (soft delete)
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
    },
  });
}
