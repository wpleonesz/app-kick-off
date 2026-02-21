import React from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonChip,
  IonLabel,
} from "@ionic/react";
import {
  createOutline,
  trashOutline,
  toggleOutline,
  addCircleOutline,
  timeOutline,
  calendarOutline,
  timerOutline,
} from "ionicons/icons";
import type { CourtSchedule } from "../../interfaces";
import { getDayName } from "../../interfaces/courtSchedule";

export interface ScheduleListCardProps {
  courtName: string;
  schedules: CourtSchedule[];
  isLoading?: boolean;
  isOwner?: boolean;
  onAdd?: () => void;
  onEdit?: (schedule: CourtSchedule) => void;
  onDelete?: (schedule: CourtSchedule) => void;
  onToggleActive?: (schedule: CourtSchedule) => void;
}

/**
 * Muestra la lista de horarios de una cancha con acciones de edición.
 */
export const ScheduleListCard: React.FC<ScheduleListCardProps> = ({
  courtName,
  schedules,
  isLoading = false,
  isOwner = false,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  if (isLoading) {
    return (
      <IonCard
        style={{
          borderRadius: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        }}
      >
        <IonCardContent
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <IonSpinner name="crescent" />
        </IonCardContent>
      </IonCard>
    );
  }

  // Ordenar horarios por día y hora
  const sorted = [...schedules].sort((a, b) =>
    a.dayOfWeek !== b.dayOfWeek
      ? a.dayOfWeek - b.dayOfWeek
      : a.startTime.localeCompare(b.startTime),
  );

  return (
    <IonCard
      style={{
        borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        overflow: "hidden",
      }}
    >
      <IonCardHeader
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "4px",
        }}
      >
        <IonCardTitle
          style={{
            fontSize: "16px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <IonIcon icon={calendarOutline} color="primary" />
          Horarios
        </IonCardTitle>

        {isOwner && onAdd && (
          <IonButton
            fill="clear"
            size="small"
            onClick={onAdd}
            style={{ marginLeft: "auto" }}
          >
            <IonIcon icon={addCircleOutline} slot="start" />
            Agregar
          </IonButton>
        )}
      </IonCardHeader>

      <IonCardContent style={{ paddingTop: "4px" }}>
        {sorted.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "18px 10px",
              color: "var(--ion-color-medium)",
              fontSize: "14px",
            }}
          >
            No hay horarios configurados
            {isOwner && (
              <IonText
                color="primary"
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
                onClick={onAdd}
              >
                + Agregar horario
              </IonText>
            )}
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {sorted.map((s) => (
              <ScheduleRow
                key={s.id}
                schedule={s}
                isOwner={isOwner}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            ))}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

/* ---------- Fila individual ---------- */

interface ScheduleRowProps {
  schedule: CourtSchedule;
  isOwner: boolean;
  onEdit?: (s: CourtSchedule) => void;
  onDelete?: (s: CourtSchedule) => void;
  onToggleActive?: (s: CourtSchedule) => void;
}

const ScheduleRow: React.FC<ScheduleRowProps> = ({
  schedule,
  isOwner,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const dayLabel = getDayName(schedule.dayOfWeek);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "10px 12px",
        borderRadius: "12px",
        background: schedule.active
          ? "var(--ion-color-light, #f4f5f8)"
          : "rgba(var(--ion-color-danger-rgb), 0.06)",
        opacity: schedule.active ? 1 : 0.7,
        transition: "opacity 0.2s",
      }}
    >
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <IonChip
            color={schedule.active ? "primary" : "medium"}
            style={{
              margin: 0,
              height: "24px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <IonLabel>{dayLabel}</IonLabel>
          </IonChip>

          <IonBadge
            color={schedule.active ? "success" : "danger"}
            style={{
              fontSize: "10px",
              padding: "3px 8px",
              borderRadius: "10px",
            }}
          >
            {schedule.active ? "Activo" : "Inactivo"}
          </IonBadge>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "6px",
            fontSize: "13px",
            color: "var(--ion-color-dark)",
          }}
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <IonIcon icon={timeOutline} color="medium" />
            {schedule.startTime} - {schedule.endTime}
          </span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <IonIcon icon={timerOutline} color="medium" />
            {schedule.duration} min
          </span>
        </div>
      </div>

      {/* Acciones (solo owner) */}
      {isOwner && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            flexShrink: 0,
          }}
        >
          {onToggleActive && (
            <IonButton
              fill="clear"
              size="small"
              color={schedule.active ? "warning" : "success"}
              onClick={() => onToggleActive(schedule)}
              title={schedule.active ? "Desactivar" : "Activar"}
            >
              <IonIcon icon={toggleOutline} slot="icon-only" />
            </IonButton>
          )}
          {onEdit && (
            <IonButton
              fill="clear"
              size="small"
              color="primary"
              onClick={() => onEdit(schedule)}
            >
              <IonIcon icon={createOutline} slot="icon-only" />
            </IonButton>
          )}
          {onDelete && (
            <IonButton
              fill="clear"
              size="small"
              color="danger"
              onClick={() => onDelete(schedule)}
            >
              <IonIcon icon={trashOutline} slot="icon-only" />
            </IonButton>
          )}
        </div>
      )}
    </div>
  );
};
