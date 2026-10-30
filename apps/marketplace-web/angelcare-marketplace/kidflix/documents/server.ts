import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { card, publicHost } from "../server";
import { blankFacts } from "../storefronts/model";
import { publishedCoverHref } from "../detail/published-media";
import {
  documentFilters,
  normalizeDocumentSocialLinks,
  emptyDocuments,
  validLocale,
  type DocumentsData,
  type DocumentItem,
} from "./model";
import type { Locale } from "../catalogue";
const obj = (v: any): Record<string, any> =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};
const strings = (v: any) =>
  Array.isArray(v)
    ? v.filter((s): s is string => typeof s === "string").slice(0, 100)
    : [];
const natural = (v: any) =>
  Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0;
export function documentCard(row: any, locale: Locale): DocumentItem | null {
  const x = obj(row),
    contentLocale = validLocale(x.contentLocale) ? x.contentLocale : locale,
    r = card(x, contentLocale);
  if (!r || r.family !== "documents") return null;
  const outputs = (Array.isArray(x.outputs) ? x.outputs : [])
    .filter(
      (o: any) =>
        o &&
        typeof o.id === "string" &&
        typeof o.label === "string" &&
        ["application/pdf", "image/png"].includes(o.mime),
    )
    .map((o: any) => ({ id: o.id, label: o.label, mime: o.mime }));
  const ratingCount = natural(x.ratingCount),
    rating =
      ratingCount > 0 && Number(x.rating) >= 1 && Number(x.rating) <= 5
        ? Number(x.rating)
        : null;
  return {
    ...r,
    image: publishedCoverHref(x.key, x.release_id, contentLocale, obj(x.definition).coverAssetId) || r.image,
    contentLocale,
    facts: {
      ...blankFacts(),
      formats: [
        ...new Set<string>(
          outputs.map((o: any) =>
            o.mime === "application/pdf" ? "PDF" : "PNG",
          ),
        ),
      ],
    },
    formats: [
      ...new Set<string>(
        outputs.map((o: any) => (o.mime === "application/pdf" ? "PDF" : "PNG")),
      ),
    ],
    subtype: typeof x.subtype === "string" ? x.subtype : "",
    documentUses: strings(x.documentUses),
    grades: strings(x.grades),
    themes: strings(x.themes),
    needs: strings(x.needs),
    documentSubject:
      typeof x.documentSubject === "string" ? x.documentSubject : "",
    downloadTotal: natural(x.downloadTotal),
    todayDownloads: natural(x.todayDownloads),
    rating,
    ratingCount,
    outputs,
  };
}
export async function getDocuments(
  host: string,
  locale: Locale,
  input: Record<string, unknown> = {},
): Promise<DocumentsData> {
  const filters = documentFilters(input),
    db = await createServiceClient(),
    result = await db.rpc("ac_kidflix_documents_r1", {
      p_host: publicHost(host),
      p_locale: locale,
      p_filters: filters,
      p_page: Number(filters.page || 1),
    });
  if (result.error) {
    console.error("KIDFLIX_DOCUMENTS_RPC_FAILED", { code: result.error.code, message: result.error.message });
    const e = new Error("DOCUMENTS_UNAVAILABLE") as Error & {
      setupRequired?: boolean;
    };
    e.setupRequired = ["PGRST202", "42883", "42P01"].includes(
      result.error.code,
    );
    throw e;
  }
  const v = obj(result.data),
    map = (rows: any) =>
      Array.isArray(rows)
        ? rows
            .map((x) => documentCard(x, locale))
            .filter((x): x is DocumentItem => !!x)
        : [];
  return {
    ...emptyDocuments(),
    configured: v.configured === true,
    rows: map(v.rows),
    total: natural(v.total),
    page: Math.max(1, natural(v.page) || 1),
    pageSize: 10,
    inventoryTotal: natural(v.inventoryTotal),
    downloadTotal: natural(v.downloadTotal),
    todayTotal: natural(v.todayTotal),
    facets: Object.fromEntries(
      Object.entries(obj(v.facets)).map(([k, value]) => [k, strings(value)]),
    ),
    ranked: map(v.ranked),
    today: map(v.today),
    collections: (Array.isArray(v.collections) ? v.collections : [])
      .slice(0, 8)
      .map((c: any) => ({
        id: String(c.id || ""),
        title: String(c.title || ""),
        description: String(c.description || ""),
        rows: map(c.rows),
      }))
      .filter((c: any) => c.id && c.title && c.rows.length),
    testimonials: (Array.isArray(v.testimonials) ? v.testimonials : [])
      .slice(0, 12)
      .filter(
        (t: any) =>
          t &&
          typeof t.name === "string" &&
          typeof t.body === "string" &&
          /^https:\/\//.test(t.sourceUrl || "") &&
          t.rating >= 1 &&
          t.rating <= 5,
      )
      .map((t: any) => ({
        id: String(t.id || ""),
        name: t.name,
        role: String(t.role || ""),
        body: t.body,
        rating: Number(t.rating),
        resourceKey: String(t.resourceKey || ""),
        sourceUrl: t.sourceUrl,
        portrait: /^(https:\/\/|\/(?!\/))/.test(t.portrait || "")
          ? t.portrait
          : "",
      })),
    updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : "",
    edition: {
      ...obj(v.edition),
      documentsSocialLinks: normalizeDocumentSocialLinks(
        obj(v.edition).documentsSocialLinks,
      ),
    },
  };
}
export async function loadDocuments(
  host: string,
  locale: Locale,
  input: Record<string, unknown> = {},
) {
  try {
    return await getDocuments(host, locale, input);
  } catch (e) {
    return {
      ...emptyDocuments(),
      error: true,
      setupRequired: Boolean((e as any)?.setupRequired),
    };
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin"),
    host = request.headers.get("host") || new URL(request.url).host;
  if (
    !origin ||
    new URL(origin).host.toLowerCase() !== host.toLowerCase() ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw Error("ORIGIN_REJECTED");
  return publicHost(host);
}
export async function takeBudget(
  request: Request,
  host: string,
  locale: Locale,
  kind: "newsletter" | "delivery",
) {
  const secret = process.env.MARKETPLACE_DCE_ANALYTICS_SECRET || "";
  if (secret.length < 32) throw Error("RATE_LIMIT_UNAVAILABLE");
  // Raw network identifiers are never persisted. Trusted ingress must overwrite forwarded IP headers.
  const address = (
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unresolved"
    )
      .trim()
      .slice(0, 200),
    rateKey = createHmac("sha256", secret)
      .update(publicHost(host) + "|" + kind + "|" + address)
      .digest("hex"),
    db = await createServiceClient();
  const r = await db.rpc("ac_kidflix_documents_budget", {
    p_host: publicHost(host),
    p_locale: locale,
    p_rate_key: rateKey,
    p_kind: kind,
  });
  if (r.error) throw Error("RATE_LIMIT_UNAVAILABLE");
  if (r.data !== true) throw Error("RATE_LIMITED");
}
export async function subscribeDocuments(request: Request, input: any) {
  const host = sameOrigin(request);
  if (
    !input ||
    !validLocale(input.locale) ||
    input.consent !== true ||
    typeof input.email !== "string" ||
    input.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) ||
    input.website
  )
    throw Error("INVALID_SUBSCRIPTION");
  if (/[\u0000-\u0020\u007f<>()"\\]/.test(input.email.trim()))
    throw Error("INVALID_SUBSCRIPTION");
  await takeBudget(request, host, input.locale, "newsletter");
  const token = randomBytes(32).toString("base64url"),
    db = await createServiceClient(),
    r = await db.rpc("ac_kidflix_documents_subscribe", {
      p_host: host,
      p_locale: input.locale,
      p_email: input.email.trim().toLowerCase(),
      p_id: randomUUID(),
      p_unsubscribe_hash: createHash("sha256").update(token).digest("hex"),
      p_consent: true,
    });
  if (r.error || r.data?.recorded !== true)
    throw Error("SUBSCRIPTION_UNAVAILABLE");
  return { recorded: true, unsubscribeToken: token };
}
export async function unsubscribeDocuments(request: Request, input: any) {
  const host = sameOrigin(request);
  if (
    typeof input?.token !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(input.token)
  )
    throw Error("INVALID_TOKEN");
  const db = await createServiceClient(),
    r = await db.rpc("ac_kidflix_documents_unsubscribe", {
      p_host: host,
      p_hash: createHash("sha256").update(input.token).digest("hex"),
    });
  if (r.error) throw Error("SUBSCRIPTION_UNAVAILABLE");
  return { unsubscribed: true };
}
