import { CapacitorHttp, HttpResponse } from "@capacitor/core";
import { API_BASE } from "../config";
import { getToken, logout } from "../services/auth";
import { Preferences } from "@capacitor/preferences";
import { requestBalancer } from "./request-balancer";
import { device } from "./device";
import { sessionGuard } from "../services/session-guard.service";

/**
 * Cliente HTTP centralizado inspirado en sgu-mobile
 * Maneja autenticación, cookies, headers comunes y errores de forma centralizada
 * Integrado con Request Balancer para caché, deduplicación y control de concurrencia
 */

// Tipos de métodos HTTP soportados
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Opciones de configuración para requests
interface RequestOptions {
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

/**
 * Genera headers comunes para todas las peticiones
 */
async function commonHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Agregar token de autenticación si existe
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Agregar cookie de sesión si existe (similar a sgu-mobile)
  try {
    const { value: cookie } = await Preferences.get({ key: "session_cookie" });
    if (cookie) {
      headers["Cookie"] = cookie;
    }
  } catch (error) {
    console.warn("Error al obtener cookie:", error);
  }

  // Agregar headers del dispositivo (UUID, platform, app version)
  try {
    const deviceHeaders = await device.getHeaders();
    Object.assign(headers, deviceHeaders);
  } catch (error) {
    console.warn("Error al obtener device headers:", error);
  }

  return headers;
}

/**
 * Construye la URL completa del endpoint
 */
function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http")) {
    return endpoint;
  }
  const baseUrl = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

/**
 * Maneja la respuesta HTTP y errores comunes
 */
async function handleResponse<T = any>(
  response: HttpResponse,
  method: HttpMethod,
  url: string,
): Promise<T> {
  // Guardar cookie de sesión si el servidor la envía
  // iOS CapacitorHttp devuelve headers en minúsculas, Android puede variar
  if (response.status === 200 || response.status === 201) {
    const rawCookie =
      response.headers?.["Set-Cookie"] ||
      response.headers?.["set-cookie"] ||
      response.headers?.["SET-COOKIE"];
    if (rawCookie) {
      try {
        // Solo guardar la parte "nombre=valor" (antes del primer ';')
        // El Cookie header de request NO debe incluir atributos como Max-Age, Path, etc.
        const cookieValue = rawCookie.split(";")[0].trim();
        await Preferences.set({
          key: "session_cookie",
          value: cookieValue,
        });
        console.debug("Cookie de sesión guardada:", cookieValue.substring(0, 30) + "...");
      } catch (error) {
        console.warn("Error al guardar cookie:", error);
      }
    }
  }

  // Manejar redireccionamiento (3XX)
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers?.["Location"];
    if (location) {
      console.log(`Redirigiendo a: ${location}`);
      // Podrías implementar lógica de redirección aquí
    }
  }

  // Respuesta exitosa
  if (response.status >= 200 && response.status < 300) {
    return response.data as T;
  }

  // Sesión expirada (similar a sgu-mobile)
  if (response.status === 403) {
    console.warn("Sesión expirada, limpiando datos...");
    await Preferences.remove({ key: "session_cookie" });
    await logout();
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  // No autorizado
  if (response.status === 401) {
    throw new Error("No autorizado");
  }

  // Error del cliente (4XX)
  if (response.status >= 400 && response.status < 500) {
    const errorMessage =
      response.data?.message ||
      response.data?.error ||
      `Error ${response.status}`;
    throw new Error(errorMessage);
  }

  // Error del servidor (5XX)
  if (response.status >= 500) {
    throw new Error("Error del servidor. Por favor, intenta más tarde.");
  }

  // Error genérico
  throw new Error(`Error HTTP ${response.status}`);
}

/**
 * Realiza una petición HTTP
 */
