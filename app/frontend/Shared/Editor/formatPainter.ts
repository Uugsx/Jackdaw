import type { Editor } from "@tiptap/core";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import type { Mark, Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

export type FormatPainterSnapshot = {
  marks: Array<{ name: string; attrs: Record<string, any> }>;
  blockAttrs: Record<string, any>;
};

/** Captures inline marks and block formatting at the current editor position. */
export function captureFormatPainter(editor: Editor): FormatPainterSnapshot {
  let { state } = editor;
  let marks = (state.storedMarks ?? state.selection.$from.marks()).map(mark => ({
    name: mark.type.name,
    attrs: { ...mark.attrs },
  }));
  return {
    marks,
    blockAttrs: { ...state.selection.$from.parent.attrs },
  };
}

/** Captures formatting from a native contenteditable selection outside TipTap. */
export function captureFormatPainterFromRange(
  editor: Editor,
  range: Range,
): FormatPainterSnapshot | null {
  let parsed = ProseMirrorDOMParser.fromSchema(editor.schema).parse(cloneRangeWithContext(range));
  let sourceText: ProseMirrorNode | null = null;
  let sourceBlock: ProseMirrorNode | null = null;
  parsed.descendants(node => {
    if (!sourceText && node.isText) {
      sourceText = node;
    }
    if (!sourceBlock && node.isTextblock) {
      sourceBlock = node;
    }
  });
  if (!sourceText && !sourceBlock) {
    return null;
  }
  let marks = (sourceText?.marks ?? []).map(mark => ({
    name: mark.type.name,
    attrs: { ...mark.attrs },
  }));
  addComputedInlineFormatting(marks, range);
  return {
    marks,
    blockAttrs: sourceBlock ? { ...sourceBlock.attrs } : {},
  };
}

function addComputedInlineFormatting(
  marks: Array<{ name: string; attrs: Record<string, any> }>,
  range: Range,
): void {
  let element = range.startContainer instanceof Element
    ? range.startContainer
    : range.startContainer.parentElement;
  if (!element) {
    return;
  }
  let computed = getComputedStyle(element);
  let textStyleAttrs = {
    fontFamily: computed.fontFamily || null,
    fontSize: computed.fontSize || null,
    color: computed.color || null,
  };
  if (Object.values(textStyleAttrs).some(value => value)) {
    upsertMark(marks, "textStyle", textStyleAttrs);
  }
  let fontWeight = computed.fontWeight.toLowerCase();
  if (fontWeight === "bold" || fontWeight === "bolder" || parseInt(fontWeight, 10) >= 600) {
    upsertMark(marks, "bold", {});
  }
  if (computed.fontStyle === "italic" || computed.fontStyle === "oblique") {
    upsertMark(marks, "italic", {});
  }
  let textDecoration = `${computed.textDecorationLine} ${computed.textDecoration}`.toLowerCase();
  if (textDecoration.includes("underline")) {
    upsertMark(marks, "underline", {});
  }
  if (textDecoration.includes("line-through")) {
    upsertMark(marks, "strike", {});
  }
  let backgroundColor = computed.backgroundColor;
  if (backgroundColor && backgroundColor !== "transparent" && !/^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/i.test(backgroundColor)) {
    upsertMark(marks, "highlight", { color: backgroundColor });
  }
}

function upsertMark(
  marks: Array<{ name: string; attrs: Record<string, any> }>,
  name: string,
  attrs: Record<string, any>,
): void {
  let existing = marks.find(mark => mark.name === name);
  if (existing) {
    existing.attrs = { ...existing.attrs, ...attrs };
    return;
  }
  marks.push({ name, attrs });
}

function cloneRangeWithContext(range: Range): DocumentFragment {
  let fragment = range.cloneContents();
  let startElement = range.startContainer instanceof Element
    ? range.startContainer
    : range.startContainer.parentElement;
  let ancestors: Element[] = [];
  for (let element = startElement; element && !element.matches(".compose-quote-html"); element = element.parentElement) {
    ancestors.push(element);
  }
  for (let ancestor of ancestors) {
    let wrapper = ancestor.cloneNode(false) as Element;
    wrapper.appendChild(fragment);
    fragment = document.createDocumentFragment();
    fragment.appendChild(wrapper);
  }
  return fragment;
}

/** Applies a captured format to the current selection or typing position. */
export function applyFormatPainter(editor: Editor, snapshot: FormatPainterSnapshot): void {
  let { state, view } = editor;
  let { from, to, $from } = state.selection;
  let transaction = state.tr;
  let marks = createMarks(state, snapshot);

  if (from === to) {
    transaction.setStoredMarks(marks);
  } else {
    transaction.removeMark(from, to);
    for (let mark of marks) {
      transaction.addMark(from, to, mark);
    }
  }

  if (from === to) {
    let depth = $from.depth;
    while (depth > 0 && !$from.node(depth).isTextblock) {
      depth--;
    }
    if (depth > 0) {
      applyBlockFormatting(transaction, $from.before(depth), $from.node(depth), snapshot.blockAttrs);
    }
  } else {
    state.doc.nodesBetween(from, to, (node, position) => {
      if (node.isTextblock) {
        applyBlockFormatting(transaction, position, node, snapshot.blockAttrs);
      }
    });
  }

  view.dispatch(transaction);
  view.focus();
}

function createMarks(state: Editor["state"], snapshot: FormatPainterSnapshot): Mark[] {
  return snapshot.marks.flatMap(({ name, attrs }) => {
    let type = state.schema.marks[name];
    return type ? [type.create(attrs)] : [];
  });
}

function applyBlockFormatting(
  transaction: Transaction,
  position: number,
  node: ProseMirrorNode,
  sourceAttrs: Record<string, any>,
): void {
  let attrs = { ...node.attrs };
  for (let key of Object.keys(attrs)) {
    if (Object.prototype.hasOwnProperty.call(sourceAttrs, key)) {
      attrs[key] = sourceAttrs[key];
    }
  }
  transaction.setNodeMarkup(position, node.type, attrs, node.marks);
}
