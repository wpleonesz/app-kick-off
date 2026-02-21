# Guía de Implementación: Servicio de Canchas (Courts)

Esta guía documenta paso a paso cómo implementar el CRUD de canchas en la app móvil, siguiendo el mismo patrón usado en `roles.service.ts`, `football.service.ts` y sus hooks correspondientes.

---

## Resumen de Endpoints

### Endpoints con Autenticación (Gestión de Canchas)

| Método   | Endpoint           | Auth  | Descripción                                              |
| -------- | ------------------ | ----- | -------------------------------------------------------- |
| `GET`    | `/api/courts`      | ✅ Sí | Lista **todas** las canchas (activas e inactivas)        |
| `POST`   | `/api/courts`      | ✅ Sí | Crea una nueva cancha con ubicación GPS                  |
| `GET`    | `/api/courts/{id}` | ✅ Sí | Obtiene el detalle completo de una cancha específica     |
| `PUT`    | `/api/courts/{id}` | ✅ Sí | Actualiza información de una cancha (incluye lat/lon)    |
| `DELETE` | `/api/courts/{id}` | ✅ Sí | Desactiva una cancha (soft delete, marca `active=false`) |

### Endpoint Público (Para App Móvil)

| Método | Endpoint             | Auth  | Descripción                                                    |
| ------ | -------------------- | ----- | -------------------------------------------------------------- |
| `GET`  | `/api/public/courts` | ❌ No | Lista **solo canchas activas** con ubicación GPS (sin login)   |
|        |                      |       | Ideal para mostrar mapa de canchas disponibles en la app móvil |

> **💡 Ventaja del endpoint público:** Los usuarios pueden explorar las canchas disponibles y ver su ubicación en el mapa **sin necesidad de registrarse o iniciar sesión**, mejorando la experiencia de usuario y facilitando la captación de nuevos usuarios.

---

## Paso 1: Crear la interfaz `Court`

**Archivo:** `src/interfaces/court.ts`

```typescript
/**
 * Interfaz para datos de cancha
 * Refleja la estructura del endpoint /api/courts del backend
 */

export interface Court {
  id: number;
  name: string;
  location: string; // Dirección textual (ej: "Av. Principal 123, Quito")
  latitude?: number; // Coordenada GPS - Latitud (ej: -0.180653)
  longitude?: number; // Coordenada GPS - Longitud (ej: -78.467834)
  userId: number; // ID del dueño/administrador de la cancha
  User?: {
    // Información del usuario propietario (opcional)
    id: number;
    username: string;
    email: string;
  };
  isIndoor: boolean; // true = cancha techada, false = cancha al aire libre
  active: boolean; // true = cancha disponible, false = desactivada
  createdAt: string; // Timestamp ISO de creación
  updatedAt: string; // Timestamp ISO de última modificación
}

/**
 * Datos para crear o actualizar una cancha
 * Omitimos campos auto-generados (id, createdAt, updatedAt, User)
 */
export interface CourtInput {
  name: string; // Nombre de la cancha (obligatorio)
  location: string; // Dirección textual (obligatorio)
  latitude?: number; // Opcional: GPS latitud (recomendado para mapa)
  longitude?: number; // Opcional: GPS longitud (recomendado para mapa)
  userId: number; // ID del propietario (obligatorio)
  isIndoor?: boolean; // Opcional: por defecto false
  active?: boolean; // Opcional: por defecto true
}
```

> **📍 Coordenadas GPS:** Los campos `latitude` y `longitude` son opcionales pero **altamente recomendados**. Permiten mostrar las canchas en un mapa interactivo en la app móvil, calcular distancias desde la ubicación del usuario, y mejorar la búsqueda por proximidad.
>
> **Ejemplo de uso:**
>
> - **Sin GPS:** Solo se muestra la dirección textual como "Estadio Municipal, Calle 5"
> - **Con GPS:** Se muestra en Google Maps/Mapbox, se calcula "a 2.3 km de tu ubicación", y se permite navegación con apps de mapas

---

## Paso 2: Exportar la interfaz desde el barrel

**Archivo:** `src/interfaces/index.ts`

