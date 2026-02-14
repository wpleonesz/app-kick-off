import React from "react";
import {
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonNote,
} from "@ionic/react";
import { SportsEvent } from "../../services/football.service";

interface Props {
  match: SportsEvent;
}

export function MatchCard({ match }: Props) {
  const hasScore = match.intHomeScore !== null && match.intAwayScore !== null;

  return (
    <IonCard style={{ margin: "0 0 12px 0" }}>
      <IonCardContent style={{ padding: "16px" }}>
        <IonNote
          style={{ fontSize: "12px", marginBottom: "12px", display: "block" }}
        >
          {match.strLeague} · {match.dateEvent}
        </IonNote>

        <IonGrid style={{ padding: 0 }}>
          <IonRow style={{ alignItems: "center" }}>
            <IonCol size="auto" style={{ flex: 1, textAlign: "right" }}>
              <IonText
                style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  display: "block",
                }}
              >
                {match.strHomeTeam}
              </IonText>
            </IonCol>

            <IonCol
              size="auto"
              style={{
                textAlign: "center",
                minWidth: "60px",
                margin: "0 12px",
              }}
            >
              <IonText
                color={hasScore ? "dark" : "medium"}
                style={{
                  fontWeight: "700",
                  fontSize: "18px",
                  display: "block",
                }}
              >
                {hasScore
                  ? `${match.intHomeScore} - ${match.intAwayScore}`
                  : match.strTime || "vs"}
              </IonText>
            </IonCol>

            <IonCol size="auto" style={{ flex: 1, textAlign: "left" }}>
              <IonText
                style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  display: "block",
                }}
              >
                {match.strAwayTeam}
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
}
