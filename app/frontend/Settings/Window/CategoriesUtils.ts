import type { SettingsCategory } from "../SettingsCategory";
import { accountSettings, settingsCategories } from "../SettingsCategory";
import type { JackdawApp } from "../../AppsBar/JackdawApp";
import type { Account } from "../../../logic/Abstract/Account";
import { settingsApp } from "./SettingsJackdawApp";
import { openApp } from "../../AppsBar/selectedApp";
import { selectedAccount, selectedCategory } from "./selected";
import { assert } from "../../../logic/util/util";

export function getAllSettingsCategories(): SettingsCategory[] {
  let results: SettingsCategory[] = []
  function processCat(cat: SettingsCategory) {
    results.push(cat);
    for (let subCat of cat.subCategories) {
      processCat(subCat);
    }
  }
  for (let cat of settingsCategories) {
    processCat(cat);
  }
  return results;
}

export function getSettingsCategoryByID(id: string): SettingsCategory {
  return getAllSettingsCategories().find(cat => cat.id == id);
}

export function getSettingsCategoryForApp(app: JackdawApp) {
  return getAllSettingsCategories().find(cat => cat.forApp == app);
}

export function openSettingsCategoryForApp(app: JackdawApp) {
  openSettingsCategory(getSettingsCategoryForApp(app));
}

export function openSettingsCategoryByID(id: string) {
  openSettingsCategory(getSettingsCategoryByID(id));
}

export function openSettingsCategory(cat: SettingsCategory) {
  selectedCategory.set(cat);
  openApp(settingsApp, {});
}

export function getSettingsCategoryForAccount(account: Account, categoryID = "main") {
  return accountSettings.find(cat => account instanceof cat.type &&
    cat.id == categoryID || categoryID == "main" && cat.isMain);
}

export function openSettingsCategoryForAccount(account: Account, categoryID = "main") {
  let cat = getSettingsCategoryForAccount(account, categoryID);
  assert(cat, "Account not found in settings");
  selectedAccount.set(account);
  selectedCategory.set(cat);
  // TODO Mobile? goTo(URLPart`/settings/account/${account.id}`, { category, account }); or goTo(URLPart`/settings/account/${account.id}/${category.id}`, { category, account });
  openApp(settingsApp, { category: cat, account: account });
}
