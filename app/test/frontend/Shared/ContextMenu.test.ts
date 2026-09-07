// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { buildContextMenu, type ContextInfo } from "../../../frontend/Shared/ContextMenu";

function createContext(overrides: Partial<ContextInfo> = {}): ContextInfo {
  return {
    mediaType: "none",
    menuSourceType: "mouse",
    formControlType: "text-area",
    hasImageContents: false,
    isLink: false,
    isText: false,
    selectionText: "",
    titleText: "",
    altText: "",
    selectionStartOffset: 0,
    selectionRect: null,
    x: 0,
    y: 0,
    linkURL: "",
    linkText: "",
    pageURL: "",
    frameURL: "",
    srcURL: "",
    suggestedFilename: "",
    refererPolicy: null,
    frameCharset: "utf-8",
    spellcheckEnabled: true,
    misspelledWord: "teh",
    dictionarySuggestions: ["the", "ten", "the"],
    mediaFlags: {
      inError: false,
      isPaused: false,
      isMuted: false,
      hasAudio: false,
      isLooping: false,
      isControlsVisible: false,
      canToggleControls: false,
      canPrint: false,
      canSave: false,
      canShowPictureInPicture: false,
      isShowingPictureInPicture: false,
      canRotate: false,
      canLoop: false,
    },
    isEditable: true,
    editFlags: {
      canUndo: false,
      canRedo: false,
      canCut: true,
      canCopy: false,
      canPaste: true,
      canDelete: false,
      canSelectAll: true,
      canEditRichly: true,
    },
    ...overrides,
  };
}

describe("spellcheck context menu", () => {
  it("shows unique suggestions without requiring a text selection", async () => {
    let context = createContext();
    let webview = {
      replaceMisspelling: vi.fn(),
      session: { addWordToSpellCheckerDictionary: vi.fn() },
    };

    let menu = await buildContextMenu(context, webview);

    expect(menu.contents.slice(0, 3).map(item => item.label)).toEqual([
      "the",
      "ten",
      "Add word to dictionary",
    ]);

    await menu.contents[0].action();
    expect(webview.replaceMisspelling).toHaveBeenCalledWith("the");
  });
});
