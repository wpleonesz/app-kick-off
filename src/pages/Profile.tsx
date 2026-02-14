import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonText,
  IonChip,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonMenuButton,
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
  createOutline,
} from "ionicons/icons";
import { RefresherEventDetail } from "@ionic/core";
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

  const confirmLogout = () => {
    presentAlert({
      header: "Cerrar Sesión",
      message: "¿Estás seguro de que deseas cerrar sesión?",
      buttons: [
        { text: "Cancelar", role: "cancel" },
        { text: "Cerrar Sesión", role: "destructive", handler: handleLogout },
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
      <IonHeader>
        <IonToolbar>
          <IonTitle>Perfil</IonTitle>
          <IonButtons slot="end">
            <IonMenuButton autoHide={false} />
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

        {/* ── Spinner ── */}
        {isLoading && !user && (
          <IonSpinner
            name="crescent"
            style={{ display: "block", margin: "40vh auto" }}
          />
        )}

        {/* ── Error ── */}
        {isError && !user && (
          <IonCard>
            <IonCardContent>
              <IonText color="danger">
                <IonCardTitle
                  style={{ fontSize: "15px", marginBottom: "16px" }}
                >
                  No se pudo cargar el perfil
                </IonCardTitle>
              </IonText>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => refreshProfile()}
              >
                <IonIcon slot="start" icon={refreshOutline} />
                Reintentar
              </IonButton>
              <IonButton
                expand="block"
                color="danger"
                fill="clear"
                onClick={confirmLogout}
              >
                <IonIcon slot="start" icon={logOutOutline} />
                Cerrar Sesión
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* ── Contenido principal ── */}
        {user && (
          <>
            {/* Tarjeta de cabecera con banner + avatar */}
            <IonCard>
              <IonCardHeader
                style={{
                  background:
                    "linear-gradient(135deg, #1877f2 0%, #0d47a1 100%)",
                  textAlign: "center",
                  paddingBottom: "20px",
                }}
              >
                <IonAvatar
                  style={{
                    width: 88,
                    height: 88,
                    margin: "8px auto 12px",
                    background: "rgba(255,255,255,0.25)",
                    border: "3px solid rgba(255,255,255,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IonText
                    style={{ fontSize: "2rem", fontWeight: 700, color: "#fff" }}
                  >
                    {getInitials(fullName || user.username)}
                  </IonText>
                </IonAvatar>

                <IonCardTitle
                  style={{
                    color: "#fff",
                    fontSize: "20px",
                    marginBottom: "4px",
                  }}
                >
                  {fullName || user.username}
                </IonCardTitle>
                <IonCardSubtitle
                  style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}
                >
                  @{user.username}
                </IonCardSubtitle>

                {roleName && (
                  <IonChip
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.4)",
                      margin: "12px auto 0",
                    }}
                  >
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <IonLabel>{roleName}</IonLabel>
                  </IonChip>
                )}
              </IonCardHeader>

              <IonCardContent>
                <IonGrid style={{ padding: 0 }}>
                  <IonRow>
                    <IonCol>
                      <IonButton
                        expand="block"
                        size="small"
                        onClick={() =>
                          showSuccess("Edición de perfil próximamente")
                        }
                      >
                        <IonIcon slot="start" icon={createOutline} />
                        Editar Perfil
                      </IonButton>
                    </IonCol>
                    <IonCol size="auto">
                      <IonMenuButton autoHide={false} />
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            {/* Tarjeta de información */}
            <IonCard>
              <IonCardHeader>
                <IonCardSubtitle>Información de la cuenta</IonCardSubtitle>
              </IonCardHeader>
              <IonList lines="inset" style={{ background: "transparent" }}>
                {fullName && (
                  <IonItem>
                    <IonIcon
                      slot="start"
                      icon={personOutline}
                      color="primary"
                    />
                    <IonLabel>
                      <IonNote>Nombre completo</IonNote>
                      <IonText
                        color="dark"
                        style={{ display: "block", fontWeight: 600 }}
                      >
                        {fullName}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                <IonItem>
                  <IonIcon slot="start" icon={atOutline} color="primary" />
                  <IonLabel>
                    <IonNote>Usuario</IonNote>
                    <IonText
                      color="dark"
                      style={{
                        display: "block",
                        fontWeight: 600,
                        fontFamily: "monospace",
                      }}
                    >
                      @{user.username}
                    </IonText>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonIcon slot="start" icon={mailOutline} color="primary" />
                  <IonLabel>
                    <IonNote>Correo electrónico</IonNote>
                    <IonText
                      color="dark"
                      style={{ display: "block", fontWeight: 600 }}
                    >
                      {email || "No disponible"}
                    </IonText>
                  </IonLabel>
                </IonItem>

                {dni && (
                  <IonItem>
                    <IonIcon slot="start" icon={cardOutline} color="primary" />
                    <IonLabel>
                      <IonNote>Cédula / DNI</IonNote>
                      <IonText
                        color="dark"
                        style={{ display: "block", fontWeight: 600 }}
                      >
                        {dni}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                {mobile && (
                  <IonItem>
                    <IonIcon slot="start" icon={callOutline} color="primary" />
                    <IonLabel>
                      <IonNote>Teléfono</IonNote>
                      <IonText
                        color="dark"
                        style={{ display: "block", fontWeight: 600 }}
                      >
                        {mobile}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                {roleName && (
                  <IonItem lines="none">
                    <IonIcon
                      slot="start"
                      icon={shieldCheckmarkOutline}
                      color="primary"
                    />
                    <IonLabel>
                      <IonNote>Rol</IonNote>
                      <IonChip
                        style={{
                          background: roleColor.bg,
                          color: roleColor.text,
                          marginTop: "4px",
                          marginLeft: 0,
                        }}
                      >
                        <IonLabel>{roleName}</IonLabel>
                      </IonChip>
                    </IonLabel>
                  </IonItem>
                )}
              </IonList>
            </IonCard>

            {/* Botón de cerrar sesión */}
            <IonCard>
              <IonCardContent style={{ padding: "12px 16px" }}>
                <IonButton
                  expand="block"
                  color="danger"
                  fill="outline"
                  onClick={confirmLogout}
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
