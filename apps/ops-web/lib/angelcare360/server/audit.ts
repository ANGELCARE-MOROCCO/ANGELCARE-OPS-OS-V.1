import { createClient } from '@/lib/supabase/server'
import type { Angelcare360AuditEventInput, Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import { getAngelcare360AccessContext } from './context'

function normalizeIpAddress(input: string | null | undefined) {
  if (!input) return null
  const first = input.split(',')[0]?.trim()
  return first || null
}

export async function recordAngelcare360AuditEventServer(input: Angelcare360AuditEventInput): Promise<{
  ok: boolean
  persisted: boolean
  record?: Angelcare360AuditRecord | null
  error?: string
}> {
  const context = await getAngelcare360AccessContext({ schoolId: input.schoolId ?? undefined })
  if (!context?.school) {
    return { ok: false, persisted: false, error: 'Aucun établissement actif n’est disponible pour journaliser l’événement.' }
  }

  const supabase = await createClient()
  const payload = {
    school_id: context.school.id,
    actor_user_id: context.user.id,
    actor_role: context.primaryRoleKey || context.access.accessLevel,
    module: input.module,
    action: input.action,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    severity: input.severity || 'info',
    ip_address: normalizeIpAddress(input.ipAddress),
    user_agent: input.userAgent || null,
    request_id: input.requestId || null,
    before_data: input.beforeData || {},
    after_data: input.afterData || {},
    metadata: {
      ...input.metadata,
      category: input.category || null,
      route: input.route || null,
      school_code: context.school.school_code,
      role_label: context.access.roleLabel,
    },
  }

  const { data, error } = await supabase
    .from('angelcare360_audit_logs')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    return { ok: false, persisted: false, error: error.message }
  }

  return { ok: true, persisted: true, record: data as Angelcare360AuditRecord }
}

