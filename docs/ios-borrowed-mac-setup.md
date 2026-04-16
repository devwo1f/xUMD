# iOS Setup on a Borrowed MacBook

This guide is the exact path for running `xUMD` on iPhone or the iOS Simulator using a friend's MacBook.

## Short answer first

Run this command in the macOS **Terminal app**, not inside Xcode:

```bash
brew install node watchman cocoapods
```

Use Xcode for:
- Apple ID sign-in
- iPhone trust/signing
- simulator access
- fixing signing errors if they appear

Use Terminal for:
- installing tools
- cloning the repo
- installing dependencies
- starting Metro
- building and running the app

## 1. Install the required Mac tools

### Install Xcode

1. Open the App Store on the Mac.
2. Install `Xcode`.
3. Open Xcode once and let it finish installing extra components.

### Install Xcode command line tools

Open **Terminal** and run:

```bash
xcode-select --install
```

If it says the tools are already installed, that is fine.

### Install Homebrew

Check whether Homebrew exists:

```bash
brew --version
```

If `brew` is not found, install it from [https://brew.sh](https://brew.sh).

### Install Node, Watchman, and CocoaPods

Open **Terminal** and run:

```bash
brew install node watchman cocoapods
```

## 2. Sign into Apple tools

### Sign into Xcode

1. Open `Xcode`.
2. Go to `Xcode > Settings > Accounts`.
3. Sign in with your Apple ID.

If you only have a free Apple ID, you can usually still test on your own iPhone, but installs are more limited and temporary.

## 3. Get the project on the Mac

Open **Terminal** and run:

```bash
git clone https://github.com/devwo1f/xUMD.git
cd xUMD
```

## 4. Create the local environment file

Inside the project root, create `.env.local` with these values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://vxbmltmkywtkirszlvzk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wtWJjzMOYpbit5FxOQuibQ_uEdabIHM
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_wtWJjzMOYpbit5FxOQuibQ_uEdabIHM
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=<your_mapbox_public_access_token>
```

You can create it with:

```bash
cat > .env.local <<'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://vxbmltmkywtkirszlvzk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wtWJjzMOYpbit5FxOQuibQ_uEdabIHM
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_wtWJjzMOYpbit5FxOQuibQ_uEdabIHM
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=<your_mapbox_public_access_token>
EOF
```

## 5. Install project dependencies

In **Terminal**, from the `xUMD` folder:

```bash
npm install
```

If npm complains about peer dependency issues, use:

```bash
npm install --legacy-peer-deps
```

## 6. First test: iOS Simulator

This is the safest first run because it avoids phone signing issues while we verify the project boots.

### Terminal window 1

Start Metro in dev-client mode:

```bash
npm run start:dev-client
```

### Terminal window 2

Build and launch iOS:

```bash
npm run ios
```

What this does:
- generates the native iOS project if needed
- installs CocoaPods dependencies
- builds the app
- opens it in the iOS Simulator

## 7. Run on a physical iPhone

### Connect the device

1. Plug the iPhone into the Mac with a cable.
2. On the phone, tap `Trust This Computer` if prompted.
3. If iOS asks for `Developer Mode`, enable it and restart the phone if required.

### Install to the phone

From **Terminal**, in the project root:

```bash
npx expo run:ios --device
```

This will either:
- install directly to the device, or
- open Xcode so you can resolve signing settings

## 8. If Xcode signing errors appear

This is normal on the first physical-device run.

### In Xcode

1. Select the project target.
2. Open `Signing & Capabilities`.
3. Choose your Apple ID team.
4. Let Xcode manage signing automatically.

If the bundle identifier is already taken, change it to something unique.

Current bundle id in this repo:

```text
com.xumd.app
```

A safe temporary dev option is something like:

```text
com.abhay.xumd.dev
```

If you change it, update it in `app.json`, then rerun:

```bash
npx expo run:ios --device
```

## 9. Which app do I open on the phone?

Open the installed **xUMD development build**, not Expo Go.

Keep Metro running with:

```bash
npm run start:dev-client
```

The installed dev build will connect to Metro and load the app.

## 10. Common fixes

### If CocoaPods fails

Run:

```bash
npx pod-install
```

Then try:

```bash
npm run ios
```

### If Metro seems stuck on old environment values

Stop Metro and restart it:

```bash
npm run start:dev-client
```

### If the simulator opens but the app does not

Try:

```bash
npx expo run:ios
```

### If the phone build succeeds but the app will not launch

Check:
- the iPhone trusted the Mac
- Developer Mode is enabled
- the correct Apple team is selected in Xcode
- Metro is still running

## 11. Fast checklist

Run these in order:

```bash
xcode-select --install
brew install node watchman cocoapods
git clone https://github.com/devwo1f/xUMD.git
cd xUMD
npm install
npm run start:dev-client
```

Then in another Terminal window:

```bash
npm run ios
```

Or for a real iPhone:

```bash
npx expo run:ios --device
```

## 12. What you do not need to do

- Do not run `brew install ...` inside Xcode.
- Do not use Expo Go for this app.
- Do not start by chasing TestFlight first.

The right order is:
1. Simulator
2. Physical iPhone dev build
3. Then distribution later

