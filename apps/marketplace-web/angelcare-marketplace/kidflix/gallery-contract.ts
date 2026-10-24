import { defaultGallery, legacyWorldImages } from "./editorial";
export type Language = "en" | "fr" | "ar";
export interface Point { x: number; y: number }
export interface Scene {
  id: string;
  desktop: string;
  mobile: string;
  descriptions: Record<Language, string>;
  focal: Point;
  mobileFocal: Point;
}
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
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
function point(v: unknown): Point {
  const p = record(v);
  if (typeof p.x !== "number" || typeof p.y !== "number" || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) throw Error("Focal points must be numbers between 0 and 100.");
  return { x: p.x, y: p.y };
}
export function validateGallery(value: unknown, maxScenes: 6 | 12 = 6): Scene[] {
  if (!Array.isArray(value) || value.length < 3 || value.length > maxScenes) throw Error(`Choose three to ${maxScenes} distinct gallery scenes.`);
  const ids = new Set<string>(), sources = new Set<string>();
  return value.map(v => {
    const x = record(v), descriptions = record(x.descriptions);
    if (typeof x.id !== "string" || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(x.id) || ids.has(x.id)) throw Error("Scene IDs must be stable and unique.");
    ids.add(x.id);
    if (!galleryURL(x.desktop) || (x.mobile !== "" && x.mobile !== undefined && !galleryURL(x.mobile))) throw Error("Choose safe image URLs for each scene.");
    const parsed = new URL(x.desktop, "https://kidflix.invalid");
    const canonical = parsed.origin + decodeURIComponent(parsed.pathname);
    if (sources.has(canonical)) throw Error("Each scene needs a distinct desktop source.");
    sources.add(canonical);
    for (const l of ["en", "fr", "ar"] as const) if (typeof descriptions[l] !== "string" || !descriptions[l].trim() || descriptions[l].length > 500) throw Error("Describe every scene in English, French and Arabic (up to 500 characters).");
    return { id: x.id, desktop: x.desktop, mobile: typeof x.mobile === "string" ? x.mobile : "", descriptions: { en: String(descriptions.en).trim(), fr: String(descriptions.fr).trim(), ar: String(descriptions.ar).trim() }, focal: point(x.focal), mobileFocal: point(x.mobileFocal) };
  });
}
export function normalizeGallery(value: unknown, world: string, legacy: { hero: string; mobile?: string; alt?: string; bound?: boolean }): Scene[] {
  if (value !== undefined) return validateGallery(value, world === "home" ? 12 : 6);
  const defaults = defaultGallery(world);
  const packaged = world === "home" ? "/kidflix/hero.jpg" : legacyWorldImages[world];
  if (!legacy.hero || (!legacy.bound && (legacy.hero === packaged || legacy.hero === defaults[0].desktop))) return defaults;
  // A custom image remains the first scene. No arbitrary URL rewriting.
  const description = legacy.alt?.trim() || "Operator-selected editorial artwork";
  return validateGallery([{ ...defaults[0], id: "legacy-hero", desktop: legacy.hero, mobile: legacy.mobile || "", descriptions: { en: description, fr: legacy.alt?.trim() || "Image éditoriale sélectionnée", ar: legacy.alt?.trim() || "صورة تحريرية مختارة" } }, ...defaults.filter(s => s.desktop !== legacy.hero).slice(0, 2)]);
}
export const sceneSlot = (id: string, source: "desktop" | "mobile") => `scene:${id}:${source}`;
export function bindingURL(edition: { gallery?: Scene[]; [key: string]: unknown }, slot: string): string | undefined {
  const match = /^scene:([a-z0-9-]+):(desktop|mobile)$/.exec(slot);
  if (!match) return undefined;
  const scene = edition.gallery?.find(s => s.id === match[1]);
  return match[2] === "desktop" ? scene?.desktop : scene?.mobile;
}
export function galleryBindings(bindings: unknown, scenes: Scene[], legacy = false): Record<string, string> {
  const out: Record<string,string> = {};
  for (const [slot, id] of Object.entries(record(bindings))) {
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) continue;
    if (slot.startsWith("scene:")) { if (bindingURL({ gallery: scenes }, slot)) out[slot] = id; }
    else if (legacy && (slot === "hero" || slot === "heroMobile")) {
      if (slot === "hero" || scenes[0].mobile) out[sceneSlot(scenes[0].id, slot === "hero" ? "desktop" : "mobile")] = id;
    }
    else if (slot !== "hero" && slot !== "heroMobile") out[slot] = id;
  }
  return out;
}
