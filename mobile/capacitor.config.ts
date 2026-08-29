import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "app.jackdaw.client",
  appName: "Jackdaw",
  webDir: "./dist",
  plugins: {
    CapacitorNodeJS: {
      nodeDir: "nodejs",
      androidLibNode: "https://github.com/nodejs-mobile/nodejs-mobile/releases/download/v18.20.4/nodejs-mobile-v18.20.4-android.zip",
      androidArchitectures: ["arm64"],
    },
    SplashScreen: {
      launchAutoHide: true,
    },
    EdgeToEdge: {
      backgroundColor: "#494558",
    },
    StatusBar: {
      overlaysWebView: false,
    },
  },
}

export default config;
