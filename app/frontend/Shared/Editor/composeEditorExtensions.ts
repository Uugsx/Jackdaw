import { Extension } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, "") ?? null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) =>
        chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

/** Rich-text extensions for the mail compose editor (Outlook-style). */
export const composeEditorExtensions = [
  TextStyle,
  FontFamily.configure({
    types: ["textStyle"],
  }),
  FontSize,
  Color.configure({
    types: ["textStyle"],
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Underline,
  TextAlign.configure({
    types: ["heading", "paragraph"],
    alignments: ["left", "center", "right", "justify"],
  }),
  Table.configure({
    resizable: false,
    HTMLAttributes: {
      style: "border-collapse: collapse; width: 100%;",
    },
  }),
  TableRow,
  TableHeader,
  TableCell,
];

import { gt } from "../../../l10n/l10n";

/** Outlook-style defaults for new compose messages. */
export const composeDefaultFontFamily = "Aptos, Calibri, Arial, sans-serif";
export const composeDefaultFontSize = "11px";

export const composeFontFamilies = [
  { label: () => gt`System`, value: "" },
  { label: () => "Aptos", value: composeDefaultFontFamily },
  { label: () => "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: () => "Calibri", value: "Calibri, Arial, sans-serif" },
  { label: () => "Georgia", value: "Georgia, serif" },
  { label: () => "Times New Roman", value: "\"Times New Roman\", Times, serif" },
  { label: () => "Courier New", value: "\"Courier New\", Courier, monospace" },
];

export const composeFontSizes = ["10", "11", "12", "14", "16", "18", "20", "24"];

export const composeTextColors = [
  "#0B0F14",
  "#B45309",
  "#DC2626",
  "#2563EB",
  "#059669",
  "#7C3AED",
];

export const composeHighlightColors = [
  "#FEF08A",
  "#BBF7D0",
  "#BFDBFE",
  "#FBCFE8",
  "#E5E7EB",
];

export function currentTextStyle(editor: import("@tiptap/core").Editor) {
  return editor.getAttributes("textStyle") ?? {};
}

export function currentFontFamily(editor: import("@tiptap/core").Editor): string {
  return currentTextStyle(editor).fontFamily ?? "";
}

export function currentFontSize(editor: import("@tiptap/core").Editor): string {
  let size = currentTextStyle(editor).fontSize ?? "";
  return size.replace(/px$/i, "");
}

export function currentTextColor(editor: import("@tiptap/core").Editor): string {
  return currentTextStyle(editor).color ?? "#0B0F14";
}

export function currentHighlightColor(editor: import("@tiptap/core").Editor): string {
  return editor.getAttributes("highlight").color ?? composeHighlightColors[0];
}
