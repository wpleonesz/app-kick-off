# Taller 4: Control de Acceso, Almacenamiento de Credenciales y Persistencia de Sesion en Apps Moviles

## Objetivos de Aprendizaje

Al finalizar este taller, el estudiante sera capaz de:

1. Implementar un flujo completo de autenticacion (signin/signup/signout) en una app movil Ionic + Capacitor
2. Almacenar credenciales de forma segura usando almacenamiento multicapa (localStorage, Capacitor Preferences, Ionic Storage)
3. Implementar persistencia de sesion con auto-login y validacion periodica
4. Aplicar control de acceso basado en roles (RBAC) tanto en rutas como en la UI
5. Construir un cliente HTTP con interceptores de autenticacion automaticos

---

## Marco Teorico

### 1. Autenticacion vs Autorizacion

Estos dos conceptos se confunden frecuentemente pero son fundamentalmente distintos:

| Concepto | Pregunta que responde | Ejemplo |
|----------|----------------------|---------|
| **Autenticacion** | Quien eres? | Login con usuario y contrasena |
| **Autorizacion** | Que puedes hacer? | Solo los "owner" pueden crear canchas |

**Autenticacion** verifica la identidad del usuario. **Autorizacion** determina que recursos o acciones puede ejecutar ese usuario autenticado.

### 2. Sesiones en Aplicaciones Moviles

A diferencia de las aplicaciones web donde el navegador maneja cookies automaticamente, en apps moviles nativas el manejo de sesion requiere estrategias especiales:

```
Aplicacion Web (Navegador):
  Cookie de sesion → Enviada automaticamente en cada request
  Almacenamiento → Gestionado por el navegador

Aplicacion Movil Nativa (Capacitor/React Native):
  Cookie de sesion → NO se envia automaticamente
  Token JWT → Almacenado manualmente por la app
  Almacenamiento → Multiples capas segun la plataforma
```

### 3. Modelo RBAC (Role-Based Access Control)

RBAC es un modelo de autorizacion donde los permisos se asignan a **roles**, y los usuarios se asignan a roles. Esto simplifica la gestion de permisos:

```
                    +--------+
                    | Usuario|
                    +---+----+
                        |
                   asignado a
                        |
                    +---v----+
                    |  Rol   |  (player, owner, admin)
                    +---+----+
                        |
                   tiene permisos
                        |
                +-------v--------+
                | Permisos CRUD  |
                | read | create  |
                | write | remove |
                +----------------+
                        |
                   sobre entidades
                        |
                +-------v--------+
                |   Entidades    |
                | courts, users  |
                | bookings, etc  |
                +----------------+
```

### 4. Esquema de Base de Datos para RBAC

En nuestro sistema, el modelo RBAC esta definido en Prisma con las siguientes tablas:

```prisma
model Base_role {
  id          Int                 @id @default(autoincrement())
  code        String?             @unique   // "player", "owner", "admin"
  name        String?
  description String
  access      Base_access[]       // Permisos del rol
  users       Base_rolesOnUsers[] // Usuarios con este rol
  menus       Base_rolesOnMenus[] // Menus visibles para este rol
  active      Boolean             @default(true)
}

model Base_rolesOnUsers {
  Role   Base_role @relation(fields: [roleId], references: [id])
  roleId Int
  User   Base_user @relation(fields: [userId], references: [id])
  userId Int
  active Boolean   @default(true)
  @@id([roleId, userId])  // Clave compuesta
}

model Base_access {
  id       Int         @id @default(autoincrement())
  Entity   Base_entity @relation(fields: [entityId], references: [id])
  entityId Int
  Role     Base_role   @relation(fields: [roleId], references: [id])
  roleId   Int
  read     Boolean     @default(false)
  create   Boolean     @default(false)
  write    Boolean     @default(false)
  remove   Boolean     @default(false)
  @@unique([entityId, roleId])  // Un rol tiene un registro de permisos por entidad
}

model Base_entity {
  id       Int           @id @default(autoincrement())
  code     String        @unique   // "courts", "bookings", "users"
  name     String
  access   Base_access[]
}
```

