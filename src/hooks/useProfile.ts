import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "../config";
import queryClient from "../queryClient";

export const useProfile = () => {
  const query = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/auth/user`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed fetching profile");
      return res.json();
    },
  });

  // Función para refrescar el perfil manualmente
  const refreshProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  return { ...query, refreshProfile };
};
