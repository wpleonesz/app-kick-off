import { z } from "zod";

// ===== LOGIN SCHEMA =====
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "El usuario es obligatorio")
    .min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Valida cédula ecuatoriana (10 dígitos)
const isValidEcuadorianCedula = (cedula: string) => {
  if (!/^[0-9]{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;
  const tercer = parseInt(cedula[2], 10);
  if (tercer >= 6) return false;

  const digits = cedula.split("").map((d) => parseInt(d, 10));
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = digits[i];
    if (i % 2 === 0) {
      val = val * 2;
      if (val > 9) val -= 9;
    }
    sum += val;
  }
  const check = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return check === digits[9];
};

// Valida la política de contraseña: al menos una mayúscula, una minúscula,
// un dígito, al menos un caracter especial de los permitidos (@,#,$,*) y
// únicamente caracteres del conjunto permitido.
const isValidPassword = (v: unknown) => {
  if (typeof v !== "string") return false;
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#\$\*])[A-Za-z\d@#\$\*]+$/;
  return re.test(v);
};

// ===== REGISTER SCHEMA =====
export const registerSchema = z
  .object({
    dni: z
      .preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z.string().min(1, "El DNI es obligatorio"),
      )
      .refine(isValidEcuadorianCedula, {
        message: "El DNI no es una cédula ecuatoriana válida",
      }),
    firstName: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string()
        .min(1, "El nombre es obligatorio")
        .min(2, "El nombre debe tener al menos 2 caracteres"),
    ),
    lastName: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string()
        .min(1, "El apellido es obligatorio")
        .min(2, "El apellido debe tener al menos 2 caracteres"),
    ),
    email: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string()
        .min(1, "El email es obligatorio")
        .email("Ingresa un email válido"),
    ),
    username: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string()
        .min(1, "El usuario es obligatorio")
        .min(3, "El usuario debe tener al menos 3 caracteres")
        .max(20, "El usuario no puede tener más de 20 caracteres"),
    ),
    mobile: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string()
        .regex(/^0\d{9}$/, "El teléfono debe tener 10 dígitos y comenzar con 0")
        .optional()
        .or(z.literal("")),
    ),
    roleId: z
      .number()
      .int("El rol debe ser un número entero")
      .positive("Selecciona un rol"),
    password: z
      .preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z
          .string()
          .min(1, "La contraseña es obligatoria")
          .min(6, "La contraseña debe tener al menos 6 caracteres")
          .max(50, "La contraseña no puede tener más de 50 caracteres"),
      )
      .refine(isValidPassword, {
        message:
          "La contraseña debe tener mayúsculas, minúsculas, números y al menos uno de @ # $ *; solo se permiten esos símbolos",
      }),
    confirmPassword: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(1, "Confirma tu contraseña"),
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
