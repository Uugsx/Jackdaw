import { OWANotifications } from "./OWANotifications";
import { appGlobal } from "../../../app";

export class OWAExchangeNotifications extends OWANotifications {
  async start(onChannelReady?: () => Promise<void>): Promise<void> {
    // On-premise Exchange creates the notification channel ID during
    // FinishNotificationRequest. SubscribeToNotification and
    // PendingNotificationRequest must use this same ID; a locally generated
    // UUID creates a live stream that is not connected to the subscriptions.
    let finishURL = this.account.url + "ev.owa2?ns=PendingRequest&ev=FinishNotificationRequest&UA=0";
    let response = await appGlobal.remoteApp.OWA.fetchJSON(this.account.partition, finishURL, { method: "POST" });
    if (!response.ok || typeof response.json?.cid != "string" || !response.json.cid) {
      throw new Error(`OWA notification channel initialization failed with HTTP ${response.status} ${response.statusText}`);
    }
    let cid = response.json.cid;
    this.account.notificationChannelID = cid;

    // Register subscriptions after the server has created the connection and
    // before opening its long-poll request.
    await onChannelReady?.();

    // Stream loop
    while (this.keepRunning) {
      // These parameters are emitted by the browser OWA client. `brwnm` and
      // the short cache-busting nonce are significant on some on-premise
      // Exchange builds; without them the request may stay alive but only
      // receive keep-alive frames.
      let nonce = Math.random().toString(36).slice(2, 4);
      let url = this.account.url + "ev.owa2?ns=PendingRequest&ev=PendingNotificationRequest&UA=0&cid=" + cid + "&brwnm=chrome&X-OWA-CANARY=&n=" + nonce;
      if (appGlobal.remoteApp?.OWA?.listenNotificationStream) {
        await appGlobal.remoteApp.OWA.listenNotificationStream(
          this.account.partition,
          url,
          async (messages: any[]) => {
            await this.account.onNotificationMessages(messages);
          }
        );
      } else {
        let stream = await appGlobal.remoteApp.OWA.fetchJSON(this.account.partition, url);
        if (!stream.ok) {
          throw new Error(`stream fetch failed with HTTP ${stream.status} ${stream.statusText}`);
        }
        if (!stream.body) {
          throw new Error("OWA notification stream did not return a response body");
        }
        let data = "";
        for await (let chunk of stream.body) {
          // Avoid racing with ourselves, if we caused the notification.
          await new Promise(resolve => setTimeout(resolve, 50));
          // A notification can be split across chunks,
          // so keep the incomplete tail for the next chunk.
          data += chunk;
          let matches = data.match(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi);
          if (matches) {
            let lastMatch = matches[matches.length - 1];
            let lastMatchEnd = data.lastIndexOf(lastMatch) + lastMatch.length;
            data = data.slice(lastMatchEnd);
            let messages: any[] = [];
            for (let match of matches) {
              let script = match.replace(/^<script(?:\s[^>]*)?>/i, "").replace(/<\/script>$/i, "").trim();
              let parsed = extractJsonFromScript(script);
              if (parsed === "reinitSubscription" || script.includes("reinitSubscription")) {
                messages.push({ id: "reinitSubscription" });
              } else if (parsed != null && parsed !== "alive" && !script.includes("alive")) {
                messages.push(parsed);
              }
            }
            if (messages.length > 0) {
              await this.account.onNotificationMessages(messages);
            }
          }
        }
      }
    }
  }
}

function extractJsonFromScript(script: string): any | null {
  let trimmed = script.trim();
  if (!trimmed) {
    return null;
  }

  let unescapeJsString = (quote: string, rawContent: string): string | null => {
    if (quote === '"') {
      try {
        let unquoted = JSON.parse('"' + rawContent + '"');
        return typeof unquoted === "string" ? unquoted : JSON.stringify(unquoted);
      } catch {
        return rawContent.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
    } else {
      return rawContent.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
    }
  };

  let parseResult = (val: string): any | null => {
    let t = val.trim();
    if (!t) return null;
    if (t === "alive" || t === "reinitSubscription") {
      return t;
    }
    try {
      return JSON.parse(t);
    } catch {
      let firstBrace = t.indexOf("{");
      let lastBrace = t.lastIndexOf("}");
      let firstBracket = t.indexOf("[");
      let lastBracket = t.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        try { return JSON.parse(t.slice(firstBracket, lastBracket + 1)); } catch {}
      }
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try { return JSON.parse(t.slice(firstBrace, lastBrace + 1)); } catch {}
      }
      return null;
    }
  };

  // 1. Check for OWA parent.pR / x(...) / pR(...) / s(...) invocation with string literal argument
  let owaCalls = [
    /(?:(?:var\s+x\s*=\s*[a-zA-Z0-9_$.]+\s*;\s*)?if\s*\(\s*x\s*\)\s*)?x\s*\(\s*(['"])((?:\\.|(?!\1)[\s\S])*)\1\s*\)/i,
    /(?:\.pR|parent\.pR|w\.pR|pR)\s*\(\s*(['"])((?:\\.|(?!\1)[\s\S])*)\1\s*\)/i,
    /(?:\.s|parent\.s|w\.s|s)\s*\(\s*(['"])((?:\\.|(?!\1)[\s\S])*)\1\s*\)/i,
  ];

  for (let regex of owaCalls) {
    let match = trimmed.match(regex);
    if (match) {
      let unquoted = unescapeJsString(match[1], match[2]);
      if (unquoted) {
        let res = parseResult(unquoted);
        if (res != null) {
          return res;
        }
      }
    }
  }

  // 2. Direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 3. Quoted JSON string anywhere in script: "([{...}])"
  let quotedJsonMatch = trimmed.match(/(['"])((?:\\.|(?!\1)[\s\S])*?(?:\[|\{)[\s\S]*?(?:\]|\})(?:\\.|(?!\1)[\s\S])*?)\1/);
  if (quotedJsonMatch) {
    let unquoted = unescapeJsString(quotedJsonMatch[1], quotedJsonMatch[2]);
    if (unquoted) {
      let res = parseResult(unquoted);
      if (res != null) {
        return res;
      }
    }
  }

  // 4. Raw unescaped JSON brackets/braces extraction
  let firstBracket = trimmed.indexOf("[");
  let lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    let slice = trimmed.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(slice);
    } catch {
      try {
        return JSON.parse(slice.replace(/\\"/g, '"'));
      } catch {}
    }
  }

  let firstBrace = trimmed.indexOf("{");
  let lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    let slice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {
      try {
        return JSON.parse(slice.replace(/\\"/g, '"'));
      } catch {}
    }
  }

  // 5. Special token keywords
  if (trimmed.includes("alive")) return "alive";
  if (trimmed.includes("reinitSubscription")) return "reinitSubscription";

  return null;
}
