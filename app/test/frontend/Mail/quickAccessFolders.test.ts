// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { tick, mount, unmount } from "svelte";
import { ArrayColl } from "svelte-collections";

let QuickAccessFolders: any;
let favoriteFoldersEpoch: any;
let watchMailFolderTrees: any;
let enumerateMailAccounts: any;
let mounted: ReturnType<typeof mount>[] = [];
let localStorageValues = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
  },
});

beforeAll(async () => {
  await import("../../../logic/app");
  QuickAccessFolders = (
    await import("../../../frontend/Mail/LeftPane/QuickAccessFolders.svelte")
  ).default;
  favoriteFoldersEpoch = (await import("../../../frontend/Mail/LeftPane/favoriteFolders")).favoriteFoldersEpoch;
  watchMailFolderTrees = (await import("../../../frontend/Mail/LeftPane/favoriteFolders")).watchMailFolderTrees;
  enumerateMailAccounts = (await import("../../../frontend/Mail/LeftPane/favoriteFolders")).enumerateMailAccounts;
});

afterEach(() => {
  for (let instance of mounted) {
    unmount(instance);
  }
  mounted = [];
  favoriteFoldersEpoch.set(0);
  localStorageValues.clear();
  document.body.replaceChildren();
});

describe("QuickAccessFolders", () => {
  test("refreshes a favorite after its folder appears", async () => {
    let folders = new ArrayColl<any>();
    let account: any = {
      id: "account-1",
      name: "Test account",
      protocol: "owa",
      dependentAccounts: () => new ArrayColl(),
      findSpecialFolder: () => null,
      getAllFolders: () => folders,
    };
    let accounts = new ArrayColl<any>();
    accounts.add(account);
    localStorageValues.set("mail.folders.favorites", JSON.stringify([{
      accountId: account.id,
      folderId: "folder-1",
      folderPath: "Inbox",
    }]));

    let target = document.createElement("div");
    document.body.append(target);
    mounted.push(mount(QuickAccessFolders, {
      target,
      props: { accounts, account, selectedFolder: null },
    }));

    expect(target.querySelector("button.quick-folder")).toBeNull();

    let folder: any = {
      id: "folder-1",
      name: "Inbox",
      fullPath: "Inbox",
      account,
      countUnread: 0,
      countNewArrived: 0,
      subscribe(observer: (folder: any, property: string | null, oldValue: any) => void) {
        observer(this, null, null);
        return () => {};
      },
    };
    folders.add(folder);
    favoriteFoldersEpoch.update(value => value + 1);
    await tick();

    expect(target.querySelector("button.quick-folder")).not.toBeNull();
  });

  test("refreshes a favorite when the accounts collection appears", async () => {
    let folders = new ArrayColl<any>();
    let account: any = {
      id: "account-2",
      name: "Test account",
      protocol: "owa",
      dependentAccounts: () => new ArrayColl(),
      findSpecialFolder: () => null,
      getAllFolders: () => folders,
    };
    let accounts = new ArrayColl<any>();
    localStorageValues.set("mail.folders.favorites", JSON.stringify([{
      accountId: account.id,
      folderId: "folder-2",
      folderPath: "Inbox",
    }]));

    let folder: any = {
      id: "folder-2",
      name: "Inbox",
      fullPath: "Inbox",
      account,
      countUnread: 0,
      countNewArrived: 0,
      subscribe(observer: (folder: any, property: string | null, oldValue: any) => void) {
        observer(this, null, null);
        return () => {};
      },
    };
    folders.add(folder);
    let target = document.createElement("div");
    document.body.append(target);
    mounted.push(mount(QuickAccessFolders, {
      target,
      props: { accounts, account, selectedFolder: null },
    }));

    expect(target.querySelector("button.quick-folder")).toBeNull();

    accounts.add(account);
    await tick();

    expect(target.querySelector("button.quick-folder")).not.toBeNull();
  });

  test("enumerates mail accounts inside the all-accounts entry", () => {
    let account: any = {
      id: "account-3",
      protocol: "owa",
      dependentAccounts: () => new ArrayColl(),
    };
    let allAccounts: any = {
      id: "all-accounts",
      protocol: "all",
      accounts: new ArrayColl([account]),
      dependentAccounts: () => new ArrayColl(),
    };

    expect(enumerateMailAccounts(new ArrayColl([allAccounts]))).toEqual([account]);
  });

  test("does not stop tracking when an account has non-mail dependents", () => {
    let rootFolders = new ArrayColl<any>();
    let calendar = {
      id: "calendar-1",
      protocol: "calendar-owa",
      dependentAccounts: () => new ArrayColl(),
    };
    let account: any = {
      id: "account-1",
      protocol: "owa",
      rootFolders,
      dependentAccounts: () => new ArrayColl([calendar]),
      subscribe(observer: () => void) {
        observer();
        return () => {};
      },
    };
    let accounts = new ArrayColl<any>([account]);
    let changes = 0;
    let stop = watchMailFolderTrees(accounts, () => changes++);

    rootFolders.add({
      id: "folder-1",
      subFolders: new ArrayColl(),
    });

    expect(changes).toBeGreaterThan(1);
    stop();
  });

  test("notifies when a mail account is added after tracking starts", () => {
    let accounts = new ArrayColl<any>();
    let changes = 0;
    let stop = watchMailFolderTrees(accounts, () => changes++);
    let account: any = {
      id: "account-4",
      protocol: "owa",
      rootFolders: new ArrayColl(),
      dependentAccounts: () => new ArrayColl(),
      subscribe() {
        return () => {};
      },
    };

    accounts.add(account);

    expect(changes).toBeGreaterThan(1);
    stop();
  });
});
