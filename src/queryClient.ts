import { QueryClient } from "@tanstack/react-query";

export const queryClient: QueryClient = new QueryClient();

// También exportar por defecto para compatibilidad con diferentes resoluciones
export default queryClient;
