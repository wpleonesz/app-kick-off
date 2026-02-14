import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonButtons,
  IonButton,
  IonMenuButton,
  IonRow,
  IonCol,
  IonGrid,
  IonText,
  IonNote,
  IonItem,
  IonLabel,
  IonList,
} from "@ionic/react";
import {
  personOutline,
  atOutline,
  mailOutline,
  shieldCheckmarkOutline,
  searchOutline,
  footballOutline,
  trophyOutline,
  peopleOutline,
  calendarOutline,
  thumbsUpOutline,
  chatbubbleOutline,
  shareSocialOutline,
} from "ionicons/icons";
import { RefresherEventDetail } from "@ionic/core";
import { useProfile, useRefreshData } from "../hooks/useRealtimeData";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "../components/common/AppToast";

/* ── Quick-action items ── */
const QUICK_ACTIONS = [
  { icon: footballOutline, label: "Partidos", color: "#1877f2" },
  { icon: trophyOutline, label: "Torneos", color: "#42b72a" },
  { icon: peopleOutline, label: "Equipos", color: "#f7b928" },
  { icon: calendarOutline, label: "Agenda", color: "#fa3e3e" },
];

const Home: React.FC = () => {
  const { data: user, isLoading } = useProfile();
  const { refreshProfile } = useRefreshData();
  const { toast, dismissToast } = useAppToast();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fullName = user?.Person?.name || user?.name || user?.username || "";
  const roleName = user?.roles?.[0]?.Role?.name ?? user?.role ?? "";

  return (
    <IonPage>
      {/* ── Facebook-style Header ── */}
      <IonHeader className="fb-header">
        <IonToolbar>
          <IonTitle slot="start" className="fb-logo-text">
            Kick Off
          </IonTitle>
          <IonButtons slot="end">
            <IonButton className="fb-header-btn">
              <IonIcon icon={searchOutline} />
            </IonButton>
            <IonMenuButton className="fb-header-btn" autoHide={false} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para actualizar"
            refreshingSpinner="crescent"
            refreshingText="Actualizando..."
          />
        </IonRefresher>

        {/* Loading */}
        {isLoading && (
          <IonRow
            className="ion-justify-content-center ion-align-items-center"
            style={{ height: "50vh" }}
          >
            <IonSpinner name="crescent" />
          </IonRow>
        )}

        {user && !isLoading && (
          <>
            {/* ── "What's on your mind?" bar ── */}
            <IonCard className="fb-create-post-card">
              <IonCardContent style={{ padding: "12px 14px" }}>
                <IonRow
                  className="ion-align-items-center"
                  style={{ gap: "10px" }}
                >
                  <IonText
                    className="fb-avatar-sm"
                    style={{
                      width: "40px",
                      height: "40px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {getInitials(fullName)}
                  </IonText>
                  <IonText className="fb-thought-bubble" style={{ flex: 1 }}>
                    ¿Qué estás pensando,{" "}
                    {(user.name || user.username || "").split(" ")[0]}?
                  </IonText>
                </IonRow>
              </IonCardContent>
            </IonCard>

            {/* ── Quick Actions (horizontal scroll) ── */}
            <IonRow className="fb-quick-actions-scroll">
              {QUICK_ACTIONS.map((action) => (
                <IonCol
                  key={action.label}
                  size="auto"
                  className="fb-quick-action-item ion-text-center"
                  style={{ padding: 0 }}
                >
                  <IonText
                    className="fb-quick-action-icon"
                    style={{
                      backgroundColor: action.color + "18",
                      color: action.color,
                    }}
                  >
                    <IonIcon icon={action.icon} />
                  </IonText>
                  <IonNote className="fb-quick-action-label">
                    {action.label}
                  </IonNote>
                </IonCol>
              ))}
            </IonRow>

            {/* ── Welcome Card ── */}
            <IonCard>
              <IonCardContent style={{ padding: "16px" }}>
                <IonRow
                  className="ion-align-items-center"
                  style={{ gap: "12px", marginBottom: "12px" }}
                >
                  <IonText className="fb-avatar-sm">
                    {getInitials(fullName)}
                  </IonText>
                  <IonCol style={{ padding: 0 }}>
                    <IonText
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--ion-text-color)",
                        display: "block",
                      }}
                    >
                      {fullName}
                    </IonText>
                    <IonNote
                      style={{
                        fontSize: "12px",
                        color: "var(--ion-color-medium)",
                        marginTop: "1px",
                      }}
                    >
                      {roleName ? roleName : "Miembro"} · Activo ahora
                    </IonNote>
                  </IonCol>
                </IonRow>
                <IonRow
                  className="fb-welcome-banner ion-align-items-center"
                  style={{ gap: "12px" }}
                >
                  <IonIcon
                    icon={footballOutline}
                    style={{
                      fontSize: "28px",
                      color: "var(--ion-color-primary)",
                    }}
                  />
                  <IonCol style={{ padding: 0 }}>
                    <IonText
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--ion-text-color)",
                        display: "block",
                      }}
                    >
                      ¡Bienvenido a Kick Off!
                    </IonText>
                    <IonNote
                      style={{
                        fontSize: "13px",
                        color: "var(--ion-color-medium)",
                        marginTop: "2px",
                      }}
                    >
                      Tu espacio para organizar y disfrutar del fútbol
                    </IonNote>
                  </IonCol>
                </IonRow>
                {/* Reaction-style bar */}
                <IonRow className="fb-reaction-bar">
                  <IonButton fill="clear">
                    <IonIcon icon={thumbsUpOutline} /> Me gusta
                  </IonButton>
                  <IonButton fill="clear">
                    <IonIcon icon={chatbubbleOutline} /> Comentar
                  </IonButton>
                  <IonButton fill="clear">
                    <IonIcon icon={shareSocialOutline} /> Compartir
                  </IonButton>
                </IonRow>
              </IonCardContent>
            </IonCard>

            {/* ── Info Card ── */}
            <IonCard>
              <IonCardContent style={{ padding: "4px 16px 16px" }}>
                <IonNote className="fb-card-section-title">
                  Tu información
                </IonNote>

                <IonList lines="none" style={{ padding: 0 }}>
                  {fullName && (
                    <IonItem
                      lines="inset"
                      style={{
                        "--padding-start": "0",
                        "--inner-padding-end": "0",
                      }}
                    >
                      <IonIcon
                        icon={personOutline}
                        slot="start"
                        color="medium"
                      />
                      <IonLabel>
                        <IonNote style={{ fontSize: "12px" }}>
                          Nombre Completo
                        </IonNote>
                        <IonText
                          style={{
                            display: "block",
                            fontWeight: 500,
                            fontSize: "15px",
                          }}
                        >
                          {fullName}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                  )}

                  <IonItem
                    lines="inset"
                    style={{
                      "--padding-start": "0",
                      "--inner-padding-end": "0",
                    }}
                  >
                    <IonIcon icon={atOutline} slot="start" color="medium" />
                    <IonLabel>
                      <IonNote style={{ fontSize: "12px" }}>Usuario</IonNote>
                      <IonText
                        style={{
                          display: "block",
                          fontWeight: 500,
                          fontSize: "15px",
                        }}
                      >
                        @{user.username}
                      </IonText>
                    </IonLabel>
                  </IonItem>

                  {(user.Person?.email || user.email) && (
                    <IonItem
                      lines="inset"
                      style={{
                        "--padding-start": "0",
                        "--inner-padding-end": "0",
                      }}
                    >
                      <IonIcon icon={mailOutline} slot="start" color="medium" />
                      <IonLabel>
                        <IonNote style={{ fontSize: "12px" }}>Email</IonNote>
                        <IonText
                          style={{
                            display: "block",
                            fontWeight: 500,
                            fontSize: "15px",
                          }}
                        >
                          {user.Person?.email || user.email}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                  )}

                  {roleName && (
                    <IonItem
                      lines="none"
                      style={{
                        "--padding-start": "0",
                        "--inner-padding-end": "0",
                      }}
                    >
                      <IonIcon
                        icon={shieldCheckmarkOutline}
                        slot="start"
                        color="medium"
                      />
                      <IonLabel>
                        <IonNote style={{ fontSize: "12px" }}>Rol</IonNote>
                        <IonText
                          style={{
                            display: "block",
                            fontWeight: 500,
                            fontSize: "15px",
                            textTransform: "capitalize",
                          }}
                        >
                          {roleName}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                  )}
                </IonList>
              </IonCardContent>
            </IonCard>
          </>
        )}

        <AppToast toast={toast} onDismiss={dismissToast} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
