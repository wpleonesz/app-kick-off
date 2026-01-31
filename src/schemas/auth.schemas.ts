import { z } from 'zod';

// ===== LOGIN SCHEMA =====
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'El usuario es obligatorio')
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ===== REGISTER SCHEMA =====
export const registerSchema = z.object({
  dni: z
    .string()
    .min(1, 'El DNI es obligatorio')
    .regex(/^\d{10}$/, 'El DNI debe tener 10 dígitos'),
  firstName: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es obligatorio')
    .min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Ingresa un email válido'),
  username: z
    .string()
    .min(1, 'El usuario es obligatorio')
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(20, 'El usuario no puede tener más de 20 caracteres'),
  mobile: z
    .string()
    .regex(/^0\d{9}$/, 'El teléfono debe tener 10 dígitos y comenzar con 0')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(50, 'La contraseña no puede tener más de 50 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
