import type { OWAAccount } from "../OWAAccount";
import { AbstractFunction } from "../../../util/util";

export class OWANotifications {
  account: OWAAccount;
  /** Set by `stop()`. The stream loops must check it, otherwise they keep
   * talking to the server after logout and the account can never restart
   * notifications, because `notificationRun` stays pending forever. */
  protected aborted = false;

  constructor(account: OWAAccount) {
    this.account = account;
  }

  /**
   * Opens the notification channel and keeps it open. Returns only by throwing
   * or once `stop()` was called.
   *
   * @param onChannelReady Called after the channel ID is known and the server
   *   has accepted the connection, but before the stream is opened.
   *   Subscriptions must be registered here: Exchange binds them to the
   *   channel ID, so subscribing earlier targets a channel that does not exist
   *   yet, and subscribing later races with the first events.
   */
  async start(_onChannelReady?: () => Promise<void>): Promise<void> {
    throw new AbstractFunction();
  }

  stop(): void {
    this.aborted = true;
  }

  protected get keepRunning(): boolean {
    return !this.aborted && this.account.isLoggedIn;
  }
}
