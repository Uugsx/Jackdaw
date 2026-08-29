// app first, to resolve the import cycle around Abstract/Account.ts
import { appGlobal } from "../../../../logic/app";
import { setupTestFolder, newTestEMail, addTestAttachment } from "./setup";
import type { Folder } from "../../../../logic/Mail/Folder";
import type { EMail } from "../../../../logic/Mail/EMail";
import { SQLEMail } from "../../../../logic/Mail/SQL/SQLEMail";
import { getDatabase } from "../../../../logic/Mail/SQL/SQLDatabase";
import { beforeAll, expect, test } from "vitest";
import sql from "../../../../../lib/rs-sqlite";

let folder: Folder;

beforeAll(async () => {
  ({ folder } = await setupTestFolder());
});

function newFullEMail(): EMail {
  let email = newTestEMail(folder);
  email.text = "Hello";
  addTestAttachment(email, "photo.jpg", "<cid1>");
  return email;
}

test("Partial then full saves of the same email don't destroy each other", async () => {
  let db = await getDatabase();

  // Full download: body, attachment, downloadComplete, and the attachment file path
  let email = newFullEMail();
  await SQLEMail.save(email);
  email.downloadComplete = true;
  await SQLEMail.saveWritableProps(email);
  email.attachments.first.filepathLocal = "files/email/alice/1-Test/photo-0.jpg";
  await SQLEMail.saveAttachmentFilename(email, email.attachments.first);

  // Same message listed again as seemingly new, e.g. when the in-memory
  // message list was incomplete: a partial email, just the envelope data
  let phantom = newTestEMail(folder);
  await SQLEMail.save(phantom);
  expect(phantom.dbID).toBe(email.dbID); // deduplicated with existing record

  let row = await db.get(sql`
    SELECT plaintext, downloadComplete FROM email WHERE id = ${email.dbID}`) as any;
  expect(row.plaintext).toBe("Hello"); // body kept
  expect(row.downloadComplete).toBe(1); // still marked complete
  let attachmentRows = await db.all(sql`
    SELECT filename, filepathLocal FROM emailAttachment WHERE emailID = ${email.dbID}`) as any[];
  expect(attachmentRows.length).toBe(1); // attachment record kept
  expect(attachmentRows[0].filepathLocal).toBe("files/email/alice/1-Test/photo-0.jpg");

  // Re-download: full email again, but the attachment file path is not known
  let redownload = newFullEMail();
  await SQLEMail.save(redownload);
  expect(redownload.dbID).toBe(email.dbID);

  attachmentRows = await db.all(sql`
    SELECT filename, filepathLocal FROM emailAttachment WHERE emailID = ${email.dbID}`) as any[];
  expect(attachmentRows.length).toBe(1);
  expect(attachmentRows[0].filepathLocal).toBe("files/email/alice/1-Test/photo-0.jpg"); // kept

  // Changed attachments, e.g. decryption replaced them: records are replaced
  let decrypted = newTestEMail(folder);
  decrypted.text = "Hello";
  addTestAttachment(decrypted, "contract.pdf", "<cid2>");
  await SQLEMail.save(decrypted);

  attachmentRows = await db.all(sql`
    SELECT filename, filepathLocal FROM emailAttachment WHERE emailID = ${email.dbID}`) as any[];
  expect(attachmentRows.length).toBe(1);
  expect(attachmentRows[0].filename).toBe("contract.pdf");
});

test("Metadata-only save of a complete email preserves its body", async () => {
  let db = await getDatabase();
  let email = newTestEMail(folder, "move@example.com");
  email.text = "Body";
  await SQLEMail.save(email);
  email.downloadComplete = true;
  await SQLEMail.saveWritableProps(email);

  let metadataOnly = newTestEMail(folder, "move@example.com");
  metadataOnly.dbID = email.dbID;
  metadataOnly.downloadComplete = true;
  metadataOnly.subject = "Moved";
  await SQLEMail.save(metadataOnly);

  let row = await db.get(sql`
    SELECT subject, plaintext, downloadComplete FROM email WHERE id = ${email.dbID}`) as any;
  expect(row.subject).toBe("Moved");
  expect(row.plaintext).toBe("Body");
  expect(row.downloadComplete).toBe(1);
});

test("A new email marked complete still requires a body", async () => {
  let email = newTestEMail(folder, "missing-body@example.com");
  email.downloadComplete = true;
  await expect(SQLEMail.save(email)).rejects.toThrow("An email without body is not complete");
});
