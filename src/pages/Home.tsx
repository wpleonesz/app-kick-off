import React, { useState } from "react";
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
  newspaperOutline,
  chevronForwardOutline,
  thumbsUpOutline,
  chatbubbleOutline,
  shareSocialOutline,
} from "ionicons/icons";
import { RefresherEventDetail } from "@ionic/core";
import { useProfile, useRefreshData } from "../hooks/useRealtimeData";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "../components/common/AppToast";
import { MatchCard } from "../components/football/MatchCard";
import {
  useRecentMatches,
  useUpcomingMatches,
  useFootballNews,
  useNewsLeagues,
} from "../hooks/useFootball";
import { NewsCard } from "../components/football/NewsCard";

/* ── Quick-action items ── */
const QUICK_ACTIONS = [
  { icon: footballOutline, label: "Partidos", color: "#1877f2" },
  { icon: trophyOutline, label: "Torneos", color: "#42b72a" },
  { icon: peopleOutline, label: "Equipos", color: "#f7b928" },
  { icon: calendarOutline, label: "Agenda", color: "#fa3e3e" },
];

type Tab = "recientes" | "proximos";

const Home: React.FC = () => {
  const { data: user, isLoading } = useProfile();
  const { refreshProfile } = useRefreshData();
  const { toast, dismissToast } = useAppToast();
  const { data: recent, isLoading: loadingRecent } = useRecentMatches();
  const { data: upcoming, isLoading: loadingUpcoming } = useUpcomingMatches();
  const { data: newsLeagues, isLoading: loadingLeagues } = useNewsLeagues();
  const [newsLeague, setNewsLeague] = useState<string>("soccer/eng.1");
  const {
    data: newsData,
    isLoading: loadingNews,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFootballNews(newsLeague);
  const [tab, setTab] = useState<Tab>("recientes");

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
  const isLoading2 =
    (tab === "recientes" && loadingRecent) ||
    (tab === "proximos" && loadingUpcoming);

  const allNews = newsData?.pages.flatMap((p) => p.articles) ?? [];

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

            {/* ── Tabs de Partidos ── */}
            <IonCard>
              <IonCardContent style={{ padding: "4px 16px 16px" }}>
                <IonNote className="fb-card-section-title">
                  Partidos — Premier League
                </IonNote>

                <IonGrid style={{ padding: 0, marginBottom: "12px" }}>
                  <IonRow>
                    <IonCol style={{ padding: "0 4px 0 0" }}>
                      <IonButton
                        expand="block"
                        size="small"
                        fill={tab === "recientes" ? "solid" : "outline"}
                        onClick={() => setTab("recientes")}
                      >
                        <IonIcon slot="start" icon={footballOutline} />
                        Recientes
                      </IonButton>
                    </IonCol>
                    <IonCol style={{ padding: "0 0 0 4px" }}>
                      <IonButton
                        expand="block"
                        size="small"
                        fill={tab === "proximos" ? "solid" : "outline"}
                        onClick={() => setTab("proximos")}
                      >
                        <IonIcon slot="start" icon={calendarOutline} />
                        Próximos
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                {/* Spinner de carga */}
                {isLoading2 && (
                  <IonRow
                    className="ion-justify-content-center"
                    style={{ padding: "20px 0" }}
                  >
                    <IonSpinner name="crescent" />
                  </IonRow>
                )}

                {/* Recientes */}
                {tab === "recientes" && !loadingRecent && (
                  <>
                    {(!recent || recent.length === 0) && (
                      <IonText
                        color="medium"
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "20px 0",
                          fontSize: "14px",
                        }}
                      >
                        Sin partidos recientes
                      </IonText>
                    )}
                    {recent?.map((match) => (
                      <MatchCard key={match.idEvent} match={match} />
                    ))}
                  </>
                )}

                {/* Próximos */}
                {tab === "proximos" && !loadingUpcoming && (
                  <>
                    {(!upcoming || upcoming.length === 0) && (
                      <IonText
                        color="medium"
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "20px 0",
                          fontSize: "14px",
                        }}
                      >
                        Sin próximos partidos
                      </IonText>
                    )}
                    {upcoming?.map((match) => (
                      <MatchCard key={match.idEvent} match={match} />
                    ))}
                  </>
                )}
              </IonCardContent>
            </IonCard>

            {/* ── Noticias Card (separada, con paginación incremental) ── */}
            <IonCard>
              <IonCardContent style={{ padding: "4px 16px 16px" }}>
                <IonRow
                  className="ion-align-items-center"
                  style={{ marginBottom: "4px" }}
                >
                  <IonNote
                    className="fb-card-section-title"
                    style={{ margin: 0 }}
                  >
                    <IonIcon
                      icon={newspaperOutline}
                      style={{ verticalAlign: "middle", marginRight: "6px" }}
                    />
                    Noticias
                  </IonNote>
                </IonRow>

                {/* League selector chips */}
                <div
                  style={{
                    display: "flex",
                    overflowX: "auto",
                    gap: "8px",
                    padding: "8px 0 12px",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {loadingLeagues && (
                    <IonText color="medium" style={{ fontSize: "12px" }}>
                      Cargando ligas...
                    </IonText>
                  )}
                  {newsLeagues?.map((league) => (
                    <IonButton
                      key={league.id}
                      size="small"
                      fill={newsLeague === league.id ? "solid" : "outline"}
                      onClick={() => setNewsLeague(league.id)}
                      style={{
                        "--border-radius": "20px",
                        flexShrink: 0,
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ marginRight: "4px" }}>{league.flag}</span>
                      {league.label}
                    </IonButton>
                  ))}
                </div>

                {loadingNews && !isFetchingNextPage && (
                  <IonRow
                    className="ion-justify-content-center"
                    style={{ padding: "20px 0" }}
                  >
                    <IonSpinner name="crescent" />
                  </IonRow>
                )}

                {!loadingNews && allNews.length === 0 && (
                  <IonText
                    color="medium"
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "20px 0",
                      fontSize: "14px",
                    }}
                  >
                    Sin noticias disponibles
                  </IonText>
                )}

                {allNews.length > 0 && (
                  <>
                    {allNews.map((article, i) => (
                      <NewsCard key={`${newsLeague}-${i}`} article={article} />
                    ))}

                    {/* Cargar más */}
                    {hasNextPage && (
                      <IonButton
                        expand="block"
                        fill="outline"
                        size="small"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        style={{
                          marginTop: "12px",
                          "--border-radius": "10px",
                        }}
                      >
                        {isFetchingNextPage ? (
                          <IonSpinner name="dots" style={{ height: "18px" }} />
                        ) : (
                          <>
                            <IonIcon
                              slot="start"
                              icon={chevronForwardOutline}
                            />
                            Ver más noticias
                          </>
                        )}
                      </IonButton>
                    )}

                    {!hasNextPage && allNews.length > 0 && (
                      <IonText
                        color="medium"
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "12px 0 0",
                          fontSize: "12px",
                        }}
                      >
                        — No hay más noticias —
                      </IonText>
                    )}
                  </>
                )}
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