**Relaciones clave:**
- Un **usuario** puede tener **multiples roles** (tabla pivote `Base_rolesOnUsers`)
- Un **rol** puede tener **multiples permisos** sobre diferentes **entidades** (tabla `Base_access`)
- Cada permiso define operaciones CRUD: `read`, `create`, `write`, `remove`

**Ejemplo de datos:**

| Rol | Entidad | read | create | write | remove |
|-----|---------|------|--------|-------|--------|
| player | courts | true | false | false | false |
| player | bookings | true | true | true | false |
| owner | courts | true | true | true | true |
| owner | bookings | true | true | true | true |
| admin | courts | true | true | true | true |
| admin | users | true | true | true | true |

---

## Parte 1: Flujo de Autenticacion

### 1.1 Arquitectura del Flujo

```
+------------+     POST /api/auth/signin     +------------+
|            | ----------------------------→ |            |
|  App Movil |                               |  Servidor  |
|  (Ionic)   | ←---------------------------- |  (Next.js) |
|            |   { user, token, Set-Cookie } |            |
+-----+------+                               +------------+
      |
      | Guardar en 3 capas:
      |
      ├─→ localStorage (acceso sincrono rapido)
      ├─→ Capacitor Preferences (persistente nativo)
      └─→ Ionic Storage (IndexedDB/SQLite)
```

### 1.2 Servicio de Autenticacion (`services/auth.service.ts`)

Este es el servicio central que orquesta todo el proceso de login, registro y logout.

```typescript
// services/auth.service.ts

import api from "../lib/api";
import { profileData } from "../storage";
import { Preferences } from "@capacitor/preferences";
import queryClient from "../queryClient";
import { sessionGuard } from "./session-guard.service";
import { device } from "../lib/device";

const TOKEN_KEY = "app_kickoff_token";
const USER_KEY = "app_kickoff_user";
const AUTH_KEY = "app_kickoff_authenticated";

// Interfaces que definen la estructura de los datos
export interface Credentials {
  username: string;
  password: string;
}

export interface UserData {
  id?: number;
  username: string;
  email?: string;
  name?: string;
  roles?: Role[];
  token?: string;
  dni?: string;
}

/**
 * Iniciar sesion
 * Flujo:
 * 1. Enviar credenciales al servidor
 * 2. Almacenar token y datos en 3 capas de storage
 * 3. Inicializar servicios dependientes (device, session guard)
 * 4. Invalidar cache de React Query
 */
async function signin(credentials: Credentials): Promise<UserData> {
  if (!credentials.username || !credentials.password) {
    throw new Error("Credenciales invalidas");
  }

  const data = await api.post<UserData>(
    "/api/auth/signin",
    credentials,
    false,  // No requiere autenticacion previa
  );

  // Capa 1: localStorage (sincrono, rapido, no persiste en reinstalacion)
  localStorage.setItem(AUTH_KEY, "true");

  // Capa 2: Capacitor Preferences (asincrono, persiste en reinstalacion)
  await Preferences.set({ key: AUTH_KEY, value: "true" });

  // Guardar token si el servidor lo proporciona
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
    await Preferences.set({ key: TOKEN_KEY, value: data.token });
  }

  // Guardar informacion del usuario
  const userInfo: UserData = {
    id: data.id,
    username: data.username,
    email: data.email,
    name: data.name,
    roles: (data as any).roles,
    dni: (data as any).dni,
  };

  // Capa 1 + 2: datos del usuario
  localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
  await Preferences.set({ key: USER_KEY, value: JSON.stringify(userInfo) });

  // Capa 3: Ionic Storage (IndexedDB en web, SQLite en nativo)
  await profileData.set(userInfo);

  // Inicializar servicios post-login
  await device.init();           // Identificador unico del dispositivo
  sessionGuard.init();           // Validacion periodica de sesion

  // Invalidar cache para refrescar datos del usuario
  await queryClient.invalidateQueries({ queryKey: ["profile"] });

  return userInfo;
}
```

