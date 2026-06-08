'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { AcademyCohortPayload, AcademyCohortRecord, AcademyCohortsDashboard } from '@/lib/academy-cohorts/types'

type Mode = 'create' | 'view' | 'edit'
type Props = { initialDashboard: AcademyCohortsDashboard }

const sidebar = [
  ['Command Center', '/academy'], ['Trainees', '/academy/trainees'], ['Enrollments', '/academy/enrollments'], ['Attendance', '/academy/attendance'],
  ['Payments', '/academy/payments'], ['Certificates', '/academy/certificates'], ['Trainers', '/academy/trainers'], ['Programs', '/academy/courses'],
  ['Groups / Cohorts', '/academy/cohorts'], ['Job Placement', '/academy/job-placement'], ['Partners & Employers', '/academy/partners'],
  ['Announcements', '/academy/alerts-sales'], ['Reports & Analytics', '/academy/reports'], ['Integrations', '/academy/integrations'], ['Automation', '/academy/automation'], ['Settings', '/academy/settings'],
]

const defaultChecklist = [
  { item_key: 'program_validated', label: 'Program validated', checked: false },
  { item_key: 'trainer_assigned', label: 'Trainer assigned', checked: false },
  { item_key: 'participants_confirmed', label: 'Participants confirmed', checked: false },
  { item_key: 'schedule_ready', label: 'Schedule ready', checked: false },
  { item_key: 'materials_shared', label: 'Program resources shared', checked: false },
  { item_key: 'launch_approved', label: 'Launch approved', checked: false },
  { item_key: 'attendance_rules', label: 'Attendance rules configured', checked: false },
  { item_key: 'certification_path', label: 'Certification path ready', checked: false },
]

