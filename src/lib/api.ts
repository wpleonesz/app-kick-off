import { CapacitorHttp, HttpResponse } from "@capacitor/core";
import { API_BASE } from "../config";
import { getToken, logout } from "../services/auth";
import { Preferences } from "@capacitor/preferences";

/**
 * Cliente HTTP centralizado inspirado en sgu-mobile
 * Maneja autenticación, cookies, headers comunes y errores de forma centralizada
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
  if (response.status === 200 || response.status === 201) {
    const setCookie = response.headers?.["Set-Cookie"];
    if (setCookie) {
      try {
        await Preferences.set({
          key: "session_cookie",
          value: setCookie,
        });
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
    console.error("HTTP request error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error de conexión");
  }
}

/**
 * API pública - métodos de conveniencia
 */
export const api = {
  /**
   * Realiza una petición GET
   */
  get: <T = any>(endpoint: string, requiresAuth = true) =>
    request<T>("GET", endpoint, undefined, { requiresAuth }),

  /**
   * Realiza una petición POST
   */
  post: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    request<T>("POST", endpoint, body, { requiresAuth }),

  /**
   * Realiza una petición PUT
   */
  put: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    request<T>("PUT", endpoint, body, { requiresAuth }),

  /**
   * Realiza una petición DELETE
   */
  delete: <T = any>(endpoint: string, requiresAuth = true) =>
    request<T>("DELETE", endpoint, undefined, { requiresAuth }),

  /**
   * Realiza una petición PATCH
   */
  patch: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    request<T>("PATCH", endpoint, body, { requiresAuth }),
};

export default api;
