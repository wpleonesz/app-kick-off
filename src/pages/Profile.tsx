import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonCard,
  IonCardContent,
  IonChip,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonButtons,
  useIonActionSheet,
  useIonAlert,
} from "@ionic/react";
import {
  personOutline,
  mailOutline,
  cardOutline,
  shieldCheckmarkOutline,
  callOutline,
  logOutOutline,
  refreshOutline,
  atOutline,
  menuOutline,
  settingsOutline,
  informationCircleOutline,
  moonOutline,
  sunnyOutline,
  notificationsOutline,
  bookmarkOutline,
  helpCircleOutline,
  closeOutline,
  createOutline,
  cameraOutline,
} from "ionicons/icons";
import { RefresherEventDetail } from "@ionic/core";
import { Capacitor } from "@capacitor/core";
import { authService } from "../services/auth.service";
import { useProfile, useRefreshData } from "../hooks/useRealtimeData";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "../components/common/AppToast";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  player: { bg: "#e7f3ff", text: "#1877f2" },
  referee: { bg: "#fff3e0", text: "#e65100" },
  organizer: { bg: "#e8f5e9", text: "#2e7d32" },
  owner: { bg: "#f3e5f5", text: "#6a1b9a" },
  administrator: { bg: "#fce4ec", text: "#c62828" },
  default: { bg: "var(--ion-color-light)", text: "var(--ion-color-medium)" },
};

