export function downloadBase64(base64Data: string, mime: string, filename: string) {
  const byteChars = atob(base64Data);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  downloadBlob(new Blob([bytes], {type: mime}), filename);
}

/**
 * Hand a URL to the browser's own downloader.
 *
 * The response carries `Content-Disposition: attachment`, so the page stays put and
 * the browser streams the file to disk with its native progress bar, speed and ETA
 * instead of us buffering the whole thing in a Blob first.
 */
export function openDownloadUrl(url: string) {
  window.location.href = url;
}

export function downloadBlob(blob: Blob, filename: string) {
  const a: HTMLAnchorElement = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = null;
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
