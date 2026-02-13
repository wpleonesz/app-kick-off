/**
 * Servicio de Autenticación
 * Refactorizado con patrón de sgu-mobile
 */
import api from "../lib/api";
import { profileData } from "../storage";
import { USE_MOCK_FALLBACK } from "../config";
import { Preferences } from "@capacitor/preferences";
import { API_BASE } from "../config";
import queryClient from "../queryClient";

const TOKEN_KEY = "app_kickoff_token";
const USER_KEY = "app_kickoff_user";
const AUTH_KEY = "app_kickoff_authenticated";

// Interfaces
export interface Credentials {
  username: string;
  password: string;
}

export interface RegisterData {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  mobile?: string;
  roleId: number;
}

export interface Role {
  id: number;
  code: string;
  name: string;
}

export interface UserData {
  id?: number;
  username: string;
  email?: string;
  name?: string;
  role?: string;
  roles?: Role[];
  token?: string;
  dni?: string;
}

/**
 * Iniciar sesión
 */
async function signin(credentials: Credentials): Promise<UserData> {
  if (!credentials.username || !credentials.password) {
    throw new Error("Credenciales inválidas");
  }

  try {
    const data = await api.post<UserData>(
      "/api/auth/signin",
      credentials,
      false, // No requiere autenticación previa
    );

    // Guardar flag de autenticación (el servidor usa cookies de sesión)
    await Preferences.set({ key: AUTH_KEY, value: "true" });
    localStorage.setItem(AUTH_KEY, "true");

    // Si hay token, guardarlo también
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      await Preferences.set({ key: TOKEN_KEY, value: data.token });
    }

    // Guardar información del usuario en storage
    const userInfo: UserData = {
      id: data.id,
      username: data.username,
      email: data.email,
      name: data.name,
      role: data.role,
      roles: (data as any).roles,
      dni: (data as any).dni,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(userInfo) });
    await profileData.set(userInfo);

    // Invalidar caché de React Query para que `useProfile` refetch inmediatamente
    try {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      // no bloquear el flujo por fallos de invalidación
      console.warn("queryClient.invalidateQueries failed", e);
    }

    return userInfo;
  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      // Fallback mock para desarrollo sin backend
      await new Promise((r) => setTimeout(r, 300));
      const fakeToken = btoa(`${credentials.username}:token`);
      const mockUser: UserData = {
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        name: "Usuario de Prueba",
      };

      localStorage.setItem(TOKEN_KEY, fakeToken);
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      await profileData.set(mockUser);

      // Invalidar caché en modo mock
      try {
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
      } catch (e) {
        console.warn("queryClient.invalidateQueries failed (mock)", e);
      }

      return mockUser;
    }
    throw err;
  }
}

/**
 * Registrar nuevo usuario
 */
async function signup(userData: RegisterData): Promise<any> {
  try {
    const data = await api.post(
      "/api/auth/signup",
      userData,
      false, // No requiere autenticación
    );
    return data;
  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 300));
      return { message: "Registro exitoso (mock)" };
    }
    throw err;
  }
}

/**
 * Cerrar sesión
 */
async function signout(): Promise<void> {
  try {
    await api.post("/api/auth/signout", {}, true);
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  } finally {
    // Limpiar todos los datos de sesión
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_KEY);
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: AUTH_KEY });
    await Preferences.remove({ key: USER_KEY });
    await Preferences.remove({ key: "session_cookie" });
    await profileData.clear();
  }
}

/**
 * Obtener información del usuario actual
 */
async function user(): Promise<UserData | null> {
  try {
    const data = await api.get<UserData>("/api/auth/user");

    // Actualizar datos en storage
    await profileData.set(data);
    localStorage.setItem(USER_KEY, JSON.stringify(data));

    return data;
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    return null;
  }
}

/**
 * Verificar si el usuario está autenticado (sincrónico, usa localStorage)
 */
function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

/**
 * Verificar si el usuario está autenticado (asincrónico, usa Preferences)
 */
async function isAuthenticatedAsync(): Promise<boolean> {
  const { value } = await Preferences.get({ key: AUTH_KEY });
  console.log("Checking AUTH_KEY:", value);
  return value === "true";
}

/**
 * Obtener token de autenticación
 */
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Obtener usuario actual desde storage local
 */
function getCurrentUser(): UserData | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Obtener usuario desde storage persistente (Ionic Storage)
 */
async function getCurrentUserFromStorage(): Promise<UserData | null> {
  try {
    const userData = await profileData.get();
    return userData;
  } catch {
    return null;
  }
}

// Exportar servicio con estructura similar a sgu-mobile
export const authService = {
  signin,
  signup,
  signout,
  user,
  isAuthenticated,
  isAuthenticatedAsync,
  getToken,
  getCurrentUser,
  getCurrentUserFromStorage,
};

// Exportar funciones individuales para compatibilidad
// export const login = signin; // Eliminado para evitar duplicidad
export const register = signup;
export const logout = signout;
export { isAuthenticated, getToken, getCurrentUser };

/**
 * Función de login alternativa usando fetch
 */
export async function login(credentials: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  await queryClient.invalidateQueries({ queryKey: ["profile"] });
  return data;
}
