import { NextResponse } from 'next/server'
import { getFactoryOverview, logAudit, saveFactoryFeatureFlag, saveFactoryOption, saveFactoryOptionGroup } from '@/lib/saas-factory/server'

function statusFromCount(warnings: number, disabled: number) {
  if (disabled > 0) return 'attention'
  if (warnings > 0) return 'review'
  return 'healthy'
}

export async function GET() {
  const overview = await getFactoryOverview()
  const now = new Date().toISOString()
  const groups = (overview.optionGroups || []).map((group: any, index: number) => {
    const options = (overview.options || []).filter((option: any) => option.group_key === group.key)
    const disabled = options.filter((option: any) => option.is_enabled === false).length
    return {
      id: group.id || group.key || `group-${index}`,
      key: group.key || `group-${index}`,
      label: group.label || group.key || `Group ${index + 1}`,
      scope: group.scope || group.module_key || 'global',
      owner: group.owner || 'Operations Governance',
      status: group.is_enabled === false ? 'disabled' : statusFromCount(0, disabled),
      optionCount: Number(group.options || options.length || 0),
      enabledCount: options.filter((option: any) => option.is_enabled !== false).length,
      disabledCount: disabled,
      source: overview.source,
      updatedAt: group.updated_at || group.created_at || now,
      description: group.description || 'Live option group distributed to SaaS Factory consumers.',
    }
  })
  const options = (overview.options || []).map((option: any, index: number) => ({
    id: option.id || `${option.group_key || 'group'}-${option.value || index}`,
    groupKey: option.group_key || 'general',
    value: option.value || option.key || `option-${index}`,
    label: option.label || option.value || `Option ${index + 1}`,
    enabled: option.is_enabled !== false,
    sortOrder: Number(option.sort_order || index + 1),
    owner: option.owner || 'Configuration Team',
    updatedAt: option.updated_at || option.created_at || now,
    source: overview.source,
  }))
  const flags = (overview.featureFlags || []).map((flag: any, index: number) => ({
    id: flag.id || flag.key || `flag-${index}`,
    key: flag.key || `flag-${index}`,
    label: flag.label || flag.key || `Flag ${index + 1}`,
    moduleKey: flag.module_key || 'saas_factory_command',
    status: flag.status || (flag.enabled ? 'enabled' : 'disabled'),
    rolloutPercent: Number(flag.rollout_percent ?? flag.rollout ?? 0),
    owner: flag.owner || 'Release Governance',
    risk: flag.risk || 'medium',
    updatedAt: flag.updated_at || flag.created_at || now,
  }))
  const policies = [
    { id: 'publish-approval', title: 'Two-step publish approval', status: 'enabled', owner: 'CTO Office', severity: 'high', description: 'Configuration publish requires preview and audit evidence.' },
    { id: 'unsafe-delete-block', title: 'Hard delete blocked for configuration records', status: 'enabled', owner: 'Security', severity: 'critical', description: 'Configuration removal must use disable/archive workflows.' },
    { id: 'fallback-transparency', title: 'Fallback data transparency', status: overview.source === 'supabase' ? 'enabled' : 'review', owner: 'Platform', severity: 'medium', description: 'UI must clearly identify fallback or live source confidence.' },
  ]
  const warnings = [
    ...overview.warnings,
    ...(overview.source !== 'supabase' ? ['Supabase is unavailable or table read returned fallback data. Configuration changes will preview safely until live connection is restored.'] : []),
    ...(groups.some((group: any) => group.disabledCount > 0) ? ['Some option values are disabled and need governance review before publish.'] : []),
  ]
  const recommendations = [
    ...(warnings.length ? [{ id: 'review-source-confidence', title: 'Review configuration source confidence', priority: 'high', action: 'Open validation workflow', reason: warnings[0] }] : []),
    ...(flags.some((flag: any) => flag.status !== 'enabled') ? [{ id: 'review-feature-gates', title: 'Review disabled or staged feature flags', priority: 'medium', action: 'Open feature gate workflow', reason: 'At least one release/configuration gate is not fully enabled.' }] : []),
    { id: 'export-baseline', title: 'Export configuration baseline before publishing', priority: 'medium', action: 'Open export builder', reason: 'Creates rollback evidence for operational governance.' },
  ]
  return NextResponse.json({
    ok: true,
    source: overview.source,
    generatedAt: now,
    summary: {
      optionGroups: groups.length,
      options: options.length,
      enabledOptions: options.filter((option) => option.enabled).length,
      disabledOptions: options.filter((option) => !option.enabled).length,
      featureFlags: flags.length,
      pendingWarnings: warnings.length,
      readinessScore: Math.max(72, 100 - warnings.length * 8 - groups.filter((group) => group.status !== 'healthy').length * 3),
      publishable: warnings.length === 0,
    },
    groups,
    options,
    flags,
    policies,
    auditEvents: (overview.auditEvents || []).slice(0, 20),
    recommendations,
    warnings,
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const type = String(body.type || 'option')
  let result: any
  if (type === 'group') result = await saveFactoryOptionGroup(body.payload || {})
  else if (type === 'flag') result = await saveFactoryFeatureFlag(body.payload || {})
  else result = await saveFactoryOption(body.payload || {})
  await logAudit({ event_type: 'saas_factory.configuration.save', title: `Configuration ${type} saved`, severity: result?.ok === false ? 'warning' : 'info', metadata_json: { type, payload: body.payload, result } })
  return NextResponse.json({ ok: result?.ok !== false, result, savedAt: new Date().toISOString() })
}
