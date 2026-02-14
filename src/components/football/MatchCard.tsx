import React from "react";
import {
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonNote,
  IonChip,
  IonLabel,
  IonAvatar,
  IonIcon,
} from "@ionic/react";
import { timeOutline, locationOutline } from "ionicons/icons";
import { SportsEvent } from "../../services/football.service";

interface Props {
  match: SportsEvent;
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.substring(0, 5);
}

function getStatusColor(status?: string): string {
  switch (status) {
    case "FT":
      return "medium";
    case "NS":
      return "primary";
    case "1H":
    case "2H":
    case "HT":
      return "success";
    case "PST":
      return "warning";
    default:
      return "medium";
  }
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case "FT":
      return "Finalizado";
    case "NS":
      return "Por jugar";
    case "1H":
      return "1er Tiempo";
    case "2H":
      return "2do Tiempo";
    case "HT":
      return "Medio Tiempo";
    case "PST":
      return "Pospuesto";
    default:
      return status || "";
  }
}

export function MatchCard({ match }: Props) {
  const hasScore = match.intHomeScore !== null && match.intAwayScore !== null;
  const statusColor = getStatusColor(match.strStatus);
  const statusLabel = getStatusLabel(match.strStatus);

  return (
    <IonCard style={{ margin: "0 0 12px 0" }}>
      <IonCardContent style={{ padding: "12px 16px" }}>
        {/* Header: Liga + Estado */}
        <IonRow
          className="ion-align-items-center ion-justify-content-between"
          style={{ marginBottom: "12px" }}
        >
          <IonNote style={{ fontSize: "12px" }}>
            {match.strLeague} · {formatDate(match.dateEvent)}
          </IonNote>
          {statusLabel && (
            <IonChip
              color={statusColor}
              style={{
                height: "22px",
                fontSize: "11px",
                margin: 0,
                "--padding-start": "8px",
                "--padding-end": "8px",
              }}
            >
              <IonLabel>{statusLabel}</IonLabel>
            </IonChip>
          )}
        </IonRow>

        {/* Equipos y marcador */}
        <IonGrid style={{ padding: 0 }}>
          <IonRow className="ion-align-items-center">
            {/* Equipo Local */}
            <IonCol
              style={{
                textAlign: "center",
                padding: "0 4px",
              }}
            >
              {match.strHomeTeamBadge ? (
                <IonAvatar
                  style={{
                    width: "36px",
                    height: "36px",
                    margin: "0 auto 6px",
                    overflow: "visible",
                  }}
                >
                  <img
                    src={match.strHomeTeamBadge}
                    alt={match.strHomeTeam}
                    style={{ objectFit: "contain" }}
                  />
                </IonAvatar>
              ) : null}
              <IonText
                style={{
                  fontWeight: "600",
                  fontSize: "13px",
                  display: "block",
                  lineHeight: "1.2",
                }}
              >
                {match.strHomeTeam}
              </IonText>
            </IonCol>

            {/* Marcador / Hora */}
            <IonCol
              size="auto"
              style={{
                textAlign: "center",
                minWidth: "80px",
                padding: "0 8px",
              }}
            >
              {hasScore ? (
                <IonText
                  color="dark"
                  style={{
                    fontWeight: "700",
                    fontSize: "24px",
                    display: "block",
                    letterSpacing: "2px",
                  }}
                >
                  {match.intHomeScore} - {match.intAwayScore}
                </IonText>
              ) : (
                <>
                  <IonText
                    color="primary"
                    style={{
                      fontWeight: "600",
                      fontSize: "18px",
                      display: "block",
                    }}
                  >
                    {formatTime(match.strTime) || "vs"}
                  </IonText>
                  <IonNote style={{ fontSize: "11px" }}>
                    <IonIcon
                      icon={timeOutline}
                      style={{
                        fontSize: "11px",
                        verticalAlign: "middle",
                        marginRight: "2px",
                      }}
                    />
                    {match.strTimeLocal
                      ? formatTime(match.strTimeLocal) + " local"
                      : "Hora por definir"}
                  </IonNote>
                </>
              )}
            </IonCol>

            {/* Equipo Visitante */}
            <IonCol
              style={{
                textAlign: "center",
                padding: "0 4px",
              }}
            >
              {match.strAwayTeamBadge ? (
                <IonAvatar
                  style={{
                    width: "36px",
                    height: "36px",
                    margin: "0 auto 6px",
                    overflow: "visible",
                  }}
                >
                  <img
                    src={match.strAwayTeamBadge}
                    alt={match.strAwayTeam}
                    style={{ objectFit: "contain" }}
                  />
                </IonAvatar>
              ) : null}
              <IonText
                style={{
                  fontWeight: "600",
                  fontSize: "13px",
                  display: "block",
                  lineHeight: "1.2",
                }}
              >
                {match.strAwayTeam}
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Venue */}
        {match.strVenue && (
          <IonRow
            className="ion-align-items-center ion-justify-content-center"
            style={{ marginTop: "10px" }}
          >
            <IonNote style={{ fontSize: "11px", textAlign: "center" }}>
              <IonIcon
                icon={locationOutline}
                style={{
                  fontSize: "12px",
                  verticalAlign: "middle",
                  marginRight: "3px",
                }}
              />
              {match.strVenue}
              {match.strCountry ? ` · ${match.strCountry}` : ""}
            </IonNote>
          </IonRow>
        )}
      </IonCardContent>
    </IonCard>
  );
}
