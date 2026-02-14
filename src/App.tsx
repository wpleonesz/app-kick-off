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
  IonAlert,
  IonRow,
  IonCol,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";

// Workaround TypeScript JSX mismatch: exponer versiones any de Route/Redirect
// para evitar error "No se puede usar Route como componente JSX" causado
// por desajustes de tipos entre dependencias. Revisar más adelante.
const RouteComp: any = Route as any;
const RedirectComp: any = Redirect as any;
import { home, homeOutline, person, personOutline } from "ionicons/icons";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { App as CapApp } from "@capacitor/app";
import { QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import { authService } from "./services/auth.service";
import { initStorage } from "./storage";
import { updateService } from "./services/update.service";
import queryClient from "./queryClient";
import SideMenu from "./components/SideMenu";

// ── Sección de tabs ──────────────────────────────────────────────────────────
// Usa onIonTabsWillChange (evento nativo de Ionic) para saber qué tab está
// activo y swappear entre íconos filled/outline. El color lo maneja la CSS
// variable --color-selected del IonTabBar.
const TABS = ["inicio", "perfil"] as const;

const TabsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("inicio");
  const activeIndex = Math.max(
    0,
    TABS.indexOf(activeTab as (typeof TABS)[number]),
  );

  return (
    <>
      <IonTabs onIonTabsWillChange={(e) => setActiveTab(e.detail.tab)}>
        <IonRouterOutlet>
          <RouteComp exact path="/tabs/inicio" component={Home} />
          <RouteComp exact path="/tabs/perfil" component={Profile} />
          <RouteComp exact path="/tabs">
            <RedirectComp to="/tabs/inicio" />
          </RouteComp>
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="inicio" href="/tabs/inicio">
            <IonIcon icon={activeTab === "inicio" ? home : homeOutline} />
            <IonLabel>Inicio</IonLabel>
          </IonTabButton>
          <IonTabButton tab="perfil" href="/tabs/perfil">
            <IonIcon icon={activeTab === "perfil" ? person : personOutline} />
            <IonLabel>Perfil</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>

      {/* Indicador deslizante de tab activo – fixed al fondo */}
      <IonRow className="tab-indicator-track" aria-hidden="true">
        <IonCol
          className="tab-indicator-thumb"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
      </IonRow>
    </>
  );
};

const App: React.FC = () => {
  // Refrescar todos los datos al cambiar de tab
  useEffect(() => {
    const handleTabChange = async () => {
      // Refresca todas las queries de React Query
      await queryClient.invalidateQueries();
    };
    document.addEventListener("ionTabsWillChange", handleTabChange);
    return () => {
      document.removeEventListener("ionTabsWillChange", handleTabChange);
    };
  }, []);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | undefined>();

  // Configurar StatusBar para dispositivos nativos
  const setupStatusBar = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#00000000" });
        }
      } catch (error) {
        console.error("Error configurando StatusBar:", error);
      }
    }
  };

  // Verificar actualizaciones disponibles
  const checkForUpdates = async () => {
    try {
      const updateInfo = await updateService.checkForUpdate();
      if (updateInfo.updateAvailable) {
        setUpdateAvailable(true);
        setUpdateVersion(updateInfo.latestVersion);
      }
      // Marcar la app como lista (previene rollback automático)
      await updateService.ready();
    } catch (error) {
      console.error("Error verificando actualizaciones:", error);
    }
  };

  // Manejar el botón de retroceso en Android
  const setupBackButton = () => {
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("backButton", ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  };

  // Inicializar storage y verificar autenticación
  useEffect(() => {
    const initialize = async () => {
      try {
        // Configurar StatusBar primero
        await setupStatusBar();

        // Inicializar storage
        await initStorage();

        // Sincronizar valores persistentes de Preferences a localStorage
        try {
          const auth = await Preferences.get({
            key: "app_kickoff_authenticated",
          });
          const token = await Preferences.get({ key: "app_kickoff_token" });
          const user = await Preferences.get({ key: "app_kickoff_user" });

          if (auth?.value) {
            localStorage.setItem("app_kickoff_authenticated", auth.value);
          }
          if (token?.value) {
            localStorage.setItem("app_kickoff_token", token.value);
          }
          if (user?.value) {
            localStorage.setItem("app_kickoff_user", user.value);
          }
        } catch (e) {
          console.warn("Error sincronizando Preferences -> localStorage", e);
        }

        // Verificar autenticación usando Preferences (async)
        const authenticated = await authService.isAuthenticatedAsync();
        console.log("Auth check:", authenticated);
        setIsAuthenticated(authenticated);

        // Configurar botón de retroceso
        setupBackButton();

        // Verificar actualizaciones en segundo plano
        checkForUpdates();

        setIsReady(true);

        // Ocultar SplashScreen después de que la app esté lista
        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide();
        }
      } catch (error) {
        console.error("Error inicializando:", error);
        setIsReady(true);
        // Ocultar SplashScreen incluso en error
        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide();
        }
      }
    };
    initialize();

    // Refetch al volver al frente (Capacitor no dispara eventos de foco del browser)
    const appStateListener = CapApp.addListener(
      "appStateChange",
      ({ isActive }) => {
        if (isActive) {
          queryClient.invalidateQueries();
        }
      },
    );

    // Cleanup listeners
    return () => {
      appStateListener.then((l) => l.remove());
      CapApp.removeAllListeners();
    };
  }, []);

  // Manejar instalación de actualización
  const handleUpdateInstall = async () => {
    try {
      const result = await updateService.sync();
      if (result.updated) {
        console.log("Actualización aplicada:", result.version);
      }
    } catch (error) {
      console.error("Error instalando actualización:", error);
    }
    setUpdateAvailable(false);
  };

  // Mostrar spinner mientras se inicializa
  if (!isReady) {
    return (
      <IonApp>
        <IonPage>
          <IonContent className="ion-padding ion-text-center">
            <IonRow
              className="ion-justify-content-center ion-align-items-center"
              style={{ height: "100%" }}
            >
              <IonSpinner name="crescent" />
            </IonRow>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <IonApp>
        {/* Alert para actualizaciones disponibles */}
        <IonAlert
          isOpen={updateAvailable}
          onDidDismiss={() => setUpdateAvailable(false)}
          header="Actualización Disponible"
          message={`Una nueva versión${updateVersion ? ` (${updateVersion})` : ""} está disponible. ¿Deseas actualizar ahora?`}
          buttons={[
            {
              text: "Más tarde",
              role: "cancel",
              handler: () => setUpdateAvailable(false),
            },
            {
              text: "Actualizar",
              handler: handleUpdateInstall,
            },
          ]}
        />

        <IonReactRouter>
          <SideMenu />
          <IonRouterOutlet id="main-content">
            <RouteComp exact path="/login">
              {isAuthenticated ? <RedirectComp to="/tabs/inicio" /> : <Login />}
            </RouteComp>
            <RouteComp exact path="/register" component={Register} />
            <RouteComp path="/tabs">
              {!isAuthenticated ? (
                <RedirectComp to="/login" />
              ) : (
                <TabsSection />
              )}
            </RouteComp>
            <RouteComp exact path="/">
              <RedirectComp to={isAuthenticated ? "/tabs/inicio" : "/login"} />
            </RouteComp>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </QueryClientProvider>
  );
};

export default App;
