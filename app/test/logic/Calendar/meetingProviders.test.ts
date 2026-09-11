import { expect, test } from "vitest";
import {
  detectMeetingProvider,
  getMeetingProvider,
} from "../../../logic/Calendar/meetingProviders";

test("detects supported meeting providers from secure links", () => {
  expect(detectMeetingProvider("https://teams.microsoft.com/l/meetup-join/abc")).toBe("teams");
  expect(detectMeetingProvider("https://foo.telemost.yandex.ru/room/abc")).toBe(
    "yandex-telemost",
  );
  expect(detectMeetingProvider("https://meet.google.com/abc-defg-hij")).toBe(
    "google-meet",
  );
  expect(detectMeetingProvider("https://example.invalid/meeting")).toBe("custom");
});

test("provides an external homepage for each supported provider", () => {
  for (const id of [
    "teams",
    "yandex-telemost",
    "google-meet",
    "zoom",
    "webex",
    "jitsi",
  ] as const) {
    expect(getMeetingProvider(id)?.homepage.startsWith("https://")).toBe(true);
  }
  expect(getMeetingProvider("custom")).toBeNull();
});
