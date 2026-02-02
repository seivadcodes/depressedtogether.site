// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.depressedtogether.app', // or com.yourname.depressedtogether
  appName: 'Depressed Together',
  webDir: 'public',
  server: {
    url: 'https://www.depressedtogether.site', // ← no spaces!
    cleartext: false,
  },
  android: {
    allowMixedContent: false, // only enable if you load HTTP assets (you shouldn’t)
  },
};

export default config;