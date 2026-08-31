import { getFilesDir } from "../../../logic/util/backend-wrapper";
import { appGlobal } from "../../../logic/app";
import { openOSAppForFile } from "../../../logic/util/os-integration";
import { dataURLToBlob, UserError, type URLString } from "../../../logic/util/util";
import { sanitize } from "../../../../lib/util/sanitizeDatatypes";
import { backgroundError, showUserError } from "../../Util/error";
import { fileExtensionForMIMEType } from "../../../logic/Files/FileType/MIMETypes";
import { gt } from "../../../l10n/l10n";

type WebviewGuest = HTMLIFrameElement & {
  getWebContentsId?: () => number;
  executeJavaScript?: (code: string) => Promise<unknown>;
};

/** Open an inline email image in the default OS image viewer. */
export async function openMailImageAtPoint(
  webview: WebviewGuest | null | undefined,
  x: number,
  y: number,
  srcURL?: URLString,
  suggestedFilename?: string,
): Promise<void> {
  if (!webview?.executeJavaScript) {
    throw new UserError(gt`Cannot open image in this view`);
  }
  let dataURL = await extractImageDataURLFromWebview(webview, x, y, srcURL);
  if (!dataURL) {
    throw new UserError(gt`Could not read the image`);
  }
  let blob = await dataURLToBlob(dataURL);
  let ext = fileExtensionForMIMEType(blob.type) || "png";
  let filename = sanitize.filename(
    suggestedFilename || guessImageFilename(srcURL, ext),
    `image.${ext}`,
  );
  let filesDir = await getFilesDir();
  let tmpDir = `${filesDir}/tmp`;
  await appGlobal.remoteApp.fs.mkdir(tmpDir, { recursive: true, mode: 0o700 });
  let tempPath = `${tmpDir}/${crypto.randomUUID()}-${filename}`;
  await appGlobal.remoteApp.writeFile(tempPath, 0o644, new Uint8Array(await blob.arrayBuffer()));
  await openOSAppForFile(tempPath);
}

/** @deprecated Use openMailImageAtPoint — kept for callers with URL only. */
export async function openMailImageURL(
  srcURL: URLString,
  webview?: WebviewGuest | null,
  suggestedFilename?: string,
): Promise<void> {
  if (webview?.executeJavaScript) {
    await openMailImageAtPoint(webview, 0, 0, srcURL, suggestedFilename);
    return;
  }
  let blob = await fetchMailImageBlob(srcURL, webview);
  if (!blob) {
    throw new UserError(gt`Could not read the image`);
  }
  await saveAndOpenBlob(blob, srcURL, suggestedFilename);
}

async function saveAndOpenBlob(blob: Blob, srcURL?: URLString, suggestedFilename?: string) {
  let ext = fileExtensionForMIMEType(blob.type) || "png";
  let filename = sanitize.filename(
    suggestedFilename || guessImageFilename(srcURL, ext),
    `image.${ext}`,
  );
  let filesDir = await getFilesDir();
  let tmpDir = `${filesDir}/tmp`;
  await appGlobal.remoteApp.fs.mkdir(tmpDir, { recursive: true, mode: 0o700 });
  let tempPath = `${tmpDir}/${crypto.randomUUID()}-${filename}`;
  await appGlobal.remoteApp.writeFile(tempPath, 0o644, new Uint8Array(await blob.arrayBuffer()));
  await openOSAppForFile(tempPath);
}

function guessImageFilename(srcURL: URLString | undefined, ext: string): string {
  if (!srcURL) {
    return `image.${ext}`;
  }
  try {
    if (srcURL.startsWith("http://") || srcURL.startsWith("https://")) {
      let name = new URL(srcURL).pathname.split("/").pop();
      if (name && /\./.test(name)) {
        return name;
      }
    }
  } catch {
    // ignore malformed URLs (data:, blob:, etc.)
  }
  return `image.${ext}`;
}

/** Read pixels from the guest webview — works for blob:, data: and proxied https: images. */
export async function extractImageDataURLFromWebview(
  webview: WebviewGuest,
  x: number,
  y: number,
  srcURL?: URLString,
): Promise<string | null> {
  try {
    let result = await webview.executeJavaScript!(`
      (async () => {
        function waitForImage(img) {
          if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
          }
          return new Promise((resolve, reject) => {
            img.addEventListener("load", () => resolve(undefined), { once: true });
            img.addEventListener("error", () => reject(new Error("load failed")), { once: true });
          });
        }
        async function imageToDataURL(img) {
          if (!img?.src) {
            return null;
          }
          if (img.src.startsWith("data:")) {
            return img.src;
          }
          try {
            await waitForImage(img);
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            if (!canvas.width || !canvas.height) {
              return null;
            }
            canvas.getContext("2d").drawImage(img, 0, 0);
            return canvas.toDataURL("image/png");
          } catch {
            try {
              const response = await fetch(img.src);
              const blob = await response.blob();
              return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
              });
            } catch {
              return null;
            }
          }
        }
        let img = null;
        const px = ${Math.round(x)};
        const py = ${Math.round(y)};
        if (px > 0 || py > 0) {
          const el = document.elementFromPoint(px, py);
          img = el?.closest("img") ?? null;
        }
        const srcHint = ${JSON.stringify(srcURL ?? "")};
        if (!img && srcHint) {
          img = [...document.images].find(i => i.src === srcHint) ?? null;
        }
        if (!img && document.images.length === 1) {
          img = document.images[0];
        }
        return img ? await imageToDataURL(img) : null;
      })()
    `);
    return typeof result == "string" ? result : null;
  } catch (ex) {
    backgroundError(ex);
    return null;
  }
}

export async function fetchMailImageBlob(
  srcURL: URLString,
  webview?: WebviewGuest | null,
): Promise<Blob | null> {
  try {
    if (srcURL.startsWith("data:")) {
      return await dataURLToBlob(srcURL);
    }
    if (webview?.executeJavaScript) {
      let dataURL = await extractImageDataURLFromWebview(webview, 0, 0, srcURL);
      if (dataURL) {
        return await dataURLToBlob(dataURL);
      }
    }
    if (srcURL.startsWith("http://") || srcURL.startsWith("https://")) {
      let response = await fetch(srcURL);
      if (!response.ok) {
        return null;
      }
      return await response.blob();
    }
  } catch (ex) {
    backgroundError(ex);
  }
  return null;
}

export async function openMailImageFromContext(
  webview: WebviewGuest,
  x: number,
  y: number,
  srcURL?: URLString,
  suggestedFilename?: string,
): Promise<void> {
  try {
    await openMailImageAtPoint(webview, x, y, srcURL, suggestedFilename);
  } catch (ex) {
    showUserError(ex);
  }
}
