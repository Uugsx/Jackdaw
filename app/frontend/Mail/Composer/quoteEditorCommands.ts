/** Commands that can be applied to the native contenteditable quote editor. */
export type QuoteEditorCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "foreColor"
  | "hiliteColor"
  | "backColor"
  | "fontName"
  | "fontSize"
  | "lineHeight"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "formatBlock"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "justifyFull"
  | "indent"
  | "outdent"
  | "removeFormat"
  | "undo"
  | "redo"
  | "cut"
  | "copy"
  | "paste"
  | "insertText"
  | "insertHTML"
  | "createLink"
  | "unlink";

export type QuoteEditorHandle = {
  captureSelection: () => Range | null;
  applyCommand: (command: QuoteEditorCommand, value?: string | null, range?: Range | null) => boolean;
};

function containsNode(root: HTMLElement, node: Node | null): boolean {
  return !!node && (node === root || root.contains(node));
}

/** Capture the current native selection only when it belongs to this quote. */
export function captureQuoteSelection(root: HTMLElement): Range | null {
  let selection = document.getSelection();
  if (!selection?.rangeCount) {
    return null;
  }
  let range = selection.getRangeAt(0);
  if (!containsNode(root, range.startContainer) || !containsNode(root, range.endContainer)) {
    return null;
  }
  return range.cloneRange();
}

function restoreQuoteSelection(root: HTMLElement, range: Range): boolean {
  if (!containsNode(root, range.startContainer) || !containsNode(root, range.endContainer)) {
    return false;
  }
  root.focus({ preventScroll: true });
  let selection = document.getSelection();
  if (!selection) {
    return false;
  }
  selection.removeAllRanges();
  selection.addRange(range.cloneRange());
  return true;
}

function quoteBlocksForRange(root: HTMLElement, range: Range): HTMLElement[] {
  let blocks = Array.from(root.querySelectorAll<HTMLElement>(
    "p, div, li, h1, h2, h3, h4, h5, h6, blockquote, td, th",
  )).filter(block => {
    try {
      return range.intersectsNode(block);
    } catch {
      return false;
    }
  });
  if (blocks.length) {
    return blocks;
  }
  let element: HTMLElement | null = range.startContainer instanceof HTMLElement
    ? range.startContainer
    : range.startContainer.parentElement;
  while (element && element !== root) {
    if (/^(P|DIV|LI|H[1-6]|BLOCKQUOTE|TD|TH)$/.test(element.tagName)) {
      return [element];
    }
    element = element.parentElement;
  }
  return [];
}

function applyQuoteLineHeight(root: HTMLElement, range: Range, value?: string | null): boolean {
  let blocks = quoteBlocksForRange(root, range);
  if (!blocks.length) {
    return false;
  }
  for (let block of blocks) {
    if (value) {
      block.style.lineHeight = value;
    } else {
      block.style.removeProperty("line-height");
    }
  }
  root.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

/** Apply a browser editing command without transferring focus to the reply editor. */
export function applyQuoteCommand(
  root: HTMLElement,
  command: QuoteEditorCommand,
  value?: string | null,
  range?: Range | null,
): boolean {
  let selectionRange = range?.cloneRange() ?? captureQuoteSelection(root);
  if (!selectionRange || !restoreQuoteSelection(root, selectionRange)) {
    return false;
  }
  if (command === "lineHeight") {
    return applyQuoteLineHeight(root, selectionRange, value);
  }
  if (typeof document.execCommand !== "function") {
    return false;
  }

  let changed = false;
  try {
    changed = document.execCommand(command, false, value ?? null);
  } catch {
    changed = false;
  }
  if (!changed && command === "hiliteColor") {
    try {
      changed = document.execCommand("backColor", false, value ?? null);
    } catch {
      changed = false;
    }
  }
  if (changed) {
    // Chromium normally emits this event itself. Dispatching it as well covers
    // commands that change the DOM without emitting input in an Electron build.
    root.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return changed;
}
