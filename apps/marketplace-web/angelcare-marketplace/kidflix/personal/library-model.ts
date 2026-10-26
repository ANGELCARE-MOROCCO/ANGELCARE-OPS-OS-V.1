import { clientId } from "../detail/client-id";
import { WORLDS, type Locale, type Resource } from "../catalogue";
import { fold, type Personal } from "../journey/contract";
export const TABS = [
  "overview",
  "saved",
  "progress",
  "collections",
  "session",
  "recent",
  "complete",
  "prepared",
  "profile",
  "preferences",
] as const;
export type LibraryTab = (typeof TABS)[number];
export function latestActivity(data: Personal, locale: Locale) {
  const out = new Map<string, Personal["activity"][number]>();
  for (const a of [...data.activity]
    .filter((a) => a.locale === locale)
    .sort((a, b) => b.at - a.at))
    if (!out.has(a.key)) out.set(a.key, a);
  return out;
}
export function tabKeys(
  data: Personal,
  tab: LibraryTab,
  locale: Locale,
  collection = "",
) {
  const activity = latestActivity(data, locale);
  if (tab === "saved" || tab === "overview")
    return data.saved.map((x) => x.key);
  if (tab === "recent") return data.recent.map((x) => x.key);
  if (tab === "session") return data.queue;
  if (tab === "collections")
    return data.collections.find((c) => c.id === collection)?.keys || [];
  return [...activity.values()]
    .filter((a) =>
      tab === "complete"
        ? a.complete
        : tab === "prepared"
          ? a.prepared
          : a.started && !a.complete,
    )
    .map((a) => a.key);
}
export function filterLibrary(
  keys: string[],
  by: Map<string, Resource>,
  activity: ReturnType<typeof latestActivity>,
  options: { q: string; family: string; status: string; sort: string },
) {
  const query = fold(options.q);
  let out = keys.filter((key) => {
    const r = by.get(key),
      a = activity.get(key);
    return (
      (!options.family || r?.family === options.family) &&
      (!query ||
        fold(
          r ? [r.title, r.summary, r.subject, ...r.skills].join(" ") : key,
        ).includes(query)) &&
      (!options.status ||
        (options.status === "unavailable"
          ? !r
          : options.status === "complete"
            ? a?.complete
            : options.status === "progress"
              ? a?.started && !a.complete
              : options.status === "prepared"
                ? a?.prepared
                : !a?.started && !a?.complete))
    );
  });
  if (options.sort === "title")
    out.sort((a, b) =>
      (by.get(a)?.title || a).localeCompare(by.get(b)?.title || b),
    );
  if (options.sort === "duration")
    out.sort(
      (a, b) =>
        (by.get(a)?.duration ?? Infinity) - (by.get(b)?.duration ?? Infinity),
    );
  return out;
}
export function relatedFamilies(resources: Resource[], chosen: string[]) {
  const counts = new Map<string, number>();
  for (const r of resources)
    counts.set(r.family, (counts.get(r.family) || 0) + 1);
  return [...WORLDS]
    .sort(
      (a, b) =>
        Number(chosen.includes(b.key)) - Number(chosen.includes(a.key)) ||
        (counts.get(b.key) || 0) - (counts.get(a.key) || 0),
    )
    .slice(0, 6);
}

export function collectionId() {
  return clientId();
}
