import React, { useState } from "react";
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonFooter,
  IonText,
  IonNote,
  IonRow,
  IonCol,
  IonGrid,
  useIonAlert,
  IonMenuToggle,
} from "@ionic/react";
import {
  personOutline,
  settingsOutline,
  notificationsOutline,
  bookmarkOutline,
  moonOutline,
  sunnyOutline,
  informationCircleOutline,
  helpCircleOutline,
  logOutOutline,
  footballOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import { Capacitor } from "@capacitor/core";
import { authService } from "../services/auth.service";
import { useProfile } from "../hooks/useRealtimeData";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "./common/AppToast";

/* ── Menu items ── */
const MENU_ITEMS = [
  { icon: personOutline, label: "Mi Perfil", path: "/tabs/perfil" },
  { icon: settingsOutline, label: "Configuración", action: "settings" },
  {
    icon: notificationsOutline,
    label: "Notificaciones",
    action: "notifications",
  },
  { icon: bookmarkOutline, label: "Guardado", action: "saved" },
];

const SideMenu: React.FC = () => {
  const { data: user } = useProfile();
  const { toast, showError, showSuccess, dismissToast } = useAppToast();
  const [presentAlert] = useIonAlert();
  const [isDarkMode, setIsDarkMode] = useState(
    () =>
      document.body.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fullName = user?.Person?.name || user?.name || user?.username || "";
  const roleName = user?.roles?.[0]?.Role?.name ?? user?.role ?? "";

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

  const handleAction = (action: string) => {
    switch (action) {
      case "settings":
        showSuccess("Configuración próximamente");
        break;
      case "notifications":
        showSuccess("No tienes notificaciones nuevas");
        break;
      case "saved":
        showSuccess("No tienes elementos guardados");
        break;
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

  const showAbout = () => {
    presentAlert({
      header: "Kick Off",
      subHeader: "Versión 0.1.0",
      message: `Plataforma: ${Capacitor.getPlatform()}\nTu app para organizar partidos de fútbol, torneos y equipos.\n\n© 2026 Kick Off`,
      buttons: ["Cerrar"],
    });
  };

  return (
    <IonMenu contentId="main-content" type="overlay" className="fb-side-menu">
      <IonHeader className="fb-header">
        <IonToolbar>
          <IonTitle className="fb-logo-text" style={{ paddingLeft: "16px" }}>
            Menú
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* ── User Profile Section ── */}
        <IonMenuToggle autoHide={false}>
          <IonItem
            button
            detail={false}
            routerLink="/tabs/perfil"
            className="fb-menu-profile"
            lines="none"
          >
            <IonText
              className="fb-avatar-sm"
              style={{ width: "50px", height: "50px", fontSize: "1.1rem" }}
              slot="start"
            >
              {getInitials(fullName)}
            </IonText>
            <IonLabel>
              <IonText className="fb-menu-profile-name">
                {fullName || "Usuario"}
              </IonText>
              <IonNote className="fb-menu-profile-role">
                {roleName || "Miembro"} · Ver tu perfil
              </IonNote>
            </IonLabel>
            <IonIcon
              icon={chevronForwardOutline}
              slot="end"
              style={{ color: "var(--ion-color-medium)", fontSize: "18px" }}
            />
          </IonItem>
        </IonMenuToggle>

        {/* ── Divider ── */}
        <IonItem lines="none" className="fb-menu-divider" />

        {/* ── Menu Items ── */}
        <IonList lines="none" className="fb-menu-list">
          {MENU_ITEMS.map((item) => (
            <IonMenuToggle key={item.label} autoHide={false}>
              <IonItem
                button
                detail={false}
                className="fb-menu-item"
                {...(item.path
                  ? { routerLink: item.path }
                  : { onClick: () => handleAction(item.action!) })}
              >
                <IonText className="fb-menu-icon-wrapper" slot="start">
                  <IonIcon icon={item.icon} />
                </IonText>
                <IonLabel>{item.label}</IonLabel>
                <IonIcon
                  icon={chevronForwardOutline}
                  slot="end"
                  style={{ fontSize: "16px", color: "var(--ion-color-medium)" }}
                />
              </IonItem>
            </IonMenuToggle>
          ))}

          {/* Dark Mode Toggle */}
          <IonMenuToggle autoHide={false}>
            <IonItem
              button
              detail={false}
              className="fb-menu-item"
              onClick={toggleDarkMode}
            >
              <IonText className="fb-menu-icon-wrapper" slot="start">
                <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} />
              </IonText>
              <IonLabel>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>

        {/* ── Divider ── */}
        <IonItem lines="none" className="fb-menu-divider" />

        {/* ── Bottom Section ── */}
        <IonList lines="none" className="fb-menu-list">
          <IonMenuToggle autoHide={false}>
            <IonItem
              button
              detail={false}
              className="fb-menu-item"
              onClick={showAbout}
            >
              <IonText className="fb-menu-icon-wrapper" slot="start">
                <IonIcon icon={informationCircleOutline} />
              </IonText>
              <IonLabel>Acerca de la App</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle autoHide={false}>
            <IonItem
              button
              detail={false}
              className="fb-menu-item"
              onClick={() =>
                showSuccess("Contacta a soporte: soporte@kickoff.app")
              }
            >
              <IonText className="fb-menu-icon-wrapper" slot="start">
                <IonIcon icon={helpCircleOutline} />
              </IonText>
              <IonLabel>Ayuda y Soporte</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle autoHide={false}>
            <IonItem
              button
              detail={false}
              className="fb-menu-item fb-menu-item-danger"
              onClick={confirmLogout}
            >
              <IonText
                className="fb-menu-icon-wrapper"
                slot="start"
                style={{
                  background: "rgba(250, 62, 62, 0.1)",
                  color: "var(--ion-color-danger)",
                }}
              >
                <IonIcon icon={logOutOutline} />
              </IonText>
              <IonLabel color="danger">Cerrar Sesión</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>

      <IonFooter className="fb-menu-footer">
        <IonToolbar>
          <IonRow className="fb-menu-footer-text ion-justify-content-center ion-align-items-center">
            <IonIcon icon={footballOutline} style={{ fontSize: "14px" }} />
            <IonText style={{ fontSize: "12px", marginLeft: "6px" }}>
              Kick Off v0.1.0
            </IonText>
          </IonRow>
        </IonToolbar>
      </IonFooter>

      <AppToast toast={toast} onDismiss={dismissToast} />
    </IonMenu>
  );
};

export default SideMenu;
