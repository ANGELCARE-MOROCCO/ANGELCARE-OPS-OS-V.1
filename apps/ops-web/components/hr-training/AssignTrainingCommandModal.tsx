'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Bell, BookOpenCheck, CalendarClock, CheckCircle2, Clock3, FileText, Link2, Mail, PlayCircle, Plus, Send, ShieldAlert, Trash2, UserRound, Users } from 'lucide-react'

type StaffOption = {
  id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  status: string
  city: string
}

type TrainingOption = {
  id: string
  title: string
  description: string
  position: string
  department: string
  type: string
  priority: string
  duration: string
  pdf: string
  video: string
}

type AssignmentSummary = {
  id: string
  staff: string
  position: string
  training: string
  status: string
  progress: number
  priority: string
  due: string
  updated: string
}

function norm(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function labelDate(value: string) {
  if (!value) return 'Non défini'
  try { return new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return value }
}

function initial(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('') || 'AC'
}

function resourceIcon(type: string) {
  const t = norm(type)
  if (t.includes('video')) return <PlayCircle className="h-4 w-4" />
  if (t.includes('pdf')) return <FileText className="h-4 w-4" />
  if (t.includes('link')) return <Link2 className="h-4 w-4" />
  return <BookOpenCheck className="h-4 w-4" />
}

function buildMail(mode: 'alert' | 'reminder' | 'warning', employee: StaffOption | undefined, selectedTrainings: TrainingOption[], startAt: string, dueAt: string) {
  const name = employee?.name || '[Collaborateur]'
  const role = employee?.position || '[Poste]'
  const department = employee?.department || '[Département]'
  const titles = selectedTrainings.map((t, i) => `${i + 1}. ${t.title} — ${t.type || 'formation'}${t.duration ? ` — ${t.duration} min` : ''}`).join('\n') || '1. [Formation assignée]'
  const subject = mode === 'alert'
    ? `Alerte formation assignée — ${name}`
    : mode === 'reminder'
      ? `Rappel ferme — Formation obligatoire en attente — ${name}`
      : `Avertissement disciplinaire — Formation non traitée — ${name}`

  const intro = mode === 'alert'
    ? `Nous vous informons qu'un nouveau parcours de formation vient de vous être assigné dans le système AngelCare.`
    : mode === 'reminder'
      ? `Nous vous rappelons fermement que les formations ci-dessous sont obligatoires et doivent être traitées dans les délais indiqués.`
      : `Malgré les rappels opérationnels, les obligations de formation ci-dessous nécessitent une réaction immédiate. Cette notification constitue un avertissement formel et pourra donner lieu à un entretien de justification avec votre manager.`

  const closing = mode === 'alert'
    ? `Merci de démarrer la formation dans les délais et de respecter les consignes associées.\n\nCordialement,\nDépartement Ressources Humaines — AngelCare`
    : mode === 'reminder'
      ? `Merci de régulariser votre situation sans délai. Tout retard doit être justifié auprès de votre responsable.\n\nCordialement,\nDépartement Ressources Humaines — AngelCare`
      : `Vous êtes invité(e) à vous présenter à un entretien de justification avec votre manager si la situation n'est pas régularisée immédiatement.\n\nDépartement Ressources Humaines — AngelCare`

  return {
    subject,
    body: `Objet : ${subject}\n\nBonjour ${name},\n\n${intro}\n\nCollaborateur : ${name}\nPoste : ${role}\nDépartement : ${department}\nDate de démarrage : ${labelDate(startAt)}\nDate limite : ${labelDate(dueAt)}\n\nFormations concernées :\n${titles}\n\n${closing}`,
  }
}

export default function AssignTrainingCommandModal({
  staff,
  trainings,
  departments,
  positions,
  recentAssignments,
  success,
  action,
}: {
  staff: StaffOption[]
  trainings: TrainingOption[]
  departments: string[]
  positions: string[]
  recentAssignments: AssignmentSummary[]
  success?: boolean
  action: (formData: FormData) => void | Promise<void>
}) {
  const [department, setDepartment] = useState('all')
  const [position, setPosition] = useState('all')
  const [employeeId, setEmployeeId] = useState(staff[0]?.id || '')
  const [trainingQuery, setTrainingQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [startAt, setStartAt] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [mailMode, setMailMode] = useState<'alert' | 'reminder' | 'warning' | null>(success ? 'alert' : null)

  const employees = useMemo(() => staff.filter((employee) => {
    const okDepartment = department === 'all' || norm(employee.department) === norm(department)
    const okPosition = position === 'all' || norm(employee.position) === norm(position)
    return okDepartment && okPosition
  }), [staff, department, position])

  const employee = staff.find((item) => item.id === employeeId) || employees[0] || staff[0]

  const filteredTrainings = useMemo(() => trainings.filter((training) => {
    const q = norm(trainingQuery)
    const okQ = !q || [training.title, training.description, training.position, training.department, training.type].some((x) => norm(x).includes(q))
    const okDepartment = department === 'all' || !training.department || norm(training.department) === norm(department)
    const okPosition = position === 'all' || !training.position || norm(training.position) === norm(position)
    return okQ && okDepartment && okPosition
  }).slice(0, 80), [trainings, trainingQuery, department, position])

  const selectedTrainings = selectedIds.map((id) => trainings.find((training) => training.id === id)).filter(Boolean) as TrainingOption[]
  const mail = mailMode ? buildMail(mailMode, employee, selectedTrainings, startAt, dueAt) : null

  function toggleTraining(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  }

  function syncEmployeeDefaults(nextDepartment: string, nextPosition: string) {
    const nextEmployee = staff.find((employee) => (nextDepartment === 'all' || norm(employee.department) === norm(nextDepartment)) && (nextPosition === 'all' || norm(employee.position) === norm(nextPosition)))
    if (nextEmployee) setEmployeeId(nextEmployee.id)
  }

  return <div className="space-y-6">
    {success ? <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-black text-emerald-800">Assignment saved and synced</p><p className="mt-1 text-xs font-bold text-emerald-700">Use the communication controls below to generate a live French email from the assignment context.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMailMode('alert')} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-100"><Bell className="h-4 w-4" />Alert n°1</button>
          <button type="button" onClick={() => setMailMode('reminder')} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-xs font-black text-white shadow-lg shadow-amber-100"><AlertTriangle className="h-4 w-4" />Reminder</button>
          <button type="button" onClick={() => setMailMode('warning')} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-rose-100"><ShieldAlert className="h-4 w-4" />Warning</button>
        </div>
      </div>
    </div> : null}

    <form action={action} className="grid gap-6 xl:grid-cols-[0.95fr_1.2fr_0.9fr]">
      <input type="hidden" name="staff_id" value={employee?.id || ''} />
      <input type="hidden" name="staff_name" value={employee?.name || ''} />
      <input type="hidden" name="staff_email" value={employee?.email || ''} />
      <input type="hidden" name="employee_position" value={employee?.position || position} />
      <input type="hidden" name="employee_department" value={employee?.department || department} />
      {selectedTrainings.map((training) => <span key={`hidden-${training.id}`}>
        <input type="hidden" name="training_ids" value={training.id} />
        <input type="hidden" name="training_titles" value={training.title} />
      </span>)}

      <section className="space-y-5">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Live filters</p>
          <div className="mt-4 grid gap-4">
            <label><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Department</span><select name="department" value={department} onChange={(e) => { setDepartment(e.target.value); syncEmployeeDefaults(e.target.value, position) }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"><option value="all">All departments</option>{departments.map((item) => <option key={`department-${item}`} value={item}>{item}</option>)}</select></label>
            <label><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Position</span><select name="position_title" value={position} onChange={(e) => { setPosition(e.target.value); syncEmployeeDefaults(department, e.target.value) }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"><option value="all">All positions</option>{positions.map((item) => <option key={`position-${item}`} value={item}>{item}</option>)}</select></label>
            <label><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Employee</span><select name="employee_selector" value={employee?.id || ''} onChange={(e) => setEmployeeId(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none">{employees.map((item) => <option key={`employee-${item.id}`} value={item.id}>{item.name} — {item.position || 'No position'}</option>)}</select></label>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white shadow-2xl shadow-slate-200">
          <div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-xl font-black ring-1 ring-white/10">{initial(employee?.name || '')}</div><div className="min-w-0"><p className="truncate text-2xl font-black">{employee?.name || 'Select employee'}</p><p className="mt-1 text-sm font-bold text-white/60">{employee?.email || 'No email'} • {employee?.phone || 'No phone'}</p></div></div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[['Department', employee?.department || '—'], ['Position', employee?.position || '—'], ['City', employee?.city || '—'], ['Status', employee?.status || 'active']].map(([label, value]) => <div key={`employee-card-${label}`} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">{label}</p><p className="mt-1 truncate text-sm font-black text-white">{value}</p></div>)}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Schedule</p>
          <div className="mt-4 grid gap-4">
            <label><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Start date and time</span><input name="start_at" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" /></label>
            <label><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Due date and time</span><input name="due_at" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" /></label>
            <label><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Priority</span><select name="priority" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none"><option>mandatory</option><option>normal</option><option>high</option><option>urgent</option><option>compliance</option></select></label>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Training courses</p><h4 className="mt-1 text-2xl font-black text-slate-950">Select one or multiple trainings</h4></div><div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{selectedTrainings.length} selected</div></div>
          <div className="mt-4 flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4"><BookOpenCheck className="h-4 w-4 text-slate-400" /><input value={trainingQuery} onChange={(e) => setTrainingQuery(e.target.value)} placeholder="Search live training courses, PDF, video, compliance..." className="w-full bg-transparent text-sm font-bold outline-none" /></div>
          <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
            {filteredTrainings.map((training) => {
              const selected = selectedIds.includes(training.id)
              return <button type="button" key={`training-option-${training.id}`} onClick={() => toggleTraining(training.id)} className={`text-left rounded-[24px] border p-4 transition ${selected ? 'border-violet-300 bg-violet-50 shadow-lg shadow-violet-100' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'}`}>
                <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className={`grid h-10 w-10 place-items-center rounded-2xl ${selected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{resourceIcon(training.type)}</span><div><p className="text-sm font-black text-slate-950">{training.title}</p><p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">{training.description}</p></div></div>{selected ? <CheckCircle2 className="h-5 w-5 text-violet-600" /> : <Plus className="h-5 w-5 text-slate-300" />}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em]"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">{training.type || 'course'}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">{training.priority || 'active'}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">{training.duration || '60'} min</span></div>
              </button>
            })}
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Selected training package</p>
          <div className="mt-4 space-y-3">
            {selectedTrainings.length ? selectedTrainings.map((training) => <div key={`selected-training-${training.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-black text-slate-950">{training.title}</p><p className="mt-1 text-xs font-bold text-slate-500">{training.description}</p></div><button type="button" onClick={() => toggleTraining(training.id)} className="rounded-xl bg-white p-2 text-rose-600 shadow-sm"><Trash2 className="h-4 w-4" /></button></div><div className="mt-3 flex flex-wrap gap-2">{training.pdf ? <a href={training.pdf} target="_blank" className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700">PDF</a> : null}{training.video ? <a href={training.video} target="_blank" className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">Video</a> : null}</div></div>) : <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">Select trainings to build a staff assignment package.</div>}
          </div>
          <textarea name="notes" defaultValue="Assigned from HR Training Command Center." className="mt-4 min-h-[120px] w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none" />
          <button disabled={!employee || selectedTrainings.length === 0} className="mt-4 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-violet-100 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />Assign and sync training</button>
        </div>

        {mail ? <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">French email preview</p><h4 className="mt-1 text-lg font-black text-slate-950">{mail.subject}</h4></div><Mail className="h-5 w-5 text-violet-600" /></div>
          <textarea readOnly value={mail.body} className="mt-4 min-h-[360px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800 outline-none" />
          <p className="mt-3 text-xs font-bold text-slate-500">Ready to copy/paste. Content is generated from selected staff, training package, start date and due date.</p>
        </div> : <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Recent live assignments</p><div className="mt-4 space-y-3">{recentAssignments.slice(0, 5).map((assignment) => <div key={`recent-assignment-${assignment.id}`} className="rounded-2xl bg-slate-50 p-3"><p className="text-sm font-black text-slate-950">{assignment.training}</p><p className="mt-1 text-xs font-bold text-slate-500">{assignment.staff} • {assignment.status} • {assignment.progress}%</p></div>)}</div></div>}
      </aside>
    </form>
  </div>
}
