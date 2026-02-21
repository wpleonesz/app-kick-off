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
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { closeOutline, saveOutline } from "ionicons/icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  courtScheduleSchema,
  type CourtScheduleFormData,
} from "../../schemas/courtSchedule.schemas";
import type { CourtSchedule } from "../../interfaces";
import { DAYS_OF_WEEK } from "../../interfaces/courtSchedule";

const resolver = zodResolver(courtScheduleSchema) as any;

export interface ScheduleFormContentProps {
  onDismiss: () => void;
  onSubmit: (data: CourtScheduleFormData) => void;
  schedule?: CourtSchedule | null;
  courtId: number;
  courtName?: string;
  isSubmitting?: boolean;
}

/**
 * Formulario para crear/editar un horario de cancha.
 * Se usa dentro de un IonModal declarado en el padre.
 */
export const ScheduleFormContent: React.FC<ScheduleFormContentProps> = ({
  onDismiss,
  onSubmit,
  schedule,
  courtId,
  courtName,
  isSubmitting = false,
}) => {
  const isEditing = !!schedule;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourtScheduleFormData>({
    resolver,
    defaultValues: {
      courtId,
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "09:00",
      duration: 60,
      active: true,
    },
  });

  useEffect(() => {
    if (schedule) {
      reset({
        courtId: schedule.courtId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: schedule.duration,
        active: schedule.active,
      });
    } else {
      reset({
        courtId,
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "09:00",
        duration: 60,
        active: true,
      });
    }
  }, [schedule, courtId, reset]);

  const handleFormSubmit = (data: CourtScheduleFormData) => {
    onSubmit({ ...data, courtId });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid var(--ion-border-color, #e0e0e0)",
    backgroundColor: "var(--ion-color-light)",
    fontSize: "15px",
    color: "var(--ion-text-color)",
    outline: "none",
  };

  const errorInputStyle: React.CSSProperties = {
    ...inputStyle,
    border: "1px solid var(--ion-color-danger)",
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
          <IonTitle>{isEditing ? "Editar Horario" : "Nuevo Horario"}</IonTitle>
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
        {/* Cancha asociada (info) */}
        {courtName && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "14px",
              borderRadius: "8px",
              backgroundColor: "rgba(24,119,242,0.08)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--ion-color-primary)",
            }}
          >
            ⚽ {courtName}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Día de la semana */}
          <IonItem
            lines="none"
            style={{
              marginBottom: "14px",
              "--padding-start": "0",
              "--inner-padding-end": "0",
              "--background": "transparent",
            }}
          >
            <IonLabel
              position="stacked"
              style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}
            >
              Día de la semana <IonText color="primary">*</IonText>
            </IonLabel>
            <Controller
              name="dayOfWeek"
              control={control}
              render={({ field }) => (
                <IonSelect
                  value={field.value}
                  onIonChange={(e) => field.onChange(e.detail.value)}
                  interface="action-sheet"
                  placeholder="Selecciona un día"
                  style={{
                    width: "100%",
                    ...inputStyle,
                    padding: "8px 14px",
                  }}
                >
                  {Object.entries(DAYS_OF_WEEK).map(([value, label]) => (
                    <IonSelectOption key={value} value={Number(value)}>
                      {label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              )}
            />
            {errors.dayOfWeek && (
              <IonNote
                color="danger"
                style={{ fontSize: "12px", marginTop: "4px" }}
              >
                {errors.dayOfWeek.message}
              </IonNote>
            )}
          </IonItem>

          {/* Hora inicio */}
          <IonItem
            lines="none"
            style={{
              marginBottom: "14px",
              "--padding-start": "0",
              "--inner-padding-end": "0",
              "--background": "transparent",
            }}
          >
            <IonLabel
              position="stacked"
              style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}
            >
              Hora de inicio <IonText color="primary">*</IonText>
            </IonLabel>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <input
                  type="time"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  style={errors.startTime ? errorInputStyle : inputStyle}
                />
              )}
            />
            {errors.startTime && (
              <IonNote
                color="danger"
                style={{ fontSize: "12px", marginTop: "4px" }}
              >
                {errors.startTime.message}
              </IonNote>
            )}
          </IonItem>

          {/* Hora fin */}
          <IonItem
            lines="none"
            style={{
              marginBottom: "14px",
              "--padding-start": "0",
              "--inner-padding-end": "0",
              "--background": "transparent",
            }}
          >
            <IonLabel
              position="stacked"
              style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}
            >
              Hora de fin <IonText color="primary">*</IonText>
            </IonLabel>
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <input
                  type="time"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  style={errors.endTime ? errorInputStyle : inputStyle}
                />
              )}
            />
            {errors.endTime && (
              <IonNote
                color="danger"
                style={{ fontSize: "12px", marginTop: "4px" }}
              >
                {errors.endTime.message}
              </IonNote>
            )}
          </IonItem>

          {/* Duración */}
          <IonItem
            lines="none"
            style={{
              marginBottom: "14px",
              "--padding-start": "0",
              "--inner-padding-end": "0",
              "--background": "transparent",
            }}
          >
            <IonLabel
              position="stacked"
              style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}
            >
              Duración (minutos){" "}
              <IonText color="medium">(opcional, defecto: 60)</IonText>
            </IonLabel>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <IonSelect
                  value={field.value}
                  onIonChange={(e) => field.onChange(e.detail.value)}
                  interface="popover"
                  placeholder="60 min"
                  style={{
                    width: "100%",
                    ...inputStyle,
                    padding: "8px 14px",
                  }}
                >
                  <IonSelectOption value={30}>30 min</IonSelectOption>
                  <IonSelectOption value={45}>45 min</IonSelectOption>
                  <IonSelectOption value={60}>60 min (1h)</IonSelectOption>
                  <IonSelectOption value={90}>90 min (1h 30m)</IonSelectOption>
                  <IonSelectOption value={120}>120 min (2h)</IonSelectOption>
                  <IonSelectOption value={180}>180 min (3h)</IonSelectOption>
                </IonSelect>
              )}
            />
            {errors.duration && (
              <IonNote
                color="danger"
                style={{ fontSize: "12px", marginTop: "4px" }}
              >
                {errors.duration.message}
              </IonNote>
            )}
          </IonItem>

          {/* Toggle Activo (solo en edición) */}
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
                Horario activo
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
