import "server-only";
import { safeMediaUrl } from "./media-url";
import { publishedCoverHref } from "./detail/published-media";
import { createServiceClient } from "@/lib/supabase/server";
import {
  defaultHome,
  emptyCatalogue,
  isLocale,
  normalizeEdition,
  world,
  type Catalogue,
  type HomeConfig,
  type Locale,
  type Resource,
} from "./catalogue";
const obj = (v: unknown): Record<string, any> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, any>)
    : {};
const str = (v: unknown, max = 2000) =>
  typeof v === "string" ? v.slice(0, max).trim() : "";
export function publicHost(value: string): string {
  const h = value.trim().toLowerCase().replace(/:\d+$/, "");
  if (
    !/^(?:[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?|localhost)$/.test(h) ||
    h.includes("..")
  )
    throw Error("Invalid public host");
  return h;
}
export function filters(input: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const k of [
    "q",
    "family",
    "notFamily",
    "intent",
    "subject",
    "skill",
    "difficulty",
    "audience",
    "age",
    "duration",
    "format",
    "sort",
    "keys",
  ]) {
    const v = str(input[k], k === "keys" ? 12000 : 100);
    if (v) out[k] = v;
  }
  if (
    out.keys &&
    out.keys.split(",").some((k) => !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(k))
  )
    throw Error("Invalid saved discoveries");
  if (out.keys && out.keys.split(",").length > 100)
    throw Error("Too many saved discoveries");
  if (out.family && !world(out.family)) throw Error("Unknown family");
  if(out.notFamily&&!world(out.notFamily))throw Error("Unknown family");
  if (
    out.age &&
    (!Number.isFinite(Number(out.age)) ||
      Number(out.age) < 0 ||
      Number(out.age) > 120)
  )
    throw Error("Invalid age");
  if (
    out.duration &&
    (!Number.isFinite(Number(out.duration)) ||
      Number(out.duration) < 1 ||
      Number(out.duration) > 1440)
  )
    throw Error("Invalid duration");
  if (
    out.format &&
    !["PDF", "PNG", "JPEG", "WEBP", "MP3", "MP4", "HTML"].includes(
      out.format.toUpperCase(),
    )
  )
    throw Error("Invalid format");
  return out;
}
export function card(
  row: Record<string, any>,
  locale: Locale,
): Resource | null {
  const family = world(str(row.family));
  if (!family || !str(row.title) || !str(row.key)) return null;
  const d = obj(row.definition),
    localized = obj(obj(d.locales)[locale]),
    m = obj(obj(obj(row.bindings).media)[str(d.coverAssetId)]),
    image = str(m.url);
  const numeric = (v: unknown) =>
    v !== undefined && v !== null && v !== "" && Number.isFinite(Number(v))
      ? Number(v)
      : null;
  return {
    loveCount:
      typeof row.love_total === "number"
        ? Math.max(0, row.love_total)
        : undefined,
    recentStarts:
      typeof row.recent_starts === "number"
        ? Math.max(0, row.recent_starts)
        : undefined,
    id: str(row.id),
    releaseId: str(row.release_id),
    key: str(row.key, 120),
    family: family.key,
    title: str(row.title, 300),
    summary: str(localized.summary, 900),
    image: publishedCoverHref(row.key, row.release_id, locale, d.coverAssetId) || (safeMediaUrl(image) ? image : ""),
    imageAlt: str(m.alt, 400) || str(row.title, 300),
    audience: str(row.audience, 40),
    ageMin: numeric(d.ageMin),
    ageMax: numeric(d.ageMax),
    duration: numeric(d.estimatedMinutes),
    difficulty: str(d.difficulty, 40),
    subject: str(d.subject, 100),
    skills: str(d.skillTags, 4000).split(/\r?\n/).filter(Boolean),
    formats: [
      ...new Set(
        [
          ...(Array.isArray(d.outputs)
            ? d.outputs
                .filter((o: any) => o.enabled !== false)
                .map(
                  (o: any) =>
                    (
                      ({
                        "application/pdf": "PDF",
                        "image/png": "PNG",
                      }) as Record<string, string>
                    )[str(o.mime, 40)] || str(o.format, 20).toUpperCase(),
                )
            : []),
          str(d.format, 20).toUpperCase(),
        ].filter(Boolean),
      ),
    ] as string[],
    publishedAt: str(row.published_at, 40),
    intent: family.intent,
    collection: Array.isArray(d.discoveryPlacements)
      ? d.discoveryPlacements
          .filter(
            (p: any) =>
              p.enabled === true &&
              (!p.startsAt || Date.parse(p.startsAt) <= Date.now()) &&
              (!p.endsAt || Date.parse(p.endsAt) > Date.now()),
          )
          .map((p: any) => str(p.collectionKey, 100))
          .filter(Boolean)
      : [],
  };
}
export async function getHome(
  host: string,
  locale: Locale,
): Promise<HomeConfig> {
  const db = await createServiceClient(),
    r = await db.rpc("ac_kidflix_home", {
      p_host: publicHost(host),
      p_locale: locale,
    });
  if (r.error) throw Error("KidFlix discovery is temporarily unavailable.");
  if (!r.data?.configured) return defaultHome(locale);
  return {
    locale,
    edition: normalizeEdition(r.data.edition, locale),
    published: true,
    revision: Number(r.data.revision) || 0,
  };
}
export async function getCatalogue(
  host: string,
  locale: Locale,
  input: Record<string, unknown> = {},
  home = false,
): Promise<Catalogue> {
  const db = await createServiceClient(),
    f = filters(input),
    page = Math.max(1, Math.min(10000, Math.floor(Number(input.page) || 1))),
    r = await db.rpc("ac_kidflix_catalogue", {
      p_host: publicHost(host),
      p_locale: locale,
      p_filters: f,
      p_page: page,
      p_home: home,
    });
  if (r.error) throw Error("KidFlix discovery is temporarily unavailable.");
  const d = obj(r.data);
  return {
    ...emptyCatalogue,
    rows: (Array.isArray(d.rows) ? d.rows : [])
      .map((r: any) => card(r, locale))
      .filter((r: Resource | null): r is Resource => !!r),
    total: Number(d.total) || 0,
    page,
    pageSize: 24,
    counts: obj(d.counts),
    subjects: Array.isArray(d.subjects)
      ? d.subjects.filter((s: any) => typeof s === "string")
      : [],
    skills: Array.isArray(d.skills)
      ? d.skills.filter((s: any) => typeof s === "string")
      : [],
    configured: d.configured === true,
  };
}
/** Returns only the current language's already-sanitized release manifest, never its source snapshot. */
export async function getExperience(host: string, locale: Locale, key: string) {
  if (!/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key)) return null;
  const db = await createServiceClient(),
    r = await db.rpc("ac_kidflix_experience", {
      p_host: publicHost(host),
      p_locale: locale,
      p_key: key,
    });
  if (r.error) throw Error("KidFlix discovery is temporarily unavailable.");
  if (!r.data) return null;
  const d = obj(r.data);
  return {
    releaseId: str(d.releaseId, 50),
    publishedAt: str(d.publishedAt, 40),
    manifest: publicDetail(obj(d.manifest)),
  };
}
export async function loadHome(host: string, locale: Locale) {
  const [homeResult,catalogueResult] = await Promise.allSettled([getHome(host,locale),getCatalogue(host,locale,{},true)]);
  const config=homeResult.status==="fulfilled"?homeResult.value:defaultHome(locale);
  const catalogue:Catalogue=catalogueResult.status==="fulfilled"?catalogueResult.value:{...emptyCatalogue,error:true};
  if(homeResult.status==="rejected")catalogue.error=true;
  if(config.edition.featured.length){
    const keys=config.edition.featured.join(","), pages=await Promise.allSettled(Array.from({length:Math.ceil(config.edition.featured.length/24)},(_,i)=>getCatalogue(host,locale,{keys,page:String(i+1)})));
    const by=new Map(catalogue.rows.map(r=>[r.id,r]));
    for(const page of pages){if(page.status==="fulfilled")for(const row of page.value.rows)by.set(row.id,row);else catalogue.error=true;}
    catalogue.rows=[...by.values()];
  }
  return {config,catalogue};
}

