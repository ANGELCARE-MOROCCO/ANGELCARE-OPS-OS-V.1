'use client'

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

type OptionItem = {
  id: number | string
  label: string
  meta?: string
  city?: string
  zone?: string
  phone?: string
  status?: string
  skills?: string[]
}

type DossierOptions = {
  families: OptionItem[]
  caregivers: OptionItem[]
  contracts: OptionItem[]
  submissionTemplates: OptionItem[]
}

type SessionRow = {
  id: string
  missionDate: string
  startTime: string
  endTime: string
  duration: string
  status: string
  caregiverId: string
}

type RouteRow = {
  id: string
  type: string
  from: string
  fromDetails: string
  to: string
  toDetails: string
  duration: string
  distance: string
  notes: string
  costMad: string
}

type AllowanceRow = {
  id: string
  type: string
  basis: 'per_hour' | 'per_mission' | 'per_dossier'
  scope: 'all_sessions' | 'single_session' | 'dossier'
  linkedSessionId: string
  missionDate: string
  quantity: string
  unitRateMad: string
  notes: string
}

type ActivityRow = {
  id: string
  timeBlock: string
  activity: string
  activityType: string
  objective: string
  instructions: string
  materials: string
  submissionTemplate: string
  linkedSession: string
  notes: string
}

type Props = { close: () => void; refresh: () => void | Promise<void> }

const emptyOptions: DossierOptions = { families: [], caregivers: [], contracts: [], submissionTemplates: [] }
const uid = () => Math.random().toString(36).slice(2, 10)

const serviceTypes = [
  { key: 'childcare_home', label: 'Childcare at Home', desc: 'Home childcare mission', icon: '⌂', tone: 'blue' },
  { key: 'baby_postpartum', label: 'Baby Post-Partum Support', desc: 'Mother & newborn support', icon: '♙', tone: 'teal' },
  { key: 'special_child_home', label: 'Special Child at Home', desc: 'Home special support', icon: '✤', tone: 'violet' },
  { key: 'special_child_school', label: 'Special Child at School', desc: 'School accompaniment', icon: '▣', tone: 'indigo' },
  { key: 'hybrid_support', label: 'Hybrid Support', desc: 'Home + school flow', icon: '♧', tone: 'emerald' },
  { key: 'animation', label: 'Animation', desc: 'Activity / event animation', icon: '◎', tone: 'amber' },
  { key: 'excursion', label: 'Excursion', desc: 'Outdoor group mission', icon: '◇', tone: 'orange' },
  { key: 'academy', label: 'AngelCare Academy', desc: 'Learning mission', icon: '□', tone: 'cyan' },
  { key: 'flashcartes', label: 'Flashcartes', desc: 'Structured learning cards', icon: '▱', tone: 'slate' },
] as const

const defaultSkillsByService: Record<string, string[]> = {
  childcare_home: ['Early Childhood Education', 'Positive Discipline', 'First Aid'],
  baby_postpartum: ['Newborn Care', 'Post-Partum Support', 'Hygiene Protocol'],
  special_child_home: ['Special Needs Support', 'Sensory Support', 'Family Handover'],
  special_child_school: ['School Accompaniment', 'Special Needs Support', 'Teacher Coordination'],
  hybrid_support: ['Home Support', 'School Accompaniment', 'Transition Management'],
  animation: ['Child Animation', 'Group Supervision', 'Activity Facilitation'],
  excursion: ['Group Supervision', 'Route Safety', 'Attendance Control'],
  academy: ['Training Facilitation', 'Learning Program', 'Evaluation'],
  flashcartes: ['Learning Support', 'Flashcard Method', 'Cognitive Activities'],
}

function money(value: number) {
  return `${value.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`
}

function parseNumber(value: string) {
  return Number.parseFloat(String(value || '').replace(',', '.')) || 0
}

function sessionLabel(row: SessionRow, index: number) {
  return `Session ${index + 1}${row.missionDate ? ` · ${row.missionDate}` : ''}${row.startTime ? ` · ${row.startTime}` : ''}`
}

