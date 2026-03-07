# Taller 5: Control de Acceso Basado en Roles (RBAC) en Aplicaciones Moviles

## Informacion General

| Campo | Detalle |
|-------|---------|
| **Asignatura** | Desarrollo de Aplicaciones Moviles |
| **Tema** | Implementacion de RBAC en Ionic React |
| **Proyecto** | Kick Off - App Movil |
| **Prerequisitos** | Taller 4 (Seguridad, Sesiones y Control de Acceso) |

---

## 1. Objetivos de Aprendizaje

Al completar este taller, el estudiante sera capaz de:

1. Comprender el modelo RBAC (Role-Based Access Control) y su aplicacion en frontend movil
2. Implementar hooks personalizados para gestion de roles y permisos
3. Crear componentes de guardia (Guard Components) para proteger la interfaz
4. Seccionar una aplicacion movil segun el rol del usuario autenticado
5. Aplicar el principio de menor privilegio en la capa de presentacion

---

## 2. Marco Teorico

### 2.1 Que es RBAC?

**Role-Based Access Control (RBAC)** es un modelo de control de acceso donde los permisos no se asignan directamente a usuarios individuales, sino a **roles**. Los usuarios reciben uno o mas roles, y cada rol define un conjunto de permisos sobre los recursos del sistema.

```
Usuario --> Rol --> Permisos --> Recursos
```

**Componentes del modelo RBAC:**

| Componente | Descripcion | Ejemplo en Kick Off |
|------------|-------------|---------------------|
| **Sujeto** | Entidad que solicita acceso | Usuario autenticado |
| **Rol** | Agrupacion logica de permisos | player, owner, administrator |
| **Permiso** | Accion permitida sobre un recurso | courts.create, bookings.manage |
| **Recurso** | Objeto protegido | Canchas, Reservas, Horarios |

### 2.2 Jerarquia de Roles

En sistemas complejos, los roles pueden organizarse jerarquicamente, donde un rol superior hereda los permisos de los roles inferiores:

```
administrator (nivel 5)
    |
  owner (nivel 4)
    |
  organizer (nivel 3)
    |
  referee (nivel 2)
    |
  player (nivel 1)
```

Esto permite verificaciones como "tiene al menos nivel de owner" en lugar de listar cada rol individualmente.

### 2.3 RBAC en Frontend vs Backend

| Aspecto | Backend (API) | Frontend (App Movil) |
|---------|---------------|----------------------|
| **Proposito** | Seguridad real, proteger datos | UX, ocultar opciones no disponibles |
| **Confianza** | Es la fuente de verdad | Complementario, no sustituto |
| **Validacion** | Obligatoria en cada request | Visual, mejora experiencia |
| **Bypass** | No posible sin autenticacion | Posible manipulando el cliente |

> **Principio clave:** El frontend NUNCA debe ser la unica barrera de seguridad. El backend siempre debe validar permisos. El RBAC en frontend es para **mejorar la experiencia del usuario**, no para proteger datos.

### 2.4 Patron Guard Component

Un **Guard Component** es un patron de React que condiciona el renderizado de sus hijos basandose en una verificacion de acceso:

```tsx
// Patron conceptual
<RoleGuard roles={["owner", "administrator"]}>
  <BotonCrearCancha />
</RoleGuard>
```

Si el usuario no tiene el rol requerido, el componente simplemente no renderiza sus children (o muestra un fallback).

### 2.5 Modelo de Datos en Kick Off

El sistema utiliza el siguiente esquema relacional para RBAC:

```
Base_user (usuario)
    |
    +--> Base_rolesOnUsers (relacion M:N)
            |
            +--> Base_role (rol)
                    |
                    +--> Base_access (permisos)
                            |
                            +--> Base_entity (recurso/entidad)
```

**Roles disponibles:**

| Codigo | Nombre | Descripcion |
|--------|--------|-------------|
| `player` | Jugador | Puede ver canchas publicas y hacer reservas |
| `referee` | Arbitro | Similar a player con funciones de arbitraje |
| `organizer` | Organizador | Gestiona torneos y equipos |
| `owner` | Propietario | Gestiona sus propias canchas y horarios |
| `administrator` | Administrador | Acceso total al sistema |

---

## 3. Arquitectura de la Implementacion

### 3.1 Diagrama de Componentes

