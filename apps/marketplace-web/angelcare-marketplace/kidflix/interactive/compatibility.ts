import type { KfPackage } from "./package";
type Finding = { path: string; code: string; detail: string };
function localPath(source: string, url: string): string | null {
  const raw = url.trim();
  if (!raw || raw.startsWith("#") || /^(data|blob):/i.test(raw)) return null;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(raw))
    throw Error("NON_LOCAL_ASSET");
  const parts = source.split("/");
  parts.pop();
  for (const segment of decodeURIComponent(raw.split(/[?#]/)[0]).split("/")) {
    if (segment === "." || !segment) continue;
    if (segment === "..") {
      if (!parts.length) throw Error("ASSET_PATH_OUTSIDE_PACKAGE");
      parts.pop();
    } else parts.push(segment);
  }
  return parts.join("/");
}
/** Complements the sandbox: catch missing local dependencies before publication. */
export function packageCompatibility(p: KfPackage) {
  const known = new Set(p.files.map((f) => f.path)),
    issues: Finding[] = [];
  let nativeBridge = false;
  const add = (path: string, url: string) => {
    try {
      const resolved = localPath(path, url);
      if (resolved && !known.has(resolved))
        issues.push({ path, code: "MISSING_LOCAL_ASSET", detail: resolved });
    } catch (e) {
      issues.push({
        path,
        code: String((e as Error).message),
        detail: url.slice(0, 200),
      });
    }
  };
  for (const f of p.files) {
    if (!/\.(html?|css|m?js)$/i.test(f.path)) continue;
    const source = f.bytes.toString("utf8");
    if (/kidflix\.interactive\.bridge\.1/.test(source)) nativeBridge = true;
    if (/\.html?$/i.test(f.path)) {
      for (const tag of source.matchAll(
        /<(?:script|img|source|video|audio|link)\b[^>]*>/gi,
      )) {
        if (
          /^<link/i.test(tag[0]) &&
          !/\brel\s*=\s*["'](?:stylesheet|preload|modulepreload|icon)["']/i.test(
            tag[0],
          )
        )
          continue;
        for (const m of tag[0].matchAll(
          /\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi,
        ))
          add(f.path, m[1]);
      }
    }
    if (/\.css$/i.test(f.path))
      for (const m of source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi))
        add(f.path, m[1]);
    if (/\.m?js$/i.test(f.path))
      for (const m of source.matchAll(
        /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g,
      ))
        add(f.path, m[1]);
  }
  const cover = p.manifest.cover || (p.manifest.editorial as any)?.cover;
  if (cover) {
    const path = String(cover),
      file = p.files.find((f) => f.path === path);
    if (
      !file ||
      file.mime !== "image/png" ||
      !file.bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    )
      issues.push({ path, code: "INVALID_EDITORIAL_PNG", detail: path });
  }
  const unique = [
    ...new Map(
      issues.map((i) => [i.path + ":" + i.code + ":" + i.detail, i]),
    ).values(),
  ];
  return {
    contract: "KIDFLIX_PACKAGE_COMPATIBILITY_R2",
    nativeBridge,
    issues: unique,
    valid: !unique.length,
  };
}
