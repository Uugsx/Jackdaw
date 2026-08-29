import { describe, expect, test } from "vitest";
import { isValidServerURL } from "../../../frontend/Setup/Shared/validateServerURL";

describe("isValidServerURL", () => {
  test.each([
    "https://files.example.test",
    "http://localhost:8080/dav/",
  ])("accepts %s", value => {
    expect(isValidServerURL(value)).toBe(true);
  });

  test.each([
    "",
    " ",
    "not-a-url",
    "ftp://files.example.test",
    "file:///tmp/files",
    "javascript:alert(1)",
    "https://",
  ])("rejects %s", value => {
    expect(isValidServerURL(value)).toBe(false);
  });

  test("rejects missing values", () => {
    expect(isValidServerURL(null)).toBe(false);
    expect(isValidServerURL(undefined)).toBe(false);
  });
});