```
src/
 |-- hooks/
 |    |-- useUserRole.ts        <-- Hook central de RBAC
 |    |-- useRealtimeData.ts    <-- Provee datos del usuario (useProfile)
 |
 |-- components/
 |    |-- common/
 |    |    |-- RoleGuard.tsx     <-- Guard Component reutilizable
 |    |
 |    |-- SideMenu.tsx          <-- Menu lateral filtrado por rol
 |
 |-- pages/
 |    |-- Courts.tsx            <-- Acciones condicionadas por rol
 |    |-- Home.tsx              <-- Contenido adaptado al rol
 |    |-- Profile.tsx           <-- Muestra rol del usuario
 |
 |-- interfaces/
 |    |-- user.ts               <-- Interfaces Role, RoleOnUser, Access
```

### 3.2 Flujo de Datos

```
1. Usuario inicia sesion
2. API retorna datos del usuario con roles: [{ Role: { code, name } }]
3. useProfile() almacena y provee los datos reactivamente
4. useUserRole() extrae el codigo de rol y expone funciones de verificacion
5. RoleGuard y paginas usan useUserRole() para condicionar la UI
```

---

## 4. Implementacion Paso a Paso

### 4.1 Hook `useUserRole` - Centro de la Logica RBAC

**Archivo:** `src/hooks/useUserRole.ts`

Este hook encapsula toda la logica de verificacion de roles y permisos:

```typescript
import { useMemo } from "react";
import { useProfile } from "./useRealtimeData";

/** Codigos de rol del sistema */
export type RoleCode =
  | "player"
  | "referee"
  | "organizer"
  | "owner"
  | "administrator";

/** Jerarquia de roles (mayor numero = mas permisos) */
const ROLE_HIERARCHY: Record<RoleCode, number> = {
  player: 1,
  referee: 2,
  organizer: 3,
  owner: 4,
  administrator: 5,
};

/** Permisos por funcionalidad segun rol */
const ROLE_PERMISSIONS: Record<string, RoleCode[]> = {
  "courts.create": ["owner", "administrator"],
  "courts.edit": ["owner", "administrator"],
  "courts.delete": ["owner", "administrator"],
  "courts.viewOwn": ["owner", "administrator"],
  "schedules.create": ["owner", "administrator"],
  "schedules.edit": ["owner", "administrator"],
  "schedules.delete": ["owner", "administrator"],
  "bookings.create": ["player", "referee", "organizer", "owner", "administrator"],
  "bookings.manage": ["owner", "administrator"],
  "users.manage": ["administrator"],
  "system.settings": ["administrator"],
};

export function useUserRole() {
  const { data: user, isLoading } = useProfile();

  const roleCode = useMemo<RoleCode | null>(() => {
    const code = user?.roles?.[0]?.Role?.code;
    if (code && code in ROLE_HIERARCHY) return code as RoleCode;
    return null;
  }, [user]);

  const roleName = useMemo(() => {
    return user?.roles?.[0]?.Role?.name ?? user?.role ?? null;
  }, [user]);

  /** Verifica si el usuario tiene alguno de los roles indicados */
  const hasAnyRole = (roles: RoleCode[]): boolean => {
    if (!roleCode) return false;
    return roles.includes(roleCode);
  };

  /** Verifica si el rol del usuario tiene nivel >= al rol indicado */
  const hasMinRole = (minRole: RoleCode): boolean => {
    if (!roleCode) return false;
    return ROLE_HIERARCHY[roleCode] >= ROLE_HIERARCHY[minRole];
  };

  /** Verifica si el usuario tiene un permiso especifico */
  const can = (permission: string): boolean => {
    if (!roleCode) return false;
    const allowedRoles = ROLE_PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(roleCode);
  };

  /** Verifica si el usuario es duenio del recurso O tiene rol admin */
  const isOwnerOrAdmin = (resourceUserId: number): boolean => {
    if (!user?.id) return false;
    if (roleCode === "administrator") return true;
    return user.id === resourceUserId;
  };

  return {
    user, roleCode, roleName, isLoading,
    hasRole: (role: RoleCode) => roleCode === role,
    hasAnyRole, hasMinRole, can, isOwnerOrAdmin,
    isAdmin: roleCode === "administrator",
    isOwner: roleCode === "owner",
    isPlayer: roleCode === "player",
  };
}
```

**Conceptos clave:**

1. **`ROLE_HIERARCHY`**: Asigna un nivel numerico a cada rol para comparaciones jerarquicas
2. **`ROLE_PERMISSIONS`**: Mapea permisos granulares a los roles que los poseen
3. **`can(permission)`**: Verifica un permiso especifico (ej: `can("courts.create")`)
4. **`isOwnerOrAdmin(userId)`**: Combina propiedad del recurso + rol administrativo
5. **`hasMinRole(role)`**: Verifica nivel minimo en la jerarquia

