/**
 * Copy OAuth2Secrets.user.ts or fill OAuth2Secrets.user.ts directly.
 *
 * Google (Gmail):
 * 1. Google Cloud Console → new project "Jackdaw"
 * 2. OAuth consent screen: app name Jackdaw + your logo
 * 3. Credentials → OAuth client ID → Desktop app (or iOS/macOS for Electron loopback)
 * 4. Authorized redirect URIs (all three):
 *      http://localhost:5453/login-success
 *      http://localhost:5455/login-success
 *      http://127.0.0.1:5460/login-success   ← browser login (Gmail)
 * 5. Testing mode: add your Gmail as a test user until Google verification completes
 * 6. Copy Client secret (GOCSPX-…) into OAuth2Secrets.user.ts → google.clientSecret
 *    Google requires it at token exchange even for Desktop app + PKCE.
 *
 * Yahoo / AOL: register new OAuth apps with the same redirect URIs as above.
 */
export const localOAuth2Secrets = {
  google: {
    clientID: "",
    clientSecret: null as string | null,
  },
  yahoo: {
    clientID: "",
    clientSecret: null as string | null,
  },
  aol: {
    clientID: "",
    clientSecret: null as string | null,
  },
};
