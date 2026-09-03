import "../../../../logic/app";
import { appGlobal } from "../../../../logic/app";
import { OWAAccount } from "../../../../logic/Mail/OWA/OWAAccount";
import { DummyMailStorage } from "../../../../logic/Mail/Store/DummyMailStorage";
import {
  EMailFlagTimePidTag,
  IconIndex,
  IconIndexPidTag,
} from "../../../../logic/Mail/EWS/ExchangeEMail";
import { owaGetMessageActionFlagsRequest } from "../../../../logic/Mail/OWA/Request/OWAFolderRequests";
import { expect, test } from "vitest";

appGlobal.remoteApp = { OWA: {} };

function createMessage() {
  let account = new OWAAccount();
  account.storage = new DummyMailStorage();
  let folder = account.newFolder();
  let message = folder.newEMail();
  message.itemID = "message-1";
  folder.messages.add(message);
  return { account, folder, message };
}

test("читает из OWA стрелку ответа и время последнего действия", () => {
  let { message } = createMessage();
  let actionAt = "2026-09-02T01:23:00Z";

  let changed = message.setFlags({
    ExtendedProperty: [{
      ExtendedFieldURI: { PropertyTag: EMailFlagTimePidTag },
      Value: actionAt,
    }, {
      ExtendedFieldURI: { PropertyTag: IconIndexPidTag },
      Value: String(IconIndex.Replied),
    }],
  }, "partial");

  expect(changed).toBe(true);
  expect(message.isReplied).toBe(true);
  expect(message.isForwarded).toBe(false);
  expect(message.lastVerbAt?.getTime()).toBe(new Date(actionAt).getTime());
});

test("не принимает время действия за стрелку", () => {
  let { message } = createMessage();

  message.setFlags({
    ExtendedProperty: [{
      ExtendedFieldURI: { PropertyTag: EMailFlagTimePidTag },
      Value: "2026-09-02T01:23:00Z",
    }],
  }, "partial");

  expect(message.isReplied).toBe(false);
  expect(message.isForwarded).toBe(false);
  expect(message.lastVerbAt).toBeNull();
});

test("запрос метаданных включает категории, стрелку и время действия", () => {
  let request = owaGetMessageActionFlagsRequest(["message-1"]);
  let properties = request.Body.ItemShape.AdditionalProperties;

  expect(properties.map((property: { FieldURI?: string, PropertyTag?: string }) =>
    property.FieldURI ?? property.PropertyTag)).toEqual([
    "item:Categories",
    IconIndexPidTag,
    EMailFlagTimePidTag,
  ]);
});

test("обновляет стрелку уже загруженного письма общего ящика", async () => {
  let { account, folder, message } = createMessage();
  let actionAt = "2026-09-02T01:23:00Z";
  (account as any).callOWA = async (request: any) => ({
    Items: [{
      ItemId: { Id: message.itemID },
      Categories: { String: ["Переписка (мы в копии)"] },
      ExtendedProperty: [{
        ExtendedFieldURI: { PropertyTag: IconIndexPidTag },
        Value: String(IconIndex.Forwarded),
      }, {
        ExtendedFieldURI: { PropertyTag: EMailFlagTimePidTag },
        Value: actionAt,
      }],
    }],
  });

  await (folder as any).refreshMessageActionFlags([message]);

  expect(message.isReplied).toBe(false);
  expect(message.isForwarded).toBe(true);
  expect(message.lastVerbAt?.getTime()).toBe(new Date(actionAt).getTime());
  expect(message.tags.contents.map(tag => tag.name)).toEqual(["Переписка (мы в копии)"]);
  expect((folder as any).actionFlagsCheckedIDs.has(message.itemID)).toBe(true);
});

test("общий ящик: fallback на IconIndex, если время действия отклонено", async () => {
  let { account, folder, message } = createMessage();
  let calls = 0;
  (account as any).callOWA = async (request: any) => {
    calls++;
    let includeActionTime = request.Body.ItemShape.AdditionalProperties.some(
      (property: { PropertyTag?: string }) => property.PropertyTag == EMailFlagTimePidTag,
    );
    if (includeActionTime) {
      throw new Error("ErrorInvalidPropertyRequest");
    }
    return {
      Items: [{
        ItemId: { Id: message.itemID },
        ExtendedProperty: [{
          ExtendedFieldURI: { PropertyTag: IconIndexPidTag },
          Value: String(IconIndex.Replied),
        }],
      }],
    };
  };

  await (folder as any).refreshMessageActionFlags([message]);

  expect(calls).toBe(2);
  expect(message.isReplied).toBe(true);
  expect(message.isForwarded).toBe(false);
  expect(message.lastVerbAt).toBeNull();
});

test("FindItem с пустой оболочкой Categories не затирает локальные метки", () => {
  let { message } = createMessage();
  message.tags.replaceAll([{ name: "Переписка (мы в копии)", color: "#00aa00" } as any]);

  message.setFlags({ Categories: { String: [] } }, "full");

  expect(message.tags.contents.map(tag => tag.name)).toEqual(["Переписка (мы в копии)"]);
});

test("GetItem без Categories очищает метки при полном ответе", () => {
  let { message } = createMessage();
  message.tags.replaceAll([{ name: "Старая метка", color: "#00aa00" } as any]);

  message.setFlags({ IsRead: true }, "full");

  expect(message.tags.contents).toEqual([]);
});

test("письмо с пустой оболочкой Categories остаётся в очереди backfill", async () => {
  let { account, folder, message } = createMessage();
  (account as any).callOWA = async () => ({
    Items: [{
      ItemId: { Id: message.itemID },
      Categories: { String: [] },
      ExtendedProperty: [{
        ExtendedFieldURI: { PropertyTag: IconIndexPidTag },
        Value: String(IconIndex.Replied),
      }],
    }],
  });

  await (folder as any).refreshMessageActionFlags([message]);

  expect(message.tags.isEmpty).toBe(true);
  expect(message.isReplied).toBe(true);
  expect((folder as any).actionFlagsCheckedIDs.has(message.itemID)).toBe(false);
});

test("категории подтягиваются позже через backfill", async () => {
  let { account, folder, message } = createMessage();
  let calls = 0;
  (account as any).callOWA = async () => {
    calls++;
    if (calls == 1) {
      return {
        Items: [{
          ItemId: { Id: message.itemID },
          Categories: { String: [] },
        }],
      };
    }
    return {
      Items: [{
        ItemId: { Id: message.itemID },
        Categories: { String: ["Переписка (мы в копии)"] },
      }],
    };
  };

  await (folder as any).refreshMessageActionFlags([message]);
  expect(message.tags.isEmpty).toBe(true);
  expect((folder as any).actionFlagsCheckedIDs.has(message.itemID)).toBe(false);

  await (folder as any).refreshMessageActionFlags([message]);
  expect(message.tags.contents.map(tag => tag.name)).toEqual(["Переписка (мы в копии)"]);
  expect((folder as any).actionFlagsCheckedIDs.has(message.itemID)).toBe(true);
});
