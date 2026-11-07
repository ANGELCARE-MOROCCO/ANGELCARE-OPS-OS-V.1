import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketplaceError } from "../server/errors";
import type { MarketplaceRequestContext } from "../domain/types";
import { notificationPolicy } from "./policy";
import {
  destination,
  isUuid,
  normalizeFilter,
  type Feed,
  type Focus,
} from "./model";
import { SOURCE_BY_ID } from "./registry";
import { decodeCursor, encodeCursor } from "./cursor";
async function rpc(name: string, args: Record<string, unknown>) {
  const db = await createServiceClient();
  const { data, error } = await db.rpc(name, args);
  if (error) {
    const code = String(error.message || "");
    if (/NOTIFICATION_NOT_ACCESSIBLE/.test(code))
      throw new MarketplaceError(
        "NOT_FOUND",
        "Notification indisponible dans votre périmètre.",
      );
    if (
      /INVALID_|UNKNOWN_|EXPIRED|CRITICAL_CANNOT|REFINE_FILTER|IDEMPOTENCY/.test(
        code,
      )
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        code.replace(/[^A-Z0-9_]/g, "").slice(0, 100),
      );
    throw new MarketplaceError(
      "CONFIGURATION_ERROR",
      "Centre de notifications indisponible. Vérifiez les migrations et le worker.",
    );
  }
  return data;
}
const args = (c: MarketplaceRequestContext) => ({
  p_actor: c.actor.id,
  p_policy: notificationPolicy(c),
});
export async function readNotifications(
  c: MarketplaceRequestContext,
  p: URLSearchParams,
): Promise<Feed> {
  const filter = normalizeFilter(Object.fromEntries(p)),
    raw = p.get("cursor"),
    context = { ...args(c), filter };
  const cursor = raw ? decodeCursor(raw, context) : null;
  const data = (await rpc("ac_nc_read", {
    ...args(c),
    p_filter: filter,
    p_cursor: cursor,
    p_limit: 30,
  })) as Feed;
  return {
    ...data,
    cursor: encodeCursor(data.cursor, context),
    locale: c.locale,
    canManage: notificationPolicy(c).manage,
  };
}
export async function notificationCommand(
  c: MarketplaceRequestContext,
  body: Record<string, unknown>,
) {
  if (!isUuid(body.requestId))
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Identité de commande requise.",
    );
  const allowed = [
    "read",
    "unread",
    "archive",
    "unarchive",
    "snooze",
    "unsnooze",
    "pin",
    "prepare_read_all",
    "apply_read_all",
    "preferences",
    "source_rule",
    "retry_source",
    "backfill_preview",
    "backfill_apply",
  ];
  if (typeof body.action !== "string" || !allowed.includes(body.action))
    throw new MarketplaceError("VALIDATION_ERROR", "Commande inconnue.");
  const command: Record<string, unknown> = { action: body.action };
  if (
    [
      "source_rule",
      "retry_source",
      "backfill_preview",
      "backfill_apply",
    ].includes(body.action)
  ) {
    if (!notificationPolicy(c).manage || c.tenantId || c.territoryId)
      throw new MarketplaceError("FORBIDDEN", "Global admin scope required.");
    if (
      typeof body.source !== "string" ||
      !SOURCE_BY_ID.has(body.source) ||
      typeof body.reason !== "string" ||
      body.reason.trim().length < 8 ||
      body.reason.length > 160
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Source et justification requises.",
      );
    Object.assign(command, { source: body.source, reason: body.reason.trim() });
    if (body.action === "source_rule") {
      if (
        !["info", "attention", "critical"].includes(
          String(body.minimumSeverity),
        ) ||
        !Number.isInteger(body.expiryWarningDays) ||
        Number(body.expiryWarningDays) < 0 ||
        Number(body.expiryWarningDays) > 90
      )
        throw new MarketplaceError("VALIDATION_ERROR", "Règle invalide.");
      Object.assign(command, {
        minimumSeverity: body.minimumSeverity,
        expiryWarningDays: body.expiryWarningDays,
      });
    }
    if (body.action.startsWith("backfill")) {
      if (
        body.after !== null &&
        body.after !== undefined &&
        (typeof body.after !== "string" || body.after.length > 2048)
      )
        throw new MarketplaceError("VALIDATION_ERROR", "Curseur invalide.");
      command.after = body.after || null;
    }
  }

  if (
    [
      "read",
      "unread",
      "archive",
      "unarchive",
      "snooze",
      "unsnooze",
      "pin",
    ].includes(body.action)
  ) {
    if (
      !isUuid(body.id) ||
      !Number.isSafeInteger(body.version) ||
      Number(body.version) < 1
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Notification et version requises.",
      );
    Object.assign(command, { id: body.id, version: body.version });
  }
  if (body.action === "snooze") {
    if (
      typeof body.until !== "string" ||
      !Number.isFinite(Date.parse(body.until))
    )
      throw new MarketplaceError("VALIDATION_ERROR", "Échéance invalide.");
    command.until = body.until;
  }
  if (body.action === "prepare_read_all")
    command.filter = normalizeFilter(
      (body.filter || {}) as Record<string, unknown>,
    );
  if (body.action === "apply_read_all") {
    if (!isUuid(body.token))
      throw new MarketplaceError("VALIDATION_ERROR", "Instantané requis.");
    command.token = body.token;
  }
  if (body.action === "preferences") {
    if (
      !Array.isArray(body.mutedSources) ||
      body.mutedSources.some(
        (x) => typeof x !== "string" || !SOURCE_BY_ID.has(x),
      )
    )
      throw new MarketplaceError("VALIDATION_ERROR", "Sources invalides.");
    Object.assign(command, {
      mutedSources: body.mutedSources,
      locale: ["fr", "en", "ar"].includes(String(body.locale))
        ? body.locale
        : c.locale,
      quietStart: body.quietStart ?? null,
      quietEnd: body.quietEnd ?? null,
    });
  }
  return rpc("ac_nc_command", {
    ...args(c),
    p_request: body.requestId,
    p_command: command,
  });
}
export async function notificationFocus(
  c: MarketplaceRequestContext,
  id: string,
): Promise<Focus> {
  if (!isUuid(id))
    throw new MarketplaceError("NOT_FOUND", "Notification introuvable.");
  return rpc("ac_nc_focus", { ...args(c), p_id: id }) as Promise<Focus>;
}
export async function notificationDestination(
  c: MarketplaceRequestContext,
  id: string,
) {
  const f = await notificationFocus(c, id);
  return destination(f.source, f.current, f.id);
}
