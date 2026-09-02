// @vitest-environment happy-dom

import { expect, test } from "vitest";
import { stripMailChatQuote } from "../../../frontend/Mail/Message/mailChatBody";

test("mail chat removes the quoted reply while keeping the new body and styles", () => {
  let html = `<html><head><style>.notice { color: red; }</style></head><body>
    <p class="notice">Новый ответ</p>
    <p class="quote-header">Никита написал:</p>
    <blockquote cite="mid:old-message@example.test"><p>Старое сообщение</p></blockquote>
  </body></html>`;

  let result = stripMailChatQuote(html);

  expect(result).toContain("Новый ответ");
  expect(result).toContain(".notice");
  expect(result).not.toContain("Старое сообщение");
  expect(result).not.toContain("Никита написал");
});

test("mail chat removes common provider quote wrappers", () => {
  let html = `<div>Новый ответ</div>
    <div class="gmail_quote"><div class="gmail_attr">On ... wrote:</div><div>Старая история</div></div>`;

  let result = stripMailChatQuote(html);

  expect(result).toContain("Новый ответ");
  expect(result).not.toContain("Старая история");
});

test("mail chat keeps an ordinary user blockquote", () => {
  let html = `<p>Ответ</p><blockquote><p>Цитата как часть нового сообщения</p></blockquote>`;

  expect(stripMailChatQuote(html)).toContain("Цитата как часть нового сообщения");
});
