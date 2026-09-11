export type MeetingProviderId =
  | "teams"
  | "yandex-telemost"
  | "google-meet"
  | "zoom"
  | "webex"
  | "jitsi"
  | "custom";

export interface MeetingProvider {
  id: MeetingProviderId;
  hostnames: string[];
  homepage: string;
}

export const meetingProviders: MeetingProvider[] = [
  { id: "teams", hostnames: ["teams.microsoft.com", "teams.live.com"], homepage: "https://teams.microsoft.com/" },
  { id: "yandex-telemost", hostnames: ["telemost.yandex.ru"], homepage: "https://telemost.yandex.ru/" },
  { id: "google-meet", hostnames: ["meet.google.com"], homepage: "https://meet.google.com/" },
  { id: "zoom", hostnames: ["zoom.us", "zoom.com"], homepage: "https://zoom.us/meeting" },
  { id: "webex", hostnames: ["webex.com"], homepage: "https://www.webex.com/" },
  { id: "jitsi", hostnames: ["meet.jit.si"], homepage: "https://meet.jit.si/" },
];

export function detectMeetingProvider(url: string | null | undefined): MeetingProviderId {
  if (!url) {
    return "custom";
  }
  try {
    const hostname = new URL(url).hostname.toLocaleLowerCase();
    const provider = meetingProviders.find(entry =>
      entry.hostnames.some(host => hostname == host || hostname.endsWith(`.${host}`)),
    );
    return provider?.id ?? "custom";
  } catch {
    return "custom";
  }
}

export function getMeetingProvider(id: MeetingProviderId): MeetingProvider | null {
  return meetingProviders.find(provider => provider.id == id) ?? null;
}
