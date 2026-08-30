import type { EMail } from "../../logic/Mail/EMail";

/** Subscribe to message changes that affect Reply All availability (e.g. after loadForDisplay). */
export function subscribeCanReplyAll(message: EMail | null | undefined, bump: () => void): (() => void) | null {
  return message?.subscribe(() => bump()) ?? null;
}

export function computeCanReplyAll(message: EMail | null | undefined): boolean {
  return message?.compose.canReplyAll() ?? false;
}
