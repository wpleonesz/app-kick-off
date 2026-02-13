/**
 * Extrae un mensaje legible de cualquier tipo de error.
 *
 * Maneja todos los formatos que pueden llegar:
 * - Error nativo:    new Error('msg')         → 'msg'
 * - String:          'algo falló'              → 'algo falló'
 * - Objeto API:      { message: 'msg' }       → 'msg'
 * - Objeto legacy:   { error: 'msg' }         → 'msg'
 * - Objeto anidado:  { error: { message: '' }}→ mensaje
 * - undefined/null:  undefined                 → fallback
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado. Intenta de nuevo.',
): string {
  if (!error) return fallback;

  // String directo
  if (typeof error === 'string') {
    return error.trim() || fallback;
  }

  // Error nativo (new Error('...'))
  if (error instanceof Error) {
    return error.message?.trim() || fallback;
  }

  // Objeto con distintas formas de contener el mensaje
  if (typeof error === 'object') {
    const obj = error as Record<string, any>;

    // { message: 'texto' } — formato más común de la API
    if (typeof obj.message === 'string' && obj.message.trim()) {
      return obj.message.trim();
    }

    // { error: 'texto' } — formato legacy
    if (typeof obj.error === 'string' && obj.error.trim()) {
      return obj.error.trim();
    }

    // { error: { message: 'texto' } } — error envuelto
    if (obj.error && typeof obj.error === 'object') {
      if (typeof obj.error.message === 'string' && obj.error.message.trim()) {
        return obj.error.message.trim();
      }
    }

    // { errorMessage: 'texto' } — formato alternativo
    if (typeof obj.errorMessage === 'string' && obj.errorMessage.trim()) {
      return obj.errorMessage.trim();
    }

    // { statusText: 'texto' } — HTTP response
    if (typeof obj.statusText === 'string' && obj.statusText.trim()) {
      return obj.statusText.trim();
    }

    // { data: { message: 'texto' } } — respuesta raw
    if (obj.data && typeof obj.data.message === 'string') {
      return obj.data.message.trim();
    }
  }

  // Último recurso: convertir a string
  try {
    const str = String(error);
    if (str && str !== '[object Object]') return str;
  } catch {}

  return fallback;
}

/**
 * Mapea mensajes técnicos de la API a mensajes amigables para el usuario.
 * Si no hay mapeo, devuelve el mensaje original.
 */
const FRIENDLY_MESSAGES: Record<string, string> = {
  'API Endpoint not found': 'El servicio no está disponible en este momento.',
  'Network request failed': 'Sin conexión a internet. Verifica tu red.',
  'Sesión expirada': 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  'No tienes permisos para esta acción':
    'No tienes permisos para realizar esta acción.',
  'Sesión cerrada: cuenta desactivada':
    'Tu cuenta ha sido desactivada. Contacta al administrador.',
  'Usuario o contraseña incorrectos': 'Usuario o contraseña incorrectos.',
  'El rol es requerido': 'Debes seleccionar un rol para registrarte.',
};

export function friendlyErrorMessage(error: unknown): string {
  const raw = extractErrorMessage(error);

  // Buscar coincidencia exacta
  if (FRIENDLY_MESSAGES[raw]) {
    return FRIENDLY_MESSAGES[raw];
  }

  // Buscar coincidencia parcial
  for (const [key, friendly] of Object.entries(FRIENDLY_MESSAGES)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) {
      return friendly;
    }
  }

  // Si es un mensaje técnico muy largo, truncar para la UI
  if (raw.length > 150) {
    return raw.substring(0, 147) + '...';
  }

  return raw;
}
