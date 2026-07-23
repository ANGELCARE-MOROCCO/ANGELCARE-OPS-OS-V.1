import { createHash } from "crypto"

import * as SessionModule from "@/lib/auth/session"
import * as SupabaseServerModule from "@/lib/supabase/server"

export type LifecycleEntityType =
  | "ambassador"
  | "candidate"
  | "lead"

export type LifecycleAction =
  | "preview"
  | "archive"
  | "restore"
  | "anonymize"
  | "request"
  | "approve"
  | "reject"
  | "execute"
  | "delete"

type GenericRow = Record<string, any>

export class AmbassadorLifecycleError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(
    message: string,
    status = 400,
    code = "AMBASSADOR_LIFECYCLE_ERROR",
    details?: unknown,
  ) {
    super(message)

    this.name = "AmbassadorLifecycleError"
    this.status = status
    this.code = code
    this.details = details
  }
}

const PERMISSIONS: Record<
  LifecycleAction | "read",
  string
> = {
  read: "ambassadors.lifecycle.read",
  preview: "ambassadors.lifecycle.read",
  archive: "ambassadors.archive",
  restore: "ambassadors.restore",
  anonymize: "ambassadors.anonymize",
  request: "ambassadors.delete.request",
  approve: "ambassadors.delete.approve",
  reject: "ambassadors.delete.approve",
  execute: "ambassadors.delete.execute",
  delete: "ambassadors.delete.execute",
}

function normalizedText(value: unknown) {
  return String(value ?? "").trim()
}

function requireEntityType(
  value: unknown,
): LifecycleEntityType {
  const normalized =
    normalizedText(value).toLowerCase()

  if (
    normalized === "ambassador" ||
    normalized === "candidate" ||
    normalized === "lead"
  ) {
    return normalized
  }

  throw new AmbassadorLifecycleError(
    "Unsupported lifecycle entity type.",
    422,
    "INVALID_ENTITY_TYPE",
  )
}

function requireIdentifier(
  value: unknown,
  code: string,
  label: string,
) {
  const normalized = normalizedText(value)

  if (!normalized) {
    throw new AmbassadorLifecycleError(
      `${label} is required.`,
      422,
      code,
    )
  }

  return normalized
}

function requireReason(value: unknown) {
  const normalized = normalizedText(value)

  if (normalized.length < 5) {
    throw new AmbassadorLifecycleError(
      "A clear operational reason is required.",
      422,
      "REASON_REQUIRED",
    )
  }

  return normalized.slice(0, 2_000)
}

async function getCurrentOpsUser() {
  const resolver =
    (SessionModule as GenericRow)
      .getCurrentAppUser

  if (typeof resolver !== "function") {
    throw new AmbassadorLifecycleError(
      "OpsOS session resolver is unavailable.",
      503,
      "SESSION_RESOLVER_UNAVAILABLE",
    )
  }

  return (await resolver()) as GenericRow | null
}

async function getAdminDatabaseClient() {
  const module =
    SupabaseServerModule as GenericRow

  const factory =
    module.createServiceClient ??
    module.createAdminClient ??
    module.createServiceRoleClient ??
    module.createServerAdminClient

  if (typeof factory !== "function") {
    throw new AmbassadorLifecycleError(
      "A Supabase service-role server client is required.",
      503,
      "SERVICE_CLIENT_UNAVAILABLE",
    )
  }

  return await factory()
}

