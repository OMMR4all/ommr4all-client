export function downloadBase64(base64Data: string, mime: string, filename: string) {
  const byteChars = atob(base64Data);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  downloadBlob(new Blob([bytes], {type: mime}), filename);
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
