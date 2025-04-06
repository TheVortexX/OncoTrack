# OncoTrack

OncoTrack is a mobile application built with [Expo](https://expo.dev) to help cancer patients track their health and wellness. The app leverages modern React Native features, file-based routing, and a modular architecture to deliver a seamless user experience.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Development](#development)
- [Testing](#testing)
- [Learn More](#learn-more)
- [Community](#community)

---

## Features

- **Health Tracking**: Track daily health metrics and schedules.
- **Emergency Assistance**: Quickly access emergency features.
- **Cross-Platform**: Runs on Android and iOS.
- **File-Based Routing**: Simplified navigation using Expo Router.
- **Hermes Engine**: Optimized performance for React Native.

---

## Project Structure

```
.
├── app/                  # Main application code
│   ├── _layout.tsx       # Layout configuration
│   ├── (auth)/           # Authentication-related screens
│   ├── (tabs)/           # Tab-based navigation screens
├── assets/               # Static assets (images, fonts, etc.)
├── components/           # Reusable UI components
├── constants/            # App-wide constants
├── context/              # Context providers for global state
├── hooks/                # Custom React hooks
├── services/             # API and service integrations
├── utils/                # Utility functions
├── package.json          # Project metadata and dependencies
└── README.md             # Project documentation
```

---

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the app**:

   ```bash
   npx expo start
   ```

   This will open the Expo Developer Tools in your browser. From there, you can:

   - Run the app on a [development build](https://docs.expo.dev/develop/development-builds/introduction/).
   - Open the app in an [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/).
   - Open the app in an [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/).
   - Use [Expo Go](https://expo.dev/go) for quick testing.

---

## Scripts

Here are the available npm scripts:

- **Start the app**: `npm start`
- **Run on Android**: `npm run android`
- **Run on iOS**: `npm run ios`
- **Run on Web**: `npm run web`
- **Run tests**: `npm run test`
- **Lint the code**: `npm run lint`

---

## Development

### File-Based Routing

This project uses [Expo Router](https://expo.github.io/router/docs) for file-based routing. You can define routes by creating files and folders in the app directory.

### Theming

The app uses a centralized theme defined in theme.ts. You can customize colors, fonts, and other styles globally.

### Emergency Features

The `EmergencyButton` component in emergencyButton.tsx provides quick access to emergency assistance.