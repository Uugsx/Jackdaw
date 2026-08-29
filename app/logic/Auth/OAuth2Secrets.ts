import { OAuth2URLs, Provider } from "./OAuth2URLs";
import { localOAuth2Secrets as exampleSecrets } from "./OAuth2Secrets.local.example";
import { localOAuth2Secrets as userSecrets } from "./OAuth2Secrets.user";

export type OAuth2ProviderEntry = {
  provider?: Provider | null;
  domains?: string[];
  hostnames: string[];
  authURL: string;
  tokenURL: string;
  authDoneURL?: string | null;
  logoutURL?: string;
  scope: string;
  clientID: string;
  clientSecret?: string | null;
  doPKCE?: boolean;
  tokenURLPasswordAuth?: string;
};

/** Desktop / Electron OAuth redirect (see OAuth2.authDoneURL default). */
export const kJackdawOAuthRedirectURL = "http://localhost:5453/login-success";
/** System-browser OAuth callback — add this URI in Google Cloud Console. */
export const kJackdawOAuthBrowserRedirectURL = "http://127.0.0.1:5460/login-success";

function mergeSecret<T extends { clientID: string; clientSecret: string | null }>(base: T, override: T): T {
  return {
    ...base,
    clientID: override.clientID?.trim() || base.clientID,
    clientSecret: override.clientSecret ?? base.clientSecret,
  };
}

export const localOAuth2Secrets = {
  google: mergeSecret(exampleSecrets.google, userSecrets.google),
  yahoo: mergeSecret(exampleSecrets.yahoo, userSecrets.yahoo),
  aol: mergeSecret(exampleSecrets.aol, userSecrets.aol),
};

function providerSecrets(entry: OAuth2ProviderEntry): { clientID: string; clientSecret: string | null } | null {
  if (entry.provider == Provider.Google) {
    return localOAuth2Secrets.google;
  }
  if (entry.hostnames.includes("imap.mail.yahoo.com")) {
    return localOAuth2Secrets.yahoo;
  }
  if (entry.hostnames.includes("imap.aol.com")) {
    return localOAuth2Secrets.aol;
  }
  return null;
}

/** Replaces legacy hardcoded client IDs with Jackdaw-local secrets overlay. */
export function applyOAuth2Secrets(entry: OAuth2ProviderEntry): OAuth2ProviderEntry | null {
  let secrets = providerSecrets(entry);
  if (secrets) {
    if (!secrets.clientID?.trim()) {
      return null;
    }
    return {
      ...entry,
      clientID: secrets.clientID.trim(),
      clientSecret: secrets.clientSecret ?? null,
      authDoneURL: entry.authDoneURL ?? kJackdawOAuthRedirectURL,
    };
  }
  return entry;
}

/** Human-readable hint when OAuth is known but client ID is missing (e.g. empty Gmail secrets). */
export function getOAuth2SetupError(hostname: string | null | undefined): string | null {
  if (!hostname) {
    return null;
  }
  let entry = OAuth2URLs.find(o => o.hostnames.some(h => h == hostname));
  if (!entry || applyOAuth2Secrets(entry)) {
    return null;
  }
  if (entry.provider == Provider.Google) {
    return "Gmail OAuth не настроен: укажите Google Client ID в app/logic/Auth/OAuth2Secrets.user.ts и пересоберите Jackdaw.";
  }
  if (entry.hostnames.includes("imap.mail.yahoo.com")) {
    return "Yahoo OAuth не настроен: укажите client ID в OAuth2Secrets.user.ts.";
  }
  if (entry.hostnames.includes("imap.aol.com")) {
    return "AOL OAuth не настроен: укажите client ID в OAuth2Secrets.user.ts.";
  }
  return null;
}