### 4.2 Componente `RoleGuard` - Renderizado Condicional

**Archivo:** `src/components/common/RoleGuard.tsx`

```tsx
import React from "react";
import { useUserRole, RoleCode } from "../../hooks/useUserRole";

interface RoleGuardProps {
  /** Roles permitidos (el usuario debe tener AL MENOS uno) */
  roles?: RoleCode[];
  /** Permiso especifico requerido */
  permission?: string;
  /** Contenido alternativo si no tiene acceso */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  permission,
  fallback = null,
  children,
}) => {
  const { hasAnyRole, can, isLoading } = useUserRole();

  if (isLoading) return null;

  let hasAccess = false;

  if (roles && roles.length > 0) {
    hasAccess = hasAnyRole(roles);
  }

  if (permission) {
    hasAccess = hasAccess || can(permission);
  }

  if (!roles && !permission) return null;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;
```

**Formas de uso:**

```tsx
{/* Por roles especificos */}
<RoleGuard roles={["owner", "administrator"]}>
  <BotonCrear />
</RoleGuard>

{/* Por permiso */}
<RoleGuard permission="courts.create">
  <BotonCrear />
</RoleGuard>

{/* Con fallback */}
<RoleGuard
  roles={["administrator"]}
  fallback={<IonText>No tienes acceso a esta seccion</IonText>}
>
  <PanelAdmin />
</RoleGuard>
```

### 4.3 Seccionamiento de la Pagina de Canchas

**Archivo:** `src/pages/Courts.tsx`

La pagina de canchas es el ejemplo principal de RBAC aplicado:

```tsx
import { useUserRole } from "../hooks/useUserRole";
import RoleGuard from "../components/common/RoleGuard";

const Courts: React.FC = () => {
  // ── RBAC ──
  const { can, isOwnerOrAdmin } = useUserRole();
  const canManageCourts = can("courts.create");

  // Estado inicial depende del rol
  const [viewMode, setViewMode] = useState<ViewMode>(
    canManageCourts ? "auth" : "public",
  );

  // ...

  return (
    <IonPage>
      {/* Segmento Mis Canchas/Publicas: solo para owner/admin */}
      {canManageCourts && (
        <IonSegment value={viewMode} ...>
          <IonSegmentButton value="auth">Mis Canchas</IonSegmentButton>
          <IonSegmentButton value="public">Publicas</IonSegmentButton>
        </IonSegment>
      )}

      {/* Acciones por cancha: solo si es duenio o admin */}
      {filteredCourts.map((court) => {
        const courtEditable =
          viewMode === "auth" && isOwnerOrAdmin(court.userId);
        return (
          <CourtCard
            court={court}
            onEdit={courtEditable ? handleEdit : undefined}
            onDelete={courtEditable ? handleDelete : undefined}
            showActions={courtEditable}
          />
        );
      })}

      {/* FAB crear: solo owner/admin */}
      {canManageCourts && viewMode === "auth" && (
        <IonFab>
          <IonFabButton onClick={handleCreate}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      )}
    </IonPage>
  );
};
```

**Que ve cada rol:**

| Elemento | player | referee | organizer | owner | administrator |
|----------|--------|---------|-----------|-------|---------------|
| Canchas publicas | Si | Si | Si | Si | Si |
| Segmento "Mis Canchas" | No | No | No | Si | Si |
| Boton crear (+) | No | No | No | Si | Si |
| Editar cancha | No | No | No | Solo suyas | Todas |
| Eliminar cancha | No | No | No | Solo suyas | Todas |
| Gestionar horarios | No | No | No | Solo suyas | Todos |

### 4.4 Menu Lateral con Items Filtrados por Rol

**Archivo:** `src/components/SideMenu.tsx`

```typescript
interface MenuItem {
  icon: string;
  label: string;
  path?: string;
  action?: string;
  roles?: RoleCode[]; // Si no se define, visible para todos
}

const MENU_ITEMS: MenuItem[] = [
  { icon: personOutline, label: "Mi Perfil", path: "/tabs/perfil" },
  {
    icon: businessOutline,
    label: "Gestion de Canchas",
    path: "/tabs/canchas",
    roles: ["owner", "administrator"],
  },
  {
    icon: peopleOutline,
    label: "Gestion de Usuarios",
    action: "users",
    roles: ["administrator"],
  },
  // ... items sin roles son visibles para todos
];

// En el componente:
const { hasAnyRole } = useUserRole();

const visibleMenuItems = MENU_ITEMS.filter(
  (item) => !item.roles || hasAnyRole(item.roles),
);
```

**Resultado por rol:**

