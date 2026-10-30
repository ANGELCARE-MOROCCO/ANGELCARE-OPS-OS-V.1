/** Public resource media has a native delivery authority distinct from editorial artwork. */
export function isNativeMediaUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048 || /[\x00-\x20\x7f\\]/.test(value)) return false;
  if (!value.startsWith("/api/angelcare-marketplace/media/")) return false;
  try {
    const url = new URL(value, "https://kidflix.invalid");
    if (url.pathname !== value.split(/[?#]/, 1)[0]) return false;
    if (url.hash || !/^\/api\/angelcare-marketplace\/media\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/[^/]+$/i.test(url.pathname)) return false;
    const name = decodeURIComponent(url.pathname.split("/").at(-1)!);
    if (!name || name === "." || name === ".." || /[/\\\x00-\x1f\x7f]/.test(name)) return false;
    const params = [...url.searchParams.entries()];
    return params.length === 0 || (params.length === 1 && params[0][0] === "variant" && ["desktop", "tablet", "mobile", "square"].includes(params[0][1]));
  } catch { return false; }
}

export function safeMediaUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048 || /[\x00-\x20\x7f\\]/.test(value)) return false;
  if (value.startsWith("/api/")) return isNativeMediaUrl(value);
  if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("..");
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash;
  } catch { return false; }
}
