import { changedDefinitionPaths } from "./production-model";
import {
  gradeBridge,
  gradeClassification,
  gradeSoundPair,
} from "./detail-interactions";
import { FAMILIES } from "./registry";
import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketplaceError } from "../server/errors";
import type { MarketplaceRequestContext as Context } from "../domain/types";
import { authorize, record, validateScoped, native } from "./repository";
import { publicManifest, isId, scoreQuestions } from "./model";
import {
  stable,
  editionDefinition,
  editionProjection,
  editionReadiness,
  outputReadiness,
  outcomePlan,
  certificatePolicy,
  EDITION_KINDS,
  AUTONOMOUS_CONTRACT,
} from "./experience-contract";
import {
  array,
  object,
  text,
  LOCALES,
  type DceRecord,
  type Data,
  type Locale,
  type Command,
} from "./types";
export const hash = (v: unknown) =>
  createHash("sha256").update(stable(v)).digest("hex");
export const editionHash = (r: DceRecord, l: Locale) =>
  hash(editionDefinition(r, l));
function language(v: unknown): Locale {
  if (!LOCALES.includes(v as Locale))
    throw new MarketplaceError("VALIDATION_ERROR", "Choose AR, FR or EN.");
  return v as Locale;
}
export function masterError(error: any): never {
  const message = String(error?.message || "Operation failed.");
  if (/does not exist|schema cache|PGRST20[25]/i.test(message))
    throw new MarketplaceError(
      "CONFIGURATION_ERROR",
      "Apply the separate DCE R5 SQL activation. Your entries remain preserved.",
    );
  if (/CONFLICT|EDITION_CHANGED/.test(message))
    throw new MarketplaceError(
      "CONFLICT",
      "The source changed. Reload and reconcile the retained entries.",
    );
  if (/NOT_FOUND/.test(message))
    throw new MarketplaceError(
      "NOT_FOUND",
      "The item is unavailable in this scope.",
    );
  const guidance: Record<string, string> = {
    ANONYMISED_READ_ONLY:
      "This certificate record has been anonymised and is read-only.",
    EDITORIAL_TASKS_BLOCKED:
      "Complete or renew the blocking tasks for this language in Team & shared text.",
    INDEPENDENT_REVIEW_REQUIRED:
      "An independent reviewer must approve this language edition.",
    EDITION_APPROVAL_REQUIRED:
      "Review and approve the current language content before release.",
    EDITION_REVIEW_REQUIRED:
      "Submit this exact language content for review before approval.",
  };
  if (guidance[message])
    throw new MarketplaceError("DEPENDENCY_BLOCKED", guidance[message]);
  if (
    /REQUIRED|BLOCKED|INVALID|DISABLED|NOT_CURRENT|NOT_ACTIVE|NOT_SCHEDULED|NOT_DUE|EXPIRED|ANONYMISED_READ_ONLY/.test(
      message,
    )
  )
    throw new MarketplaceError("DEPENDENCY_BLOCKED", message.slice(0, 240));
  throw new MarketplaceError(
    "INTERNAL_ERROR",
    "The operation did not complete. Retain entries and retry with the same receipt.",
  );
}
async function checked(q: PromiseLike<any>) {
  const r = await q;
  if (r.error) masterError(r.error);
  return r.data;
}
const scoped = (q: any, c: Pick<Context, "tenantId" | "territoryId">) =>
  (c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null))[
    c.territoryId ? "eq" : "is"
  ]("territory_id", c.territoryId || null);
