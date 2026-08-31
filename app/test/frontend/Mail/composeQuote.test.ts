import { describe, expect, it } from "vitest";
import { applyQuoteBodyEdit, mergeComposeQuote, quoteDisplayBody, splitComposeQuote } from "../../../frontend/Mail/Composer/composeQuote";

describe("splitComposeQuote", () => {
  it("splits reply header and blockquote", () => {
    let full = `<p></p><p class="quote-header">On Mon wrote:</p><blockquote cite="mid:abc"><table><tr><td>A</td></tr></table></blockquote>`;
    let { editable, quote } = splitComposeQuote(full);
    expect(editable).toBe("<p></p>");
    expect(quote).toContain("quote-header");
    expect(quote).toContain("<table>");
  });

  it("splits forward at hr", () => {
    let full = `<p>Hi</p><hr /><p class="forward-header">From:</p><p>Body</p>`;
    let { editable, quote } = splitComposeQuote(full);
    expect(editable).toBe("<p>Hi</p>");
    expect(quote).toMatch(/^<hr/);
  });

  it("mergeComposeQuote round-trips", () => {
    let full = `<p>x</p><blockquote cite="mid:1"><p>q</p></blockquote>`;
    let split = splitComposeQuote(full);
    expect(mergeComposeQuote(split.editable, split.quote)).toBe(full);
  });
});

describe("quoteDisplayBody", () => {
  it("uses source HTML for replies", () => {
    let quote = `<p class="quote-header">On Mon wrote:</p><blockquote cite="mid:1"><p>old</p></blockquote>`;
    expect(quoteDisplayBody(quote, "<p>source</p>", true)).toBe("<p>source</p>");
  });

  it("uses blockquote inner for forwards", () => {
    let quote = `<hr /><p class="forward-header">From:</p><p>Body</p>`;
    expect(quoteDisplayBody(quote, null, false)).toBe(quote);
  });
});

describe("applyQuoteBodyEdit", () => {
  it("updates blockquote inner on reply", () => {
    let quote = `<p class="quote-header">On Mon wrote:</p><blockquote cite="mid:1"><p>old</p></blockquote>`;
    let updated = applyQuoteBodyEdit(quote, "<p>edited</p>", true);
    expect(updated).toContain("<p>edited</p>");
    expect(updated).toContain("quote-header");
    expect(updated).not.toContain("<p>old</p>");
  });
});
