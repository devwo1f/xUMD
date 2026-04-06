# Native Builds and Physical Device Testing

## Why this app needs a development build

xUMD uses native modules such as `@rnmapbox/maps`, so it cannot run correctly in Expo Go. Use an Expo development build for real-device testing.

## Prerequisites

- Expo account
- EAS CLI login: `npx eas-cli login`
- Mapbox public token in `.env.local`
- Supabase URL and publishable key in `.env.local`

## Start the app for an installed dev client

```powershell
npm run start
```

This starts Metro in dev-client mode.

## Android physical device

### Fastest cloud build path

```powershell
npm run build:android:development
```

- Install the generated APK on your Android phone.
- Open the installed xUMD dev client.
- Keep Metro running with `npm run start`.

### Local Android path

If you have Android Studio and an SDK installed:

```powershell
npm run android
```

## iPhone physical device

On Windows, the practical path is an EAS cloud build:

```powershell
npm run build:ios:development
```

Then:
- install the build from the Expo dashboard / device link
- or distribute it through your Apple developer provisioning flow
- keep Metro running with `npm run start`

For App Store / TestFlight style builds, use the production profile:

```powershell
npm run build:ios:production
```

## Internal test builds

```powershell
npm run build:android:preview
npm run build:ios:preview
```

## Store-style production builds

```powershell
npm run build:android:production
npm run build:ios:production
```

## Important notes

- Web still runs with `npm run web`.
- Because the app uses custom native code, `expo start --android` and `expo start --ios` are not the right physical-device workflow here.
- If EAS asks to configure the project the first time, follow the prompt and let it create the linked project metadata.