const receipt = (c: Context, cmd: Command) => {
  if (!isId(cmd.requestId))
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "A valid command receipt is required.",
    );
  return {
    p_actor: c.actor.id,
    p_tenant: c.tenantId,
    p_territory: c.territoryId,
    p_request: cmd.requestId,
    p_hash: hash(cmd),
  };
};
export async function inspectEdition(
  c: Pick<Context, "tenantId" | "territoryId" | "locale">,
  r: DceRecord,
  l: Locale,
) {
  const projected = editionProjection(r, l),
    ready = editionReadiness(r, l),
    validationSource = { ...projected, data: { ...projected.data } },
    ignoredAdPolicy = validationSource.data.adPolicyId;
  delete validationSource.data.adPolicyId;
  const v = await validateScoped({ ...c, locale: l }, validationSource),
    add = (path: string, code: string, message: string) =>
      v.validation.errors.push({
        path,
        code,
        severity: "error",
        message: [message, message, message],
      });
  if (ignoredAdPolicy)
    v.validation.warnings.push({
      path: "adPolicyId",
      code: "AD_READINESS_SEPARATE",
      severity: "warning",
      message: [
        "Advertising readiness is inspected separately; unavailable advertising must not block this resource.",
        "La publicité est contrôlée séparément ; son indisponibilité ne bloque pas cette ressource.",
        "تُفحص جاهزية الإعلانات بشكل مستقل؛ لا يمنع غيابها استخدام المورد.",
      ],
    });
  if (
    EDITION_KINDS.includes(r.kind) &&
    projected.data.visibility &&
    projected.data.visibility !== "free"
  )
    add(
      "visibility",
      "AUTONOMOUS_FREE_ACCESS",
      "Ordinary DCE access must remain free and autonomous. Native commercial journeys stay separate.",
    );
  const access = object(
    object(v.bindings.records)[text(projected.data.accessPolicyId)],
  );
  if (
    access.definition &&
    object(access.definition).use &&
    object(access.definition).use !== "free"
  )
    add(
      "accessPolicyId",
      "AUTONOMOUS_FREE_ACCESS",
      "Select a free-use policy for this DCE resource.",
    );
  const retired = [
    "destination",
    "responsibleTeam",
    "responsibleStaffId",
    "privateReceiverId",
    "consentLabel",
    "attachmentTypes",
    "attachmentMaxMb",
    "statusWorkflow",
  ];
  if (r.family === "forms") {
    v.validation.errors = v.validation.errors.filter(
      (e) =>
        !retired.some((k) => e.path.split(".").includes(k)) &&
        !["PRIVATE_RECEIVER", "UPLOAD", "BOOKING_RECEIVER"].includes(e.code),
    );
    if (
      array(projected.data.fields).some((f) =>
        ["file", "email", "tel"].includes(text(f.type)),
      )
    )
      add(
        "fields",
        "SELF_SERVICE_ONLY",
        "Ordinary questionnaires must not request attachments or contact details. Certificate requests have their own explicit form.",
      );
  }
  for (const p of ready.coverage.missing)
    if (!(r.family === "forms" && retired.includes(p)))
      add(
        "locales." + l + "." + p,
        "EDITION_TRANSLATION",
        "Complete the selected edition: " + p,
      );
  for (const o of outputReadiness(projected.data, v.bindings))
    if (o.enabled !== false)
      for (const issue of o.issues)
        add("outputs." + text(o.id), "OUTPUT_NOT_READY", issue);
  const policy = certificatePolicy(projected.data);
  if (policy.enabled) {
    if (r.family !== "learning")
      add(
        "certificatePolicy",
        "COURSE_ONLY",
        "Certificates belong to courses.",
      );
    if (policy.evidence === "manual_review" && Number(policy.minimumScore) > 0)
      add(
        "certificatePolicy.minimumScore",
        "VERIFIED_SCORE_REQUIRED",
        "A score threshold requires server assessment.",
      );
    if (
      policy.evidence === "server_assessment" &&
      (!isId(policy.assessmentId) ||
        object(object(v.bindings.records)[text(policy.assessmentId)]).family !==
          "assessments")
    )
      add(
        "certificatePolicy.assessmentId",
        "ASSESSMENT_REQUIRED",
        "Choose a published assessment in this language and scope.",
      );
  }
  const unique = new Map<string, (typeof v.validation.errors)[number]>();
  for (const issue of v.validation.errors) {
    let path = issue.path
      .replace(/^locales\.(ar|fr|en)\./, "")
      .replace(/\.locales\.(ar|fr|en)\./g, ".");
    const parts = path.split("."),
      collection = FAMILIES.find((f) => f.key === r.family)?.collections.find(
        (c) => c.key === parts[0],
      );
    if (collection && /^\d+$/.test(parts[1] || ""))
      parts[1] =
        text(array(projected.data[collection.key])[Number(parts[1])]?.id) ||
        parts[1];
    path = parts.join(".");
    let missing = /REQUIRED|TRANSLATION/.test(issue.code);
    if (issue.code === "OUTPUT_NOT_READY") {
      const message = issue.message[0].toLowerCase();
      if (message.includes("label")) {
        path += "." + "label";
        missing = true;
      } else if (message.includes("file") && !/mime|type/.test(message)) {
        path += "." + "assetId";
      }
    }
    const key = path + ":" + (missing ? "MISSING" : issue.code);
    if (!unique.has(key)) unique.set(key, { ...issue, path });
  }
  v.validation.errors = [...unique.values()];
  v.validation.valid = !v.validation.errors.length;
  return {
    ...v,
    locale: l,
    present: ready.present,
    coverage: ready.coverage,
    definitionHash: editionHash(r, l),
    outcomes: outcomePlan(projected, v.bindings),
  };
}
export async function editionCommand(c: Context, cmd: Command) {
  const action = cmd.action.replace("master_edition_", ""),
    l = language(cmd.locale);
  authorize(c, action === "review" ? "manage" : "publish");
  const r = await record(c, text(cmd.id));
  if (!EDITION_KINDS.includes(r.kind))
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Choose an authored dossier.",
    );
  const db = await createServiceClient();
  let source = r;
  if (action === "restore") {
    const z = await checked(
      scoped(db.from("ac_dce_releases").select("*"), c)
        .eq("id", text(cmd.releaseId))
        .eq("record_id", r.id)
        .maybeSingle(),
    );
    if (!z || z.manifest?.editionLocale !== l)
      throw new MarketplaceError("NOT_FOUND", "Edition release not found.");
    source = z.snapshot;
  }
  const v = await inspectEdition(c, source, l);
  if (
    ["review", "approve", "release", "schedule", "restore"].includes(action) &&
    !v.validation.valid
  )
    throw new MarketplaceError(
      "PUBLICATION_BLOCKED",
      "Resolve the selected edition readiness issues.",
      {
        fieldErrors: Object.fromEntries(
          v.validation.errors.map((e) => [e.path, [e.message[0]]]),
        ),
      },
    );
  const p = editionProjection(source, l),
    manifest = {
      ...publicManifest(p, v.bindings),
      contract: AUTONOMOUS_CONTRACT,
      title: p.title,
      editionLocale: l,
      editionHash: editionHash(source, l),
      outcomes: v.outcomes,
      certificate:
        r.family === "learning"
          ? certificatePolicy(p.data)
          : { enabled: false },
    };
  return checked(
    db.rpc("ac_dce_r5_edition", {
      ...receipt(c, cmd),
      p_id: r.id,
      p_revision: Number(cmd.revision),
      p_locale: l,
      p_action: action,
      p_definition: editionDefinition(source, l),
      p_definition_hash: editionHash(source, l),
      p_manifest: manifest,
      p_validation: v.validation,
      p_schedule: ["schedule", "reschedule"].includes(action)
        ? text(cmd.scheduledAt)
        : null,
      p_release: text(cmd.releaseId) || null,
    }),
  );
}
export async function masterRead(c: Context, input: Record<string, unknown>) {
  authorize(c, "view");
  const db = await createServiceClient(),
    op = text(input.op);
  if (op === "master_edition_inventory") {
    const l = language(input.locale),
      reply = await checked(
        db.rpc("ac_dce_r5_inventory", {
          p_tenant: c.tenantId,
          p_territory: c.territoryId,
          p_locale: l,
          p_state: text(input.state) || "all",
          p_family: text(input.family),
          p_search: text(input.q).slice(0, 120),
          p_page: Math.max(1, Math.floor(Number(input.page) || 1)),
        }),
      );
    return {
      ...reply,
      rows: reply.rows.map((r: any) => ({
        id: r.id,
        title: editionProjection(r, l).title || r.title,
        family: r.family,
        present: r.present,
        activeReleaseId: r.active_release_id,
        draftState:
          r.definition_hash === editionHash(r, l) ? r.edition_state : "draft",
      })),
    };
  }
  if (op === "master_editions") {
    const r = await record(c, text(input.id)),
      editions = await checked(
        scoped(db.from("ac_dce_editions").select("*"), c).eq("record_id", r.id),
      );
    const legacy = r.published_release_id
      ? await checked(
          scoped(db.from("ac_dce_releases").select("id,state,manifest"), c)
            .eq("id", r.published_release_id)
            .maybeSingle(),
        )
      : null;
    return {
      legacyRelease:
        legacy?.state === "published" && !legacy.manifest?.editionLocale
          ? { id: legacy.id }
          : null,
      rows: LOCALES.map((l) => {
        const e = editions.find((e: any) => e.locale === l),
          h = editionHash(r, l);
        return {
          ...editionReadiness(r, l),
          definitionHash: h,
          state: e?.definition_hash === h ? e.state : "draft",
          approvalCurrent: e?.state === "approved" && e.definition_hash === h,
          activeReleaseId: e?.active_release_id || null,
        };
      }),
    };
  }
  if (op === "master_edition_comparison") {
    const r = await record(c, text(input.id)),
      l = language(input.locale);
    const e = await checked(
      scoped(db.from("ac_dce_editions").select("active_release_id"), c)
        .eq("record_id", r.id)
        .eq("locale", l)
        .maybeSingle(),
    );
    if (!e?.active_release_id)
      return { activeRelease: null, changes: [], truncated: false };
    const release = await checked(
      scoped(
        db
          .from("ac_dce_releases")
          .select("id,state,revision,published_at,snapshot,manifest"),
        c,
      )
        .eq("id", e.active_release_id)
        .eq("record_id", r.id)
        .maybeSingle(),
    );
    if (
      !release ||
      release.state !== "published" ||
      release.manifest?.editionLocale !== l
    )
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "The active language release is unavailable.",
      );
    return {
      activeRelease: {
        id: release.id,
        revision: release.revision,
        publishedAt: release.published_at,
      },
      workingRevision: r.revision,
      ...changedDefinitionPaths(
        editionDefinition(release.snapshot, l),
        editionDefinition(r, l),
      ),
    };
  }
  if (op === "master_readiness")
    return inspectEdition(
      c,
      await record(c, text(input.id)),
      language(input.locale),
    );
  if (op === "master_certificates") {
    authorize(c, "moderate");
    const page = Math.max(1, Math.floor(Number(input.page) || 1));
    let q = scoped(
      db
        .from("ac_dce_certificate_requests")
        .select(
          "id,reference,course_id,course_title,locale,status,assigned_to,due_at,revision,created_at,updated_at,evidence",
          { count: "exact" },
        ),
      c,
    );
    if (input.status) q = q.eq("status", text(input.status));
    if (input.locale) q = q.eq("locale", language(input.locale));
    if (input.courseId) q = q.eq("course_id", text(input.courseId));
    if (input.assigned === "mine") q = q.eq("assigned_to", c.actor.id);
    if (input.assigned === "unassigned") q = q.is("assigned_to", null);
    if (input.overdue === "true")
      q = q
        .lte("due_at", new Date().toISOString())
        .not("status", "in", "(closed,cancelled,rejected)");
    const search = text(input.q)
      .replace(/[%_,()]/g, " ")
      .slice(0, 120);
    if (search)
      q = q.or(`reference.ilike.%${search}%,course_title.ilike.%${search}%`);
    const z = await q
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 30, page * 30 - 1);
    if (z.error) masterError(z.error);
    return { rows: z.data || [], total: z.count || 0, page, pageSize: 30 };
  }
  if (op === "master_certificate") {
    authorize(c, "moderate");
    if (!isId(input.id))
      throw new MarketplaceError("VALIDATION_ERROR", "Choose a valid request.");
    const r = await checked(
      scoped(db.from("ac_dce_certificate_requests").select("*"), c)
        .eq("id", input.id)
        .maybeSingle(),
    );
    if (!r) throw new MarketplaceError("NOT_FOUND", "Request not found.");
    const page = Math.max(1, Math.floor(Number(input.historyPage) || 1)),
      history = await db
        .from("ac_dce_certificate_history")
        .select("*", { count: "exact" })
        .eq("request_id", r.id)
        .order("created_at", { ascending: false })
        .order("id")
        .range((page - 1) * 30, page * 30 - 1);
    if (history.error) masterError(history.error);
    return {
      request: r,
      history: history.data || [],
      historyTotal: history.count || 0,
      historyPage: page,
    };
  }
  throw new MarketplaceError("VALIDATION_ERROR", "Unknown DCE operating view.");
}
export async function masterCommand(c: Context, cmd: Command) {
  authorize(c, "view");
  if (cmd.action.startsWith("master_edition_")) return editionCommand(c, cmd);
  if (cmd.action === "master_validate")
    return inspectEdition(
      c,
      await record(c, text(cmd.id)),
      language(cmd.locale),
    );
  const db = await createServiceClient();
  if (cmd.action === "master_preview_detail") {
    if (!isId(cmd.releaseId))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose an authored release.",
      );
    const z = await checked(
      scoped(db.from("ac_dce_releases").select("*"), c)
        .eq("id", cmd.releaseId)
        .maybeSingle(),
    );
    if (!z) throw new MarketplaceError("NOT_FOUND", "Release not found.");
    const d = editionProjection(
        z.snapshot,
        language(
          cmd.locale ||
            z.manifest.editionLocale ||
            z.snapshot.data.defaultLocale,
        ),
      ).data,
      input = object(cmd.input);
    if (
      cmd.operation === "check_question" &&
      ["assessments", "learning"].includes(z.snapshot.family) &&
      d.feedbackPolicy === "immediate"
    ) {
      const q = array(d.questions).find((q) => q.id === input.questionId);
      if (!q || typeof input.answer !== "string" || input.answer.length > 4000)
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Choose a declared question and answer.",
        );
      return {
        ...scoreQuestions([q], { [text(q.id)]: input.answer }),
        preview: true,
        recorded: false,
      };
    }
    const result =
      cmd.operation === "sort_cards" && z.snapshot.family === "visual-cards"
        ? gradeClassification(d, input)
        : cmd.operation === "match_audio" && z.snapshot.family === "audio"
          ? gradeSoundPair(d, input)
          : cmd.operation === "activity" &&
              z.snapshot.family === "activities" &&
              d.engine === "bridge"
            ? gradeBridge(d, input)
            : null;
    if (!result)
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose an operation available for this release.",
      );
    return { ...result, preview: true, recorded: false };
  }
  if (cmd.action === "master_preview_activity") {
    if (!isId(cmd.releaseId))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose an activity release.",
      );
    const z = await checked(
      scoped(db.from("ac_dce_releases").select("*"), c)
        .eq("id", cmd.releaseId)
        .maybeSingle(),
    );
    if (!z || z.snapshot?.family !== "activities")
      throw new MarketplaceError("NOT_FOUND", "Activity release not found.");
    const d = editionProjection(
        z.snapshot,
        language(z.manifest.editionLocale || z.snapshot.data.defaultLocale),
      ).data,
      tasks = array(d.tasks),
      input = object(cmd.input),
      values = object(input.values),
      selected = Array.isArray(input.selected)
        ? input.selected.filter((x): x is string => typeof x === "string")
        : [],
      pair = Array.isArray(input.pair)
        ? input.pair.filter((x): x is string => typeof x === "string")
        : [],
      ids = Array.isArray(input.targetIds)
        ? input.targetIds.filter((x): x is string => typeof x === "string")
        : tasks.map((t) => text(t.id));
    if (d.engine === "bridge")
      return { ...gradeBridge(d, input), preview: true, recorded: false };
    if (
      tasks.length > 500 ||
      [...Object.keys(values), ...selected, ...pair, ...ids].some(
        (id) => !tasks.some((t) => t.id === id),
      ) ||
      Object.values(values).some(
        (v) => typeof v !== "string" || v.length > 4000,
      )
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Use the declared activity tasks.",
      );
    let correct = false;
    if (["matching", "memory"].includes(text(d.engine)))
      correct =
        pair.length === 2 &&
        pair[0] !== pair[1] &&
        text(tasks.find((t) => t.id === pair[0])?.answer) ===
          text(tasks.find((t) => t.id === pair[1])?.answer);
    else if (d.engine === "sequence")
      correct =
        selected.length === tasks.length &&
        new Set(selected).size === tasks.length &&
        selected.every(
          (id, i) =>
            text(tasks.find((t) => t.id === id)?.answer) === String(i + 1),
        );
    else
      correct =
        ids.length > 0 &&
        ids.every(
          (id) => values[id] === tasks.find((t) => t.id === id)?.answer,
        );
    return { correct, preview: true, recorded: false };
  }
  if (cmd.action === "master_preview_grade") {
    if (!isId(cmd.releaseId))
      throw new MarketplaceError("VALIDATION_ERROR", "Choose a release.");
    const z = await checked(
      scoped(db.from("ac_dce_releases").select("*"), c)
        .eq("id", cmd.releaseId)
        .maybeSingle(),
    );
    if (!z || z.snapshot?.family !== "assessments")
      throw new MarketplaceError("NOT_FOUND", "Assessment release not found.");
    const questions = array(
        editionProjection(
          z.snapshot,
          language(z.manifest.editionLocale || z.snapshot.data.defaultLocale),
        ).data.questions,
      ),
      answers = object(cmd.answers);
    if (
      Object.keys(answers).some((id) => !questions.some((q) => q.id === id)) ||
      Object.values(answers).some(
        (v) => typeof v !== "string" || v.length > 4000,
      )
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Use the declared questions.",
      );
    return {
      ...scoreQuestions(questions, answers as Record<string, string>),
      preview: true,
      recorded: false,
    };
  }
  if (cmd.action === "master_certificate_action") {
    authorize(c, "moderate");
    const operation = text(cmd.operation),
      data = object(cmd.data);
    if (["approve", "issue", "replace"].includes(operation))
      authorize(c, "publish");
    if (
      operation === "assign" &&
      data.assignedTo &&
      (await native(c, "staff", { id: data.assignedTo })).rows.length !== 1
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose an eligible native operator.",
      );
    if (["issue", "replace"].includes(operation)) {
      if (!isId(data.documentId))
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Select a private PDF receipt.",
        );
      const d = await checked(
          scoped(db.from("ac_dce_attachment_receipts").select("*"), c)
            .eq("id", data.documentId)
            .eq("state", "linked")
            .maybeSingle(),
        ),
        r = await checked(
          scoped(db.from("ac_dce_certificate_requests").select("*"), c)
            .eq("id", cmd.id)
            .maybeSingle(),
        );
      if (
        !d ||
        d.mime_type !== "application/pdf" ||
        !r ||
        object(r.data).privateCaseId !== d.case_id
      )
        throw new MarketplaceError(
          "DEPENDENCY_BLOCKED",
          "Link a verified private PDF to this certificate request before issuance.",
        );
      data.issuer = text(r.policy?.issuer) || "AngelCare";
    }
    return checked(
      db.rpc("ac_dce_r5_certificate_action", {
        ...receipt(c, cmd),
        p_id: cmd.id,
        p_revision: Number(cmd.revision),
        p_action: operation,
        p_data: data,
      }),
    );
  }
  throw new MarketplaceError(
    "VALIDATION_ERROR",
    "Unknown DCE operating command.",
  );
}
export async function runEditionSchedules(limit = 20, context?: Context) {
  const db = await createServiceClient();
  let q = db
    .from("ac_dce_releases")
    .select("*")
    .eq("state", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .not("manifest->>editionLocale", "is", null);
  if (context) {
    authorize(context, "publish");
    q = scoped(q, context);
  }
  const z = await q
    .order("scheduled_at")
    .limit(Math.max(1, Math.min(limit, 50)));
  if (z.error) return { state: "unavailable", processed: 0 };
  const results = [];
  for (const release of z.data || []) {
    try {
      const r = await checked(
        db
          .from("ac_dce_records")
          .select("*")
          .eq("id", release.record_id)
          .maybeSingle(),
      );
      if (
        !r ||
        r.tenant_id !== release.tenant_id ||
        r.territory_id !== release.territory_id
      )
        throw Error("scope");
      const l = language(release.manifest.editionLocale),
        v = await inspectEdition(
          { tenantId: r.tenant_id, territoryId: r.territory_id, locale: l },
          r,
          l,
        ),
        valid =
          v.validation.valid &&
          editionHash(r, l) === release.manifest.editionHash;
      const cmd = {
          action: valid ? "due" : "fail",
          requestId: randomUUID(),
          id: r.id,
          revision: r.revision,
        },
        c = {
          ...context,
          actor: context?.actor || { id: "worker:dce" },
          tenantId: r.tenant_id,
          territoryId: r.territory_id,
        } as Context;
      const reply = await db.rpc("ac_dce_r5_edition", {
        ...receipt(c, cmd),
        p_id: r.id,
        p_revision: r.revision,
        p_locale: l,
        p_action: cmd.action,
        p_definition: editionDefinition(r, l),
        p_definition_hash: editionHash(r, l),
        p_validation: v.validation,
        p_release: release.id,
      });
      results.push({
        id: release.id,
        state: reply.error ? "retry_pending" : valid ? "published" : "blocked",
      });
    } catch {
      results.push({ id: release.id, state: "retry_pending" });
    }
  }
  return { state: "processed", processed: results.length, results };
}
