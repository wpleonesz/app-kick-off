import React, { useEffect, useState } from "react";
import {
  IonApp,
  IonRouterOutlet,
  IonPage,
  IonContent,
  IonSpinner,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router";
import { home, person } from "ionicons/icons";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import { authService } from "./services/auth.service";
import { initStorage } from "./storage";

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Inicializar storage y verificar autenticación
  useEffect(() => {
    const initialize = async () => {
      try {
        await initStorage();
        // Verificar autenticación usando Preferences (async)
        const authenticated = await authService.isAuthenticatedAsync();
        console.log("Auth check:", authenticated);
        setIsAuthenticated(authenticated);
        setIsReady(true);
      } catch (error) {
        console.error("Error inicializando:", error);
        setIsReady(true);
      }
    };
    initialize();
  }, []);

  // Mostrar spinner mientras se inicializa
  if (!isReady) {
    return (
      <IonApp>
        <IonPage>
          <IonContent className="ion-padding ion-text-center">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <IonSpinner name="crescent" />
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login">
            {isAuthenticated ? <Redirect to="/tabs/inicio" /> : <Login />}
          </Route>
          <Route exact path="/register" component={Register} />
          <Route path="/tabs">
            {!isAuthenticated ? (
              <Redirect to="/login" />
            ) : (
              <IonTabs>
                <IonRouterOutlet>
                  <Route exact path="/tabs/inicio" component={Home} />
                  <Route exact path="/tabs/perfil" component={Profile} />
                  <Route exact path="/tabs">
                    <Redirect to="/tabs/inicio" />
                  </Route>
                </IonRouterOutlet>
                <IonTabBar slot="bottom">
                  <IonTabButton tab="inicio" href="/tabs/inicio">
                    <IonIcon icon={home} />
                    <IonLabel>Inicio</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="perfil" href="/tabs/perfil">
                    <IonIcon icon={person} />
                    <IonLabel>Perfil</IonLabel>
                  </IonTabButton>
                </IonTabBar>
              </IonTabs>
            )}
          </Route>
          <Route exact path="/">
            <Redirect to={isAuthenticated ? "/tabs/inicio" : "/login"} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
