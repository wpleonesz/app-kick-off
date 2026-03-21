import React, { useEffect, useMemo, useState } from "react";
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
import type { Booking, CourtSchedule, User } from "../../interfaces";
import { getDayName } from "../../interfaces/courtSchedule";

interface BookingFormContentProps {
  onDismiss: () => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  courtId: number;
  courtName: string;
  userId: number;
  schedules: CourtSchedule[];
  bookings: Booking[];
  users?: User[];
  canAssignUser?: boolean;
  isUsersLoading?: boolean;
  bookingToEdit?: Booking | null;
  allowMultipleSchedules?: boolean;
  isSubmitting?: boolean;
}

function jsDateDayToBackend(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

function parseDateOnlyUTC(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function normalizeToUtcDay(value: string): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }

  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  );
}

function getSpanishDayName(date: Date): string {
  return date.toLocaleDateString("es-EC", {
    weekday: "long",
    timeZone: "UTC",
  });
}

function getLocalDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateInputValue(value: string): string {
  const date = normalizeToUtcDay(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  bookings,
  users = [],
  canAssignUser = false,
  isUsersLoading = false,
  bookingToEdit = null,
  allowMultipleSchedules = true,
  isSubmitting = false,
}) => {
  const isEditMode = !!bookingToEdit;
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

  const selectableUsers = useMemo(() => {
    const cleaned = users
      .filter((item) => item?.id && item.active !== false)
      .map((item) => {
        const displayName =
          item.Person?.name ||
          item.name ||
          [item.firstName, item.lastName].filter(Boolean).join(" ") ||
          item.username;
        return {
          id: item.id,
          username: item.username,
          email: item.email,
          label: displayName,
        };
      });

    return cleaned.sort((a, b) => a.label.localeCompare(b.label));
  }, [users]);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      courtId,
      userId,
      scheduleIds: [],
      date: "",
      notes: "",
      requiresReferee: false,
      refereeId: null,
    },
  });

  const selectedDate = watch("date");
  const selectedScheduleIds = watch("scheduleIds");

  useEffect(() => {
    if (!bookingToEdit) {
      reset({
        courtId,
        userId,
        scheduleIds: [],
        date: "",
        notes: "",
        requiresReferee: false,
        refereeId: null,
      });
      return;
    }

    reset({
      courtId,
      userId: bookingToEdit.userId,
      scheduleIds: [bookingToEdit.scheduleId],
      date: toDateInputValue(bookingToEdit.date),
      notes: bookingToEdit.notes || "",
      requiresReferee: !!bookingToEdit.requiresReferee,
      refereeId: bookingToEdit.refereeId ?? null,
    });
  }, [bookingToEdit, courtId, userId, reset]);

  const { schedulesForDay, selectedDayName, dayMismatch } = useMemo(() => {
    if (!selectedDate) {
      return {
        schedulesForDay: activeSchedules,
        selectedDayName: "",
        dayMismatch: false,
      };
    }
    const dateObj = parseDateOnlyUTC(selectedDate);
    const backendDay = jsDateDayToBackend(dateObj.getUTCDay());
    const dayName = getSpanishDayName(dateObj);
    const filtered = activeSchedules.filter((s) => s.dayOfWeek === backendDay);
    return {
      schedulesForDay: filtered,
      selectedDayName: dayName,
      dayMismatch: filtered.length === 0,
    };
  }, [selectedDate, activeSchedules]);

  const occupiedScheduleIds = useMemo(() => {
    if (!selectedDate) return new Set<number>();

    const selectedUtcDay = normalizeToUtcDay(selectedDate).getTime();
    const occupiedIds = bookings
      .filter((booking) => {
        if (!booking.active || booking.status === "cancelled") return false;
        if (isEditMode && bookingToEdit && booking.id === bookingToEdit.id) {
          return false;
        }
        return normalizeToUtcDay(booking.date).getTime() === selectedUtcDay;
      })
      .map((booking) => booking.scheduleId);

    return new Set(occupiedIds);
  }, [selectedDate, bookings, isEditMode, bookingToEdit]);

  const availableSchedulesForDay = useMemo(
    () =>
      schedulesForDay.filter(
        (schedule) => !occupiedScheduleIds.has(schedule.id),
      ),
    [schedulesForDay, occupiedScheduleIds],
  );

  const selectedSchedules = useMemo(
    () =>
      activeSchedules.filter((schedule) =>
        (selectedScheduleIds ?? []).includes(schedule.id),
      ),
    [selectedScheduleIds, activeSchedules],
  );

  useEffect(() => {
    if (!selectedScheduleIds?.length) return;
    const availableIds = new Set(
      availableSchedulesForDay.map((schedule) => schedule.id),
    );
    const filtered = selectedScheduleIds.filter((id) => availableIds.has(id));
    if (filtered.length !== selectedScheduleIds.length) {
      setValue("scheduleIds", filtered, { shouldValidate: true });
    }
  }, [selectedScheduleIds, availableSchedulesForDay, setValue]);

  const today = getLocalDateInputValue();

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";
    const dateObj = parseDateOnlyUTC(selectedDate);
    return dateObj.toLocaleDateString("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }, [selectedDate]);

  const wrappedSubmit = async (data: BookingFormData) => {
    setApiError(null);
    setSubmitStatus("validating");

    if (data.date && data.scheduleIds.length > 0) {
      const dateObj = parseDateOnlyUTC(data.date);
      const backendDay = jsDateDayToBackend(dateObj.getUTCDay());
      const invalidSchedule = activeSchedules.find(
        (schedule) =>
          data.scheduleIds.includes(schedule.id) &&
          schedule.dayOfWeek !== backendDay,
      );

      if (invalidSchedule) {
        const dayName = getSpanishDayName(dateObj);
        setApiError(
          `Uno de los horarios seleccionados es para ${getDayName(invalidSchedule.dayOfWeek)}, pero la fecha elegida cae ${dayName}. Selecciona una fecha que coincida con los horarios elegidos.`,
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
    (isEditMode || availableSchedulesForDay.length > 0) &&
    selectedScheduleIds.length > 0 &&
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
          <IonTitle>
            {bookingToEdit ? "Editar Reserva" : "Nueva Reserva"}
          </IonTitle>
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
                  {bookingToEdit ? "Guardar" : "Reservar"}
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
                style={{
                  height: "24px",
                  margin: 0,
                  fontSize: "11px",
                  fontWeight: 600,
                }}
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
            {canAssignUser && (
              <div style={{ marginBottom: "14px" }}>
                <IonLabel
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Asignar reserva a usuario <IonText color="primary">*</IonText>
                </IonLabel>

                {isUsersLoading ? (
                  <div
                    style={{
                      ...inputStyle,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <IonSpinner name="crescent" style={{ width: "16px" }} />
                    Cargando usuarios...
                  </div>
                ) : (
                  <Controller
                    name="userId"
                    control={control}
                    render={({ field }) => (
                      <IonSelect
                        value={field.value > 0 ? field.value : undefined}
                        onIonChange={(e) => {
                          field.onChange(Number(e.detail.value));
                          setApiError(null);
                        }}
                        interface="alert"
                        placeholder="Selecciona un usuario"
                        style={{
                          width: "100%",
                          ...inputStyle,
                          padding: "8px 14px",
                        }}
                      >
                        {selectableUsers.map((item) => (
                          <IonSelectOption key={item.id} value={item.id}>
                            {item.label} (@{item.username})
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    )}
                  />
                )}

                {errors.userId && (
                  <IonNote
                    color="danger"
                    style={{ fontSize: "12px", marginTop: "4px" }}
                  >
                    {errors.userId.message}
                  </IonNote>
                )}

                {!isUsersLoading && selectableUsers.length === 0 && (
                  <IonNote
                    color="warning"
                    style={{ fontSize: "12px", marginTop: "4px" }}
                  >
                    No se pudieron cargar usuarios para asignar la reserva.
                  </IonNote>
                )}
              </div>
            )}

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
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
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
                <IonNote
                  color="danger"
                  style={{ fontSize: "12px", marginTop: "4px" }}
                >
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
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Horarios <IonText color="primary">*</IonText>
              </IonLabel>
              {!selectedDate || dayMismatch ? (
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
                  name="scheduleIds"
                  control={control}
                  render={({ field }) => (
                    <IonSelect
                      value={
                        allowMultipleSchedules
                          ? field.value
                          : (field.value?.[0] ?? undefined)
                      }
                      onIonChange={(e) => {
                        const values = allowMultipleSchedules
                          ? ((e.detail.value as number[]) ?? [])
                          : e.detail.value
                            ? [Number(e.detail.value)]
                            : [];
                        field.onChange(values);
                        setApiError(null);
                      }}
                      disabled={isEditMode}
                      multiple={allowMultipleSchedules}
                      interface="alert"
                      placeholder={
                        allowMultipleSchedules
                          ? "Selecciona uno o varios horarios"
                          : "Selecciona un horario"
                      }
                      style={{
                        width: "100%",
                        ...inputStyle,
                        padding: "8px 14px",
                      }}
                    >
                      {availableSchedulesForDay.map((s) => (
                        <IonSelectOption key={s.id} value={s.id}>
                          {getDayName(s.dayOfWeek)} {s.startTime} - {s.endTime}{" "}
                          ({s.duration}min)
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  )}
                />
              )}
              {errors.scheduleIds && (
                <IonNote
                  color="danger"
                  style={{ fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.scheduleIds.message}
                </IonNote>
              )}

              {!dayMismatch &&
                selectedDate &&
                availableSchedulesForDay.length === 0 && (
                  <IonNote
                    color="warning"
                    style={{ fontSize: "12px", marginTop: "4px" }}
                  >
                    Todos los horarios de este dia ya estan ocupados.
                  </IonNote>
                )}

              {isEditMode && (
                <IonNote
                  color="medium"
                  style={{ fontSize: "12px", marginTop: "4px" }}
                >
                  El horario de una reserva agendada no se puede cambiar.
                </IonNote>
              )}
            </div>

            {/* Resumen horario seleccionado */}
            {selectedSchedules.length > 0 && !dayMismatch && (
              <AlertCard
                color="success"
                icon={informationCircleOutline}
                message={`${selectedSchedules.length} horario(s) seleccionados: ${selectedSchedules
                  .map(
                    (schedule) => `${schedule.startTime}-${schedule.endTime}`,
                  )
                  .join(", ")}`}
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
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                Notas <IonText color="medium">(opcional)</IonText>
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
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <IonSpinner
                    name="crescent"
                    style={{ width: "18px", height: "18px" }}
                  />
                  Validando datos...
                </span>
              ) : submitStatus === "sending" || isSubmitting ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <IonSpinner
                    name="crescent"
                    style={{ width: "18px", height: "18px" }}
                  />
                  Procesando reserva...
                </span>
              ) : bookingToEdit ? (
                "Guardar Cambios"
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
        <IonNote
          style={{ fontSize: "12px", color: `var(--ion-color-${color})` }}
        >
          {message}
        </IonNote>
      )}
    </div>
  </div>
);