Agregar la siguiente línea al final del archivo existente:

```typescript
export type { Court, CourtInput } from "./court";
```

El archivo quedaría así:

```typescript
/**
 * Exportaciones centralizadas de interfaces
 */
export type { User, Role, Access, AccessPermissions } from "./user";
export type { Court, CourtInput } from "./court";
```

---

## Paso 3: Crear el servicio `courts.service.ts`

**Archivo:** `src/services/courts.service.ts`

```typescript
import api from "../lib/api";
import type { Court, CourtInput } from "../interfaces";

// ─────────────────────────────────────────────
// Endpoints con autenticación (/api/courts)
// ─────────────────────────────────────────────

/**
 * Lista todas las canchas (activas e inactivas)
 * GET /api/courts — requiere auth
 */
export async function getCourts(): Promise<Court[]> {
  return api.get<Court[]>("/api/courts");
  // requiresAuth = true por defecto
}

/**
 * Obtiene una cancha por ID
 * GET /api/courts/{id} — requiere auth
 */
export async function getCourtById(id: number): Promise<Court> {
  return api.get<Court>(`/api/courts/${id}`);
}

/**
 * Crea una nueva cancha
 * POST /api/courts — requiere auth
 */
export async function createCourt(data: CourtInput): Promise<Court> {
  return api.post<Court>("/api/courts", data);
}

/**
 * Actualiza una cancha existente
 * PUT /api/courts/{id} — requiere auth
 */
export async function updateCourt(
  id: number,
  data: Partial<CourtInput>,
): Promise<Court> {
  return api.put<Court>(`/api/courts/${id}`, data);
}

/**
 * Desactiva una cancha (soft delete)
 * DELETE /api/courts/{id} — requiere auth
 */
export async function deleteCourt(id: number): Promise<void> {
  return api.delete<void>(`/api/courts/${id}`);
}

// ─────────────────────────────────────────────
// Endpoint público (/api/public/courts)
// ─────────────────────────────────────────────

/**
 * Lista canchas activas (sin autenticación)
 * GET /api/public/courts — público, para la app móvil
 *
 * Este endpoint es ideal para:
 * - Mostrar mapa de canchas disponibles sin login
 * - Landing page o pantalla de inicio de la app
 * - Permitir exploración antes de registrarse
 * - Solo devuelve canchas con active=true
 */
export async function getPublicCourts(): Promise<Court[]> {
  return api.get<Court[]>("/api/public/courts", false);
  // false = no requiere autenticación
}
```

### Explicación del patrón

#### Cliente HTTP Centralizado (`api`)

- Se importa `api` desde `../lib/api` (el cliente HTTP centralizado con Request Balancer).
- **Autenticación automática:**
  - `api.get(endpoint)` → `requiresAuth = true` por defecto → añade header `Authorization: Bearer <token>`
  - `api.get(endpoint, false)` → `requiresAuth = false` → request sin autenticación (público)
- **Métodos disponibles:** `api.get`, `api.post`, `api.put`, `api.delete`, `api.patch`

#### Request Balancer (integrado automáticamente)

El cliente `api` incluye las siguientes optimizaciones sin configuración adicional:

| Característica       | Descripción                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| **Caché GET**        | Los GET se cachean 30 segundos por defecto                               |
| **Deduplicación**    | Si 2 requests idénticos se ejecutan al mismo tiempo, solo se hace 1 call |
| **Cola**             | Máximo 6 requests simultáneos (evita saturar el servidor)                |
| **Retry automático** | Reintentos en caso de 429 (rate limit), 503 (server busy), timeouts     |
| **Invalidación**     | POST/PUT/DELETE invalidan caché relacionado automáticamente              |

#### Diferencia: Endpoints privados vs públicos

```typescript
// ❌ SIN autenticación (público) - Para usuarios no logueados
const publicCourts = await api.get("/api/public/courts", false);
// → Solo devuelve canchas activas
// → No requiere token de autenticación
// → Ideal para landing page o exploración inicial

// ✅ CON autenticación (privado) - Para usuarios logueados
const allCourts = await api.get("/api/courts");
// → Devuelve TODAS las canchas (activas e inactivas)
// → Requiere token de autenticación válido
// → Incluye información del propietario (User)
// → Permite gestión completa (crear/editar/eliminar)
```

