/** Проверяет, что значение является HTTP(S)-адресом сервера. */
export function isValidServerURL(value: string | null | undefined): boolean {
  let trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }

  try {
    let url = new URL(trimmed);
    return !!url.hostname && (url.protocol == "http:" || url.protocol == "https:");
  } catch {
    return false;
  }
}
