/** Saves text as a file in the browser: wrap it in a Blob, point a hidden link at
    it and click it (same trick as chipsExport). */
export function downloadTextFile(fileName: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
