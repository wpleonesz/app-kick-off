// Configuración de API - usar HTTP para entorno móvil/emulador.
// Ajusta `API_BASE` según tu backend; por ejemplo para Android emulator usa 10.0.2.2
export const API_BASE = process.env.VITE_API_BASE || "http://10.0.2.2:3000";

export const USE_MOCK_FALLBACK = true; // si true, ante fallo de red usa mock local