- **player/referee/organizer**: Ve "Mi Perfil", Configuracion, Notificaciones, Guardado
- **owner**: Adicionalmente ve "Gestion de Canchas"
- **administrator**: Ve todos los items incluyendo "Gestion de Usuarios" y "Administracion"

---

## 5. Patrones y Buenas Practicas

### 5.1 Principio de Menor Privilegio

> "Cada usuario debe tener solo los permisos minimos necesarios para realizar sus funciones."

En la implementacion:
- Un `player` solo ve canchas publicas y puede hacer reservas
- Un `owner` gestiona unicamente SUS canchas
- Solo `administrator` tiene acceso a todo el sistema

### 5.2 Verificacion Dual (Frontend + Backend)

```
[App Movil]                    [API Backend]
    |                               |
    |-- RoleGuard oculta boton -->  |
    |   (UX, no seguridad)          |
    |                               |
    |-- POST /api/courts ---------> |-- middleware/access.js
    |                               |   verifica rol en BD
    |                               |   (seguridad real)
    |   <-- 403 Forbidden ---------|
```

El frontend mejora la experiencia; el backend garantiza la seguridad.

### 5.3 Propiedad de Recursos

```typescript
// No basta con ser "owner" - debe ser duenio del recurso especifico
const isOwnerOrAdmin = (resourceUserId: number): boolean => {
  if (roleCode === "administrator") return true;  // Admin puede todo
  return user.id === resourceUserId;               // Duenio del recurso
};
```

### 5.4 Memoizacion de Valores Derivados

```typescript
const roleCode = useMemo<RoleCode | null>(() => {
  const code = user?.roles?.[0]?.Role?.code;
  if (code && code in ROLE_HIERARCHY) return code as RoleCode;
  return null;
}, [user]); // Solo recalcula cuando cambia el usuario
```

---

## 6. Ejercicios Practicos

### Ejercicio 1: Agregar un nuevo permiso
Agrega el permiso `"tournaments.create"` que solo este disponible para roles `organizer`, `owner` y `administrator`. Modifica `ROLE_PERMISSIONS` en `useUserRole.ts`.

### Ejercicio 2: Guard con fallback informativo
Crea un componente que use `RoleGuard` con un `fallback` que muestre un mensaje al usuario explicando que no tiene permisos, junto con un chip indicando que rol necesita.

### Ejercicio 3: Tab condicional
Agrega un cuarto tab "Torneos" en `App.tsx` que solo sea visible para roles `organizer`, `owner` y `administrator`. Usa `useUserRole` para filtrar el array de tabs.

### Ejercicio 4: Accion contextual por rol
En la pagina Home, muestra diferentes quick actions segun el rol:
- `player`: Partidos, Reservar, Equipos
- `owner`: Mis Canchas, Horarios, Reservas
- `administrator`: Todos los anteriores + Usuarios, Configuracion

### Ejercicio 5: Middleware de ruta
Implementa un componente `<ProtectedRoute>` que envuelva rutas completas y redirija a `/tabs/inicio` si el usuario no tiene el rol requerido para esa pagina.

---

## 7. Preguntas de Reflexion

1. **Por que el RBAC en frontend NO es suficiente como unica medida de seguridad?**

2. **Cual es la diferencia entre verificar `hasRole("owner")` y `isOwnerOrAdmin(court.userId)`? Cuando usarias cada uno?**

3. **Que sucederia si un usuario manipula el localStorage para cambiar su rol? Como se protege el sistema ante esto?**

4. **Por que usamos `useMemo` para calcular `roleCode` en lugar de calcularlo en cada render?**

5. **En que escenarios seria mejor usar `hasMinRole()` vs `hasAnyRole()`?**

---

## 8. Resumen de Archivos Modificados/Creados

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/hooks/useUserRole.ts` | **Creado** | Hook central de RBAC con jerarquia y permisos |
| `src/components/common/RoleGuard.tsx` | **Creado** | Guard Component para renderizado condicional |
| `src/pages/Courts.tsx` | **Modificado** | Acciones de cancha condicionadas por rol |
| `src/components/SideMenu.tsx` | **Modificado** | Menu lateral filtrado segun rol del usuario |

---

## 9. Referencias

- NIST RBAC Model: https://csrc.nist.gov/projects/role-based-access-control
- OWASP Access Control: https://owasp.org/www-community/Access_Control
- React Patterns - Conditional Rendering: https://react.dev/learn/conditional-rendering
- Ionic React Navigation Guards: https://ionicframework.com/docs/react/navigation
- Principio de Menor Privilegio (PoLP): https://en.wikipedia.org/wiki/Principle_of_least_privilege
