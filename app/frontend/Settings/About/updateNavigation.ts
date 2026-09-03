import { openSettingsCategoryByID } from "../Window/CategoriesUtils";

let pendingAutoUpdateFlow = false;

/** Open Settings → About so the user can review and install the update manually. */
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