async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any,
  options: RequestOptions = {},
): Promise<T> {
  // Verificar que la sesión no se está cerrando
  if (sessionGuard.isSessionClosing) {
    throw new Error("Sesión cerrada: cuenta desactivada");
  }

  const { headers: extraHeaders = {}, requiresAuth = true } = options;

  // Construir headers
  const commonHeadersObj = await commonHeaders();
  const headers = {
    ...commonHeadersObj,
    ...extraHeaders,
  };

  // Si requiere autenticación: aceptar token O cookie de sesión
  const token = getToken();
  const hasCookie = !!headers["Cookie"];
  if (requiresAuth && !token && !hasCookie) {
    throw new Error("No autenticado");
  }

  const url = buildUrl(endpoint);

  try {
    console.debug("HTTP request:", { method, url, headers, body });
    const response = await CapacitorHttp.request({
      method,
      url,
      headers,
      data: body,
      webFetchExtra: {
        credentials: "include", // Para enviar cookies en navegador
      },
    });

    console.debug("HTTP response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });

    return handleResponse<T>(response, method, url);
  } catch (error) {
    // Extraer mensaje de error sea cual sea el formato (Error, objeto nativo, etc.)
    const errMsg =
      error instanceof Error
        ? error.message
        : (error as any)?.errorMessage ||
          (error as any)?.message ||
          JSON.stringify(error);
    console.error(`HTTP request error [${method} ${url}]:`, errMsg);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(errMsg || "Error de conexión");
  }
}

/**
 * API pública - métodos de conveniencia
 * Integrados con Request Balancer para caché, deduplicación y control de concurrencia
 */
export const api = {
  /**
   * Realiza una petición GET con caché automático (30s)
   * - Deduplicación: si hay 2 requests iguales al mismo tiempo, solo se ejecuta 1
   * - Caché: resultados se cacheán por 30 segundos
   * - Cola: máximo 6 requests simultáneos
   * - Retry: reintentos automáticos en caso de 429, 503, timeouts
   */
  get: <T = any>(
    endpoint: string,
    requiresAuth = true,
    ttl = 30_000, // 30 segundos por defecto
  ): Promise<T> => {
    const wrappedRequest = () =>
      request<T>("GET", endpoint, undefined, { requiresAuth });
    return requestBalancer.get<T>(endpoint, wrappedRequest, ttl);
  },

  /**
   * Realiza una petición POST sin caché
   * - Cola: máximo 6 requests simultáneos
   * - Retry: reintentos automáticos en caso de 429, 503, timeouts
   * - Caché: invalida caché relacionado automáticamente
   */
  post: <T = any>(
    endpoint: string,
    body?: any,
    requiresAuth = true,
  ): Promise<T> => {
    const wrappedRequest = () =>
      request<T>("POST", endpoint, body, { requiresAuth });
    return requestBalancer.mutate<T>(endpoint, wrappedRequest);
  },

  /**
   * Realiza una petición PUT sin caché
   * - Cola: máximo 6 requests simultáneos
   * - Retry: reintentos automáticos en caso de 429, 503, timeouts
   * - Caché: invalida caché relacionado automáticamente
   */
  put: <T = any>(
    endpoint: string,
    body?: any,
    requiresAuth = true,
  ): Promise<T> => {
    const wrappedRequest = () =>
      request<T>("PUT", endpoint, body, { requiresAuth });
    return requestBalancer.mutate<T>(endpoint, wrappedRequest);
  },

  /**
   * Realiza una petición DELETE sin caché
   * - Cola: máximo 6 requests simultáneos
   * - Retry: reintentos automáticos en caso de 429, 503, timeouts
   */
  delete: <T = any>(endpoint: string, requiresAuth = true): Promise<T> => {
    const wrappedRequest = () =>
      request<T>("DELETE", endpoint, undefined, { requiresAuth });
    return requestBalancer.mutate<T>(endpoint, wrappedRequest);
  },

  /**
   * Realiza una petición PATCH sin caché
   * - Cola: máximo 6 requests simultáneos
   * - Retry: reintentos automáticos en caso de 429, 503, timeouts
   */
  patch: <T = any>(
    endpoint: string,
    body?: any,
    requiresAuth = true,
  ): Promise<T> => {
    const wrappedRequest = () =>
      request<T>("PATCH", endpoint, body, { requiresAuth });
    return requestBalancer.mutate<T>(endpoint, wrappedRequest);
  },

  /**
   * Obtener métricas del balanceador (para debugging)
   */
  getMetrics: () => requestBalancer.getMetrics(),

  /**
   * Limpiar caché (útil al logout)
   */
  clearCache: () => requestBalancer.clearCache(),
};

export default api;
