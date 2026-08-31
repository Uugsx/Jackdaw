/** Split compose HTML into the editable reply and a read-only quoted original. */
export function splitComposeQuote(html: string | null | undefined): { editable: string; quote: string } {
  let body = html ?? "";
  let headerMatch = body.match(/<p\b[^>]*\bclass=(["'])quote-header\1[^>]*>[\s\S]*$/i);
  if (headerMatch?.index != null) {
    return {
      editable: body.slice(0, headerMatch.index),
      quote: body.slice(headerMatch.index),
    };
  }
  let blockquoteMatch = body.match(/<blockquote\b[\s\S]*$/i);
  if (blockquoteMatch?.index != null) {
    return {
      editable: body.slice(0, blockquoteMatch.index),
      quote: body.slice(blockquoteMatch.index),
    };
  }
  let hrMatch = body.match(/<hr\b[^>]*\s*\/?>[\s\S]*$/i);
  if (hrMatch?.index != null) {
    return {
      editable: body.slice(0, hrMatch.index),
      quote: body.slice(hrMatch.index),
    };
  }
  return { editable: body, quote: "" };
}

export function mergeComposeQuote(editable: string | null | undefined, quote: string): string {
  return (editable ?? "") + (quote ?? "");
}

export function hasComposeQuote(html: string | null | undefined): boolean {
  return !!splitComposeQuote(html).quote;
}

export function extractBlockquoteInner(quoteHtml: string): string | null {
  let match = quoteHtml.match(/<blockquote\b[^>]*>([\s\S]*)<\/blockquote>/i);
  return match ? match[1].trim() : null;
}

/** HTML shown in the editable quote block (reply body vs full forward quote). */
export function quoteDisplayBody(
  quoteHtml: string,
  sourceHtml: string | null | undefined,
  isReply: boolean,
): string {
  if (isReply && sourceHtml) {
    return sourceHtml;
  }
  let inner = extractBlockquoteInner(quoteHtml);
  if (inner != null) {
    return inner;
  }
  return quoteHtml;
}

/** Apply user edits from the quote editor back into the stored quote HTML. */
export function applyQuoteBodyEdit(
  composeQuoteHtml: string,
  editedBodyHtml: string,
  isReply: boolean,
): string {
  if (isReply && /<blockquote\b/i.test(composeQuoteHtml)) {
    return composeQuoteHtml.replace(
      /(<blockquote\b[^>]*>)([\s\S]*)(<\/blockquote>)/i,
      (_, open, _inner, close) => `${open}\n      ${editedBodyHtml}\n    ${close}`,
    );
  }
  if (/<blockquote\b/i.test(composeQuoteHtml)) {
    return composeQuoteHtml.replace(
      /(<blockquote\b[^>]*>)([\s\S]*)(<\/blockquote>)/i,
      (_, open, _inner, close) => `${open}\n      ${editedBodyHtml}\n    ${close}`,
    );
  }
  return editedBodyHtml;
}
