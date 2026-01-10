import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSpinner,
} from "@ionic/react";
import { authService } from "../services/auth.service";

const Register: React.FC = () => {
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
            paddingTop: "max(20px, env(safe-area-inset-top))",
            paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          }}
        >
          <form onSubmit={handleSubmit}>
            <IonList lines="none" className="mb-md">
              <IonItem lines="none" className="mb-sm">
                <IonInput
                  label="DNI *"
                  labelPlacement="stacked"
                  value={dni}
                  onIonInput={(e: any) => setDni(e.target.value)}
                  type="text"
                  required
                  placeholder="Ingresa tu DNI"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                  }}
                />
              </IonItem>

              <IonItem lines="none" className="mb-sm">
                <IonInput
                  label="Nombre *"
                  labelPlacement="stacked"
                  value={firstName}
                  onIonInput={(e: any) => setFirstName(e.target.value)}
                  type="text"
                  required
                  placeholder="Tu nombre"
                  autocomplete="given-name"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                  }}
                />
              </IonItem>

              <IonItem lines="none" className="mb-sm">
                <IonInput
                  label="Apellido *"
                  labelPlacement="stacked"
                  value={lastName}
                  onIonInput={(e: any) => setLastName(e.target.value)}
                  type="text"
                  required
                  placeholder="Tu apellido"
                  autocomplete="family-name"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                  }}
                />
              </IonItem>

              <IonItem lines="none" className="mb-sm">
                <IonInput
                  label="Email *"
                  labelPlacement="stacked"
                  value={email}
                  onIonInput={(e: any) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  autocomplete="email"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                  }}
                />
              </IonItem>

              <IonItem lines="none" className="mb-sm">
                <IonInput
                  label="Usuario *"
                  labelPlacement="stacked"
                  value={username}
                  onIonInput={(e: any) => setUsername(e.target.value)}
                  type="text"
                  required
                  placeholder="Elige un usuario"
                  autocomplete="username"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                  }}
                />
              </IonItem>

              <IonItem lines="none" className="mb-sm">
                <IonInput
                  label="Teléfono"
                  labelPlacement="stacked"
                  value={mobile}
                  onIonInput={(e: any) => setMobile(e.target.value)}
                  type="tel"
                  placeholder="0999999999"
                  autocomplete="tel"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                  }}
                />
              </IonItem>

              <IonItem lines="none" className="mb-sm">
                <IonInput
                  label="Contraseña *"
                  labelPlacement="stacked"
                  value={password}
                  onIonInput={(e: any) => setPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  autocomplete="new-password"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                  }}
                />
              </IonItem>

              <IonItem lines="none" className="mb-md">
                <IonInput
                  label="Confirmar Contraseña *"
                  labelPlacement="stacked"
                  value={confirmPassword}
                  onIonInput={(e: any) => setConfirmPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Repite la contraseña"
                  autocomplete="new-password"
                  style={{
                    "--background": "var(--ion-color-light)",
                    "--border-radius": "12px",
                    "--padding-start": "16px",
                    "--padding-end": "16px",
                  }}
                />
              </IonItem>
            </IonList>

            {error && <div className="error-message mb-md">{error}</div>}
            {success && <div className="success-message mb-md">{success}</div>}

            <IonButton
              type="submit"
              expand="block"
              disabled={isLoading}
              className="button-large mb-sm"
            >
              {isLoading ? <IonSpinner name="crescent" /> : "Crear Cuenta"}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              routerLink="/login"
              disabled={isLoading}
              style={{ fontSize: "var(--app-font-size-sm)" }}
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
