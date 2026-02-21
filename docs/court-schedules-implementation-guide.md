# Guía de Implementación: Servicio de Horarios de Canchas (Court Schedules)

Esta guía documenta paso a paso cómo implementar el CRUD de horarios de canchas en la app móvil, siguiendo el mismo patrón usado en `courts.service.ts`, `roles.service.ts` y sus hooks correspondientes.

---

## Resumen de Endpoints

### Endpoints con Autenticación (Gestión de Horarios)

| Método   | Endpoint                      | Auth  | Descripción                                                   |
| -------- | ----------------------------- | ----- | ------------------------------------------------------------- |
| `GET`    | `/api/courts/schedules`       | ✅ Sí | Lista **todos** los horarios (activos e inactivos)            |
| `POST`   | `/api/courts/schedules`       | ✅ Sí | Crea un nuevo horario para una cancha                         |
| `GET`    | `/api/courts/schedules/{id}`  | ✅ Sí | Obtiene el detalle completo de un horario específico          |
| `PUT`    | `/api/courts/schedules/{id}`  | ✅ Sí | Actualiza información de un horario                           |
| `DELETE` | `/api/courts/schedules/{id}`  | ✅ Sí | Desactiva un horario (soft delete, marca `active=false`)      |

### Endpoint Público (Para App Móvil)

| Método | Endpoint                    | Auth  | Query Params          | Descripción                                                        |
| ------ | --------------------------- | ----- | --------------------- | ------------------------------------------------------------------ |
| `GET`  | `/api/public/court-schedules` | ❌ No | `courtId` (opcional)  | Lista **solo horarios activos** (sin login)                        |
|        |                             |       |                       | Si se pasa `courtId`, filtra horarios de esa cancha específica     |
|        |                             |       |                       | Ideal para mostrar disponibilidad de canchas en la app móvil       |

> **💡 Ventaja del endpoint público:** Los usuarios pueden consultar la disponibilidad horaria de las canchas **sin necesidad de registrarse**, facilitando la planificación de reservas y mejorando la conversión de visitantes a usuarios registrados.

---

## Contexto del Modelo

### Estructura de `courtSchedules`

Los horarios de canchas representan los **bloques de disponibilidad** de una cancha en días específicos de la semana. Por ejemplo:

- **Lunes (dayOfWeek=1):** 08:00 - 10:00, 10:00 - 12:00, 14:00 - 16:00
- **Martes (dayOfWeek=2):** 09:00 - 11:00, 16:00 - 18:00
- **Sábado (dayOfWeek=6):** Todo el día en bloques de 2 horas

### Campos principales

```typescript
{
  id: number;           // ID único del horario
  courtId: number;      // ID de la cancha (relación)
  dayOfWeek: number;    // Día de la semana (1=Lunes, 2=Martes, ..., 7=Domingo)
  duration: number;     // Duración del bloque en minutos (default: 60)
  startTime: string;    // Hora de inicio (formato: "HH:MM", ej: "08:00")
  endTime: string;      // Hora de fin (formato: "HH:MM", ej: "10:00")
  active: boolean;      // true = horario disponible, false = desactivado
}
```

> **📅 Convención de días de la semana:**
> - 1 = Lunes
> - 2 = Martes
> - 3 = Miércoles
> - 4 = Jueves
> - 5 = Viernes
> - 6 = Sábado
> - 7 = Domingo

---

## Paso 1: Crear la interfaz `CourtSchedule`

**Archivo:** `src/interfaces/courtSchedule.ts`

