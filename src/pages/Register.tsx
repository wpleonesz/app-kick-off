import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSpinner,
} from "@ionic/react";
import { authService } from "../services/auth.service";
import { IonRefresher, IonRefresherContent } from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import { useRefreshData } from "../hooks/useRealtimeData";
import { registerSchema, RegisterFormData } from "../schemas/auth.schemas";
import { FormInput } from "../components/FormInput";

const Register: React.FC = () => {
  const { refreshProfile } = useRefreshData();

  // Pull-to-refresh para refrescar datos globales (por ejemplo, perfil)
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      dni: "",
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      mobile: "",
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(null);

    try {
      const registerData = {
        dni: data.dni,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
        mobile: data.mobile || undefined,
      };

      await authService.signup(registerData);

      setSuccess("Registro exitoso. Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Error en el registro");
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
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para refrescar"
            refreshingSpinner="circles"
          />
        </IonRefresher>
        <div
          style={{
            maxWidth: "400px",
            margin: "0 auto",
            padding: "20px",
            paddingTop: "20px",
            paddingBottom: "max(40px, env(safe-area-inset-bottom))",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              name="dni"
              control={control}
              label="DNI"
              type="text"
              placeholder="Ingresa tu DNI"
              required
              error={errors.dni?.message}
            />

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div style={{ flex: 1 }}>
                <FormInput
                  name="firstName"
                  control={control}
                  label="Nombre"
                  type="text"
                  placeholder="Tu nombre"
                  autocomplete="given-name"
                  required
                  error={errors.firstName?.message}
                />
              </div>
              <div style={{ flex: 1 }}>
                <FormInput
                  name="lastName"
                  control={control}
                  label="Apellido"
                  type="text"
                  placeholder="Tu apellido"
                  autocomplete="family-name"
                  required
                  error={errors.lastName?.message}
                />
              </div>
            </div>

            <FormInput
              name="email"
              control={control}
              label="Email"
              type="email"
              placeholder="correo@ejemplo.com"
              autocomplete="email"
              required
              error={errors.email?.message}
            />

            <FormInput
              name="username"
              control={control}
              label="Usuario"
              type="text"
              placeholder="Elige un usuario"
              autocomplete="username"
              required
              error={errors.username?.message}
            />

            <FormInput
              name="mobile"
              control={control}
              label="Teléfono"
              type="tel"
              placeholder="0999999999"
              autocomplete="tel"
              error={errors.mobile?.message}
            />

            <FormInput
              name="password"
              control={control}
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              autocomplete="new-password"
              required
              error={errors.password?.message}
            />

            <FormInput
              name="confirmPassword"
              control={control}
              label="Confirmar Contraseña"
              type="password"
              placeholder="Repite la contraseña"
              autocomplete="new-password"
              required
              error={errors.confirmPassword?.message}
            />

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
              disabled={isSubmitting}
              style={{
                height: "52px",
                fontSize: "17px",
                fontWeight: 600,
                marginBottom: "12px",
                "--border-radius": "12px",
                "--background": "#1877f2",
              }}
            >
              {isSubmitting ? <IonSpinner name="crescent" /> : "Crear Cuenta"}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              routerLink="/login"
              disabled={isSubmitting}
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
