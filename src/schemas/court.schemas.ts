import { z } from "zod";

export const courtSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  location: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(200, "La dirección no puede superar 200 caracteres"),
  latitude: z
    .number()
    .min(-90, "Latitud debe estar entre -90 y 90")
    .max(90, "Latitud debe estar entre -90 y 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitud debe estar entre -180 y 180")
    .max(180, "Longitud debe estar entre -180 y 180")
    .optional(),
  userId: z.number().int().positive("ID de usuario debe ser positivo"),
  isIndoor: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

export type CourtFormData = z.infer<typeof courtSchema>;