```typescript
/**
 * Interfaz para datos de horario de cancha
 * Refleja la estructura del endpoint /api/courts/schedules del backend
 */

export interface CourtSchedule {
  id: number;
  courtId: number; // ID de la cancha asociada
  Court?: {
    // Información de la cancha (opcional, incluida en queries)
    id: number;
    name: string;
    location: string;
  };
  dayOfWeek: number; // 1=Lunes, 2=Martes, ..., 7=Domingo
  duration: number; // Duración en minutos (ej: 60, 90, 120)
  startTime: string; // Formato "HH:MM" (ej: "08:00")
  endTime: string; // Formato "HH:MM" (ej: "10:00")
  active: boolean; // true = disponible, false = desactivado
  createdAt: string; // Timestamp ISO de creación
  updatedAt: string; // Timestamp ISO de última modificación
}

/**
 * Datos para crear o actualizar un horario
 * Omitimos campos auto-generados (id, createdAt, updatedAt, Court)
 */
export interface CourtScheduleInput {
  courtId: number; // ID de la cancha (obligatorio)
  dayOfWeek: number; // Día de la semana 1-7 (obligatorio)
  duration?: number; // Opcional: por defecto 60 minutos
  startTime: string; // Hora de inicio "HH:MM" (obligatorio)
  endTime: string; // Hora de fin "HH:MM" (obligatorio)
  active?: boolean; // Opcional: por defecto true
}

/**
 * Helper: Mapeo de días de la semana
 */
export const DAYS_OF_WEEK = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
} as const;

/**
 * Helper: Obtener nombre del día
 */
export function getDayName(dayOfWeek: number): string {
  return DAYS_OF_WEEK[dayOfWeek as keyof typeof DAYS_OF_WEEK] || "Desconocido";
}
```

> **⏰ Formato de horarios:**
> - **startTime/endTime:** String en formato "HH:MM" 24 horas (ej: "14:30", "08:00")
> - **duration:** Número entero en minutos (ej: 60, 90, 120)
> - **Validación:** `endTime` debe ser mayor que `startTime`

---

## Paso 2: Exportar la interfaz desde el barrel

**Archivo:** `src/interfaces/index.ts`

Agregar la siguiente línea:

```typescript
export type {
  CourtSchedule,
  CourtScheduleInput,
  DAYS_OF_WEEK,
} from "./courtSchedule";
export { getDayName } from "./courtSchedule";
```

El archivo quedaría así:

```typescript
/**
 * Exportaciones centralizadas de interfaces
 */
export type { User, Role, Access, AccessPermissions } from "./user";
export type { Court, CourtInput } from "./court";
export type {
  CourtSchedule,
  CourtScheduleInput,
  DAYS_OF_WEEK,
} from "./courtSchedule";
export { getDayName } from "./courtSchedule";
```

---

## Paso 3: Crear el servicio `court-schedules.service.ts`

**Archivo:** `src/services/court-schedules.service.ts`

```typescript
import api from "../lib/api";
import type { CourtSchedule, CourtScheduleInput } from "../interfaces";

// ─────────────────────────────────────────────
// Endpoints con autenticación (/api/courts/schedules)
// ─────────────────────────────────────────────

/**
 * Lista todos los horarios (activos e inactivos)
 * GET /api/courts/schedules — requiere auth
 */
export async function getCourtSchedules(): Promise<CourtSchedule[]> {
  return api.get<CourtSchedule[]>("/api/courts/schedules");
  // requiresAuth = true por defecto
}

/**
 * Obtiene un horario por ID
 * GET /api/courts/schedules/{id} — requiere auth
 */
export async function getCourtScheduleById(id: number): Promise<CourtSchedule> {
  return api.get<CourtSchedule>(`/api/courts/schedules/${id}`);
}

/**
 * Crea un nuevo horario
 * POST /api/courts/schedules — requiere auth
 */
export async function createCourtSchedule(
  data: CourtScheduleInput,
): Promise<CourtSchedule> {
  return api.post<CourtSchedule>("/api/courts/schedules", data);
}

/**
 * Actualiza un horario existente
 * PUT /api/courts/schedules/{id} — requiere auth
 */
export async function updateCourtSchedule(
  id: number,
  data: Partial<CourtScheduleInput>,
): Promise<CourtSchedule> {
  return api.put<CourtSchedule>(`/api/courts/schedules/${id}`, data);
}

/**
 * Desactiva un horario (soft delete)
 * DELETE /api/courts/schedules/{id} — requiere auth
 */
export async function deleteCourtSchedule(id: number): Promise<void> {
  return api.delete<void>(`/api/courts/schedules/${id}`);
}

// ─────────────────────────────────────────────
// Endpoint público (/api/public/court-schedules)
// ─────────────────────────────────────────────

/**
 * Lista horarios activos (sin autenticación)
 * GET /api/public/court-schedules?courtId={id} — público
 *
 * @param courtId - Opcional: filtrar horarios de una cancha específica
 *
 * Casos de uso:
 * - Mostrar disponibilidad de canchas sin login
 * - Calendario de horarios disponibles para reserva
 * - Filtrar horarios por cancha específica
 */
export async function getPublicCourtSchedules(
  courtId?: number,
): Promise<CourtSchedule[]> {
  const url = courtId
    ? `/api/public/court-schedules?courtId=${courtId}`
    : `/api/public/court-schedules`;

  return api.get<CourtSchedule[]>(url, false);
  // false = no requiere autenticación
}
```

