"use client";
import { creationId, mimeFor } from "./creation-model";

export type UploadCheckpoint = {
  id: string;
  name: string;
  mime: string;
  size: number;
  checksum?: string;
  assetId?: string;
  uploaded?: boolean;
  state:
    | "queued"
    | "hashing"
    | "uploading"
    | "verifying"
    | "ready"
    | "failed"
    | "needs-file";
  progress: number;
  error?: string;
  duration?: number;
  pageCount?: number;
  resource: string;
  collection: string;
  unit: string;
  field: string;
};
const MEDIA = "/api/angelcare-marketplace/admin/media";
export async function nativeMediaPost(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<any> {
  const response = await fetch(MEDIA + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const json = await response.json();
  if (!response.ok)
    throw Error(
      json.error?.message || json.message || "The file request failed.",
    );
  return json.data || json;
}
export async function fileChecksum(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("");
  }
  return sha256Bytes(new Uint8Array(bytes));
}
export async function sourceMetadata(
  file: File,
  mime: string,
): Promise<{ duration?: number; pageCount?: number }> {
  if (mime === "application/pdf" && file.size <= 32 * 1024 * 1024) {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: false,
      });
      return { pageCount: pdf.getPageCount() };
    } catch {
      return {};
    }
  }
  if (mime.startsWith("audio/") || mime.startsWith("video/"))
    return new Promise((resolve) => {
      const element = document.createElement(
          mime.startsWith("video/") ? "video" : "audio",
        ),
        url = URL.createObjectURL(file);
      let finished = false;
      const finish = (v: { duration?: number }) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        element.removeAttribute("src");
        element.load();
        URL.revokeObjectURL(url);
        resolve(v);
      };
      const timer = setTimeout(() => finish({}), 12000);
      element.preload = "metadata";
      element.onloadedmetadata = () =>
        finish(
          Number.isFinite(element.duration) && element.duration > 0
            ? { duration: element.duration }
            : {},
        );
      element.onerror = () => finish({});
      element.src = url;
    });
  return {};
}
export function queueFile(
  file: File,
  target: Pick<UploadCheckpoint, "resource" | "collection" | "unit" | "field">,
): UploadCheckpoint {
  return {
    id: creationId(),
    name: file.name,
    mime: mimeFor(file.name, file.type),
    size: file.size,
    state: "queued",
    progress: 0,
    ...target,
  };
}

/** Same native upload authority as Media Library. The File never enters JSON or a database. */
export async function uploadCreationFile(
  file: File,
  checkpoint: UploadCheckpoint,
  onUpdate: (next: Partial<UploadCheckpoint>) => void,
  signal: AbortSignal,
): Promise<UploadCheckpoint> {
  const next = { ...checkpoint };
  const update = (patch: Partial<UploadCheckpoint>) => {
    Object.assign(next, patch);
    onUpdate(patch);
  };
  try {
    update({ state: "hashing", progress: 5, error: undefined });
    const checksum = await fileChecksum(file);
    if (checkpoint.checksum && checkpoint.checksum !== checksum)
      throw Error(
        "Reselect the original file. Its checksum differs from the retained upload.",
      );
    update({ checksum });
    const [metadata, checks] = await Promise.all([
      sourceMetadata(file, next.mime),
      nativeMediaPost(
        "/preflight",
        {
          files: [
            {
              fileName: next.name,
              mimeType: next.mime,
              sizeBytes: next.size,
              checksumSha256: checksum,
            },
          ],
        },
        signal,
      ),
    ]);
    update(metadata);
    const check = checks[0];
    if (check?.errors?.length || check?.state === "FAILED")
      throw Error(check.errors?.join(" · ") || "This file is unavailable.");
    if (check?.duplicate?.id) {
      update({
        assetId: check.duplicate.id,
        uploaded: true,
        state: "ready",
        progress: 100,
      });
      return next;
    }
    if (!(next.assetId && next.uploaded)) {
      const session = await nativeMediaPost(
        "/upload-session",
        {
          fileName: next.name,
          mimeType: next.mime,
          sizeBytes: next.size,
          checksumSha256: checksum,
          folder: "digital-customer-experience",
          title: next.name,
        },
        signal,
      );
      if (!session.assetId || !session.uploadUrl)
        throw Error("The native file destination is unavailable.");
      update({ assetId: session.assetId, state: "uploading", progress: 20 });
      const response = await fetch(session.uploadUrl, {
        method: session.method || "PUT",
        headers: session.headers || { "Content-Type": next.mime },
        body: file,
        signal,
      });
      if (!response.ok) throw Error("Upload failed: HTTP " + response.status);
      update({ uploaded: true });
    }
    update({ state: "verifying", progress: 80 });
    await nativeMediaPost(
      "/" + next.assetId + "/complete",
      { checksumSha256: checksum, sizeBytes: next.size, mimeType: next.mime },
      signal,
    );
    update({ state: "ready", progress: 100 });
    return next;
  } catch (error) {
    update({ state: "failed", error: (error as Error).message });
    throw error;
  }
}

/** SHA-256 fallback for trusted local HTTP previews where SubtleCrypto is unavailable. */
export function sha256Bytes(input: Uint8Array): string {
  const k = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);
  const length = Math.ceil((input.length + 9) / 64) * 64,
    data = new Uint8Array(length);
  data.set(input);
  data[input.length] = 128;
  const view = new DataView(data.buffer);
  view.setUint32(length - 8, Math.floor(input.length / 0x20000000));
  view.setUint32(length - 4, (input.length * 8) >>> 0);
  const w = new Uint32Array(64),
    rotate = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15],
        b = w[i - 2];
      w[i] =
        (w[i - 16] +
          (rotate(a, 7) ^ rotate(a, 18) ^ (a >>> 3)) +
          w[i - 7] +
          (rotate(b, 17) ^ rotate(b, 19) ^ (b >>> 10))) >>>
        0;
    }
    let [a, b, c, d, e, f, g, j] = h;
    for (let i = 0; i < 64; i++) {
      const t =
          (j +
            (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) +
            ((e & f) ^ (~e & g)) +
            k[i] +
            w[i]) >>>
          0,
        u =
          ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) +
            ((a & b) ^ (a & c) ^ (b & c))) >>>
          0;
      j = g;
      g = f;
      f = e;
      e = (d + t) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t + u) >>> 0;
    }
    const next = [a, b, c, d, e, f, g, j];
    for (let i = 0; i < 8; i++) h[i] = (h[i] + next[i]) >>> 0;
  }
  return [...h].map((n) => n.toString(16).padStart(8, "0")).join("");
}
