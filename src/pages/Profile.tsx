import React, { useEffect, useState } from "react";
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
} from "@ionic/react";
import { authService } from "../services/auth.service";

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = authService.getCurrentUser();
      if (userData) {
        setUser(userData);
      } else {
        const storedUser = await authService.getCurrentUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    };
    loadUser();
  }, []);

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
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>

        {user && (
          <>
            <div className="profile-header mt-lg">
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

            <div className="page-container">
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
