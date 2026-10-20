import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.minenotes.app',
  appName: 'Mine Notes',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://nandhaalagesan248-mine-notes.static.hf.space',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
