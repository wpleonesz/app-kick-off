import { z } from "zod";

// Regex para validar formato de hora HH:MM (24 horas)
const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

export const courtScheduleSchema = z
  .object({
    courtId: z
      .number()
      .int("ID de cancha debe ser un número entero")
      .positive("ID de cancha debe ser positivo"),

    dayOfWeek: z
      .number()
      .int("Día de la semana debe ser un número entero")
      .min(1, "El día debe estar entre 1 (Lunes) y 7 (Domingo)")
      .max(7, "El día debe estar entre 1 (Lunes) y 7 (Domingo)"),

    startTime: z
      .string()
      .regex(
        timeRegex,
        'La hora de inicio debe estar en formato HH:MM (ej: "08:00", "14:30")',
      ),

    endTime: z
      .string()
      .regex(
        timeRegex,
        'La hora de fin debe estar en formato HH:MM (ej: "10:00", "16:30")',
      ),

    duration: z
      .number()
      .int("La duración debe ser un número entero")
      .min(15, "La duración mínima es 15 minutos")
      .max(480, "La duración máxima es 480 minutos (8 horas)")
      .optional()
      .default(60),

    active: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // Validar que endTime > startTime
      const [startHour, startMin] = data.startTime.split(":").map(Number);
      const [endHour, endMin] = data.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    },
    {
      message: "La hora de fin debe ser mayor que la hora de inicio",
      path: ["endTime"],
    },
  );

export type CourtScheduleFormData = z.infer<typeof courtScheduleSchema>;
