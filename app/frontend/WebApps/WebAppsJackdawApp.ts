import { JackdawApp } from "../AppsBar/JackdawApp";
import type { WebAppListed } from "../../logic/WebApps/WebAppListed";
import AppsApp from "./WebAppsApp.svelte";
import LayoutGridIcon from "lucide-svelte/icons/layout-grid";
import { gt } from "../../l10n/l10n";

export class WebAppsJackdawApp extends JackdawApp {
  id = "webapps";
  name = gt`Apps`;
  barLabel = gt`Apps *=> Short app bar label, max 6 chars`;
  icon = LayoutGridIcon;
  appURL = "/webapp";
  //subApps = appGlobal.webApps.myApps.map(app => new WebAppSubJackdawApp(app));
}

export const webAppsApp = new WebAppsJackdawApp();

export class WebAppSubJackdawApp extends JackdawApp {
  constructor(webApp: WebAppListed) {
    super();
    this.id = webApp.id;
    this.appURL = "/webapp/app/" + this.id;
    this.name = webApp.nameTranslated;
    this.icon = wrapPNGinSVG(webApp.icon);
  }
}

function wrapPNGinSVG(imageURL: string): string {
  return `<svg><image href=${imageURL} height="100%" width="100%" /></svg>`;
}