function emptyCohort(): AcademyCohortPayload {
  return {
    reference_number: `COH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    title: '', program_id: '', program_title: '', trainer_id: '', trainer_name: '', start_date: '',
    training_start_time: '09:00',
    training_end_time: '17:00',
    hours_per_day: 8, end_date: '', capacity: 20,
    status: 'planned', readiness_score: 0, progression_percent: 0, attendance_health: 0, notes: '', participants: [], checklist: defaultChecklist,
  }
}

function pct(value: unknown) { return `${Math.round(Number(value || 0))}%` }
function seats(cohort: Partial<AcademyCohortPayload>) { return Math.max(0, Number(cohort.capacity || 0) - (cohort.participants?.length || 0)) }
function readonly(mode: Mode) { return mode === 'view' }

async function safeJson(res: Response) {
  const raw = await res.text()
  if (!raw) return { ok: false, error: `Empty server response (${res.status})` }
  try { return JSON.parse(raw) } catch { return { ok: false, error: raw || `Invalid server response (${res.status})` } }
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="academy-page"><aside className="academy-sidebar"><div className="brand"><span className="brandMark">◆</span><div><b>Academy OS</b><small>Live Groups</small></div></div><p className="navTitle">ACADEMY</p>{sidebar.slice(0, 13).map(([label, href]) => <Link key={href} className={href === '/academy/cohorts' ? 'nav active' : 'nav'} href={href}>{label}</Link>)}<p className="navTitle">SYSTEM</p>{sidebar.slice(13).map(([label, href]) => <Link key={href} className="nav" href={href}>{label}</Link>)}<div className="systemCard"><b>Academy OS</b><span>Enterprise Edition</span><em>● Online</em><button>View System Status</button></div></aside><main className="academy-main">{children}</main></div>
}




function previewPdf(url: string) {
  if (typeof window === 'undefined') return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function AcademyCohortsClient({ initialDashboard }: Props) {
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; mode: Mode; form: AcademyCohortPayload; id?: string | number }>({ open: false, mode: 'create', form: emptyCohort() })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return dashboard.cohorts
    return dashboard.cohorts.filter((cohort) => [cohort.title, cohort.reference_number, cohort.program_title, cohort.trainer_name, cohort.status].join(' ').toLowerCase().includes(q))
  }, [dashboard.cohorts, query])

  async function refresh() {
    const res = await fetch('/api/academy/cohorts', { cache: 'no-store' })
    const json = await safeJson(res)
    if (json.ok) setDashboard(json.data)
  }
  function openCreate() { setModal({ open: true, mode: 'create', form: emptyCohort() }) }
  function openView(cohort: AcademyCohortRecord) { setModal({ open: true, mode: 'view', id: cohort.id, form: { ...cohort, checklist: cohort.checklist?.length ? cohort.checklist : defaultChecklist } }) }
  

function normalizeCohortTimePayload(payload: any) {
  const start = String(payload.training_start_time || '09:00').slice(0, 5)
  const end = String(payload.training_end_time || '17:00').slice(0, 5)

  return {
    ...payload,
    training_start_time: start,
    training_end_time: end,
    hours_per_day: Number(payload.hours_per_day || 8),
  }
}


function normalizeCohortModalRow(row: any) {
  return {
    ...row,
    training_start_time: String(row?.training_start_time || '09:00').slice(0, 5),
    training_end_time: String(row?.training_end_time || '17:00').slice(0, 5),
    hours_per_day: Number(row?.hours_per_day || 8),
  }
}

async function openCohortModal(row: any) {
  const fallback = normalizeCohortModalRow(row)
  setModal(fallback)

  if (!row?.id) return

  try {
    const response = await fetch(`/api/academy/cohorts/${row.id}`, { cache: 'no-store' })
    const json = await response.json().catch(() => ({}))

    if (!response.ok || json?.ok === false) return

    const live = json?.data || json?.cohort || row
    setModal(normalizeCohortModalRow({
      ...fallback,
      ...live,
      training_start_time: live.training_start_time || fallback.training_start_time,
      training_end_time: live.training_end_time || fallback.training_end_time,
      hours_per_day: live.hours_per_day || fallback.hours_per_day,
    }))
  } catch {
    setModal(fallback)
  }
}

async function saveCohort() {
    setSaving(true)
    const url = modal.id ? `/api/academy/cohorts/${modal.id}` : '/api/academy/cohorts'
    const method = modal.id ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalizeCohortTimePayload(modal)) })
    const json = await safeJson(res)
    setSaving(false)
    if (!json.ok) { alert(json.error || 'Unable to save cohort'); return }
    await refresh()
    setModal({ open: true, mode: 'view', id: json.data.id, form: { ...json.data, checklist: json.data.checklist?.length ? json.data.checklist : defaultChecklist } })
  }

  const capacity = dashboard.cohorts.reduce((sum, cohort) => sum + Number(cohort.capacity || 0), 0)
  const avgReady = dashboard.cohorts.length ? Math.round(dashboard.cohorts.reduce((sum, cohort) => sum + Number(cohort.readiness_score || 0), 0) / dashboard.cohorts.length) : 0

  return <Shell><style dangerouslySetInnerHTML={{ __html: styles }} /><div className="pageTop premiumTop"><div><p className="crumb">Home / Academy / Groups</p><h1>Live Groups & Cohort Command <span>v3.0</span></h1><p>Enterprise cohort control: linked programs, seats, approved enrollments, trainers, readiness, progression and A4 manifest records.</p></div><div className="topActions"><Link href="/academy/courses" className="ghostBtn">Programs</Link><button className="primaryBtn" onClick={openCreate}>＋ New Group / Cohort</button></div></div><section className="kpis"><Kpi label="Total Cohorts" value={dashboard.stats.totalCohorts} detail="real groups"/><Kpi label="Active / Open" value={dashboard.stats.activeCohorts} detail="live operations"/><Kpi label="Participants" value={dashboard.stats.totalParticipants} detail="assigned learners"/><Kpi label="Available Seats" value={dashboard.stats.availableSeats} detail={`${capacity} total capacity`}/><Kpi label="Readiness" value={pct(avgReady)} detail="average launch score"/></section><section className="cohortCommandMatrix"><div className="cohortHero"><span className="panelEyebrow">GROUPES LIVE OPS</span><h2>Live cohort orchestration cockpit</h2><p>Manage seats, trainers, approved enrollments, readiness checklists, progression and A4 cohort manifests from one premium operational layer.</p><div className="commandPills"><span>Program-linked</span><span>Approved enrollments</span><span>Trainer reassignment</span><span>Manifest A4</span></div></div><div className="cohortSignal green"><b>{dashboard.stats.availableSeats}</b><span>Available seats</span></div><div className="cohortSignal purple"><b>{dashboard.approvedEnrollments.length}</b><span>Approved enrollments</span></div><div className="cohortSignal blue"><b>{pct(avgReady)}</b><span>Readiness average</span></div></section><section className="groupsWorkspace premiumGroupsWorkspace"><div className="cohortBoard"><div className="boardHead"><div><h2>Groups Portfolio</h2><p>No seed rows. Every card is persisted in Academy cohort tables.</p></div><div className="toolbar"><input placeholder="Search cohorts, programs, trainers, references..." value={query} onChange={(e) => setQuery(e.target.value)} /><button onClick={refresh}>Refresh</button></div></div>{filtered.length ? <div className="cohortGrid">{filtered.map((c) => <button key={c.id} className="cohortCard premiumCard" onClick={() => openView(c)}><div className="cohortHead"><span className="cohortIcon">⌁</span><div><b>{c.title}</b><small>{c.reference_number}</small></div><em>{c.status}</em></div><p>{c.program_title || 'No linked program'} · {c.trainer_name || 'No trainer assigned'}</p><div className="seatPanel"><span><b>{c.participants?.length || 0}</b><small>Participants</small></span><span><b>{seats(c)}</b><small>Available</small></span><span><b>{pct(c.readiness_score)}</b><small>Ready</small></span></div><div className="bars"><i style={{ width: `${Number(c.readiness_score || 0)}%` }} /><span style={{ width: `${Number(c.progression_percent || 0)}%` }} /></div><div className="cardMeta"><span>Start {c.start_date || '—'}</span><span>Progress {pct(c.progression_percent)}</span><span>Health {pct(c.attendance_health)}</span></div></button>)}</div> : <div className="empty"><h2>No live groups yet</h2><p>Create the first real cohort. The page intentionally does not render fake groups or demo data.</p><button className="primaryBtn" onClick={openCreate}>Create Group / Cohort</button></div>}</div><aside className="opsRail"><h3>Live Group Intelligence</h3><Metric label="Programs available" value={dashboard.programs.length}/><Metric label="Registered trainers" value={dashboard.trainers.length}/><Metric label="Approved enrollments" value={dashboard.approvedEnrollments.length}/><Metric label="Average readiness" value={pct(avgReady)}/><div className="railHint">Click any cohort to open the enterprise manifest modal with edit, save and A4 print controls.</div></aside></section>{modal.open ? <CohortModal modal={modal} setModal={setModal} dashboard={dashboard} saving={saving} saveCohort={saveCohort}/> : null}</Shell>
}

function CohortModal({ modal, setModal, dashboard, saving, saveCohort }: any) {
  const form: AcademyCohortPayload = modal.form
  const locked = readonly(modal.mode)
  const selectedProgram = dashboard.programs.find((p: any) => String(p.id) === String(form.program_id))
  const selectedTrainer = dashboard.trainers.find((t: any) => String(t.id) === String(form.trainer_id))
  const filteredEnrollments = dashboard.approvedEnrollments.filter((enrollment: any) => !form.participants?.some((p) => String(p.enrollment_id) === String(enrollment.id)) && (!form.program_id || !enrollment.program_id || String(enrollment.program_id) === String(form.program_id)))

  function setValue(key: string, value: any) { setModal((current: any) => ({ ...current, form: { ...current.form, [key]: value } })) }
  function addParticipant(id: string) {
    const enrollment = dashboard.approvedEnrollments.find((item: any) => String(item.id) === String(id))
    if (!enrollment) return
    if ((form.participants || []).some((p) => String(p.enrollment_id) === String(enrollment.id))) return
    setValue('participants', [...(form.participants || []), { enrollment_id: enrollment.id, trainee_id: enrollment.trainee_id, trainee_name: enrollment.trainee_name, email: enrollment.email, phone: enrollment.phone, status: 'assigned', joined_at: new Date().toISOString() }])
  }
  function removeParticipant(index: number) { setValue('participants', (form.participants || []).filter((_, i) => i !== index)) }
  function printCohort() { if (modal.id) previewPdf(`/api/academy/cohorts/${modal.id}/pdf`) }

  return <div className="modalBackdrop"><div className="megaModal cohortMega"><header className="modalHeader premiumHeader"><div className="modalTitleBlock"><span className="modalIcon">👥</span><div><h2>{modal.mode === 'create' ? 'Create Live Group / Cohort' : form.title || 'Cohort Manifest'}</h2><p>Wide enterprise manifest: program link, trainer assignment, capacity, approved enrollments, readiness controls and A4 print.</p></div></div><div className="refBox"><span>Reference Number</span><input disabled={locked} value={form.reference_number || ''} onChange={(e) => setValue('reference_number', e.target.value)} /></div><button className="iconBtn" onClick={() => setModal({ open: false, mode: 'create', form: emptyCohort() })}>×</button></header><div className="modalBody premiumCohortBody"><section className="modalContent"><Panel number="1" title="Cohort Core Control"><div className="formGrid five"><Field label="Cohort Title"><input disabled={locked} value={form.title || ''} onChange={(e) => setValue('title', e.target.value)} /></Field><Field label="Linked Program"><select disabled={locked} value={String(form.program_id || '')} onChange={(e) => { const selectedId = String(e.target.value); const program = dashboard.programs.find((x: any) => String(x.id) === selectedId); setModal((m: any) => ({ ...m, form: { ...m.form, program_id: selectedId, program_title: program?.title || program?.program_name || '' } })) }}><option value="">Select program</option>{dashboard.programs.map((p: any) => <option key={p.id} value={String(p.id)}>{p.title || p.program_name} · {p.reference_number || 'program'}</option>)}</select></Field><Field label="Assigned Trainer"><select disabled={locked} value={String(form.trainer_id || '')} onChange={(e) => { const trainer = dashboard.trainers.find((x: any) => String(x.id) === String(e.target.value)); setModal((m: any) => ({ ...m, form: { ...m.form, trainer_id: trainer?.id || '', trainer_name: trainer?.full_name || '' } })) }}><option value="">Assign trainer</option>{dashboard.trainers.map((t: any) => <option key={t.id} value={String(t.id)}>{t.full_name} · {t.specialty || 'Trainer'}</option>)}</select></Field><Field label="Start Date"><input disabled={locked} type="date" value={form.start_date || ''} onChange={(e) => setValue('start_date', e.target.value)} /></Field><Field label="End Date"><input disabled={locked} type="date" value={form.end_date || ''} onChange={(e) => setValue('end_date', e.target.value)} /></Field><Field label="Seat Capacity"><input disabled={locked} type="number" value={form.capacity || 0} onChange={(e) => setValue('capacity', Number(e.target.value))} /></Field><Field label="Status"><select disabled={locked} value={form.status || 'planned'} onChange={(e) => setValue('status', e.target.value)}><option value="planned">Planned</option><option value="open">Open</option><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select></Field><Field label="Operational Notes"><textarea disabled={locked} value={form.notes || ''} onChange={(e) => setValue('notes', e.target.value)} /></Field></div>

            <div className="rounded-[1.4rem] border border-blue-100 bg-blue-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-blue-900">Schedule & Timing</h4>
                  <p className="text-xs font-bold text-blue-500">Used by live trainer agenda and A4 manifest.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">
                  {(modal.training_start_time || '09:00')} → {(modal.training_end_time || '17:00')}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-600">Training Start Time</span>
                  <input
                    type="time"
                    value={modal.training_start_time || '09:00'}
                    onChange={(event) => setModal({ ...modal, training_start_time: event.target.value })}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-400"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-600">Training End Time</span>
                  <input
                    type="time"
                    value={modal.training_end_time || '17:00'}
                    onChange={(event) => setModal({ ...modal, training_end_time: event.target.value })}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-400"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-600">Hours Per Day</span>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    step="0.5"
                    value={modal.hours_per_day || 8}
                    onChange={(event) => setModal({ ...modal, hours_per_day: Number(event.target.value || 8) })}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-400"
                  />
                </label>
              </div>
            </div>
</Panel><div className="cohortModalGrid"><Panel number="2" title="Seat, Readiness & Launch Health"><div className="metricGrid"><Metric label="Capacity" value={form.capacity || 0}/><Metric label="Participants" value={form.participants?.length || 0}/><Metric label="Available" value={seats(form)}/></div><RangeField label="Readiness Score" value={form.readiness_score || 0} disabled={locked} onChange={(value) => setValue('readiness_score', value)} /><RangeField label="Progression" value={form.progression_percent || 0} disabled={locked} onChange={(value) => setValue('progression_percent', value)} /><RangeField label="Attendance Health" value={form.attendance_health || 0} disabled={locked} onChange={(value) => setValue('attendance_health', value)} /></Panel><Panel number="3" title="Approved Enrollment Assignment"><div className="participantTools">{!locked ? <select value="" onChange={(e) => { addParticipant(e.target.value); e.currentTarget.value = '' }}><option value="">+ Add approved enrollment</option>{filteredEnrollments.map((e: any) => <option key={e.id} value={String(e.id)}>{e.trainee_name} · {e.status || 'approved'}</option>)}</select> : null}<div className="participants premiumParticipants">{(form.participants || []).map((p, i) => <div className="participant" key={`${p.enrollment_id || p.trainee_name}-${i}`}><b>{p.trainee_name}</b><small>{p.email || p.phone || 'Participant'}</small>{!locked ? <button onClick={() => removeParticipant(i)}>Remove</button> : null}</div>)}{!form.participants?.length ? <div className="mutedBox">No participant assigned yet.</div> : null}</div></div></Panel></div><Panel number="4" title="Readiness Checklist & Manual Progression"><div className="checklist premiumChecklist">{(form.checklist || defaultChecklist).map((item, i) => <label key={item.item_key || i}><input disabled={locked} type="checkbox" checked={Boolean(item.checked)} onChange={(e) => setValue('checklist', (form.checklist || defaultChecklist).map((x, n) => n === i ? { ...x, checked: e.target.checked } : x))} /><span>{item.label}</span></label>)}</div></Panel></section><aside className="modalSummary manifestSummary"><h3>Cohort Manifest Summary</h3><Summary label="Reference" value={form.reference_number || '—'} /><Summary label="Program" value={selectedProgram?.title || form.program_title || '—'} /><Summary label="Trainer" value={selectedTrainer?.full_name || form.trainer_name || '—'} /><Summary label="Dates" value={`${form.start_date || '—'} → ${form.end_date || '—'}`} /><Summary label="Seat usage" value={`${form.participants?.length || 0}/${form.capacity || 0}`} /><div className="summaryTotal"><span>Available Seats</span><b>{seats(form)}</b></div><div className="readiness"><b>Readiness</b><strong>{pct(form.readiness_score)}</strong></div><div className="readiness"><b>Progression</b><strong>{pct(form.progression_percent)}</strong></div><div className="manifestFlags"><span>✓ Live DB record</span><span>✓ A4 manifest enabled</span><span>✓ Approved enrollments only</span></div></aside></div><footer className="modalFooter">{modal.mode === 'view' ? <><button onClick={() => setModal((m: any) => ({ ...m, mode: 'edit' }))}>Edit</button><button onClick={printCohort}>Print A4 Manifest</button><button className="primaryBtn" onClick={() => setModal({ open: false, mode: 'create', form: emptyCohort() })}>Close</button></> : <><button onClick={() => setModal({ open: false, mode: 'create', form: emptyCohort() })}>Cancel</button>{modal.id ? <button onClick={printCohort}>Print A4 Manifest</button> : null}<button disabled={saving} onClick={saveCohort} className="primaryBtn">{saving ? 'Saving…' : modal.mode === 'create' ? 'Create Cohort' : 'Save Live Updates'}</button></>}</footer></div></div>
}

function Kpi({ label, value, detail }: { label: string; value: any; detail: string }) { return <div className="kpi"><span>{label}</span><b>{value}</b><em>{detail}</em><i /></div> }
function Panel({ number, title, children }: { number?: string; title: string; children: React.ReactNode }) { return <section className="panel"><h3>{number ? <span>{number}</span> : null}{title}</h3>{children}</section> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label> }
function Metric({ label, value }: { label: string; value: any }) { return <div className="metric"><span>{label}</span><b>{value}</b></div> }
function Summary({ label, value }: { label: string; value: any }) { return <div className="summaryLine"><span>{label}</span><b>{value}</b></div> }
function RangeField({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) { return <label className="rangeField"><span>{label}</span><b>{pct(value)}</b><input disabled={disabled} type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label> }

const styles = `body{margin:0;background:#f4f7fb;color:#111827;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.academy-page{display:flex;min-height:100vh}.academy-sidebar{width:244px;background:#fff;border-right:1px solid #e5eaf2;padding:22px 16px;position:sticky;top:0;height:100vh;box-sizing:border-box}.brand{display:flex;gap:12px;align-items:center;margin-bottom:22px}.brandMark{width:38px;height:38px;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:#fff;display:grid;place-items:center}.brand b{display:block}.brand small,.systemCard span{display:block;color:#64748b}.navTitle{font-size:11px;color:#4f46e5;letter-spacing:.14em;font-weight:900}.nav{display:block;text-decoration:none;color:#111827;padding:10px 13px;border-radius:12px;font-weight:850;font-size:14px}.nav.active{background:#ede9fe;color:#5b21b6}.systemCard{position:absolute;left:16px;right:16px;bottom:20px;border:1px solid #e5eaf2;border-radius:18px;padding:14px;background:linear-gradient(180deg,#fff,#f8fafc)}.systemCard em{font-style:normal;color:#16a34a;font-weight:900}.systemCard button,.ghostBtn,.primaryBtn,.modalFooter button,.iconBtn,.toolbar button{border:1px solid #dbe3ef;background:#fff;border-radius:13px;padding:11px 15px;font-weight:900;color:#0f172a;text-decoration:none;cursor:pointer}.primaryBtn{background:linear-gradient(135deg,#5b3df5,#0891b2);color:#fff;border:0}.academy-main{flex:1;padding:26px 28px 70px}.crumb{font-size:12px;color:#64748b;font-weight:900}.pageTop{display:flex;justify-content:space-between;align-items:flex-start}.pageTop h1{font-size:34px;margin:0}.pageTop h1 span{font-size:12px;background:#ede9fe;color:#6d28d9;border-radius:999px;padding:4px 8px}.pageTop p{color:#64748b;font-weight:750;margin:6px 0 0}.topActions{display:flex;gap:10px}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin:22px 0}.kpi,.cohortBoard,.opsRail,.panel,.modalSummary{background:#fff;border:1px solid #e5eaf2;border-radius:24px;box-shadow:0 18px 45px rgba(15,23,42,.05)}.kpi{padding:19px;position:relative;overflow:hidden}.kpi span{color:#64748b;font-weight:900}.kpi b{display:block;font-size:29px;margin:7px 0}.kpi em{font-style:normal;color:#16a34a;font-weight:900}.kpi i{position:absolute;right:-16px;bottom:-24px;width:95px;height:55px;border:3px solid #bbf7d0;border-radius:50%}.groupsWorkspace{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px}.cohortBoard,.opsRail{padding:18px}.boardHead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:16px}.boardHead h2,.opsRail h3{margin:0}.boardHead p{color:#64748b;font-weight:700}.toolbar{display:flex;gap:10px}.toolbar input{min-width:360px;border:1px solid #dbe3ef;border-radius:14px;padding:13px}.cohortGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.cohortCard{text-align:left;border:1px solid #e5eaf2;background:linear-gradient(180deg,#fff,#fbfdff);border-radius:22px;padding:18px;cursor:pointer;transition:.18s}.cohortCard:hover{transform:translateY(-3px);box-shadow:0 22px 54px rgba(15,23,42,.11)}.cohortHead{display:flex;gap:12px;align-items:center}.cohortHead div{flex:1}.cohortHead b{display:block}.cohortHead small{display:block;color:#64748b}.cohortIcon{width:40px;height:40px;border-radius:15px;background:#eef2ff;color:#4f46e5;display:grid;place-items:center;font-weight:900}.cohortHead em{font-style:normal;background:#ecfeff;color:#0f766e;border-radius:999px;padding:5px 9px;font-weight:900;text-transform:capitalize}.cohortCard p{color:#64748b;font-weight:700}.seatPanel{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.seatPanel span,.metric{background:#f8fafc;border:1px solid #e5eaf2;border-radius:14px;padding:11px}.seatPanel b,.metric b{display:block;font-size:22px}.seatPanel small,.metric span{color:#64748b;font-weight:800;font-size:12px}.bars{height:10px;background:#e5eaf2;border-radius:999px;overflow:hidden;position:relative}.bars i,.bars span{position:absolute;left:0;top:0;height:100%;display:block}.bars i{background:#22c55e}.bars span{background:#5b3df5;opacity:.65}.cardMeta{display:flex;justify-content:space-between;gap:8px;margin-top:11px;color:#64748b;font-weight:800;font-size:12px}.opsRail .metric{margin-bottom:10px}.railHint{margin-top:16px;border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;border-radius:18px;padding:14px;font-weight:800}.empty{text-align:center;padding:80px}.modalBackdrop{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:80;display:grid;place-items:center;padding:18px}.megaModal{width:min(1520px,98vw);max-height:96vh;overflow:auto;background:#fff;border-radius:26px;box-shadow:0 45px 150px rgba(15,23,42,.38);border:1px solid rgba(99,102,241,.25)}.modalHeader,.modalFooter{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid #e5eaf2}.modalFooter{border-top:1px solid #e5eaf2;border-bottom:0;justify-content:flex-end;background:#fbfdff}.premiumHeader{background:linear-gradient(135deg,#fff,#f5f7ff)}.modalTitleBlock{display:flex;gap:14px;align-items:center}.modalIcon{width:44px;height:44px;border-radius:16px;background:linear-gradient(135deg,#5b3df5,#06b6d4);display:grid;place-items:center;color:#fff}.modalHeader h2{font-size:27px;margin:0}.modalHeader p{margin:5px 0 0;color:#64748b}.refBox{display:flex;align-items:center;gap:10px;margin-left:auto}.refBox span{font-size:12px;font-weight:900;color:#64748b}.refBox input,.field input,.field select,.field textarea,.participantTools select{border:1px solid #dbe3ef;border-radius:12px;padding:11px;background:#fff;min-width:0}.premiumCohortBody{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;padding:18px 24px}.modalContent{display:flex;flex-direction:column;gap:14px}.panel{padding:16px}.panel h3{margin:0 0 13px;font-size:16px}.panel h3 span{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:9px;background:#4f46e5;color:#fff;margin-right:8px;font-size:12px}.formGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.field{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:900;color:#334155}.field textarea{min-height:60px}.cohortModalGrid{display:grid;grid-template-columns:1fr 1.3fr;gap:14px}.metricGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.rangeField{display:grid;grid-template-columns:1fr auto;gap:6px;margin-top:11px;font-weight:900}.rangeField input{grid-column:1/3;width:100%}.participants{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:11px}.participant{border:1px solid #e5eaf2;border-radius:16px;padding:11px;background:#fbfdff}.participant small{display:block;color:#64748b}.participant button{border:0;background:#fee2e2;color:#dc2626;border-radius:9px;margin-top:8px;font-weight:900}.checklist{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.checklist label{display:flex;gap:8px;align-items:center;border:1px solid #e5eaf2;border-radius:15px;padding:13px;font-weight:900;background:#fbfdff}.modalSummary{padding:18px;height:max-content;position:sticky;top:0;background:linear-gradient(180deg,#fff,#f8fbff)}.summaryLine{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #edf2f7;padding:10px 0}.summaryLine span{color:#64748b}.summaryTotal,.readiness{background:linear-gradient(135deg,#eef2ff,#ecfeff);border:1px solid #a5b4fc;border-radius:16px;padding:15px;margin:14px 0}.summaryTotal b,.readiness strong{display:block;color:#4f46e5;font-size:30px}.manifestFlags{display:grid;gap:8px;color:#15803d;font-weight:900}.mutedBox{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:15px;padding:14px;color:#64748b}.iconBtn{width:42px;height:42px;border-radius:14px;padding:0}@media(max-width:1200px){.academy-sidebar{display:none}.groupsWorkspace,.kpis,.premiumCohortBody,.formGrid,.cohortModalGrid,.cohortGrid,.checklist,.participants{grid-template-columns:1fr}.toolbar input{min-width:0}.megaModal{width:98vw}}
.academy-main{padding-top:118px}.pageTop{background:linear-gradient(135deg,#ffffff 0%,#eef2ff 58%,#ecfeff 100%);border:1px solid #dbeafe;border-radius:28px;padding:22px 24px;box-shadow:0 22px 60px rgba(15,23,42,.07)}.pageTop h1{font-size:38px}.cohortCommandMatrix{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(3,minmax(0,.72fr));gap:16px;margin:18px 0}.cohortHero,.cohortSignal,.launchPanel{border:1px solid #dbeafe;border-radius:28px;background:linear-gradient(135deg,#fff,#f8fbff);box-shadow:0 24px 70px rgba(15,23,42,.07);padding:22px}.cohortHero h2{font-size:28px;margin:8px 0}.cohortHero p{color:#475569;font-weight:750}.panelEyebrow{font-size:11px;letter-spacing:.16em;color:#4f46e5;font-weight:950}.commandPills{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}.commandPills span{background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:999px;padding:8px 12px;font-weight:900}.cohortSignal b{display:block;font-size:36px}.cohortSignal span{font-weight:950;color:#334155}.cohortSignal.green{background:linear-gradient(135deg,#ecfdf5,#fff)}.cohortSignal.purple{background:linear-gradient(135deg,#f5f3ff,#fff)}.cohortSignal.blue{background:linear-gradient(135deg,#eff6ff,#fff)}.premiumGroupsWorkspace{grid-template-columns:minmax(0,1fr) 380px}.cohortGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.cohortCard{min-height:190px;background:linear-gradient(145deg,#fff,#f8fbff);border:1px solid rgba(99,102,241,.14)}.opsRail{background:linear-gradient(180deg,#fff,#f8fbff)}.modalBackdrop{z-index:999999 !important;align-items:flex-start !important;place-items:start center !important;padding:118px 14px 28px !important}.megaModal{width:min(2040px,99.4vw) !important;max-height:calc(100vh - 140px) !important;border-radius:34px !important}.premiumCohortBody{grid-template-columns:minmax(0,1fr) 430px !important;padding:26px 34px}.modalHeader{padding:26px 34px !important}.modalHeader h2{font-size:32px !important}.formGrid{grid-template-columns:repeat(5,minmax(0,1fr))}.cohortModalGrid{grid-template-columns:1fr 1.45fr}.metricGrid{grid-template-columns:repeat(3,1fr)}.checklist{grid-template-columns:repeat(4,1fr)}.modalSummary{border-radius:24px;background:linear-gradient(180deg,#fff,#f6f8ff)}.participant{box-shadow:0 12px 30px rgba(15,23,42,.04)}@media(max-width:1380px){.cohortCommandMatrix,.premiumGroupsWorkspace,.premiumCohortBody,.formGrid,.cohortModalGrid,.checklist,.cohortGrid{grid-template-columns:1fr !important}.academy-main{padding-top:110px}.megaModal{width:99vw !important}}
`
