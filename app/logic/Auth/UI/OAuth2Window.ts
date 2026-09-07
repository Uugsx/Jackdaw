import { OAuth2UI } from "./OAuth2UI";
import { UserCancelled, type URLString, assert } from "../../util/util";
import { gt } from "../../../l10n/l10n";

/**
 * Opens a new window for OAuth2 login,
 * monitors the URL changes, and returns the `authCode`.
 */
export class OAuth2Window extends OAuth2UI {
  protected onAbort: () => void;

  /**
   * Does an interactive login
   * @returns authCode
   * @throws OAuth2Error
   */
  async login(): Promise<string> {
    this.abort();
    let requestID = crypto.randomUUID();
    return await new Promise((resolve, reject) => {
      let ipcRenderer = (window as any).electron.ipcRenderer;
      let settled = false;
      let finish = (complete: () => void, closePopup = true) => {
        if (settled) {
          return;
        }
        settled = true;
        ipcRenderer.removeListener('oauth2-navigate', onNavigation);
        ipcRenderer.removeListener('oauth2-close', onClose);
        this.onAbort = undefined;
        complete();
        if (closePopup) {
          ipcRenderer.send('oauth2-close', requestID);
        }
      };
      let onNavigation = async (_event: unknown, id: string, url: URLString) => {
        if (id !== requestID || settled) {
          return;
        }
        try {
          if (await this.oAuth2.isAuthDoneURL(url) && !settled) {
            let code = this.oAuth2.getAuthCodeFromDoneURL(url);
            finish(() => resolve(code));
          }
        } catch (ex) {
          finish(() => reject(ex));
        }
      };
      let onClose = (_event: unknown, id: string) => {
        if (id === requestID) {
          finish(() => reject(new UserCancelled(gt`Login window was closed by user`)), false);
        }
      };
      this.onAbort = () => {
        finish(() => reject(new UserCancelled(gt`Login aborted by user`)));
      };
      ipcRenderer.on('oauth2-navigate', onNavigation);
      ipcRenderer.on('oauth2-close', onClose);
      Promise.resolve()
        .then(() => this.oAuth2.getAuthURL())
        .then(url => {
          if (!settled) {
            let popup = window.open(url, requestID, "center,oauth2popup");
            assert(popup, "Failed to open OAuth2 window");
          }
        })
        .catch(ex => finish(() => reject(ex)));
    });
  }

  abort() {
    this.onAbort?.();
  }
}