**Por que 3 capas de almacenamiento?**

| Capa | Tecnologia | Velocidad | Persistencia | Uso |
|------|-----------|-----------|-------------|-----|
| 1 | `localStorage` | Sincrono (instantaneo) | No sobrevive reinstalacion | Verificaciones rapidas en el render |
| 2 | `Capacitor Preferences` | Asincrono (~1ms) | Sobrevive reinstalacion | Auto-login al reabrir la app |
| 3 | `Ionic Storage` | Asincrono (~5ms) | SQLite nativo / IndexedDB web | Datos estructurados del perfil |

### 1.3 Cierre de Sesion

El logout debe limpiar absolutamente todo para evitar fugas de datos:

```typescript
async function signout(): Promise<void> {
  // 1. Bloquear nuevos requests durante el logout
  sessionGuard.setSessionClosing();

  try {
    // 2. Notificar al servidor
    await api.post("/api/auth/signout", {}, true);
  } catch (err) {
    console.error("Error al cerrar sesion:", err);
  } finally {
    // 3. Limpiar TODAS las capas de almacenamiento
    // Capa 1: localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_KEY);

    // Capa 2: Capacitor Preferences
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: AUTH_KEY });
    await Preferences.remove({ key: USER_KEY });
    await Preferences.remove({ key: "session_cookie" });

    // Capa 3: Ionic Storage
    await profileData.clear();

    // 4. Limpiar cache HTTP
    api.clearCache();

    // 5. Limpiar session guard
    sessionGuard.cleanup();
  }
}
```

### 1.4 Validacion de Formularios con Zod

Los formularios de login y registro usan **Zod** para validacion de esquemas:

```typescript
// schemas/auth.schemas.ts
import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "El usuario es obligatorio")
    .min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z
    .string()
    .min(1, "La contrasena es obligatoria")
    .min(6, "La contrasena debe tener al menos 6 caracteres"),
});

// Validacion de cedula ecuatoriana (algoritmo modulo 10)
const isValidEcuadorianCedula = (cedula: string) => {
  if (!/^[0-9]{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;
  // ... algoritmo de verificacion de digito verificador
};

// Politica de contrasena: mayuscula + minuscula + digito + caracter especial
const isValidPassword = (v: unknown) => {
  if (typeof v !== "string") return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#\$\*])[A-Za-z\d@#\$\*]+$/.test(v);
};

export const registerSchema = z.object({
  dni: z.string().refine(isValidEcuadorianCedula, {
    message: "El DNI no es una cedula ecuatoriana valida",
  }),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresa un email valido"),
  username: z.string().min(3).max(20),
  roleId: z.number().int().positive("Selecciona un rol"),
  password: z.string().min(6).max(50)
    .refine(isValidPassword, {
      message: "Debe tener mayusculas, minusculas, numeros y al menos uno de @ # $ *",
    }),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contrasenas no coinciden",
  path: ["confirmPassword"],
});
```

**Ventajas de Zod sobre validacion manual:**
- Definicion declarativa de reglas
- Inferencia automatica de tipos TypeScript (`z.infer<typeof schema>`)
- Mensajes de error personalizados
- Composicion de validaciones (`.refine()` para reglas custom)
- Integracion directa con React Hook Form via `zodResolver`

### 1.5 Integracion con React Hook Form

```tsx
// pages/Login.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "../schemas/auth.schemas";

const Login: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),  // Zod maneja la validacion
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authService.signin(data);
      window.location.href = "/tabs/inicio";
    } catch (err: any) {
      showError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput name="username" control={control} label="Usuario"
        error={errors.username?.message} />
      <FormInput name="password" control={control} label="Contrasena"
        type="password" error={errors.password?.message} />
      <IonButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? <IonSpinner /> : "Iniciar Sesion"}
      </IonButton>
    </form>
  );
};
```

