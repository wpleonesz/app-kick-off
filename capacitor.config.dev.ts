import { CapacitorConfig } from '@capacitor/cli';

// Configuración para DESARROLLO con Live Reload
// Usa: CAPACITOR_CONFIG=capacitor.config.dev.ts npx cap run android

const config: CapacitorConfig = {
  appId: 'com.example.appkickoff',
  appName: 'App Kick Off',
  webDir: 'dist',
  server: {
    // Apunta al servidor de desarrollo de Vite
    // IP actual: 192.168.1.4 (obtener con: ifconfig | grep "inet ")
    // Puerto: 3000 (el que usa ionic serve / vite dev)
    url: 'http://192.168.1.4:3000',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#ffffff',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
      overlaysWebView: true,
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
