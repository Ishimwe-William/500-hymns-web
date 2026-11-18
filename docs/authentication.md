# Google sign-in with Supabase

The website uses native Supabase Auth for Google login. Firebase login and token
custom claims are no longer needed by the website. The mobile app still uses
its existing Firebase backend until separately migrated.

## Setup

1. Set `NEXT_PUBLIC_SUPABASE_URL` and the public anonymous/publishable key from
   `.env.example`, locally and in Vercel. Never expose a service-role key.
2. Enable Google under Supabase Authentication > Sign In / Providers. Put the
   web OAuth client ID first and save its client secret in Supabase only.
3. Add the Supabase callback to the Google web OAuth client's authorized redirect
   URIs: `https://apzlragcnmdbjwfjhwhh.supabase.co/auth/v1/callback`.
4. In Supabase Authentication > URL Configuration, set Site URL to
   `https://500-hymns.vercel.app` and allow these redirect URLs:
   - `https://500-hymns.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
   - Any explicitly approved development/preview host's `/auth/callback`.
5. For the existing database, run
   `supabase/migrations/202611180002_native_google_auth.sql` in SQL Editor.
   It preserves legacy records and configures automatic reader profiles for
   both new and existing Supabase Auth users.
6. Deploy the updated website. Sign in again using its Google button.

The browser uses PKCE, with a callback that exchanges the authorization code in
the same browser. Sessions persist and refresh through the Supabase SDK. The
callback has no search indexing and does not accept an arbitrary return URL.

## Administrator access

New accounts are readers. Name, email, and Google user metadata cannot grant
admin permission. After identifying the intended user in Supabase Authentication
or the website Profile page, run this template with their exact Supabase UUID:

```sql
update public.profiles
set role = 'admin'
where auth_user_id = 'REPLACE_WITH_SUPABASE_USER_UUID';
```

Never execute the placeholder unchanged or promote every account. Do not use
the old Firebase UID as the new Supabase account UUID.

The website rechecks the protected profile role on session changes, periodically
while signed in, and on focus. RLS checks every database write independently.
Server cache invalidation remotely verifies the Supabase access token through
the Auth API and rechecks the database role; it does not trust client role flags.
Profile writes are denied to client apps. A trusted database trigger creates
reader profiles. Hymn edits record the verified Supabase UUID and server time.

## Existing Firebase users

`profiles.firebase_uid` preserves the legacy Firebase identifier, while
`profiles.auth_user_id` identifies a native Supabase account. No automatic email
matching or privilege transfer occurs. Migrating private records and linking
legacy accounts requires trusted source access and explicit identity verification.
The website's favorites/preferences still remain local until cloud sync is
implemented. Keep the original mobile backend intact.

## Validation

`npm test` includes embedded PostgreSQL tests for the migration, anonymous reads,
owner profile visibility, blocked role escalation, reader write rejection,
admin editing, issuer checks, and editor attribution. Run lint, TypeScript, build,
and browser checks as well. A real Google account is still required to verify the
complete provider consent flow and the live database migration.

References: [Google provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google),
[PKCE callback](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession).
