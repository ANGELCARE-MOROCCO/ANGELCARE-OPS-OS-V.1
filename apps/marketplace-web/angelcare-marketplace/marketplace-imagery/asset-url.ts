/** Native Media Vault delivers stable /api/angelcare-marketplace/media URLs. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NATIVE = /^\/api\/angelcare-marketplace\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([a-z0-9][a-z0-9._~-]{0,255})(?:\?variant=(desktop|tablet|mobile|square))?$/i;
function nativeMediaId(path: string): string | null {
  const m = NATIVE.exec(path);
  return m && m[2] !== "." && !m[2].includes("..") ? m[1] : null;
}
export function galleryURL(v: unknown): v is string {
  if (typeof v !== "string" || !v || v.length > 2048 || /[\x00-\x20\\]/.test(v)) return false;
  try {
    const decoded = decodeURIComponent(v);
    if (/[\x00-\x20\\]/.test(decoded) || decoded.includes("..")) return false;
    if (v.startsWith("/")) {
      if (decoded.startsWith("//")) return false;
      // Do not allow an arbitrary /api URL: only the official native image route.
      if (v.startsWith("/api/") || decoded.startsWith("/api/"))
        return nativeMediaId(v) !== null;
      return true; // Previously supported safe local editorial paths.
    }
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password || u.hash) return false;
    if (u.pathname.startsWith("/api/angelcare-marketplace/media/"))
      return nativeMediaId(u.pathname + u.search) !== null;
    return true; // Existing HTTPS native vault/CDN records remain supported.
  } catch { return false; }
}
/** Client shape check only: authorization and active-state checks remain server-side. */
export function imageReferenceIssue(src: unknown, assetId: unknown): string | null {
  if (typeof assetId !== "string" || !UUID.test(assetId))
    return "The selected image has no valid native vault asset ID.";
  if (!galleryURL(src))
    return "The image delivery URL is invalid. Choose the native image again from the Media Library.";
  const value = src as string;
  const path = value.startsWith("/") ? value : (() => {
    const u = new URL(value);
    return u.pathname + u.search;
  })();
  if (path.startsWith("/api/angelcare-marketplace/media/")) {
    const id = nativeMediaId(path);
    if (!id || id.toLowerCase() !== assetId.toLowerCase())
      return "The image delivery URL does not belong to the selected native vault asset.";
  }
  return null;
}
export function publicHost(value: string): string {
  const h = value.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (!/^(?:[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?|localhost)$/.test(h) || h.includes(".."))
    throw Error("Enter a public hostname without a protocol or path.");
  return h;
}
