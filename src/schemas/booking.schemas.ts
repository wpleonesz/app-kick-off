import { z } from "zod";

export const bookingSchema = z.object({
  courtId: z
    .number()
    .int("ID de cancha debe ser un número entero")
    .positive("Debes seleccionar una cancha"),

  scheduleId: z
    .number()
    .int("ID de horario debe ser un número entero")
    .positive("Debes seleccionar un horario"),

  userId: z
    .number()
    .int("ID de usuario debe ser un número entero")
    .positive("Usuario requerido"),

  date: z
    .string()
    .min(1, "La fecha de reserva es obligatoria"),

  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),

  requiresReferee: z.boolean().default(false),

  refereeId: z.number().int().positive().nullable().optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
