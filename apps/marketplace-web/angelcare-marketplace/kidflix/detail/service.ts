import { contextualRecommendations } from "../../digital-customer-experience/experience-depth";
import "server-only";
import { nativeReferenceInScope } from "./native-reference-scope";
import {
  gradeClassification,
  gradeSoundPair,
  gradeBridge,
  gradeTaskActivity,
} from "../../digital-customer-experience/detail-interactions";
import { createServiceClient } from "@/lib/supabase/server";
import {
  getExperience,
  getHome,
  getCatalogue,
  publicDetail,
  publicHost,
} from "../server";
import { getStorefront } from "../storefronts/server";
import { isLocale, type Locale } from "../catalogue";
import { editionProjection } from "../../digital-customer-experience/experience-contract";
import { scoreQuestions } from "../../digital-customer-experience/model";

import {
  obj,
  rows,
  str,
  num,
  publishedReferences,
  restoreOutputIdentities,
  cleanPublic,
  type Row,
  type DetailValue,
} from "./model";
const uuid = (s: unknown) =>
  typeof s === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
async function checked(q: PromiseLike<any>) {
  const r = await q;
  if (r.error) throw Error("SOURCE_UNAVAILABLE");
  return r.data;
}
const scope = (q: any, z: Row) =>
  ["tenant_id", "territory_id"].reduce(
    (a, k) => (z[k] == null ? a.is(k, null) : a.eq(k, z[k])),
    q,
  );
