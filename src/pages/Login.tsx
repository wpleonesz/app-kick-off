import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { authService } from "../services/auth.service";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "../components/common/AppToast";
import { loginSchema, LoginFormData } from "../schemas/auth.schemas";
import { FormInput } from "../components/FormInput";

const Login: React.FC = () => {
  const { toast, showError, dismissToast } = useAppToast();

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
      <IonContent
        fullscreen
        scrollY={true}
        className="login-content"
        style={
          {
            "--background": "var(--ion-background-color, #ffffff)",
            "--padding-start": "0",
            "--padding-end": "0",
            "--padding-top": "0",
            "--padding-bottom": "0",
          } as React.CSSProperties
        }
      >
        <IonGrid
          className="ion-no-padding"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "100%",
          }}
        >
          {/* Branding */}
          <IonRow className="ion-justify-content-center ion-margin-bottom">
            <IonCol size="auto" className="ion-text-center">
              <IonText color="primary">
                <IonText
                  style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                    display: "block",
                  }}
                >
                  Kick Off
                </IonText>
              </IonText>
              <IonText color="medium">
                <IonText
                  style={{ fontSize: "15px", margin: 0, display: "block" }}
                >
                  Ingresa tus credenciales para continuar
                </IonText>
              </IonText>
            </IonCol>
          </IonRow>

          {/* Login Card */}
          <IonRow className="ion-justify-content-center ion-padding-horizontal">
            <IonCol
              sizeMd="6"
              sizeLg="4"
              sizeXl="3"
              style={{ maxWidth: "400px" }}
            >
              <IonCard
                style={{
                  margin: 0,
                  boxShadow: "none",
                  background: "var(--ion-card-background, #ffffff)",
                }}
              >
                <IonCardContent style={{ padding: "24px 20px" }}>
                  <form onSubmit={handleSubmit(onSubmit)}>
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

                    <IonButton
                      type="submit"
                      expand="block"
                      disabled={isSubmitting}
                      style={{
                        marginTop: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      {isSubmitting ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        "Iniciar Sesión"
                      )}
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* Create Account */}
          <IonRow
            className="ion-justify-content-center ion-padding-horizontal"
            style={{ marginTop: "16px" }}
          >
            <IonCol
              sizeMd="6"
              sizeLg="4"
              sizeXl="3"
              style={{ maxWidth: "400px" }}
            >
              <IonButton
                expand="block"
                fill="outline"
                color="secondary"
                routerLink="/register"
                disabled={isSubmitting}
              >
                Crear Cuenta Nueva
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <AppToast toast={toast} onDismiss={dismissToast} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
