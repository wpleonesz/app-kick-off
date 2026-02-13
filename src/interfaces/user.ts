/**
 * Interfaces para datos de usuario
 */

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  mobile?: string;
  role?: string;
  roles?: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  code?: string;
  name: string;
  description?: string;
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
