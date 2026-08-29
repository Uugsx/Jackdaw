import { OAuth2UI } from "./OAuth2UI";
import { appGlobal } from "../../app";
import { k1MinuteMS } from "../../../frontend/Util/date";
import { UserCancelled, UserError, assert, type URLString } from "../../util/util";
import { gt } from "../../../l10n/l10n";
import { kJackdawOAuthBrowserRedirectURL } from "../OAuth2Secrets";

const kOAuthSuccessHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Jackdaw</title></head>
<body style="font-family:sans-serif;text-align:center;padding:48px">
<h2>Jackdaw</h2><p>Login successful. You can close this tab and return to the app.</p>
</body></html>`;

/**
 * Starts a local web server on http://localhost, returns the login start URL,
 * opens it in a browser, and waits for the redirect to /login-success?code=...
 */
export class OAuth2Localhost extends OAuth2UI {
  /** Will be called when a login URL is ready. Load this URL into the browser. */
  loginURLCallback: (url: URLString) => Promise<void>;
  protected onAbort: () => void;

  /** Fixed loopback port for providers that require a registered redirect URI. */
  protected callbackPort(): number {
    let match = kJackdawOAuthBrowserRedirectURL.match(/:(\d+)\//);
    return match ? Number(match[1]) : 5460;
  }

  async login(): Promise<string> {
    assert(this.loginURLCallback, "Need URL callback");
    let port = this.callbackPort();
    let server = await appGlobal.remoteApp.newHTTPServer();
    await server.start(port);
    let doneURL = `http://127.0.0.1:${port}/login-success`;

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (!settled) {
          settled = true;
          fn();
        }
      };

      const minutes = 15;
      let killTimeout = setTimeout(() => {
        finish(() => {
          server.close();
          reject(new UserError(gt`Authentication page timed out after ${minutes} minutes`));
        });
      }, minutes * k1MinuteMS);

      this.onAbort = () => {
        finish(() => {
          server.close();
          reject(new UserCancelled(gt`Login aborted by user`));
        });
      };

      // Register the handler BEFORE opening the browser — otherwise a fast
      // Google redirect can hit the server before the route exists.
      server.get("/login-success", (urlPath: URLString) => {
        let url = "http://dummy" + urlPath;
        let params = Object.fromEntries(new URL(url).searchParams);
        if (!params.code && !params.error) {
          return kOAuthSuccessHTML;
        }
        try {
          clearTimeout(killTimeout);
          server.close();
          finish(() => resolve(this.oAuth2.getAuthCodeFromDoneURL(url)));
        } catch (ex) {
          finish(() => reject(ex));
        }
        return kOAuthSuccessHTML;
      });

      this.oAuth2.getAuthURL(doneURL).then(async url => {
        await this.loginURLCallback(url);
      }).catch(ex => {
        clearTimeout(killTimeout);
        server.close();
        finish(() => reject(ex));
      });
    });
  }

  abort() {
    this.onAbort?.();
  }
}
