import crypto from 'node:crypto'
import { SENSITIVE_TELEMETRY_KEYS } from './contract'
import type { ProductionTelemetryPayload } from './types'

const now = () => new Date().toISOString()
const text = (value: unknown, max = 500) => String(value ?? '').slice(0, max)
const safeDate = (value: unknown) => {
  if (!value) return now()
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? now() : date.toISOString()
}
function sanitize(value: unknown, depth = 0): any {
  if (depth > 5) return '[truncated]'
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitize(item, depth + 1))
  if (!value || typeof value !== 'object') return typeof value === 'string' ? value.slice(0, 1000) : value
  const output: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_TELEMETRY_KEYS.has(key)) { output[key] = '[redacted]'; continue }
    output[key] = sanitize(item, depth + 1)
  }
  return output
}
function fingerprint(component: string, code: string, message: string) {
  return crypto.createHash('sha256').update(`${component}|${code}|${message.replace(/[0-9a-f-]{24,}/gi, ':id').slice(0, 300)}`).digest('hex')
}
async function recordFingerprint(db: any, input: { component: string; code?: string | null; message?: string | null; version: string; deviceId: string }) {
  if (!input.code && !input.message) return null
  const normalized = text(input.message || input.code || 'UNKNOWN_ERROR', 500)
  const value = fingerprint(input.component, text(input.code || 'UNKNOWN'), normalized)
  const { data: existing } = await db.from('browser_extension_error_fingerprints').select('*').eq('fingerprint', value).maybeSingle()
  const versions = Array.from(new Set([...(Array.isArray(existing?.affected_versions) ? existing.affected_versions : []), input.version]))
  const row = {
    fingerprint: value,
    component: input.component,
    error_code: input.code || null,
    normalized_message: normalized,
    severity: input.component.includes('auth') ? 'error' : 'warning',
    first_seen_at: existing?.first_seen_at || now(),
    last_seen_at: now(),
    occurrence_count: Number(existing?.occurrence_count || 0) + 1,
    affected_versions: versions,
    affected_devices: Math.max(1, Number(existing?.affected_devices || 0)),
    status: existing?.status || 'open',
  }
  await db.from('browser_extension_error_fingerprints').upsert(row, { onConflict: 'fingerprint' })
  return value
}
export async function recordProductionTelemetry(db: any, actor: any, device: any, payload: ProductionTelemetryPayload) {
  const extensionVersion = text(payload.extensionVersion || device.extension_version || 'unknown', 50)
  const releaseChannel = text(payload.releaseChannel || device.release_channel || 'pilot', 50)
  const healthRows = []
  for (const event of (payload.health || []).slice(0, 50)) {
    const errorFingerprint = await recordFingerprint(db, { component: text(event.component, 100), code: event.errorCode, message: event.errorMessage, version: extensionVersion, deviceId: device.id })
    healthRows.push({
      device_id: device.id, user_id: actor.id, extension_version: extensionVersion, release_channel: releaseChannel,
      component: text(event.component, 100), status: text(event.status || 'unknown', 30), event_type: text(event.eventType, 100),
      latency_ms: event.latencyMs == null ? null : Math.max(0, Math.round(Number(event.latencyMs))),
      correlation_id: event.correlationId ? text(event.correlationId, 150) : null,
      error_fingerprint: errorFingerprint, metrics: sanitize(event.metrics || {}), metadata: sanitize(event.metadata || {}),
      occurred_at: safeDate(event.occurredAt), received_at: now(),
    })
  }
  if (healthRows.length) await db.from('browser_extension_runtime_health_events').insert(healthRows)

  const performanceRows = (payload.performance || []).slice(0, 100).map((sample) => ({
    device_id: device.id, extension_version: extensionVersion, metric_key: text(sample.metricKey, 100),
    duration_ms: Math.max(0, Number(sample.durationMs || 0)), sample_context: sample.sampleContext ? text(sample.sampleContext, 100) : null,
    cache_state: sample.cacheState ? text(sample.cacheState, 30) : null, success: sample.success !== false,
    metadata: sanitize(sample.metadata || {}), measured_at: safeDate(sample.measuredAt),
  }))
  if (performanceRows.length) await db.from('browser_extension_performance_samples').insert(performanceRows)

  for (const adapter of (payload.adapters || []).slice(0, 20)) {
    const errorFingerprint = await recordFingerprint(db, { component: `adapter:${text(adapter.adapterKey, 80)}`, code: adapter.errorCode, message: adapter.errorMessage, version: extensionVersion, deviceId: device.id })
    const { data: existing } = await db.from('browser_extension_adapter_health').select('*').eq('device_id', device.id).eq('adapter_key', adapter.adapterKey).maybeSingle()
    await db.from('browser_extension_adapter_health').upsert({
      device_id: device.id, adapter_key: text(adapter.adapterKey, 80), selector_version: text(adapter.selectorVersion || 'v1', 40),
      status: text(adapter.status || (adapter.success ? 'healthy' : 'degraded'), 30),
      last_success_at: adapter.success ? now() : existing?.last_success_at || null,
      last_failure_at: adapter.success ? existing?.last_failure_at || null : now(),
      consecutive_failures: adapter.success ? 0 : Number(existing?.consecutive_failures || 0) + 1,
      last_error_fingerprint: errorFingerprint, disabled: Boolean(existing?.disabled), disabled_reason: existing?.disabled_reason || null,
      maintenance_notes: existing?.maintenance_notes || null, metadata: sanitize(adapter.metadata || {}), updated_at: now(),
    }, { onConflict: 'device_id,adapter_key' })
  }

  const overall = healthRows.some((row) => row.status === 'blocked' || row.status === 'offline') ? 'degraded' : healthRows.some((row) => row.status === 'degraded') ? 'degraded' : 'healthy'
  await db.from('browser_extension_devices').update({ extension_version: extensionVersion, release_channel: releaseChannel, health_status: overall, last_health_at: now(), last_error_fingerprint: healthRows.find((row) => row.error_fingerprint)?.error_fingerprint || null }).eq('id', device.id)
  return { accepted: { health: healthRows.length, performance: performanceRows.length, adapters: Math.min((payload.adapters || []).length, 20) }, overall }
}

