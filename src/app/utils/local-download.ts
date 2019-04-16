export function downloadBlob(blob: Blob, filename: string) {
  const a: HTMLAnchorElement = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = null;
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
