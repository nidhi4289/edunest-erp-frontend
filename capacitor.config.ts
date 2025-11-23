import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edunest.erp',
  appName: 'EduNest ERP',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    allowNavigation: ['*']
  }
};

export default config;