---

## Paso 4: Crear el hook `useCourts.ts`

**Archivo:** `src/hooks/useCourts.ts`

```typescript
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
      // Invalidar queries para refrescar listas
      queryClient.invalidateQueries({ queryKey: COURTS_KEY });
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
```

---

## Paso 5: Ejemplo de uso en un componente

### 5a. Listar todas las canchas (con auth)

```typescript
import { useCourts } from "../hooks/useCourts";

// Dentro de un componente React:
const { data: courts, isLoading, isError, error } = useCourts();

// Estados de carga
if (isLoading) {
  // Mostrar spinner o skeleton
}

if (isError) {
  console.error("Error al cargar canchas:", error.message);
  // Mostrar mensaje de error al usuario
}

// Datos disponibles (incluye activas e inactivas)
if (courts) {
  console.log("Total canchas:", courts.length);
  courts.forEach((court) => {
    console.log(
      `- ${court.name} | Ubicación: ${court.location} | Activa: ${court.active}`,
    );
  });
}
```

### 5b. Listar canchas públicas (sin auth) - Con ubicación GPS

```typescript
import { usePublicCourts } from "../hooks/useCourts";

// Dentro de un componente React:
const { data: courts, isLoading, isError, error } = usePublicCourts();

// Estados de carga
if (isLoading) {
  // Mostrar spinner o skeleton
}

if (isError) {
  console.error("Error al cargar canchas públicas:", error.message);
  // Mostrar mensaje de error al usuario
}

// Solo canchas activas (endpoint público, no requiere login)
if (courts) {
  console.log("Canchas disponibles:", courts.length);

  courts.forEach((court) => {
    console.log(`📍 ${court.name}`);
    console.log(`   Dirección: ${court.location}`);
    console.log(`   Tipo: ${court.isIndoor ? "Techada 🏟️" : "Al aire libre ⛅"}`);

    // Mostrar coordenadas GPS si están disponibles
    if (court.latitude && court.longitude) {
      console.log(`   GPS: ${court.latitude}, ${court.longitude}`);
      console.log(
        `   🗺️ Ver en mapa: https://maps.google.com/?q=${court.latitude},${court.longitude}`,
      );
    }

    console.log("---");
  });
}
```

> **💡 Casos de uso del endpoint público:**
>
> - **Landing Page:** Mostrar mapa de canchas en la pantalla de inicio (sin login)
> - **Búsqueda por proximidad:** Ordenar canchas por distancia desde ubicación del usuario
> - **Filtros:** Permitir filtrar por tipo (techada/aire libre) antes de registrarse
> - **Onboarding:** Dar preview de funcionalidad para incentivar registro

### 5c. Obtener una cancha por ID (con auth)

```typescript
import { useCourt } from "../hooks/useCourts";

// ID dinámico de la cancha (puede venir de route params, props, estado, etc.)
const courtId: number = /* ID de la cancha a consultar */;

// Dentro de un componente React:
const { data: court, isLoading, isError, error } = useCourt(courtId);

if (isLoading) {
  // Mostrar spinner o skeleton
}

if (isError) {
  console.error(`Error al cargar cancha ${courtId}:`, error.message);
}

if (court) {
  console.log("Detalle de cancha:", {
    id: court.id,
    nombre: court.name,
    descripcion: court.description,
    ubicacion: court.location,
    capacidad: court.capacity,
    precio: court.pricePerHour,
    tipo: court.type,
    superficie: court.surface,
    activa: court.active,
  });
}
```

### 5d. Crear una cancha (con auth + validación Zod)

```typescript
import { useCreateCourt } from "../hooks/useCourts";
import { courtSchema, type CourtFormData } from "../schemas/court.schemas";

// Dentro de un componente React:
const createCourt = useCreateCourt();

// Los datos vienen de un formulario, props, estado, etc.
const formData: unknown = {
  /* datos dinámicos del usuario */
};

