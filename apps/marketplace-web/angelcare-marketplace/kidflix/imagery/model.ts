import { pageSlots } from "./registry";
import { WORLDS } from "../catalogue";
import { galleryURL } from "../gallery-contract";
export const PAGES = ["home", ...WORLDS.map((w) => w.key), "shared"];
export const ICONS = [
  "flame",
  "lightning",
  "megaphone",
  "gift",
  "tag",
  "percent",
  "star",
  "heart",
  "crown",
  "trophy",
  "seal",
  "clock",
  "calendar",
  "bookmark",
  "book",
  "download",
] as const;
export const PRESETS = [
  ["HOT", "flame"],
  ["NEW", "lightning"],
  ["FEATURED", "star"],
  ["EDITOR’S PICK", "bookmark"],
  ["NEW COLLECTION", "gift"],
  ["PRINT & GO", "download"],
  ["SEASONAL", "calendar"],
] as const;
export type Badge = {
  id: string;
  enabled: boolean;
  icon: string;
  text: string;
  display: "icon" | "text" | "both";
  shape: "sticker" | "pill" | "rectangle" | "ribbon" | "folded" | "seal";
  size: "tiny" | "small" | "medium";
  corner: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  relative: boolean;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  background: string;
  color: string;
  border: boolean;
  shadow: boolean;
  motion: "none" | "pulse" | "glow" | "bounce" | "shine" | "entrance" | "fire";
  speed: number;
  delay: number;
  intensity: number;
  loop: boolean;
  hideMobile: boolean;
};
export type Scene = {
  id: string;
  src: string;
  assetId: string;
  mobile: string;
  mobileAssetId: string;
  enabled: boolean;
  alt: string;
  focal: { x: number; y: number };
  mobileFocal: { x: number; y: number };
  fit: "cover" | "contain";
  zoom: number;
  mobileZoom: number;
  duration: number;
  badges?: Badge[];
};
export type Placement = {
  mode: "single" | "slideshow";
  images: Scene[];
  hidden: boolean;
  autoplay: boolean;
  loop: boolean;
  interval: number;
  transition: "fade" | "slide" | "cut";
  speed: number;
  controls: boolean;
  slowZoom: boolean;
  badgesEnabled: boolean;
  badges: Badge[];
};
export type Config = { version: 1; slots: Record<string, Placement> };
export type Descriptor = {
  id: string;
  section: string;
  label: string;
  condition?: string;
  sequence?: boolean;
  source?: string;
  owner?: "editable" | "shared" | "resource-owned" | "protected";
};
export const emptyConfig = (): Config => ({ version: 1, slots: {} });
export const placement = (): Placement => ({
  mode: "slideshow",
  images: [],
  hidden: false,
  autoplay: true,
  loop: true,
  interval: 2000,
  transition: "fade",
  speed: 400,
  controls: true,
  slowZoom: false,
  badgesEnabled: false,
  badges: [],
});
export const newId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const h = [...b].map((v) => v.toString(16).padStart(2, "0")).join("");
  return (
    h.slice(0, 8) +
    "-" +
    h.slice(8, 12) +
    "-" +
    h.slice(12, 16) +
    "-" +
    h.slice(16, 20) +
    "-" +
    h.slice(20)
  );
};
export const newBadge = (): Badge => ({
  id: newId(),
  enabled: true,
  icon: "flame",
  text: "HOT",
  display: "both",
  shape: "pill",
  size: "tiny",
  corner: "top-right",
  relative: false,
  x: 10,
  y: 10,
  rotation: 0,
  opacity: 1,
  background: "#be123c",
  color: "#ffffff",
  border: false,
  shadow: true,
  motion: "none",
  speed: 1800,
  delay: 0,
  intensity: 1,
  loop: true,
  hideMobile: false,
});
const obj = (v: any) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};
const bounded = (v: any, min: number, max: number, name: string) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    throw Error("Invalid " + name);
  return v;
};
const choice = (v: any, options: readonly string[], name: string) => {
  if (!options.includes(v)) throw Error("Invalid " + name);
  return v;
};
const bool = (v: any) => v === true;
const id = (v: any) =>
  typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9-]{1,90}$/.test(v);
