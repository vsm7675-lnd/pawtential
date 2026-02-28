import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawtential.app',
  appName: 'Pawtential',
  webDir: 'out',
  server: {
    url: 'https://pawtential.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    // Keep app inside WebView, don't open browser
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10B981',
      showSpinner: false
    }
  }
};

export default config;
