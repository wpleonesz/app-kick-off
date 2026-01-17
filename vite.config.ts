import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0", // Permite conexiones desde dispositivos externos
    strictPort: true,
    hmr: {
      // Hot Module Replacement - cambios en tiempo real
      protocol: "ws",
      host: "0.0.0.0",
      port: 3000,
    },
  },
});
