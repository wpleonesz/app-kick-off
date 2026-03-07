/**
 * Componente de guardia por rol
 * Renderiza sus children solo si el usuario tiene el rol/permiso requerido
 */
import React from "react";
import { useUserRole, RoleCode } from "../../hooks/useUserRole";

interface RoleGuardProps {
  /** Roles permitidos (el usuario debe tener AL MENOS uno) */
  roles?: RoleCode[];
  /** Permiso específico requerido (ej: "courts.create") */
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

  // Si no se especificó ni roles ni permission, no renderizar nada
  if (!roles && !permission) return null;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;
