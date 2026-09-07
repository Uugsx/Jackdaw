import type { EMail } from "./EMail";
import { findOrCreatePersonUID } from "../Abstract/PersonUID";
import { sanitize } from "../../../lib/util/sanitizeDatatypes";

/** Добавляет отправителя в Cc, если он ещё не указан среди получателей. */
export function addSenderToCC(email: Pick<EMail, "from" | "to" | "cc" | "bcc">): void {
  let senderAddress = sanitize.emailAddress(email.from?.emailAddress, null);
  if (!senderAddress) {
    return;
  }
  let normalizedSenderAddress = senderAddress.toLowerCase();
  let isAlreadyRecipient = [email.to, email.cc, email.bcc].some(recipients =>
    recipients.some(recipient => recipient.emailAddress?.toLowerCase() == normalizedSenderAddress));
  if (isAlreadyRecipient) {
    return;
  }
  email.cc.add(findOrCreatePersonUID(senderAddress, email.from.name));
}