const Profile: React.FC = () => {
  const { data: user, isLoading, isError } = useProfile();
  const { refreshProfile } = useRefreshData();
  const { toast, showError, showSuccess, dismissToast } = useAppToast();
  const [presentActionSheet] = useIonActionSheet();
  const [presentAlert] = useIonAlert();
  const [isDarkMode, setIsDarkMode] = useState(
    () =>
      document.body.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

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
    document.documentElement.style.colorScheme = newMode ? "dark" : "light";
    showSuccess(newMode ? "Modo oscuro activado" : "Modo claro activado");
  };

  const openMenu = () => {
    presentActionSheet({
      header: "Menú",
      cssClass: "fb-context-menu",
      buttons: [
        {
          text: "Editar Perfil",
          icon: createOutline,
          handler: () => {
            showSuccess("Edición de perfil próximamente");
          },
        },
        {
          text: "Cambiar Foto",
          icon: cameraOutline,
          handler: () => {
            showSuccess("Cambio de foto próximamente");
          },
        },
        {
          text: "Notificaciones",
          icon: notificationsOutline,
          handler: () => {
            showSuccess("No tienes notificaciones nuevas");
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

  const roleCode = user?.roles?.[0]?.Role?.code ?? "default";
  const roleName = user?.roles?.[0]?.Role?.name ?? user?.role ?? null;
  const roleColor = ROLE_COLORS[roleCode] ?? ROLE_COLORS.default;

  const fullName = user?.Person?.name || user?.name || user?.username || "";
  const email = user?.Person?.email || user?.email || "";
  const dni = user?.Person?.dni || user?.dni || "";
  const mobile = user?.Person?.mobile || user?.mobile || "";

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
            <span className="fb-logo-text">Perfil</span>
          </div>
          <IonButtons slot="end">
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
        {isLoading && !user && (
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

        {/* Error */}
        {isError && !user && (
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "24px" }}>
              <p
                style={{
                  color: "var(--ion-color-danger)",
                  marginBottom: "16px",
                }}
              >
                No se pudo cargar el perfil
              </p>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => refreshProfile()}
                style={{ marginBottom: "8px" }}
              >
                <IonIcon slot="start" icon={refreshOutline} />
                Reintentar
              </IonButton>
              <IonButton
                expand="block"
                color="danger"
                fill="clear"
                onClick={handleLogout}
              >
                <IonIcon slot="start" icon={logOutOutline} />
                Cerrar Sesión
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* Profile Content */}
        {user && (
          <>
            {/* ── Profile Header Card – Facebook cover style ── */}
            <IonCard>
              <IonCardContent style={{ padding: "0" }}>
                {/* Cover area */}
                <div
                  style={{
                    height: "80px",
                    background:
                      "linear-gradient(135deg, var(--ion-color-primary) 0%, #42b72a 100%)",
                    borderRadius: "var(--fb-radius) var(--fb-radius) 0 0",
                  }}
                />
                {/* Avatar + info */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "0 20px 20px",
                    marginTop: "-40px",
                  }}
                >
                  <div
                    className="fb-avatar"
                    style={{
                      margin: "0 auto 12px",
                      border: "4px solid var(--ion-card-background, #ffffff)",
                    }}
                  >
                    {getInitials(fullName || user.username)}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "var(--ion-text-color)",
                      marginBottom: "2px",
                    }}
                  >
                    {fullName || user.username}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--ion-color-medium)",
                      marginBottom: "12px",
                    }}
                  >
                    @{user.username}
                  </div>

                  {/* Role chip */}
                  {roleName && (
                    <IonChip
                      style={{
                        background: roleColor.bg,
                        color: roleColor.text,
                      }}
                    >
                      <IonIcon icon={shieldCheckmarkOutline} />
                      <IonLabel>{roleName}</IonLabel>
                    </IonChip>
                  )}

                  {/* Action buttons */}
                  <div
                    style={{ display: "flex", gap: "8px", marginTop: "16px" }}
                  >
                    <IonButton
                      expand="block"
                      size="small"
                      style={{ flex: 1 }}
                      onClick={() =>
                        showSuccess("Edición de perfil próximamente")
                      }
                    >
                      <IonIcon slot="start" icon={createOutline} />
                      Editar Perfil
                    </IonButton>
                    <IonButton size="small" fill="outline" onClick={openMenu}>
                      <IonIcon icon={menuOutline} />
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* ── Info Card ── */}
            <IonCard>
              <IonCardContent style={{ padding: "4px 16px 16px" }}>
                <div className="fb-card-section-title">
                  Información de la cuenta
                </div>

                {/* Full name */}
                {fullName && (
                  <div className="fb-info-row">
                    <IonIcon icon={personOutline} />
                    <div>
                      <div className="fb-info-label">Nombre completo</div>
                      <div className="fb-info-value">{fullName}</div>
                    </div>
                  </div>
                )}

                {/* Username */}
                <div className="fb-info-row">
                  <IonIcon icon={atOutline} />
                  <div>
                    <div className="fb-info-label">Usuario</div>
                    <div className="fb-info-value">@{user.username}</div>
                  </div>
                </div>

                {/* Email */}
                <div className="fb-info-row">
                  <IonIcon icon={mailOutline} />
                  <div>
                    <div className="fb-info-label">Correo electrónico</div>
                    <div className="fb-info-value">
                      {email || "No disponible"}
                    </div>
                  </div>
                </div>

                {/* DNI */}
                {dni && (
                  <div className="fb-info-row">
                    <IonIcon icon={cardOutline} />
                    <div>
                      <div className="fb-info-label">Cédula / DNI</div>
                      <div className="fb-info-value">{dni}</div>
                    </div>
                  </div>
                )}

                {/* Mobile */}
                {mobile && (
                  <div className="fb-info-row">
                    <IonIcon icon={callOutline} />
                    <div>
                      <div className="fb-info-label">Teléfono</div>
                      <div className="fb-info-value">{mobile}</div>
                    </div>
                  </div>
                )}

                {/* Role */}
                {roleName && (
                  <div className="fb-info-row">
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <div>
                      <div className="fb-info-label">Rol</div>
                      <IonChip
                        style={{
                          background: roleColor.bg,
                          color: roleColor.text,
                          marginTop: "4px",
                        }}
                      >
                        {roleName}
                      </IonChip>
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>

            {/* ── Logout Card ── */}
            <IonCard>
              <IonCardContent style={{ padding: "12px 16px" }}>
                <IonButton
                  expand="block"
                  color="danger"
                  fill="outline"
                  onClick={() => {
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
                  }}
                >
                  <IonIcon slot="start" icon={logOutOutline} />
                  Cerrar Sesión
                </IonButton>
              </IonCardContent>
            </IonCard>
          </>
        )}

        <AppToast toast={toast} onDismiss={dismissToast} />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