// 1. Validar con Zod antes de enviar
const result = courtSchema.safeParse(formData);

if (!result.success) {
  // Mostrar errores de validación
  const errors = result.error.flatten().fieldErrors;
  console.error("Errores de validación:", errors);
  // errors.name → ["El nombre debe tener al menos 2 caracteres"]
  // errors.capacity → ["La capacidad mínima es 1"]
  return;
}

// 2. Datos validados (tipados como CourtFormData)
const validData: CourtFormData = result.data;

try {
  const nuevaCancha = await createCourt.mutateAsync(validData);
  console.log("Cancha creada:", nuevaCancha);
  // La lista se refresca automáticamente por invalidación de query
} catch (error) {
  console.error("Error al crear cancha:", error);
}

// Estado de la mutation disponible:
// createCourt.isPending  → true mientras se envía
// createCourt.isError    → true si falló
// createCourt.isSuccess  → true si se completó
// createCourt.error      → objeto Error si falló
```

### 5e. Actualizar una cancha (con auth + validación Zod parcial)

```typescript
import { useUpdateCourt } from "../hooks/useCourts";
import { courtSchema } from "../schemas/court.schemas";

// Dentro de un componente React:
const updateCourt = useUpdateCourt();

// Para updates parciales, usar .partial() de Zod
const partialCourtSchema = courtSchema.partial();

// Datos dinámicos (solo los campos que se quieren modificar)
const cambios: unknown = { /* campos a actualizar */ };
const courtId: number = /* ID de la cancha a modificar */;

// 1. Validar campos parciales
const result = partialCourtSchema.safeParse(cambios);

if (!result.success) {
  console.error("Errores:", result.error.flatten().fieldErrors);
  return;
}

// 2. Enviar al backend
try {
  const canchaActualizada = await updateCourt.mutateAsync({
    id: courtId,
    data: result.data,
  });
  console.log("Cancha actualizada:", canchaActualizada);
  // Invalida automáticamente la lista y el detalle de esta cancha
} catch (error) {
  console.error("Error al actualizar:", error);
}

// Estado de la mutation disponible:
// updateCourt.isPending  → true mientras se envía
// updateCourt.isError    → true si falló
// updateCourt.isSuccess  → true si se completó
```

### 5f. Desactivar una cancha (con auth)

```typescript
import { useDeleteCourt } from "../hooks/useCourts";

// Dentro de un componente React:
const deleteCourt = useDeleteCourt();

// ID dinámico de la cancha a desactivar
const courtId: number = /* ID de la cancha */;

try {
  await deleteCourt.mutateAsync(courtId);
  console.log(`Cancha ${courtId} desactivada exitosamente`);
  // La lista se refresca automáticamente por invalidación de query
} catch (error) {
  console.error("Error al desactivar:", error);
}

// Estado de la mutation disponible:
// deleteCourt.isPending  → true mientras se envía
// deleteCourt.isError    → true si falló
// deleteCourt.isSuccess  → true si se completó
```

---

## Paso 6: Schema de validación con Zod

Requerido para validar datos antes de enviarlos al backend (usado en los ejemplos del Paso 5):

**Archivo:** `src/schemas/court.schemas.ts`

```typescript
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
```

> **📍 Validación de coordenadas GPS:**
>
> - **Latitud:** Rango válido de -90° (Polo Sur) a +90° (Polo Norte)
> - **Longitud:** Rango válido de -180° (antimeridiano oeste) a +180° (antimeridiano este)
> - **Opcional pero recomendado:** Permite crear canchas sin GPS, pero limita funcionalidad de mapa
>
> **Ejemplo de coordenadas válidas:**
>
> ```typescript
> // Quito, Ecuador
> latitude: -0.180653;
> longitude: -78.467834;
>
> // Madrid, España
> latitude: 40.416775;
> longitude: -3.70379;
> ```

---

## Resumen de archivos a crear/modificar

| Acción        | Archivo                          | Descripción                                    |
| ------------- | -------------------------------- | ---------------------------------------------- |
| **Crear**     | `src/interfaces/court.ts`        | Interfaces `Court` y `CourtInput`              |
| **Modificar** | `src/interfaces/index.ts`        | Agregar export de `Court`, `CourtInput`        |
| **Crear**     | `src/services/courts.service.ts` | Funciones del servicio (6 endpoints)           |
| **Crear**     | `src/hooks/useCourts.ts`         | Hooks de React Query (3 queries + 3 mutations) |
| **Crear**     | `src/schemas/court.schemas.ts`   | Schema Zod para validación de datos            |

---

## Diagrama de dependencias

```
src/interfaces/court.ts          ← Define Court, CourtInput
        ↓
