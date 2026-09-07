// @vitest-environment happy-dom

import "../../../logic/app";
import { describe, expect, test } from "vitest";
import { ArrayColl } from "svelte-collections";
import { PersonUID } from "../../../logic/Abstract/PersonUID";
import { addSenderToCC } from "../../../logic/Mail/composeRecipients";

function createMail(sender: PersonUID) {
  return {
    from: sender,
    to: new ArrayColl<PersonUID>(),
    cc: new ArrayColl<PersonUID>(),
    bcc: new ArrayColl<PersonUID>(),
  };
}

describe("добавление отправителя в копию", () => {
  test("добавляет From в Cc", () => {
    let mail = createMail(new PersonUID("me@example.test", "Я"));

    addSenderToCC(mail);

    expect(mail.cc).toHaveLength(1);
    expect(mail.cc.first.emailAddress).toBe("me@example.test");
  });

  test("не дублирует адрес, уже указанный среди получателей", () => {
    let mail = createMail(new PersonUID("Me@Example.test", "Я"));
    mail.to.add(new PersonUID("me@example.test"));

    addSenderToCC(mail);

    expect(mail.cc).toHaveLength(0);
  });
});
