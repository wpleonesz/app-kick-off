import { API_BASE, USE_MOCK_FALLBACK } from "../config";

const TOKEN_KEY = "app_kickoff_token";
const USER_KEY = "app_kickoff_user";

export async function login(username: string, password: string): Promise<void> {
  if (!username || !password) throw new Error("Credenciales inválidas");

  try {
    const res = await fetch(`${API_BASE}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error en autenticación");
    }

    const data = await res.json();

    // Guardar token y datos del usuario
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }

    // Guardar información del usuario
    const userInfo = {
      id: data.id,
      username: data.username,
      email: data.email,
      name: data.name,
      role: data.role,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));

  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      // Fallback mock para desarrollo sin backend
      await new Promise((r) => setTimeout(r, 300));
      const fakeToken = btoa(`${username}:token`);
      localStorage.setItem(TOKEN_KEY, fakeToken);
      localStorage.setItem(USER_KEY, JSON.stringify({
        username,
        email: `${username}@example.com`,
        name: "Usuario de Prueba"
      }));
      return;
    }
    throw err;
  }
}

export async function register(userData: {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  mobile?: string;
}): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al registrar usuario");
    }

    const data = await res.json();
    return data;

  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      // Fallback mock para desarrollo sin backend
      await new Promise((r) => setTimeout(r, 300));
      return;
    }
    throw err;
  }
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/api/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}