---

## Parte 2: Almacenamiento Seguro de Credenciales

### 2.1 Arquitectura Multicapa

```
+----------------------------------------------------+
|                    App Movil                        |
|                                                    |
|  +------------------+  +-----------------------+   |
|  |   localStorage   |  | Capacitor Preferences |   |
|  |   (Sincrono)     |  |   (Nativo Async)      |   |
|  |                  |  |                        |   |
|  | token            |  | token                  |   |
|  | authenticated    |  | authenticated          |   |
|  | user (JSON)      |  | user (JSON)            |   |
|  +------------------+  | session_cookie         |   |
|                        +-----------------------+   |
|                                                    |
|  +----------------------------------------------+  |
|  |           Ionic Storage (DAO Pattern)         |  |
|  |                                               |  |
|  |  profileData     accessData                   |  |
|  |  .get()          .get()                       |  |
|  |  .set(data)      .set(data)                   |  |
|  |  .add(key,val)   .add(key,val)                |  |
|  |  .clear()        .clear()                     |  |
|  +----------------------------------------------+  |
+----------------------------------------------------+
```

### 2.2 Patron DAO para Storage (`storage/profile.ts`)

El patron DAO (Data Access Object) abstrae el acceso al almacenamiento, permitiendo cambiar la implementacion sin afectar el resto de la app:

```typescript
// storage/store.ts - Storage centralizado
import { Storage } from "@ionic/storage";

const store = new Storage();

export const initStorage = async (): Promise<void> => {
  await store.create();  // Inicializa IndexedDB (web) o SQLite (nativo)
};

export default store;
```

```typescript
// storage/profile.ts - DAO de perfil
import store from "./store";

const KEY = "profile";

const get = async (key?: string): Promise<any> => {
  const data = await store.get(KEY);
  if (key && data) return data[key]; // Acceder a un campo especifico
  return data;
};

const set = async (data: any): Promise<void> => {
  await store.set(KEY, data);
};

const add = async (id: string, data: any): Promise<void> => {
  const storage = (await get()) || {};
  storage[id] = data;
  await set(storage);
};

const clear = async (): Promise<void> => {
  await store.remove(KEY);
};

export const profileData = { get, set, add, clear };
```

```typescript
// storage/access.ts - DAO de permisos
import store from "./store";
const KEY = "access";

const get = async (key?: string): Promise<any> => {
  const data = await store.get(KEY);
  if (key && data) return data[key];
  return data;
};

const set = async (data: any): Promise<void> => {
  await store.set(KEY, data);
};

const clear = async (): Promise<void> => {
  await store.remove(KEY);
};

export const accessData = { get, set, add, clear };
```

**Ventajas del patron DAO:**
- Encapsulamiento: el resto de la app no sabe que motor de almacenamiento se usa
- Consistencia: todas las operaciones de storage siguen la misma interfaz
- Testabilidad: se puede mockear facilmente para tests unitarios

### 2.3 Sincronizacion entre Capas

Al iniciar la app, se sincronizan los datos de Capacitor Preferences (persistente nativo) hacia localStorage (sincrono rapido):

```typescript
// App.tsx - Inicializacion
useEffect(() => {
  const initialize = async () => {
    await initStorage();  // Inicializar Ionic Storage

    // Sincronizar Preferences → localStorage
    try {
      const auth = await Preferences.get({ key: "app_kickoff_authenticated" });
      const token = await Preferences.get({ key: "app_kickoff_token" });
      const user = await Preferences.get({ key: "app_kickoff_user" });

      if (auth?.value) localStorage.setItem("app_kickoff_authenticated", auth.value);
      if (token?.value) localStorage.setItem("app_kickoff_token", token.value);
      if (user?.value) localStorage.setItem("app_kickoff_user", user.value);
    } catch (e) {
      console.warn("Error sincronizando Preferences -> localStorage", e);
    }

    // Verificar autenticacion
    const authenticated = await authService.isAuthenticatedAsync();
    setIsAuthenticated(authenticated);
    setIsReady(true);
  };
  initialize();
}, []);
```

