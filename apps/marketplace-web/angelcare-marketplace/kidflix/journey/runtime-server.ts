import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getExperience, getHome } from "../server";
import { getStorefront } from "../storefronts/server";
import { world } from "../catalogue";
import { effectiveAdPolicy } from "../../digital-customer-experience/model";
import { recordVisitorDceActivity } from "../../digital-customer-experience/activity";
import type { DceRecord } from "../../digital-customer-experience/types";
import { obj, rows, str, type Row } from "../detail/model";
import type { Locale } from "../catalogue";
const sign = (v: string) =>
  createHmac("sha256", getSupabaseEnv().serviceRoleKey)
    .update("kidflix-outcome-v3:" + v)
    .digest("base64url");
export function outcomeReceipt(
  key: string,
  locale: Locale,
  releaseId: string,
  kind: "result" | "complete" | "download_pdf" | "download_png",
) {
  const value = Buffer.from(
    JSON.stringify({
      key,
      locale,
      releaseId,
      kind,
      receiptId: randomUUID(),
      expires: Date.now() + 15 * 60000,
    }),
  ).toString("base64url");
  return value + "." + sign(value);
}
export function readOutcome(
  value: unknown,
  key: string,
  locale: Locale,
  releaseId: string,
) {
  if (typeof value !== "string" || value.length > 1500) return null;
  const [body, signature] = value.split("."),
    expected = sign(body || "");
  if (
    !signature ||
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return null;
  try {
    const v = JSON.parse(Buffer.from(body, "base64url").toString());
    return v.key === key &&
      v.locale === locale &&
      v.releaseId === releaseId &&
      v.expires > Date.now()
      ? v
      : null;
  } catch {
    return null;
  }
}
async function scopedRecords(root: Row) {
  const db = await createServiceClient(),
    out: DceRecord[] = [];
  for (let page = 0; ; page++) {
    let q = db
      .from("ac_dce_records")
      .select("*")
      .in("kind", ["ad_policy", "ad_connection", "ad_unit", "setting"])
      .neq("lifecycle", "archived")
      .order("id")
      .range(page * 500, page * 500 + 499);
    for (const k of ["tenant_id", "territory_id"])
      q = root[k] == null ? q.is(k, null) : q.eq(k, root[k]);
    const r = await q;
    if (r.error) throw Error("CONFIGURATION_UNAVAILABLE");
    out.push(...r.data);
    if (r.data.length < 500) return out;
  }
}
export async function adDecision(
  host: string,
  locale: Locale,
  key: string,
  zone: string,
  input: Row,
) {
  const db = await createServiceClient();
  let value: Row, root: Row;
  if (typeof input.pageFamily === "string") {
    const home = await getHome(host, locale);
    if (!home.published) throw Error("NOT_FOUND");
    const config = await db
      .from("ac_dce_records")
      .select("id,tenant_id,territory_id")
      .eq("kind", "setting")
      .eq("key", "kidflix-homepage")
      .eq("data->>liveHost", host)
      .neq("lifecycle", "archived")
      .maybeSingle();
    if (config.error || !config.data) throw Error("NOT_FOUND");
    root = config.data;
    const family = str(input.pageFamily);
    if (family && !world(family)) throw Error("INVALID_FAMILY");
    const slots = family
      ? (await getStorefront(host, locale, family, {}, false)).edition.adSlots
      : home.edition.adSlots;
    if (!slots.includes(str(input.pageSlot)))
      return { eligible: false, reason: "NO_PUBLISHED_PAGE_PLACEMENT" };
    value = {
      releaseId: "",
      manifest: {
        id: root.id,
        family,
        audience: "child",
        definition: { adBreaks: [{ enabled: true, event: zone }] },
      },
    };
  } else {
    const v = await getExperience(host, locale, key);
    if (!v) throw Error("NOT_FOUND");
    value = v;
    const q = await db
      .from("ac_dce_releases")
      .select("id,tenant_id,territory_id")
      .eq("id", value.releaseId)
      .eq("state", "published")
      .maybeSingle();
    if (q.error || !q.data) throw Error("NOT_FOUND");
    root = q.data;
  }
  const all = await scopedRecords(root),
    m = value.manifest,
    d = obj(m.definition);
  const authored = rows(d.adBreaks).some(
    (b) => b.enabled === true && b.event === zone,
  );
  if (!authored) return { eligible: false, reason: "NO_AUTHORED_PLACEMENT" };
  const connections = all.filter(
      (r) =>
        r.kind === "ad_connection" &&
        obj(r.data.providerEvidence).ready === true &&
        Date.now() - Date.parse(str(obj(r.data.providerEvidence).observedAt)) <
          86400000,
    ),
    programs = connections.flatMap((r) =>
      Array.isArray(obj(r.data.providerEvidence).approvedPrograms)
        ? obj(r.data.providerEvidence).approvedPrograms
        : [],
    );
  const count = Math.max(0, Math.min(100, Number(input.count) || 0)),
    last = Math.max(0, Math.min(Date.now(), Number(input.last) || 0));
  const decision = effectiveAdPolicy(all, {
    family: m.family,
    topic: str(d.subject),
    templateId: str(d.templateId),
    experienceId: m.id,
    releaseId: value.releaseId,
    zone,
    audience: m.audience || "child",
    locale,
    device: input.device === "mobile" ? "mobile" : "desktop",
    consent: input.consent === true ? "granted" : "denied",
    programs,
    monetizationEnabled: all.some(
      (r) =>
        r.kind === "setting" &&
        r.key === "world-defaults" &&
        r.data.monetizationEnabled === true,
    ),
    impressionCount: count,
    lastImpressionAt: last || undefined,
    previousSpacing: Number(input.spacing) || 0,
  });
  if (!decision.eligible) return { eligible: false, reason: decision.reason };
  const rule = decision.rule!,
    unit = all.find(
      (r) => r.kind === "ad_unit" && r.data.unitId === rule.data.unitId,
    ),
    connection = connections.find((r) =>
      /^((ca-)?pub-)?\d{16}$/.test(str(r.data.publisherId)),
    );
  if (!["01", "14"].includes(str(rule.data.formatId)))
    return { eligible: false, reason: "FORMAT_REQUIRES_SPECIALIST_ADAPTER" };
  if (
    !unit ||
    unit.data.localEnabled !== true ||
    obj(unit.data.providerEvidence).state !== "ACTIVE" ||
    !Number.isFinite(
      Date.parse(str(obj(unit.data.providerEvidence).observedAt)),
    ) ||
    Date.now() - Date.parse(str(obj(unit.data.providerEvidence).observedAt)) >=
      86400000 ||
    !connection
  )
    return { eligible: false, reason: "UNIT_OR_PROVIDER_NOT_READY" };
  const publisher =
      "ca-pub-" + str(connection.data.publisherId).replace(/^(ca-)?pub-/, ""),
    slot = str(unit.data.unitId).replace(/^.*\//, "");
  if (!/^ca-pub-\d{16}$/.test(publisher) || !/^\d{5,20}$/.test(slot))
    return { eligible: false, reason: "INVALID_NATIVE_AD_IDENTIFIERS" };
  return {
    eligible: true,
    reason: "ELIGIBLE",
    publisher,
    slot,
    format: "auto",
    ageTreatment: 1,
    policyId: rule.id,
    maximumCount: Number(rule.data.maximumCount) || 2,
    frequencyMinutes: Number(rule.data.frequencyMinutes) || 30,
  };
}
export async function visitorEvent(
  host: string,
  key: string,
  locale: Locale,
  identity: string,
  input: Row,
) {
  if (input.consent !== true)
    return { received: false, reason: "measurement_not_consented" };
  const v = await getExperience(host, locale, key);
  if (!v || v.releaseId !== input.releaseId) throw Error("EDITION_CHANGED");
  const proof = readOutcome(input.receipt, key, locale, v.releaseId),
    action = str(input.action);
  if (
    ["complete", "result_view", "download_pdf", "download_png"].includes(
      action,
    ) &&
    !proof
  )
    throw Error("OUTCOME_NOT_VERIFIED");
  return recordVisitorDceActivity({
    id: proof ? proof.receiptId : str(input.id),
    releaseId: v.releaseId,
    visitorKey: identity,
    action,
    consent: true,
    locale,
    unitId: typeof input.unitId === "string" ? input.unitId : undefined,
    ...(proof
      ? {
          verifiedOutcome: {
            kind: proof.kind,
            releaseId: proof.releaseId,
            receiptId: proof.receiptId,
          },
        }
      : {}),
  });
}

export function readPacing(cookie: unknown) {
  if (typeof cookie !== "string" || cookie.length > 600)
    return { count: 0, last: 0 };
  const [body, signature] = cookie.split("."),
    expected = sign(body || "");
  if (
    !signature ||
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return { count: 0, last: 0 };
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (
      !Number.isSafeInteger(p.count) ||
      p.count < 0 ||
      p.count > 100 ||
      !Number.isFinite(p.last) ||
      p.last > Date.now() ||
      Date.now() - p.last > 86400000
    )
      return { count: 0, last: 0 };
    return { count: p.count as number, last: p.last as number };
  } catch {
    return { count: 0, last: 0 };
  }
}
export function nextPacing(old: { count: number; last: number }) {
  const body = Buffer.from(
    JSON.stringify({ count: old.count + 1, last: Date.now() }),
  ).toString("base64url");
  return body + "." + sign(body);
}
