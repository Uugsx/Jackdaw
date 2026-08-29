import { MeetAccount } from "../MeetAccount";
import { M3Conf } from "./M3Conf";
import { OAuth2 } from "../../Auth/OAuth2";
import { UserError, assert, type URLString } from "../../util/util";
import { OAuth2URLs } from "../../Auth/OAuth2URLs";
import { applyOAuth2Secrets } from "../../Auth/OAuth2Secrets";
import { gt } from "../../../l10n/l10n";

export class M3Account extends MeetAccount {
  readonly protocol: string = "m3";
  /* Authentication */
  oauth2: OAuth2;
  /** M3 controller server — must be configured; no Jackdaw cloud default. */
  controllerBaseURL: string = "";
  controllerWebSocketURL: string = "";
  /** Where guests would go to join the meeting without the app */
  webFrontendBaseURL: string = "";

  canVideo = true;
  canAudio = true;
  canScreenShare = true;
  canMultipleParticipants = true;
  canCreateURL = true;

  /**
   * Login using OAuth2
   * If already logged in, does nothing.
   * @param relogin if true: Force a new login in any case.
   * @throws OAuth2Error
   */
  async login(interactive: boolean, relogin = false): Promise<void> {
    await super.login(interactive);
    if (this.oauth2?.accessToken && !relogin) {
      return;
    }
    if (!this.username) {
      throw new UserError(gt`Please configure a matching meeting account first`);
    }
    if (!this.controllerBaseURL) {
      throw new UserError(gt`Please configure the meeting server address first`);
    }
    this.oauth2?.stop();
    let controllerHostname = new URL(this.controllerBaseURL).hostname;
    let entry = OAuth2URLs.find(urls => urls.hostnames.includes(controllerHostname));
    let urls = entry ? applyOAuth2Secrets(entry) : null;
    assert(urls, "Need OAuth2 config for video conference");
    this.oauth2 = new OAuth2(this, urls.tokenURL, urls.authURL, urls.authDoneURL, urls.scope, urls.clientID, urls.clientSecret, urls.doPKCE);
    this.oauth2.setTokenURLPasswordAuth(urls.tokenURLPasswordAuth);
    this.oauth2.subscribe(() => this.notifyObservers());
    await this.oauth2.login(true);
  }

  get isLoggedIn(): boolean {
    return this.oauth2?.isLoggedIn ?? false;
  }

  newMeeting(): M3Conf {
    return new M3Conf(this);
  }

  isMeetingURL(url: URL): boolean {
    if (!this.webFrontendBaseURL || url.origin != this.webFrontendBaseURL) {
      return false;
    }
    return url.pathname.startsWith("/room/") || url.pathname.startsWith("/invite/");
  }
}
