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
import { home, homeOutline, person, personOutline } from "ionicons/icons";
import { useLocation } from "react-router-dom";
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

// Configuración de Ionic React con SafeArea habilitado
setupIonicReact({
  mode: "md",
  swipeBackEnabled: true,
});

// ── Tab bar con indicador visual de tab activo ──────────────────────────────
const TABS = [
  { tab: "inicio", href: "/tabs/inicio", label: "Inicio", icon: homeOutline, activeIcon: home },
  { tab: "perfil", href: "/tabs/perfil", label: "Perfil", icon: personOutline, activeIcon: person },
];

const TabBar: React.FC = () => {
  const location = useLocation();

  return (
    <IonTabBar
      slot="bottom"
      style={{
        "--background": "#ffffff",
        "--border": "none",
        boxShadow: "0 -1px 0 rgba(0,0,0,0.08)",
        height: "60px",
      } as React.CSSProperties}
    >
      {TABS.map(({ tab, href, label, icon, activeIcon }) => {
        const isActive = location.pathname === href;
        return (
          <IonTabButton
            key={tab}
            tab={tab}
            href={href}
            style={{
              "--color": "#9e9e9e",
              "--color-selected": "#1877f2",
            } as React.CSSProperties}
          >
            <IonIcon
              icon={isActive ? activeIcon : icon}
              style={{
                fontSize: "22px",
                transition: "transform 0.15s ease",
                transform: isActive ? "scale(1.1)" : "scale(1)",
              }}
            />
            <IonLabel
              style={{
                fontSize: "11px",
                fontWeight: isActive ? 700 : 400,
                letterSpacing: isActive ? "0.01em" : "normal",
              }}
            >
              {label}
            </IonLabel>
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: "4px",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#1877f2",
                }}
              />
            )}
          </IonTabButton>
        );
      })}
    </IonTabBar>
  );
};
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
    const appStateListener = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        queryClient.invalidateQueries();
      }
    });

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
                  <TabBar />
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
