import type { Editor } from "@tiptap/core";

/**
 * Place the caret where the user should type in a compose/reply window:
 * in the empty area before the signature footer, or after a leading quote.
 */
export function focusComposeTypingArea(editor: Editor): void {
  const { doc } = editor.state;
  let footerPos: number | null = null;
  let blockquoteEnd: number | null = null;

  doc.descendants((node, pos) => {
    if (node.type.name === "footer" && footerPos === null) {
      footerPos = pos;
    }
    if (node.type.name === "blockquote") {
      blockquoteEnd = pos + node.nodeSize;
    }
  });

  if (footerPos != null) {
    if (footerPos === 0) {
      editor.chain().focus().insertContentAt(0, "<p></p>").setTextSelection(1).scrollIntoView().run();
      return;
    }
    editor.chain().focus().setTextSelection(footerPos - 1).scrollIntoView().run();
    return;
  }

  if (blockquoteEnd != null) {
    editor.chain().focus().setTextSelection(blockquoteEnd).scrollIntoView().run();
    return;
  }

  editor.commands.focus("start");
}
