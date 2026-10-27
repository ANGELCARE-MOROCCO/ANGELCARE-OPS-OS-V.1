export const WORLDS = ["angelcare", "kidflix", "jobkix"] as const;
export type World = (typeof WORLDS)[number];
export type Row = Record<string, unknown>;
export type TaskKind = "crawl" | "links" | "verify" | "indexnow";
export type ChangePatch = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  relatedPaths?: string[];
  schema?: boolean;
  body?: string;
  heading?: string;
};
export type Project = {
  id: string;
  world: World;
  name: string;
  origin: string;
  enabled: boolean;
  version: number;
  policy: Policy;
};
export type Policy = {
  crawlBudget: number;
  linksPerPage: number;
  timeoutSeconds: number;
  intervalHours: number;
  scheduleEnabled: boolean;
  indexNowEnabled: boolean;
  autoCanonical: boolean;
};
export const DEFAULT_POLICY: Policy = {
  crawlBudget: 120,
  linksPerPage: 30,
  timeoutSeconds: 8,
  intervalHours: 24,
  scheduleEnabled: false,
  indexNowEnabled: false,
  autoCanonical: false,
};
export type Page = {
  id: string;
  project_id: string;
  path: string;
  locale: string;
  kind: string;
  title: string;
  description: string;
  http_status: number | null;
  indexable: boolean;
  content_hash: string | null;
  facts: Facts | null;
  last_scanned_at: string | null;
  published_change_id: string | null;
  version: number;
};
export type Facts = {
  url: string;
  status: number;
  title: string;
  description: string;
  canonical: string;
  lang: string;
  robots: string;
  headings: string[];
  text: string;
  links: { url: string; label: string }[];
  images: { src: string; alt: string | null }[];
  schemas: unknown[];
  schemaErrors: number;
  hreflang: { language: string; url: string }[];
  fetchedAt: string;
  elapsedMs: number;
  contentHash: string;
  related: string[];
  seoPower: string;
  sourceStamp: string;
  revision: string;
  bodyHook: string;
};
export type Finding = {
  code: string;
  severity: "critical" | "warning" | "info";
  message: string;
  evidence: string;
  action: "metadata" | "source" | "link" | "schema";
};
export type Snapshot = {
  ready: boolean;
  error?: string;
  projects: Project[];
  pages: Page[];
  total: number;
  jobs: Row[];
  findings: Row[];
  changes: Row[];
  receipts: Row[];
  ci: Row[];
  runtime: Row;
  summary: Row;
  permissions: { manage: boolean; publish: boolean; rollback: boolean };
  actor: string;
};
export class SeoFault extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "SeoFault";
  }
}
export function record(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
}
export function text(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export function uuid(value: unknown): string {
  const s = text(value, 36);
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      s,
    )
  )
    throw new SeoFault("INVALID_ID", "Identifiant invalide.");
  return s;
}
export function integer(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}
export function root(world: World) {
  return world === "angelcare" ? "/angelcare-marketplace" : "/" + world;
}
export function locales(world: World): string[] {
  return world === "jobkix"
    ? ["en", "fr", "es", "hi", "tl", "id", "ar"]
    : ["en", "fr", "ar"];
}
export function publicPath(input: string, world: World): string {
  if (
    !input.startsWith("/") || input.length>1800 || input.includes("//") ||
    input.startsWith("//") ||
    /[\\\s\u0000-\u001f?#]/.test(input) ||
    /%2f|%5c|%00|%2e/i.test(input)
  )
    throw new SeoFault(
      "INVALID_PATH",
      "URL canonique sans paramètres requise.",
    );
  const normalized = input.length > 1 ? input.replace(/\/+$/, "") : input;
  const parts = normalized.split("/").filter(Boolean);
  if (
    parts[0] !== root(world).slice(1) ||
    !locales(world).includes(parts[1]) ||
    parts.some((p) => p === "." || p === "..")
  )
    throw new SeoFault(
      "WRONG_WORLD",
      "Cette URL ne relève pas de cet univers et de ses langues.",
    );
  try {
    parts.forEach((p) => decodeURIComponent(p));
  } catch {
    throw new SeoFault("INVALID_PATH", "Encodage URL invalide.");
  }
  if (
    parts
      .slice(2)
      .some((p) =>
        /^(admin|api|auth|login|logout|signin|signup|sign-in|sign-up|register|reset-password|callback|account|my-angelcare|my|saved|candidate|candidates|hirer|dashboard|workspace|applications|messages|profile|basket|checkout|quote-basket|quotation|subscription|enrollment|booking|preview|payment|payments)$/i.test(
          decodeURIComponent(p),
        ),
      )
  )
    throw new SeoFault(
      "PRIVATE_PATH",
      "Les espaces privés et les transactions sont exclus du SEO.",
    );
  return normalized;
}
export function canonicalOrigin(input: unknown): string {
  let url: URL;
  try {
    url = new URL(text(input, 400));
  } catch {
    throw new SeoFault("INVALID_ORIGIN", "Origine HTTPS publique requise.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !url.hostname.includes(".") ||
    /^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i.test(url.hostname) ||
    /^[\d.:\[\]]+$/.test(url.hostname)
  )
    throw new SeoFault(
      "INVALID_ORIGIN",
      "Domaine public HTTPS requis, sans port, chemin ou identifiants.",
    );
  return url.origin;
}
export function targetUrl(input: string, project: Project): URL {
  const origin = canonicalOrigin(project.origin),
    url = new URL(input, origin);
  if (
    url.origin !== origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new SeoFault(
      "OUTSIDE_SCOPE",
      "URL hors du périmètre canonique autorisé.",
    );
  publicPath(url.pathname, project.world);
  return url;
}
export function parsePolicy(input: unknown): Policy {
  const v = record(input);
  return {
    crawlBudget: integer(v.crawlBudget, 5, 1000, 120),
    linksPerPage: integer(v.linksPerPage, 1, 100, 30),
    timeoutSeconds: integer(v.timeoutSeconds, 3, 12, 8),
    intervalHours: integer(v.intervalHours, 1, 168, 24),
    scheduleEnabled: v.scheduleEnabled === true,
    indexNowEnabled: v.indexNowEnabled === true,
    autoCanonical: v.autoCanonical === true,
  };
}
export function parsePatch(
  input: unknown,
  project: Project,
  kind: string,
): ChangePatch {
  const v = record(input),
    result: ChangePatch = {};
  for (const field of ["title", "description", "heading", "body"] as const)
    if (v[field] !== undefined) {
      const limit =
        field === "body" ? 24000 : field === "description" ? 320 : 180;
      if (
        typeof v[field] !== "string" ||
        v[field].length > limit ||
        /[\u0000-\u0008]/.test(v[field])
      )
        throw new SeoFault("INVALID_PATCH", "Champ invalide : " + field);
      result[field] = text(v[field], limit);
    }
  if (v.canonicalPath)
    result.canonicalPath = publicPath(String(v.canonicalPath), project.world);
  if (v.relatedPaths !== undefined) {
    if (
      !Array.isArray(v.relatedPaths) ||
      v.relatedPaths.length > 12 ||
      v.relatedPaths.some((p) => typeof p !== "string")
    )
      throw new SeoFault(
        "INVALID_LINKS",
        "Douze liens contextuels au maximum.",
      );
    result.relatedPaths = [
      ...new Set(v.relatedPaths.map((p) => publicPath(p, project.world))),
    ];
  }
  if (v.schema !== undefined) result.schema = v.schema === true;
  if (
    kind === "landing" &&
    (!result.title ||
      !result.description ||
      !result.heading ||
      !result.body ||
      result.body.length < 150)
  )
    throw new SeoFault(
      "INCOMPLETE_CONTENT",
      "Une page doit avoir un titre, une description, un H1 et au moins 150 caractères de contenu original.",
    );
  if (!Object.keys(result).length)
    throw new SeoFault("EMPTY_CHANGE", "Aucun changement à préparer.");
  if (
    kind !== "landing" &&
    (result.body !== undefined || result.heading !== undefined)
  )
    throw new SeoFault(
      "SOURCE_OWNERSHIP",
      "Le corps des pages natives reste géré dans son Studio.",
    );
  return result;
}
export function findings(f: Facts, project: Project): Finding[] {
  const out: Finding[] = [],
    add = (
      code: string,
      severity: Finding["severity"],
      message: string,
      evidence: string,
      action: Finding["action"],
    ) => out.push({ code, severity, message, evidence, action });
  if (f.status !== 200) {
    add(
      "HTTP_STATUS",
      "critical",
      "La page ne répond pas HTTP 200.",
      String(f.status),
      "source",
    );
    return out;
  }
  if (/noindex/i.test(f.robots))
    add(
      "NOINDEX",
      "info",
      "Page non indexable : vérifier l’intention du Studio.",
      f.robots,
      "source",
    );
  if (!f.title)
    add("TITLE_MISSING", "critical", "Titre de page absent.", "", "metadata");
  if (!f.description)
    add(
      "DESCRIPTION_MISSING",
      "warning",
      "Description absente.",
      "",
      "metadata",
    );
  if (!f.canonical)
    add(
      "CANONICAL_MISSING",
      "warning",
      "URL canonique absente.",
      f.url,
      "metadata",
    );
  else {
    try {
      const u = new URL(f.canonical, f.url);
      if (u.origin !== project.origin)
        add(
          "CANONICAL_EXTERNAL",
          "critical",
          "Canonique sur un autre domaine : révision nécessaire.",
          u.href,
          "metadata",
        );
    } catch {
      add(
        "CANONICAL_INVALID",
        "critical",
        "Canonique invalide.",
        f.canonical,
        "metadata",
      );
    }
  }
  if (f.headings.length !== 1)
    add(
      "H1_COUNT",
      "warning",
      "Vérifier le titre principal.",
      String(f.headings.length) + " H1",
      "source",
    );
  if (!f.lang)
    add("LANG_MISSING", "warning", "Langue du document absente.", "", "source");
  const missingAlt = f.images.filter((i) => i.alt === null).length;
  if (missingAlt)
    add(
      "IMAGE_ALT_MISSING",
      "warning",
      "Des images nécessitent une décision éditoriale sur leur alternative textuelle.",
      String(missingAlt),
      "source",
    );
  if (f.schemaErrors)
    add(
      "JSONLD_INVALID",
      "critical",
      "JSON-LD non lisible.",
      String(f.schemaErrors),
      "schema",
    );
  if (!f.schemas.length)
    add(
      "SCHEMA_MISSING",
      "info",
      "Aucune donnée structurée détectée.",
      "",
      "schema",
    );
  return out;
}
export function stageLabel(state: string): string {
  return (
    (
      {
        queued: "En attente",
        running: "En cours",
        succeeded: "Terminé",
        failed: "Échec",
        cancelled: "Annulé",
        draft: "Brouillon",
        approved: "Approuvé",
        published: "Publié",
        superseded: "Remplacé",
        reverted: "Restauré",
        open: "Ouvert",
        resolved: "Résolu",
        ignored: "Écarté",
      } as Record<string, string>
    )[state] || state
  );
}
