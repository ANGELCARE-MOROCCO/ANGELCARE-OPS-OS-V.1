import { safeMediaUrl } from "../kidflix/media-url";
import { FAMILIES } from "./registry";
import { mediaSlots } from "./validation";
import { array, object, text, type Data, type Issue } from "./types";

/** Inspect the same sanitized definition and native URLs that the public players consume. */
export function publicMediaReadiness(manifest: Data, requireCover = true) {
  const d = object(manifest.definition), media = object(object(manifest.bindings).media),
    family = FAMILIES.find(f => f.key === manifest.family), issues: Issue[] = [];
  const add = (path: string, code: string, en: string, fr: string, ar: string) =>
    issues.push({ path, code, severity: "error", message: [en, fr, ar] });
  const coverId = text(d.coverAssetId), cover = object(media[coverId]);
  const coverReady = !!coverId && safeMediaUrl(cover.url) && text(cover.mime).startsWith("image/");
  if ((requireCover || coverId) && !coverReady)
    add("coverAssetId", "PUBLIC_COVER_REQUIRED", "Choose an available editorial cover image.", "Choisissez une couverture éditoriale disponible.", "اختر صورة غلاف تحريري متاحة.");
  const slots = new Map(mediaSlots(family, d).filter(s => s.path !== "coverAssetId" && !s.path.includes(".locales.")).map(s => [s.path, s]));
  const kinds = new Map<string, string>();
  for (const unit of array(d.units)) {
    if (!["pdf", "image", "video", "audio"].includes(text(unit.kind)) && !text(unit.assetId)) continue;
    const path = "units." + text(unit.id) + ".assetId";
    if (["pdf", "image", "video", "audio"].includes(text(unit.kind))) kinds.set(path, unit.kind === "pdf" ? "application/pdf" : text(unit.kind) + "/");
    const mime = slots.get(path)?.mime || ["image/", "application/pdf", "video/", "audio/"];
    slots.set(path, { path, id: text(unit.assetId), mime });
  }
  let missing = 0;
  for (const slot of slots.values()) {
    const a = object(media[slot.id]);
    if (!slot.id || !safeMediaUrl(a.url)) {
      missing++;
      add(slot.path, "PUBLIC_MEDIA_UNAVAILABLE", "Select a file that the public player can open.", "Sélectionnez un fichier accessible au lecteur public.", "اختر ملفاً يمكن للقارئ العام فتحه.");
    } else if (!slot.mime.some(m => m.endsWith("/") ? text(a.mime).startsWith(m) : a.mime === m) || (kinds.has(slot.path) && !(kinds.get(slot.path)!.endsWith("/") ? text(a.mime).startsWith(kinds.get(slot.path)!) : a.mime === kinds.get(slot.path)))) {
      missing++;
      add(slot.path, "PUBLIC_MEDIA_TYPE", "Choose a compatible source file.", "Choisissez un fichier source compatible.", "اختر ملفاً أصلياً متوافقاً.");
    }
  }
  return { cover: { id: coverId, ready: coverReady }, files: { total: slots.size, missing, ready: missing === 0 }, issues };
}
