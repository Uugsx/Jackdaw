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

test("запрос флагов включает стрелку и время действия", () => {
  let request = owaGetMessageActionFlagsRequest(["message-1"]);
  let properties = request.Body.ItemShape.AdditionalProperties;

  expect(properties.map(property => property.PropertyTag)).toEqual([
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
