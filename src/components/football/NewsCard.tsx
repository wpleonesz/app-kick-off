import React from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import { EspnNewsItem } from "../../services/football.service";

interface Props {
  article: EspnNewsItem;
}

export function NewsCard({ article }: Props) {
  const imageUrl = article.images?.[0]?.url;

  return (
    <IonCard style={{ margin: "0 0 12px 0", borderRadius: "12px" }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={article.headline}
          style={{ width: "100%", height: "160px", objectFit: "cover" }}
        />
      )}
      <IonCardHeader>
        <IonCardTitle style={{ fontSize: "15px", fontWeight: 600 }}>
          {article.headline}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p
          style={{
            fontSize: "13px",
            color: "var(--ion-color-medium)",
            margin: 0,
          }}
        >
          {article.description}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "var(--ion-color-medium)",
            marginTop: "8px",
          }}
        >
          {new Date(article.published).toLocaleDateString("es-EC", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </IonCardContent>
    </IonCard>
  );
}