### 2.4 Comparativa de Metodos de Almacenamiento

| Caracteristica | localStorage | Capacitor Preferences | Ionic Storage |
|---------------|-------------|----------------------|---------------|
| **API** | Sincrona | Asincrona | Asincrona |
| **Motor (Web)** | Web Storage | Web Storage | IndexedDB |
| **Motor (iOS)** | N/A | UserDefaults | SQLite |
| **Motor (Android)** | N/A | SharedPreferences | SQLite |
| **Encriptacion** | No | No (pero aislado) | Configurable |
| **Limite** | ~5-10MB | Sin limite practico | Sin limite |
| **Persistencia** | Hasta limpiar cache | Hasta desinstalar | Hasta desinstalar |
| **Uso ideal** | Flags rapidos | Tokens, preferencias | Datos estructurados |

---

## Parte 3: Persistencia de Sesion

### 3.1 Session Guard Service

El `SessionGuardService` protege la sesion del usuario verificando periodicamente que sigue siendo valida:

```typescript
// services/session-guard.service.ts

class SessionGuardService {
  isSessionClosing = false;         // Flag: logout en progreso
  private checkInterval = 5 * 60 * 1000;  // 5 minutos
  private lastSessionCheck = 0;
  private sessionCheckTimer: NodeJS.Timeout | null = null;

  /**
   * Inicializar: arrancar verificacion periodica
   * Se llama despues de un login exitoso
   */
  init() {
    if (this.sessionCheckTimer) clearInterval(this.sessionCheckTimer);
    this.sessionCheckTimer = setInterval(() => {
      this.verifySession();
    }, this.checkInterval);
  }

  /**
   * Cleanup: detener verificaciones
   * Se llama durante el logout
   */
  cleanup() {
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
      this.sessionCheckTimer = null;
    }
    this.isSessionClosing = false;
  }

  /**
   * Marcar que el logout esta en progreso
   * Previene race conditions donde requests en vuelo
   * interfieren con el proceso de limpieza
   */
  setSessionClosing() {
    this.isSessionClosing = true;
  }

  /**
   * Verificar sesion contra el servidor
   * Si falla con 401/403, forzar logout
   */
  async verifySession(): Promise<boolean> {
    try {
      const now = Date.now();
      // Throttle: no verificar mas de una vez por minuto
      if (now - this.lastSessionCheck < 60_000) return true;
      this.lastSessionCheck = now;

      const user = await api.get('/api/auth/user', true);
      if (!user) {
        this.forceLogout();
        return false;
      }
      return true;
    } catch (error) {
      if (error.message.includes('No autorizado') ||
          error.message.includes('Sesion expirada')) {
        this.forceLogout();
        return false;
      }
      return true;  // Error de red: mantener sesion activa
    }
  }

  /**
   * Logout forzado por sesion invalida
   */
  async forceLogout() {
    this.setSessionClosing();
    try {
      await authService.signout();
    } catch (err) { /* ignorar errores durante logout forzado */ }
    window.location.href = '/login';
  }
}

export const sessionGuard = new SessionGuardService();
```

### 3.2 Diagrama de Flujo del Session Guard

```
         App Inicio
             |
     +-------v--------+
     | init()          |
     | setInterval     |
     | cada 5 minutos  |
     +-------+---------+
             |
     +-------v--------+
     | verifySession() |
     +-------+---------+
             |
     +-------v---------+
     | GET /api/auth/   |
     |     user         |
     +----+--------+----+
          |        |
      200 OK    401/403
          |        |
     +----v---+ +--v--------+
     | Sesion | | forceLogout|
     | valida | |            |
     +--------+ | signout()  |
                | redirect   |
                | /login     |
                +------------+
```

### 3.3 Auto-Login al Reabrir la App