async function resolveLifecycleActor(
  requiredPermission: string,
) {
  const user = await getCurrentOpsUser()

  if (!user?.id) {
    throw new AmbassadorLifecycleError(
      "Authentication is required.",
      401,
      "AUTH_REQUIRED",
    )
  }

  const db = await getAdminDatabaseClient()

  const actorResult = await db
    .from("market_os_ambassador_actor_roles")
    .select(
      [
        "id",
        "app_user_id",
        "auth_user_id",
        "tenant_id",
        "organization_id",
        "role_key",
        "display_name",
        "status",
      ].join(","),
    )
    .eq("app_user_id", String(user.id))
    .eq("status", "active")

  if (actorResult.error) {
    throw new AmbassadorLifecycleError(
      actorResult.error.message,
      503,
      "ACTOR_LOOKUP_FAILED",
      actorResult.error,
    )
  }

  const actors = Array.isArray(actorResult.data)
    ? actorResult.data
    : []

  if (actors.length !== 1) {
    throw new AmbassadorLifecycleError(
      actors.length
        ? "The current OpsOS user has an ambiguous Ambassador scope."
        : "The current OpsOS user has no active Ambassador actor mapping.",
      403,
      actors.length
        ? "AMBIGUOUS_AMBASSADOR_SCOPE"
        : "AMBASSADOR_SCOPE_REQUIRED",
    )
  }

  const actor = actors[0] as GenericRow

  if (
    !actor.tenant_id ||
    !actor.organization_id ||
    !actor.role_key
  ) {
    throw new AmbassadorLifecycleError(
      "The Ambassador actor mapping has no complete tenant and organization scope.",
      403,
      "INCOMPLETE_AMBASSADOR_SCOPE",
    )
  }

  const permissionsResult = await db
    .from("market_os_ambassador_role_permissions")
    .select("permission_key,enabled")
    .eq("role_key", actor.role_key)
    .eq("enabled", true)

  if (permissionsResult.error) {
    throw new AmbassadorLifecycleError(
      permissionsResult.error.message,
      503,
      "PERMISSION_LOOKUP_FAILED",
      permissionsResult.error,
    )
  }

  const permissions = new Set<string>(
    (permissionsResult.data || []).map(
      (item: GenericRow) =>
        normalizedText(item.permission_key),
    ),
  )

  if (
    !permissions.has("*") &&
    !permissions.has(requiredPermission)
  ) {
    throw new AmbassadorLifecycleError(
      `Permission denied: ${requiredPermission}`,
      403,
      "PERMISSION_DENIED",
    )
  }

  return {
    db,
    actor: {
      id: normalizedText(actor.id),
      appUserId: normalizedText(
        actor.app_user_id || user.id,
      ),
      displayName: normalizedText(
        actor.display_name ||
          user.full_name ||
          user.username ||
          user.email ||
          user.id,
      ),
      roleKey: normalizedText(actor.role_key),
      tenantId: normalizedText(actor.tenant_id),
      organizationId: normalizedText(
        actor.organization_id,
      ),
      permissions: Array.from(permissions),
    },
  }
}

async function callRpc(
  db: GenericRow,
  functionName: string,
  parameters: GenericRow,
) {
  const result = await db.rpc(
    functionName,
    parameters,
  )

  if (result.error) {
    throw new AmbassadorLifecycleError(
      result.error.message,
      409,
      "LIFECYCLE_DATABASE_REJECTED",
      {
        databaseCode: result.error.code,
        databaseDetails: result.error.details,
        databaseHint: result.error.hint,
      },
    )
  }

  return result.data
}

