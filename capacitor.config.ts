import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.depressedtogether.app',
  appName: 'Depressed Together',
  webDir: 'out',
  server: {
    // ✅ Removed trailing spaces + added cleartext for Android
    url: 'https://www.depressedtogether.com',
    cleartext: true,
    // ✅ Allow navigation to auth callback URLs (critical for Supabase redirects)
    allowNavigation: [
      'https://www.depressedtogether.com',
      'https://.depressedtogether.com',
      'com.depressedtogether.app://**', // Custom scheme for deep links
    ],
  },
  android: {
    allowMixedContent: true,
    // ✅ Ensure WebView can handle redirects properly
    captureInput: true,
  },
  // ✅ Optional: iOS specific settings if you build for iOS later
  ios: {
    contentInset: 'always',
  },
};

export default config;