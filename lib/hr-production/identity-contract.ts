import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { HR_TABLES, logHRActivity } from './repository'

function text(formData: FormData, key: string) {
  const v = formData.get(key)
  const s = v === null || v === undefined ? '' : String(v).trim()
  return s.length ? s : null
}

export async function ensureStaffIdentityContract(input: {
  staff_id: string
  email?: string | null
  full_name?: string | null
  user_id?: string | null
  source?: string
}) {
  const supabase = await createClient()

  const contract = {
    staff_id: input.staff_id,
    user_id: input.user_id || null,
    email: input.email?.toLowerCase() || null,
    full_name: input.full_name || null,
    source: input.source || 'staff_creation',
    status: input.user_id ? 'active' : 'missing_user_id',
    updated_at: new Date().toISOString(),
  }

  await supabase.from('hr_user_identity_contracts').upsert(contract, { onConflict: 'staff_id' })

  if (input.user_id) {
    await supabase
      .from(HR_TABLES.staff)
      .update({
        user_id: input.user_id,
        identity_status: 'linked',
        identity_source: contract.source,
        identity_linked_at: new Date().toISOString(),
      })
      .eq('id', input.staff_id)

    await supabase.from(HR_TABLES.attendance).update({ staff_id: input.staff_id }).eq('user_id', input.user_id).is('staff_id', null)
    await supabase.from('app_attendance_logs').update({ staff_id: input.staff_id }).eq('user_id', input.user_id).is('staff_id', null)
  }

  await logHRActivity({
    action: 'identity.contract.ensured',
    source_table: 'hr_user_identity_contracts',
    entity_type: 'staff',
    entity_id: input.staff_id,
    payload: contract,
  })

  return contract
}

export async function createStaffWithIdentityContractAction(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const payload: Record<string, any> = {
    full_name: text(formData, 'full_name') || text(formData, 'name') || 'New staff',
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    city: text(formData, 'city'),
    department: text(formData, 'department'),
    position: text(formData, 'position'),
    employment_status: text(formData, 'employment_status') || 'active',
    contract_type: text(formData, 'contract_type') || 'standard',
    identity_status: 'pending_identity',
    identity_source: 'staff_creation_action',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from(HR_TABLES.staff)
    .insert(payload)
    .select('id, full_name, email, user_id')
    .single()

  if (error) throw new Error(error.message)

  await ensureStaffIdentityContract({
    staff_id: data.id,
    email: data.email,
    full_name: data.full_name,
    user_id: data.user_id,
    source: 'staff_creation_action',
  })

  revalidatePath('/hr/staff')
  revalidatePath('/hr/attendance')
}