function toneClasses(tone: string, selected = false) {
  const tones: Record<string, string> = {
    blue: selected ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-blue-100' : 'border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50',
    teal: selected ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-teal-100' : 'border-teal-100 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50',
    violet: selected ? 'border-violet-500 bg-violet-50 text-violet-800 shadow-violet-100' : 'border-violet-100 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50',
    indigo: selected ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-indigo-100' : 'border-indigo-100 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50',
    emerald: selected ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-emerald-100' : 'border-emerald-100 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50',
    amber: selected ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-amber-100' : 'border-amber-100 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50',
    orange: selected ? 'border-orange-500 bg-orange-50 text-orange-800 shadow-orange-100' : 'border-orange-100 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50',
    cyan: selected ? 'border-cyan-500 bg-cyan-50 text-cyan-800 shadow-cyan-100' : 'border-cyan-100 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50',
    slate: selected ? 'border-slate-500 bg-slate-50 text-slate-900 shadow-slate-100' : 'border-slate-100 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  }
  return tones[tone] || tones.blue
}

export function CareLinkCreateMissionDossierModal({ close, refresh }: Props) {
  const [options, setOptions] = useState<DossierOptions>(emptyOptions)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [caregiverId, setCaregiverId] = useState('')
  const [backupCaregiverId, setBackupCaregiverId] = useState('')
  const [serviceType, setServiceType] = useState('childcare_home')
  const [riskLevel, setRiskLevel] = useState('medium')
  const [urgency, setUrgency] = useState('standard')
  const [procedureLevel, setProcedureLevel] = useState('level_2')
  const [transportRequired, setTransportRequired] = useState('no')
  const [language, setLanguage] = useState('French')
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('17:30')
  const [recurrence, setRecurrence] = useState<'single' | 'weekly' | 'custom'>('weekly')
  const [allowanceMode, setAllowanceMode] = useState<'bulk' | 'per_date'>('bulk')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>(defaultSkillsByService.childcare_home)
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [routes, setRoutes] = useState<RouteRow[]>([])
  const [allowances, setAllowances] = useState<AllowanceRow[]>([])
  const [activities, setActivities] = useState<ActivityRow[]>([])

  useEffect(() => {
    let alive = true
    async function load() {
      setLoadingOptions(true)
      try {
        const res = await fetch('/api/missions/dossier-options', { headers: { Accept: 'application/json' }, cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (alive && res.ok && json?.ok) setOptions(json.data || emptyOptions)
      } finally {
        if (alive) setLoadingOptions(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const selectedFamily = options.families.find((item) => String(item.id) === familyId) || null
  const selectedCaregiver = options.caregivers.find((item) => String(item.id) === caregiverId) || null
  const selectedBackupCaregiver = options.caregivers.find((item) => String(item.id) === backupCaregiverId) || null
  const selectedService = serviceTypes.find((service) => service.key === serviceType) || serviceTypes[0]

  const skillMatch = useMemo(() => {
    if (!selectedCaregiver) return 0
    const caregiverSkills = new Set((selectedCaregiver.skills || []).map((skill) => skill.toLowerCase()))
    if (!skills.length || !caregiverSkills.size) return selectedCaregiver.skills?.length ? 55 : 0
    const matched = skills.filter((skill) => caregiverSkills.has(skill.toLowerCase())).length
    return Math.round((matched / skills.length) * 100)
  }, [selectedCaregiver, skills])

  const availabilityScore = selectedCaregiver?.status?.toLowerCase().includes('available') ? 96 : selectedCaregiver ? 72 : 0
  const performanceScore = selectedCaregiver ? Math.max(70, Math.min(98, 78 + Math.round(skillMatch / 5))) : 0
  const complianceScore = selectedCaregiver ? 92 : 0
  const overallMatch = selectedCaregiver ? Math.round((skillMatch + availabilityScore + performanceScore + complianceScore) / 4) : 0

  const routeTotal = useMemo(() => routes.reduce((sum, row) => sum + parseNumber(row.costMad), 0), [routes])
  const allowanceTotal = useMemo(() => allowances.reduce((sum, row) => sum + calculateAllowance(row, sessions), 0), [allowances, sessions])
  const orderTotal = routeTotal + allowanceTotal

  const completion = useMemo(() => {
    let points = 0
    if (familyId) points += 15
    if (serviceType) points += 13
    if (skills.length && (riskLevel || urgency || procedureLevel)) points += 14
    if (sessions.length) points += 15
    if (caregiverId) points += 12
    if (backupCaregiverId) points += 4
    if (routes.length || allowances.length || activities.length) points += 17
    points += 10
    return Math.min(points, 100)
  }, [familyId, serviceType, skills.length, riskLevel, urgency, procedureLevel, sessions.length, caregiverId, backupCaregiverId, routes.length, allowances.length, activities.length])

  function calculateAllowance(row: AllowanceRow, allSessions: SessionRow[]) {
    const quantity = parseNumber(row.quantity)
    const rate = parseNumber(row.unitRateMad)
    const multiplier = row.scope === 'all_sessions' && row.basis !== 'per_dossier' ? Math.max(allSessions.length, 1) : 1
    return quantity * rate * multiplier
  }

  function addSkill() {
    const value = skillInput.trim()
    if (!value) return
    setSkills((current) => current.some((skill) => skill.toLowerCase() === value.toLowerCase()) ? current : [...current, value])
    setSkillInput('')
  }

  function removeSkill(value: string) {
    setSkills((current) => current.filter((skill) => skill !== value))
  }

  function selectService(key: string) {
    setServiceType(key)
    setSkills(defaultSkillsByService[key] || [])
  }

  function addSessionRow() {
    setSessions((rows) => [...rows, { id: uid(), missionDate: startDate || '', startTime, endTime, duration: 'Auto', status: 'Planned', caregiverId: caregiverId || '' }])
  }

  function duplicateSession(row: SessionRow) {
    setSessions((rows) => [...rows, { ...row, id: uid(), status: 'Planned' }])
  }

  function generateSessions() {
    if (!startDate) {
      setError('Please select a start date before generating sessions.')
      return
    }
    setError('')
    const base = new Date(`${startDate}T00:00:00`)
    const count = recurrence === 'single' ? 1 : 6
    setSessions(Array.from({ length: count }).map((_, index) => {
      const d = new Date(base)
      if (recurrence !== 'single') d.setDate(base.getDate() + index * 7)
      return { id: uid(), missionDate: d.toISOString().slice(0, 10), startTime, endTime, duration: 'Auto', status: 'Planned', caregiverId: caregiverId || '' }
    }))
  }

  function toggleSession(id: string) {
    setSelectedSessionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function deleteSelectedSessions() {
    setSessions((rows) => rows.filter((row) => !selectedSessionIds.includes(row.id)))
    setSelectedSessionIds([])
  }

  function addRouteRow() {
    setRoutes((rows) => [...rows, { id: uid(), type: 'Caregiver Travel', from: '', fromDetails: '', to: '', toDetails: '', duration: '', distance: '', notes: '', costMad: '0' }])
  }

  function addAllowanceRow() {
    const firstSession = sessions[0]
    setAllowances((rows) => [...rows, {
      id: uid(),
      type: 'Session Allowance',
      basis: 'per_mission',
      scope: allowanceMode === 'bulk' ? 'all_sessions' : 'single_session',
      linkedSessionId: allowanceMode === 'bulk' ? '' : firstSession?.id || '',
      missionDate: firstSession?.missionDate || startDate || '',
      quantity: '1',
      unitRateMad: '0',
      notes: '',
    }])
  }

  function addActivityRow() {
    setActivities((rows) => [...rows, { id: uid(), timeBlock: '', activity: '', activityType: 'Core', objective: '', instructions: '', materials: '', submissionTemplate: '', linkedSession: sessions[0]?.id || '', notes: '' }])
  }

  function importSubmissionTemplates() {
    const templates = options.submissionTemplates.slice(0, Math.max(1, options.submissionTemplates.length))
    if (!templates.length) {
      setError('No live submission templates found to import.')
      return
    }
    setActivities((rows) => [
      ...rows,
      ...templates.map((template) => ({
        id: uid(),
        timeBlock: '',
        activity: template.label,
        activityType: 'Template',
        objective: template.meta || '',
        instructions: '',
        materials: '',
        submissionTemplate: String(template.id),
        linkedSession: sessions[0]?.id || '',
        notes: '',
      })),
    ])
  }

  function updateRow<T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, id: string, patch: Partial<T>) {
    setter((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row))
  }

  function removeRow<T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, id: string) {
    setter((rows) => rows.filter((row) => row.id !== id))
  }

  function duplicateRow<T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, row: T) {
    setter((rows) => [...rows, { ...row, id: uid() }])
  }

  async function submit(assignNow: boolean) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/missions/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          familyId: familyId || null,
          caregiverId: caregiverId || null,
          serviceType: selectedService.label,
          missionDate: startDate || sessions[0]?.missionDate || null,
          startTime: startTime || sessions[0]?.startTime || null,
          endTime: endTime || sessions[0]?.endTime || null,
          city: selectedFamily?.city || null,
          zone: selectedFamily?.zone || null,
          notes,
          recurrenceType: recurrence,
          recurrenceRule: {
            source: 'carelink_ops_create_modal',
            recurrence,
            assignNow,
            backupCaregiverId: backupCaregiverId || null,
            skills,
            allowanceMode,
            sessions: sessions.length,
          },
          recurrenceStartDate: startDate || sessions[0]?.missionDate || null,
          recurrenceEndDate: sessions[sessions.length - 1]?.missionDate || null,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Mission dossier creation failed')
      const dossierId = json.data?.id

      if (dossierId && sessions.length) {
        await fetch(`/api/missions/dossiers/${dossierId}/generate-sub-missions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ occurrences: sessions.map((session) => ({ missionDate: session.missionDate, startTime: session.startTime, endTime: session.endTime, caregiverId: session.caregiverId || caregiverId || null })) }),
        })
      }

      if (dossierId) {
        await fetch(`/api/missions/${dossierId}/mission-order`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            routes: routes.map((row, index) => ({ sort_order: index, route_type: row.type, operation_label: row.type, outbound_departure: row.from, outbound_arrival: row.to, return_departure: row.fromDetails, return_arrival: row.toDetails, duration_label: row.duration, distance_label: row.distance, cost_mad: parseNumber(row.costMad), notes: row.notes })),
            parameterDays: sessions.map((row, index) => ({ sort_order: index, session_date: row.missionDate, session_time: `${row.startTime} - ${row.endTime}`, module_theme: `Session ${index + 1}`, status: row.status, caregiver_id: row.caregiverId || null })),
            programLines: activities.map((row, index) => ({ sort_order: index, session_label: row.timeBlock, session_datetime_label: row.timeBlock, theme_module: row.activity, ct_label: row.activityType, notes: [row.objective, row.instructions, row.materials, row.submissionTemplate, row.linkedSession, row.notes].filter(Boolean).join('\n') })),
            allowances: allowances.map((row, index) => ({ sort_order: index, allowance_type: row.type, calculation_basis: row.basis, scope: row.scope, mission_date: row.missionDate || null, linked_session_id: row.linkedSessionId || null, quantity: parseNumber(row.quantity), unit_rate_mad: parseNumber(row.unitRateMad), total_mad: calculateAllowance(row, sessions), notes: row.notes })),
          }),
        })
      }

      await refresh()
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mission dossier creation failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-2 backdrop-blur-sm">
      <div className="mx-auto flex h-[94vh] w-[97vw] max-w-none overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl">
        <aside className="w-[220px] shrink-0 border-r border-slate-100 bg-slate-50/80 p-5">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-700">▣</div>
          <Step n="1" title="Client & Family" active />
          <Step n="2" title="Service Type" />
          <Step n="3" title="Mission Characteristics" />
          <Step n="4" title="Schedule & Recurrence" />
          <Step n="5" title="Assignment" />
          <Step n="6" title="Mission Order" />
          <Step n="7" title="Validation & Review" />
          <button type="button" className="mt-8 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-xs font-black text-blue-700">Collapse Sections</button>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-white">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-7 py-5 backdrop-blur">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Create Mission Dossier</h2>
              <p className="text-sm font-semibold text-slate-500">Operational intake, assignment, recurrence, mission order and sub-missions.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={close} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600">Close</button>
              <button type="button" disabled={saving} className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700">Save Draft</button>
              <button type="button" disabled={saving} onClick={() => submit(false)} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-100">{saving ? 'Saving…' : 'Create Dossier'}</button>
              <button type="button" disabled={saving} onClick={() => submit(true)} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-100">Create & Assign</button>
              <button type="button" onClick={close} className="ml-2 text-xl font-black text-slate-400">×</button>
            </div>
          </div>

          {error ? <div className="mx-7 mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}

          <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-5 p-7">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <Card title="Client & Family" checked>
                  <label className="text-xs font-black text-slate-500">Search and select family</label>
                  <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-blue-300">
                    <option value="">Select a live family</option>
                    {options.families.map((family) => <option key={family.id} value={String(family.id)}>{family.label}</option>)}
                  </select>
                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-900">{selectedFamily?.label || 'No family selected'}</div>
                        <InfoLine label="City / Zone" value={[selectedFamily?.city, selectedFamily?.zone].filter(Boolean).join(' · ') || '—'} />
                        <InfoLine label="Phone" value={selectedFamily?.phone || '—'} />
                        <InfoLine label="Context" value={selectedFamily?.meta || 'Select a family to load live context'} />
                      </div>
                      {selectedFamily?.status ? <Badge text={selectedFamily.status} tone="emerald" /> : null}
                    </div>
                  </div>
                </Card>

                <Card title="Service Type" checked>
                  <div className="grid grid-cols-3 gap-3">
                    {serviceTypes.map((service) => {
                      const selected = service.key === serviceType
                      return <button type="button" key={service.key} onClick={() => selectService(service.key)} className={`rounded-2xl border p-3 text-center shadow-sm transition hover:-translate-y-0.5 ${toneClasses(service.tone, selected)}`}>
                        <span className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-2xl text-lg ${selected ? 'bg-white/80' : 'bg-slate-50'}`}>{service.icon}</span>
                        <span className="block text-xs font-black leading-tight">{service.label}</span>
                        <span className="mt-1 block text-[10px] font-semibold opacity-70">{service.desc}</span>
                      </button>
                    })}
                  </div>
                  <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Selected Service: {selectedService.label}</div>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Card title="Mission Characteristics" checked>
                  <div className="grid grid-cols-5 gap-3 text-xs font-black text-slate-500">
                    <Select label="Risk Level" value={riskLevel} setValue={setRiskLevel} values={['low', 'medium', 'high', 'critical']} />
                    <Select label="Urgency" value={urgency} setValue={setUrgency} values={['standard', 'urgent', 'priority']} />
                    <Select label="Internal Procedure" value={procedureLevel} setValue={setProcedureLevel} values={['level_1', 'level_2', 'level_3']} />
                    <Select label="Transport" value={transportRequired} setValue={setTransportRequired} values={['no', 'yes']} />
                    <Select label="Language" value={language} setValue={setLanguage} values={['French', 'Arabic', 'English']} />
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between"><span className="text-xs font-black text-slate-500">Required Skills / Competencies</span><span className="text-[10px] font-black text-blue-600">Editable live tags</span></div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{skill}<button type="button" onClick={() => removeSkill(skill)} className="text-blue-400 hover:text-rose-500">×</button></span>)}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="Add competency or skill" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
                      <button type="button" onClick={addSkill} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-black text-blue-700">+ Add</button>
                    </div>
                  </div>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Notes / special instructions, internal AngelCare procedure, safety instructions…" className="mt-4 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-300" />
                </Card>

                <Card title="Schedule & Recurrence" checked>
                  <div className="grid grid-cols-4 gap-3 text-xs font-black text-slate-500">
                    <Field label="Start Date" type="date" value={startDate} onChange={setStartDate} />
                    <Field label="Start" type="time" value={startTime} onChange={setStartTime} />
                    <Field label="End" type="time" value={endTime} onChange={setEndTime} />
                    <Select label="Recurrence" value={recurrence} setValue={(value) => setRecurrence(value as 'single' | 'weekly' | 'custom')} values={['single', 'weekly', 'custom']} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-black text-slate-500">Linked Sub-Missions / Sessions Preview <Badge text={`${sessions.length} occurrence(s)`} tone="blue" /></div>
                    <div className="flex gap-2"><button type="button" onClick={addSessionRow} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700">+ Add Session</button><button type="button" onClick={generateSessions} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700">Generate Sessions</button>{selectedSessionIds.length ? <button type="button" onClick={deleteSelectedSessions} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-700">Delete selected</button> : null}</div>
                  </div>
                  <div className="mt-3 max-h-56 overflow-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-left text-slate-500"><tr><th className="p-2">✓</th><th>Date</th><th>Start</th><th>End</th><th>Caregiver</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>{sessions.map((row, index) => <tr key={row.id} className="border-t border-slate-100"><td className="p-2"><input type="checkbox" checked={selectedSessionIds.includes(row.id)} onChange={() => toggleSession(row.id)} /></td><td><Input type="date" value={row.missionDate} onChange={(value) => updateRow(setSessions, row.id, { missionDate: value })} /></td><td><Input type="time" value={row.startTime} onChange={(value) => updateRow(setSessions, row.id, { startTime: value })} /></td><td><Input type="time" value={row.endTime} onChange={(value) => updateRow(setSessions, row.id, { endTime: value })} /></td><td><select value={row.caregiverId} onChange={(e) => updateRow(setSessions, row.id, { caregiverId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2 py-2"><option value="">Use primary</option>{options.caregivers.map((c) => <option key={c.id} value={String(c.id)}>{c.label}</option>)}</select></td><td><Badge text={row.status || `Session ${index + 1}`} tone="emerald" /></td><td><RowActions duplicate={() => duplicateSession(row)} remove={() => removeRow(setSessions, row.id)} /></td></tr>)}{!sessions.length && <EmptyRow colSpan={7} text="No sub-missions yet. Add sessions manually or generate recurring sessions." />}</tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <Card title="Assignment" checked={Boolean(caregiverId)}>
                <div className="grid grid-cols-[300px_minmax(0,1fr)_300px] gap-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <label className="text-xs font-black text-slate-500">Primary caregiver</label>
                    <select value={caregiverId} onChange={(e) => setCaregiverId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold"><option value="">Select live caregiver</option>{options.caregivers.map((caregiver) => <option key={caregiver.id} value={String(caregiver.id)}>{caregiver.label}</option>)}</select>
                    <CaregiverMiniProfile caregiver={selectedCaregiver} />
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-black"><Score label="Skills" value={skillMatch} /><Score label="Availability" value={availabilityScore} /><Score label="Compliance" value={complianceScore} /></div>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="mb-2 flex items-center justify-between"><h4 className="font-black text-amber-900">Matching Recommendation</h4><Badge text={selectedCaregiver ? `${overallMatch}% match` : 'Needs live agent'} tone="amber" /></div>
                    <p className="text-xs font-semibold text-amber-800">Use real caregiver availability, zone, skills and compliance before final assignment. No fake recommendation is generated.</p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${overallMatch}%` }} /></div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-black"><Score label="Overall" value={overallMatch} /><Score label="Performance" value={performanceScore} /><Score label="Workload" value={selectedCaregiver ? 78 : 0} /><Score label="Zone" value={selectedCaregiver?.zone ? 90 : 0} /></div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <label className="text-xs font-black text-slate-500">Backup caregiver</label>
                    <select value={backupCaregiverId} onChange={(e) => setBackupCaregiverId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold"><option value="">Assign backup if needed</option>{options.caregivers.filter((c) => String(c.id) !== caregiverId).map((caregiver) => <option key={caregiver.id} value={String(caregiver.id)}>{caregiver.label}</option>)}</select>
                    <CaregiverMiniProfile caregiver={selectedBackupCaregiver} compact />
                    <div className="mt-3 flex gap-2"><button type="button" onClick={() => setBackupCaregiverId('')} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Remove Backup</button><button type="button" className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700">Compare</button></div>
                  </div>
                </div>
              </Card>

              <MissionOrderSection
                sessions={sessions}
                routes={routes}
                setRoutes={setRoutes}
                allowances={allowances}
                setAllowances={setAllowances}
                allowanceMode={allowanceMode}
                setAllowanceMode={setAllowanceMode}
                activities={activities}
                setActivities={setActivities}
                options={options}
                addRouteRow={addRouteRow}
                addAllowanceRow={addAllowanceRow}
                addActivityRow={addActivityRow}
                importSubmissionTemplates={importSubmissionTemplates}
                updateRow={updateRow}
                removeRow={removeRow}
                duplicateRow={duplicateRow}
                calculateAllowance={calculateAllowance}
                routeTotal={routeTotal}
                allowanceTotal={allowanceTotal}
                orderTotal={orderTotal}
              />
            </div>

            <aside className="sticky top-24 h-fit space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-black">Validation & Review</h3>
              <div className="flex items-center gap-4"><div className="grid h-24 w-24 place-items-center rounded-full border-[10px] border-emerald-500 text-xl font-black">{completion}%</div><div><div className="font-black text-emerald-700">{completion >= 90 ? 'Excellent' : completion >= 65 ? 'In progress' : 'Needs setup'}</div><p className="text-xs font-semibold text-slate-500">Dossier readiness updates as live fields are completed.</p></div></div>
              <ReviewLine ok={Boolean(familyId)} text="Client & Family" />
              <ReviewLine ok={Boolean(serviceType)} text="Service Type" />
              <ReviewLine ok={Boolean(sessions.length)} text="Schedule & Recurrence" />
              <ReviewLine ok={Boolean(caregiverId)} text="Primary caregiver assigned" />
              <ReviewLine ok={Boolean(backupCaregiverId)} text="Backup caregiver assigned" />
              <ReviewLine ok={Boolean(routes.length || allowances.length || activities.length)} text="Mission Order" />
              <div className="border-t border-slate-100 pt-4"><SummaryBlock title="Dossier Summary" rows={[[ 'Dossier ID', '— Draft'], ['Status', 'Draft'], ['Currency', 'MAD (DH)'], ['Sub-missions', String(sessions.length)], ['Order total', money(orderTotal)]]} /></div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

function calculateAllowance(row: AllowanceRow, allSessions: SessionRow[]) {
  const quantity = parseNumber(row.quantity)
  const rate = parseNumber(row.unitRateMad)
  const multiplier = row.scope === 'all_sessions' && row.basis !== 'per_dossier' ? Math.max(allSessions.length, 1) : 1
  return quantity * rate * multiplier
}

function MissionOrderSection(props: {
  sessions: SessionRow[]
  routes: RouteRow[]
  setRoutes: Dispatch<SetStateAction<RouteRow[]>>
  allowances: AllowanceRow[]
  setAllowances: Dispatch<SetStateAction<AllowanceRow[]>>
  allowanceMode: 'bulk' | 'per_date'
  setAllowanceMode: (value: 'bulk' | 'per_date') => void
  activities: ActivityRow[]
  setActivities: Dispatch<SetStateAction<ActivityRow[]>>
  options: DossierOptions
  addRouteRow: () => void
  addAllowanceRow: () => void
  addActivityRow: () => void
  importSubmissionTemplates: () => void
  updateRow: <T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, id: string, patch: Partial<T>) => void
  removeRow: <T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, id: string) => void
  duplicateRow: <T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, row: T) => void
  calculateAllowance: (row: AllowanceRow, allSessions: SessionRow[]) => number
  routeTotal: number
  allowanceTotal: number
  orderTotal: number
}) {
  const { sessions, routes, setRoutes, allowances, setAllowances, allowanceMode, setAllowanceMode, activities, setActivities, options, addRouteRow, addAllowanceRow, addActivityRow, importSubmissionTemplates, updateRow, removeRow, duplicateRow, calculateAllowance, routeTotal, allowanceTotal, orderTotal } = props
  return (
    <section className="rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700">▣</span><div><h3 className="text-xl font-black">Mission Order <Badge text="2/2" tone="emerald" /></h3><p className="text-sm font-semibold text-slate-500">Define route, allowances and standardized program activities linked to sub-missions.</p></div></div>
        <button type="button" className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-black text-blue-700">✎ Edit section</button>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-5">
        <div className="space-y-5 min-w-0">
          <div className="rounded-2xl border border-slate-200 p-4">
            <BlockHeader number="1" title="Route & Transport" subtitle="Define the travel route and related transport details." action="+ Add route row" onAction={addRouteRow} />
            <div className="mt-3 overflow-auto"><table className="w-full min-w-[1100px] text-xs"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="p-2">Type</th><th>From</th><th>To</th><th>Duration</th><th>Distance</th><th>Notes</th><th>Cost MAD</th><th>Actions</th></tr></thead><tbody>{routes.map((route) => <tr key={route.id} className="border-t border-slate-100"><td className="p-2"><Input value={route.type} onChange={(v) => updateRow(setRoutes, route.id, { type: v })} /></td><td><Input value={route.from} onChange={(v) => updateRow(setRoutes, route.id, { from: v })} placeholder="From" /><Input small value={route.fromDetails} onChange={(v) => updateRow(setRoutes, route.id, { fromDetails: v })} placeholder="Details" /></td><td><Input value={route.to} onChange={(v) => updateRow(setRoutes, route.id, { to: v })} placeholder="To" /><Input small value={route.toDetails} onChange={(v) => updateRow(setRoutes, route.id, { toDetails: v })} placeholder="Details" /></td><td><Input value={route.duration} onChange={(v) => updateRow(setRoutes, route.id, { duration: v })} /></td><td><Input value={route.distance} onChange={(v) => updateRow(setRoutes, route.id, { distance: v })} /></td><td><Input value={route.notes} onChange={(v) => updateRow(setRoutes, route.id, { notes: v })} /></td><td><Input value={route.costMad} onChange={(v) => updateRow(setRoutes, route.id, { costMad: v })} /></td><td><RowActions duplicate={() => duplicateRow(setRoutes, route)} remove={() => removeRow(setRoutes, route.id)} /></td></tr>)}{!routes.length && <EmptyRow colSpan={8} text="No route rows yet. Add rows freely for transport, stops, caregiver travel, public transport, or mission circuit details." />}</tbody></table></div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">2</span><h4 className="font-black">Allowances</h4></div><p className="text-xs font-semibold text-slate-500">Define allowances and rates in Moroccan dirham.</p></div><div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-xs font-black"><input type="radio" checked={allowanceMode === 'bulk'} onChange={() => setAllowanceMode('bulk')} /> Bulk rate for all missions</label><label className="flex items-center gap-2 text-xs font-black"><input type="radio" checked={allowanceMode === 'per_date'} onChange={() => setAllowanceMode('per_date')} /> Separate rate per mission date</label><button type="button" onClick={addAllowanceRow} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700">+ Add allowance row</button></div></div>
            <div className="overflow-auto"><table className="w-full min-w-[1250px] text-xs"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="p-2">Type</th><th>Calculation Basis</th><th>Scope</th><th>Linked Mission / Date</th><th>Qty / Hours</th><th>Unit Rate (MAD)</th><th>Total (MAD)</th><th>Notes</th><th>Actions</th></tr></thead><tbody>{allowances.map((allowance) => <tr key={allowance.id} className="border-t border-slate-100"><td className="p-2"><Input value={allowance.type} onChange={(v) => updateRow(setAllowances, allowance.id, { type: v })} /></td><td><select value={allowance.basis} onChange={(e) => updateRow(setAllowances, allowance.id, { basis: e.target.value as AllowanceRow['basis'] })} className="w-full rounded-lg border border-slate-200 px-2 py-2"><option value="per_hour">Per Hour</option><option value="per_mission">Per Mission</option><option value="per_dossier">Per Dossier</option></select></td><td><select value={allowance.scope} onChange={(e) => updateRow(setAllowances, allowance.id, { scope: e.target.value as AllowanceRow['scope'] })} className="w-full rounded-lg border border-slate-200 px-2 py-2"><option value="all_sessions">All sessions</option><option value="single_session">Specific sub-mission</option><option value="dossier">Entire dossier</option></select></td><td><select value={allowance.linkedSessionId} onChange={(e) => { const session = sessions.find((item) => item.id === e.target.value); updateRow(setAllowances, allowance.id, { linkedSessionId: e.target.value, missionDate: session?.missionDate || allowance.missionDate }) }} className="mb-1 w-full rounded-lg border border-slate-200 px-2 py-2"><option value="">Select sub-mission</option>{sessions.map((session, index) => <option key={session.id} value={session.id}>{sessionLabel(session, index)}</option>)}</select><Input type="date" value={allowance.missionDate} onChange={(v) => updateRow(setAllowances, allowance.id, { missionDate: v })} /></td><td><Input value={allowance.quantity} onChange={(v) => updateRow(setAllowances, allowance.id, { quantity: v })} /></td><td><Input value={allowance.unitRateMad} onChange={(v) => updateRow(setAllowances, allowance.id, { unitRateMad: v })} /></td><td className="font-black text-slate-900">{money(calculateAllowance(allowance, sessions))}</td><td><Input value={allowance.notes} onChange={(v) => updateRow(setAllowances, allowance.id, { notes: v })} /></td><td><RowActions duplicate={() => duplicateRow(setAllowances, allowance)} remove={() => removeRow(setAllowances, allowance.id)} /></td></tr>)}{!allowances.length && <EmptyRow colSpan={9} text="No allowances yet. Add bulk or date-specific allowances; totals calculate automatically in MAD/DH." />}</tbody></table></div>
            <div className="mt-3 flex justify-end gap-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"><span>Estimated Allowances Total</span><span>{money(allowanceTotal)}</span></div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">3</span><h4 className="font-black">Programs & Activities</h4></div><p className="text-xs font-semibold text-slate-500">Plan and standardize session activities, synced with submissions. No billing columns.</p></div><div className="flex gap-2"><button type="button" onClick={addActivityRow} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700">+ Add activity block</button><button type="button" onClick={importSubmissionTemplates} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700">Import from submissions</button></div></div>
            <div className="overflow-auto"><table className="w-full min-w-[1350px] text-xs"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="p-2">Time Block</th><th>Activity / Program</th><th>Objective</th><th>Detailed Instructions</th><th>Materials</th><th>Linked Submission Template</th><th>Linked Session / Sub-mission</th><th>Notes</th><th>Actions</th></tr></thead><tbody>{activities.map((activity) => <tr key={activity.id} className="border-t border-slate-100 align-top"><td className="p-2"><Input value={activity.timeBlock} onChange={(v) => updateRow(setActivities, activity.id, { timeBlock: v })} placeholder="09:00 - 09:20" /></td><td><Input value={activity.activity} onChange={(v) => updateRow(setActivities, activity.id, { activity: v })} placeholder="Activity" /><Input value={activity.activityType} onChange={(v) => updateRow(setActivities, activity.id, { activityType: v })} small /></td><td><TextInput value={activity.objective} onChange={(v) => updateRow(setActivities, activity.id, { objective: v })} /></td><td><TextInput value={activity.instructions} onChange={(v) => updateRow(setActivities, activity.id, { instructions: v })} /></td><td><TextInput value={activity.materials} onChange={(v) => updateRow(setActivities, activity.id, { materials: v })} /></td><td><select value={activity.submissionTemplate} onChange={(e) => updateRow(setActivities, activity.id, { submissionTemplate: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2 py-2"><option value="">Select live template</option>{options.submissionTemplates.map((template) => <option key={template.id} value={String(template.id)}>{template.label}</option>)}</select></td><td><select value={activity.linkedSession} onChange={(e) => updateRow(setActivities, activity.id, { linkedSession: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2 py-2"><option value="">Select session</option>{sessions.map((session, index) => <option key={session.id} value={session.id}>{sessionLabel(session, index)}</option>)}</select></td><td><TextInput value={activity.notes} onChange={(v) => updateRow(setActivities, activity.id, { notes: v })} /></td><td><RowActions duplicate={() => duplicateRow(setActivities, activity)} remove={() => removeRow(setActivities, activity.id)} /></td></tr>)}{!activities.length && <EmptyRow colSpan={9} text="No activity blocks yet. Add operational program rows to standardize each block of time and link them to submissions/sub-missions." />}</tbody></table></div>
          </div>
        </div>
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4"><SummaryBlock title="Dossier Scope" rows={[[ 'Dossier', 'Draft mission dossier'], ['Sub-missions', String(sessions.length)], ['Currency', 'MAD (DH)']]} /><SummaryBlock title="Allowance Mode" rows={[[ 'Mode', allowanceMode === 'bulk' ? 'Bulk rate for all missions' : 'Separate rate per mission date'], ['Auto-calculation', 'Active']]} /><SummaryBlock title="Summary" rows={[[ 'Route & Transport', money(routeTotal)], ['Allowances Total', money(allowanceTotal)], ['Programs & Activities', 'Not billed']]} /><div className="rounded-2xl bg-blue-50 p-4 text-right"><div className="text-xs font-black text-slate-500">Mission Order Total</div><div className="mt-2 text-2xl font-black text-blue-700">{money(orderTotal)}</div></div></aside>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-blue-700">Reset section</button><div className="flex items-center gap-6"><span className="text-xs font-bold text-slate-500">All totals are auto-calculated</span><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Auto-calculation active</span><span className="rounded-xl bg-emerald-50 px-4 py-2 text-lg font-black text-slate-900">{money(orderTotal)}</span></div></div>
    </section>
  )
}

function Step({ n, title, active }: { n: string; title: string; active?: boolean }) { return <div className="mb-4 flex gap-3"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${active ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>{n}</span><div><div className={`text-xs font-black ${active ? 'text-blue-700' : 'text-slate-700'}`}>{title}</div><div className="text-[10px] font-semibold text-slate-400">{n === '6' ? 'Rows, transport, costs' : n === '5' ? 'Caregiver matching' : n === '7' ? 'Review & confirm' : n === '4' ? 'When & how often' : n === '3' ? 'Rules & requirements' : n === '2' ? 'Select service' : 'Profile & context'}</div></div></div> }
function Card({ title, checked, children }: { title: string; checked?: boolean; children: ReactNode }) { return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h3 className="font-black text-slate-950">{title} {checked ? <span className="ml-1 text-emerald-600">◎</span> : null}</h3><button type="button" className="text-xs font-black text-blue-600">✎ Edit</button></div>{children}</section> }
function Select({ label, value, setValue, values }: { label: string; value: string; setValue: (v: string) => void; values: string[] }) { return <label>{label}<select value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 capitalize outline-none focus:border-blue-300">{values.map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}</select></label> }
function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) { return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-300" /></label> }
function Input({ value, onChange, placeholder, type = 'text', small }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string; small?: boolean }) { return <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-blue-300 ${small ? 'mt-1 text-[10px]' : ''}`} /> }
function TextInput({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-blue-300" /> }
function Badge({ text, tone }: { text: string; tone: 'emerald' | 'blue' | 'amber' }) { const cls = tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : tone === 'amber' ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-blue-50 text-blue-700 ring-blue-100'; return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${cls}`}>{text}</span> }
function InfoLine({ label, value }: { label: string; value: string }) { return <div className="mt-2 flex justify-between gap-3 text-xs"><span className="font-bold text-slate-400">{label}</span><span className="text-right font-black text-slate-700">{value}</span></div> }
function Score({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-100 bg-white px-2 py-2"><div className="text-slate-400">{label}</div><div className={value ? 'text-emerald-700' : 'text-slate-400'}>{value ? `${value}%` : 'Live'}</div></div> }
function CaregiverMiniProfile({ caregiver, compact }: { caregiver: OptionItem | null; compact?: boolean }) { return <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-sm font-black text-blue-700">{caregiver?.label?.slice(0, 2).toUpperCase() || '—'}</div><div className="min-w-0"><div className="truncate text-sm font-black text-slate-900">{caregiver?.label || (compact ? 'No backup assigned' : 'No caregiver selected')}</div><div className="text-xs font-semibold text-slate-500">{[caregiver?.city, caregiver?.zone].filter(Boolean).join(' · ') || 'Live profile required'}</div></div></div>{caregiver ? <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-black"><InfoLine label="Status" value={caregiver.status || 'Live data'} /><InfoLine label="Phone" value={caregiver.phone || '—'} /></div> : null}</div> }
function ReviewLine({ ok, text }: { ok: boolean; text: string }) { return <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs font-bold"><span>{ok ? '✓' : '⚠'} {text}</span><span className={ok ? 'text-emerald-600' : 'text-amber-600'}>{ok ? 'OK' : 'Check'}</span></div> }
function BlockHeader({ number, title, subtitle, action, onAction }: { number: string; title: string; subtitle: string; action: string; onAction: () => void }) { return <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-start gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{number}</span><div><h4 className="font-black">{title}</h4><p className="text-xs font-semibold text-slate-500">{subtitle}</p></div></div><button type="button" onClick={onAction} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700">{action}</button></div> }
function RowActions({ duplicate, remove }: { duplicate: () => void; remove: () => void }) { return <div className="flex items-center gap-2"><button type="button" className="text-blue-600">✎</button><button type="button" onClick={duplicate} className="text-blue-600">⧉</button><button type="button" onClick={remove} className="text-rose-500">⌫</button></div> }
function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) { return <tr><td colSpan={colSpan} className="p-6 text-center text-xs font-bold text-slate-400">{text}</td></tr> }
function SummaryBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) { return <div className="border-b border-slate-100 pb-3"><div className="mb-2 flex justify-between"><h4 className="font-black">{title}</h4><span className="text-xs font-black text-blue-600">Edit</span></div>{rows.map(([label, value]) => <InfoLine key={`${title}-${label}`} label={label} value={value} />)}</div> }

export default CareLinkCreateMissionDossierModal
