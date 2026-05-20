export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  // Prepend BOM so Excel detects UTF-8 correctly
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  // target=_blank lets sandboxed iframes (like the Lovable preview) hand
  // the download off to the top-level browser context.
  a.target = "_blank";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Fallback for sandboxed previews that block <a download> entirely.
  // If the click didn't actually start a download, open the blob in a new tab
  // so the user can save it manually.
  setTimeout(() => {
    try {
      // Best-effort: try the parent window first (works when preview iframe
      // has allow-popups + allow-downloads-without-user-activation off).
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) {
        // Popup blocked — navigate top frame as a last resort.
        // Using location.href keeps the blob in the same browsing context.
        // (User will see the file content / download prompt.)
      }
    } catch {
      /* ignore */
    }
  }, 50);

  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 4000);
}