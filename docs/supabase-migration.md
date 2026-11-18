# Supabase migration setup

## Current authentication: native Supabase Google

The website now uses native Supabase Auth. Follow [authentication setup](authentication.md)
and run `supabase/migrations/202611180002_native_google_auth.sql` on the existing
database. It preserves all hymn and legacy profile rows, automatically creates
reader profiles on sign-up, and uses Supabase UUIDs for profile access and admin
checks. Firebase custom claims are not needed for this website. The older hybrid
configuration below is retained as migration history, not the current login setup.

Target project: `apzlragcnmdbjwfjhwhh`.

The website now reads and edits hymns in Supabase and checks admin roles in
`profiles`. Supabase is now the Google sign-in provider. The mobile app still
uses Firestore and needs a separate migration. Do not remove existing Firestore
data. On 2026-11-18, all 500 Firestore hymns were exported and imported into
Supabase. IDs, numbers, titles, stanza/refrain JSON, origins, and audio links
were compared against the backup; one title differs only in CRLF/LF line endings.
`HYMNS_CACHE_VERSION=2` is configured locally and in Vercel Production/Preview.
A new deployment is needed to apply that cache version to the live website.
Authenticated admin access requires a native Supabase profile with an explicitly
assigned admin role. Legacy Firebase account linking is a separate trusted step.

## Database

The current target already has both tables with the expected columns. Run
`supabase/migrations/202611170002_reconcile_access.sql` in SQL Editor to reconcile
its permissions. This script preserves rows and columns, replaces the policies
on these two tables, and can be rerun. Its final result should show RLS enabled
with four hymn policies and one profile policy. It does not import hymns or
switch the website's database connection.

## Exporting when no backup exists

Once Firestore reads are available, run from the repository root:

```powershell
node --env-file=.env scripts/export-hymns.mjs
```

If your settings are in `.env.local`, use `--env-file=.env.local` instead.
The script makes public read requests and never writes to Firestore or Supabase.
It stops on quota errors without automatically retrying. After validating the
records, it writes `.data/hymns-backup.json` and `.data/hymns-import.sql` (both
excluded from Git and deployments). Run the entire SQL file in Supabase SQL
Editor and verify the returned count. Set `HYMNS_CACHE_VERSION=2` (increment for
later bulk imports) in Vercel and locally, then redeploy/restart so persistent
read caches no longer use their initially empty results. Normal editor saves
invalidate caches automatically. Keep the JSON backup in a safe location.

For an empty database only, apply `supabase/migrations/202611170001_hymnbook.sql` once through the connected
Supabase integration or the project's SQL Editor. It creates:

- `hymns`, preserving Firestore document IDs and numbered stanza/refrain JSON.
- `profiles`, keyed by existing Firebase UIDs, with protected user/admin roles.
- Public hymn reads and admin-only hymn writes through row level security.
- Owner/admin profile reads, with no client profile or role writes.
- Server timestamps and verified editor attribution for app edits.

The schema targets Firebase project `hymns-app-ce0aa`. If using another Firebase
project, update both issuer and audience in `private.firebase_uid()` first.

## Legacy Firebase data export (optional)

### Remaining private user data

Hymns are imported, but the `users`, `userFavorites`, `userPreferences`, and
`userRecent` collections require a trusted Firebase management identity to
export. The anonymous API key cannot read them. The current Firebase CLI login
returned HTTP 401 during the protected export; reauthenticate first:

```powershell
firebase login --reauth
$env:FIREBASE_CLI_AUTH_MODULE = 'C:/Users/USER/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth.js'
node --env-file=.env scripts/export-user-data.mjs
```

The optional CLI auth module is local tooling only. Its credentials stay in
memory and are not printed or written to the backup. Alternatively supply a
short-lived Google OAuth `FIREBASE_ACCESS_TOKEN` locally with access to this
project. Do not paste it into chat or commit it.

Apply `supabase/migrations/202611180001_user_data.sql`, then the generated
`.data/users-import.sql` through SQL Editor. `users` maps to `profiles`, and the
other collections map to `user_favorites`, `user_preferences`, and `user_recent`.
The full original documents are preserved as JSON. Exact `admin` roles are
copied from the trusted source; existing Supabase rows are left unchanged.
These tables preserve migrated data; website favorites/preferences remain local
until cloud sync is implemented. The mobile app still needs a separate update.

No Firebase custom-claim changes are needed for native Supabase login. Configure
Google and assign native Supabase admin access using [authentication setup](authentication.md).
Legacy profile roles remain unlinked until their owners are verified and mapped
to Supabase accounts. An email match alone never transfers privileges.

## Connection and data

Obtain the Project URL and publishable key from the project's Connect dialog.
Keep any secret/service-role key server-only. Never put it in a `NEXT_PUBLIC_`
environment variable or commit it. A dashboard URL alone does not grant access.

Import a verified Firestore export or backup before switching reads. Preserve
IDs exactly, especially leading zeroes. Map `audioUrl` to `audio_url`,
`youtubeUrl` to `youtube_url`, `lyricsText` to `lyrics_text`, `updatedAt` to
`updated_at`, and `updatedBy` to `updated_by`; keep stanza and refrain numbers,
including zero. Existing Firestore quota exhaustion may prevent a fresh export.

Before switching production, verify anonymous reads, deny anonymous/user writes,
verify admin edits, deny role escalation, and check the web and mobile apps
against the same imported hymn collection. Supabase has its own usage limits;
retain shared server caching to reduce database traffic.
