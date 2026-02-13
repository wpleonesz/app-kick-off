# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**App Kick Off** is a cross-platform mobile application built with Ionic React and Capacitor. It provides a minimal login/registration flow with PWA support and over-the-air (OTA) updates.

- **Framework**: React 18 + Ionic 7 + Capacitor 8
- **Build Tool**: Vite
- **Package Manager**: Yarn
- **Target Platforms**: iOS, Android, Web (PWA)
- **State Management**: React Query (TanStack)
- **Forms**: React Hook Form + Zod validation

## Common Development Commands

### Local Development
```bash
npm run dev              # Start Vite dev server (http://localhost:3001)
npm run dev:debug        # Start with debug logs enabled
npm run build            # Build web bundle to dist/
npm run build:report     # Build and show bundle size
npm run preview          # Preview build locally (port 4173)
npm run type-check       # Check TypeScript without compiling
```

### Cleanup
```bash
npm run clean            # Full clean (dist + node_modules)
npm run clean:dist       # Remove dist/ only
npm run clean:cache      # Clear Vite cache only
```

### Mobile Development - Android
```bash
npm run android          # Full: Build web, sync, run on emulator
npm run android:dev      # Dev mode (cleartext HTTP, debuggable)
npm run android:sync     # Build and sync only (no run)
npm run android:sync:only # ⚡ Sync ONLY - fast change iteration (~5 sec)
npm run android:build    # Build APK
npm run android:build:release  # Build release bundle (AAB for Play Store)
npm run android:open     # Open Android Studio
npm run android:logs     # Stream logcat in real-time
npm run android:debug    # Open dev menu
```

### Mobile Development - iOS
```bash
npm run ios              # Full: Build web, sync, run on simulator
npm run ios:dev          # Dev mode (debuggable)
npm run ios:sync         # Build and sync only (no run)
npm run ios:sync:only    # ⚡ Sync ONLY - fast change iteration (~5 sec)
npm run ios:build        # Build for iOS
npm run ios:open         # Open Xcode
npm run ios:logs         # Stream logs in real-time
```

### Capacitor Management
```bash
npm run cap:sync         # Sync web build with native projects
npm run cap:update       # Update native dependencies
npm run cap:init         # Initialize Capacitor (rarely needed)
```

### Utilities & Diagnostics
```bash
npm run info             # Show Capacitor doctor (versions, setup status)
npm run info:versions    # Show Node/NPM/Capacitor/TypeScript versions
npm run help             # Display all available commands
```

### Quick Start Examples
```bash
# Development
npm run dev                    # Start web dev server

# Android development
npm run android:dev            # Build, sync, run on emulator
npm run android:logs           # See real-time logs in separate terminal

# iOS development
npm run ios:dev                # Build, sync, run on simulator
npm run ios:logs               # See real-time logs in separate terminal

# Fast iteration (use after changing TypeScript/CSS)
npm run android:sync:only      # ⚡ ~5 seconds instead of 30
npm run ios:sync:only          # ⚡ ~5 seconds instead of 30

# Before committing
npm run type-check             # Verify no TypeScript errors
npm run build                  # Test production build
```

## Architecture

### High-Level Structure

```
src/
├── App.tsx              # Main app component - routing, auth state, initialization
├── main.tsx             # React entry point
├── config.ts            # Platform-specific API URL resolution
├── pages/               # Page components (Login, Register, Home, Profile)
├── services/            # Business logic layer
│   ├── auth.service.ts  # Auth logic (signin, signup, signout, token management)
│   ├── api.ts           # Generic API request wrapper using fetch
│   ├── update.service.ts # OTA update handling
│   └── auth.ts          # Legacy auth helpers
├── lib/
│   └── api.ts           # Centralized HTTP client (Capacitor HTTP + fetch fallback)
├── hooks/               # React hooks (useProfile, useRealtimeData)
├── storage/             # Persistent storage layer (Preferences + localStorage)
├── schemas/             # Zod validation schemas
├── components/          # Reusable UI components
└── theme/               # Styling and theme
```

### Key Service Layer Pattern

**`src/lib/api.ts`** is the primary HTTP client (inspired by sgu-mobile pattern):
- Uses Capacitor's native HTTP for iOS/Android (avoids CORS)
- Falls back to fetch for web
- Handles authentication headers (Bearer token + session cookies)
- Centralized error handling (401, 403, 5XX responses)
- Automatically manages session cookies via Preferences

