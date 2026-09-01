// @vitest-environment happy-dom

import { afterEach, describe, expect, test } from "vitest";
import { mount, tick, unmount } from "svelte";
import EmojiSelector from "../../../frontend/Chat/Emoji/EmojiSelector.svelte";
import GraphicSelector from "../../../frontend/Chat/Emoji/GraphicSelector.svelte";

let mounted: ReturnType<typeof mount>[] = [];

afterEach(() => {
  for (let instance of mounted) {
    unmount(instance);
  }
  mounted = [];
  document.body.replaceChildren();
});

describe("emoji selector", () => {
  test("scrolls to a selected emoji group", async () => {
    let target = document.createElement("div");
    document.body.append(target);
    mounted.push(mount(EmojiSelector, { target, props: { searchTerm: null } }));
    await tick();

    let groups = [...target.querySelectorAll<HTMLElement>("[data-emoji-group]")];
    expect(groups.length).toBeGreaterThan(1);
    Object.defineProperty(groups[1], "offsetTop", { configurable: true, value: 420 });

    let scrollContainers = target.querySelectorAll<HTMLElement>(".scroll");
    Object.defineProperty(scrollContainers[1], "scrollTo", {
      configurable: true,
      value: ({ top }: { top: number }) => scrollContainers[1].scrollTop = top,
    });
    let categoryButtons = target.querySelectorAll<HTMLButtonElement>(".group-selector button");
    categoryButtons[1].click();

    expect(scrollContainers[1].scrollTop).toBe(420);
  });

  test("switches between emoji, GIF, and sticker modes", async () => {
    let target = document.createElement("div");
    document.body.append(target);
    mounted.push(mount(GraphicSelector, { target, props: { isOpen: true } }));
    await tick();

    let emojiButton = target.querySelector<HTMLButtonElement>('button[title="Emoji"]');
    let gifButton = target.querySelector<HTMLButtonElement>('button[title="GIF"]');
    let stickerButton = target.querySelector<HTMLButtonElement>('button[title="Sticker"]');
    expect(emojiButton).not.toBeNull();
    expect(gifButton).not.toBeNull();
    expect(stickerButton).not.toBeNull();
    expect(emojiButton?.classList.contains("selected")).toBe(true);

    gifButton?.click();
    await tick();
    expect(gifButton?.classList.contains("selected")).toBe(true);

    stickerButton?.click();
    await tick();
    expect(stickerButton?.classList.contains("selected")).toBe(true);
  });
});