export async function loadProductionStatus(db: any, device: any) {
  const channelKey = device.desired_release_channel || device.release_channel || 'pilot'
  const [{ data: channel }, { data: release }, { data: flags }, { data: switches }, { data: compatibility }] = await Promise.all([
    db.from('browser_extension_release_channels').select('*').eq('channel_key', channelKey).maybeSingle(),
    db.from('browser_extension_release_versions').select('*').eq('version', device.extension_version || '0.7.0').maybeSingle(),
    db.from('browser_extension_feature_flags').select('*').eq('enabled', true),
    db.from('browser_extension_production_kill_switches').select('*').eq('active', true),
    db.from('browser_extension_compatibility_matrix').select('*').eq('extension_version', device.extension_version || '0.7.0'),
  ])
  const applicableSwitches = (switches || []).filter((row: any) => row.scope_type === 'global' || row.scope_reference === '*' || row.scope_reference === device.id || row.scope_reference === channelKey)
  return { channel: channel || null, release: release || null, flags: flags || [], killSwitches: applicableSwitches, compatibility: compatibility || [], serverTime: now() }
}

export async function loadProductionControl(db: any) {
  const [channels, releases, devices, health, adapters, errors, flags, switches, incidents, compatibility, approvals] = await Promise.all([
    db.from('browser_extension_release_channels').select('*').order('channel_key'),
    db.from('browser_extension_release_versions').select('*').order('created_at', { ascending: false }).limit(30),
    db.from('browser_extension_devices').select('id,user_id,device_name,platform,browser_version,extension_version,release_channel,desired_release_channel,status,health_status,last_health_at,last_seen_at').order('last_seen_at', { ascending: false }).limit(500),
    db.from('browser_extension_runtime_health_events').select('*').order('occurred_at', { ascending: false }).limit(300),
    db.from('browser_extension_adapter_health').select('*').order('updated_at', { ascending: false }).limit(300),
    db.from('browser_extension_error_fingerprints').select('*').order('last_seen_at', { ascending: false }).limit(100),
    db.from('browser_extension_feature_flags').select('*').order('flag_key'),
    db.from('browser_extension_production_kill_switches').select('*').order('activated_at', { ascending: false }).limit(100),
    db.from('browser_extension_incidents').select('*').order('detected_at', { ascending: false }).limit(100),
    db.from('browser_extension_compatibility_matrix').select('*').order('extension_version', { ascending: false }),
    db.from('browser_extension_deployment_approvals').select('*').order('requested_at', { ascending: false }).limit(100),
  ])
  const rows = health.data || []
  const commandFailures = rows.filter((row: any) => row.status !== 'healthy').length
  return {
    channels: channels.data || [], releases: releases.data || [], devices: devices.data || [], health: rows,
    adapters: adapters.data || [], errors: errors.data || [], flags: flags.data || [], killSwitches: switches.data || [],
    incidents: incidents.data || [], compatibility: compatibility.data || [], approvals: approvals.data || [],
    summary: {
      activeDevices: (devices.data || []).filter((row: any) => row.status === 'active').length,
      healthyDevices: (devices.data || []).filter((row: any) => row.health_status === 'healthy').length,
      degradedDevices: (devices.data || []).filter((row: any) => row.health_status === 'degraded').length,
      openIncidents: (incidents.data || []).filter((row: any) => !['closed','resolved'].includes(row.status)).length,
      activeKillSwitches: (switches.data || []).filter((row: any) => row.active).length,
      recentFailures: commandFailures,
    },
    refreshedAt: now(),
  }
}