**`src/services/auth.service.ts`** provides auth operations:
- `signin(credentials)` - Login with username/password
- `signup(userData)` - Register new user
- `signout()` - Logout and clear all auth data
- Supports both token-based auth and session cookies
- Syncs state to Preferences (native) and localStorage (web)

**`src/config.ts`** determines API base URL at runtime:
- Web: `VITE_API_URL` env var or `http://localhost:3000`
- Android: `VITE_API_URL_ANDROID` or `http://10.0.2.2:3000` (emulator default)
- iOS: `VITE_API_URL_IOS` or `http://localhost:3000` (simulator default)

### Storage Strategy

- **Capacitor Preferences**: Persistent async storage (survives app restart)
- **localStorage**: Quick sync layer for web
- **profileData**: Ionic Storage wrapper for user profile
- Auth state syncs between both on app initialization

### Routing & State

**React Router v5** for navigation with auth guards:
- `/login` → Unauthenticated users
- `/register` → Public registration
- `/tabs/inicio` → Home (authenticated)
- `/tabs/perfil` → Profile (authenticated)
- Automatic redirects based on `isAuthenticated` state in App.tsx

**React Query** configured with:
- 5-minute cache (gcTime)
- 10-second stale threshold
- Auto-refetch on window focus
- Auto-refetch on reconnect
- 2 retry attempts on failure
- Queries invalidated on tab changes

### React Hook Form + Zod

Forms use React Hook Form for state management and Zod for validation:
- See `src/schemas/` for validation schemas
- Forms in `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/Profile.tsx`

## Platform-Specific Details

### Android
- Default emulator API endpoint: `http://10.0.2.2:3000`
- Native HTTP plugin enabled
- Material Design mode (consistent across platforms)
- Safe area support for notches

### iOS
- Default simulator API endpoint: `http://localhost:3000`
- Native HTTP plugin enabled
- WebView overlays status bar for safe area integration
- Swipe-back gesture enabled by default

### Web/PWA
- Runs on Vite dev server (http://localhost:3001)
- Includes PWA elements for camera access
- Uses fetch API for HTTP requests
- No native features available

## Important Configuration Files

- **vite.config.ts**: Dev server on port 3001, HMR enabled for external devices
- **capacitor.config.ts**: App ID, plugins (SplashScreen, StatusBar, LiveUpdate, CapacitorHttp)
- **capacitor.config.dev.ts**: Dev-only overrides
- **tsconfig.json**: TypeScript strict mode enabled
- **.env**: Environment variables (never commit secrets)

## Development Tips

### Debugging HTTP Requests
- API client logs to console: `console.debug("HTTP request:", {...})`
- Check browser DevTools Network tab for web
- Use Android Studio/Xcode debuggers for native

### Mock API Responses
- Set `USE_MOCK_FALLBACK = true` in config.ts for development without backend
- Provides fake tokens and user data for testing auth flows

### OTA Updates
- App checks for updates on startup (update.service.ts)
- Configure LiveUpdate URL in capacitor.config.ts
- App won't auto-delete old bundles (autoDeleteBundles: false)

### Hot Reload During Development
- Web: Vite HMR automatically refreshes
- Mobile: Use `npm run android:dev` / `npm run ios:dev` with dev config
- Dev config allows cleartext HTTP from emulators

### StatusBar & Safe Area
- StatusBar positioned to overlay WebView (iOS/Android)
- CSS variables available: `env(safe-area-inset-*)`
- Material Design mode used for UI consistency

## Testing & Building

Currently no test framework configured. To add:
- Consider Vitest for unit tests (Vite-native)
- React Testing Library for component tests
- E2E: Detox or Appium for mobile

## Security Considerations

- Bearer token stored in localStorage (consider using secure storage for sensitive apps)
- Session cookies managed via Preferences (more secure than localStorage)
- HTTPS enforced in production capacitor config
- Cleartext HTTP only enabled for development
- Remove `webContentsDebuggingEnabled: true` from capacitor.config.ts before production

## Future Improvements

Per README:
- Replace mock auth with real API endpoints
- Add comprehensive error handling
- Configure native signing for production builds
- Implement token refresh logic
- Add logging/crash reporting service
