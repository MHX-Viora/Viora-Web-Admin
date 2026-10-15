import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getIdToken, GoogleAuthProvider, inMemoryPersistence, isSignInWithEmailLink, sendSignInLinkToEmail, setPersistence, signInWithEmailLink, signInWithPopup, signOut } from 'firebase/auth';

function providerAuth() {
  const value = (name: string) => {
    const configured = import.meta.env[name]?.trim();
    if (!configured) throw new Error(`Chưa cấu hình ${name} cho Google trên Developer Portal.`);
    return configured;
  };
  const app = getApps().length ? getApp() : initializeApp({
    apiKey: value('VITE_FIREBASE_WEB_API_KEY'), appId: value('VITE_FIREBASE_WEB_APP_ID'),
    authDomain: value('VITE_FIREBASE_WEB_AUTH_DOMAIN'), projectId: value('VITE_FIREBASE_WEB_PROJECT_ID'),
  });
  return getAuth(app);
}

export async function developerGoogleToken() {
  const auth = providerAuth();
  await setPersistence(auth, inMemoryPersistence);
  // End the previous provider session so auth_time represents this confirmation.
  await signOut(auth);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  try { return await getIdToken(result.user, true); }
  finally { await signOut(auth); }
}

export async function developerSendEmailLink(email: string, purpose: 'verify-email' | 'forgot-password') {
  const auth = providerAuth();
  await setPersistence(auth, inMemoryPersistence);
  await sendSignInLinkToEmail(auth, email.trim(), { handleCodeInApp: true, url: new URL(`/developer/${purpose}`, window.location.origin).href });
  sessionStorage.setItem('ankt_developer_pending_email', email.trim());
}
export async function developerEmailLinkToken(email: string) {
  const auth = providerAuth();
  if (!isSignInWithEmailLink(auth, window.location.href)) throw new Error('Mở liên kết xác nhận trong email trước khi tiếp tục.');
  await setPersistence(auth, inMemoryPersistence);
  await signOut(auth);
  const result = await signInWithEmailLink(auth, email.trim(), window.location.href);
  try { return await getIdToken(result.user, true); }
  finally { await signOut(auth); sessionStorage.removeItem('ankt_developer_pending_email'); }
}
