// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  currentFontSize,
  fontSizeToCSS,
  parseFontSizeFromHTML,
  normalizeSignatureHTML,
  signatureEditorExtensions,
  textColorForHighlight,
} from "../../../frontend/Shared/Editor/composeEditorExtensions";

function createEditor(content: string) {
  let element = document.createElement("div");
  document.body.appendChild(element);
  let editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({ bold: false, italic: false, strike: false }),
      ...signatureEditorExtensions,
    ],
    content,
  });
  return { editor, element };
}

describe("font size parsing", () => {
  it("keeps round pt sizes like 10 and 20", () => {
    expect(parseFontSizeFromHTML("10pt")).toBe("10");
    expect(parseFontSizeFromHTML("20pt")).toBe("20");
    expect(parseFontSizeFromHTML("10")).toBe("10");
    expect(fontSizeToCSS(parseFontSizeFromHTML("10pt"))).toBe("10pt");
  });

  it("maps html font size index 2 to 10pt", () => {
    expect(parseFontSizeFromHTML("2")).toBe("10");
  });
});

describe("text highlight", () => {
  it("picks dark text on yellow fill", () => {
    expect(textColorForHighlight("#FFFF00")).toBe("#000000");
  });

  it("picks light text on dark fill", () => {
    expect(textColorForHighlight("#000080")).toBe("#FFFFFF");
  });
});

describe("signature font size", () => {
  it("registers fontSize on textStyle mark", () => {
    let { editor, element } = createEditor("<p>Hello</p>");
    expect(Object.keys(editor.schema.marks.textStyle.attrs)).toContain("fontSize");
    editor.destroy();
    element.remove();
  });

  it("applies font size 10 to selected text", () => {
    let { editor, element } = createEditor("<p>Hello world</p>");
    editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(editor.commands.setFontSize("10")).toBe(true);
    expect(editor.getHTML()).toMatch(/10pt/i);
    expect(currentFontSize(editor)).toBe("10");
    editor.destroy();
    element.remove();
  });

  it("applies font size 20 through toolbar chain", () => {
    let { editor, element } = createEditor("<p>Hello world</p>");
    let saved = { from: 1, to: 6 };
    expect(editor.chain().focus().setTextSelection(saved).setFontSize("20").run()).toBe(true);
    expect(editor.getHTML()).toMatch(/20pt/i);
    editor.destroy();
    element.remove();
  });

  it("applies font size to outlook-like table signature text", () => {
    let raw = `<table><tbody><tr>
      <td style="font-size:11.0pt;font-family:Arial,sans-serif">
        <p>ООО «Смарт ДС Рус»</p>
      </td></tr></tbody></table>`;
    let normalized = normalizeSignatureHTML(raw)!;
    let { editor, element } = createEditor(normalized);
    let textPos = editor.state.doc.textContent.indexOf("ООО");
    expect(textPos).toBeGreaterThanOrEqual(0);
    let from = textPos + 1;
    let to = from + "ООО «Смарт ДС Рус»".length;
    editor.commands.setTextSelection({ from, to });
    expect(editor.commands.setFontSize("14")).toBe(true);
    expect(editor.getHTML()).toMatch(/14pt/i);
    editor.destroy();
    element.remove();
  });

  it("normalizes outlook font tags", () => {
    let normalized = normalizeSignatureHTML('<p><font size="2">Company</font></p>');
    expect(normalized).toContain("10pt");
  });
});
