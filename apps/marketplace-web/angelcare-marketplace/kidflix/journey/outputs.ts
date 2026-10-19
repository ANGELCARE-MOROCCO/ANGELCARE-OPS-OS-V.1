import { LIMITS } from "./contract";
export function pageSelection(value: string, count: number) {
  if (!Number.isSafeInteger(count) || count < 1 || value.length > 1000)
    throw Error("INVALID_PAGE_SELECTION");
  if (!value.trim()) {
    if (count > LIMITS.packPages) throw Error("PAGE_LIMIT");
    return Array.from({ length: count }, (_, i) => i);
  }
  const result: number[] = [];
  for (const part of value.split(",")) {
    const match = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw Error("INVALID_PAGE_SELECTION");
    const a = Number(match[1]),
      b = Number(match[2] || match[1]);
    if (a < 1 || b < a || b > count || b - a > LIMITS.packPages)
      throw Error("INVALID_PAGE_SELECTION");
    for (let n = a; n <= b; n++)
      if (!result.includes(n - 1)) result.push(n - 1);
  }
  return result;
}
export async function boundedFile(
  url: string,
  signal: AbortSignal,
  max = LIMITS.fileBytes,
) {
  const r = await fetch(url, {
    signal,
    credentials: "omit",
    cache: "no-store",
  });
  if (!r.ok || r.type === "opaque") throw Error("FILE_UNAVAILABLE");
  if (Number(r.headers.get("content-length") || 0) > max)
    throw Error("FILE_TOO_LARGE");
  const reader = r.body?.getReader();
  if (!reader) throw Error("FILE_UNAVAILABLE");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw Error("FILE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.length;
  }
  return {
    bytes,
    mime: r.headers.get("content-type")?.split(";")[0] || "",
    size,
  };
}
export async function preparePack(
  files: { url: string; mime: string; selection: string }[],
  paper: string,
  landscape: boolean,
  signal: AbortSignal,
  progress: (n: number) => void,
) {
  if (!files.length || files.length > LIMITS.packFiles)
    throw Error("FILE_COUNT_LIMIT");
  const { PDFDocument } = await import("pdf-lib"),
    pdf = await PDFDocument.create();
  let pages = 0,
    totalBytes = 0;
  for (let i = 0; i < files.length; i++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const file = files[i],
      source = await boundedFile(file.url, signal);
    totalBytes += source.size;
    if (totalBytes > LIMITS.packBytes) throw Error("PACK_TOO_LARGE");
    if (file.mime === "application/pdf") {
      const native = await PDFDocument.load(source.bytes),
        ids = pageSelection(file.selection, native.getPageCount());
      if (pages + ids.length > LIMITS.packPages) throw Error("PAGE_LIMIT");
      for (const p of await pdf.copyPages(native, ids)) {
        pdf.addPage(p);
        pages++;
      }
    } else if (["image/png", "image/jpeg"].includes(file.mime)) {
      if (pageSelection(file.selection, 1).length !== 1)
        throw Error("INVALID_PAGE_SELECTION");
      if (++pages > LIMITS.packPages) throw Error("PAGE_LIMIT");
      const img =
          file.mime === "image/png"
            ? await pdf.embedPng(source.bytes)
            : await pdf.embedJpg(source.bytes),
        dims = paper === "Letter" ? [612, 792] : [595.28, 841.89],
        w = landscape ? dims[1] : dims[0],
        h = landscape ? dims[0] : dims[1],
        page = pdf.addPage([w, h]),
        fit = img.scaleToFit(w - 48, h - 48);
      page.drawImage(img, {
        x: (w - fit.width) / 2,
        y: (h - fit.height) / 2,
        width: fit.width,
        height: fit.height,
      });
    } else throw Error("INCOMPATIBLE_FILE");
    progress(i + 1);
  }
  if (!pages) throw Error("NO_PAGES");
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const bytes = await pdf.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    pages,
  };
}
