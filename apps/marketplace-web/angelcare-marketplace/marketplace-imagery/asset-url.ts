export function galleryURL(v: unknown): v is string {
  if (typeof v !== "string" || !v || v.length > 2048 || /[\x00-\x20\\]/.test(v)) return false;
  try {
    const decoded = decodeURIComponent(v);
    if (/[\x00-\x20\\]/.test(decoded) || decoded.includes("..")) return false;
    if (v.startsWith("/")) return !decoded.startsWith("//") && !decoded.startsWith("/api/");
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password && !u.hash;
  } catch { return false; }
}
export function publicHost(value: string): string {
 const h=value.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/,'');
 if(!/^(?:[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?|localhost)$/.test(h)||h.includes('..'))throw Error('Enter a public hostname without a protocol or path.');
 return h;
}
