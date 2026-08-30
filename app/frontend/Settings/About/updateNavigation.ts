import { openSettingsCategoryByID } from "../Window/CategoriesUtils";

let pendingAutoUpdateFlow = false;

/** Open Settings → About and run the update flow (check / download / install). */
export function openAboutForUpdate(): void {
  pendingAutoUpdateFlow = true;
  openSettingsCategoryByID("about");
}

export function consumeAboutUpdateFlow(): boolean {
  if (!pendingAutoUpdateFlow) {
    return false;
  }
  pendingAutoUpdateFlow = false;
  return true;
}
