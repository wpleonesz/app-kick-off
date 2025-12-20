import { API_BASE, USE_MOCK_FALLBACK } from "../config";

const TOKEN_KEY = "app_kickoff_token";

export async function login(email: string, password: string): Promise<void> {
  if (!email || !password) throw new Error("Credenciales inválidas");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Error en autenticación");
    }

    const data = await res.json();
    const token = data.token || btoa(`${email}:token`);
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      // Fallback mock para desarrollo sin backend
      await new Promise((r) => setTimeout(r, 300));
      const fakeToken = btoa(`${email}:token`);
      localStorage.setItem(TOKEN_KEY, fakeToken);
      return;
    }
    throw err;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
