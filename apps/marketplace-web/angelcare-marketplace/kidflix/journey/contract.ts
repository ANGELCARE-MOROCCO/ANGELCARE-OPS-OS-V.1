import type { Locale } from "../catalogue";
import {
  asset,
  definition,
  engineFor,
  obj,
  readyOutputs,
  rows,
  str,
  type Row,
} from "../detail/model";
export const JOURNEY_VERSION = 3;
export const KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{1,119}$/;
export const LIMITS = {
  saved: 500,
  recent: 80,
  queue: 30,
  collections: 40,
  collectionItems: 200,
  offlineBytes: 100 * 1024 * 1024,
  fileBytes: 25 * 1024 * 1024,
  packPages: 100,
  packBytes: 75 * 1024 * 1024,
  packFiles: 40,
};
export function hasStarted(state: Row) {
  return (
    state.started === true ||
    state.complete === true ||
    Number(state.index) > 0 ||
    ["positions", "answers", "values"].some(
      (k) => Object.keys(obj(state[k])).length > 0,
    ) ||
    ["known", "completed", "selected", "checked"].some(
      (k) => Array.isArray(state[k]) && state[k].length > 0,
    )
  );
}
export function fold(v: string) {
  return v
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩۰-۹]/g, (c) => String(c.charCodeAt(0) % 16))
    .toLowerCase()
    .trim();
}
export const purposeFilters = {
  print: { intent: "print" },
  listen: { intent: "listen" },
  classroom: { audience: "educator" },
  practice: { intent: "play" },
  read: { intent: "read" },
  learn: { intent: "learn" },
} as const;
export function interpretSearch(q: string) {
  const clean = q.slice(0, 100).trim(),
    result: Record<string, string> = { q: clean };
  let rest = fold(clean),
    recognized = false;
  const numbers: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    un: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5,
    sept: 7,
    huit: 8,
    neuf: 9,
    dix: 10,
  };
  const age = rest.match(
    /(?:\b(?:for\s+)?age[ds]?\s+)(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\b|\b(\d{1,2})\s*(?:years?(?:\s+old)?|ans?)\b|(?:عمر|لعمر)\s*(\d{1,2})/u,
  );
  if (age) {
    const raw = age[1] || age[2] || age[3];
    result.age = String(numbers[raw] ?? Number(raw));
    rest = rest.replace(age[0], " ");
    recognized = true;
  }
  const duration = rest.match(
    /(?:under|up to|moins de|اقل من)?\s*(\d{1,3})\s*(?:minutes?|mins?|دقائق|دقايق|دقيقة)/u,
  );
  if (duration && Number(duration[1]) > 0) {
    result.duration = String(Number(duration[1]));
    rest = rest.replace(duration[0], " ");
    recognized = true;
  }
  const phrases: [RegExp, string, string][] = [
    [
      /(?:^|\s)(?:flashcards?|cartes|بطاقات)(?=\s|$)/u,
      "family",
      "visual-cards",
    ],
    [
      /(?:^|\s)(?:printables?|print|a imprimer|imprimer|للطباعة|طباعة|طباعه)(?=\s|$)/u,
      "intent",
      "print",
    ],
    [/(?:^|\s)(?:listen|ecouter|استماع)(?=\s|$)/u, "intent", "listen"],
    [/(?:^|\s)(?:read|lire|قراءة|قراءه)(?=\s|$)/u, "intent", "read"],
    [
      /(?:^|\s)(?:activities|activity|activites|activite|نشاط|انشطة)(?=\s|$)/u,
      "intent",
      "play",
    ],
    [/(?:^|\s)(?:classroom|classe|الفصل)(?=\s|$)/u, "audience", "educator"],
  ];
  for (const [rx, key, value] of phrases)
    if (rx.test(rest)) {
      result[key] = value;
      rest = rest.replace(rx, " ");
      recognized = true;
    }
  if (recognized) {
    const text = rest.replace(/\s+/g, " ").trim();
    if (text) result.q = text;
    else delete result.q;
  }
  return result;
}
export function capability(manifest: Row) {
  const d = definition(manifest.family, obj(manifest.definition)),
    m: Row = { ...manifest, definition: d },
    engine = engineFor(m.family, d),
    units = rows(d.units),
    outputs = readyOutputs(m);
  const audio =
    ((m.family === "audio" || m.family === "video") &&
      units.some((u) =>
        asset(m, u.assetId, m.family === "video" ? "video/" : "audio/"),
      )) ||
    (m.family === "stories" &&
      ["read_aloud", "slideshow"].includes(engine) &&
      Boolean(
        asset(m, d.narrationAssetId, "audio/") ||
          units.some((u) => asset(m, u.narrationAssetId, "audio/")),
      ));
  const readable =
    ["documents", "printables"].includes(m.family) ||
    (m.family === "stories" && !audio);
  return {
    engine,
    session: d.kidflixSession !== false,
    classroom: d.kidflixClassroom !== false,
    comfort: readable && d.kidflixComfort !== false,
    practice:
      ["assessments", "activities", "visual-cards"].includes(m.family) &&
      d.kidflixPractice !== false,
    queue: audio && d.kidflixQueue !== false,
    offline: d.kidflixOffline === true,
    printPack:
      d.kidflixPrintPack === true &&
      d.printAllowed === true &&
      outputs.length > 0,
    readable,
    audio,
    output: outputs.length > 0,
    certificate:
      m.family === "learning" && obj(d.certificatePolicy).enabled === true,
  };
}
export type Collection = { id: string; name: string; keys: string[] };
export type Activity = {
  id: string;
  key: string;
  locale: Locale;
  revision: number;
  at: number;
  complete: boolean;
  started: boolean;
  prepared?: boolean;
};
export type LibraryProfile = {
  name: string;
  role: "family" | "educator" | "learner" | "professional";
  goal: string;
  interests: string[];
};
export type Personal = {
  profile: LibraryProfile;
  version: 3;
  saved: { key: string; at: number }[];
  recent: { key: string; at: number }[];
  queue: string[];
  collections: Collection[];
  activity: Activity[];
  preferences: {
    motion: boolean;
    lowData: boolean;
    measurement: boolean;
    advertising: boolean;
  };
  updatedAt: number;
};
export const blankPersonal = (): Personal => ({
  version: 3,
  profile: { name: "", role: "family", goal: "", interests: [] },
  saved: [],
  recent: [],
  queue: [],
  collections: [],
  activity: [],
  preferences: {
    motion: true,
    lowData: false,
    measurement: false,
    advertising: false,
  },
  updatedAt: 0,
});
export function cleanKeys(v: unknown, max = LIMITS.queue): string[] {
  return Array.isArray(v)
    ? [
        ...new Set(
          v.filter(
            (s): s is string => typeof s === "string" && KEY_PATTERN.test(s),
          ),
        ),
      ].slice(0, max)
    : [];
}
export function parsePersonal(raw: unknown, now = Date.now()): Personal {
  const p = obj(raw),
    b = blankPersonal(),
    ttl = 90 * 86400000;
  const entries = (v: unknown, max: number) =>
    rows(v)
      .filter(
        (x) =>
          KEY_PATTERN.test(str(x.key)) &&
          Number.isFinite(x.at) &&
          x.at <= now &&
          now - x.at < ttl,
      )
      .filter((x, i, a) => a.findIndex((y) => y.key === x.key) === i)
      .slice(0, max)
      .map((x) => ({ key: x.key as string, at: x.at as number }));
  const profile = obj(p.profile),
    text = (v: unknown, max: number) =>
      str(v)
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, max);
  const families = [
    "documents",
    "printables",
    "stories",
    "learning",
    "video",
    "audio",
    "visual-cards",
    "presentations",
    "assessments",
    "activities",
    "tools",
    "planners",
    "forms",
    "community",
    "commerce",
    "bundles",
  ];
  b.profile = {
    name: text(profile.name, 60),
    goal: text(profile.goal, 120),
    role: ["family", "educator", "learner", "professional"].includes(
      profile.role,
    )
      ? profile.role
      : "family",
    interests: cleanKeys(profile.interests, 16).filter((k) =>
      families.includes(k),
    ),
  };
  b.saved = entries(p.saved, LIMITS.saved);
  b.recent = entries(p.recent, LIMITS.recent);
  b.queue = cleanKeys(p.queue);
  b.collections = rows(p.collections)
    .filter((x) => /^[a-zA-Z0-9-]{1,80}$/.test(str(x.id)) && str(x.name))
    .slice(0, LIMITS.collections)
    .map((x) => ({
      id: x.id,
      name: str(x.name).slice(0, 80),
      keys: cleanKeys(x.keys, LIMITS.collectionItems),
    }));
  b.activity = rows(p.activity)
    .filter(
      (x) =>
        KEY_PATTERN.test(str(x.key)) &&
        ["en", "fr", "ar"].includes(x.locale) &&
        str(x.id) &&
        Number.isFinite(x.at) &&
        now - x.at < ttl &&
        x.at <= now,
    )
    .slice(0, 500)
    .map((x) => ({
      id: x.id,
      key: x.key,
      locale: x.locale,
      revision: Number(x.revision) || 0,
      at: x.at,
      complete: x.complete === true,
      started: x.started === true,
      prepared: x.prepared === true,
    }));
  b.preferences = {
    motion: p.preferences?.motion !== false,
    lowData: p.preferences?.lowData === true,
    measurement: p.preferences?.measurement === true,
    advertising: p.preferences?.advertising === true,
  };
  b.updatedAt = Number(p.updatedAt) || 0;
  return b;
}
export function sessionLink(locale: Locale, keys: string[]) {
  return (
    "/kidflix/" +
    locale +
    "/my?plan=" +
    encodeURIComponent(cleanKeys(keys, 30).join(","))
  );
}
export function moveKey(keys: string[], key: string, offset: number) {
  const a = [...keys],
    i = a.indexOf(key),
    j = i + offset;
  if (i >= 0 && j >= 0 && j < a.length) [a[i], a[j]] = [a[j], a[i]];
  return a;
}
