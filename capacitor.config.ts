import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Unique reverse-DNS bundle ID. Change to your registered Apple Developer Team ID domain.
  appId: 'app.digitimes.ios',
  appName: 'DigiTimes',

  // Points to the CRA build output. `npm run build` must run before `npx cap sync`.
  webDir: 'build',

  // Server config: in production, load the bundled build.
  // For live reload during dev, uncomment the url line below.
  server: {
    // url: 'https://digi-times.netlify.app',  // Uncomment for live-reload dev testing
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      // Supabase API calls
      '*.supabase.co',
      // OpenAI calls go through Netlify functions which are same-origin
    ],
  },

  ios: {
    // The app icon src is set here — Xcode will slice into required sizes.
    // Place your 1024x1024 icon at ios/App/App/Assets.xcassets/AppIcon.appiconset/
    contentInset: 'always',          // Respect safe area (notch, home indicator)
    backgroundColor: '#fffdf8',      // Matches --paper-white
    scrollEnabled: true,
    preferredContentMode: 'mobile',
  },

  plugins: {
    // SplashScreen: configure a startup screen while the JS bundle loads.
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0b1d36',    // --ink-black (deep navy)
      iosSpinnerStyle: 'light',
      showSpinner: false,
    },

    // Keyboard: avoid layout jumping when keyboard appears on mobile.
    Keyboard: {
      resize: 'body',
      style: 'light',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
