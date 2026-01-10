import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { authService } from "../services/auth.service";

const Home: React.FC = () => {
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Inicio</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Inicio</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          }}
        >
          {user && (
            <>
              <div className="text-center mt-lg mb-lg">
                <h2>Hola, {user.name || user.username} 👋</h2>
                <p
                  style={{
                    color: "var(--ion-color-medium)",
                    margin: "8px 0 0 0",
                  }}
                >
                  Bienvenido a tu espacio personal
                </p>
              </div>

              <IonCard style={{ margin: "0 0 16px 0" }}>
                <IonCardHeader>
                  <IonCardTitle>Información Personal</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none">
                    {user.name && (
                      <IonItem>
                        <IonLabel>
                          <h3
                            style={{ fontWeight: 600, marginBottom: "4px" }}
                          >
                            Nombre Completo
                          </h3>
                          <p>{user.name}</p>
                        </IonLabel>
                      </IonItem>
                    )}
                    <IonItem>
                      <IonLabel>
                        <h3 style={{ fontWeight: 600, marginBottom: "4px" }}>
                          Usuario
                        </h3>
                        <p>{user.username}</p>
                      </IonLabel>
                    </IonItem>
                    {user.email && (
                      <IonItem>
                        <IonLabel>
                          <h3
                            style={{ fontWeight: 600, marginBottom: "4px" }}
                          >
                            Email
                          </h3>
                          <p>{user.email}</p>
                        </IonLabel>
                      </IonItem>
                    )}
                    {user.role && (
                      <IonItem>
                        <IonLabel>
                          <h3
                            style={{ fontWeight: 600, marginBottom: "4px" }}
                          >
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
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
