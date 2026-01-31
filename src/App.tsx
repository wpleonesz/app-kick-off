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
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";

// Workaround TypeScript JSX mismatch: exponer versiones any de Route/Redirect
// para evitar error "No se puede usar Route como componente JSX" causado
// por desajustes de tipos entre dependencias. Revisar más adelante.
const RouteComp: any = Route as any;
const RedirectComp: any = Redirect as any;
import { home, person } from "ionicons/icons";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import { authService } from "./services/auth.service";
import { initStorage } from "./storage";
import { updateService } from "./services/update.service";

// Configuración de React Query para datos en tiempo real
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch cuando la ventana recupera el foco
      refetchOnWindowFocus: true,
      // Refetch cuando hay conexión de nuevo
      refetchOnReconnect: true,
      // Mantener datos en caché por 5 minutos
      gcTime: 1000 * 60 * 5,
      // Datos considerados frescos por 10 segundos
      staleTime: 1000 * 10,
      // Reintentar 2 veces si falla
      retry: 2,
    },
  },
});

// Configuración de Ionic React con SafeArea habilitado
setupIonicReact({
  mode: "md", // Material Design para consistencia entre plataformas
  swipeBackEnabled: true,
});

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
        // Configurar estilo de StatusBar
        await StatusBar.setStyle({ style: Style.Dark });

        const platform = Capacitor.getPlatform();
        if (platform === "android") {
          // En Android, hacer la barra transparente para SafeArea
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
          await StatusBar.setOverlaysWebView({ overlay: true });
        } else if (platform === "ios") {
          // En iOS también colocar el WebView debajo de la StatusBar
          // para que las variables CSS `env(safe-area-inset-*)` se apliquen.
          await StatusBar.setOverlaysWebView({ overlay: true });
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

    // Cleanup listeners
    return () => {
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
          <IonRouterOutlet>
            <RouteComp exact path="/login">
              {isAuthenticated ? <RedirectComp to="/tabs/inicio" /> : <Login />}
            </RouteComp>
            <RouteComp exact path="/register" component={Register} />
            <RouteComp path="/tabs">
              {!isAuthenticated ? (
                <RedirectComp to="/login" />
              ) : (
                <IonTabs>
                  <IonRouterOutlet>
                    <RouteComp exact path="/tabs/inicio" component={Home} />
                    <RouteComp exact path="/tabs/perfil" component={Profile} />
                    <RouteComp exact path="/tabs">
                      <RedirectComp to="/tabs/inicio" />
                    </RouteComp>
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
