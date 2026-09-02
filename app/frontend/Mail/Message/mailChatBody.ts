const quotedContentSelector = [
  "blockquote[cite]",
  'blockquote[type="cite"]',
  ".gmail_quote",
  ".gmail_attr",
  ".yahoo_quoted",
  "#divRplyFwdMsg",
  '[id^="divRplyFwdMsg"]',
  ".quote-header",
].join(", ");

function isQuotedBlockquote(element: Element | null): boolean {
  return !!element?.matches("blockquote[cite], blockquote[type=\"cite\"]");
}

/** Remove provider-generated reply history while keeping the new mail body. */
export function stripMailChatQuote(html: string | null | undefined): string {
  if (!html || typeof DOMParser == "undefined") {
    return html ?? "";
  }

  let document = new DOMParser().parseFromString(html, "text/html");
  for (let node of document.querySelectorAll(quotedContentSelector)) {
    node.remove();
  }

  for (let prefix of document.querySelectorAll(".moz-cite-prefix")) {
    let next = prefix.nextElementSibling;
    prefix.remove();
    if (isQuotedBlockquote(next)) {
      next.remove();
    }
  }

  return document.documentElement?.outerHTML ?? html;
}
