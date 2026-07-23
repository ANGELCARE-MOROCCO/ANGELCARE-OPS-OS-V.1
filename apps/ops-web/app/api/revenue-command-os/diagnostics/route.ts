import { createHash } from 'node:crypto'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { revenueOsErrorResponse, revenueOsSuccess } from '@/lib/revenue-command-os/http'
import { createServiceClient } from '@/lib/supabase/server'
import { REVENUE_OS_PERMISSION_KEYS } from '@/lib/revenue-command-os/permissions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Diagnostic = {
  key: string
  status: 'operational' | 'degraded' | 'failed'
  expected?: unknown
  actual?: unknown
  detail: string
}

export async function GET() {
  try {
    const actor = await resolveRevenueOsActor('revenue_os.audit.view', {
      aliases: ['revenue_os.manage'],
      message: 'Permission d’audit Revenue OS requise.',
    })
    const client = await createServiceClient()
    const diagnostics: Diagnostic[] = []

    const [permissions, commands, workspace, installation] = await Promise.all([
      client.from('revenue_os_permission_registry').select('permission_key').eq('active', true),
      client.from('revenue_os_command_definitions').select('command_code', { count: 'exact', head: true }),
      client.from('revenue_os_workspaces').select('label,short_label,href').eq('workspace_key', 'intelligent-commands').maybeSingle(),
      client.from('revenue_os_installations').select('release_code,module_version,execution_mode,external_actions_enabled,updated_at').eq('installation_key', 'revenue-command-os').maybeSingle(),
    ])

    const dbPermissions = new Set((permissions.data ?? []).map((row) => String(row.permission_key)))
    const missingPermissions = REVENUE_OS_PERMISSION_KEYS.filter((key) => !dbPermissions.has(key))
    diagnostics.push({
      key: 'permission-registry',
      status: permissions.error || missingPermissions.length ? 'failed' : 'operational',
      expected: REVENUE_OS_PERMISSION_KEYS.length,
      actual: dbPermissions.size,
      detail: permissions.error?.message ?? (missingPermissions.length ? `Permissions manquantes: ${missingPermissions.join(', ')}` : 'Catalogue canonique complet.'),
    })

    diagnostics.push({
      key: 'command-library-3000',
      status: commands.error || commands.count !== 3000 ? 'failed' : 'operational',
      expected: 3000,
      actual: commands.count ?? null,
      detail: commands.error?.message ?? (commands.count === 3000 ? 'Registre exact 3000.' : 'Registre incomplet ou dérivé.'),
    })

    diagnostics.push({
      key: 'command-workspace-label',
      status: workspace.error || workspace.data?.short_label !== 'Commandes 3000' ? 'degraded' : 'operational',
      expected: 'Commandes 3000',
      actual: workspace.data?.short_label ?? null,
      detail: workspace.error?.message ?? 'Métadonnées du workspace lues.',
    })

    diagnostics.push({
      key: 'installation-ledger',
      status: installation.error || !installation.data ? 'failed' : 'operational',
      expected: 'AC-REVENUE-OS-MZ17-PRODUCTION-CONSISTENCY-REPAIR',
      actual: installation.data?.release_code ?? null,
      detail: installation.error?.message ?? 'Ledger d’installation disponible.',
    })

    const status = diagnostics.some((item) => item.status === 'failed')
      ? 'failed'
      : diagnostics.some((item) => item.status === 'degraded')
        ? 'degraded'
        : 'operational'

    const generatedAt = new Date().toISOString()
    return revenueOsSuccess({
      status,
      actor: { id: actor.id, role: actor.role, tenantId: actor.tenantId },
      diagnostics,
      generatedAt,
      fingerprint: createHash('sha256').update(JSON.stringify({ diagnostics, generatedAt })).digest('hex'),
      externalActionsEnabled: false,
    })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}
