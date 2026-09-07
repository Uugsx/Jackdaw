// @vitest-environment happy-dom

import "../../../logic/app";
import { EventEmitter } from "node:events";
import { afterEach, expect, test, vi } from "vitest";
import { OAuth2Window } from "../../../logic/Auth/UI/OAuth2Window";
import { OAuth2 } from "../../../logic/Auth/OAuth2";

afterEach(() => vi.restoreAllMocks());

function setup() {
  const ipc = Object.assign(new EventEmitter(), { send: vi.fn() });
  const auth = new OAuth2(null, "https://example.test/token", "https://example.test/login",
    "https://example.test/callback", "mail", "test-client");
  vi.spyOn(auth, "getAuthURL").mockResolvedValue("https://example.test/login");
  vi.spyOn(auth, "isAuthDoneURL").mockResolvedValue(true);
  vi.spyOn(auth, "getAuthCodeFromDoneURL").mockReturnValue("code");
  const open = vi.spyOn(window, "open").mockReturnValue({} as Window);
  vi.stubGlobal("electron", { ipcRenderer: ipc });
  const login = new OAuth2Window(auth);
  return { ipc, auth, open, login };
}

afterEach(() => vi.unstubAllGlobals());

test("успешный вход удаляет подписки и закрывает нужное окно", async () => {
  const { ipc, open, login } = setup();
  const result = login.login();
  await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
  const id = open.mock.calls[0][1];
  ipc.emit("oauth2-navigate", {}, "other", "https://example.test/callback");
  expect(ipc.send).not.toHaveBeenCalled();
  ipc.emit("oauth2-navigate", {}, id, "https://example.test/callback");
  await expect(result).resolves.toBe("code");
  expect(ipc.send).toHaveBeenCalledWith("oauth2-close", id);
  expect(ipc.listenerCount("oauth2-navigate")).toBe(0);
  expect(ipc.listenerCount("oauth2-close")).toBe(0);
});

test.each(["abort", "closed", "invalid-code", "blocked-popup"])("очищает подписки при %s", async scenario => {
  const { ipc, auth, open, login } = setup();
  if (scenario === "blocked-popup") {
    open.mockReturnValue(null);
  }
  const result = login.login();
  const rejected = expect(result).rejects.toThrow();
  await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
  const id = open.mock.calls[0][1];
  if (scenario === "abort") {
    login.abort();
  } else if (scenario === "closed") {
    ipc.emit("oauth2-close", {}, id);
  } else if (scenario === "invalid-code") {
    vi.mocked(auth.getAuthCodeFromDoneURL).mockImplementation(() => {
      throw new Error("Некорректный ответ авторизации");
    });
    ipc.emit("oauth2-navigate", {}, id, "https://example.test/callback");
  }
  await rejected;
  expect(ipc.listenerCount("oauth2-navigate")).toBe(0);
  expect(ipc.listenerCount("oauth2-close")).toBe(0);
  if (scenario === "closed") {
    expect(ipc.send).not.toHaveBeenCalled();
  } else {
    expect(ipc.send).toHaveBeenCalledWith("oauth2-close", id);
  }
});

test("отмена во время подготовки URL не открывает окно позднее", async () => {
  const { ipc, auth, open, login } = setup();
  let finishURL: (url: string) => void;
  vi.mocked(auth.getAuthURL).mockImplementation(() => new Promise(resolve => {
    finishURL = resolve;
  }));
  const result = login.login();
  const rejected = expect(result).rejects.toThrow();
  await vi.waitFor(() => expect(auth.getAuthURL).toHaveBeenCalledOnce());
  login.abort();
  finishURL("https://example.test/login");
  await rejected;
  await Promise.resolve();
  expect(open).not.toHaveBeenCalled();
  expect(ipc.listenerCount("oauth2-navigate")).toBe(0);
});
