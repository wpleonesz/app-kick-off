import React, { useEffect } from "react";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonText,
  IonNote,
  IonToggle,
  IonSpinner,
  IonRow,
} from "@ionic/react";
import { closeOutline, saveOutline } from "ionicons/icons";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courtSchema, type CourtFormData } from "../../schemas/court.schemas";
import { FormInput } from "../FormInput";
import type { Court } from "../../interfaces";
import { useGeolocation } from "../../hooks/useGeolocation";
import { LocationMapPicker } from "./LocationMapPicker";

// Workaround: zodResolver con schemas que usan .optional().default() genera
// mismatch en los genéricos de react-hook-form. Casteamos a any para evitarlo.
const resolver = zodResolver(courtSchema) as any;

/**
 * Props para el contenido del formulario de cancha.
 * NOTA: Este componente ya NO envuelve IonModal.
 * El <IonModal> debe declararse en el componente padre (Courts.tsx).
 */
export interface CourtFormContentProps {
  onDismiss: () => void;
  onSubmit: (data: CourtFormData) => void;
  court?: Court | null;
  isSubmitting?: boolean;
  defaultUserId: number;
  /** Indica si el modal padre ya terminó de presentarse (para renderizar el mapa) */
  mapVisible?: boolean;
}

export const CourtFormContent: React.FC<CourtFormContentProps> = ({
  onDismiss,
  onSubmit,
  court,
  isSubmitting = false,
  defaultUserId,
  mapVisible = false,
}) => {
  const isEditing = !!court;

  const geo = useGeolocation();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourtFormData>({
    resolver,
    defaultValues: {
      name: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
      userId: defaultUserId,
      isIndoor: false,
      active: true,
    },
  });

  // Rellenar el form cuando cambia el court (edición) o se resetea (creación)
  useEffect(() => {
    if (court) {
      reset({
        name: court.name,
        location: court.location,
        latitude: court.latitude,
        longitude: court.longitude,
        userId: court.userId,
        isIndoor: court.isIndoor,
        active: court.active,
      });
    } else {
      reset({
        name: "",
        location: "",
        latitude: undefined,
        longitude: undefined,
        userId: defaultUserId,
        isIndoor: false,
        active: true,
      });
    }
  }, [court, defaultUserId, reset]);

  // Observar los valores actuales de lat/lng del formulario
  const currentLat = watch("latitude");
  const currentLng = watch("longitude");

  /** Detectar ubicación GPS y rellenar lat/lng en el form */
  const handleDetectLocation = async () => {
    const result = await geo.getCurrentPosition();
    if (result) {
      setValue("latitude", parseFloat(result.latitude.toFixed(6)), {
        shouldValidate: true,
      });
      setValue("longitude", parseFloat(result.longitude.toFixed(6)), {
        shouldValidate: true,
      });
    }
  };

  /** Click en el mapa para seleccionar ubicación manualmente */
  const handleMapClick = (lat: number, lng: number) => {
    setValue("latitude", parseFloat(lat.toFixed(6)), { shouldValidate: true });
    setValue("longitude", parseFloat(lng.toFixed(6)), { shouldValidate: true });
  };

  const handleFormSubmit = (data: CourtFormData) => {
    onSubmit(data);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss} disabled={isSubmitting}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{isEditing ? "Editar Cancha" : "Nueva Cancha"}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isSubmitting}
              color="primary"
            >
              {isSubmitting ? (
                <IonSpinner name="crescent" style={{ width: "20px" }} />
              ) : (
                <>
                  <IonIcon icon={saveOutline} slot="start" />
                  Guardar
                </>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Nombre */}
          <FormInput<CourtFormData>
            name="name"
            control={control}
            label="Nombre de la cancha"
            placeholder="Ej: Cancha El Dorado"
            required
            error={errors.name?.message}
          />

          {/* Ubicación */}
          <FormInput<CourtFormData>
            name="location"
            control={control}
            label="Dirección"
            placeholder="Ej: Av. Principal 123, Quito"
            required
            error={errors.location?.message}
          />

          {/* Mapa + Geolocalización */}
          <LocationMapPicker
            latitude={currentLat ?? null}
            longitude={currentLng ?? null}
            loading={geo.loading}
            error={geo.error}
            onDetectLocation={handleDetectLocation}
            onMapClick={handleMapClick}
            visible={mapVisible}
          />

          {/* Toggles */}
          <IonItem
            lines="none"
            style={{
              "--background": "transparent",
              "--padding-start": "0",
              marginBottom: "10px",
            }}
          >
            <IonLabel style={{ fontSize: "14px", fontWeight: 600 }}>
              Cancha techada
            </IonLabel>
            <Controller
              name="isIndoor"
              control={control}
              render={({ field }) => (
                <IonToggle
                  checked={field.value}
                  onIonChange={(e) => field.onChange(e.detail.checked)}
                />
              )}
            />
          </IonItem>

          {isEditing && (
            <IonItem
              lines="none"
              style={{
                "--background": "transparent",
                "--padding-start": "0",
                marginBottom: "10px",
              }}
            >
              <IonLabel style={{ fontSize: "14px", fontWeight: 600 }}>
                Cancha activa
              </IonLabel>
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <IonToggle
                    checked={field.value}
                    onIonChange={(e) => field.onChange(e.detail.checked)}
                  />
                )}
              />
            </IonItem>
          )}
        </form>
      </IonContent>
    </>
  );
};
