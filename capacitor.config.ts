import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.barpi.app',
  appName: 'Bar-Pi',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'localhost',
      '127.0.0.1',
      '192.168.*.*',
      '10.*.*.*',
      '172.16.*.*'
    ]
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
