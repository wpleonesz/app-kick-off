import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.appkickoff",
  appName: "App Kick Off",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
      overlaysWebView: false,
    },
    LiveUpdate: {
      // URL de tu servidor de actualizaciones (configura según tu backend)
      appId: "com.example.appkickoff",
      autoDeleteBundles: true,
      enabled: false, // Cambiar a true cuando se configure el servidor de actualizaciones
      readyTimeout: 10000,
      resetOnUpdate: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Cambiar a false en producción
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  server: {
    cleartext: true,
    androidScheme: "https",
  },
};

export default config;
