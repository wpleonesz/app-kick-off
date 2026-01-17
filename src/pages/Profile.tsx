import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonAvatar,
  IonList,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import { authService } from "../services/auth.service";
import { useProfile, useRefreshData } from "../hooks/useRealtimeData";

const Profile: React.FC = () => {
  // Hook para datos en tiempo real - se actualiza automáticamente cada 30 segundos
  // y cuando la app vuelve al primer plano
  const { data: user, isLoading, isError, error } = useProfile();
  const { refreshProfile } = useRefreshData();

  // Pull-to-refresh para actualización manual
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };

  const handleLogout = async () => {
    await authService.signout();
    window.location.href = "/login";
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {/* Pull-to-refresh para actualización manual */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para actualizar"
            refreshingSpinner="crescent"
            refreshingText="Actualizando..."
          />
        </IonRefresher>

        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Estado de carga */}
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

        {/* Estado de error */}
        {isError && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--ion-color-danger)", marginBottom: "16px" }}>
              Error al cargar el perfil: {error?.message}
            </p>
            <IonButton onClick={() => refreshProfile()}>
              Reintentar
            </IonButton>
          </div>
        )}

        {/* Datos del usuario */}
        {user && !isLoading && (
          <>
            <div
              className="profile-header"
              style={{ marginTop: "32px", marginBottom: "24px" }}
            >
              <IonAvatar
                style={{
                  width: 100,
                  height: 100,
                  backgroundColor: "var(--ion-color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  color: "white",
                  border: "4px solid var(--ion-color-primary-tint)",
                }}
              >
                {getInitials(user.name || user.username)}
              </IonAvatar>
              <div className="profile-name">{user.name || user.username}</div>
              <div className="profile-email">{user.email}</div>
            </div>

            <div
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                padding: "0 20px 20px",
                paddingBottom: "max(20px, env(safe-area-inset-bottom))",
              }}
            >
              <IonCard style={{ margin: "0 0 16px 0" }}>
                <IonCardHeader>
                  <IonCardTitle>Información de la Cuenta</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none">
                    <IonItem>
                      <IonLabel>
                        <h3 style={{ fontWeight: 600, marginBottom: "4px" }}>
                          Usuario
                        </h3>
                        <p>{user.username}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3 style={{ fontWeight: 600, marginBottom: "4px" }}>
                          Email
                        </h3>
                        <p>{user.email || "No disponible"}</p>
                      </IonLabel>
                    </IonItem>
                    {user.dni && (
                      <IonItem>
                        <IonLabel>
                          <h3 style={{ fontWeight: 600, marginBottom: "4px" }}>
                            DNI
                          </h3>
                          <p>{user.dni}</p>
                        </IonLabel>
                      </IonItem>
                    )}
                    {user.role && (
                      <IonItem>
                        <IonLabel>
                          <h3 style={{ fontWeight: 600, marginBottom: "4px" }}>
                            Rol
                          </h3>
                          <p style={{ textTransform: "capitalize" }}>
                            {user.role}
                          </p>
                        </IonLabel>
                      </IonItem>
                    )}
                  </IonList>
                </IonCardContent>
              </IonCard>

              <IonButton
                expand="block"
                color="danger"
                onClick={handleLogout}
                className="button-large mt-md"
              >
                Cerrar Sesión
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;
