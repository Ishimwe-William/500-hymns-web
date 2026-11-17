# Google sign-in and admin access

The website uses Firebase Authentication and the same role records as the mobile app: `users/{firebaseUid}.role`. Only the exact string `admin` grants hymn editing. Missing profiles and other roles are readers. A cached role is not enough to unlock Admin; the app waits for a server-confirmed snapshot. Role changes are observed while signed in.

## Firebase configuration

Use the Firebase project already used by the mobile app. Set the `NEXT_PUBLIC_FIREBASE_*` values shown in `.env.example` in your local environment and hosting settings. No service-account key or Google client secret belongs in the browser.

In Firebase Console:

1. Under Authentication > Sign-in method, enable Google and choose the support email.
2. Under Authentication > Settings > Authorized domains, add the production hostname and `localhost` for development. Add only domains you control.
3. Sign in on the website and copy the Account ID from Profile. This is the authenticated Firebase UID, not the email address or a local flag.
4. With a trusted Firebase Console account, create or update `users/{thatUid}` with `role: "admin"`. Existing mobile admins already have this record and need no second role assignment. Never automatically make the first visitor an admin.

## Database enforcement

`firestore.rules` contains tested rules for public hymn reads, admin-only hymn writes, and private user profiles. Users can read their own role and admins can read all user records. All client writes to user records are denied, including writes by admins. Assign and manage roles through Firebase Console or another trusted backend. The rules also preserve owner-only access to userFavorites, userPreferences, and userRecent.

The rules are prepared locally; changing application code does **not** deploy them. Review and merge these rules with your project's existing rules before deployment, especially rules for mobile favorites, preferences, and other collections. The supplied rules deny unspecified collections. Do not keep an overlapping rule that broadly allows writes: matching allow rules are additive.

After reviewing the complete shared-project rules, deploy with:

```sh
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Admin pages are also guarded in the UI, but Firestore rules are the authoritative protection against direct SDK or REST writes. The web editor records `updatedBy` (authenticated UID, email, display name) and `updatedAt` (server timestamp). This is last-edit attribution, not an immutable history. The mobile editor must supply equivalent fields if it needs the same attribution.

## Verification

```sh
node --test tests/auth-session.test.cjs tests/hymn-sections.test.cjs
firebase emulators:exec --only firestore --project demo-hymns-web "node --test tests/firestore.rules.test.cjs"
npx next typegen
npx tsc --noEmit
npm run lint
```

The emulator uses a demo project and does not access production data. For the live Google flow, verify a reader and an existing admin in the browser, then revoke the admin's role and confirm editing disappears. Check cancelled or blocked pop-ups and sign-out as well. Local-only favorites and reading preferences are not cloud-synced by this change.

References: [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Firestore role checks](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Sign-in branding

See [Google sign-in branding](google-branding.md) to display the real app name and configure a branded authentication domain.

## Refreshing saved hymns

After Firestore confirms an edit, the client sends its Firebase ID token to a Server Action. The server verifies the session with Firebase Authentication and reads the current admin role using the same token under Firestore rules. Only then does it immediately expire the shared hymn cache using `updateTag`, invalidate the shared layout, and refresh the reader, search, and admin lists. No service-account credentials are needed. If refreshing fails after a successful database write, the editor offers a separate refresh retry and does not claim that the write failed.
