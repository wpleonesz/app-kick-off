import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
} from "@ionic/react";
import { authService } from "../services/auth.service";

const Login: React.FC = () => {
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
            <IonList lines="none" style={{ marginBottom: "20px" }}>
              <IonItem
                lines="none"
                style={{
                  marginBottom: "16px",
                  "--background": "transparent",
                }}
              >
                <IonInput
                  label="Usuario"
                  labelPlacement="stacked"
                  value={username}
                  onIonInput={(e: any) => setUsername(e.target.value)}
                  type="text"
                  required
                  placeholder="Ingresa tu usuario"
                  autocomplete="username"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                    "--padding-top": "14px",
                    "--padding-bottom": "14px",
                    fontSize: "16px",
                  }}
                />
              </IonItem>

              <IonItem
                lines="none"
                style={{
                  marginBottom: "24px",
                  "--background": "transparent",
                }}
              >
                <IonInput
                  label="Contraseña"
                  labelPlacement="stacked"
                  value={password}
                  onIonInput={(e: any) => setPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                    "--padding-top": "14px",
                    "--padding-bottom": "14px",
                    fontSize: "16px",
                  }}
                />
              </IonItem>
            </IonList>

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
