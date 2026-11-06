import { classificationChoices } from "../kidflix/storefront-reference/taxonomy";
import {
  array,
  object,
  text,
  type DceRecord,
  type Family,
  type Json,
} from "./types";
export type DeliveryRepair = {
  path: string;
  before: Json | undefined;
  after: Json;
  reason: string;
};
/** Proposed, never implicit. Unknown source values are retained in a repair journal. */
export function deliveryRepairPlan(
  record: Partial<DceRecord>,
  family: Family,
): DeliveryRepair[] {
  const d = object(record.data),
    out: DeliveryRepair[] = [];
  const put = (
    path: string,
    before: Json | undefined,
    after: Json,
    reason: string,
  ) => out.push({ path, before, after, reason });
  if (
    ["children", "family", "children-families-educators"].includes(
      text(record.audience),
    )
  )
    put("audience", record.audience, "child", "registered-audience");
  if (
    family.key === "visual-cards" &&
    ["flashcards", "card-swiper"].includes(text(d.mode))
  )
    put("mode", d.mode, "Card Swiper", "registered-mode");
  if (d.continuityPolicy === "resume")
    put(
      "continuityPolicy",
      d.continuityPolicy,
      "device",
      "review-persistence-policy",
    );
  if (d.releaseChangePolicy === "preserve-progress")
    put(
      "releaseChangePolicy",
      d.releaseChangePolicy,
      "compatible_units",
      "review-revision-policy",
    );
  for (const key of [
    "storefrontFocus",
    "storefrontThemes",
    "storefrontNeeds",
    "storefrontQuick",
  ]) {
    const allowed = new Set(
      classificationChoices(family.key, key).map((c) => c.key),
    );
    if (typeof d[key] === "string") {
      const source = text(d[key]).split(/\r?\n/).filter(Boolean),
        valid = [...new Set(source.filter((x) => allowed.has(x)))];
      if (source.some((x) => !allowed.has(x)))
        put(
          key,
          d[key],
          valid.join("\n"),
          "preserve-unregistered-classifications-in-journal",
        );
    }
  }
  return out;
}
export function applyDeliveryRepair(
  record: Partial<DceRecord>,
  repairs: DeliveryRepair[],
): Partial<DceRecord> {
  const next = structuredClone(record),
    data = { ...object(next.data) };
  for (const fix of repairs) {
    if (fix.path === "audience") next.audience = String(fix.after);
    else data[fix.path] = fix.after;
  }
  data.deliveryRepairHistory = [
    ...array(data.deliveryRepairHistory).slice(-19),
    {
      at: new Date().toISOString(),
      changes: repairs.map((r) => ({
        path: r.path,
        before: r.before ?? null,
        after: r.after,
        reason: r.reason,
      })),
    },
  ];
  next.data = data;
  return next;
}
