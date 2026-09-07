import "../../../logic/app";
import { MailAccount } from "../../../logic/Mail/MailAccount";
import { expect, test } from "vitest";

test("настройка копии письма хранится отдельно для каждого ящика", () => {
  let enabledAccount = new MailAccount();
  enabledAccount.emailAddress = "enabled@example.com";
  enabledAccount.name = "Enabled";
  enabledAccount.copyToSelf = true;

  let disabledAccount = new MailAccount();
  disabledAccount.emailAddress = "disabled@example.com";
  disabledAccount.name = "Disabled";

  expect(enabledAccount.copyToSelf).toBe(true);
  expect(disabledAccount.copyToSelf).toBe(false);

  let restoredAccount = new MailAccount();
  restoredAccount.fromConfigJSON(enabledAccount.toConfigJSON());
  expect(restoredAccount.copyToSelf).toBe(true);
});