### Explicación del patrón

#### Diferencia: Endpoints privados vs públicos

```typescript
// ❌ SIN autenticación (público) - Para usuarios no logueados
const publicSchedules = await api.get(
  "/api/public/court-schedules?courtId=5",
  false,
);
// → Solo devuelve horarios activos
// → Puede filtrarse por cancha con query param ?courtId=X
// → No requiere token de autenticación
// → Ideal para mostrar disponibilidad antes de login

// ✅ CON autenticación (privado) - Para usuarios logueados
const allSchedules = await api.get("/api/courts/schedules");
// → Devuelve TODOS los horarios (activos e inactivos)
// → Requiere token de autenticación válido
// → Incluye información de la cancha (Court)
// → Permite gestión completa (crear/editar/eliminar)
```

---

## Paso 4: Crear el hook `useCourtSchedules.ts`

**Archivo:** `src/hooks/useCourtSchedules.ts`

```typescript
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
```

---

## Paso 5: Ejemplo de uso en un componente

### 5a. Listar horarios de una cancha específica (público, sin auth)

```typescript
import { usePublicCourtSchedules, getDayName } from "../hooks/useCourtSchedules";
import { DAYS_OF_WEEK } from "../interfaces";

// ID de la cancha (puede venir de route params, props, estado, etc.)
const courtId: number = 5;

// Dentro de un componente React:
const { data: schedules, isLoading, isError, error } = usePublicCourtSchedules(courtId);

if (isLoading) {
  // Mostrar spinner o skeleton
}

if (isError) {
  console.error("Error al cargar horarios:", error.message);
}

// Agrupar horarios por día de la semana
if (schedules) {
  // Crear mapa: día → horarios
  const schedulesByDay = schedules.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, typeof schedules>);

  // Mostrar horarios agrupados
  Object.entries(schedulesByDay).forEach(([day, daySchedules]) => {
    console.log(`\n📅 ${getDayName(Number(day))}:`);
    daySchedules
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .forEach((schedule) => {
        console.log(
          `   ⏰ ${schedule.startTime} - ${schedule.endTime} (${schedule.duration} min)`,
        );
      });
  });
}
```

**Ejemplo de salida:**
```
📅 Lunes:
   ⏰ 08:00 - 10:00 (120 min)
   ⏰ 10:00 - 12:00 (120 min)
   ⏰ 14:00 - 16:00 (120 min)

📅 Martes:
   ⏰ 09:00 - 11:00 (120 min)
   ⏰ 16:00 - 18:00 (120 min)

📅 Sábado:
   ⏰ 08:00 - 12:00 (240 min)
   ⏰ 14:00 - 18:00 (240 min)
```

### 5b. Crear un horario (con auth + validación Zod)

```typescript
import { useCreateCourtSchedule } from "../hooks/useCourtSchedules";
import {
  courtScheduleSchema,
  type CourtScheduleFormData,
} from "../schemas/courtSchedule.schemas";

// Dentro de un componente React:
const createSchedule = useCreateCourtSchedule();

// Los datos vienen de un formulario
const formData: unknown = {
  courtId: 5,
  dayOfWeek: 1, // Lunes
  startTime: "08:00",
  endTime: "10:00",
  duration: 120,
};

// 1. Validar con Zod antes de enviar
const result = courtScheduleSchema.safeParse(formData);

if (!result.success) {
  // Mostrar errores de validación
  const errors = result.error.flatten().fieldErrors;
  console.error("Errores de validación:", errors);
  // errors.startTime → ["La hora de inicio debe estar en formato HH:MM"]
  // errors.dayOfWeek → ["El día debe estar entre 1 (Lunes) y 7 (Domingo)"]
  return;
}

// 2. Datos validados (tipados como CourtScheduleFormData)
const validData: CourtScheduleFormData = result.data;

try {
  const nuevoHorario = await createSchedule.mutateAsync(validData);
  console.log("Horario creado:", nuevoHorario);
  // La lista se refresca automáticamente por invalidación de query
} catch (error) {
  console.error("Error al crear horario:", error);
}

// Estado de la mutation disponible:
// createSchedule.isPending  → true mientras se envía
// createSchedule.isError    → true si falló
// createSchedule.isSuccess  → true si se completó
```

