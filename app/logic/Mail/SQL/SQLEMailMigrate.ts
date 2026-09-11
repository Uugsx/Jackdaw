import sql, { type Database } from "../../../../lib/rs-sqlite";

// <copied from="createDatabase.ts">
export const createFolderIDDateSentIndex = sql`
  CREATE INDEX IF NOT EXISTS index_email_folderID_dateSent
  ON email (folderID, dateSent DESC);
`;

/** Индексы для проверки отправленного ответа на входящий запрос. */
export const createReportReplyIndexes = sql`
  CREATE INDEX IF NOT EXISTS index_email_parentMsgID_outgoing_dateSent
  ON email (parentMsgID, outgoing, dateSent);
  CREATE INDEX IF NOT EXISTS index_email_threadID_outgoing_dateSent
  ON email (threadID, outgoing, dateSent);
`;

/** Индекс для частого поиска входящих писем, ожидающих ответа. */
export const createResponseReminderIndexes = sql`
  CREATE INDEX IF NOT EXISTS index_email_folderID_outgoing_dateReceived
  ON email (folderID, outgoing, dateReceived);
`;

/**
 * Совместимость с базами, открытыми первой сборкой отчётов: там следующая
 * старая миграция увеличила user_version до применения этих индексов.
 */
export async function repairReportReplyIndexes(
  database: Database,
): Promise<void> {
  database.execute(createReportReplyIndexes);
}

/** Откат createReportReplyIndexes для инструментов обслуживания базы. */
export const rollbackReportReplyIndexes = sql`
  DROP INDEX IF EXISTS index_email_parentMsgID_outgoing_dateSent;
  DROP INDEX IF EXISTS index_email_threadID_outgoing_dateSent;
`;

/** Откат индекса поиска писем для напоминаний. */
export const rollbackResponseReminderIndexes = sql`
  DROP INDEX IF EXISTS index_email_folderID_outgoing_dateReceived;
`;

/** Add the message status columns to a pre-existing mail.db.
 * Pattern: read source-of-truth via `table_info`, create on miss. */
export async function addEMailStatusColumns(database: Database): Promise<void> {
  let columns = (await database.all(sql`PRAGMA table_info("email")`)) as any[];
  if (!columns.some((column) => column.name == "isForwarded")) {
    await database.execute(
      sql`ALTER TABLE email ADD COLUMN "isForwarded" BOOLEAN default false;`,
    );
  }
  if (!columns.some((column) => column.name == "isImportant")) {
    await database.execute(
      sql`ALTER TABLE email ADD COLUMN "isImportant" BOOLEAN default false;`,
    );
  }
}
