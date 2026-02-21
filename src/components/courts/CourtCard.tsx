import React from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonChip,
  IonIcon,
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonButtons,
} from "@ionic/react";
import {
  locationOutline,
  personOutline,
  footballOutline,
  createOutline,
  trashOutline,
  sunnyOutline,
  homeOutline,
} from "ionicons/icons";
import type { Court } from "../../interfaces";

interface CourtCardProps {
  court: Court;
  onEdit?: (court: Court) => void;
  onDelete?: (court: Court) => void;
  onView?: (court: Court) => void;
  showActions?: boolean;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  court,
  onEdit,
  onDelete,
  onView,
  showActions = true,
}) => {
  return (
    <IonCard
      className="fb-card"
      style={{ borderRadius: "var(--fb-radius-lg)", overflow: "hidden" }}
      button={!!onView}
      onClick={() => onView?.(court)}
    >
      {/* Header con icono y nombre */}
      <IonCardHeader style={{ paddingBottom: "4px" }}>
        <IonRow className="ion-align-items-center" style={{ gap: "10px" }}>
          <IonText
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              backgroundColor: court.active
                ? "rgba(24,119,242,0.12)"
                : "rgba(101,103,107,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: court.active
                ? "var(--ion-color-primary)"
                : "var(--ion-color-medium)",
              flexShrink: 0,
            }}
          >
            <IonIcon icon={footballOutline} />
          </IonText>
          <div style={{ flex: 1, minWidth: 0 }}>
            <IonCardTitle
              style={{
                fontSize: "16px",
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {court.name}
            </IonCardTitle>
            <IonCardSubtitle style={{ fontSize: "13px", marginTop: "2px" }}>
              {court.User?.username
                ? `@${court.User.username}`
                : `Usuario #${court.userId}`}
            </IonCardSubtitle>
          </div>
          <IonChip
            style={{
              fontSize: "11px",
              height: "24px",
              margin: 0,
              "--background": court.active
                ? "rgba(66,183,42,0.12)"
                : "rgba(250,62,62,0.12)",
              "--color": court.active
                ? "var(--ion-color-success)"
                : "var(--ion-color-danger)",
            }}
          >
            {court.active ? "Activa" : "Inactiva"}
          </IonChip>
        </IonRow>
      </IonCardHeader>

      <IonCardContent style={{ paddingTop: "8px" }}>
        {/* Ubicación */}
        <IonRow
          className="ion-align-items-center"
          style={{ gap: "6px", marginBottom: "8px" }}
        >
          <IonIcon
            icon={locationOutline}
            style={{ fontSize: "16px", color: "var(--ion-color-medium)" }}
          />
          <IonText
            style={{
              fontSize: "14px",
              color: "var(--ion-text-color)",
              flex: 1,
            }}
          >
            {court.location}
          </IonText>
        </IonRow>

        {/* Tipo de cancha */}
        <IonRow
          className="ion-align-items-center"
          style={{ gap: "6px", marginBottom: "8px" }}
        >
          <IonIcon
            icon={court.isIndoor ? homeOutline : sunnyOutline}
            style={{ fontSize: "16px", color: "var(--ion-color-medium)" }}
          />
          <IonText
            style={{ fontSize: "13px", color: "var(--ion-color-medium)" }}
          >
            {court.isIndoor ? "Cancha techada" : "Cancha al aire libre"}
          </IonText>
        </IonRow>

        {/* Coordenadas si existen */}
        {court.latitude != null && court.longitude != null && (
          <IonRow style={{ marginBottom: "8px" }}>
            <IonText
              style={{ fontSize: "12px", color: "var(--ion-color-medium)" }}
            >
              📍 {court.latitude.toFixed(4)}, {court.longitude.toFixed(4)}
            </IonText>
          </IonRow>
        )}

        {/* Acciones */}
        {showActions && (onEdit || onDelete) && (
          <IonRow
            className="ion-justify-content-end"
            style={{
              gap: "4px",
              borderTop: "1px solid var(--ion-border-color)",
              paddingTop: "8px",
              marginTop: "4px",
            }}
          >
            {onEdit && (
              <IonButton
                fill="clear"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(court);
                }}
              >
                <IonIcon icon={createOutline} slot="start" />
                Editar
              </IonButton>
            )}
            {onDelete && (
              <IonButton
                fill="clear"
                size="small"
                color="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(court);
                }}
              >
                <IonIcon icon={trashOutline} slot="start" />
                Desactivar
              </IonButton>
            )}
          </IonRow>
        )}
      </IonCardContent>
    </IonCard>
  );
};
