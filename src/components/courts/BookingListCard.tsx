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
  trashOutline,
  createOutline,
  addCircleOutline,
  calendarOutline,
  timeOutline,
  personOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import type { Booking } from "../../interfaces";
import { BOOKING_STATUS, getBookingStatusColor } from "../../interfaces";

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

export interface BookingListCardProps {
  courtName: string;
  bookings: Booking[];
  isLoading?: boolean;
  canBook?: boolean;
  currentUserId?: number;
  isOwner?: boolean;
  canAssignReferee?: boolean;
  onBook?: () => void;
  onCancel?: (booking: Booking) => void;
  onEdit?: (booking: Booking) => void;
  onAssignReferee?: (booking: Booking) => void;
}

export const BookingListCard: React.FC<BookingListCardProps> = ({
  courtName,
  bookings,
  isLoading = false,
  canBook = false,
  currentUserId,
  isOwner = false,
  canAssignReferee = false,
  onBook,
  onCancel,
  onEdit,
  onAssignReferee,
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

  const activeBookings = bookings.filter(
    (b) => b.active && b.status !== "cancelled",
  );

  // Ordenar por fecha
  const sorted = [...activeBookings].sort(
    (a, b) =>
      normalizeToUtcDay(a.date).getTime() - normalizeToUtcDay(b.date).getTime(),
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
          Reservas
        </IonCardTitle>

        {canBook && onBook && (
          <IonButton
            fill="clear"
            size="small"
            onClick={onBook}
            style={{ marginLeft: "auto" }}
          >
            <IonIcon icon={addCircleOutline} slot="start" />
            Reservar
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
            No hay reservas para esta cancha
            {canBook && (
              <IonText
                color="primary"
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
                onClick={onBook}
              >
                + Hacer una reserva
              </IonText>
            )}
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {sorted.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                canCancel={
                  isOwner ||
                  (currentUserId != null && b.userId === currentUserId)
                }
                canEdit={
                  isOwner ||
                  (currentUserId != null && b.userId === currentUserId)
                }
                canAssignReferee={canAssignReferee}
                onCancel={onCancel}
                onEdit={onEdit}
                onAssignReferee={onAssignReferee}
              />
            ))}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

/* ---------- Fila individual ---------- */

interface BookingRowProps {
  booking: Booking;
  canCancel: boolean;
  canEdit: boolean;
  canAssignReferee: boolean;
  onCancel?: (b: Booking) => void;
  onEdit?: (b: Booking) => void;
  onAssignReferee?: (b: Booking) => void;
}

const BookingRow: React.FC<BookingRowProps> = ({
  booking,
  canCancel,
  canEdit,
  canAssignReferee,
  onCancel,
  onEdit,
  onAssignReferee,
}) => {
  const dateStr = normalizeToUtcDay(booking.date).toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "10px 12px",
        borderRadius: "12px",
        background: "var(--ion-color-light, #f4f5f8)",
      }}
    >
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
            color="primary"
            style={{
              margin: 0,
              height: "24px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <IonLabel>{dateStr}</IonLabel>
          </IonChip>

          <IonBadge
            color={getBookingStatusColor(booking.status)}
            style={{
              fontSize: "10px",
              padding: "3px 8px",
              borderRadius: "10px",
            }}
          >
            {BOOKING_STATUS[booking.status] || booking.status}
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
          {booking.schedule && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <IonIcon icon={timeOutline} color="medium" />
              {booking.schedule.startTime} - {booking.schedule.endTime}
            </span>
          )}
          {booking.user && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <IonIcon icon={personOutline} color="medium" />@
              {booking.user.username}
            </span>
          )}

          {booking.requiresReferee && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <IonIcon icon={shieldCheckmarkOutline} color="medium" />
              {booking.referee?.username
                ? `Arbitro: @${booking.referee.username}`
                : "Arbitro: pendiente"}
            </span>
          )}
        </div>

        {booking.notes && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "var(--ion-color-medium)",
              fontStyle: "italic",
            }}
          >
            {booking.notes}
          </div>
        )}
      </div>

      {canEdit && booking.status !== "cancelled" && onEdit && (
        <div style={{ flexShrink: 0 }}>
          <IonButton
            fill="clear"
            size="small"
            color="primary"
            onClick={() => onEdit(booking)}
          >
            <IonIcon icon={createOutline} slot="icon-only" />
          </IonButton>
        </div>
      )}

      {canCancel && booking.status !== "cancelled" && onCancel && (
        <div style={{ flexShrink: 0 }}>
          <IonButton
            fill="clear"
            size="small"
            color="danger"
            onClick={() => onCancel(booking)}
          >
            <IonIcon icon={trashOutline} slot="icon-only" />
          </IonButton>
        </div>
      )}

      {canAssignReferee &&
        booking.active &&
        booking.status !== "cancelled" &&
        booking.requiresReferee &&
        !booking.refereeId &&
        onAssignReferee && (
          <div style={{ flexShrink: 0 }}>
            <IonButton
              fill="outline"
              size="small"
              color="secondary"
              onClick={() => onAssignReferee(booking)}
            >
              <IonIcon icon={shieldCheckmarkOutline} slot="start" />
              Asignarme
            </IonButton>
          </div>
        )}
    </div>
  );
};
