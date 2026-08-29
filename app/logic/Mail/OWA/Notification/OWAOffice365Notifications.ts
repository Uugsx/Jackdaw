import { OWANotifications } from "./OWANotifications";
import { EventDecoder } from "../../../util/eventSource";
import { sleep } from "../../../util/util";
import { URLPart } from "../../../../frontend/Util/util";

export class OWAOffice365Notifications extends OWANotifications {
  protected lastEventID: string | null = null;

  async start(onChannelReady?: () => Promise<void>): Promise<void> {
    // Office 365 lets the client pick the channel ID, but the subscriptions
    // have to be registered against this very ID. Publishing it on the account
    // before subscribing is what connects the two; otherwise the stream is
    // live but no event ever reaches it.
    let cid = "00000000-0000-0000-0000-000000000000".replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
    this.account.notificationChannelID = cid;
    let json: any;
    let timerOptions: { headers: { Authorization: string } } | undefined;
    let pingTimer;
    let abortTimer;
    let subscribed = false;
    try {
      // This loop only ends by exception (e.g. logout) or app shutdown.
      while (this.keepRunning) {
        // The ping, abort and stream requests use this access token.
        let request = new OWAGetAccessTokenforResourceRequest(this.account.url + "notificationchannel/");
        let response = await this.account.callOWA(request);
        timerOptions = {
          headers: {
            Authorization: `Bearer ${response.AccessToken}`,
          },
        };
        // Streaming requests require additional headers.
        let streamOptions = {
          headers: {
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            "Last-Event-ID": this.lastEventID ?? "null",
            Authorization: `Bearer ${response.AccessToken}`,
          },
        };
        // Negotiate and start requests use the main access token.
        let options = {
          headers: {
            Authorization: this.account.authorizationHeader,
          },
        };
        // The remaining requests require a connection token.
        // This request also gives us the transport and keep alive timeouts.
        let url = this.account.url + "notificationchannel/negotiate?cid=" + cid;
        response = await fetch(url, options);
        if (!response.ok) {
          let allowed = response.headers.get("Allow");
          throw new Error(`negotiate failed with HTTP ${response.status} ${response.statusText}` +
            (allowed ? `, server allows ${allowed}` : ""));
        }
        json = await response.json();
        // Tell the server to start sending events.
        url = this.account.url + URLPart`notificationchannel/start?transport=serverSentEvents&cid=${cid}&connectionToken=${json.ConnectionToken}`;
        response = await fetch(url, options);
        //console.log("response", response.ok ? "OK" : "Failed", "status", response.status, "statusText", response.statusText, "response obj", response);
        if (!response.ok) {
          throw new Error(`start failed with HTTP ${response.status} ${response.statusText}`);
        }
        // We have to request a ping every 5 minutes,
        // otherwise we stop receiving events.
        url = this.account.url + URLPart`notificationchannel/ping?transport=serverSentEvents&cid=${cid}&connectionToken=${json.ConnectionToken}`;
        pingTimer = setInterval(keepAlive, (json.TransportConnectTimeout || 5) * 60 * 1000, url, timerOptions);
        // We have to abort the stream after 40 minutes,
        // because the access token will expire eventually.
        url = this.account.url + URLPart`notificationchannel/abort?transport=serverSentEvents&cid=${cid}&connectionToken=${json.ConnectionToken}`;
        abortTimer = setTimeout(keepAlive, (json.KeepAliveTimeout || 40) * 60 * 1000, url, timerOptions);
        if (!subscribed) {
          await onChannelReady?.();
          subscribed = true;
        }
        // Now set up the stream itself.
        url = this.account.url + URLPart`notificationchannel/connect?transport=serverSentEvents&cid=${cid}&connectionToken=${json.ConnectionToken}`;
        let stream = await fetch(url, streamOptions);
        //console.log("stream", stream.ok ? "OK" : "Failed", "status", stream.status, "statusText", stream.statusText, "stream obj", stream);
        if (!stream.ok) {
          throw new Error(`stream fetch failed with HTTP ${stream.status} ${stream.statusText}`);
        }
        let eventStream = stream.body.pipeThrough(new TextDecoderStream()).pipeThrough(new TransformStream(new EventDecoder()));
        for await (let event of eventStream) {
          if (event.id) {
            this.lastEventID = event.id;
          }
          // Ignore the initial event and any heartbeat events
          if (event.data == "initialized" || event.data == "{}") {
            continue;
          }
          await sleep(0.1); // Avoid racing with ourselves, if we caused the notification
          let json = JSON.parse(event.data);
          await this.account.onNotificationMessages(json.M);
        }
        clearInterval(pingTimer);
        clearTimeout(abortTimer);
      }
    } finally {
      clearInterval(pingTimer);
      clearTimeout(abortTimer);
      if (json?.ConnectionToken && timerOptions) {
        let url = this.account.url + URLPart`notificationchannel/abort?transport=serverSentEvents&cid=${cid}&connectionToken=${json.ConnectionToken}`;
        await keepAlive(url, timerOptions);
      }
    }
  }
}

/** The channel keep-alive and teardown calls run from timers and from a
 * `finally`, where a rejection would become an unhandled one. */
async function keepAlive(url: string, options: RequestInit): Promise<void> {
  try {
    await fetch(url, options);
  } catch (ex) {
    console.warn("OWA notification channel keep-alive failed", ex);
  }
}

class OWAGetAccessTokenforResourceRequest {
  /* This request doesn't have the header and body that most requests have. */
  readonly __type = "TokenRequest:#Exchange";
  readonly Resource: string;

  constructor(url: string) {
    this.Resource = url;
  }

  get action() {
    return "GetAccessTokenforResource";
  }
}