### 5c. Calendario semanal de disponibilidad

```typescript
import { usePublicCourtSchedules, getDayName } from "../hooks/useCourtSchedules";

const courtId = 5;
const { data: schedules } = usePublicCourtSchedules(courtId);

// Generar vista de calendario semanal
function WeeklyCalendar() {
  if (!schedules) return <div>Cargando...</div>;

  // Agrupar por día
  const schedulesByDay = schedules.reduce((acc, s) => {
    if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = [];
    acc[s.dayOfWeek].push(s);
    return acc;
  }, {} as Record<number, typeof schedules>);

  return (
    <div>
      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
        <div key={day}>
          <h3>{getDayName(day)}</h3>
          {schedulesByDay[day]?.length > 0 ? (
            schedulesByDay[day]
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((schedule) => (
                <div key={schedule.id}>
                  ⏰ {schedule.startTime} - {schedule.endTime}
                </div>
              ))
          ) : (
            <p>No hay horarios disponibles</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Paso 6: Schema de validación con Zod

**Archivo:** `src/schemas/courtSchedule.schemas.ts`

```typescript
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
```

> **⏰ Validaciones de horarios:**
>
> - **Formato:** "HH:MM" en formato 24 horas (ej: "08:00", "14:30", "23:59")
> - **Rango válido:** 00:00 - 23:59
> - **Validación cruzada:** `endTime` debe ser mayor que `startTime`
> - **Duración:** Entre 15 minutos y 8 horas (480 min)
>
> **Ejemplos válidos:**
> ```typescript
> startTime: "08:00", endTime: "10:00" ✅
> startTime: "14:30", endTime: "16:00" ✅
> startTime: "22:00", endTime: "23:59" ✅
> ```
>
> **Ejemplos inválidos:**
> ```typescript
> startTime: "10:00", endTime: "08:00" ❌ (fin antes que inicio)
> startTime: "8:00", endTime: "10:00"  ❌ (formato incorrecto, debe ser "08:00")
> startTime: "25:00", endTime: "10:00" ❌ (hora fuera de rango)
> ```

---

## Resumen de archivos a crear/modificar

| Acción        | Archivo                                   | Descripción                                    |
| ------------- | ----------------------------------------- | ---------------------------------------------- |
| **Crear**     | `src/interfaces/courtSchedule.ts`         | Interfaces `CourtSchedule`, `CourtScheduleInput`, helpers |
| **Modificar** | `src/interfaces/index.ts`                 | Agregar export de interfaces y helpers         |
| **Crear**     | `src/services/court-schedules.service.ts` | Funciones del servicio (6 endpoints)           |
| **Crear**     | `src/hooks/useCourtSchedules.ts`          | Hooks de React Query (3 queries + 3 mutations) |
| **Crear**     | `src/schemas/courtSchedule.schemas.ts`    | Schema Zod para validación de datos            |

---

## Diagrama de dependencias

```
src/interfaces/courtSchedule.ts     ← Define CourtSchedule, helpers
        ↓
src/interfaces/index.ts              ← Re-exporta tipos y helpers
        ↓
src/services/court-schedules.service.ts ← Usa api (lib/api.ts) + interfaces
        ↓
src/hooks/useCourtSchedules.ts       ← Usa service + React Query
        ↓
