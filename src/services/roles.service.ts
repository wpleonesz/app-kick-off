import api from '../lib/api';

export interface RoleOption {
  id: number;
  code: string;
  name: string;
}

export async function getRoles(): Promise<RoleOption[]> {
  return api.get<RoleOption[]>('/api/public/roles', false);
}
