import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import { authService } from "../services/auth.service";
import { IonRefresher, IonRefresherContent } from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import { useRefreshData } from "../hooks/useRealtimeData";

const Login: React.FC = () => {
  const { refreshProfile } = useRefreshData();

  // Pull-to-refresh para refrescar datos globales (por ejemplo, perfil)
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log("Iniciando login...");
      const result = await authService.signin({ username, password });
      console.log("Login exitoso:", result);
      window.location.href = "/tabs/inicio";
    } catch (err: any) {
      console.error("Error en login:", err);
      setError(err?.message || "Error en autenticación");
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para refrescar"
            refreshingSpinner="circles"
          />
        </IonRefresher>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "100%",
            paddingTop: "max(env(safe-area-inset-top), 20px)",
            paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
            paddingLeft: "20px",
            paddingRight: "20px",
            maxWidth: "400px",
            margin: "0 auto",
          }}
        >
          <div className="text-center" style={{ marginBottom: "48px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Bienvenido
            </h1>
            <p
              style={{
                color: "var(--ion-color-medium)",
                fontSize: "16px",
              }}
            >
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              {/* Input Usuario - estilo Facebook */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--ion-color-dark)",
                    marginBottom: "8px",
                  }}
                >
                  Usuario
                </label>
                <IonInput
                  value={username}
                  onIonInput={(e: any) => setUsername(e.target.value)}
                  type="text"
                  required
                  placeholder="Ingresa tu usuario"
                  autocomplete="username"
                  fill="solid"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                    "--padding-top": "14px",
                    "--padding-bottom": "14px",
                    "--highlight-color-focused": "#1877f2",
                    fontSize: "16px",
                  }}
                />
              </div>

              {/* Input Contraseña - estilo Facebook */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--ion-color-dark)",
                    marginBottom: "8px",
                  }}
                >
                  Contraseña
                </label>
                <IonInput
                  value={password}
                  onIonInput={(e: any) => setPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                  fill="solid"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                    "--padding-top": "14px",
                    "--padding-bottom": "14px",
                    "--highlight-color-focused": "#1877f2",
                    fontSize: "16px",
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                className="error-message"
                style={{
                  marginBottom: "20px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                }}
              >
                {error}
              </div>
            )}

            <IonButton
              type="submit"
              expand="block"
              disabled={isLoading}
              style={{
                height: "52px",
                fontSize: "17px",
                fontWeight: 600,
                marginBottom: "12px",
                "--border-radius": "12px",
                "--background": "#1877f2",
                "--background-hover": "#166fe5",
                "--background-activated": "#1565d8",
              }}
            >
              {isLoading ? <IonSpinner name="crescent" /> : "Iniciar Sesión"}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              routerLink="/register"
              disabled={isLoading}
              style={{
                height: "52px",
                fontSize: "17px",
                fontWeight: 600,
                "--border-radius": "12px",
                "--border-color": "#1877f2",
                "--color": "#1877f2",
              }}
            >
              Crear Cuenta
            </IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
