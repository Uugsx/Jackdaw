import { appGlobal } from "../../../app";

export class OWALoginBackground {
  static async submitLoginForm(username: string, password: string, partition: string, elements: OWALoginFormElements) {
    elements.username.value = username;
    elements.password.value = password;
    if ("flags" in elements.form.elements) {
      (elements.form.elements.flags as any).value |= 1;
    }
    if ("trusted" in elements.form.elements) {
      (elements.form.elements.trusted as any).checked = true;
    }
    let url = new URL(elements.form.getAttribute("action"), elements.url).toString();
    let data = Object.fromEntries(new FormData(elements.form));
    return await appGlobal.remoteApp.OWA.fetchText(partition, url, data);
  }

  /** On-premise OWA login form. Dead sessions return HTTP 440 on `/owa/`
   * instead of this page, so password login must request it directly. */
  static logonURL(owaURL: string): string {
    let url = new URL(owaURL);
    url.pathname = url.pathname.replace(/\/owa\/?.*$/i, "/owa/auth/logon.aspx");
    if (!/\/owa\/auth\/logon\.aspx$/i.test(url.pathname)) {
      url.pathname = "/owa/auth/logon.aspx";
    }
    url.search = "";
    url.hash = "";
    url.searchParams.set("url", owaURL);
    url.searchParams.set("reason", "0");
    return url.toString();
  }

  static async findLoginElements(url: string, partition: string): Promise<OWALoginFormElements | null> {
    let parseLoginForm = (responseURL: string, text: string): OWALoginFormElements | null => {
      let dom = new DOMParser().parseFromString(text, "text/html");
      let elements: OWALoginFormElements | null = null;
      for (let form of dom.forms) {
        if (!form.getAttribute("action")) {
          continue;
        }
        let username: HTMLInputElement | null = null;
        let password: HTMLInputElement | null = null;
        for (let e of form.elements) {
          let element = e as HTMLInputElement;
          if (element.type == "hidden" || element.type == "checkbox" ||
              element.type == "submit" || element.type == "button" ||
              element.style.display == "none" ||
              element.name == "passwordText") {
            continue;
          }
          if (element.name == "username" || element.id == "username" ||
              element.type == "text" || element.type == "email") {
            if (element.name == "username" || element.id == "username" || !username) {
              username = element;
            }
          }
          if (element.type == "password") {
            if (password) {
              password = null;
              break;
            }
            password = element;
          }
        }
        if (username && password) {
          if (elements) {
            return null;
          }
          elements = { url: responseURL, form, username, password };
        }
      }
      return elements;
    };

    let pages: string[] = [];
    let addPage = (page: string | null | undefined) => {
      if (page && !pages.includes(page)) {
        pages.push(page);
      }
    };
    addPage(url);
    try {
      addPage(this.logonURL(url));
    } catch {
    }

    let seen = new Set<string>();
    for (let i = 0; i < pages.length; i++) {
      let page = pages[i];
      if (seen.has(page)) {
        continue;
      }
      seen.add(page);
      let response = await appGlobal.remoteApp.OWA.fetchText(partition, page);
      let responseURL = await response.url;
      let text = await response.text;
      let status = await response.status;
      let elements = parseLoginForm(responseURL, text);
      if (elements) {
        return elements;
      }

      // Some Exchange versions first return a JavaScript shell that redirects
      // the browser to the actual form. Background requests do not execute that
      // script, so follow the same redirect explicitly.
      let loginPath = text.match(/var\s+a_sLgn\s*=\s*["']([^"']+)["']/i)?.[1];
      let loginSuffix = text.match(/var\s+a_sUrl\s*=\s*["']([^"']*)["']/i)?.[1];
      if (loginPath) {
        addPage(new URL(loginPath + (loginSuffix ?? ""), responseURL).toString());
      }

      // HTTP 440 Login Timeout is not a redirect. The tiny HTML body only
      // reloads itself, so continue with /owa/auth/logon.aspx.
      if (status == 440 || /440 Login Timeout/i.test(text)) {
        continue;
      }

      let moved = text.match(/href="(https?:[^"]*logon\.aspx[^"]*)"/i)?.[1]
        ?? text.match(/href="(\/owa\/auth\/logon\.aspx[^"]*)"/i)?.[1];
      if (moved) {
        addPage(new URL(moved.replace(/&amp;/g, "&"), responseURL).toString());
      }
    }
    return null;
  }
}

export type OWALoginFormElements = {
  url: string,
  form: HTMLFormElement,
  username: HTMLInputElement,
  password: HTMLInputElement,
}