export async function loadLifecycleDashboard() {
  const context = await resolveLifecycleActor(
    PERMISSIONS.read,
  )

  const commonScope = {
    p_tenant_id: context.actor.tenantId,
    p_organization_id:
      context.actor.organizationId,
  }

  const [
    ambassadors,
    candidates,
    leads,
    requestsResult,
    eventsResult,
  ] = await Promise.all([
    callRpc(
      context.db,
      "market_os_ambassador_lifecycle_inventory",
      {
        ...commonScope,
        p_entity_type: "ambassador",
      },
    ),
    callRpc(
      context.db,
      "market_os_ambassador_lifecycle_inventory",
      {
        ...commonScope,
        p_entity_type: "candidate",
      },
    ),
    callRpc(
      context.db,
      "market_os_ambassador_lifecycle_inventory",
      {
        ...commonScope,
        p_entity_type: "lead",
      },
    ),
    context.db
      .from(
        "market_os_ambassador_lifecycle_requests",
      )
      .select("*")
      .eq("tenant_id", context.actor.tenantId)
      .eq(
        "organization_id",
        context.actor.organizationId,
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(250),
    context.db
      .from(
        "market_os_ambassador_lifecycle_events",
      )
      .select("*")
      .eq("tenant_id", context.actor.tenantId)
      .eq(
        "organization_id",
        context.actor.organizationId,
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(250),
  ])

  if (requestsResult.error) {
    throw new AmbassadorLifecycleError(
      requestsResult.error.message,
      503,
      "LIFECYCLE_REQUESTS_LOAD_FAILED",
    )
  }

  if (eventsResult.error) {
    throw new AmbassadorLifecycleError(
      eventsResult.error.message,
      503,
      "LIFECYCLE_EVENTS_LOAD_FAILED",
    )
  }

  return {
    actor: context.actor,
    inventory: {
      ambassador: Array.isArray(ambassadors)
        ? ambassadors
        : [],
      candidate: Array.isArray(candidates)
        ? candidates
        : [],
      lead: Array.isArray(leads)
        ? leads
        : [],
    },
    requests: requestsResult.data || [],
    events: eventsResult.data || [],
  }
}

export async function executeLifecycleAction(
  action: LifecycleAction,
  input: GenericRow,
) {
  const context = await resolveLifecycleActor(
    PERMISSIONS[action],
  )

  const commonActor = {
    p_tenant_id: context.actor.tenantId,
    p_organization_id:
      context.actor.organizationId,
    p_actor_app_user_id:
      context.actor.appUserId,
    p_actor_display_name:
      context.actor.displayName,
  }

  if (action === "preview") {
    return callRpc(
      context.db,
      "market_os_ambassador_lifecycle_preview",
      {
        p_entity_type: requireEntityType(
          input.entityType,
        ),
        p_entity_id: requireIdentifier(
          input.entityId,
          "ENTITY_ID_REQUIRED",
          "Entity identifier",
        ),
        p_tenant_id: context.actor.tenantId,
        p_organization_id:
          context.actor.organizationId,
      },
    )
  }

  if (
    action === "archive" ||
    action === "restore" ||
    action === "anonymize"
  ) {
    return callRpc(
      context.db,
      "market_os_ambassador_lifecycle_set_state",
      {
        ...commonActor,
        p_entity_type: requireEntityType(
          input.entityType,
        ),
        p_entity_id: requireIdentifier(
          input.entityId,
          "ENTITY_ID_REQUIRED",
          "Entity identifier",
        ),
        p_action: action,
        p_reason: requireReason(input.reason),
      },
    )
  }

  if (action === "request") {
    const entityType = requireEntityType(
      input.entityType,
    )

    const entityId = requireIdentifier(
      input.entityId,
      "ENTITY_ID_REQUIRED",
      "Entity identifier",
    )

    const idempotencyKey =
      normalizedText(input.idempotencyKey) ||
      createHash("sha256")
        .update(
          [
            context.actor.tenantId,
            context.actor.organizationId,
            entityType,
            entityId,
            Date.now(),
          ].join(":"),
        )
        .digest("hex")

    return callRpc(
      context.db,
      "market_os_ambassador_lifecycle_request_delete",
      {
        ...commonActor,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_reason_code:
          normalizedText(input.reasonCode) ||
          "administrative_request",
        p_reason_detail: requireReason(
          input.reason,
        ),
        p_idempotency_key: idempotencyKey,
      },
    )
  }


  if (action === "delete") {
    return callRpc(
      context.db,
      "market_os_ambassador_lifecycle_delete_now",
      {
        ...commonActor,

        p_entity_type: requireEntityType(
          input.entityType,
        ),

        p_entity_id: requireIdentifier(
          input.entityId,
          "ENTITY_ID_REQUIRED",
          "Entity identifier",
        ),

        p_confirmation: requireIdentifier(
          input.confirmation,
          "CONFIRMATION_REQUIRED",
          "Exact record name confirmation",
        ),

        p_reason: requireReason(
          input.reason,
        ),
      },
    )
  }

  const requestId = requireIdentifier(
    input.requestId,
    "REQUEST_ID_REQUIRED",
    "Deletion request identifier",
  )

  if (
    action === "approve" ||
    action === "reject"
  ) {
    return callRpc(
      context.db,
      "market_os_ambassador_lifecycle_decide_request",
      {
        ...commonActor,
        p_request_id: requestId,
        p_decision:
          action === "approve"
            ? "approved"
            : "rejected",
        p_note: requireReason(input.reason),
      },
    )
  }

  if (action === "execute") {
    const result = await context.db.rpc(
      "market_os_ambassador_lifecycle_execute_delete",
      {
        ...commonActor,
        p_request_id: requestId,
        p_confirmation: requireIdentifier(
          input.confirmation,
          "CONFIRMATION_REQUIRED",
          "Permanent deletion confirmation",
        ),
      },
    )

    if (result.error) {
      await context.db
        .from(
          "market_os_ambassador_lifecycle_requests",
        )
        .update({
          status: "blocked",
          execution_error:
            result.error.message,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq(
          "tenant_id",
          context.actor.tenantId,
        )
        .eq(
          "organization_id",
          context.actor.organizationId,
        )
        .eq("status", "approved")

      throw new AmbassadorLifecycleError(
        result.error.message,
        409,
        "PURGE_EXECUTION_BLOCKED",
        result.error,
      )
    }

    return result.data
  }

  throw new AmbassadorLifecycleError(
    "Unsupported lifecycle action.",
    404,
    "UNKNOWN_LIFECYCLE_ACTION",
  )
}
