// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Footer } from "../../../frontend/Shared/Editor/Footer";
import { SplitBlockquote } from "../../../frontend/Shared/Editor/SplitBlockquote";
import { focusComposeTypingArea } from "../../../frontend/Mail/Composer/composeCursor";
import { editorHasNewComposeText, topLevelComposeText } from "../../../frontend/Mail/Composer/composeBody";

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

function replyHtmlWithQuote(quoteInner = "<p>Original</p>") {
  return `<p></p><p></p><footer class="signature"><p>Signature</p></footer>
    <blockquote cite="mid:test">${quoteInner}</blockquote>`;
}

describe("composeBody helpers", () => {
  it("ignores quoted original text when measuring reply text", () => {
    expect(topLevelComposeText(replyHtmlWithQuote("<p>Original body</p>"))).toBe("");
    expect(topLevelComposeText(`<p>Reply</p>${replyHtmlWithQuote().slice(replyHtmlWithQuote().indexOf("<footer"))}`))
      .toBe("Reply");
  });

  it("detects editor text typed before composer load finishes", () => {
    let { editor, element } = createComposeEditor(replyHtmlWithQuote());
    focusComposeTypingArea(editor);
    editor.commands.insertContent("User reply before load finishes");

    expect(editorHasNewComposeText(editor.getHTML(), replyHtmlWithQuote())).toBe(true);

    editor.destroy();
    element.remove();
  });
});
