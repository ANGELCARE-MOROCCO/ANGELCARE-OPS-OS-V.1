import type { AmbassadorActor, AmbassadorRecord } from "../contracts"
import { AmbassadorServiceError } from "../errors"
import { getSettingsRow } from "../persistence"
import { getAmbassadorSupabaseAdmin } from "../supabase"
import type { AmbassadorSettingsConfiguration, AmbassadorSettingsScopeType } from "./contracts"
import { configurationFromLegacySettings } from "./defaults"
import { normalizeSettingsConfiguration } from "./validation"

const ACTIVE_TABLE = "market_os_ambassador_settings_active_scopes"
const VERSIONS_TABLE = "market_os_ambassador_settings_versions"

export type AmbassadorSettingsRuntimeContext = {
  program?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  territory?: string | null
  serviceLine?: string | null
}

type ActiveScopeRow = {
  current_version_id?: unknown
  scope_type?: unknown
  scope_key?: unknown
}

function persistenceError(area: string, error: { message?: string } | null): never {
  throw new AmbassadorServiceError(
    "PERSISTENCE_ERROR",
    `${area}: ${error?.message || "database operation failed"}`,
    503,
  )
}

function normalized(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("en")
}

function contextCandidates(context: AmbassadorSettingsRuntimeContext): Array<{ type: AmbassadorSettingsScopeType; key: string }> {
  return [
    { type: "territory", key: String(context.territory || "") },
    { type: "city", key: String(context.city || "") },
    { type: "region", key: String(context.region || "") },
    { type: "country", key: String(context.country || "") },
    { type: "service_line", key: String(context.serviceLine || "") },
    { type: "program", key: String(context.program || "") },
    { type: "organization", key: "default" },
  ].filter((item) => item.key.trim()) as Array<{ type: AmbassadorSettingsScopeType; key: string }>
}

/**
 * Loads the most specific published policy governing an authenticated operation.
 * Scope precedence is territory → city → region → country → service line →
 * program → organization. Scoped versions are complete configurations copied
 * from their base, so selecting the most specific version is deterministic.
 */
export async function getEffectiveAmbassadorSettingsConfiguration(
  actor: AmbassadorActor,
  context: AmbassadorSettingsRuntimeContext = {},
): Promise<AmbassadorSettingsConfiguration> {
  const pointers = await getAmbassadorSupabaseAdmin()
    .from(ACTIVE_TABLE)
    .select("current_version_id,scope_type,scope_key")
    .eq("tenant_id", actor.tenantId)
    .eq("organization_id", actor.organizationId)
    .limit(100)

  if (pointers.error) persistenceError("Load active Ambassador settings pointers", pointers.error)

  const activeRows = (pointers.data || []) as ActiveScopeRow[]
  const selected = contextCandidates(context)
    .map((candidate) => activeRows.find((row) => normalized(row.scope_type) === candidate.type && normalized(row.scope_key) === normalized(candidate.key)))
    .find(Boolean)

  const versionId = String(selected?.current_version_id || "").trim()
  if (versionId) {
    const version = await getAmbassadorSupabaseAdmin()
      .from(VERSIONS_TABLE)
      .select("configuration,status")
      .eq("tenant_id", actor.tenantId)
      .eq("organization_id", actor.organizationId)
      .eq("id", versionId)
      .eq("status", "published")
      .maybeSingle()

    if (version.error) persistenceError("Load effective Ambassador settings version", version.error)
    if (!version.data) {
      throw new AmbassadorServiceError(
        "PERSISTENCE_ERROR",
        "An active Ambassador settings pointer does not resolve to a published version",
        503,
      )
    }
    return normalizeSettingsConfiguration(version.data.configuration)
  }

  const legacy = await getSettingsRow(actor)
  return configurationFromLegacySettings(legacy as AmbassadorRecord | null)
}
