'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCopy,
  Clock3,
  Eye,
  FileText,
  GraduationCap,
  Link2,
  Mail,
  Minus,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react'

type AnyRow = Record<string, any>
type TrainingRow = AnyRow & { title?: string; position?: string; department?: string; description?: string; pdf?: string; video?: string; resource_url?: string }
type PositionRow = { id: string; name: string; department?: string; completion?: number; usersCount?: number; items?: TrainingRow[] }

type Props = {
  staff: AnyRow[]
  departments: string[]
  positions: PositionRow[]
  trainings: TrainingRow[]
}

type SavedAssignment = {
  employeeName: string
  employeeEmail: string
  employeePosition: string
  department: string
  trainings: TrainingRow[]
  startAt: string
  dueAt: string
  priority: string
  assignmentIds: string[]
}

function s(value: unknown) { return String(value ?? '').trim() }
function n(value: unknown) { return s(value).toLowerCase() }
function first(row: AnyRow | undefined, keys: string[], fallback = '') {
  if (!row) return fallback
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && s(value)) return s(value)
  }
  return fallback
}
function uid(row: AnyRow, index = 0) { return first(row, ['id','user_id','profile_id','staff_id','email'], String(index)) }
function titleOf(training: TrainingRow) { return first(training, ['title','training_title','name'], 'Training resource') }
function descOf(training: TrainingRow) { return first(training, ['description','notes','summary'], 'Ressource de formation liée au poste et synchronisée avec le référentiel RH.') }
function urlOf(training: TrainingRow) { return first(training, ['resource_url','pdf','pdf_url','video','video_url','link'], '') }
function dateLabel(value: string) {
  if (!value) return '—'
  try { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) } catch { return value }
}
function todayLocalInput(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function emailText(kind: 'alert' | 'reminder' | 'warning', saved: SavedAssignment) {
  const trainings = saved.trainings.map((t, i) => `${i + 1}. ${titleOf(t)}${descOf(t) ? ` — ${descOf(t)}` : ''}${urlOf(t) ? `\n   Ressource: ${urlOf(t)}` : ''}`).join('\n')
  const intro = kind === 'alert'
    ? `Nous vous informons que les formations ci-dessous vous ont été officiellement assignées dans le cadre du plan de développement et de conformité AngelCare.`
    : kind === 'reminder'
      ? `Nous vous rappelons formellement que les formations ci-dessous sont obligatoires et doivent être traitées dans les délais indiqués.`
      : `Nous constatons que les obligations de formation ci-dessous nécessitent une régularisation immédiate. À défaut de justification et de progression rapide, un entretien de justification en face à face avec le manager pourra être planifié.`
  const toneClose = kind === 'alert'
    ? `Merci de prendre connaissance des ressources et de démarrer le parcours dans les meilleurs délais.`
    : kind === 'reminder'
      ? `Merci de confirmer la prise en charge de ces formations et de respecter strictement l’échéance indiquée.`
      : `Merci de préparer vos justificatifs et de confirmer votre disponibilité pour un échange managérial si nécessaire.`
  return `Objet : ${kind === 'alert' ? 'Affectation de formation AngelCare' : kind === 'reminder' ? 'Rappel obligatoire – Formation AngelCare' : 'Avertissement – Obligation de formation non régularisée'}\n\nBonjour ${saved.employeeName},\n\n${intro}\n\nCollaborateur : ${saved.employeeName}\nPoste : ${saved.employeePosition || '—'}\nDépartement : ${saved.department || '—'}\nDate de démarrage : ${dateLabel(saved.startAt)}\nDate limite : ${dateLabel(saved.dueAt)}\nPriorité : ${saved.priority}\n\nFormations assignées :\n${trainings}\n\n${toneClose}\n\nCordialement,\nDirection RH AngelCare`
}

export default function AssignTrainingEnterpriseModal({ staff, departments, positions, trainings }: Props) {
  const [department, setDepartment] = useState('all')
  const [position, setPosition] = useState('all')
  const [employeeId, setEmployeeId] = useState('')
  const [trainingQuery, setTrainingQuery] = useState('')
  const [selectedTrainingKeys, setSelectedTrainingKeys] = useState<string[]>([])
  const [startAt, setStartAt] = useState(todayLocalInput(0))
  const [dueAt, setDueAt] = useState(todayLocalInput(14))
  const [priority, setPriority] = useState('mandatory')
  const [notes, setNotes] = useState('Formation assignée depuis le centre RH Learning & Development.')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<SavedAssignment | null>(null)
  const [emailKind, setEmailKind] = useState<'alert' | 'reminder' | 'warning' | null>(null)

  const normalizedStaff = useMemo(() => staff.map((row, index) => ({
    id: uid(row, index),
    name: first(row, ['full_name','name','display_name','employee_name','staff_name','email'], 'Staff member'),
    email: first(row, ['email','work_email'], ''),
    department: first(row, ['department','department_name'], 'Unassigned'),
    position: first(row, ['position','role','job_title','position_title'], 'Unassigned'),
    status: first(row, ['status','employment_status'], 'active'),
    phone: first(row, ['phone','mobile','phone_number'], ''),
    raw: row,
  })), [staff])

  const positionNames = useMemo(() => Array.from(new Set(positions.map((p) => p.name).filter(Boolean))).sort(), [positions])
  const deptOptions = useMemo(() => Array.from(new Set([...departments, ...normalizedStaff.map((s) => s.department)].filter(Boolean))).sort(), [departments, normalizedStaff])

  const filteredEmployees = useMemo(() => normalizedStaff.filter((employee) => {
    return (department === 'all' || n(employee.department) === n(department)) && (position === 'all' || n(employee.position) === n(position))
  }), [normalizedStaff, department, position])

  const selectedEmployee = normalizedStaff.find((employee) => employee.id === employeeId) || filteredEmployees[0] || normalizedStaff[0]

  const trainingList = useMemo(() => {
    const rows = trainings.filter((training) => {
      const text = [titleOf(training), descOf(training), first(training, ['position'], ''), first(training, ['department'], ''), first(training, ['type','priority','source'], '')].join(' ').toLowerCase()
      const matchesQuery = !trainingQuery || text.includes(trainingQuery.toLowerCase())
      const matchesPosition = position === 'all' || n(first(training, ['position','position_title'], '')) === n(position) || n(titleOf(training)).includes(n(position))
      const matchesDepartment = department === 'all' || n(first(training, ['department'], '')) === n(department)
      return matchesQuery && matchesPosition && matchesDepartment
    })
    return rows.length ? rows : trainings.slice(0, 80)
  }, [trainings, trainingQuery, position, department])

  const selectedTrainings = selectedTrainingKeys.map((key) => trainings.find((training, index) => `${first(training, ['id'], '') || index}-${titleOf(training)}` === key)).filter(Boolean) as TrainingRow[]

  function toggleTraining(training: TrainingRow, index: number) {
    const key = `${first(training, ['id'], '') || index}-${titleOf(training)}`
    setSelectedTrainingKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  async function assign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSaved(null)
    if (!selectedEmployee) { setError('Veuillez sélectionner un employé.'); return }
    if (!selectedTrainings.length) { setError('Veuillez sélectionner au moins une formation.'); return }
    setBusy(true)
    try {
      const payload = {
        employee: selectedEmployee,
        staff_id: selectedEmployee.id,
        staff_name: selectedEmployee.name,
        staff_email: selectedEmployee.email,
        position_title: selectedEmployee.position || position,
        department: selectedEmployee.department || department,
        priority,
        start_at: startAt,
        due_at: dueAt,
        notes,
        trainings: selectedTrainings.map((training) => ({
          id: first(training, ['id'], ''),
          title: titleOf(training),
          description: descOf(training),
          resource_url: urlOf(training),
          position: first(training, ['position','position_title'], selectedEmployee.position || position),
          department: first(training, ['department'], selectedEmployee.department || department),
          type: first(training, ['type','training_type','resource_type'], 'training'),
          priority: first(training, ['priority','requirement_level'], priority),
        })),
      }
      const res = await fetch('/api/hr/training/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Assignment failed')
      setSaved({
        employeeName: selectedEmployee.name,
        employeeEmail: selectedEmployee.email,
        employeePosition: selectedEmployee.position,
        department: selectedEmployee.department,
        trainings: selectedTrainings,
        startAt,
        dueAt,
        priority,
        assignmentIds: json.assignmentIds || [],
      })
      setEmailKind('alert')
      window.dispatchEvent(new CustomEvent('hr-training-assigned', { detail: json }))
    } catch (err: any) {
      setError(err?.message || 'Impossible d’assigner la formation.')
    } finally {
      setBusy(false)
    }
  }

  return <div id="modal-assign-training" className="fixed inset-0 z-[9999] hidden overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-md target:block">
    <div className="mx-auto my-6 max-w-[1500px] rounded-[38px] border border-white/40 bg-white shadow-[0_50px_180px_rgba(15,23,42,0.45)]">
      <div className="sticky top-0 z-10 rounded-t-[38px] border-b border-slate-200 bg-white/95 p-6 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700">One synced assignment modal</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Assign Training Command Center</h2>
            <p className="mt-2 max-w-4xl text-sm font-bold text-slate-600">Select live departments, positions, employees and one or multiple training resources. Save once, then generate Alert N°1, Reminder or Warning emails in French.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {saved ? <>
              <button onClick={() => setEmailKind('alert')} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg"><Bell className="h-4 w-4" />Alert N°1</button>
              <button onClick={() => setEmailKind('reminder')} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg"><Clock3 className="h-4 w-4" />Reminder</button>
              <button onClick={() => setEmailKind('warning')} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-lg"><ShieldAlert className="h-4 w-4" />Warning</button>
            </> : null}
            <a href="#" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><X className="h-4 w-4" />Close</a>
          </div>
        </div>
      </div>

      <form onSubmit={assign} className="grid gap-6 p-6 xl:grid-cols-[360px_1fr_430px]">
        <aside className="space-y-4">
          <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Users className="h-5 w-5 text-violet-600" />Live staff filters</h3>
            <div className="mt-4 grid gap-3">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Department<select value={department} onChange={(e) => { setDepartment(e.target.value); setEmployeeId('') }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800"><option value="all">All departments</option>{deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Position<select value={position} onChange={(e) => { setPosition(e.target.value); setEmployeeId('') }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800"><option value="all">All positions</option>{positionNames.map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Employee<select value={selectedEmployee?.id || ''} onChange={(e) => setEmployeeId(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800">{filteredEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — {employee.position}</option>)}</select></label>
            </div>
          </div>

          {selectedEmployee ? <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-slate-950 via-violet-950 to-blue-950 p-5 text-white">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15 text-xl font-black">{selectedEmployee.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</div>
              <p className="mt-4 text-xl font-black">{selectedEmployee.name}</p>
              <p className="text-sm font-bold text-white/70">{selectedEmployee.email || 'No email recorded'}</p>
            </div>
            <div className="grid gap-3 p-5 text-sm font-bold text-slate-600">
              <Info label="Position" value={selectedEmployee.position} icon={<BriefcaseBusiness className="h-4 w-4" />} />
              <Info label="Department" value={selectedEmployee.department} icon={<Users className="h-4 w-4" />} />
              <Info label="Status" value={selectedEmployee.status} icon={<CheckCircle2 className="h-4 w-4" />} />
              <Info label="Phone" value={selectedEmployee.phone || '—'} icon={<UserRound className="h-4 w-4" />} />
            </div>
          </div> : null}
        </aside>

        <section className="space-y-4">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-xl font-black text-slate-950">Training library selection</h3><p className="mt-1 text-sm font-bold text-slate-500">Add or remove multiple synced training resources for the selected staff member.</p></div>
              <div className="flex h-12 min-w-[280px] items-center gap-2 rounded-2xl border border-slate-200 px-4"><Search className="h-4 w-4 text-slate-400" /><input value={trainingQuery} onChange={(e) => setTrainingQuery(e.target.value)} placeholder="Search PDF, video, safety, caregiver..." className="w-full bg-transparent text-sm font-bold outline-none" /></div>
            </div>
            <div className="mt-5 grid max-h-[520px] gap-3 overflow-y-auto pr-2 lg:grid-cols-2">
              {trainingList.map((training, index) => {
                const key = `${first(training, ['id'], '') || index}-${titleOf(training)}`
                const active = selectedTrainingKeys.includes(key)
                return <button type="button" key={key} onClick={() => toggleTraining(training, index)} className={`rounded-[24px] border p-4 text-left transition ${active ? 'border-violet-300 bg-violet-50 shadow-lg shadow-violet-100' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{titleOf(training)}</p><p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{descOf(training)}</p></div><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{active ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span></div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em]"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">{first(training, ['type','resource_type','source'], 'training')}</span><span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">{first(training, ['position'], 'all positions')}</span>{urlOf(training) ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">resource link</span> : null}</div>
                </button>
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><CalendarClock className="h-5 w-5 text-violet-600" />Assignment schedule</h3>
            <div className="mt-4 grid gap-3">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Starting date & time<input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold text-slate-800" /></label>
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Due date & time<input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold text-slate-800" /></label>
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Priority<select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold text-slate-800"><option>mandatory</option><option>normal</option><option>high</option><option>urgent</option><option>compliance</option></select></label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[110px] rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700" />
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Selected trainings</h3>
            <div className="mt-4 space-y-3">
              {selectedTrainings.length ? selectedTrainings.map((training, index) => <div key={`selected-${titleOf(training)}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-black text-slate-900">{titleOf(training)}</p><p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">{descOf(training)}</p>{urlOf(training) ? <a href={urlOf(training)} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-violet-600"><Link2 className="h-3 w-3" />Open resource</a> : null}</div><button type="button" onClick={() => setSelectedTrainingKeys((keys) => keys.filter((_, i) => i !== index))} className="rounded-xl bg-white p-2 text-rose-600"><Minus className="h-4 w-4" /></button></div></div>) : <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-500">No training selected yet.</div>}
            </div>
            {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-black text-rose-700">{error}</p> : null}
            <button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 text-sm font-black text-white shadow-xl disabled:opacity-60"><Send className="h-4 w-4" />{busy ? 'Syncing...' : 'Assign and sync training'}</button>
          </div>
        </aside>
      </form>

      {saved && emailKind ? <div className="border-t border-slate-200 bg-slate-50 p-6">
        <div className="mx-auto max-w-[1100px] rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">French email preview</p><h3 className="mt-1 text-2xl font-black text-slate-950">{emailKind === 'alert' ? 'Alert N°1' : emailKind === 'reminder' ? 'Reminder' : 'Warning'} ready to copy</h3></div><button onClick={() => navigator.clipboard?.writeText(emailText(emailKind, saved))} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><ClipboardCopy className="h-4 w-4" />Copy email</button></div>
          <pre className="mt-5 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-white">{emailText(emailKind, saved)}</pre>
        </div>
      </div> : null}
    </div>
  </div>
}

function Info({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-violet-600">{icon}</span><span><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="text-sm font-black text-slate-800">{value || '—'}</p></span></div>
}
