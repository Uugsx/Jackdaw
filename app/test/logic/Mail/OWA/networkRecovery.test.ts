import "../../../../logic/app";
import { appGlobal } from "../../../../logic/app";
import { SpecialFolder } from "../../../../logic/Mail/Folder";
import { OWAAccount } from "../../../../logic/Mail/OWA/OWAAccount";
import { DummyMailStorage } from "../../../../logic/Mail/Store/DummyMailStorage";
import { ArrayColl } from "svelte-collections";
import { expect, test } from "vitest";

test("помечает потерю сети временной и запускает восстановление OWA", async () => {
  appGlobal.remoteApp = {
    OWA: {
      fetchJSON: async () => {
        throw new Error("net::ERR_INTERNET_DISCONNECTED");
      },
    },
  };
  let account = new OWAAccount();
  account.storage = new DummyMailStorage();
  (account as any).hasLoggedIn = true;
  let recoveryCount = 0;
  account.recoverAfterNetworkRestored = async () => {
    recoveryCount++;
  };

  let error: any;
  try {
    await account.callOWAShared("https://owa.example.test/service.svc", {
      method: "POST",
    });
  } catch (ex) {
    error = ex;
  }
  await Promise.resolve();

  expect(error?.message).toBe("net::ERR_INTERNET_DISCONNECTED");
  expect(error?.doNotShow).toBe(true);
  expect(recoveryCount).toBe(1);
});

test("после восстановления сети синхронизирует Inbox и запускает уведомления", async () => {
  appGlobal.remoteApp = { OWA: {} };
  let account = new OWAAccount();
  account.storage = new DummyMailStorage();
  (account as any).hasLoggedIn = true;
  let originalOnline = navigator.onLine;
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });

  let folder = account.newFolder();
  folder.id = "inbox";
  folder.name = "Входящие";
  folder.specialFolder = SpecialFolder.Inbox;
  account.rootFolders.add(folder);
  account.folderMap.set(folder.id, folder);
  let syncCount = 0;
  folder.syncRecentArrivals = async () => {
    syncCount++;
    return new ArrayColl();
  };
  let pollingCount = 0;
  let notificationCount = 0;
  let sharedPollingCount = 0;
  (account as any).startPolling = () => pollingCount++;
  (account as any).startNotifications = () => notificationCount++;
  (account as any).pollDependentSharedFolders = async () =>
    sharedPollingCount++;

  try {
    await account.recoverAfterNetworkRestored();
  } finally {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: originalOnline,
    });
  }

  expect(syncCount).toBe(1);
  expect(pollingCount).toBe(1);
  expect(notificationCount).toBe(1);
  expect(sharedPollingCount).toBe(1);
});
