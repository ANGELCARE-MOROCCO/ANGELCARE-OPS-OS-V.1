"use client";
import { fileChecksum } from "./creation-upload";
const API =
  "/api/angelcare-marketplace/admin/digital-customer-experience/interactive-import";
export type ImportReceipt = {
  id: string;
  state: string;
  received: number[];
  chunkBytes: number;
  chunkCount: number;
  cursor: number;
  fileCount: number;
  packageId: string;
  error?: string;
  waiting?: boolean;
  package?: any;
};
export async function importOperation(
  body: unknown,
  signal?: AbortSignal,
): Promise<ImportReceipt> {
  const r = await fetch(API, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(b.error || "IMPORT_REQUEST_FAILED");
  return b.data;
}
/** No full archive ever enters multipart parsing. Checkpoints live on the server. */
export async function uploadInteractiveProject(
  file: File,
  target: { family: string; locale: string; recordId?: string },
  signal: AbortSignal,
  onProgress: (progress: number, receipt?: ImportReceipt) => void,
) {
  onProgress(1);
  const checksum = await fileChecksum(file);
  let receipt = await importOperation(
    { action: "begin", checksum, size: file.size, ...target },
    signal,
  );
  const key = "kidflix.import.r2." + target.family + "." + target.locale;
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        id: receipt.id,
        name: file.name,
        checksum,
        size: file.size,
      }),
    );
  } catch {}
  onProgress(3, receipt);
  for (let i = 0; i < receipt.chunkCount; i++) {
    if (receipt.received.includes(i)) continue;
    const part = file.slice(
      i * receipt.chunkBytes,
      Math.min(file.size, (i + 1) * receipt.chunkBytes),
    );
    const hash = await fileChecksum(new File([part], "chunk"));
    const r = await fetch(
      API + "?" + new URLSearchParams({ id: receipt.id, index: String(i) }),
      {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Kidflix-Checksum": hash,
        },
        body: part,
        signal,
      },
    );
    const b = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(b.error || "IMPORT_CHUNK_UPLOAD_FAILED");
    receipt = b.data;
    onProgress(
      3 + Math.round((receipt.received.length / receipt.chunkCount) * 67),
      receipt,
    );
  }
  return resumeInteractiveProject(receipt.id, signal, (n, r) =>
    onProgress(70 + Math.round(n * 0.3), r),
  );
}
export async function resumeInteractiveProject(
  id: string,
  signal: AbortSignal,
  onProgress: (progress: number, receipt: ImportReceipt) => void,
) {
  for (let turn = 0; turn < 180; turn++) {
    if (signal.aborted) throw new DOMException("Import paused", "AbortError");
    const receipt = await importOperation({ action: "advance", id }, signal);
    onProgress(
      receipt.state === "validated"
        ? 100
        : Math.round((receipt.cursor / Math.max(1, receipt.fileCount)) * 100),
      receipt,
    );
    if (receipt.state === "validated" && receipt.package)
      return receipt.package;
    if (receipt.waiting)
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          clearTimeout(timer);
          reject(new DOMException("Import paused", "AbortError"));
        };
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", abort);
          resolve();
        }, 1500);
        signal.addEventListener("abort", abort, { once: true });
      });
  }
  throw Error("IMPORT_CONTINUES_ON_SERVER_RESUME_AVAILABLE");
}
