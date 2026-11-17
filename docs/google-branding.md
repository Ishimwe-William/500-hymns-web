# Google sign-in branding

The Google-hosted account chooser and consent screen are controlled by Google Auth Platform and Firebase. Website titles, fonts, Firebase `initializeApp` names, and OAuth custom parameters cannot rename that screen.

## Set the app identity

In the Google Cloud project used by this Firebase app, open **Google Auth Platform > Branding**:

- App name: **Indirimbo Zo Guhimbaza Imana**
- User support email: **bunsenplus.org@gmail.com** (select an address available to the project owner)
- Logo: use the supplied hymnbook logo (`public/brand/logo.png`)
- Application home page: the actual public production hymnbook URL
- Privacy policy: that production URL followed by `/privacy`
- Developer contact: an address monitored by BunsenPlus

Save the branding information, complete Google's brand verification where required, and publish the approved branding. Google states that displaying an app name and logo requires verification. Until then it can continue showing the application's domain.

These settings have not been changed by the repository updates. They require access to the project's Google Cloud Console.

## Replace the Firebase authentication domain

The `Continue to ...firebaseapp.com` label in the account chooser can come from the authentication redirect domain. To use a branded domain instead:

1. Choose an authentication domain you own and configure it with Firebase Hosting. Verify ownership and wait for its TLS certificate.
2. Add it to Firebase Authentication's authorized domains.
3. Add `https://YOUR_AUTH_DOMAIN/__/auth/handler` to the Google OAuth client's authorized redirect URIs.
4. Set `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` to that configured hostname and redeploy the website.
5. Test a complete Google sign-in and sign-out on the production website.

Do not replace `authDomain` with a display name, a localhost URL, or the developer profile URL. The hostname must actually serve Firebase's authentication handlers. Changing this domain requires reviewing the existing mobile sign-in configuration as well.

Official references:

- [Google OAuth app branding and verification](https://support.google.com/cloud/answer/15549049)
- [Firebase custom authentication redirect domains](https://firebase.google.com/docs/auth/web/google-signin#customizing-the-redirect-domain-for-google-sign-in)
