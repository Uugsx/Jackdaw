import { File } from "../../logic/Files/File";
import type { Directory } from "../../logic/Files/Directory";
import { selectedFile, selectedFiles } from "./selected";
import { assert } from "../../logic/util/util";
import { gt } from "../../l10n/l10n";
import { ArrayColl } from "svelte-collections";
import { get } from "svelte/store";

const kFileDragType = "file/drag-ids";

export function onDragStartFile(event: DragEvent, file: File) {
  if (!event.dataTransfer) {
    return;
  }
  selectedFile.set(file);
  let files = selectedFiles.contains(file)
    ? selectedFiles.contents.filter((item): item is File => item instanceof File)
    : [file];
  event.dataTransfer.setData(kFileDragType, JSON.stringify(files.map(f => f.id)));
  event.dataTransfer.effectAllowed = "copyMove";
}

export async function onDropFile(event: DragEvent, folder: Directory) {
  event.preventDefault();
  let file = get(selectedFile);
  let fileIDsStr = event.dataTransfer?.getData(kFileDragType);
  if (!(file instanceof File) || !fileIDsStr) {
    return;
  }
  let fileIDs: unknown = JSON.parse(fileIDsStr);
  assert(Array.isArray(fileIDs) && fileIDs.length > 0 && fileIDs.every(id => typeof id == "string"),
    gt`Drag&drop failed: Selected file IDs don't match the drag data`);
  let files: File[];
  if (fileIDs.length == 1) {
    assert(fileIDs[0] == file.id, gt`Drag&drop failed: Selected file ID doesn't match the drag data`);
    files = [file];
  } else {
    let ids = new Set(fileIDs);
    files = selectedFiles.contents.filter((item): item is File => item instanceof File && ids.has(item.id));
    assert(ids.size == fileIDs.length && files.length == ids.size,
      gt`Drag&drop failed: Selected file IDs don't match the drag data`);
  }
  if (event.ctrlKey || event.metaKey) {
    await folder.copyFilesHere(new ArrayColl(files));
  } else {
    await folder.moveFilesHere(new ArrayColl(files));
  }
}

export async function onDragOverFile(event: DragEvent, folder: Directory) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = event.ctrlKey || event.metaKey ? "copy" : "move";
  }
}