```typescript
// App.tsx
const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initStorage();

      // Sincronizar Preferences → localStorage
      // (Preferences persisten entre cierres de app)
      const auth = await Preferences.get({ key: "app_kickoff_authenticated" });
      if (auth?.value) localStorage.setItem("app_kickoff_authenticated", auth.value);

      // Verificar autenticacion via Preferences (persistente)
      const authenticated = await authService.isAuthenticatedAsync();
      setIsAuthenticated(authenticated);
      setIsReady(true);
    };
    initialize();

    // Refrescar datos cuando la app vuelve del background
    const appStateListener = CapApp.addListener("appStateChange",
      ({ isActive }) => {
        if (isActive) queryClient.invalidateQueries();
      }
    );

    return () => {
      appStateListener.then((l) => l.remove());
    };
  }, []);
```

**Flujo de auto-login:**
1. La app se abre
2. Se lee `app_kickoff_authenticated` de Capacitor Preferences
3. Si es `"true"`, el usuario ya esta autenticado sin necesidad de ingresar credenciales
4. Si la sesion del servidor ya expiro, el Session Guard detectara el 401/403 y forzara logout

---

## Parte 4: Control de Acceso por Roles (RBAC)

### 4.1 Obtencion de Roles

Los roles disponibles se obtienen desde un endpoint publico:

```typescript
// services/roles.service.ts
import api from '../lib/api';

export interface RoleOption {
  id: number;
  code: string;  // "player", "owner", "referee", "admin"
  name: string;
}

export async function getRoles(): Promise<RoleOption[]> {
  return api.get<RoleOption[]>('/api/public/roles', false);
}
```

```typescript
// hooks/useRoles.ts - Hook con cache de 5 minutos
import { useQuery } from '@tanstack/react-query';
import { getRoles } from '../services/roles.service';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    staleTime: 1000 * 60 * 5,   // Los roles cambian poco: cache 5 min
    gcTime: 1000 * 60 * 10,     // Mantener en cache 10 min sin suscriptores
  });
}
```

### 4.2 Proteccion de Rutas

Las rutas se protegen en `App.tsx` verificando el estado de autenticacion:

```tsx
// App.tsx - Route Guards
<IonReactRouter>
  <IonRouterOutlet>
    {/* Rutas publicas */}
    <Route exact path="/login">
      {isAuthenticated ? <Redirect to="/tabs/inicio" /> : <Login />}
    </Route>
    <Route exact path="/register" component={Register} />

    {/* Rutas protegidas - requieren autenticacion */}
    <Route path="/tabs">
      {!isAuthenticated ? (
        <Redirect to="/login" />
      ) : (
        <TabsSection />
      )}
    </Route>

    {/* Ruta por defecto */}
    <Route exact path="/">
      <Redirect to={isAuthenticated ? "/tabs/inicio" : "/login"} />
    </Route>
  </IonRouterOutlet>
</IonReactRouter>
```

**Flujo de proteccion:**
- Usuario NO autenticado intenta acceder a `/tabs/*` → Redirigido a `/login`
- Usuario autenticado intenta acceder a `/login` → Redirigido a `/tabs/inicio`
- Ruta raiz `/` → Redirige segun el estado de autenticacion

### 4.3 RBAC en el Backend (Verificacion en el Servidor)

El backend verifica permisos por rol en cada endpoint protegido usando el middleware `access`:

```javascript
// Ejemplo: middleware/access.js (backend kick-off-v2)
const access = (entityCode) => {
  return async (request, _, next) => {
    if (request.user) {
      if (request.user.id === 1) return next(); // Admin bypass

      const cacheKey = `access:entity:${request.user.id}:${entityCode}`;
      const cached = await getCache(cacheKey);

      if (cached) {
        request.access = cached.length === 0
          ? { Entity: { code: entityCode } }
          : cached[0];
      } else {
        const access = await db.access
          .user(request.user)
          .entities([entityCode])
          .getAll();
        await setCache(cacheKey, access, TTL.USER_ACCESS);
        request.access = access.length > 0 ? access[0] : { Entity: { code: entityCode } };
      }
    }
    next();
  };
};

// Uso en un endpoint:
handler
  .use(auth)
  .use(api)
  .use(access('courts'))    // Verificar permisos sobre entidad "courts"
  .use(database(CourtsData))
  .get((request) => {
    request.do('read', async (api, prisma) => {
      // Solo llega aqui si el rol del usuario tiene read=true para "courts"
      const result = await prisma.courts.getAll();
      return api.successMany(result);
    });
  });
```

