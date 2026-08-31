import { getFilesDir } from "../../../logic/util/backend-wrapper";
import { appGlobal } from "../../../logic/app";
import { openOSAppForFile } from "../../../logic/util/os-integration";
import { dataURLToBlob, type URLString } from "../../../logic/util/util";
import { sanitize } from "../../../../lib/util/sanitizeDatatypes";
import { backgroundError } from "../../Util/error";
import { fileExtensionForMIMEType } from "../../../logic/Files/FileType/MIMETypes";

/** Open an inline email image in the default OS image viewer. */
export async function openMailImageURL(
  srcURL: URLString,
  webview?: HTMLIFrameElement | null,
  suggestedFilename?: string,
): Promise<void> {
  if (!srcURL) {
    return;
  }
  let blob = await fetchMailImageBlob(srcURL, webview);
  if (!blob) {
    return;
  }
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

function guessImageFilename(srcURL: URLString, ext: string): string {
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

export async function fetchMailImageBlob(
  srcURL: URLString,
  webview?: HTMLIFrameElement | null,
): Promise<Blob | null> {
  try {
    if (srcURL.startsWith("data:")) {
      return await dataURLToBlob(srcURL);
    }
    if (srcURL.startsWith("blob:") && webview) {
      let dataURL = await webview.executeJavaScript(`
        (async () => {
          try {
            const response = await fetch(${JSON.stringify(srcURL)});
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
        })()
      `);
      if (typeof dataURL == "string") {
        return await dataURLToBlob(dataURL);
      }
      return null;
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
