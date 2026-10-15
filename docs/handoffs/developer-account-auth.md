# Developer account authentication

Portal welcome/login/signup/recovery pages use existing ANKT Accounts APIs. Signup
registers Accounts and enters existing Developer Profile onboarding; it never
creates an independent identity or silently links client-supplied emails.

Google uses Firebase Web SDK in-memory sessions and `/api/accounts/developer-google-login`.
This additive route requires old ANKT login if a verified Google email already
exists without a persisted provider link; legacy ANKT Google login stays compatible.
Configure the same Firebase project as ANKT: `VITE_FIREBASE_WEB_API_KEY`,
`VITE_FIREBASE_WEB_APP_ID`, `VITE_FIREBASE_WEB_AUTH_DOMAIN`,
`VITE_FIREBASE_WEB_PROJECT_ID`. Add the actual portal host to Firebase authorized
domains and enable Google provider; no fabricated configuration is included.

Sensitive operations use existing password proof or signed Google proof. Google
reauth must match persisted ExternalLogin subject, recent auth_time (five minutes),
verified email and nonrevoked token. A unique hash of provider/subject/auth_time
prevents reuse; opaque proof remains account/operation/app/organization bound and
single use. No raw provider tokens/passwords are persisted by these additions.

Google email recovery reuses existing reset-password API. SMS recovery remains in
ANKT app. Existing portal bearer session storage is preserved for compatibility;
Firebase itself has no persistent client session here.

Generic email partners use Firebase email links (enable Email/Password + Email
link sign-in in the existing Firebase project). `/developer/forgot-password`
sends/consumes links then resets through existing ANKT API;
`/developer/verify-email` confirms server-signed email through authenticated
`/api/developer/account/verify-email`. Recent token, exact account email and
revocation checks are mandatory. Account.EmailVerifiedAt is nullable with no
fabricated backfill; old password accounts verify email once before sensitive
proofs. Google login/reauth and signed matching-email recovery mark verification;
changing account email clears it. Developer contact email is not identity proof.

Dependency audit: Firebase's unused Firestore dependency pins old gRPC. A
`@grpc/grpc-js` override to `^1.13.6` fixes certificate-validation advisories while
keeping the Firebase Web SDK version compatible with ANKT; npm audit is clean.

Official references: https://firebase.google.com/docs/auth/admin/verify-id-tokens
and https://firebase.google.com/docs/auth/web/google-signin.