### 4.4 Rol del Usuario en la UI

Los roles se muestran en la UI con indicadores visuales:

```tsx
// Ejemplo: mostrar badge de rol en el perfil
const roleColors: Record<string, string> = {
  player: "primary",       // Azul
  referee: "warning",      // Naranja
  organizer: "success",    // Verde
  owner: "secondary",      // Morado
  administrator: "danger", // Rojo
};

const Profile: React.FC = () => {
  const user = authService.getCurrentUser();
  const roleName = user?.roles?.[0]?.name || "Sin rol";
  const roleCode = user?.roles?.[0]?.code || "player";

  return (
    <IonBadge color={roleColors[roleCode]}>
      {roleName}
    </IonBadge>
  );
};
```

---

## Parte 5: Cliente HTTP con Interceptores

### 5.1 Headers de Autenticacion Automaticos

Cada request incluye automaticamente el token y la cookie de sesion:

```typescript
// lib/api.ts
async function commonHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Token Bearer
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Cookie de sesion (capturada del servidor en login)
  const { value: cookie } = await Preferences.get({ key: "session_cookie" });
  if (cookie) {
    headers["Cookie"] = cookie;
  }

  // Headers del dispositivo (para auditoria)
  const deviceHeaders = await device.getHeaders();
  Object.assign(headers, deviceHeaders);
  // Resultado: X-Device-UUID, X-Device-Platform, X-App-Version

  return headers;
}
```

### 5.2 Manejo de Respuestas de Sesion

```typescript
async function handleResponse(response: HttpResponse): Promise<any> {
  // Capturar cookie de sesion del servidor
  if (response.status === 200 || response.status === 201) {
    const rawCookie = response.headers?.["Set-Cookie"]
      || response.headers?.["set-cookie"];
    if (rawCookie) {
      const cookieValue = rawCookie.split(";")[0].trim();
      await Preferences.set({ key: "session_cookie", value: cookieValue });
    }
  }

  // Sesion expirada: forzar logout
  if (response.status === 403) {
    await Preferences.remove({ key: "session_cookie" });
    await logout();
    window.location.href = "/login";
    throw new Error("Sesion expirada");
  }

  if (response.status === 401) {
    throw new Error("No autorizado");
  }

  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }

  throw new Error(response.data?.message || `Error ${response.status}`);
}
```

### 5.3 Bloqueo de Requests durante Logout

El Session Guard previene race conditions durante el logout:

```typescript
async function request(method, endpoint, body?, options?) {
  // Si el logout esta en progreso, NO enviar mas requests
  if (sessionGuard.isSessionClosing) {
    throw new Error("Sesion cerrada: cuenta desactivada");
  }
  // ... continuar con el request
}
```

### 5.4 Request Balancer (Optimizaciones del Cliente HTTP)

El Request Balancer agrega 5 optimizaciones al cliente HTTP:

