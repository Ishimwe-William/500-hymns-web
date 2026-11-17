# Indirimbo Zo Guhimbaza Imana

A digital hymnbook for browsing, reading, and presenting 500 Kinyarwanda hymns. Built by [BunsenPlus](https://bunsenplus.vercel.app).

## Features

- Public hymn browsing, search, and reading without signing in.
- Search by hymn number, title, original title, or lyrics in a popup, without changing the URL. Expand the popup to see all matches.
- List and grid views, with sorting by number or title.
- Favorites, recently opened hymns, theme, text size, and verse-number preferences stored locally on the device.
- Audio playback when a hymn has an audio source, with previous/next controls that skip hymns without recordings.
- Fullscreen presentation with keyboard navigation and adjustable text size.
- Google sign-in and admin access using the same Firebase user roles as the mobile app.
- Admin hymn editing with a live preview, original section numbering, editor attribution, and immediate cache invalidation after saves.
- About, Profile, Settings, Admin, and Privacy pages with section sidebars and shareable hash links.
- Branded error pages and a guided mobile beta download page.

## Current offline behavior

The website requires an internet connection to load hymns and play audio. It does not currently download audio or provide an offline hymnbook. Favorites and reading preferences are kept in browser storage when it is available; this does not download the corresponding hymn content or sync preferences between devices.

The mobile app supports offline access. To install the beta:

1. [Join the BunsenPlus testers group](https://groups.google.com/g/bunsenplus-testers).
2. [Open the Google Play testing page](https://play.google.com/apps/testing/com.bunsenplus.hymnsapp) using the same Google account.
3. Follow the testing page instructions to join the beta and install the app.

All website download links lead to `/download`, where these steps are explained.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Firebase Authentication, and Cloud Firestore. The brand title uses the bundled Matura font through `next/font/local`; interface text uses Roboto.

This repository uses Next.js conventions documented in `node_modules/next/dist/docs/`. Read `AGENTS.md` before making changes.

## Local setup

You need Node.js, npm, and access to the Firebase project used by the mobile app.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Fill in the Firebase web app configuration in `.env.local`:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Get these values from Firebase Console > Project settings > Your apps. These are public web configuration values. Never put service-account credentials or a Google client secret in `NEXT_PUBLIC_*` variables.

```powershell
npm run dev
```

Open `http://localhost:3000`. Restart the development server after changing environment variables.

## Hymn data and ordering

The app reads actual documents from the Firestore `hymns` collection. Missing configuration, an empty collection, or a failed read never substitutes generated hymns.

Documents use `number`, `title`, `origin`, `doh` (musical key), optional `audioUrl` or `youtube`, plus:

- `stanzas`: blocks with `stanzaNumber` and `text`.
- `refrains`: optional blocks with `refrainNumber` and `text`.

Arrays and keyed collections are supported. Section number `0` is preserved. The reader sorts sections numerically, puts the stanza first on ties, and displays each stored refrain once. Presentation mode repeats the refrain matching the stanza number, falling back to the first refrain when there is no match. Hymns without refrains show only their stanzas.

After an admin saves, the database update must succeed before the app invalidates its hymn cache and refreshes the displayed data. The server verifies the user's Firebase session and current admin role before invalidation. Edited lyrics are also regenerated for search. If refreshing fails after the write succeeds, the editor offers **Retry refresh** without requiring another save.

## Authentication and permissions

Reading hymns does not require login. Google sign-in is used to identify accounts and determine whether hymn editing is allowed.

Admin access requires `users/{firebaseUid}.role` to equal `admin`. Missing user records and other roles grant no admin access. User records cannot be written from client apps under the supplied rules; provision roles through Firebase Console or a trusted backend.

`firestore.rules` mirrors the supplied shared-project rules:

- Anyone can read hymns; only admins can write them.
- Users can read their own profile; admins can read all profiles.
- All client writes to user records are denied.
- Favorites, preferences, and recent-history documents are private to their owner.

The website currently keeps its favorites and preferences locally. The private Firestore collections remain available to the mobile app; these rules do not imply that website cloud sync is implemented.

See [authentication setup](docs/authentication.md) for enabling Google sign-in, authorized domains, assigning admins, and reviewing/deploying rules. Repository changes do not automatically deploy Firestore rules.

The name displayed in Google's account chooser is configured separately in Google Auth Platform. See [Google sign-in branding](docs/google-branding.md) for the app name, verification, and custom authentication domain setup.

## Checks

```powershell
npm run lint
npm test
npx next typegen
npx tsc --noEmit
npm run build
```

Database rules tests require Java and the Firebase CLI:

```powershell
npm run test:rules
```

They use a local Firestore emulator on port `8187` and the demo project `demo-hymns-web`; they do not modify production data.

Browser tests require Google Chrome:

```powershell
npm run test:e2e
```

Playwright starts an isolated development server on port `3102`. To test an already-running server instead:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3000"
npm run test:e2e
```

Browser checks cover public hymn navigation, responsive branding, and the branded 404 recovery page. Live Google sign-in and an authenticated production edit still require checking with the appropriate Google accounts.

## Production

Configure the Firebase environment variables in your hosting provider, enable Google sign-in, and authorize the deployed hostname in Firebase Authentication.

```powershell
npm run build
npm start
```

The footer and mobile beta URLs are maintained in `lib/links.ts`. App assets are in `public/brand/`, and the Matura font is in `app/fonts/`.

## Contact and privacy

- [Developer profile](https://bunsenplus.vercel.app)
- [Email BunsenPlus](mailto:bunsenplus.org@gmail.com)
- Privacy policy: `/privacy`
