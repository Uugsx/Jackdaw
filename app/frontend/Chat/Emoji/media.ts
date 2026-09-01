import { appGlobal } from "../../../logic/app";

export interface GraphicSelection {
  emoji?: string | null;
  file?: File;
  /** Preferred display width for an inserted media item, in CSS pixels. */
  width?: number;
}

export interface OpenverseGIF {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  creator: string | null;
  license: string | null;
  foreignLandingURL: string | null;
  filesize: number | null;
}

const kOpenverseImagesURL = "https://api.openverse.org/v1/images/";
const kDefaultGIFQuery = "funny";
const kGIFPageSize = 20;
export const kGIFDisplayWidth = 256;
const kRequestTimeoutMS = 15000;
const kMaxGIFSizeBytes = 15 * 1024 * 1024;

/** Searches the openly licensed GIF catalog without requiring an API key. */
export async function searchGIFs(query: string | null): Promise<OpenverseGIF[]> {
  let url = new URL(kOpenverseImagesURL);
  url.searchParams.set("q", query?.trim() || kDefaultGIFQuery);
  url.searchParams.set("extension", "gif");
  url.searchParams.set("page_size", String(kGIFPageSize));
  let response = await request(url.toString(), "json");
  return parseGIFResults(response);
}

/** Parses and validates the part of the Openverse response used by the picker. */
export function parseGIFResults(payload: unknown): OpenverseGIF[] {
  if (!payload || typeof payload != "object" || !Array.isArray((payload as any).results)) {
    return [];
  }
  return (payload as any).results.flatMap((entry: any): OpenverseGIF[] => {
    if (!entry || typeof entry != "object") {
      return [];
    }
    let id = typeof entry.id == "string" ? entry.id : null;
    let title = typeof entry.title == "string" && entry.title.trim() ? entry.title.trim() : "GIF";
    let url = httpsURL(entry.url);
    let thumbnail = httpsURL(entry.thumbnail);
    let filetype = typeof entry.filetype == "string" ? entry.filetype.toLowerCase() : null;
    let urlPath = url ? new URL(url).pathname.toLowerCase() : "";
    let isGIF = filetype == "gif" || filetype == "image/gif" || !filetype && urlPath.endsWith(".gif");
    let filesize = typeof entry.filesize == "number" && Number.isFinite(entry.filesize) && entry.filesize > 0
      ? entry.filesize
      : null;
    if (!id || !url || !isGIF || filesize && filesize > kMaxGIFSizeBytes) {
      return [];
    }
    // Openverse's proxy thumbnail can be unavailable for an otherwise valid
    // result. Keep the result and let the picker fall back to the source GIF.
    thumbnail ??= url;
    return [{
      id,
      title,
      url,
      thumbnail,
      creator: typeof entry.creator == "string" ? entry.creator : null,
      license: typeof entry.license == "string" ? entry.license : null,
      foreignLandingURL: httpsURL(entry.foreign_landing_url),
      filesize,
    }];
  });
}

/** Returns the preview URL, optionally bypassing a failed catalog thumbnail. */
export function getGIFThumbnailURL(gif: OpenverseGIF, useSource = false): string {
  return useSource ? gif.url : gif.thumbnail;
}

/** Downloads the selected GIF so chat and mail can send it as a real attachment. */
export async function downloadGIF(gif: OpenverseGIF): Promise<File> {
  let url = httpsURL(gif.url);
  if (!url) {
    throw new Error("The GIF URL is not secure");
  }
  let data = await request(url, "arrayBuffer");
  let bytes = toUint8Array(data);
  if (!bytes.byteLength) {
    throw new Error("The GIF is empty");
  }
  if (bytes.byteLength > kMaxGIFSizeBytes) {
    throw new Error("The GIF is too large");
  }
  if (bytes.byteLength < 4 || bytes[0] != 0x47 || bytes[1] != 0x49 || bytes[2] != 0x46 || bytes[3] != 0x38) {
    throw new Error("The downloaded file is not a GIF");
  }
  let safeID = gif.id.replace(/[^a-z0-9_-]/gi, "-").substring(0, 64) || "selected";
  return new File([bytes as unknown as BlobPart], `gif-${safeID}.gif`, { type: "image/gif" });
}

function httpsURL(value: unknown): string | null {
  if (typeof value != "string") {
    return null;
  }
  try {
    let url = new URL(value);
    return url.protocol == "https:" ? url.toString() : null;
  } catch (ex) {
    return null;
  }
}

async function request(url: string, result: "json" | "arrayBuffer"): Promise<any> {
  // Keep catalog responses in the renderer. Passing the provider response
  // through the desktop JPC bridge can lose the JSON payload before it reaches
  // the picker, even though the network request itself succeeded.
  if (result == "json") {
    let response = await fetch(url, { signal: AbortSignal.timeout(kRequestTimeoutMS) });
    if (!response.ok) {
      throw new Error(`Media request failed: HTTP ${response.status}`);
    }
    return await response.json();
  }
  let kyCreate = appGlobal.remoteApp?.kyCreate;
  if (typeof kyCreate == "function") {
    let ky = await kyCreate({ timeout: kRequestTimeoutMS });
    return await ky.get(url, { result });
  }
  let response = await fetch(url, { signal: AbortSignal.timeout(kRequestTimeoutMS) });
  if (!response.ok) {
    throw new Error(`Media request failed: HTTP ${response.status}`);
  }
  return await response.arrayBuffer();
}

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}
