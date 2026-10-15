# Developer credentials workflow

Developer portal rotation now prompts for the signed-in ANKT password, requests
an app-bound RotateSecret proof and sends X-Developer-Reauth. Password is cleared
on success/failure/cancel; controls lock while pending. Initial secret disclosure
uses ClientSecretPost configuration rather than authentication mode, so backend
clients see credentials once and public PKCE clients do not use a secret.

Domain creation and draft updates already used session auth; BE now accepts them
without domain password reauth, while retaining ownership and publication checks.
Developer registration has no separate password. Passwordless ANKT accounts can
set a password through the existing verified password recovery flow for rotation.

Validation: 28 relevant tests passed, TypeScript/Vite build and targeted ESLint
passed. No authenticated live rotation, commit or deployment.
