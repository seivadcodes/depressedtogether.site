import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.depressedtogether.app',
  appName: 'depressedtogether',
  
  // 👇 CRITICAL: Point to your LIVE website
  server: {
    url: 'https://www.depressedtogether.com', 
    cleartext: false, // Keep false for HTTPS
  },
  
  android: {
    allowMixedContent: true,
  },
};

export default config;