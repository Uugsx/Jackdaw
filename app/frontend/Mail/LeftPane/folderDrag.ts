import type { Folder } from "../../../logic/Mail/Folder";

export const kFolderDragMIME = "application/x-jackdaw-folder";

let draggedFolder: Folder | null = null;

export function startFolderDrag(folder: Folder): void {
  draggedFolder = folder;
}

export function getDraggedFolder(): Folder | null {
  return draggedFolder;
}

export function clearFolderDrag(folder?: Folder): void {
  if (!folder || draggedFolder == folder) {
    draggedFolder = null;
  }
}
