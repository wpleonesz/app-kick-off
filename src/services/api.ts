import { API_BASE } from "../config";
import { getToken } from "./auth";
import { Capacitor } from "@capacitor/core";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Servicio genérico para realizar llamadas a la API del backend
 * @param endpoint - Ruta del endpoint (ej: '/api/user/profile')
 * @param options - Opciones de la petición
 * @returns Respuesta de la API
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, requiresAuth = true } = options;

  // Construir headers
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Agregar token de autenticación si es requerido
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  // Construir la URL completa
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Intentar usar HTTP nativo en dispositivos (evita CORS)
  if (Capacitor.getPlatform && Capacitor.getPlatform() !== "web") {
    try {
      const { Http } = await import("@capacitor-community/http");
      const nativeOptions: any = {
        method,
        url,
        headers: requestHeaders,
      };
      if (body) nativeOptions.data = body;

      const nativeResp = await Http.request(nativeOptions as any);
      const status = nativeResp.status as number;
      const data = nativeResp.data as any;

      if (status < 200 || status >= 300) {
        throw new ApiError(status, data?.message || `Error ${status}`, data);
      }

      return data as T;
    } catch (err) {
      // Si falla el plugin nativo, continuar con fetch como fallback
      // eslint-disable-next-line no-console
      console.warn("Native HTTP failed, falling back to fetch", err);
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    // Intentar parsear la respuesta como JSON
    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Si la respuesta no es exitosa, lanzar un error
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.message || `Error ${response.status}: ${response.statusText}`,
        data,
      );
    }

    return data as T;
  } catch (error) {
    // Si el error ya es un ApiError, re-lanzarlo
    if (error instanceof ApiError) {
      throw error;
    }

    // Si es un error de red u otro tipo
    if (error instanceof Error) {
      throw new ApiError(
        0,
        error.message || "Error de conexión con el servidor",
      );
    }

    throw new ApiError(0, "Error desconocido");
  }
}

// Métodos de conveniencia
export const api = {
  get: <T = any>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: "GET", requiresAuth }),

  post: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: "POST", body, requiresAuth }),

  put: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: "PUT", body, requiresAuth }),

  delete: <T = any>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: "DELETE", requiresAuth }),

  patch: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: "PATCH", body, requiresAuth }),
};
