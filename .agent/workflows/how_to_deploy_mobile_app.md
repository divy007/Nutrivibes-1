---
description: Guide on how to share and deploy the NutriVibes mobile app
---

# How to Share the Mobile App

You have three main ways to share your app with clients.

## 1. Expo Go (Development Sharing)
**Best for**: Quick demos, testing, and feedback loops.
**Pros**: Free, instant updates.
**Cons**: Requires the "Expo Go" app, phone and computer must be on the same network (or use tunnel).

**Steps:**
1. Ensure your computer is running `npx expo start`.
2. Ask the client to install **Expo Go** (Android) or **Expo Go** (iOS) from the app store.
3. Send them a picture of the QR code from your terminal.
4. They scan it inside the Expo Go app.

> **Tip**: If you are not on the same WiFi, run `npx expo start --tunnel`. This creates a public link you can share anywhere.

---

## 2. Standalone APK (Android Direct Share)
**Best for**: Giving Android users a "real" app file to install.
**Pros**: Looks like a real app, no dev server needed.
**Cons**: Android only, requires a build process (takes ~15 mins), manual updates.

**Prerequisites:**
- EAS CLI installed: `npm install -g eas-cli`
- Expo Account: [Sign up here](https://expo.dev/signup)

**Steps:**
1. Log in: `eas login`
2. Configure project: `eas build:configure` (Select `Android`)
3. Open `eas.json` and add a "preview" profile if not present (often added automatically).
4. Run build: `eas build -p android --profile preview --local` (or omit `--local` to build in the cloud).
5. Once finished, you get a `.apk` file.
6. WhatsApp/Email this file to your client. They can tap to install.

---

## 3. Play Store / App Store (Production)
**Best for**: Public release to all users.
**Pros**: Professional, accessible to everyone, automatic updates.
**Cons**: Cost ($25 Google, $99/yr Apple), review times (1-3 days).

**Steps:**
1. You need a **Google Play Console** account and/or **Apple Developer** account.
2. Configure build for production: `eas build:configure`.
3. Build for stores:
   - Android: `eas build -p android --profile production` (creates .aab)
   - iOS: `eas build -p ios --profile production` (creates .ipa)
4. Upload these files to the respective app store consoles.
