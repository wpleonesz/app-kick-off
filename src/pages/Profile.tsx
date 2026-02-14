import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
} from "@ionic/react";
import {
  personOutline,
  mailOutline,
  cardOutline,
  shieldCheckmarkOutline,
  callOutline,
  logOutOutline,
  refreshOutline,
} from "ionicons/icons";
import { RefresherEventDetail } from "@ionic/core";
import { authService } from "../services/auth.service";
import { useProfile, useRefreshData } from "../hooks/useRealtimeData";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "../components/common/AppToast";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  player: { bg: "#e8f4fd", text: "#1877f2" },
  referee: { bg: "#fff3e0", text: "#e65100" },
  organizer: { bg: "#e8f5e9", text: "#2e7d32" },
  owner: { bg: "#f3e5f5", text: "#6a1b9a" },
  administrator: { bg: "#fce4ec", text: "#c62828" },
  default: { bg: "#f5f5f5", text: "#616161" },
};

const Profile: React.FC = () => {
  const { data: user, isLoading, isError } = useProfile();
  const { refreshProfile } = useRefreshData();
  const { toast, showError, showSuccess, dismissToast } = useAppToast();

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

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleCode = user?.roles?.[0]?.code ?? "default";
  const roleName = user?.roles?.[0]?.name ?? user?.role ?? null;
  const roleColor = ROLE_COLORS[roleCode] ?? ROLE_COLORS.default;

  return (
    <IonPage>
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <IonSpinner name="crescent" />
          </div>
        )}

        {/* ── Error ── */}
        {isError && !user && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "60vh",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "var(--ion-color-danger)",
                marginBottom: "16px",
                fontSize: "15px",
              }}
            >
              No se pudo cargar el perfil
            </p>
            <IonButton
              fill="outline"
              onClick={() => refreshProfile()}
              style={{ marginBottom: "12px" }}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Reintentar
            </IonButton>
            <IonButton color="danger" fill="clear" onClick={handleLogout}>
              <IonIcon slot="start" icon={logOutOutline} />
              Cerrar Sesión
            </IonButton>
          </div>
        )}

        {/* ── Contenido principal ── */}
        {user && (
          <>
            {/* Banner + avatar */}
            <div
              style={{
                background: "linear-gradient(135deg, #1877f2 0%, #0d47a1 100%)",
                paddingTop: "max(52px, env(safe-area-inset-top))",
                paddingBottom: "60px",
                textAlign: "center",
                position: "relative",
              }}
            >
              {/* Círculo de avatar */}
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  border: "3px solid rgba(255,255,255,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#fff",
                  backdropFilter: "blur(4px)",
                }}
              >
                {getInitials(user.name || user.username)}
              </div>

              <h2
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "20px",
                  margin: "0 0 4px",
                }}
              >
                {user.name || user.username}
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "13px",
                  margin: 0,
                }}
              >
                @{user.username}
              </p>

              {/* Badge de rol */}
              {roleName && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: "20px",
                    padding: "4px 14px",
                    marginTop: "12px",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <IonIcon
                    icon={shieldCheckmarkOutline}
                    style={{ fontSize: "14px" }}
                  />
                  {roleName}
                </div>
              )}
            </div>

            {/* Tarjeta de info — sube sobre el banner */}
            <div
              style={{
                maxWidth: "520px",
                margin: "-28px auto 0",
                padding: "0 16px",
                paddingBottom: "max(24px, env(safe-area-inset-bottom))",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  marginBottom: "16px",
                }}
              >
                <div style={{ padding: "16px 20px 4px" }}>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--ion-color-medium)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      margin: 0,
                    }}
                  >
                    Información de la cuenta
                  </p>
                </div>

                {/* Fila: Nombre */}
                {user.name && (
                  <InfoRow
                    icon={personOutline}
                    label="Nombre completo"
                    value={user.name}
                  />
                )}

                {/* Fila: Usuario */}
                <InfoRow
                  icon={personOutline}
                  label="Usuario"
                  value={`@${user.username}`}
                  valueStyle={{ fontFamily: "monospace", fontSize: "14px" }}
                />

                {/* Fila: Email */}
                <InfoRow
                  icon={mailOutline}
                  label="Correo electrónico"
                  value={user.email || "No disponible"}
                />

                {/* Fila: DNI */}
                {user.dni && (
                  <InfoRow
                    icon={cardOutline}
                    label="Cédula / DNI"
                    value={user.dni}
                  />
                )}

                {/* Fila: Rol (con chip de color) */}
                {roleName && (
                  <InfoRow
                    icon={shieldCheckmarkOutline}
                    label="Rol"
                    value=""
                    extra={
                      <span
                        style={{
                          background: roleColor.bg,
                          color: roleColor.text,
                          borderRadius: "20px",
                          padding: "3px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {roleName}
                      </span>
                    }
                    last
                  />
                )}
              </div>

              {/* Botón cerrar sesión */}
              <IonButton
                expand="block"
                color="danger"
                fill="outline"
                onClick={handleLogout}
                style={
                  {
                    "--border-radius": "12px",
                    height: "48px",
                    fontWeight: 600,
                    fontSize: "15px",
                  } as React.CSSProperties
                }
              >
                <IonIcon slot="start" icon={logOutOutline} />
                Cerrar Sesión
              </IonButton>
            </div>
          </>
        )}

        <AppToast toast={toast} onDismiss={dismissToast} />
      </IonContent>
    </IonPage>
  );
};

// ── Componente de fila de información ──────────────────────────────────────
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
  extra?: React.ReactNode;
  last?: boolean;
}

function InfoRow({
  icon,
  label,
  value,
  valueStyle,
  extra,
  last,
}: InfoRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 20px",
        borderBottom: last ? "none" : "1px solid var(--ion-color-light)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          background: "var(--ion-color-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IonIcon icon={icon} style={{ fontSize: "18px", color: "#1877f2" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--ion-color-medium)",
            margin: "0 0 2px",
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        {extra ? (
          extra
        ) : (
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--ion-color-dark)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              ...valueStyle,
            }}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default Profile;
