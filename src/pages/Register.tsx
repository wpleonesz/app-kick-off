import React from "react";
import { useForm, Controller } from "react-hook-form";
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
  IonSelect,
  IonSelectOption,
  useIonViewWillEnter,
} from "@ionic/react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { IonRefresher, IonRefresherContent } from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import { useRefreshData } from "../hooks/useRealtimeData";
import { useRoles } from "../hooks/useRoles";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "../components/common/AppToast";
import { registerSchema, RegisterFormData } from "../schemas/auth.schemas";
import { FormInput } from "../components/FormInput";

const Register: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useRefreshData();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { toast, showError, showSuccess, dismissToast } = useAppToast();

  // Forzar refetch de roles cada vez que se entra a la pantalla
  // IonSelect necesita que las opciones estén en el DOM desde el primer render
  useIonViewWillEnter(() => {
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  });

  // Pull-to-refresh para refrescar datos globales (por ejemplo, perfil)
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };

  const defaultFormValues: RegisterFormData = {
    dni: "",
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    roleId: 0,
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const registerData = {
        dni: data.dni,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
        mobile: data.mobile || undefined,
        roleId: data.roleId,
      };

      await authService.signup(registerData);

      showSuccess("Registro exitoso. Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      showError(err);
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

            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--ion-color-dark)",
                marginBottom: "8px",
              }}>
                Rol <span style={{ color: "#1877f2" }}>*</span>
              </label>
              {rolesLoading ? (
                <div style={{
                  background: "var(--ion-color-light)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--ion-color-medium)",
                  fontSize: "16px",
                }}>
                  <IonSpinner name="crescent" style={{ width: "18px", height: "18px" }} />
                  Cargando roles...
                </div>
              ) : (
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <IonSelect
                      fill="solid"
                      placeholder="Selecciona tu rol"
                      value={field.value || null}
                      onIonChange={e => field.onChange(e.detail.value)}
                      style={{
                        "--background": "var(--ion-color-light)",
                        "--border-radius": "12px",
                        "--padding-start": "16px",
                        "--padding-end": "16px",
                        "--padding-top": "14px",
                        "--padding-bottom": "14px",
                        "--highlight-color-focused": "#1877f2",
                        fontSize: "16px",
                      } as React.CSSProperties}
                    >
                      {roles?.map(role => (
                        <IonSelectOption key={role.id} value={role.id}>
                          {role.name}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  )}
                />
              )}
              {errors.roleId && (
                <div style={{ fontSize: "12px", color: "var(--ion-color-danger)", marginTop: "6px", paddingLeft: "4px" }}>
                  {errors.roleId.message}
                </div>
              )}
            </div>

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

        <AppToast toast={toast} onDismiss={dismissToast} />
      </IonContent>
    </IonPage>
  );
};

export default Register;
