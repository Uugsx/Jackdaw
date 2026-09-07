// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  applyFormatPainter,
  captureFormatPainter,
  captureFormatPainterFromRange,
} from "../../../frontend/Shared/Editor/formatPainter";

function createEditor(content: string) {
  let element = document.createElement("div");
  document.body.appendChild(element);
  let editor = new Editor({
    element,
    extensions: [StarterKit, TextStyle, FontFamily],
    content,
  });
  return { editor, element };
}

describe("копирование форматирования", () => {
  it("переносит inline-форматирование на выбранный текст", () => {
    let { editor, element } = createEditor("<p>Source</p><p>Target</p>");
    editor.commands.setTextSelection({ from: 1, to: 7 });
    editor.chain().focus().toggleBold().setFontFamily("Arial").run();
    let snapshot = captureFormatPainter(editor);

    editor.commands.setTextSelection({ from: 9, to: 15 });
    applyFormatPainter(editor, snapshot);

    expect(editor.getHTML()).toMatch(/<span style="font-family: Arial;"><strong>Target<\/strong><\/span>/);
    editor.destroy();
    element.remove();
  });

  it("читает форматирование из выделения в обычном HTML-редакторе", () => {
    let { editor, element } = createEditor("<p>Target</p>");
    let quote = document.createElement("div");
    quote.className = "compose-quote-html";
    quote.innerHTML = '<p><span style="font-family: Arial;"><strong>Source</strong></span></p>';
    document.body.appendChild(quote);
    let sourceText = quote.querySelector("strong")?.firstChild;
    expect(sourceText).toBeTruthy();
    let range = document.createRange();
    range.setStart(sourceText!, 0);
    range.setEnd(sourceText!, sourceText!.textContent?.length ?? 0);

    let snapshot = captureFormatPainterFromRange(editor, range);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.marks.map(mark => mark.name)).toContain("bold");
    expect(snapshot?.marks.map(mark => mark.name)).toContain("textStyle");
    editor.commands.setTextSelection({ from: 1, to: 7 });
    applyFormatPainter(editor, snapshot!);

    expect(editor.getHTML()).toMatch(/<span style="font-family: Arial;"><strong>Target<\/strong><\/span>/);
    editor.destroy();
    element.remove();
    quote.remove();
  });
});
