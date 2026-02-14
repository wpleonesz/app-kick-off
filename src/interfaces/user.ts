/**
 * Interfaces para datos de usuario
 * Reflejan la estructura real del endpoint /api/auth/user
 */

export interface PersonData {
  id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  dni?: string;
  mobile?: string;
  photo?: string | null;
}

export interface Role {
  id: number;
  code?: string;
  name: string;
  description?: string;
  active?: boolean;
  moduleId?: number;
}

/** Relación muchos-a-muchos: Base_rolesOnUsers */
export interface RoleOnUser {
  roleId?: number;
  active?: boolean;
  Role?: Role;
}

export interface User {
  id: number;
  username: string;
  email: string;
  active?: boolean;
  personId?: number;
  createdDate?: string;
  modifiedDate?: string;

  // Datos planos (fallback si el backend los incluye directamente)
  name?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  mobile?: string;
  role?: string;

  // Relaciones anidadas (estructura real del backend)
  Person?: PersonData;
  roles?: RoleOnUser[];
}

export interface Access {
  read?: boolean;
  create?: boolean;
  write?: boolean;
  remove?: boolean;
}

export interface AccessPermissions {
  [key: string]: Access;
}
