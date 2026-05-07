import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iiitr.feedback',
  appName: 'IIITR Faculty Feedback',
  webDir: 'dist/frontend/browser',

  // ─────────────────────────────────────────────────────────────
  // LIVE RELOAD (Development only)
  // ─────────────────────────────────────────────────────────────
  // Keep this block enabled while developing. The Android app
  // will stream from your local `ng serve` instead of bundled
  // assets, so every frontend save instantly reflects on device.
  //
  // ⚠️ COMMENT THIS OUT before running a production APK build!
  // ─────────────────────────────────────────────────────────────
  server: {
    url: 'http://192.168.1.100:4200',  // ← Replace with YOUR PC's local IP (run `ipconfig` to find it)
    cleartext: true                     // Allows HTTP on Android debug builds
  }
};

export default config;