export function publicDetail(m: Record<string, any>) {
  const blocked = new Set([
    "internalNotes",
    "reviewHistory",
    "answer",
    "answerKeys",
    "correctKeys",
    "acceptedAnswers",
    "explanation",
    "providerSecrets",
    "secret",
    "password",
    "token",
    "customerId",
    "visitorId",
    "privateReceiverId",
    "responsibleStaffId",
    "notes",
  ]);
  const clean = (v: any): any =>
    Array.isArray(v)
      ? v.map(clean)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .filter(([k]) => !blocked.has(k))
              .map(([k, x]) => [k, clean(x)]),
          )
        : v;
  const media = Object.fromEntries(
    Object.entries(obj(obj(m.bindings).media)).map(([id, value]) => {
      const a = obj(value);
      return [
        id,
        {
          url: safeMediaUrl(a.url) ? a.url : "",
          mime: str(a.mime, 80),
          alt: str(a.alt, 400),
          poster: safeMediaUrl(a.poster) ? a.poster : "",
          bytes: Number(a.bytes) || 0,
        },
      ];
    }),
  );
  return {
    id: str(m.id, 50),
    key: str(m.key, 120),
    family: str(m.family, 40),
    audience: str(m.audience, 40),
    title: str(m.title, 300),
    revision: Number(m.revision) || 0,
    editionLocale: str(m.editionLocale, 2),
    definition: clean(obj(m.definition)),
    bindings: { media },
  };
}
