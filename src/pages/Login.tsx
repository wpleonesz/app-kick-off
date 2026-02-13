import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import { authService } from "../services/auth.service";
import { IonRefresher, IonRefresherContent } from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import { useRefreshData } from "../hooks/useRealtimeData";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "../components/common/AppToast";
import { loginSchema, LoginFormData } from "../schemas/auth.schemas";
import { FormInput } from "../components/FormInput";

const Login: React.FC = () => {
  const { refreshProfile } = useRefreshData();
  const { toast, showError, dismissToast } = useAppToast();

  // Pull-to-refresh para refrescar datos globales (por ejemplo, perfil)
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log("Iniciando login...");
      const result = await authService.signin(data);
      console.log("Login exitoso:", result);
      window.location.href = "/tabs/inicio";
    } catch (err: any) {
      console.error("Error en login:", err);
      showError(err);
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

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: "24px" }}>
              <FormInput
                name="username"
                control={control}
                label="Usuario"
                type="text"
                placeholder="Ingresa tu usuario"
                autocomplete="username"
                required
                error={errors.username?.message}
              />

              <FormInput
                name="password"
                control={control}
                label="Contraseña"
                type="password"
                placeholder="Ingresa tu contraseña"
                autocomplete="current-password"
                required
                error={errors.password?.message}
              />
            </div>

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
                "--background-hover": "#166fe5",
                "--background-activated": "#1565d8",
              }}
            >
              {isSubmitting ? <IonSpinner name="crescent" /> : "Iniciar Sesión"}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              routerLink="/register"
              disabled={isSubmitting}
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

        <AppToast toast={toast} onDismiss={dismissToast} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
