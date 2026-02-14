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
  IonCard,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonCol,
  IonText,
  IonLabel,
  IonNote,
  IonItem,
} from "@ionic/react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
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

  useIonViewWillEnter(() => {
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  });

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

        <IonCard>
          <IonCardContent style={{ padding: "20px" }}>
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

              <IonRow style={{ gap: "10px", marginBottom: "0" }}>
                <IonCol style={{ padding: 0 }}>
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
                </IonCol>
                <IonCol style={{ padding: 0 }}>
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
                </IonCol>
              </IonRow>

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

              <IonItem
                lines="none"
                style={{
                  marginBottom: "14px",
                  "--padding-start": "0",
                  "--inner-padding-end": "0",
                }}
              >
                <IonLabel
                  position="stacked"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  Rol <IonText color="primary">*</IonText>
                </IonLabel>
                {rolesLoading ? (
                  <IonRow
                    className="ion-align-items-center"
                    style={{
                      background: "var(--ion-color-light)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      gap: "8px",
                      color: "var(--ion-color-medium)",
                      fontSize: "15px",
                      width: "100%",
                    }}
                  >
                    <IonSpinner
                      name="crescent"
                      style={{ width: "18px", height: "18px" }}
                    />
                    <IonText>Cargando roles...</IonText>
                  </IonRow>
                ) : (
                  <Controller
                    name="roleId"
                    control={control}
                    render={({ field }) => (
                      <IonSelect
                        fill="solid"
                        placeholder="Selecciona tu rol"
                        value={field.value || null}
                        onIonChange={(e) => field.onChange(e.detail.value)}
                        style={
                          {
                            "--background": "var(--ion-color-light)",
                            "--border-radius": "8px",
                            "--padding-start": "14px",
                            "--padding-end": "14px",
                            "--padding-top": "12px",
                            "--padding-bottom": "12px",
                            "--highlight-color-focused":
                              "var(--ion-color-primary)",
                            fontSize: "15px",
                          } as React.CSSProperties
                        }
                      >
                        {roles?.map((role) => (
                          <IonSelectOption key={role.id} value={role.id}>
                            {role.name}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    )}
                  />
                )}
                {errors.roleId && (
                  <IonNote
                    color="danger"
                    style={{
                      fontSize: "12px",
                      marginTop: "4px",
                      paddingLeft: "2px",
                      display: "block",
                    }}
                  >
                    {errors.roleId.message}
                  </IonNote>
                )}
              </IonItem>

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
                  marginTop: "4px",
                  marginBottom: "8px",
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
                }}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>

        <AppToast toast={toast} onDismiss={dismissToast} />
      </IonContent>
    </IonPage>
  );
};

export default Register;
