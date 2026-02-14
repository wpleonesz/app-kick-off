import { QueryClient } from "@tanstack/react-query";

// Instancia única compartida en toda la app
// App.tsx la usa en QueryClientProvider
// auth.service.ts y hooks la importan directamente para invalidaciones
export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // No funciona en Capacitor; usamos appStateChange
      refetchOnReconnect: true,
      gcTime: 1000 * 60 * 5,      // Cache 5 minutos
      staleTime: 1000 * 10,       // Datos frescos 10 segundos
      retry: 2,
    },
  },
});

export default queryClient;
