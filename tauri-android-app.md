# Tauri v2 Android APK Implementation Plan

## Goal
Build a high-performance Android APK for Fleet Control powered by Rust and Tauri v2, incorporating an Apple Liquid Glass UI, native background geolocation tracking with Android Foreground Service, notifications, and an automated terminal-free / CLI GitHub Actions build pipeline.

## Architecture & Components
1. **Tauri v2 Rust Core (`src-tauri/`)**:
   - `Cargo.toml`: Tauri v2 crate, `tauri-plugin-notification`, `tauri-plugin-geolocation`, `serde`.
   - `tauri.conf.json`: Configured for bundled Vite/React production dist (`../dist`), identifier `com.nbapark.fleetcontrol`, Android permissions.
   - `src-tauri/src/lib.rs` & `src-tauri/src/main.rs`: Rust application entry points registering notification and geolocation plugins.
   - `src-tauri/capabilities/default.json`: Tauri v2 security capabilities granting window permissions for geolocation and notifications.

2. **Android Native Configuration & Permissions**:
   - `AndroidManifest.xml`: Configured with `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `POST_NOTIFICATIONS`, `WAKE_LOCK`, and `INTERNET`.
   - Native App Icon and Splash setup.

3. **Hybrid Frontend Service (`services/nativeBridge.ts`)**:
   - Detects whether running inside Tauri native environment or web browser.
   - Hooks into `services/trackingService.ts` to trigger native notifications (e.g. "Veículo em deslocamento", "Parada detectada") and keep telemetry active without OS killing the WebView.
   - Implements native notification permissions check for Android 13+.

4. **Apple Liquid Glass Styling Optimization**:
   - Respects Android WebView system bar and navigation bar safe areas (`safe-area-inset-top`, `safe-area-inset-bottom`).
   - Frosted glass floating navigation dock with dynamic backdrop filter blur and light specular highlights.

5. **Cloud CI/CD Build Pipeline (`.github/workflows/build-android-apk.yml`)**:
   - Automated GitHub Actions workflow to compile the Tauri v2 Android APK with Rust target toolchains (`aarch64-linux-android`), OpenJDK 17, and Android NDK r26.
   - Can be triggered manually via `workflow_dispatch` or on push.
   - Produces signed/unsigned release APK ready for installation on devices without requiring local Android Studio.

## Tasks
- [x] Task 1: Install Tauri v2 npm dependencies (`@tauri-apps/api`, `@tauri-apps/plugin-notification`, `@tauri-apps/plugin-geolocation`, `@tauri-apps/cli`) in `package.json`.
- [x] Task 2: Create Tauri v2 Rust project scaffolding in `src-tauri/` (`Cargo.toml`, `tauri.conf.json`, `src/lib.rs`, `src/main.rs`, `capabilities/default.json`).
- [x] Task 3: Create Android manifest & configuration with background location, foreground service, and notification permissions (`scripts/configure-android-manifest.js`).
- [x] Task 4: Implement `services/nativeBridge.ts` and integrate with `services/trackingService.ts` for native notifications and persistent GPS handling.
- [x] Task 5: Refine Apple Liquid Glass layout with mobile status bar safe-area paddings and viewport meta tags.
- [x] Task 6: Create `.github/workflows/build-android-apk.yml` for automated terminal/cloud APK compilation.
- [x] Task 7: Verify build (`npm run build` and `npm run type-check`) and test bridge functionality.
