import React, { useMemo, useState } from "react";
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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonToggle,
  IonNote,
  IonChip,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import {
  closeOutline,
  saveOutline,
  alertCircleOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookingSchema,
  type BookingFormData,
} from "../../schemas/booking.schemas";
import type { CourtSchedule } from "../../interfaces";
import { getDayName } from "../../interfaces/courtSchedule";

interface BookingFormContentProps {
  onDismiss: () => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  courtId: number;
  courtName: string;
  userId: number;
  schedules: CourtSchedule[];
  isSubmitting?: boolean;
}

function jsDateDayToBackend(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

function getSpanishDayName(date: Date): string {
  return date.toLocaleDateString("es-EC", { weekday: "long" });
}

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

export const BookingFormContent: React.FC<BookingFormContentProps> = ({
  onDismiss,
  onSubmit,
  courtId,
  courtName,
  userId,
  schedules,
  isSubmitting = false,
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "validating" | "sending" | "success"
  >("idle");

  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.active),
    [schedules],
  );

  const availableDays = useMemo(() => {
    const days = [...new Set(activeSchedules.map((s) => s.dayOfWeek))].sort();
    return days.map((d) => getDayName(d));
  }, [activeSchedules]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      courtId,
      userId,
      scheduleId: 0,
      date: "",
      notes: "",
      requiresReferee: false,
      refereeId: null,
    },
  });

  const selectedDate = watch("date");
  const selectedScheduleId = watch("scheduleId");

  const { schedulesForDay, selectedDayName, dayMismatch } = useMemo(() => {
    if (!selectedDate) {
      return {
        schedulesForDay: activeSchedules,
        selectedDayName: "",
        dayMismatch: false,
      };
    }
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const backendDay = jsDateDayToBackend(dateObj.getDay());
    const dayName = getSpanishDayName(dateObj);
    const filtered = activeSchedules.filter((s) => s.dayOfWeek === backendDay);
    return {
      schedulesForDay: filtered,
      selectedDayName: dayName,
      dayMismatch: filtered.length === 0,
    };
  }, [selectedDate, activeSchedules]);

  const selectedSchedule = useMemo(() => {
    if (!selectedScheduleId) return null;
    return activeSchedules.find((s) => s.id === selectedScheduleId) ?? null;
  }, [selectedScheduleId, activeSchedules]);

  const today = new Date().toISOString().split("T")[0];

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const wrappedSubmit = async (data: BookingFormData) => {
    setApiError(null);
    setSubmitStatus("validating");

    if (data.date && data.scheduleId) {
      const [y, m, d] = data.date.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const backendDay = jsDateDayToBackend(dateObj.getDay());
      const schedule = activeSchedules.find((s) => s.id === data.scheduleId);
      if (schedule && schedule.dayOfWeek !== backendDay) {
        const dayName = getSpanishDayName(dateObj);
        setApiError(
          `El horario seleccionado es para ${getDayName(schedule.dayOfWeek)}, pero la fecha elegida cae ${dayName}. Selecciona una fecha que sea ${getDayName(schedule.dayOfWeek)} o elige un horario diferente.`,
        );
        setSubmitStatus("idle");
        return;
      }
    }

    setSubmitStatus("sending");
    try {
      await onSubmit(data);
      setSubmitStatus("success");
    } catch (error: unknown) {
      setSubmitStatus("idle");
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : typeof error === "object" && error !== null
              ? (error as any).message ||
                (error as any).error ||
                JSON.stringify(error)
              : "Error desconocido al crear la reserva";
      setApiError(
        msg === "{}" || !msg
          ? "No se pudo crear la reserva. Verifica los datos e intenta de nuevo."
          : msg,
      );
    }
  };

  const canSubmit =
    !isSubmitting &&
    activeSchedules.length > 0 &&
    submitStatus !== "sending" &&
    submitStatus !== "success";

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss} disabled={isSubmitting}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Nueva Reserva</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong
              onClick={handleSubmit(wrappedSubmit)}
              disabled={!canSubmit || dayMismatch}
              color="primary"
            >
              {isSubmitting || submitStatus === "sending" ? (
                <IonSpinner name="crescent" style={{ width: "20px" }} />
              ) : (
                <>
                  <IonIcon icon={saveOutline} slot="start" />
                  Reservar
                </>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Cancha asociada */}
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
          {courtName}
        </div>

        {/* Días disponibles */}
        {availableDays.length > 0 && (
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <IonNote style={{ fontSize: "12px" }}>Días con horario:</IonNote>
            {availableDays.map((day) => (
              <IonChip
                key={day}
                color="primary"
                outline
                style={{ height: "24px", margin: 0, fontSize: "11px", fontWeight: 600 }}
              >
                {day}
              </IonChip>
            ))}
          </div>
        )}

        {/* Sin horarios */}
        {activeSchedules.length === 0 && (
          <AlertCard
            color="warning"
            icon={alertCircleOutline}
            title="Sin horarios disponibles"
            message="Esta cancha no tiene horarios activos configurados. Contacta al administrador de la cancha."
          />
        )}

        {activeSchedules.length > 0 && (
          <form onSubmit={handleSubmit(wrappedSubmit)}>
            {/* ── Fecha ── */}
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
                Fecha de reserva <IonText color="primary">*</IonText>
              </IonLabel>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    min={today}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setApiError(null);
                    }}
                    onBlur={field.onBlur}
                    style={errors.date ? errorInputStyle : inputStyle}
                  />
                )}
              />
              {errors.date && (
                <IonNote color="danger" style={{ fontSize: "12px", marginTop: "4px" }}>
                  {errors.date.message}
                </IonNote>
              )}
              {selectedDate && formattedDate && (
                <IonNote
                  style={{
                    fontSize: "12px",
                    marginTop: "4px",
                    textTransform: "capitalize",
                  }}
                >
                  {formattedDate}
                </IonNote>
              )}
            </IonItem>

            {/* Alerta día sin horarios */}
            {dayMismatch && selectedDate && (
              <AlertCard
                color="warning"
                icon={alertCircleOutline}
                title={`No hay horarios para ${selectedDayName}`}
                message={`Esta cancha solo tiene horarios los: ${availableDays.join(", ")}. Selecciona una fecha que caiga en uno de esos días.`}
                style={{ marginBottom: "14px" }}
              />
            )}

            {/* ── Horario ── */}
            <div
              style={{
                marginBottom: "14px",
                opacity: !selectedDate || dayMismatch ? 0.5 : 1,
              }}
            >
              <IonLabel
                style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", display: "block" }}
              >
                Horario <IonText color="primary">*</IonText>
              </IonLabel>
              {(!selectedDate || dayMismatch) ? (
                <div
                  style={{
                    ...inputStyle,
                    padding: "12px 14px",
                    color: "var(--ion-color-medium)",
                    cursor: "not-allowed",
                  }}
                >
                  {!selectedDate
                    ? "Primero selecciona una fecha"
                    : "No hay horarios para este día"}
                </div>
              ) : (
                <Controller
                  name="scheduleId"
                  control={control}
                  render={({ field }) => (
                    <IonSelect
                      value={field.value > 0 ? field.value : undefined}
                      onIonChange={(e) => {
                        field.onChange(Number(e.detail.value));
                        setApiError(null);
                      }}
                      interface="action-sheet"
                      placeholder="Selecciona un horario"
                      style={{
                        width: "100%",
                        ...inputStyle,
                        padding: "8px 14px",
                      }}
                    >
                      {schedulesForDay.map((s) => (
                        <IonSelectOption key={s.id} value={s.id}>
                          {getDayName(s.dayOfWeek)} {s.startTime} - {s.endTime} (
                          {s.duration}min)
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  )}
                />
              )}
              {errors.scheduleId && (
                <IonNote color="danger" style={{ fontSize: "12px", marginTop: "4px" }}>
                  {errors.scheduleId.message}
                </IonNote>
              )}
            </div>

            {/* Resumen horario seleccionado */}
            {selectedSchedule && !dayMismatch && (
              <AlertCard
                color="success"
                icon={informationCircleOutline}
                message={`${getDayName(selectedSchedule.dayOfWeek)} ${selectedSchedule.startTime} - ${selectedSchedule.endTime} (${selectedSchedule.duration} minutos)`}
                style={{ marginBottom: "14px" }}
              />
            )}

            {/* ── Notas ── */}
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
                Notas{" "}
                <IonText color="medium">(opcional)</IonText>
              </IonLabel>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    placeholder="Ej: Partido amistoso, necesitamos balones..."
                    rows={2}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    style={inputStyle}
                  />
                )}
              />
            </IonItem>

            {/* ── Requiere árbitro ── */}
            <IonItem
              lines="none"
              style={{
                "--background": "transparent",
                "--padding-start": "0",
                marginBottom: "14px",
              }}
            >
              <IonLabel style={{ fontSize: "14px", fontWeight: 600 }}>
                Requiere árbitro
              </IonLabel>
              <Controller
                name="requiresReferee"
                control={control}
                render={({ field }) => (
                  <IonToggle
                    checked={field.value}
                    onIonChange={(e) => field.onChange(e.detail.checked)}
                  />
                )}
              />
            </IonItem>

            {/* ── Error del API ── */}
            {apiError && (
              <AlertCard
                color="danger"
                icon={alertCircleOutline}
                title="No se pudo reservar"
                message={apiError}
                style={{ marginBottom: "14px" }}
              />
            )}

            {/* ── Éxito ── */}
            {submitStatus === "success" && (
              <AlertCard
                color="success"
                icon={checkmarkCircleOutline}
                title="Reserva creada exitosamente"
                style={{ marginBottom: "14px" }}
              />
            )}

            {/* ── Botón submit ── */}
            <IonButton
              expand="block"
              type="submit"
              disabled={!canSubmit || dayMismatch}
              style={{ "--border-radius": "10px", height: "48px" }}
            >
              {submitStatus === "validating" ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IonSpinner name="crescent" style={{ width: "18px", height: "18px" }} />
                  Validando datos...
                </span>
              ) : submitStatus === "sending" || isSubmitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IonSpinner name="crescent" style={{ width: "18px", height: "18px" }} />
                  Procesando reserva...
                </span>
              ) : (
                "Confirmar Reserva"
              )}
            </IonButton>

            {(submitStatus === "sending" || isSubmitting) && (
              <IonNote
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: "8px",
                  fontSize: "12px",
                }}
                color="medium"
              >
                Verificando disponibilidad del horario con el servidor...
              </IonNote>
            )}
          </form>
        )}
      </IonContent>
    </>
  );
};

/* ── Card de alerta reutilizable ── */
interface AlertCardProps {
  color: "warning" | "danger" | "success";
  icon: string;
  title?: string;
  message?: string;
  style?: React.CSSProperties;
}

const AlertCard: React.FC<AlertCardProps> = ({
  color,
  icon,
  title,
  message,
  style,
}) => (
  <div
    style={{
      padding: "10px 12px",
      borderRadius: "10px",
      backgroundColor: `rgba(var(--ion-color-${color}-rgb), 0.08)`,
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      ...style,
    }}
  >
    <IonIcon
      icon={icon}
      color={color}
      style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}
    />
    <div>
      {title && (
        <IonText
          color={color}
          style={{ fontSize: "13px", fontWeight: 600, display: "block" }}
        >
          {title}
        </IonText>
      )}
      {message && (
        <IonNote style={{ fontSize: "12px", color: `var(--ion-color-${color})` }}>
          {message}
        </IonNote>
      )}
    </div>
  </div>
);