const uuid = (v: any) =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(v);
function badges(v: any): Badge[] {
  if (!Array.isArray(v) || v.length > 2)
    throw Error("Choose up to two badges.");
  const ids = new Set();
  return v.map((raw) => {
    const x = obj(raw),
      d = newBadge();
    if (!id(x.id) || ids.has(x.id))
      throw Error("Badges need distinct stable IDs.");
    ids.add(x.id);
    const text = typeof x.text === "string" ? x.text.trim() : "";
    if (text.length > 24)
      throw Error("Keep badge labels within 24 characters.");
    if (
      /(?:\d\s*%|\b(?:sale|discount|free|rating|viewing|sold|trending)\b)/i.test(
        text,
      )
    )
      throw Error(
        "Data-backed promotional claims belong to native content records. Use an editorial label here.",
      );
    for (const k of ["background", "color"])
      if (!/^#[a-f0-9]{6}$/i.test(x[k]))
        throw Error("Choose a valid badge colour.");
    return {
      ...d,
      id: x.id,
      enabled: bool(x.enabled),
      icon: choice(x.icon, ICONS, "icon"),
      text,
      display: choice(x.display, ["icon", "text", "both"], "display"),
      shape: choice(
        x.shape,
        ["sticker", "pill", "rectangle", "ribbon", "folded", "seal"],
        "shape",
      ),
      size: choice(x.size, ["tiny", "small", "medium"], "size"),
      corner: choice(
        x.corner,
        ["top-right", "top-left", "bottom-right", "bottom-left"],
        "corner",
      ),
      relative: bool(x.relative),
      x: bounded(x.x, 0, 40, "horizontal inset"),
      y: bounded(x.y, 0, 40, "vertical inset"),
      rotation: bounded(x.rotation, -20, 20, "rotation"),
      opacity: bounded(x.opacity, 0.5, 1, "opacity"),
      background: x.background,
      color: x.color,
      border: bool(x.border),
      shadow: bool(x.shadow),
      motion: choice(
        x.motion,
        ["none", "pulse", "glow", "bounce", "shine", "entrance", "fire"],
        "motion",
      ),
      speed: bounded(x.speed, 1000, 10000, "motion speed"),
      delay: bounded(x.delay, 0, 10000, "motion delay"),
      intensity: bounded(x.intensity, 0.25, 2, "intensity"),
      loop: bool(x.loop),
      hideMobile: bool(x.hideMobile),
    } as Badge;
  });
}
export function validSlot(page: string, key: string) {
  return (
    PAGES.includes(page) &&
    /^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+){1,8}$/.test(key) &&
    key.length <= 180 &&
    (page === "shared"
      ? key.startsWith("shared.header.category.")
      : key.startsWith(page + "."))
  );
}
export function normalizeConfig(
  value: unknown,
  page: string,
  publish = false,
): Config {
  const x = obj(value);
  if (
    !PAGES.includes(page) ||
    x.version !== 1 ||
    !x.slots ||
    Array.isArray(x.slots) ||
    typeof x.slots !== "object" ||
    Object.keys(x.slots).length > 600
  )
    throw Error("Invalid imagery page configuration.");
  const slots: Record<string, Placement> = {};
  for (const [key, raw] of Object.entries(x.slots)) {
    if (
      !validSlot(page, key) ||
      !pageSlots(page).some((slot) => slot.id === key)
    )
      throw Error("Unknown image placement.");
    const v = obj(raw),
      d = placement();
    if (!Array.isArray(v.images) || v.images.length > 12)
      throw Error("Use up to twelve images.");
    if (
      !pageSlots(page).find((slot) => slot.id === key)?.sequence &&
      v.images.length > 1
    )
      throw Error("Small navigation artwork uses one static image.");
    const ids = new Set();
    const images = v.images.map((raw: any) => {
      const a = obj(raw);
      if (!id(a.id) || ids.has(a.id))
        throw Error("Images need distinct stable IDs.");
      ids.add(a.id);
      if (!galleryURL(a.src) || !uuid(a.assetId))
        throw Error("Select an approved native image.");
      if (a.mobile && (!galleryURL(a.mobile) || !uuid(a.mobileAssetId)))
        throw Error("Select an approved mobile image.");
      const point = (p: any) => ({
        x: bounded(p?.x, 0, 100, "focal x"),
        y: bounded(p?.y, 0, 100, "focal y"),
      });
      return {
        id: a.id,
        src: a.src,
        assetId: a.assetId,
        mobile: a.mobile || "",
        mobileAssetId: a.mobileAssetId || "",
        enabled: bool(a.enabled),
        alt: typeof a.alt === "string" ? a.alt.slice(0, 500) : "",
        focal: point(a.focal),
        mobileFocal: point(a.mobileFocal),
        fit: choice(a.fit, ["cover", "contain"], "fit"),
        zoom: bounded(a.zoom, 1, 2, "zoom"),
        mobileZoom: bounded(a.mobileZoom, 1, 2, "mobile zoom"),
        duration: bounded(a.duration, 0, 30000, "image duration"),
        ...(a.badges !== undefined ? { badges: badges(a.badges) } : {}),
      } as Scene;
    });
    if (publish && images.length && !images.some((a: Scene) => a.enabled))
      throw Error("Enable at least one image, or restore the original.");
    const interval = bounded(v.interval, 1500, 30000, "interval"),
      speed = bounded(v.speed, 0, 1200, "transition speed");
    if (speed > interval - 500)
      throw Error("Transition must leave time to view the image.");
    if (
      images.some(
        (image: Scene) =>
          image.duration > 0 && image.duration < Math.max(1500, speed + 500),
      )
    )
      throw Error(
        "Custom image duration must leave at least 1.5 seconds to view the image.",
      );
    slots[key] = {
      ...d,
      images,
      mode: choice(
        v.mode || "slideshow",
        ["single", "slideshow"],
        "display mode",
      ),
      hidden: bool(v.hidden),
      autoplay: bool(v.autoplay),
      loop: bool(v.loop),
      interval,
      transition: choice(v.transition, ["fade", "slide", "cut"], "transition"),
      speed,
      controls: bool(v.controls),
      slowZoom: bool(v.slowZoom),
      badgesEnabled: bool(v.badgesEnabled),
      badges: badges(v.badges),
    };
    if (
      page === "shared" &&
      (images.length > 1 || slots[key].hidden || slots[key].badgesEnabled)
    )
      throw Error(
        "Shared category marks are static and retain navigation clarity.",
      );
  }
  return { version: 1, slots };
}
export function mediaRefs(configs: Config[]) {
  return [
    ...new Set(
      configs.flatMap((c) =>
        Object.values(c.slots).flatMap((s) =>
          s.images.flatMap((i) => [
            i.assetId,
            ...(i.mobileAssetId ? [i.mobileAssetId] : []),
          ]),
        ),
      ),
    ),
  ];
}