export async function getDetail(
  host: string,
  locale: Locale,
  key: string,
): Promise<DetailValue | null> {
  const value = await getExperience(host, locale, key);
  if (!value) return null;
  const home = await getHome(host, locale);
  const db = await createServiceClient(),
    root = await checked(
      db
        .from("ac_dce_releases")
        .select("id,tenant_id,territory_id")
        .eq("id", value.releaseId)
        .eq("state", "published")
        .maybeSingle(),
    );
  if (!root) return null;
  async function hydrate(
    manifest: Row,
    depth = 0,
    ancestors = new Set<string>(),
    releaseId = value!.releaseId,
  ): Promise<Row> {
    let publicManifest = manifest;
    if (
      rows(obj(manifest.definition).outputs).some((output) => !str(output.id))
    ) {
      const edition = await checked(
        scope(
          db
            .from("ac_dce_releases")
            .select("snapshot")
            .eq("id", releaseId)
            .eq("state", "published"),
          root,
        ).maybeSingle(),
      );
      if (edition?.snapshot)
        publicManifest = restoreOutputIdentities(
          manifest,
          obj(editionProjection(edition.snapshot, locale).data),
        );
    }
    const out = cleanPublic(publicDetail(publicManifest)) as Row;
    const defaults = home.edition.familyTools?.[manifest.family] || {};
    out.definition = {
      ...out.definition,
      ...Object.fromEntries(
        Object.entries(defaults).filter(([, v]) => v === false),
      ),
    };
    out.bindings = { ...out.bindings, records: {}, offers: {} };
    const mediaIds = Object.keys(obj(manifest.bindings?.media)).filter(uuid);
    out.bindings.media = {};
    for (let i = 0; i < mediaIds.length; i += 100) {
      // Native media is a shared vault. IDs come only from this published manifest.
      const media = await checked(
        db.from("angelcare_marketplace_media_assets").select("*")
          .in("id", mediaIds.slice(i, i + 100)),
      );
      for (const a of media || []) {
        if (!nativeReferenceInScope(a, root)) continue;
        const url = a.public_url || a.desktop_url || "";
        if (
          a.status !== "active" ||
          a.metadata?.status === "failed" ||
          (a.rights_expires_at &&
            Date.parse(a.rights_expires_at) <= Date.now()) ||
          !/^(https:\/\/|\/(?!\/))/i.test(url)
        )
          continue;
        out.bindings.media[a.id] = {
          id: a.id,
          url,
          mime: a.mime_type || "",
          title: a.file_name || "",
          bytes: a.size_bytes || 0,
          width: a.width || a.metadata?.width || null,
          height: a.height || a.metadata?.height || null,
          duration: a.duration_seconds || a.metadata?.duration || null,
          pages: a.metadata?.pages || null,
        };
      }
    }
    if (depth >= 4) return out;
    const ids = publishedReferences(manifest)
      .filter(uuid)
      .filter((id) => !ancestors.has(id));
    if (ids.length > 1000) throw Error("REFERENCE_LIMIT");
    if (ids.length) {
      const records = await checked(
          scope(
            db
              .from("ac_dce_records")
              .select("id,key,kind,lifecycle")
              .in("id", ids)
              .neq("lifecycle", "archived"),
            root,
          ),
        ),
        editions = await checked(
          scope(
            db
              .from("ac_dce_editions")
              .select("record_id,active_release_id")
              .in("record_id", ids)
              .eq("locale", locale),
            root,
          ),
        ),
        releaseIds = editions.map((e: Row) => e.active_release_id).filter(uuid);
      if (releaseIds.length) {
        const releases = await checked(
          scope(
            db
              .from("ac_dce_releases")
              .select("id,record_id,manifest")
              .in("id", releaseIds)
              .eq("state", "published"),
            root,
          ),
        );
        for (const r of records) {
          const z = releases.find(
            (z: Row) =>
              z.record_id === r.id && z.manifest?.editionLocale === locale,
          );
          if (
            !z ||
            !["experience", "bundle", "content"].includes(r.kind) ||
            (obj(z.manifest.definition).visibility &&
              !["free", "public"].includes(z.manifest.definition.visibility))
          )
            continue;
          out.bindings.records[r.id] = {
            ...(await hydrate(
              z.manifest,
              depth + 1,
              new Set([...ancestors, r.id]),
              z.id,
            )),
            key: r.key,
            kind: r.kind,
            releaseId: z.id,
          };
        }
      }
    }
    const offerIds = [
      ...new Set(
        rows(manifest.definition?.offers)
          .map((o) => o.nativeId)
          .filter(uuid),
      ),
    ];
    if (offerIds.length) {
      const offers = await checked(
        db.from("angelcare_marketplace_catalog_discovery_v").select("*")
          .in("id", offerIds).eq("status", "published"),
      );
      for (const offer of offers) {
        if (!nativeReferenceInScope(offer, root)) continue;
        if (!/^[a-z0-9][a-z0-9-]*$/i.test(offer.slug || "")) continue;
        out.bindings.offers[offer.id] = {
          id: offer.id,
          title: offer["name_" + locale] || offer.name_en || offer.name_fr,
          kind: offer.kind,
          price: offer.price_amount,
          currency: offer.currency_label,
          availability: offer.availability_status,
          url:
            "/angelcare-marketplace/" +
            locale +
            "/marketplace/item/" +
            offer.slug,
        };
      }
    }
    return out;
  }
  // Fetch the current published manifest again to retain public reusable-content references, never source snapshots.
  const raw = await checked(
    db.rpc("ac_kidflix_experience", {
      p_host: publicHost(host),
      p_locale: locale,
      p_key: key,
    }),
  );
  if (!raw || raw.releaseId !== value.releaseId) return null;
  return { ...value, manifest: await hydrate(obj(raw.manifest)) };
}
export async function related(
  host: string,
  locale: Locale,
  key: string,
  shelf: string,
  page: number,
  context: Row = {},
) {
  const value = await (shelf === "curated"
    ? getDetail(host, locale, key)
    : getExperience(host, locale, key));
  if (!value) throw Error("NOT_FOUND");
  const m = value.manifest,
    d = obj(m.definition),
    p = Math.max(1, Math.min(10000, Math.floor(page) || 1));
  let catalogue: any;
  if (shelf === "family")
    catalogue = (
      await getStorefront(
        host,
        locale,
        m.family,
        { page: p, ...(m.audience ? { audience: m.audience } : {}) },
        false,
      )
    ).catalogue;
  else if (shelf === "topic") {
    if (!str(d.subject)) return { rows: [], total: 0, page: p, pageSize: 24 };
    catalogue = await getCatalogue(host, locale, {
      subject: d.subject,
      ...(m.audience ? { audience: m.audience } : {}),
      notFamily: m.family,
      page: p,
    });
  } else if (shelf === "skill") {
    const skill = str(d.skillTags).split(/\r?\n/).filter(Boolean)[0];
    if (!skill)
      return { rows: [], total: 0, page: p, pageSize: 24, hasMore: false };
    catalogue = await getCatalogue(host, locale, {
      skill,
      notFamily: m.family,
      ...(m.audience ? { audience: m.audience } : {}),
      page: p,
    });
  } else if (shelf === "loved" || shelf === "popular") {
    catalogue = await getCatalogue(host, locale, {
      family: m.family,
      ...(m.audience ? { audience: m.audience } : {}),
      sort: shelf,
      page: p,
    });
    if (
      catalogue.rows.some((r: Row) =>
        shelf === "loved"
          ? r.loveCount === undefined
          : r.recentStarts === undefined,
      )
    )
      return { rows: [], total: 0, page: p, pageSize: 24, hasMore: false };
    catalogue.rows = catalogue.rows.filter((r: Row) =>
      shelf === "loved" ? r.loveCount > 0 : r.recentStarts >= 5,
    );
  } else if (shelf === "curated") {
    const keys = [
      ...new Set(
        contextualRecommendations(
          d,
          typeof context.score === "number" &&
            Number.isFinite(context.score) &&
            context.score >= 0 &&
            context.score <= 100
            ? context.score
            : undefined,
          context.complete === true,
        )
          .map((r) => str(m.bindings.records[str(r.experienceId)]?.key))
          .filter(Boolean),
      ),
    ];
    if (!keys.length) return { rows: [], total: 0, page: p, pageSize: 24 };
    catalogue = await getCatalogue(host, locale, {
      keys: keys.slice(0, 100).join(","),
      page: p,
    });
  } else throw Error("INVALID_SHELF");
  return {
    ...catalogue,
    rows: catalogue.rows.filter((r: Row) => r.key !== key),
    page: p,
    hasMore: p * 24 < catalogue.total,
  };
}
export const gradeActivity = gradeTaskActivity;
export async function publicAction(
  host: string,
  key: string,
  input: Row,
  visitorToken: string,
) {
  const locale = input.locale;
  if (!isLocale(locale) || !uuid(input.releaseId))
    throw Error("INVALID_REQUEST");
  const visible = await getExperience(host, locale, key);
  if (!visible) throw Error("NOT_FOUND");
  if (visible.releaseId !== input.releaseId) throw Error("EDITION_CHANGED");
  const db = await createServiceClient(),
    release = await checked(
      db
        .from("ac_dce_releases")
        .select("*")
        .eq("id", visible.releaseId)
        .eq("state", "published")
        .maybeSingle(),
    );
  if (!release) throw Error("NOT_FOUND");
  const record = editionProjection(release.snapshot, locale),
    d = obj(record.data);
  if (
    input.operation === "grade" &&
    ["assessments", "learning"].includes(record.family || "") &&
    rows(d.questions).length
  ) {
    const questions = rows(d.questions),
      answers = obj(input.answers);
    if (
      questions.length > 500 ||
      Object.keys(answers).some((id) => !questions.some((q) => q.id === id)) ||
      Object.values(answers).some(
        (v) => typeof v !== "string" || v.length > 4000,
      )
    )
      throw Error("INVALID_CHOICES");
    const grade = scoreQuestions(questions, answers);
    return {
      ...grade,
      results: d.feedbackPolicy === "score_only" ? [] : grade.results,
      recorded: false,
    };
  }
  if (input.operation === "activity" && record.family === "activities")
    return d.engine === "bridge"
      ? gradeBridge(d, obj(input.input))
      : gradeActivity(d, obj(input.input));
  if (input.operation === "sort_cards" && record.family === "visual-cards")
    return gradeClassification(d, obj(input.input));
  if (input.operation === "match_audio" && record.family === "audio")
    return gradeSoundPair(d, obj(input.input));
  if (
    input.operation === "check_question" &&
    ["learning", "assessments"].includes(record.family || "") &&
    d.feedbackPolicy === "immediate"
  ) {
    const q = rows(d.questions).find((q) => q.id === input.questionId);
    if (!q || typeof input.answer !== "string" || input.answer.length > 4000)
      throw Error("INVALID_CHOICES");
    return scoreQuestions([q], { [q.id]: input.answer });
  }
  if (
    input.operation === "certificate_attempt" &&
    record.family === "learning"
  ) {
    const { prepareCertificateEvidence } = await import(
      "../../digital-customer-experience/certificate-runtime"
    );
    return prepareCertificateEvidence({
      requestId: input.requestId,
      releaseId: visible.releaseId,
      locale,
      visitorToken,
      completedUnits: input.completedUnits,
      answers: input.answers,
    });
  }
  if (
    input.operation === "certificate_request" &&
    record.family === "learning"
  ) {
    if (!uuid(input.attemptId)) throw Error("INVALID_REQUEST");
    const attempt = await checked(
      db
        .from("ac_dce_assessment_attempts")
        .select("course_release_id")
        .eq("id", input.attemptId)
        .maybeSingle(),
    );
    if (attempt?.course_release_id !== visible.releaseId)
      throw Error("INVALID_REQUEST");
    const { requestCourseCertificate } = await import(
      "../../digital-customer-experience/certificate-runtime"
    );
    return requestCourseCertificate({
      requestId: input.requestId,
      attemptId: input.attemptId,
      visitorToken,
      details: obj(input.details),
    });
  }
  throw Error("ACTION_NOT_AVAILABLE");
}
