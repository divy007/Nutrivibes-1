---
description: How to build NutriVibes for production
---

# Production Build Guide

This workflow guides you through building the NutriVibes application for production.

## 1. Prepare Mobile App for Production
Before building the mobile app, you must point it to the production server.

1. Open `mobile/lib/api-client.ts`.
2. Change the `IS_PROD` constant to `true` (Line 12).
   ```typescript
   // mobile/lib/api-client.ts
   const IS_PROD = true;
   ```
3. Commit this change.

## 2. Build Mobile App (Android)
Using EAS Build to generate an APK (for testing) or AAB (for Play Store).

### For Testing (APK)
Refer to the "preview" profile in `eas.json`.
```bash
cd mobile
eas build --platform android --profile preview
```
- This will generate an `.apk` file you can install directly on your phone.

### For Play Store (AAB)
Refer to the "production" profile in `eas.json`.
```bash
cd mobile
eas build --platform android --profile production
```
- This will generate an `.aab` file for upload to the Google Play Console.

## 3. Build Web App (Dietician Dashboard)
The web app is hosted on Vercel.

### Automatic Deployment
1. Push your changes to the `main` branch.
   ```bash
   git add .
   git commit -m "Prepare for production"
   git push origin main
   ```
2. Vercel will automatically detect the commit and start a production build.

### Manual Local Build (Optional)
If you need to test the build locally:
```bash
npm run build
npm start
```

## 4. Post-Build
After building/deploying:
- **Mobile**: Revert `IS_PROD` to `false` in `mobile/lib/api-client.ts` if you plan to continue local development.
- **Web**: Check Vercel dashboard for build status.
