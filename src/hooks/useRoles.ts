import { useQuery } from '@tanstack/react-query';
import { getRoles } from '../services/roles.service';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    staleTime: 1000 * 60 * 5, // 5 min (los roles cambian poco)
    gcTime: 1000 * 60 * 10,   // Mantener en cache 10 min sin suscriptores
  });
}
