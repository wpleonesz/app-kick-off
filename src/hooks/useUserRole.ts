/**
 * Hook para obtener el rol del usuario actual y verificar permisos
 * Centraliza la lógica de RBAC en la app móvil
 */
import { useMemo } from "react";
import { useProfile } from "./useRealtimeData";

/** Códigos de rol del sistema */
export type RoleCode =
  | "player"
  | "referee"
  | "organizer"
  | "owner"
  | "administrator";

/** Jerarquía de roles (mayor número = más permisos) */
const ROLE_HIERARCHY: Record<RoleCode, number> = {
  player: 1,
  referee: 2,
  organizer: 3,
  owner: 4,
  administrator: 5,
};

/** Permisos por funcionalidad según rol */
const ROLE_PERMISSIONS: Record<string, RoleCode[]> = {
  // Canchas
  "courts.create": ["owner", "administrator"],
  "courts.edit": ["owner", "administrator"],
  "courts.delete": ["owner", "administrator"],
  "courts.viewOwn": ["owner", "administrator"],

  // Horarios
  "schedules.create": ["owner", "administrator"],
  "schedules.edit": ["owner", "administrator"],
  "schedules.delete": ["owner", "administrator"],

  // Reservas
  "bookings.create": ["player", "referee", "organizer", "owner", "administrator"],
  "bookings.manage": ["owner", "administrator"],

  // Gestión de usuarios
  "users.manage": ["administrator"],

  // Configuración del sistema
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

  /** Verifica si el usuario tiene un rol específico */
  const hasRole = (role: RoleCode): boolean => {
    return roleCode === role;
  };

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

  /** Verifica si el usuario tiene un permiso específico */
  const can = (permission: string): boolean => {
    if (!roleCode) return false;
    const allowedRoles = ROLE_PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(roleCode);
  };

  /** Verifica si el usuario es dueño del recurso O tiene rol admin */
  const isOwnerOrAdmin = (resourceUserId: number): boolean => {
    if (!user?.id) return false;
    if (roleCode === "administrator") return true;
    return user.id === resourceUserId;
  };

  return {
    user,
    roleCode,
    roleName,
    isLoading,
    hasRole,
    hasAnyRole,
    hasMinRole,
    can,
    isOwnerOrAdmin,
    isAdmin: roleCode === "administrator",
    isOwner: roleCode === "owner",
    isPlayer: roleCode === "player",
  };
}
