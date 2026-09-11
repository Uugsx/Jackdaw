import { describe, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sql from "../../../../lib/rs-sqlite";
import { createReportReplyIndexes } from "../../../logic/Mail/SQL/SQLEMailMigrate";
import { mailDatabaseSchema } from "../../../logic/Mail/SQL/createDatabase";
import { InProcessSQLiteDatabase } from "../util/inProcessSQLite";
import {
  buildResponseTimeStats,
  defaultReportDateRange,
  loadReportMailAccounts,
  loadReportMailData,
  mergeReportTopics,
  normalizeResponseTargetMinutes,
  normalizeReportTopic,
  validateReportDateRange,
  type RawMailTopicRow,
} from "../../../logic/Reports/ReportsData";

describe("ReportsData helpers", () => {
  test("builds a thirty-day default range ending today", () => {
    expect(defaultReportDateRange(new Date(2026, 8, 9, 16, 30))).toEqual({
      from: "2026-08-11",
      to: "2026-09-09",
    });
  });

  test("validates malformed and reversed ranges", () => {
    expect(
      validateReportDateRange({ from: "2026-02-30", to: "2026-03-01" }),
    ).toBe("invalid");
    expect(
      validateReportDateRange({ from: "2026-04-02", to: "2026-04-01" }),
    ).toBe("reversed");
    expect(
      validateReportDateRange({ from: "2026-04-01", to: "2026-04-01" }),
    ).toBeNull();
  });

  test("normalizes reply and forward prefixes", () => {
    expect(normalizeReportTopic("  Re: Fwd:  Printer   issue ")).toBe(
      "Printer issue",
    );
    expect(normalizeReportTopic(" ")).toBe("(без темы)");
  });

  test("merges normalized topic variants before ranking", () => {
    const rows: RawMailTopicRow[] = [
      {
        subject: "Re: Printer issue",
        requests: 2,
        answered: 1,
        lastActivity: new Date(2026, 0, 2),
      },
      {
        subject: "Fwd: Printer issue",
        requests: 3,
        answered: 2,
        lastActivity: new Date(2026, 0, 4),
      },
      {
        subject: "Access request",
        requests: 4,
        answered: 4,
        lastActivity: new Date(2026, 0, 3),
      },
    ];

    expect(mergeReportTopics(rows)).toEqual([
      {
        topic: "Printer issue",
        requests: 5,
        answered: 3,
        lastActivity: new Date(2026, 0, 4),
      },
      {
        topic: "Access request",
        requests: 4,
        answered: 4,
        lastActivity: new Date(2026, 0, 3),
      },
    ]);
  });

  test("calculates response timing and normalizes the SLA target", () => {
    expect(normalizeResponseTargetMinutes(undefined)).toBe(30);
    expect(normalizeResponseTargetMinutes(45.8)).toBe(45);
    expect(normalizeResponseTargetMinutes(0)).toBe(30);
    expect(normalizeResponseTargetMinutes(10_000)).toBe(10_000);

    expect(
      buildResponseTimeStats(
        [
          {
            durationSeconds: null,
            responseTimeStatus: "outside-working-hours",
          },
          { durationSeconds: 60, responseTimeStatus: "measured" },
          { durationSeconds: 3_600, responseTimeStatus: "measured" },
        ],
        1,
      ),
    ).toEqual({
      answered: 2,
      averageSeconds: 1_830,
      minimumSeconds: 60,
      maximumSeconds: 3_600,
      withinTarget: 1,
      overTarget: 1,
    });
  });
});

function localSeconds(day: number, hour: number): number {
  return Math.floor(new Date(2026, 8, day, hour, 0, 0, 0).getTime() / 1000);
}

function insertEmail(
  database: InProcessSQLiteDatabase,
  values: {
    id: number;
    folderID: number;
    messageID: string | null;
    parentMsgID: string | null;
    threadID: string | null;
    date: number;
    outgoing: number;
    isReplied: number;
    subject: string;
    json?: string | null;
    contactEmail?: string;
    contactName?: string;
  },
): void {
  database.run(sql`
    INSERT INTO email (
      id, folderID, messageID, parentMsgID, threadID,
      dateSent, dateReceived, outgoing, contactEmail, contactName,
      subject, isReplied, json
    ) VALUES (
      ${values.id}, ${values.folderID}, ${values.messageID},
      ${values.parentMsgID}, ${values.threadID}, ${values.date}, ${values.date},
      ${values.outgoing},
      ${values.outgoing ? "user@example.com" : values.contactEmail ?? "requester@example.com"},
      ${values.outgoing ? "User" : values.contactName ?? "Requester"},
      ${values.subject}, ${values.isReplied},
      ${values.json ?? null}
    )
  `);
}

function insertRecipient(
  database: InProcessSQLiteDatabase,
  emailID: number,
  recipientType: number,
  emailAddress: string,
  name = emailAddress,
): void {
  database.run(sql`
    INSERT OR IGNORE INTO emailPerson (emailAddress, name)
    VALUES (${emailAddress}, ${name})
  `);
  const person = database.get(sql`
    SELECT id
    FROM emailPerson
    WHERE emailAddress = ${emailAddress}
      AND name = ${name}
  `) as { id?: number } | undefined;
  if (!person?.id) {
    throw new Error(`Could not create email person for ${emailAddress}`);
  }
  database.run(sql`
    INSERT INTO emailPersonRel (emailID, emailPersonID, recipientType)
    VALUES (${emailID}, ${person.id}, ${recipientType})
  `);
}

test("counts verified replies, unique tags, and selected mail account scope", async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "reports-mail-"));
  const database = new InProcessSQLiteDatabase(path.join(tempDir, "mail.db"));
  try {
    await database.migrate(mailDatabaseSchema, createReportReplyIndexes);
    database.run(sql`
      INSERT INTO emailAccount (id, idStr, protocol)
      VALUES (1, ${"account-1"}, ${"imap"}), (2, ${"account-2"}, ${"imap"})
    `);
    database.run(sql`
      INSERT INTO folder (id, accountID, name, path)
      VALUES
        (101, 1, ${"Inbox"}, ${"INBOX"}),
        (102, 1, ${"Support"}, ${"SUPPORT"}),
        (201, 2, ${"Inbox"}, ${"INBOX"})
    `);

    insertEmail(database, {
      id: 1,
      folderID: 101,
      messageID: "<request-1>",
      parentMsgID: null,
      threadID: "<thread-1>",
      date: localSeconds(3, 9),
      outgoing: 0,
      isReplied: 0,
      subject: "Access request",
    });
    insertEmail(database, {
      id: 2,
      folderID: 101,
      messageID: "<reply-1>",
      parentMsgID: "<request-1>",
      threadID: "<thread-1>",
      date: localSeconds(3, 10),
      outgoing: 1,
      isReplied: 0,
      subject: "Re: Access request",
    });
    insertEmail(database, {
      id: 3,
      folderID: 101,
      messageID: "<request-2>",
      parentMsgID: null,
      threadID: "<thread-2>",
      date: localSeconds(4, 11),
      outgoing: 0,
      isReplied: 1,
      subject: "No actual reply",
    });
    insertEmail(database, {
      id: 4,
      folderID: 101,
      messageID: null,
      parentMsgID: null,
      threadID: "<thread-3>",
      date: localSeconds(5, 12),
      outgoing: 0,
      isReplied: 0,
      subject: "Thread-only request",
    });
    insertEmail(database, {
      id: 5,
      folderID: 101,
      messageID: "<reply-3>",
      parentMsgID: null,
      threadID: "<thread-3>",
      date: localSeconds(5, 13),
      outgoing: 1,
      isReplied: 0,
      subject: "Re: Thread-only request",
    });
    insertEmail(database, {
      id: 6,
      folderID: 201,
      messageID: "<request-other-account>",
      parentMsgID: null,
      threadID: "<thread-other-account>",
      date: localSeconds(6, 14),
      outgoing: 0,
      isReplied: 1,
      subject: "Other account request",
    });
    insertEmail(database, {
      id: 7,
      folderID: 101,
      messageID: "<request-late>",
      parentMsgID: null,
      threadID: "<thread-late>",
      date: localSeconds(9, 15),
      outgoing: 0,
      isReplied: 0,
      subject: "Late response request",
    });
    insertEmail(database, {
      id: 8,
      folderID: 101,
      messageID: "<reply-late>",
      parentMsgID: "<request-late>",
      threadID: "<thread-late>",
      date: localSeconds(10, 1),
      outgoing: 1,
      isReplied: 0,
      subject: "Re: Late response request",
    });
    insertEmail(database, {
      id: 9,
      folderID: 201,
      messageID: "<cross-account-reply>",
      parentMsgID: "<request-1>",
      threadID: "<thread-1>",
      date: localSeconds(7, 16),
      outgoing: 1,
      isReplied: 0,
      subject: "Cross-account reply",
    });
    insertEmail(database, {
      id: 10,
      folderID: 101,
      messageID: "<reply-1-later>",
      parentMsgID: null,
      threadID: "<thread-1>",
      date: localSeconds(3, 11),
      outgoing: 1,
      isReplied: 0,
      subject: "Re: Access request, follow-up",
    });
    insertEmail(database, {
      id: 11,
      folderID: 102,
      messageID: "<request-custom-folder>",
      parentMsgID: null,
      threadID: "<thread-custom-folder>",
      date: localSeconds(4, 14),
      outgoing: 0,
      isReplied: 0,
      subject: "Custom folder request",
    });

    database.run(sql`
      INSERT INTO emailTag (emailID, tagName)
      VALUES
        (1, ${"Никита Левченко"}),
        (1, ${"Никита Левченко"}),
        (2, ${"Никита Левченко"}),
        (3, ${"Никита Левченко"}),
        (11, ${"Никита Левченко"}),
        (4, ${"Другая метка"})
      `);

    const range = { from: "2026-09-03", to: "2026-09-09" };
    const allMail = await loadReportMailData(range, {}, database);
    expect(allMail.summary).toMatchObject({
      total: 10,
      incoming: 6,
      outgoing: 4,
      answered: 5,
    });
    expect(allMail.responseTargetMinutes).toBe(30);
    expect(allMail.responseTimeDays.map((day) => day.day)).toEqual([
      "2026-09-03",
      "2026-09-05",
      "2026-09-09",
    ]);
    expect(allMail.responseTimes.map((response) => response.emailId)).toEqual([
      7, 1, 4,
    ]);
    expect(allMail.responseTimes[0]).toMatchObject({
      emailId: 7,
      durationSeconds: 10_800,
      withinTarget: false,
      responseTimeStatus: "measured",
    });
    expect(
      allMail.responseTimes.find((response) => response.emailId === 4),
    ).toMatchObject({
      durationSeconds: null,
      withinTarget: null,
      responseTimeStatus: "outside-working-hours",
    });
    expect(
      allMail.responseTimes.find((response) => response.emailId === 1),
    ).toMatchObject({
      folderId: 101,
      categoryNames: ["Никита Левченко"],
    });
    expect(allMail.summary.responseTime).toEqual({
      answered: 2,
      averageSeconds: 7_200,
      minimumSeconds: 3_600,
      maximumSeconds: 10_800,
      withinTarget: 0,
      overTarget: 2,
    });
    expect(allMail.categories).toContainEqual({
      name: "Никита Левченко",
      total: 4,
      incoming: 3,
      outgoing: 1,
      answered: 2,
      lastActivity: new Date(2026, 8, 4, 14),
      peakWeekday: 3,
      peakHour: 10,
      responseTime: {
        answered: 1,
        averageSeconds: 3_600,
        minimumSeconds: 3_600,
        maximumSeconds: 3_600,
        withinTarget: 0,
        overTarget: 1,
      },
    });

    const selectedMail = await loadReportMailData(
      range,
      { mailAccountId: 1 },
      database,
    );
    expect(selectedMail.summary).toMatchObject({
      total: 8,
      incoming: 5,
      outgoing: 3,
      answered: 4,
    });
    expect(selectedMail.responders[0]).toMatchObject({
      accountId: 1,
      requests: 5,
      answered: 4,
      sent: 3,
    });
    expect(selectedMail.responders[0].responseTime).toMatchObject({
      answered: 2,
      averageSeconds: 7_200,
      minimumSeconds: 3_600,
      maximumSeconds: 10_800,
      withinTarget: 0,
      overTarget: 2,
    });

    const selectedInboxMail = await loadReportMailData(
      range,
      { mailAccountId: 1, mailFolderId: 101 },
      database,
    );
    expect(selectedInboxMail.summary).toMatchObject({
      total: 7,
      incoming: 4,
      outgoing: 3,
      answered: 4,
    });
    expect(selectedInboxMail.categories).toContainEqual(
      expect.objectContaining({
        name: "Никита Левченко",
        total: 3,
        incoming: 2,
      }),
    );

    const selectedCustomFolderMail = await loadReportMailData(
      range,
      { mailAccountId: 1, mailFolderId: 102 },
      database,
    );
    expect(selectedCustomFolderMail.summary).toMatchObject({
      total: 1,
      incoming: 1,
      outgoing: 0,
      answered: 0,
    });
    expect(selectedCustomFolderMail.categories).toContainEqual(
      expect.objectContaining({
        name: "Никита Левченко",
        total: 1,
        incoming: 1,
      }),
    );

    const customTargetMail = await loadReportMailData(
      range,
      { mailAccountId: 1, responseTargetMinutes: 60 },
      database,
    );
    expect(customTargetMail.summary.responseTime).toMatchObject({
      withinTarget: 1,
      overTarget: 1,
    });

    const otherMail = await loadReportMailData(
      range,
      { mailAccountId: 2 },
      database,
    );
    expect(otherMail.summary).toMatchObject({
      total: 2,
      incoming: 1,
      outgoing: 1,
      answered: 1,
    });
    expect(otherMail.responseTimes).toEqual([]);
    expect(otherMail.categories).toEqual([]);
  } finally {
    database.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("recognizes provider reply flags and replies from a personal sent folder", async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "reports-reply-signals-"));
  const database = new InProcessSQLiteDatabase(path.join(tempDir, "mail.db"));
  try {
    await database.migrate(mailDatabaseSchema, createReportReplyIndexes);
    database.run(sql`
      INSERT INTO emailAccount (id, idStr, protocol)
      VALUES (1, ${"account-1"}, ${"imap"}), (2, ${"account-2"}, ${"imap"})
    `);
    database.run(sql`
      INSERT INTO folder (id, accountID, name, path, specialUse)
      VALUES
        (101, 1, ${"Inbox"}, ${"INBOX"}, ${"inbox"}),
        (202, 2, ${"Sent"}, ${"Sent"}, ${"sent"})
    `);

    insertEmail(database, {
      id: 1,
      folderID: 101,
      messageID: "<provider-answered>",
      parentMsgID: null,
      threadID: "<provider-answered-thread>",
      date: localSeconds(9, 9),
      outgoing: 0,
      isReplied: 1,
      json: JSON.stringify({ lastVerbAt: (localSeconds(9, 9) + 2 * 60) * 1000 }),
      subject: "Answered according to the provider",
    });
    insertEmail(database, {
      id: 2,
      folderID: 101,
      messageID: "<personal-mailbox-request>",
      parentMsgID: null,
      threadID: "<personal-mailbox-thread>",
      date: localSeconds(9, 10),
      outgoing: 0,
      isReplied: 0,
      subject: "Answered from a personal mailbox",
    });
    insertEmail(database, {
      id: 3,
      folderID: 202,
      messageID: "<personal-mailbox-reply>",
      parentMsgID: "<personal-mailbox-request>",
      threadID: "<personal-mailbox-thread>",
      date: localSeconds(9, 10) + 30 * 60,
      // The folder is the source of truth when a provider leaves outgoing=0.
      outgoing: 0,
      isReplied: 0,
      subject: "Re: Answered from a personal mailbox",
    });

    const report = await loadReportMailData(
      { from: "2026-09-09", to: "2026-09-09" },
      {},
      database,
    );

    expect(report.summary).toMatchObject({
      total: 3,
      incoming: 2,
      outgoing: 1,
      answered: 2,
    });
    expect(report.responseTimes.map((response) => response.emailId)).toEqual([2, 1]);
    expect(report.responseTimes[0].durationSeconds).toBe(1_800);
    expect(report.responseTimes[1].durationSeconds).toBe(120);
    expect(report.summary.responseTime).toMatchObject({
      answered: 2,
      averageSeconds: 960,
      minimumSeconds: 120,
      maximumSeconds: 1_800,
      withinTarget: 2,
      overTarget: 0,
    });
  } finally {
    database.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("does not count a shared-mailbox copy of an employee reply as a new request", async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "reports-shared-copy-"));
  const database = new InProcessSQLiteDatabase(path.join(tempDir, "mail.db"));
  try {
    await database.migrate(mailDatabaseSchema, createReportReplyIndexes);
    database.run(sql`
      INSERT INTO emailAccount (id, idStr, protocol)
      VALUES (1, ${"account-1"}, ${"imap"})
    `);
    database.run(sql`
      INSERT INTO folder (id, accountID, name, path, specialUse)
      VALUES (101, 1, ${"Inbox"}, ${"INBOX"}, ${"inbox"})
    `);

    insertEmail(database, {
      id: 1,
      folderID: 101,
      messageID: "<shared-request>",
      parentMsgID: null,
      threadID: "<shared-thread>",
      date: localSeconds(9, 9),
      outgoing: 0,
      isReplied: 0,
      subject: "Request",
      contactEmail: "customer@external.test",
      contactName: "Customer",
    });
    insertEmail(database, {
      id: 2,
      folderID: 101,
      messageID: "<shared-reply>",
      parentMsgID: "<shared-request>",
      threadID: "<shared-thread>",
      date: localSeconds(9, 9) + 5 * 60,
      outgoing: 0,
      isReplied: 0,
      subject: "Re: Request",
      contactEmail: "employee@company.test",
      contactName: "Employee",
    });
    insertEmail(database, {
      id: 3,
      folderID: 101,
      messageID: "<shared-follow-up>",
      parentMsgID: "<shared-reply>",
      threadID: null,
      date: localSeconds(9, 9) + 20 * 60,
      outgoing: 0,
      isReplied: 0,
      subject: "Re: Request",
      contactEmail: "customer@external.test",
      contactName: "Customer",
    });
    database.run(sql`
      INSERT INTO emailTag (emailID, tagName)
      VALUES
        (1, ${"Никита Левченко"}),
        (2, ${"Никита Левченко"}),
        (3, ${"Никита Левченко"})
    `);

    insertRecipient(database, 1, 1, "customer@external.test", "Customer");
    insertRecipient(database, 1, 2, "shared@company.test", "Shared");
    insertRecipient(database, 2, 1, "employee@company.test", "Employee");
    insertRecipient(database, 2, 2, "customer@external.test", "Customer");
    insertRecipient(database, 2, 3, "shared@company.test", "Shared");
    insertRecipient(database, 3, 1, "customer@external.test", "Customer");
    insertRecipient(database, 3, 2, "shared@company.test", "Shared");

    const report = await loadReportMailData(
      { from: "2026-09-09", to: "2026-09-09" },
      { mailAccountId: 1, mailboxAddress: "shared@company.test" },
      database,
    );

    expect(report.summary).toMatchObject({
      total: 2,
      incoming: 2,
      outgoing: 0,
      answered: 1,
    });
    expect(report.responseTimes.map((response) => response.emailId)).toEqual([
      1,
    ]);
    expect(report.responseTimes[0].durationSeconds).toBe(300);
    expect(report.categories).toContainEqual(
      expect.objectContaining({
        name: "Никита Левченко",
        total: 2,
        incoming: 2,
        answered: 1,
      }),
    );
  } finally {
    database.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("lists accounts from persisted folders when the account mirror is empty", async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "reports-accounts-"));
  const database = new InProcessSQLiteDatabase(path.join(tempDir, "mail.db"));
  try {
    await database.migrate(mailDatabaseSchema, createReportReplyIndexes);
    database.pragma("foreign_keys = false");
    database.run(sql`
      INSERT INTO folder (id, accountID, name, path)
      VALUES (101, 7, ${"Inbox"}, ${"INBOX"})
    `);

    expect(await loadReportMailAccounts(database)).toEqual([
      {
        accountId: 7,
        accountName: "Почтовый аккаунт",
        email: "",
      },
    ]);
  } finally {
    database.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
});