src/interfaces/index.ts          ← Re-exporta tipos
        ↓
src/services/courts.service.ts   ← Usa api (lib/api.ts) + interfaces
        ↓
src/hooks/useCourts.ts           ← Usa service + React Query
        ↓
src/pages/Courts.tsx (u otro)    ← Consume hooks en componentes
```

---

## Notas importantes

### 🔄 Caché y Performance

1. **Doble capa de caché:**
   - **Request Balancer (lib/api.ts):** Caché de 30s en todas las peticiones GET
   - **React Query (hooks):** `staleTime` adicional (2-5 min según el hook)
   - **Ventaja:** Reduce llamadas al servidor y mejora performance en navegación

### ♻️ Invalidación automática

2. **Refresco inteligente:** Las mutations (`useCreateCourt`, `useUpdateCourt`, `useDeleteCourt`) invalidan automáticamente `queryKey: ['courts']` al completarse exitosamente. Esto significa:
   - ✅ Al crear una cancha → lista se refresca automáticamente
   - ✅ Al actualizar una cancha → lista y detalle se refrescan
   - ✅ Al desactivar una cancha → lista se actualiza sin reload manual

### 🔐 Autenticación

3. **Endpoints públicos vs privados:**

   ```typescript
   // Público (sin token) - Solo lectura de canchas activas
   api.get("/api/public/courts", false); // requiresAuth = false

   // Privado (con token) - Gestión completa
   api.get("/api/courts"); // requiresAuth = true (default)
   api.post("/api/courts", data); // requiresAuth = true (default)
   ```

### ⚠️ Manejo de errores centralizado

4. **Errores manejados automáticamente por `lib/api.ts`:**
   - **401 (No autorizado):** Lanza error "No autenticado"
   - **403 (Sesión expirada):** Limpia sesión + redirect a `/login`
   - **5XX (Error del servidor):** Muestra "Error del servidor. Intenta más tarde."
   - **No hay necesidad de duplicar esta lógica en tus componentes**

### 📍 Ubicación GPS

5. **Coordenadas opcionales pero recomendadas:**

   - ✅ **Con GPS:** Mapa interactivo, búsqueda por proximidad, navegación
   - ⚠️ **Sin GPS:** Solo dirección textual, funcionalidad limitada

   **Cómo obtener coordenadas:**

   ```typescript
   // En el navegador (web) o app móvil
   navigator.geolocation.getCurrentPosition((position) => {
     const lat = position.coords.latitude;
     const lon = position.coords.longitude;
     console.log(`GPS: ${lat}, ${lon}`);
   });

   // O usar Google Maps API para geocodificar dirección → coordenadas
   ```

### 🎨 Interfaz actualizable

6. **Estructura basada en el backend real:**
   - La interfaz `Court` refleja el schema de Prisma del backend
   - Campos principales: `id`, `name`, `location`, `latitude`, `longitude`, `userId`, `isIndoor`, `active`
   - **Si el backend cambia, actualiza las interfaces en consecuencia**

### 🧪 Testing recomendado

7. **Prueba estos escenarios:**
   - ✅ Crear cancha **sin GPS** → debe funcionar (lat/lon opcionales)
   - ✅ Crear cancha **con GPS** → debe almacenar coordenadas correctamente
   - ✅ Endpoint público **sin login** → debe devolver solo canchas activas
   - ✅ Endpoint privado **con login** → debe devolver todas las canchas (incluye inactivas)
   - ✅ Soft delete → cancha desactivada no aparece en endpoint público
   - ✅ Update de coordenadas → debe actualizar lat/lon correctamente
