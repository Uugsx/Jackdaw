import "../../../logic/app";
import { beforeEach, expect, test, vi } from "vitest";
import { writable } from "svelte/store";
import { ArrayColl } from "svelte-collections";
import { File } from "../../../logic/Files/File";
import type { Directory } from "../../../logic/Files/Directory";

vi.mock("../../../frontend/Files/selected", () => ({
  selectedFile: writable(null),
  selectedFiles: new ArrayColl(),
}));

import { selectedFile, selectedFiles } from "../../../frontend/Files/selected";
import { onDragStartFile, onDropFile, onDragOverFile } from "../../../frontend/Files/drag";

beforeEach(() => {
  selectedFile.set(null);
  selectedFiles.clear();
});

function makeEvent() {
  const data = new Map<string, string>();
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? "",
      effectAllowed: "none",
      dropEffect: "none",
    },
    ctrlKey: false,
    metaKey: false,
  } as unknown as DragEvent;
}

function makeFile(path: string) {
  const file = new File();
  file.path = path;
  return file;
}

test("переносит выбранные файлы, включая имена с запятыми", async () => {
  const first = makeFile("/report,2026.txt");
  const second = makeFile("/notes.txt");
  selectedFiles.add(first);
  selectedFiles.add(second);
  const event = makeEvent();
  const moveFilesHere = vi.fn();
  onDragStartFile(event, first);
  await onDropFile(event, { moveFilesHere } as unknown as Directory);
  expect(moveFilesHere.mock.calls[0][0].contents).toEqual([first, second]);
});

test.each(["ctrlKey", "metaKey"])("копирует один файл при %s", async modifier => {
  const file = makeFile("/one.txt");
  const event = makeEvent();
  Object.defineProperty(event, modifier, { value: true });
  const copyFilesHere = vi.fn();
  onDragStartFile(event, file);
  await onDropFile(event, { copyFilesHere } as unknown as Directory);
  expect(copyFilesHere.mock.calls[0][0].contents).toEqual([file]);
});

test("отклоняет неполный набор файлов после изменения выделения", async () => {
  const first = makeFile("/one.txt");
  const second = makeFile("/two.txt");
  selectedFiles.add(first);
  selectedFiles.add(second);
  const event = makeEvent();
  onDragStartFile(event, first);
  selectedFiles.remove(second);
  const moveFilesHere = vi.fn();
  await expect(onDropFile(event, { moveFilesHere } as unknown as Directory)).rejects.toThrow();
  expect(moveFilesHere).not.toHaveBeenCalled();
});

test("игнорирует перетаскивание другого типа", async () => {
  const event = makeEvent();
  selectedFile.set(makeFile("/one.txt"));
  const moveFilesHere = vi.fn();
  event.dataTransfer.setData("message/drag-ids", "mail-id");
  await onDropFile(event, { moveFilesHere } as unknown as Directory);
  expect(moveFilesHere).not.toHaveBeenCalled();
});

test("возвращает режим перемещения после отпускания модификатора", async () => {
  const event = makeEvent();
  event.dataTransfer.dropEffect = "copy";
  await onDragOverFile(event, {} as Directory);
  expect(event.dataTransfer.dropEffect).toBe("move");
});