export async function executeProductionAdminAction(db: any, actor: any, action: string, payload: any) {
  if (action === 'feature_flag.set') {
    const row = { flag_key: text(payload.flagKey, 120), scope_type: text(payload.scopeType || 'global', 40), scope_reference: text(payload.scopeReference || '*', 120), enabled: Boolean(payload.enabled), rollout_percent: Math.max(0, Math.min(100, Number(payload.rolloutPercent ?? 100))), minimum_version: payload.minimumVersion || null, maximum_version: payload.maximumVersion || null, conditions: sanitize(payload.conditions || {}), reason: text(payload.reason, 500), changed_by: actor.id, changed_at: now(), updated_at: now() }
    const { data, error } = await db.from('browser_extension_feature_flags').upsert(row, { onConflict: 'flag_key' }).select('*').single(); if (error) throw error; return { featureFlag: data }
  }
  if (action === 'kill_switch.activate') {
    const { data, error } = await db.from('browser_extension_production_kill_switches').insert({ switch_key: text(payload.switchKey, 120), scope_type: text(payload.scopeType || 'global', 40), scope_reference: text(payload.scopeReference || '*', 120), reason: text(payload.reason || 'Emergency production protection', 1000), severity: text(payload.severity || 'critical', 40), activated_by: actor.id, expires_at: payload.expiresAt || null, metadata: sanitize(payload.metadata || {}) }).select('*').single(); if (error) throw error; return { killSwitch: data }
  }
  if (action === 'kill_switch.deactivate') {
    const { data, error } = await db.from('browser_extension_production_kill_switches').update({ active: false, deactivated_by: actor.id, deactivated_at: now(), deactivation_reason: text(payload.reason, 1000) }).eq('id', payload.id).select('*').single(); if (error) throw error; return { killSwitch: data }
  }
  if (action === 'incident.create') {
    const { data, error } = await db.from('browser_extension_incidents').insert({ title: text(payload.title, 250), category: text(payload.category, 100), severity: text(payload.severity || 'SEV-3', 20), impact_summary: text(payload.impactSummary, 2000), affected_components: sanitize(payload.affectedComponents || []), affected_versions: sanitize(payload.affectedVersions || []), incident_commander_id: payload.incidentCommanderId || actor.id, created_by: actor.id, evidence: sanitize(payload.evidence || {}) }).select('*').single(); if (error) throw error; await db.from('browser_extension_incident_events').insert({ incident_id: data.id, event_type: 'detected', message: 'Incident created', next_status: 'detected', actor_id: actor.id }); return { incident: data }
  }
  if (action === 'incident.transition') {
    const nextStatus = text(payload.nextStatus, 40); const timestamps: Record<string, string> = {}; if (nextStatus === 'contained') timestamps.contained_at = now(); if (nextStatus === 'recovered') timestamps.recovered_at = now(); if (nextStatus === 'closed') timestamps.closed_at = now(); const { data: previous } = await db.from('browser_extension_incidents').select('*').eq('id', payload.id).single(); const { data, error } = await db.from('browser_extension_incidents').update({ status: nextStatus, updated_by: actor.id, updated_at: now(), root_cause: payload.rootCause || previous?.root_cause || null, corrective_actions: sanitize(payload.correctiveActions || previous?.corrective_actions || []), ...timestamps }).eq('id', payload.id).select('*').single(); if (error) throw error; await db.from('browser_extension_incident_events').insert({ incident_id: payload.id, event_type: 'status_transition', message: text(payload.message || `${previous?.status} → ${nextStatus}`, 1000), previous_status: previous?.status || null, next_status: nextStatus, actor_id: actor.id, evidence: sanitize(payload.evidence || {}) }); return { incident: data }
  }
  if (action === 'release.promote') {
    const version = text(payload.version, 50); const channel = text(payload.channel || 'pilot', 40); const { data, error } = await db.from('browser_extension_release_versions').update({ channel_key: channel, status: channel === 'stable' ? 'stable' : 'pilot', maximum_rollout_percent: Math.max(0, Math.min(100, Number(payload.rolloutPercent ?? 10))), approved_by: actor.id, approved_at: now(), promoted_by: actor.id, promoted_at: now(), updated_at: now() }).eq('version', version).select('*').single(); if (error) throw error; await db.from('browser_extension_release_channels').upsert({ channel_key: channel, version, minimum_version: payload.minimumVersion || version, mandatory: Boolean(payload.mandatory), release_notes: text(payload.releaseNotes || `Promoted ${version}`, 2000), enabled: true, updated_at: now() }, { onConflict: 'channel_key' }); return { release: data }
  }
  if (action === 'release.mark_bad') { const { data, error } = await db.from('browser_extension_release_versions').update({ known_bad: true, known_bad_reason: text(payload.reason, 1000), status: 'blocked', updated_at: now() }).eq('version', payload.version).select('*').single(); if (error) throw error; return { release: data } }
  if (action === 'release.rollback') { const rollbackVersion = text(payload.rollbackVersion || '0.6.0', 50); await db.from('browser_extension_release_channels').update({ version: rollbackVersion, minimum_version: rollbackVersion, mandatory: false, release_notes: text(payload.reason || `Emergency rollback to ${rollbackVersion}`, 2000), updated_at: now() }).eq('channel_key', payload.channel || 'pilot'); return { rollbackVersion } }
  if (action === 'device.channel_assign') { const { data, error } = await db.from('browser_extension_devices').update({ desired_release_channel: text(payload.channel, 40), updated_at: now() }).eq('id', payload.deviceId).select('*').single(); if (error) throw error; await db.from('browser_extension_device_release_assignments').upsert({ device_id: payload.deviceId, channel_key: text(payload.channel, 40), assigned_version: payload.version || null, rollout_bucket: Number(payload.rolloutBucket || 0), assignment_reason: text(payload.reason, 500), assigned_by: actor.id, assigned_at: now(), revoked_at: null, revoked_by: null }, { onConflict: 'device_id' }); return { device: data } }
  if (action === 'device.revoke') { const { data, error } = await db.from('browser_extension_devices').update({ status: 'revoked', revoked_at: now(), revoked_by: actor.id, updated_at: now() }).eq('id', payload.deviceId).select('*').single(); if (error) throw error; await db.from('browser_extension_refresh_tokens').update({ revoked_at: now() }).eq('device_id', payload.deviceId).is('revoked_at', null); return { device: data } }
  throw Object.assign(new Error('UNSUPPORTED_PRODUCTION_ADMIN_ACTION'), { status: 400 })
}
