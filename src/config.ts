// Configuración de API - usar HTTP para entorno móvil/emulador.
// Ajusta `API_BASE` según tu backend:
// - Para desarrollo local web: http://localhost:3000
// - Para iOS simulator: http://localhost:3000
// - Para Android emulator: http://10.0.2.2:3000
export const API_BASE = process.env.VITE_API_BASE || "http://localhost:3000";

// Si true, ante fallo de red usa mock local para desarrollo sin backend
export const USE_MOCK_FALLBACK = false;
