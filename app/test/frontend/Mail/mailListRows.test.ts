import { describe, expect, test } from "vitest";
import { ArrayColl } from "svelte-collections";
import type { EMail } from "../../../logic/Mail/EMail";
import { MailListRows, type MailListMessageRow } from "../../../frontend/Mail/mailListRows";

// The day-header labels go through the l10n date formatter, which reads the
// user's locale from localStorage.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  },
});

function fakeMail(subject: string, sent: Date, from = "zoe@example.com"): EMail {
  return {
    dbID: subject,
    subject,
    sent,
    from: { emailAddress: from, name: from },
    contact: null,
  } as unknown as EMail;
}

function subjects(rows: ArrayColl<any>): string[] {
  return rows.contents
    .filter((row): row is MailListMessageRow => row.kind == "message")
    .map(row => row.message.subject);
}

function dayLabels(rows: ArrayColl<any>): string[] {
  return rows.contents
    .filter((row): row is MailListMessageRow => row.kind == "message" && !!row.dayLabel)
    .map(row => row.dayLabel as string);
}

const jan1 = new Date(2026, 0, 1, 9, 0);
const jan1Later = new Date(2026, 0, 1, 17, 0);
const jan2 = new Date(2026, 0, 2, 9, 0);

describe("MailListRows", () => {
  test("picks up mail that arrives in the folder after the list was built", () => {
    let messages = new ArrayColl<EMail>([fakeMail("first", jan2)]);
    let model = new MailListRows();
    model.setSource(messages, "date-desc");
    expect(subjects(model.rows)).toEqual(["first"]);

    // The folder collection is mutated in place by the sync, and its object
    // identity never changes. This is the case that used to leave the list
    // frozen on whatever it was showing at mount time.
    messages.add(fakeMail("just arrived", new Date(2026, 0, 3, 9, 0)));

    expect(subjects(model.rows)).toEqual(["just arrived", "first"]);
    model.dispose();
  });

  test("drops mail that was deleted on the server", () => {
    let doomed = fakeMail("deleted elsewhere", jan2);
    let messages = new ArrayColl<EMail>([doomed, fakeMail("kept", jan1)]);
    let model = new MailListRows();
    model.setSource(messages, "date-desc");

    messages.remove(doomed);

    expect(subjects(model.rows)).toEqual(["kept"]);
    model.dispose();
  });

  test("stops following the previous folder after switching", () => {
    let inbox = new ArrayColl<EMail>([fakeMail("inbox mail", jan1)]);
    let archive = new ArrayColl<EMail>([fakeMail("archived mail", jan2)]);
    let model = new MailListRows();
    model.setSource(inbox, "date-desc");
    model.setSource(archive, "date-desc");

    inbox.add(fakeMail("should not show up here", jan2));

    expect(subjects(model.rows)).toEqual(["archived mail"]);
    model.dispose();
  });

  test("groups by day under date sorts, one header per day", () => {
    let messages = new ArrayColl<EMail>([
      fakeMail("morning", jan1),
      fakeMail("evening", jan1Later),
      fakeMail("next day", jan2),
    ]);
    let model = new MailListRows();
    model.setSource(messages, "date-asc");

    expect(subjects(model.rows)).toEqual(["morning", "evening", "next day"]);
    expect(dayLabels(model.rows)).toHaveLength(2);
    model.dispose();
  });

  test("omits day headers when sorting by sender or subject", () => {
    let messages = new ArrayColl<EMail>([
      fakeMail("b", jan1, "anna@example.com"),
      fakeMail("a", jan2, "zoe@example.com"),
    ]);
    let model = new MailListRows();

    // Consecutive rows have unrelated dates under these sorts, so a day header
    // would appear above nearly every message.
    model.setSource(messages, "sender");
    expect(subjects(model.rows)).toEqual(["b", "a"]);
    expect(dayLabels(model.rows)).toEqual([]);

    model.setSource(messages, "subject");
    expect(subjects(model.rows)).toEqual(["a", "b"]);
    expect(dayLabels(model.rows)).toEqual([]);
    model.dispose();
  });

  test("keeps its rows collection identity across sort and folder changes", () => {
    let model = new MailListRows();
    let rows = model.rows;
    model.setSource(new ArrayColl<EMail>([fakeMail("a", jan1)]), "date-desc");
    model.setSource(new ArrayColl<EMail>([fakeMail("b", jan2)]), "subject");

    // FastList subscribes to this collection once, so replacing it would
    // silently detach the list from its data.
    expect(model.rows).toBe(rows);
    model.dispose();
  });

  test("stops updating after dispose", () => {
    let messages = new ArrayColl<EMail>([fakeMail("only", jan1)]);
    let model = new MailListRows();
    model.setSource(messages, "date-desc");
    model.dispose();

    messages.add(fakeMail("after dispose", jan2));

    expect(subjects(model.rows)).toEqual(["only"]);
  });
});
