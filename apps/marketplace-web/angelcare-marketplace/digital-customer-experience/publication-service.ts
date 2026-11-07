import { MarketplaceError } from "../server/errors";
import { createHash } from "node:crypto";
import type { MarketplaceRequestContext as Context } from "../domain/types";
import { authorize, record, command, native, list } from "./repository";
import { inspectEdition } from "./master-service";
import {
  gateDiagnostics,
  gateControl,
  setGateValue,
  validateGateValue,
  type GateControl,
} from "./publication-gate";
import {
  array,
  object,
  text,
  type Command,
  type DceRecord,
  type Json,
  type Locale,
} from "./types";
import { safeMediaUrl } from "../kidflix/media-url";
import { attachInteractivePackage } from "./delivery-contract";
import { familyByKey } from "./registry";
const language = (v: unknown): Locale => {
  if (v !== "fr" && v !== "en" && v !== "ar")
    throw new MarketplaceError("VALIDATION_ERROR", "EDITION_LANGUAGE_REQUIRED");
  return v;
};
const fingerprint = (r: DceRecord, l: Locale) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        r.id,
        r.revision,
        r.family,
        r.topic,
        r.audience,
        r.data,
        l,
      ]),
    )
    .digest("hex");
function eligibleMedia(row: any, control: GateControl) {
  return (
    row.status === "active" &&
    row.processingState !== "failed" &&
    safeMediaUrl(row.url) &&
    (!row.expiresAt || Date.parse(row.expiresAt) > Date.now()) &&
    control.mime?.some((m) =>
      m.endsWith("/") ? text(row.mime).startsWith(m) : row.mime === m,
    )
  );
}
export async function publicationGate(
  c: Context,
  input: Record<string, unknown>,
) {
  authorize(c, "view");
  const r = await record(c, text(input.id)),
    locale = language(input.locale);
  if (!["experience", "content", "template", "bundle"].includes(r.kind))
    throw new MarketplaceError("VALIDATION_ERROR", "AUTHORED_DOSSIER_REQUIRED");
  const ready = await inspectEdition(c, r, locale),
    diagnostics = gateDiagnostics(
      r,
      [...ready.validation.errors, ...ready.validation.warnings],
      locale,
    );
  return {
    revision: r.revision,
    fingerprint: fingerprint(r, locale),
    locale,
    checkedAt: ready.validation.checkedAt,
    valid: ready.validation.valid,
    diagnostics,
    coverage: ready.coverage,
    publicMedia: ready.publicMedia,
    history: array(r.data.publicationRepairHistory)
      .filter((h) => h.locale === locale)
      .slice(-12),
    status: ready.validation.valid ? "ready" : "decision-required",
  };
}
export async function publicationOptions(
  c: Context,
  input: Record<string, unknown>,
) {
  authorize(c, "manage");
  const r = await record(c, text(input.id)),
    locale = language(input.locale),
    control = gateControl(r, text(input.path));
  // Re-resolve declarations on every request. A client cannot request arbitrary registry types.
  if (control.kind === "media") {
    const result = await native(c, "media", {
      q: input.q,
      page: input.page,
      pageSize: 24,
      mime: control.mime?.join(","),
      ...(input.value ? { id: input.value } : {}),
    });
    return {
      ...result,
      rows: result.rows.filter((row) => eligibleMedia(row, control)),
    };
  }
  if (control.kind === "offers")
    return native(c, "offers", {
      q: input.q,
      page: input.page,
      pageSize: 24,
      ...(input.value ? { id: input.value } : {}),
    });
  if (control.kind === "topic" || control.kind === "record") {
    const result = await list(c, {
      kind: control.recordKind || "topic",
      q: input.q,
      page: input.page,
      pageSize: 24,
    });
    return {
      ...result,
      rows: result.rows
        .filter((row) => row.lifecycle !== "archived" && row.id !== r.id)
        .map((row) => ({ id: row.id, title: row.title, key: row.key })),
    };
  }
  if (control.kind === "package") {
    const { studioPackagePage } = await import(
      "../kidflix/interactive/service"
    );
    return studioPackagePage(c, r.family || "", locale, {
      recordId: r.id,
      q: input.q,
      page: input.page,
    });
  }
  return {
    rows: control.options || [],
    total: control.options?.length || 0,
    page: 1,
  };
}
export async function publicationRepair(c: Context, cmd: Command) {
  authorize(c, "manage");
  const r = await record(c, text(cmd.id)),
    locale = language(cmd.locale);
  if (!/^[0-9a-f-]{36}$/i.test(cmd.requestId || ""))
    throw new MarketplaceError("VALIDATION_ERROR", "REPAIR_RECEIPT_REQUIRED");
  const previous = array(r.data.publicationRepairHistory).find(
    (h) => h.requestId === cmd.requestId && h.actorId === c.actor.id,
  );
  if (previous) {
    if (
      previous.commandHash !==
      createHash("sha256")
        .update(JSON.stringify([cmd.path, cmd.value, locale, cmd.fingerprint]))
        .digest("hex")
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "REPAIR_RECEIPT_PAYLOAD_CHANGED",
      );
    return {
      record: r,
      receipt: previous,
      alreadyApplied: true,
      gate: await publicationGate(c, { id: r.id, locale }),
    };
  }
  if (
    r.revision !== Number(cmd.revision) ||
    fingerprint(r, locale) !== cmd.fingerprint
  )
    throw new MarketplaceError(
      "CONFLICT",
      "The dossier changed after these checks. Reload the latest revision and compare your changes before applying this correction.",
    );
  if (r.lifecycle === "archived")
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "RESTORE_DOSSIER_BEFORE_REPAIR",
    );
  const current = await publicationGate(c, { id: r.id, locale }),
    issue = current.diagnostics.find((i) => i.path === cmd.path);
  if (!issue)
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "ISSUE_CHANGED_RECHECK_REQUIRED",
    );
  const control = issue.control;
  let next: DceRecord;
  if (control.kind === "package") {
    const { adminPackageInfo, assertPackageForPublication } = await import(
      "../kidflix/interactive/service"
    );
    const pkg = await adminPackageInfo(c, text(cmd.value));
    if (
      pkg.family !== r.family ||
      pkg.locale !== locale ||
      (pkg.recordId && pkg.recordId !== r.id)
    )
      throw new MarketplaceError("VALIDATION_ERROR", "PACKAGE_TARGET_MISMATCH");
    next = attachInteractivePackage(
      r,
      {
        ...pkg,
        locale,
        title: text(pkg.title),
        audience: object(pkg.audience) as {
          age_min?: number;
          age_max?: number;
        },
      },
      familyByKey(r.family || "")!,
    ) as DceRecord;
    await assertPackageForPublication(c, next, locale);
  } else {
    try {
      validateGateValue(control, cmd.value);
    } catch (e) {
      throw new MarketplaceError("VALIDATION_ERROR", (e as Error).message);
    }
    if (control.kind === "media") {
      const options = await publicationOptions(c, {
        id: r.id,
        locale,
        path: cmd.path,
        value: cmd.value,
      });
      if (!options.rows.some((v: any) => v.id === cmd.value))
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "MEDIA_NO_LONGER_ELIGIBLE",
        );
    }
    if (control.kind === "offers") {
      const options = await publicationOptions(c, {
        id: r.id,
        locale,
        path: cmd.path,
        value: cmd.value,
      });
      if (!options.rows.some((v: any) => v.id === cmd.value))
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "OFFER_NO_LONGER_ELIGIBLE",
        );
    }
    if (control.kind === "topic" || control.kind === "record") {
      const target = await record(c, text(cmd.value));
      if (
        target.kind !== (control.recordKind || "topic") ||
        target.lifecycle === "archived" ||
        target.id === r.id
      )
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "TOPIC_NO_LONGER_ELIGIBLE",
        );
    }
    next = setGateValue(r, control, locale, cmd.value as Json);
  }
  const receipt = {
    requestId: cmd.requestId,
    actorId: c.actor.id,
    at: new Date().toISOString(),
    locale,
    path: issue.path,
    before: issue.current,
    after: cmd.value as Json,
    revisionBefore: r.revision,
    commandHash: createHash("sha256")
      .update(JSON.stringify([cmd.path, cmd.value, locale, cmd.fingerprint]))
      .digest("hex"),
  };
  next.data.publicationRepairHistory = [
    ...array(r.data.publicationRepairHistory).slice(-49),
    receipt,
  ];
  const saved = await command(c, {
    action: "save",
    id: r.id,
    revision: r.revision,
    record: next,
    requestId: cmd.requestId,
  });
  // Never infer success from the patch: inspect the authoritative saved revision again.
  return {
    ...saved,
    receipt,
    gate: await publicationGate(c, { id: r.id, locale }),
  };
}