src/pages/CourtSchedules.tsx         ← Consume hooks en componentes
```

---

## Casos de uso comunes

### 1. **Mostrar disponibilidad de una cancha (público)**
```typescript
// Usuario SIN login ve horarios disponibles de una cancha
const { data: schedules } = usePublicCourtSchedules(courtId);
// → Solo muestra horarios activos
// → Permite decidir si la cancha tiene disponibilidad antes de registrarse
```

### 2. **Gestionar horarios de mi cancha (con auth)**
```typescript
// Propietario de cancha gestiona sus horarios
const { data: allSchedules } = useCourtSchedules();
// → Ve todos los horarios (activos e inactivos)
// → Puede crear, editar, eliminar horarios
```

### 3. **Calendario semanal interactivo**
```typescript
// Mostrar calendario de lunes a domingo con horarios por día
const schedulesByDay = groupSchedulesByDay(schedules);
// → Permite visualizar disponibilidad semanal
// → Facilita selección de horario para reserva
```

### 4. **Filtrado y búsqueda**
```typescript
// Filtrar horarios por criterios
const morningSchedules = schedules.filter(s => {
  const hour = parseInt(s.startTime.split(':')[0]);
  return hour >= 6 && hour < 12;
});
// → Mostrar solo horarios de mañana, tarde o noche
// → Filtrar por duración mínima/máxima
```

---

## Notas importantes

### 📅 Días de la semana

- **Convención:** 1=Lunes, 2=Martes, ..., 7=Domingo (ISO 8601)
- **Helper disponible:** `getDayName(dayOfWeek)` para obtener nombre en español
- **Constante:** `DAYS_OF_WEEK` para mapeo completo

### ⏰ Formato de horarios

- **String, no Date:** Se almacenan como strings "HH:MM" para evitar problemas de timezone
- **24 horas:** No usar formato AM/PM
- **Validación:** Zod valida formato y que `endTime > startTime`

### 🔄 Invalidación automática

- Las mutations invalidan tanto `SCHEDULES_KEY` como `PUBLIC_SCHEDULES_KEY`
- Esto asegura que cambios en horarios se reflejen en ambas vistas (pública y privada)

### 🎯 Endpoint público con filtro

```typescript
// Todos los horarios activos
getPublicCourtSchedules();

// Solo horarios de la cancha #5
getPublicCourtSchedules(5);
```

### 🔐 Seguridad

- Endpoint público (`/api/public/court-schedules`) solo devuelve horarios **activos**
- Endpoints privados (`/api/courts/schedules`) requieren autenticación y devuelven **todos** los horarios
- Soft delete: marcar `active=false` en lugar de eliminar registros

### 🧪 Testing recomendado

- ✅ Crear horario con formato de hora válido
- ✅ Rechazar formato de hora inválido ("8:00" en lugar de "08:00")
- ✅ Rechazar horarios donde `endTime < startTime`
- ✅ Filtrar por cancha específica funciona correctamente
- ✅ Endpoint público no requiere autenticación
- ✅ Endpoint privado requiere token válido
- ✅ Horarios desactivados no aparecen en endpoint público

---

## Mejores prácticas

### 1. **Agrupar horarios por día**
```typescript
const schedulesByDay = schedules.reduce((acc, schedule) => {
  const day = schedule.dayOfWeek;
  if (!acc[day]) acc[day] = [];
  acc[day].push(schedule);
  return acc;
}, {} as Record<number, CourtSchedule[]>);
```

### 2. **Ordenar horarios por hora de inicio**
```typescript
const sortedSchedules = schedules.sort((a, b) =>
  a.startTime.localeCompare(b.startTime)
);
```

### 3. **Calcular duración automáticamente**
```typescript
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes - startMinutes;
}
```

### 4. **Formatear duración para display**
```typescript
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

// Ejemplos:
formatDuration(60);  // "1h"
formatDuration(90);  // "1h 30min"
formatDuration(120); // "2h"
```

---

## Próximos pasos

1. ✅ Implementar interfaces y tipos
2. ✅ Crear servicio con funciones de API
3. ✅ Crear hooks de React Query
4. ✅ Crear schemas de validación Zod
5. 🎨 Crear componentes de UI (CourtScheduleForm, CourtScheduleList, WeeklyCalendar)
6. 📱 Integrar en páginas de la app móvil
7. 🧪 Agregar tests unitarios e integración

---

**🎉 ¡Guía completa!** Sigue estos pasos para implementar el CRUD completo de horarios de canchas en tu app móvil, con soporte para consultas públicas (sin login) y gestión completa (con autenticación).
