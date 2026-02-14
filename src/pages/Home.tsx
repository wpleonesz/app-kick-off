import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonButtons,
  IonButton,
  useIonRouter,
  useIonActionSheet,
  useIonAlert,
} from "@ionic/react";
import {
  personOutline,
  atOutline,
  mailOutline,
  shieldCheckmarkOutline,
  menuOutline,
  searchOutline,
  footballOutline,
  trophyOutline,
  peopleOutline,
  calendarOutline,
  settingsOutline,
  informationCircleOutline,
  logOutOutline,
  moonOutline,
  sunnyOutline,
  notificationsOutline,
  bookmarkOutline,
  helpCircleOutline,
  closeOutline,
  chevronForwardOutline,
  thumbsUpOutline,
  chatbubbleOutline,
  shareSocialOutline,
} from "ionicons/icons";
import { RefresherEventDetail } from "@ionic/core";
import { Capacitor } from "@capacitor/core";
import { useProfile, useRefreshData } from "../hooks/useRealtimeData";
import { authService } from "../services/auth.service";
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
  const { toast, showError, showSuccess, dismissToast } = useAppToast();
  const [isDarkMode, setIsDarkMode] = useState(
    () =>
      document.body.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const router = useIonRouter();
  const [presentActionSheet] = useIonActionSheet();
  const [presentAlert] = useIonAlert();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };

  const handleLogout = async () => {
    try {
      await authService.signout();
      showSuccess("Sesión cerrada correctamente");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      showError(err);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.body.classList.toggle("dark", newMode);
    // Forzar el cambio de color-scheme para que Ionic reaccione
    document.documentElement.style.colorScheme = newMode ? "dark" : "light";
    showSuccess(newMode ? "Modo oscuro activado" : "Modo claro activado");
  };

  const handleNavigateToProfile = () => {
    router.push("/tabs/perfil", "forward");
  };

  const openMenu = () => {
    presentActionSheet({
      header: "Menú",
      cssClass: "fb-context-menu",
      buttons: [
        {
          text: "Configuración",
          icon: settingsOutline,
          handler: handleNavigateToProfile,
        },
        {
          text: "Notificaciones",
          icon: notificationsOutline,
          handler: () => {
            showSuccess("No tienes notificaciones nuevas");
          },
        },
        {
          text: "Guardado",
          icon: bookmarkOutline,
          handler: () => {
            showSuccess("No tienes elementos guardados");
          },
        },
        {
          text: isDarkMode ? "Modo Claro" : "Modo Oscuro",
          icon: isDarkMode ? sunnyOutline : moonOutline,
          handler: toggleDarkMode,
        },
        {
          text: "Acerca de la App",
          icon: informationCircleOutline,
          handler: () => {
            presentAlert({
              header: "Kick Off",
              subHeader: "Versión 0.1.0",
              message: `Plataforma: ${Capacitor.getPlatform()}\nTu app para organizar partidos de fútbol, torneos y equipos.\n\n© 2026 Kick Off`,
              buttons: ["Cerrar"],
            });
          },
        },
        {
          text: "Ayuda y Soporte",
          icon: helpCircleOutline,
          handler: () => {
            showSuccess("Contacta a soporte: soporte@kickoff.app");
          },
        },
        {
          text: "Cerrar Sesión",
          icon: logOutOutline,
          role: "destructive",
          handler: () => {
            presentAlert({
              header: "Cerrar Sesión",
              message: "¿Estás seguro de que deseas cerrar sesión?",
              buttons: [
                { text: "Cancelar", role: "cancel" },
                {
                  text: "Cerrar Sesión",
                  role: "destructive",
                  handler: handleLogout,
                },
              ],
            });
          },
        },
        {
          text: "Cancelar",
          icon: closeOutline,
          role: "cancel",
        },
      ],
    });
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
          <div
            slot="start"
            style={{
              paddingLeft: "12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span className="fb-logo-text">Kick Off</span>
          </div>
          <IonButtons slot="end">
            <IonButton className="fb-header-btn">
              <IonIcon icon={searchOutline} />
            </IonButton>
            <IonButton className="fb-header-btn" onClick={openMenu}>
              <IonIcon icon={menuOutline} />
            </IonButton>
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <IonSpinner name="crescent" />
          </div>
        )}

        {user && !isLoading && (
          <>
            {/* ── "What's on your mind?" bar ── */}
            <IonCard className="fb-create-post-card">
              <IonCardContent style={{ padding: "12px 14px" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    className="fb-avatar-sm"
                    style={{
                      width: "40px",
                      height: "40px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {getInitials(fullName)}
                  </div>
                  <div className="fb-thought-bubble">
                    ¿Qué estás pensando,{" "}
                    {(user.name || user.username || "").split(" ")[0]}?
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* ── Quick Actions (horizontal scroll) ── */}
            <div className="fb-quick-actions-scroll">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.label} className="fb-quick-action-item">
                  <div
                    className="fb-quick-action-icon"
                    style={{
                      backgroundColor: action.color + "18",
                      color: action.color,
                    }}
                  >
                    <IonIcon icon={action.icon} />
                  </div>
                  <span className="fb-quick-action-label">{action.label}</span>
                </button>
              ))}
            </div>

            {/* ── Welcome Card ── */}
            <IonCard>
              <IonCardContent style={{ padding: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div className="fb-avatar-sm">{getInitials(fullName)}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--ion-text-color)",
                      }}
                    >
                      {fullName}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--ion-color-medium)",
                        marginTop: "1px",
                      }}
                    >
                      {roleName ? roleName : "Miembro"} · Activo ahora
                    </div>
                  </div>
                </div>
                <div className="fb-welcome-banner">
                  <IonIcon
                    icon={footballOutline}
                    style={{
                      fontSize: "28px",
                      color: "var(--ion-color-primary)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--ion-text-color)",
                      }}
                    >
                      ¡Bienvenido a Kick Off!
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--ion-color-medium)",
                        marginTop: "2px",
                      }}
                    >
                      Tu espacio para organizar y disfrutar del fútbol
                    </div>
                  </div>
                </div>
                {/* Reaction-style bar */}
                <div className="fb-reaction-bar">
                  <button className="fb-reaction-btn">
                    <IonIcon icon={thumbsUpOutline} /> Me gusta
                  </button>
                  <button className="fb-reaction-btn">
                    <IonIcon icon={chatbubbleOutline} /> Comentar
                  </button>
                  <button className="fb-reaction-btn">
                    <IonIcon icon={shareSocialOutline} /> Compartir
                  </button>
                </div>
              </IonCardContent>
            </IonCard>

            {/* ── Info Card ── */}
            <IonCard>
              <IonCardContent style={{ padding: "4px 16px" }}>
                <div className="fb-card-section-title">Tu información</div>

                {fullName && (
                  <div className="fb-info-row">
                    <IonIcon icon={personOutline} />
                    <div>
                      <div className="fb-info-label">Nombre Completo</div>
                      <div className="fb-info-value">{fullName}</div>
                    </div>
                  </div>
                )}

                <div className="fb-info-row">
                  <IonIcon icon={atOutline} />
                  <div>
                    <div className="fb-info-label">Usuario</div>
                    <div className="fb-info-value">@{user.username}</div>
                  </div>
                </div>

                {(user.Person?.email || user.email) && (
                  <div className="fb-info-row">
                    <IonIcon icon={mailOutline} />
                    <div>
                      <div className="fb-info-label">Email</div>
                      <div className="fb-info-value">
                        {user.Person?.email || user.email}
                      </div>
                    </div>
                  </div>
                )}

                {roleName && (
                  <div className="fb-info-row">
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <div>
                      <div className="fb-info-label">Rol</div>
                      <div
                        className="fb-info-value"
                        style={{ textTransform: "capitalize" }}
                      >
                        {roleName}
                      </div>
                    </div>
                  </div>
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
