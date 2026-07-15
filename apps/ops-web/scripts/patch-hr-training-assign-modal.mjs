import fs from 'node:fs'
import path from 'node:path'

const file = path.join(process.cwd(), 'app/(protected)/hr/training/page.tsx')
if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
let src = fs.readFileSync(file, 'utf8')

if (!src.includes("@/components/hr-training/AssignTrainingCommandModal")) {
  const marker = "import { getHRDashboardData } from '@/lib/hr-production/repository'"
  src = src.replace(marker, `${marker}\nimport AssignTrainingCommandModal from '@/components/hr-training/AssignTrainingCommandModal'`)
}

const actionStart = src.indexOf('async function assignTrainingAction(formData: FormData)')
const actionEnd = src.indexOf('async function updateTrainingAssignmentAction(formData: FormData)', actionStart)
if (actionStart === -1 || actionEnd === -1) throw new Error('Could not find assignTrainingAction block')
const newAction = `async function assignTrainingAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const groupId = crypto.randomUUID()
  const staffId = s(formData.get('staff_id'))
  const staffName = s(formData.get('staff_name')) || s(formData.get('employee_selector')) || 'Assigned staff'
  const staffEmail = s(formData.get('staff_email'))
  const positionTitle = s(formData.get('employee_position')) || s(formData.get('position_title')) || 'General position'
  const department = s(formData.get('employee_department')) || s(formData.get('department')) || 'General'
  const priority = s(formData.get('priority')) || 'mandatory'
  const startAt = s(formData.get('start_at')) || null
  const dueAt = s(formData.get('due_at')) || null
  const notes = s(formData.get('notes')) || 'Assigned from HR Training Command Center.'
  const trainingIds = formData.getAll('training_ids').map((x) => s(x)).filter(Boolean)
  const trainingTitles = formData.getAll('training_titles').map((x) => s(x)).filter(Boolean)
  const titles = trainingTitles.length ? trainingTitles : [s(formData.get('training_title')) || 'Assigned training']

  for (let index = 0; index < titles.length; index += 1) {
    const trainingTitle = titles[index] || 'Assigned training'
    const trainingId = trainingIds[index] || null
    const payload = {
      title: trainingTitle,
      staff_id: staffId || null,
      staff_name: staffName,
      staff_email: staffEmail || null,
      employee_name: staffName,
      user_name: staffName,
      position_title: positionTitle,
      department,
      training_id: trainingId,
      training_title: trainingTitle,
      assignment_group_id: groupId,
      start_at: startAt,
      due_at: dueAt,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
      priority,
      progress_percent: 0,
      notes,
      alert_level: 'initial_assignment',
      source: 'hr_training_command_center',
      metadata: { staffEmail, positionTitle, department, groupId, trainingId, startAt, dueAt, assignedFrom: 'hr_training_modal' },
      updated_at: new Date().toISOString(),
    }
    try {
      await supabase.from('hr_training_assignments').insert(payload)
    } catch {
      await supabase.from('hr_training_assignments').insert({
        title: trainingTitle,
        training_title: trainingTitle,
        staff_name: staffName,
        position_title: positionTitle,
        department,
        status: 'assigned',
        priority,
        progress_percent: 0,
        due_at: dueAt,
        notes,
        metadata: { staffEmail, groupId, startAt, dueAt },
      })
    }
  }

  try {
    await supabase.from('hr_training_audit_logs').insert({
      action: 'multi_training_assignment_created',
      entity_type: 'training_assignment_group',
      entity_id: groupId,
      title: \\`Training package assigned to \\${staffName}\\`,
      notes: \\`\\${titles.length} training(s) assigned to \\${staffName} / \\${positionTitle}\\`,
      metadata: { groupId, staffId, staffName, staffEmail, positionTitle, department, titles, startAt, dueAt },
      created_at: new Date().toISOString(),
    })
  } catch {}

  revalidatePath('/hr/training')
  redirect(\\`/hr/training?assigned=1&staff=\\${encodeURIComponent(staffName)}&trainings=\\${titles.length}#modal-assign-training\\`)
}

`
src = src.slice(0, actionStart) + newAction + src.slice(actionEnd)

if (!src.includes('const assignmentSuccess = sp(\'assigned\') === \'1\'')) {
  const marker = "  const overdueAssignments = activeAssignments.filter((a) => a.due && new Date(a.due).getTime() < Date.now())"
  const inject = `${marker}
  const assignmentSuccess = sp('assigned') === '1'
  const assignTrainingLibrary = positions.flatMap((position) => position.items.map((item: any, index: number) => ({
    id: item.id || \\`\\${position.id}-\\${slug(item.title)}-\\${index}\\`,
    title: item.title || 'Training resource',
    description: item.description || 'Live training resource synced with the selected position.',
    position: position.name,
    department: position.department || 'All departments',
    type: item.type || item.source || 'training',
    priority: item.priority || 'mandatory',
    duration: item.duration || '60',
    pdf: item.pdf || '',
    video: item.video || '',
  })))
  const assignStaffOptions = staff.map((employee, index) => ({
    id: first(employee, ['id','user_id','profile_id','email'], \\`staff-\\${index}\\`),
    name: first(employee, ['full_name','name','employee_name','email'], 'Staff member'),
    email: first(employee, ['email'], ''),
    phone: first(employee, ['phone','phone_number','mobile'], ''),
    department: first(employee, ['department'], ''),
    position: first(employee, ['position','role','job_title'], ''),
    status: first(employee, ['status','employment_status'], 'active'),
    city: first(employee, ['city','work_city','location'], ''),
  }))`
  src = src.replace(marker, inject)
}

const modalStart = src.indexOf('    <Modal id="modal-assign-training"')
const modalEnd = src.indexOf("\n\n    {['training-search'", modalStart)
if (modalStart === -1 || modalEnd === -1) throw new Error('Could not find modal-assign-training block')
const newModal = `    <Modal id="modal-assign-training" title="Assign Training Command Workspace" subtitle="One live modal for department, position, employee, multi-training assignment, scheduling and French communication previews." ultra>
      <AssignTrainingCommandModal
        staff={assignStaffOptions}
        trainings={assignTrainingLibrary}
        departments={departments.length ? departments : ['HR', 'Operations', 'Academy', 'Market-OS', 'Revenue', 'Finance']}
        positions={positionNames}
        recentAssignments={liveAssignments}
        success={assignmentSuccess}
        action={assignTrainingAction}
      />
    </Modal>`
src = src.slice(0, modalStart) + newModal + src.slice(modalEnd)

fs.writeFileSync(file, src)
console.log('Patched HR training assign modal successfully')
