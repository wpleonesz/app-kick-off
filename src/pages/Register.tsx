import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSpinner,
} from "@ionic/react";
import { authService } from "../services/auth.service";
import { IonRefresher, IonRefresherContent } from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import { useRefreshData } from "../hooks/useRealtimeData";

// Estilos compartidos para inputs
const inputStyle = {
  "--background": "var(--ion-color-light)",
  "--border-radius": "12px",
  "--padding-start": "16px",
  "--padding-end": "16px",
  "--padding-top": "14px",
  "--padding-bottom": "14px",
  "--highlight-color-focused": "#1877f2",
  fontSize: "16px",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ion-color-dark)",
  marginBottom: "8px",
};

const Register: React.FC = () => {
    const { refreshProfile } = useRefreshData();

    // Pull-to-refresh para refrescar datos globales (por ejemplo, perfil)
    const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
      await refreshProfile();
      event.detail.complete();
    };
  const [dni, setDni] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!dni || !firstName || !lastName || !email || !username || !password) {
      setError("Todos los campos obligatorios deben ser completados");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      await authService.signup({
        dni,
        firstName,
        lastName,
        email,
        username,
        password,
        mobile,
      });

      setSuccess("Registro exitoso. Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Error en el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Registrarse</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div
          style={{
            maxWidth: "400px",
            margin: "0 auto",
            padding: "20px",
            paddingTop: "20px",
            paddingBottom: "max(40px, env(safe-area-inset-bottom))",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* DNI */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                DNI <span style={{ color: "#1877f2" }}>*</span>
              </label>
              <IonInput
                value={dni}
                onIonInput={(e: any) => setDni(e.target.value)}
                type="text"
                required
                placeholder="Ingresa tu DNI"
                fill="solid"
                style={inputStyle}
              />
            </div>

            {/* Nombre y Apellido en fila */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  Nombre <span style={{ color: "#1877f2" }}>*</span>
                </label>
                <IonInput
                  value={firstName}
                  onIonInput={(e: any) => setFirstName(e.target.value)}
                  type="text"
                  required
                  placeholder="Tu nombre"
                  autocomplete="given-name"
                  fill="solid"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  Apellido <span style={{ color: "#1877f2" }}>*</span>
                </label>
                <IonInput
                  value={lastName}
                  onIonInput={(e: any) => setLastName(e.target.value)}
                  type="text"
                  required
                  placeholder="Tu apellido"
                  autocomplete="family-name"
                  fill="solid"
                  <IonContent fullscreen className="ion-padding">
                    <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                      <IonRefresherContent pullingText="Desliza para refrescar" refreshingSpinner="circles" />
                    </IonRefresher>
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                Email <span style={{ color: "#1877f2" }}>*</span>
              </label>
              <IonInput
                value={email}
                onIonInput={(e: any) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="correo@ejemplo.com"
                autocomplete="email"
                fill="solid"
                style={inputStyle}
              />
            </div>

            {/* Usuario */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                Usuario <span style={{ color: "#1877f2" }}>*</span>
              </label>
              <IonInput
                value={username}
                onIonInput={(e: any) => setUsername(e.target.value)}
                type="text"
                required
                placeholder="Elige un usuario"
                autocomplete="username"
                fill="solid"
                style={inputStyle}
              />
            </div>

            {/* Teléfono */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Teléfono</label>
              <IonInput
                value={mobile}
                onIonInput={(e: any) => setMobile(e.target.value)}
                type="tel"
                placeholder="0999999999"
                autocomplete="tel"
                fill="solid"
                style={inputStyle}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                Contraseña <span style={{ color: "#1877f2" }}>*</span>
              </label>
              <IonInput
                value={password}
                onIonInput={(e: any) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                autocomplete="new-password"
                fill="solid"
                style={inputStyle}
              />
            </div>

            {/* Confirmar Contraseña */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>
                Confirmar Contraseña <span style={{ color: "#1877f2" }}>*</span>
              </label>
              <IonInput
                value={confirmPassword}
                onIonInput={(e: any) => setConfirmPassword(e.target.value)}
                type="password"
                required
                placeholder="Repite la contraseña"
                autocomplete="new-password"
                fill="solid"
                style={inputStyle}
              />
            </div>

            {error && (
              <div
                className="error-message"
                style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px" }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="success-message"
                style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px" }}
              >
                {success}
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
              }}
            >
              {isLoading ? <IonSpinner name="crescent" /> : "Crear Cuenta"}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              routerLink="/login"
              disabled={isLoading}
              style={{
                fontSize: "14px",
                "--color": "#1877f2",
              }}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
