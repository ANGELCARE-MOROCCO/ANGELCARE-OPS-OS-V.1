import fs from 'node:fs'

const file = 'lib/hr-production/attendance-enterprise.ts'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

if (!s.includes('export async function getIdentityLinks')) {
  s += `

export async function getIdentityLinks() {
  const supabase = await createClient()
  try {
    const { data } = await supabase
      .from('hr_identity_links')
      .select('*, staff:hr_staff_profiles(id, full_name, email, department, position, city)')
      .order('created_at', { ascending: false })
      .limit(700)

    return data || []
  } catch {
    return []
  }
}
`
}

if (!s.includes('export async function mapIdentityToStaffAction')) {
  s += `

export async function mapIdentityToStaffAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const link_id = String(formData.get('link_id') || '')
  const staff_id = String(formData.get('staff_id') || '')

  if (!link_id || !staff_id) {
    throw new Error('Missing link_id or staff_id')
  }

  const { data: staff } = await supabase
    .from(HR_TABLES.staff)
    .select('id, full_name, email, department, position, city')
    .eq('id', staff_id)
    .maybeSingle()

  const { error } = await supabase
    .from('hr_identity_links')
    .update({
      staff_id,
      label: staff?.full_name || staff?.email || 'Mapped staff',
      status: 'mapped',
      confidence: 'manual',
      updated_at: new Date().toISOString(),
    })
    .eq('id', link_id)

  if (error) throw new Error(error.message)

  const { data: link } = await supabase
    .from('hr_identity_links')
    .select('*')
    .eq('id', link_id)
    .maybeSingle()

  if (link?.source_user_id) {
    await supabase
      .from(HR_TABLES.attendance)
      .update({ staff_id })
      .eq('user_id', link.source_user_id)

    await supabase
      .from('app_attendance_logs')
      .update({ staff_id })
      .eq('user_id', link.source_user_id)
  }

  try {
    await supabase
      .from('hr_user_identity_contracts')
      .upsert({
        staff_id,
        user_id: link?.source_user_id || null,
        email: staff?.email || null,
        full_name: staff?.full_name || null,
        source: 'manual_identity_map',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'staff_id' })
  } catch {}

  await logHRActivity({
    action: 'attendance.identity.mapped',
    source_table: 'hr_identity_links',
    record_id: link_id,
    entity_type: 'identity_link',
    payload: { link_id, staff_id, source_user_id: link?.source_user_id },
  })

  revalidatePath('/hr/attendance')
  revalidatePath('/hr/attendance/identity-map')
}
`
}

fs.writeFileSync(file, s)
console.log('Added missing getIdentityLinks and mapIdentityToStaffAction exports.')