```typescript
// lib/request-balancer.ts

class RequestBalancer {
  maxConcurrent = 6;     // Maximo 6 requests simultaneos
  defaultTTL = 30_000;   // Cache de 30 segundos para GETs
  maxRetries = 2;        // 2 reintentos automaticos

  // 1. CACHE: evitar requests repetidos
  async get<T>(key: string, fn: () => Promise<T>, ttl?: number) {
    const cached = this.getFromCache(key);
    if (cached) return cached;  // Cache hit

    // 2. DEDUPLICACION: si ya hay un request en vuelo, esperar
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    // 3. COLA CON PRIORIDAD: auth es CRITICAL, datos de usuario es HIGH
    const priority = this.detectPriority(key);
    const promise = this.enqueue(() => fn(), priority)
      .then((data) => {
        this.setCache(key, data, ttl);
        return data;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  // 4. RETRY CON BACKOFF: reintentar en errores temporales
  async executeWithRetry<T>(fn, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = [429, 503, 502].includes(error?.status);
      if (isRetryable && attempt < this.maxRetries) {
        // 5. JITTER: delay aleatorio para evitar thundering herd
        const delay = this.baseDelay * Math.pow(2, attempt);
        const jitter = delay * (0.75 + Math.random() * 0.5);
        await new Promise(r => setTimeout(r, jitter));
        return this.executeWithRetry(fn, attempt + 1);
      }
      throw error;
    }
  }
}
```

**Prioridades automaticas:**
- `CRITICAL (0)`: `/api/auth/*` - Login, signup
- `HIGH (1)`: `/api/user/*`, `/api/public/roles` - Datos del usuario
- `NORMAL (2)`: Todo lo demas
- `LOW (3)`: Noticias, avisos no urgentes

---

## Resumen de Archivos del Proyecto

| Archivo | Responsabilidad |
|---------|----------------|
| `services/auth.service.ts` | Login, signup, logout, verificacion de autenticacion |
| `services/auth.ts` | Funciones helper legacy (getToken, getCurrentUser) |
| `services/session-guard.service.ts` | Validacion periodica de sesion, logout forzado |
| `services/roles.service.ts` | Obtener roles disponibles desde el servidor |
| `lib/api.ts` | Cliente HTTP con headers automaticos y manejo de sesion |
| `lib/request-balancer.ts` | Cache, deduplicacion, cola, retry con backoff |
| `lib/device.ts` | Identificacion unica del dispositivo |
| `storage/store.ts` | Ionic Storage singleton |
| `storage/profile.ts` | DAO de datos del perfil de usuario |
| `storage/access.ts` | DAO de permisos de acceso |
| `schemas/auth.schemas.ts` | Validacion de formularios con Zod |
| `hooks/useRoles.ts` | Hook React Query para roles con cache |
| `App.tsx` | Route guards, inicializacion, auto-login |

---

## Evaluacion

### Criterios de evaluacion:

1. **(20%)** Explicar el flujo completo de autenticacion: desde que el usuario ingresa credenciales hasta que la app muestra la pantalla principal. Identificar en que momento se almacena cada dato y en que capa.

2. **(20%)** Implementar un componente `<RoleGuard role="owner">` que envuelva contenido y solo lo muestre si el usuario tiene el rol especificado. Ejemplo: `<RoleGuard role="owner"><CreateCourtButton /></RoleGuard>`

3. **(20%)** Explicar por que se usan 3 capas de almacenamiento y que pasaria si solo se usara localStorage en una app nativa.

4. **(20%)** Dibujar un diagrama de secuencia del Session Guard cuando detecta una sesion expirada (desde la verificacion periodica hasta la redireccion al login).

5. **(20%)** Modificar el endpoint de canchas en el backend para que solo los usuarios con rol "owner" puedan crear canchas, usando el middleware `access('courts')` y verificando `request.access.create === true`.

### Entregables:

- Documento con las respuestas teoricas y diagramas
- Codigo fuente del componente `RoleGuard`
- Capturas de pantalla del flujo de login y del session guard funcionando en la consola

---

## Referencias

- [Capacitor Preferences Documentation](https://capacitorjs.com/docs/apis/preferences)
- [Ionic Storage Documentation](https://github.com/ionic-team/ionic-storage)
- [OWASP Mobile Security - Authentication](https://owasp.org/www-project-mobile-top-10/)
- [Zod Documentation](https://zod.dev/)
- [React Query (TanStack Query)](https://tanstack.com/query/latest)
- [RBAC - Role-Based Access Control (NIST)](https://csrc.nist.gov/projects/role-based-access-control)
