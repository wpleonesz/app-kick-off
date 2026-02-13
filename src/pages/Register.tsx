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
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText,
} from "@ionic/react";
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
  const { refreshProfile } = useRefreshData();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { toast, showError, showSuccess, dismissToast } = useAppToast();

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

            <IonItem>
              <IonLabel>Rol *</IonLabel>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <IonSelect
                    placeholder="Selecciona tu rol"
                    value={field.value}
                    onIonChange={e => field.onChange(e.detail.value)}
                    disabled={rolesLoading}
                  >
                    {roles?.map(role => (
                      <IonSelectOption key={role.id} value={role.id}>
                        {role.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                )}
              />
            </IonItem>
            {errors.roleId && (
              <IonText color="danger" style={{ display: "block", padding: "0 16px 16px", fontSize: "14px" }}>
                {errors.roleId.message}
              </IonText>
            )}

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
