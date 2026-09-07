import { EventEmitter } from "node:events";
import { expect, test, vi } from "vitest";
import type { BrowserWindow, IpcMain } from "electron";
import { connectOAuth2Window } from "../../../desktop/src/main/oauth2Window";

function makeWindow() {
  let destroyed = false;
  const webContents = Object.assign(new EventEmitter(), {
    isDestroyed: () => destroyed,
    send: vi.fn(),
  });
  const window = Object.assign(new EventEmitter(), {
    webContents,
    isDestroyed: () => destroyed,
    close: vi.fn(() => {
      destroyed = true;
      window.emit("closed");
    }),
  });
  return window;
}

test("повторные входы не накапливают подписки и ссылки на закрытые окна", () => {
  const parent = makeWindow();
  const ipc = new EventEmitter();
  for (let i = 0; i < 20; i++) {
    const child = makeWindow();
    connectOAuth2Window(parent as unknown as BrowserWindow, child as unknown as BrowserWindow, String(i), ipc as IpcMain);
    child.close();
    expect(ipc.listenerCount("oauth2-close")).toBe(0);
    expect(parent.listenerCount("closed")).toBe(0);
    expect(child.webContents.listenerCount("did-navigate")).toBe(0);
  }
});

test("закрывает только окно нужного входа и проверяет отправителя", () => {
  const parent = makeWindow();
  const first = makeWindow();
  const second = makeWindow();
  const ipc = new EventEmitter();
  connectOAuth2Window(parent as unknown as BrowserWindow, first as unknown as BrowserWindow, "first", ipc as IpcMain);
  connectOAuth2Window(parent as unknown as BrowserWindow, second as unknown as BrowserWindow, "second", ipc as IpcMain);
  ipc.emit("oauth2-close", { sender: second.webContents }, "first");
  expect(first.close).not.toHaveBeenCalled();
  ipc.emit("oauth2-close", { sender: parent.webContents }, "first");
  expect(first.close).toHaveBeenCalledOnce();
  expect(second.close).not.toHaveBeenCalled();
  second.webContents.emit("did-navigate", {}, "https://example.test/callback");
  expect(parent.webContents.send).toHaveBeenCalledWith("oauth2-navigate", "second", "https://example.test/callback");
  parent.close();
  expect(second.close).toHaveBeenCalledOnce();
  expect(ipc.listenerCount("oauth2-close")).toBe(0);
});
