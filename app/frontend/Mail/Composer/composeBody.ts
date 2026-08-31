/** Visible text in the compose area above the quote (reply typing zone). */
export function topLevelComposeText(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, "")
    .replace(/<p\b[^>]*\bclass=(["'])quote-header\1[^>]*>[\s\S]*?(?=<blockquote|$)/gi, "")
    .replace(/<blockquote\b[\s\S]*$/i, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

/** True when the editor already has reply text that is not yet on the mail object. */
export function editorHasNewComposeText(
  editorHtml: string | null | undefined,
  mailHtml: string | null | undefined,
): boolean {
  return topLevelComposeText(editorHtml).length > topLevelComposeText(mailHtml).length;
}
