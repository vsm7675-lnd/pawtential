import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawtential.app',
  appName: 'Pawtential',
  webDir: 'out',
  server: {
    // Point to your deployed Vercel app
    url: 'https://pawtential.vercel.app',
    cleartext: true
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
