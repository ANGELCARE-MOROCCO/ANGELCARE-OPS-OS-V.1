import fs from 'node:fs'

const file = 'lib/hr-production/attendance-enterprise.ts'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

if (!s.includes('export async function createAttendanceAction')) {
  s += `

export async function createAttendanceAction(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const payload = {
    attendance_id: String(formData.get('attendance_id') || '') || null,
    staff_id: String(formData.get('staff_id') || '') || null,
    action_type: String(formData.get('action_type') || 'review'),
    priority: String(formData.get('priority') || 'normal'),
    status: 'open',
    notes: String(formData.get('notes') || ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('hr_attendance_actions').insert(payload)
  if (error) throw new Error(error.message)

  await logHRActivity({
    action: 'attendance.action.created',
    source_table: 'hr_attendance_actions',
    entity_type: 'attendance_action',
    payload,
  })

  revalidatePath('/hr/attendance')
  revalidatePath('/hr/attendance/actions')
}
`
}

fs.writeFileSync(file, s)
console.log('Added missing createAttendanceAction export.')
