'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canMoveHrStage } from './_lib/hrEnterpriseCommand'

export async function createEnterpriseCommand(formData: FormData) {
  const supabase = await createClient()

  const payload = {
    source_module: String(formData.get('source_module') || 'hr-os'),
    command_title: String(formData.get('command_title') || '').trim(),
    command_type: String(formData.get('command_type') || 'manager_action'),
    severity: String(formData.get('severity') || 'normal'),
    owner: String(formData.get('owner') || '').trim(),
    status: String(formData.get('status') || 'open'),
    linked_route: String(formData.get('linked_route') || '/hr-os'),
    notes: String(formData.get('notes') || '').trim(),
  }

  if (!payload.command_title) return

  await supabase.from('hr_os_enterprise_commands').insert(payload)
  revalidatePath('/hr-os/enterprise')
}

export async function moveLifecycleStage(formData: FormData) {
  const supabase = await createClient()
  const entityId = String(formData.get('entity_id') || '')
  const fromStage = String(formData.get('from_stage') || 'candidate')
  const toStage = String(formData.get('to_stage') || 'candidate')
  const reason = String(formData.get('reason') || '').trim()

  if (!entityId || !canMoveHrStage(fromStage, toStage)) return

  await supabase.from('hr_os_lifecycle_events').insert({
    entity_id: entityId,
    from_stage: fromStage,
    to_stage: toStage,
    reason,
  })

  revalidatePath('/hr-os/enterprise')
}
