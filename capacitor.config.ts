import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.appkickoff',
  appName: 'app-kick-off',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
