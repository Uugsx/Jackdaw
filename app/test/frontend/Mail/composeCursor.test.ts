// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Footer } from "../../../frontend/Shared/Editor/Footer";
import { SplitBlockquote } from "../../../frontend/Shared/Editor/SplitBlockquote";
import { focusComposeTypingArea } from "../../../frontend/Mail/Composer/composeCursor";

function createComposeEditor(content: string) {
  let element = document.createElement("div");
  document.body.appendChild(element);
  let editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({ bold: false, italic: false, strike: false }),
      SplitBlockquote,
      Footer,
    ],
    content,
  });
  return { editor, element };
}

function selectionBeforeFooter(editor: Editor): boolean {
  let footerPos: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "footer") {
      footerPos = pos;
      return false;
    }
  });
  expect(footerPos).not.toBeNull();
  return editor.state.selection.from < footerPos!;
}

describe("focusComposeTypingArea", () => {
  it("places caret before signature on reply below quote", () => {
    let html = `<p></p><p></p><footer class="signature"><p>Signature</p></footer>
      <p class="quote-header">On Mon wrote:</p>
      <blockquote><p>Original</p></blockquote>`;
    let { editor, element } = createComposeEditor(html);
    focusComposeTypingArea(editor);
    expect(selectionBeforeFooter(editor)).toBe(true);
    editor.destroy();
    element.remove();
  });

  it("places caret before signature when quote is above", () => {
    let html = `<blockquote><p>Original</p></blockquote><p></p><p></p>
      <footer class="signature"><p>Signature</p></footer>`;
    let { editor, element } = createComposeEditor(html);
    focusComposeTypingArea(editor);
    expect(selectionBeforeFooter(editor)).toBe(true);
    editor.destroy();
    element.remove();
  });

  it("places caret before signature when quote is disabled", () => {
    let html = `<p></p><footer class="signature"><p>Signature</p></footer>`;
    let { editor, element } = createComposeEditor(html);
    focusComposeTypingArea(editor);
    expect(selectionBeforeFooter(editor)).toBe(true);
    editor.destroy();
    element.remove();
  });
});
