# Indirimbo Zo Guhimbaza Imana

A digital hymnbook for browsing, reading, and presenting 500 Kinyarwanda hymns used by the Seventh-day Adventist Church in Rwanda. Built by [BunsenPlus](https://bunsenplus.vercel.app).

## Features

- Public hymn browsing, search, and reading without signing in.
- Hymn titles and links are present in the initial server-rendered HTML. The homepage uses an HTTP redirect to `/hymns`; HTML-limited AI/search readers receive blocking metadata, and the sitemap exposes all 500 hymn pages. Public reading does not wait for login or browser JavaScript.
- Search by hymn number, title, original title, or lyrics in a popup, without changing the URL. Expand the popup to see all matches.
- List and grid views, with sorting by number or title.
- The reader prepares the next five complete hymn pages in the background and exposes them in an **Up next** row. Detail pages reuse the shared server-side library cache, and hymn links/search show a spinner if navigation is still pending.
- Favorites, recently opened hymns, theme, text size, and verse-number preferences stored locally on the device.
- Audio playback when a hymn has an audio source, with previous/next controls that skip hymns without recordings.
- Live presentation with a local presenter preview, synchronized audience window, keyboard navigation, and adjustable text size.
- Per-hymn search metadata, canonical URLs, structured data, branded sharing images, sitemap, and robots instructions.
- Native Supabase Google sign-in with automatic reader profiles and protected administrator roles.
- Admin hymn editing with a live preview, original section numbering, editor attribution, and immediate cache invalidation after saves.
- About, Profile, Settings, Admin, and Privacy pages with section sidebars and shareable hash links.
- Branded error pages and a guided mobile beta download page.
- Browser installation as a standalone desktop app, with branded icons and downloadable offline lyrics.

## Install on desktop

After deployment over HTTPS, open the hymnbook in Chrome or Edge. When the
browser offers installation, select the install icon in the address bar (or
the browser's Install app menu). The installed hymnbook opens in its own window
and can be pinned to the taskbar. The browser controls when the install icon is
shown; it may be hidden for an already installed app or in private browsing.

`app/manifest.ts` defines the app identity and standalone display. Production
registers `public/sw.js`, which caches install icons and a public offline reader.
After an explicit download in Settings, it also stores a complete lyrics pack.
Google login and account information are excluded; audio remains online.
Development mode does not register the worker to avoid interfering with hot reload.

To verify installation and offline behavior, build and start production on port
`3103`, then run in another terminal:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3103"
$env:PWA_PRODUCTION_TEST = "1"
npx playwright test tests/e2e/pwa.spec.cjs
```

The production checks use a normal browser profile because Chrome disables
installation in private/incognito contexts.

## Current offline behavior

In the production website or installed app, open **Settings → Offline access → Download hymns** to save the full lyrics library. Downloaded hymns support offline reading, search, favorites, and recent history, including hymns you have never opened online. Audio still requires internet. Browser storage and service workers must be supported; clearing site data removes the download. Favorites and preferences stay on the device and do not sync between devices.

The app checks saved lyrics against Supabase when it reconnects, on opening, and every five minutes while visible. A content revision detects edits; unchanged downloads receive a 304 response. Updates replace the complete pack only after successful validation and storage, so failed downloads preserve the existing copy. Settings also provides manual update and removal controls. Authentication and account pages are never cached. Development mode does not register the service worker; use a production build to test offline access.

On desktop, downloaded hymns also support offline presentation: select **Present** in the offline reader for a live preview, next slide, slide selection, keyboard controls, blanking, and a separate audience window. Move the audience window to the projector and enter fullscreen there, or use **Detect displays** where the browser supports it. Presentation controls stay within the browser viewport. Phones and tablets keep the reading interface. After deploying this update, open the app online once to update the cached presentation tools; existing lyrics downloads are retained.

Grid cards display subtle remote landscape photos while online, with a solid color fallback when offline or when a photo fails. Photos and audio are excluded from the lyrics download.

The mobile app supports offline access. To install the beta:

1. [Join the BunsenPlus testers group](https://groups.google.com/g/bunsenplus-testers).
2. [Open the Google Play testing page](https://play.google.com/apps/testing/com.bunsenplus.hymnsapp) using the same Google account.
3. Follow the testing page instructions to join the beta and install the app.

All website download links lead to `/download`, where these steps are explained.

## Presenting hymns

Open a hymn and select **Present**. The presenter keeps a current and next-slide preview while a separate audience window displays the lyrics without visible controls. Allow popups and display access when requested. Supported browsers can place the audience window on an external screen and request fullscreen there. If automatic fullscreen is blocked, click anywhere in the audience window or press **F** or **Enter** there. This works online and offline. True fullscreen hides Chrome's title and address bars; maximizing the window does not. Browser permissions can require that audience-window interaction.

Use the arrow keys to navigate, **B** to blank the audience screen, and **Escape** to end the presentation. Refrains repeat after stanzas during presentation. Ending the presentation closes the audience window.

## Search and sharing

Public hymn pages expose their actual title, original title, lyrics description, and a generated sharing image. `/sitemap.xml` lists the real hymns; `/robots.txt` excludes private account and administration routes. Set optional `GOOGLE_SITE_VERIFICATION` to the Search Console verification token. Metadata becomes public after deployment; search indexing and messaging preview caches are controlled by those services.

Hymn detail navigation reads and caches the selected Supabase row. Public Data API reads use a shared persistent fetch cache with a daily refresh; server rendering also caches results. The shared library index supplies search and neighboring-hymn links, which prefetch their destination. Admin saves invalidate both caches. Database failures throw rather than replacing cached hymns with an empty collection.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Auth and PostgreSQL. Firebase is retained for legacy data export and mobile-backend checks. The brand title uses the bundled Matura font through `next/font/local`; interface text uses Roboto.

This repository uses Next.js conventions documented in `node_modules/next/dist/docs/`. Read `AGENTS.md` before making changes.

## Local setup

You need Node.js, npm, and a configured Supabase project. Firebase project access is needed only for optional legacy data exports.

```powershell
npm ci
Copy-Item .env.example .env.local
```

For optional legacy Firestore exports, keep the Firebase configuration in `.env.local`:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Get these values from Firebase Console > Project settings > Your apps. These are public web configuration values. Never put service-account credentials or a Google client secret in `NEXT_PUBLIC_*` variables.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) from the Supabase project. Enable its native Google provider and configure `/auth/callback` for local and deployed hosts. Firebase settings are needed only for legacy exports, not website login. Never expose a service-role key. See [authentication setup](docs/authentication.md) and [data import](docs/supabase-migration.md).

```powershell
npm run dev
```

Open `http://localhost:3000`. Restart the development server after changing environment variables.

## Hymn data and ordering

The website reads actual rows from Supabase's `hymns` table. An empty table stays empty, while configuration and backend failures raise a retryable error; generated hymns are never substituted. The mobile app still uses Firestore until separately migrated.

Rows use `id`, `number`, `title`, `origin`, `doh` (musical key), optional `audio_url` or `youtube`, plus:

- `stanzas`: blocks with `stanzaNumber` and `text`.
- `refrains`: optional blocks with `refrainNumber` and `text`.

Arrays and keyed collections are supported. Section number `0` is preserved. The reader sorts sections numerically, puts the stanza first on ties, and displays each stored refrain once. Presentation mode repeats the refrain matching the stanza number, falling back to the first refrain when there is no match. Hymns without refrains show only their stanzas.

After an admin saves, the database update must succeed before the app invalidates its hymn cache and refreshes the displayed data. The server verifies the user's Firebase session and current admin role before invalidation. Edited lyrics are also regenerated for search. If refreshing fails after the write succeeds, the editor offers **Retry refresh** without requiring another save.

## Authentication and permissions

Reading hymns does not require login. Google sign-in is used to identify accounts and determine whether hymn editing is allowed.

Admin access requires `profiles.role` to equal `admin` for the verified Supabase `auth_user_id`. New Google sign-ins automatically create reader profiles. Missing records and other roles grant no admin access. Client profile/role writes are denied; assign admin roles explicitly through SQL Editor. Legacy Firebase IDs are retained separately and are not automatically matched by email.

Supabase row level security enforces:

- Anyone can read hymns; only admins can write them.
- Users can read their own profile; admins can read all profiles.
- All client writes to profile records are denied.

The website keeps favorites and preferences locally. `firestore.rules` remains for the mobile app's existing database and owner-only private collections; website cloud sync is not implemented.

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

Configure Supabase public environment variables, enable its Google provider, allow your deployed `/auth/callback` URL, and apply the native Google SQL migration before deploying. Firebase settings are needed only for optional legacy export commands. The 500 real hymns have been imported; keep their backup.

For Vercel CLI deployments, `.vercelignore` excludes local builds, browser-test caches, reports, and environment files. Set production environment variables in Vercel project settings. Inspect the upload first with `vercel deploy --dry`; deploy with `vercel --prod`.

```powershell
npm run build
npm start
```

The footer and mobile beta URLs are maintained in `lib/links.ts`. App assets are in `public/brand/`, and the Matura font is in `app/fonts/`.

## Contact and privacy

- [Developer profile](https://bunsenplus.vercel.app)
- [Email BunsenPlus](mailto:bunsenplus.org@gmail.com)
- Privacy policy: `/privacy`
