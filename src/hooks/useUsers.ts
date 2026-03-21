import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../services/users.service";

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        return await getUsers();
      } catch {
        return [];
      }
    },
    enabled,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 5,
  });
}
