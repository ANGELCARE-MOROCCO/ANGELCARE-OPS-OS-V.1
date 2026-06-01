import { NextResponse } from 'next/server'
async function loadOverview(): Promise<any> { try { const server = await import('@/lib/saas-factory/server'); return await server.getFactoryOverview() } catch (error: any) { return { source: 'fallback', warnings: [error?.message || 'server helper unavailable'], optionGroups: [], options: [], featureFlags: [], auditEvents: [] } } }
async function writeAudit(event: Record<string, any>) { try { const server = await import('@/lib/saas-factory/server'); await server.logAudit(event) } catch {} }
export async function POST() {
  const overview = await loadOverview()
  const now = new Date().toISOString()
  const checks = [
    { id: 'source-confidence', label: 'Source confidence', category: 'runtime', status: overview.source === 'supabase' ? 'passed' : 'warning', severity: overview.source === 'supabase' ? 'low' : 'high', recommendation: overview.source === 'supabase' ? 'Continue.' : 'Connect Supabase or apply migration before production publish.' },
    { id: 'option-groups', label: 'Option groups available', category: 'registry', status: (overview.optionGroups || []).length > 0 ? 'passed' : 'failed', severity: 'critical', recommendation: 'Create at least one option group before publishing configuration.' },
    { id: 'options', label: 'Live options available', category: 'registry', status: (overview.options || []).length > 0 ? 'passed' : 'failed', severity: 'critical', recommendation: 'Create option values and validate distribution.' },
    { id: 'feature-flags', label: 'Feature gates registered', category: 'release', status: (overview.featureFlags || []).length > 0 ? 'passed' : 'warning', severity: 'medium', recommendation: 'Register release gates for risky changes.' },
    { id: 'audit-support', label: 'Audit trail support', category: 'governance', status: (overview.auditEvents || []).length > 0 ? 'passed' : 'warning', severity: 'high', recommendation: 'Ensure saas_factory_audit_events exists and is writable.' },
  ]
  const failed = checks.filter((check) => check.status === 'failed').length
  const warnings = checks.filter((check) => check.status === 'warning').length
  const result = { ok: failed === 0, executedAt: now, source: overview.source || 'fallback', score: Math.max(60, 100 - failed * 18 - warnings * 7), passed: checks.filter((c) => c.status === 'passed').length, warnings, failed, checks }
  await writeAudit({ event_type: 'saas_factory.configuration.validate', title: 'Configuration validation executed', severity: failed ? 'critical' : warnings ? 'warning' : 'info', metadata_json: result })
  return NextResponse.json(result)
}
