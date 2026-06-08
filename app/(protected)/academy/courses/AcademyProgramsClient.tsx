'use client'

type ProgramLibraryCategory =
  | 'training_workbook'
  | 'training_presentation'
  | 'assessments_exams'
  | 'participant_docs_checklists'


type ProgramLibraryCategoryConfig = readonly [
  ProgramLibraryCategory,
  string,
  string,
]

type ProgramLibraryLink = {
  label?: string
  title?: string
  name?: string
  url?: string
  link?: string
}

type ProgramLibraryMap = Record<ProgramLibraryCategory, ProgramLibraryLink[]>

const PROGRAM_LIBRARY_CATEGORIES: ProgramLibraryCategory[] = [
  'training_workbook',
  'training_presentation',
  'assessments_exams',
  'participant_docs_checklists',
]

function ensureProgramLibrary(value: any): ProgramLibraryMap {
  return {
    training_workbook: Array.isArray(value?.training_workbook) ? value.training_workbook : [],
    training_presentation: Array.isArray(value?.training_presentation) ? value.training_presentation : [],
    assessments_exams: Array.isArray(value?.assessments_exams) ? value.assessments_exams : [],
    participant_docs_checklists: Array.isArray(value?.participant_docs_checklists) ? value.participant_docs_checklists : [],
  }
}


import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { AcademyProgramPayload, AcademyProgramRecord, AcademyProgramsDashboard } from '@/lib/academy-programs/types'

type Mode = 'create' | 'view' | 'edit'
type Props = { initialDashboard: AcademyProgramsDashboard }

type LibraryCategory = AcademyProgramPayload['library_links'] extends Array<infer T> ? T extends { category: infer C } ? C : never : never

const libraryCategories: ProgramLibraryCategoryConfig[] = [
  ['training_workbook', 'Training Work Book', 'Workbook links, manuals, guided exercises'],
  ['training_presentation', 'Training Digital Presentation', 'Slides, decks, online lessons, videos'],
  ['assessments_exams', 'Assessments & Exams', 'Quizzes, exams, scoring forms, rubrics'],
  ['participant_docs_checklists', 'Participants Utility Docs & Checklists', 'Checklists, utilities, documents, templates'],
] as const

const sidebar = [
  ['Command Center', '/academy'],
  ['Trainees', '/academy/trainees'],
  ['Enrollments', '/academy/enrollments'],
  ['Attendance', '/academy/attendance'],
  ['Payments', '/academy/payments'],
  ['Certificates', '/academy/certificates'],
  ['Trainers', '/academy/trainers'],
  ['Programs', '/academy/courses'],
  ['Groups / Cohorts', '/academy/cohorts'],
  ['Job Placement', '/academy/job-placement'],
  ['Partners & Employers', '/academy/partners'],
  ['Announcements', '/academy/alerts-sales'],
  ['Reports & Analytics', '/academy/reports'],
  ['Integrations', '/academy/integrations'],
  ['Automation', '/academy/automation'],
  ['Settings', '/academy/settings'],
]

const defaultParameters = {
  certification: true,
  attendance_required: true,
  placement_support: false,
  resource_download: true,
  notifications: true,
  auto_certificate: false,
  manager_approval: true,
  allow_waitlist: true,
  live_sessions: true,
  record_sessions: true,
  final_assessment: true,
  learner_progress_visible: true,
}

function emptyProgram(): AcademyProgramPayload {
  return {
    reference_number: `PRG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    title: '',
    category: '',
    level: 'advanced',
    delivery_format: 'blended',
    status: 'planning',
    target_audience: '',
    description: '',
    intake_start: '',
    intake_end: '',
    duration_days: 12,
    hours_per_day: 7,
    total_hours: 84,
    base_price_dhs: 0,
    currency: 'Dhs',
    visibility: 'internal',
    enrollment_cap: 30,
    readiness_score: 0,
    parameters: defaultParameters,
    outcomes: {
      expected: [''],
      certification_type: 'Certificate of Completion',
      assessment_structure: 'Quizzes + Capstone + Final Exam',
      grading_summary: 'Assignments 40%, Project 30%, Final Exam 30%',
    },
    trainers: [],
    library_links: libraryCategories.flatMap(([category]) => ([{ category: category as LibraryCategory, label: '', url: '' }])),
    pricing_rows: [
      { label: 'Standard Seat Price', billing_type: 'per_seat', amount_dhs: 0, tax_rate: 0, applies_to: 'All participants' },
    ],
    addons: [],
  }
}

function money(value: unknown) {
  return `${Number(value || 0).toLocaleString()} Dhs`
}

function totalHours(form: AcademyProgramPayload) {
  return Number(form.duration_days || 0) * Number(form.hours_per_day || 0)
}

function priceBreakdown(form: AcademyProgramPayload) {
  const base = Number(form.base_price_dhs || 0)
  const rows = (form.pricing_rows || []).reduce((sum, row) => sum + Number(row.amount_dhs || 0), 0)
  const addons = (form.addons || []).reduce((sum, addon) => sum + Number(addon.amount_dhs || 0), 0)
  const total = base + rows + addons
  return { base, rows, addons, tax: 0, total }
}

function readiness(form: AcademyProgramPayload) {
  const checks = [
    Boolean(form.title),
    Boolean(form.category),
    Boolean(form.description),
    Boolean((form.trainers || []).length),
    Boolean(totalHours(form)),
    Boolean((form.library_links || []).filter((link) => link.url).length),
    Boolean(Number(form.base_price_dhs || 0)),
    Boolean((form.pricing_rows || []).length),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

async function safeJson(res: Response) {
  const raw = await res.text()
  if (!raw) return { ok: false, error: `Empty server response (${res.status})` }
  try {
    return JSON.parse(raw)
  } catch {
    return { ok: false, error: raw || `Invalid server response (${res.status})` }
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="academy-page">
      <aside className="academy-sidebar">
        <div className="brand"><span className="brandMark">◆</span><div><b>Academy OS</b><small>Command Center</small></div></div>
        <p className="navTitle">ACADEMY</p>
        {sidebar.slice(0, 13).map(([label, href]) => <Link key={href} className={href === '/academy/courses' ? 'nav active' : 'nav'} href={href}>{label}</Link>)}
        <p className="navTitle">SYSTEM</p>
        {sidebar.slice(13).map(([label, href]) => <Link key={href} className="nav" href={href}>{label}</Link>)}
        <div className="systemCard"><b>Academy OS</b><span>Enterprise Edition</span><em>● Online</em><button>View System Status</button></div>
      </aside>
      <main className="academy-main">{children}</main>
    </div>
  )
}




function previewPdf(url: string) {
  if (typeof window === 'undefined') return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function AcademyProgramsClient({ initialDashboard }: Props) {
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<{ open: boolean; mode: Mode; form: AcademyProgramPayload; id?: string | number }>({ open: false, mode: 'create', form: emptyProgram() })
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return dashboard.programs
    return dashboard.programs.filter((program) => [program.title, program.reference_number, program.category, program.level, program.status].join(' ').toLowerCase().includes(q))
  }, [dashboard.programs, query])

  const primaryProgram = filtered[0]
  const stats = useMemo(() => {
    const active = dashboard.programs.filter((program) => program.status === 'active').length
    const planning = dashboard.programs.filter((program) => program.status === 'planning').length
    const totalHoursValue = dashboard.programs.reduce((sum, program) => sum + Number(program.total_hours || 0), 0)
    const linkCount = dashboard.programs.reduce((sum, program) => sum + (program.library_links || []).length, 0)
    return { active, planning, totalHoursValue, linkCount }
  }, [dashboard.programs])

  async function refresh() {
    const res = await fetch('/api/academy/programs', { cache: 'no-store' })
    const json = await safeJson(res)
    if (json.ok) setDashboard(json.data)
  }

  function openCreate() {
    setModal({ open: true, mode: 'create', form: emptyProgram() })
  }

  function openView(program: AcademyProgramRecord) {
    setModal({ open: true, mode: 'view', id: program.id, form: { ...program, parameters: { ...defaultParameters, ...(program.parameters || {}) } } })
  }

  async function saveProgram() {
    setSaving(true)
    const payload = { ...modal.form, total_hours: totalHours(modal.form), readiness_score: readiness(modal.form), currency: 'Dhs' }
    const url = modal.id ? `/api/academy/programs/${modal.id}/pdf` : '/api/academy/programs'
    const method = modal.id ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await safeJson(res)
    setSaving(false)
    if (!json.ok) {
      alert(json.error || 'Unable to save program')
      return
    }
    await refresh()
    setModal({ open: true, mode: 'view', id: json.data.id, form: { ...json.data, parameters: { ...defaultParameters, ...(json.data.parameters || {}) } } })
  }

  return (
    <Shell>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="commandTop">
        <div>
          <div className="crumb">Home / Academy / Programs</div>
          <h1>Advanced Training Program Control <span>v2.1</span></h1>
          <p>Manage complex training products, trainers, multi-price packaging, cohorts, library links, compliance and A4 technical records.</p>
        </div>
        <div className="topActions"><Link href="/academy/cohorts" className="ghostBtn">Groups / Cohorts</Link><button className="primaryBtn" onClick={openCreate}>＋ Add Program</button></div>
      </div>

      <section className="kpis six academyKpiWall">
        <Kpi icon="◈" label="Active Programs" value={dashboard.stats.totalPrograms} detail={`${stats.active} active`} />
        <Kpi icon="☷" label="Planning" value={stats.planning} detail="program pipeline" />
        <Kpi icon="◷" label="Training Hours" value={stats.totalHoursValue} detail="registered hours" />
        <Kpi icon="◎" label="Library Links" value={stats.linkCount} detail="resources linked" />
        <Kpi icon="◍" label="Base Value" value={money(dashboard.stats.totalBaseValue)} detail="raw Dhs pricing" />
        <Kpi icon="✓" label="Trainers" value={dashboard.trainers.length} detail="registered trainers" />
      </section>

      <section className="programCommandMatrix">
        <div className="heroCommandPanel">
          <span className="panelEyebrow">PROGRAM FACTORY</span>
          <h2>Enterprise program lifecycle command</h2>
          <p>Build advanced training products with pricing rows, trainers, library links, cohorts, certificates and A4 technical records. No seed rows are rendered: the screen reflects live database state only.</p>
          <div className="commandPills"><span>Reference control</span><span>Multi-price Dhs</span><span>Trainer assignment</span><span>A4 print record</span></div>
        </div>
        <div className="miniOpsPanel violet"><b>{dashboard.programs.length}</b><span>Programs in source of truth</span><small>Click any row to open view / edit / print</small></div>
        <div className="miniOpsPanel teal"><b>{dashboard.trainers.length}</b><span>Registered trainers pool</span><small>Available for direct program assignment</small></div>
        <div className="miniOpsPanel amber"><b>{stats.linkCount}</b><span>Learning resource links</span><small>Workbook · Presentation · Exams · Checklists</small></div>
      </section>

      <section className="controlGrid premiumControlGrid">
        <div className="portfolio panelCard wide">
          <div className="cardHead"><div><h2>Program Portfolio</h2><p>Real DB-driven programs. No seed or demo rows.</p></div><button onClick={refresh}>Refresh</button></div>
          <div className="toolbar embedded"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search programs, references, trainers, categories..." /></div>
          {filtered.length ? <div className="programTable">{filtered.map((program) => <button key={program.id} className="programRow" onClick={() => openView(program)}><span><b>{program.title}</b><small>{program.reference_number}</small></span><span>{program.category || 'Uncategorized'}</span><span>{program.trainers?.length || 0} trainers</span><span>{program.total_hours || 0} h</span><span>{money(program.base_price_dhs)}</span><em>{program.status}</em></button>)}</div> : <Empty title="No programs yet" text="Create your first real training program. The system does not render fake program rows." action={openCreate} />}
        </div>

        <div className="panelCard architecture">
          <div className="cardHead"><div><h2>Program Architecture</h2><p>{primaryProgram ? primaryProgram.title : 'No selected program'}</p></div></div>
          {primaryProgram ? <div className="pathway"><PathStep title="Core" value={primaryProgram.category || 'Category'} /><PathStep title="Delivery" value={primaryProgram.delivery_format || 'Delivery'} /><PathStep title="Duration" value={`${primaryProgram.total_hours || 0} Hours`} /><PathStep title="Outcome" value={primaryProgram.outcomes?.certification_type || 'Certificate'} /></div> : <div className="mutedBox">Create or select a program to view curriculum architecture.</div>}
        </div>

        <div className="panelCard revenueBox">
          <div className="cardHead"><div><h2>Pricing Intelligence</h2><p>Base prices, additional price rows and on-demand add-ons.</p></div></div>
          {primaryProgram ? <><div className="donut"><strong>{money(priceBreakdown(primaryProgram).total)}</strong><span>Total package</span></div><Summary label="Base price" value={money(primaryProgram.base_price_dhs)} /><Summary label="Price rows" value={`${primaryProgram.pricing_rows?.length || 0}`} /><Summary label="Add-ons" value={`${primaryProgram.addons?.length || 0}`} /></> : <div className="mutedBox">Pricing appears after program creation.</div>}
        </div>

        <div className="panelCard trainerPanel">
          <div className="cardHead"><div><h2>Trainer Capacity</h2><p>Registered trainers available for assignment.</p></div></div>
          <div className="trainerMiniList">{dashboard.trainers.slice(0, 6).map((trainer) => <div key={trainer.id}><b>{trainer.full_name}</b><small>{trainer.specialty || 'Trainer'}</small></div>)}{dashboard.trainers.length === 0 ? <div className="mutedBox">No registered trainers found.</div> : null}</div>
        </div>

        <div className="panelCard actionPanel">
          <div className="cardHead"><div><h2>Program Operations</h2><p>Direct actions for training product execution.</p></div></div>
          <div className="actionGrid"><button onClick={openCreate}>Create Program</button><Link href="/academy/cohorts">Manage Cohorts</Link><Link href="/academy/enrollments">Approved Enrollments</Link><Link href="/academy/certificates">Certificates</Link></div>
        </div>
      </section>

      <section className="executionLayerGrid">
        <div className="deepPanel"><span>01</span><h3>Curriculum readiness lane</h3><p>{primaryProgram ? `${primaryProgram.library_links?.length || 0} resource links attached to ${primaryProgram.title}` : 'Select or create a program to activate curriculum readiness.'}</p></div>
        <div className="deepPanel"><span>02</span><h3>Commercial packaging lane</h3><p>{primaryProgram ? `${primaryProgram.pricing_rows?.length || 0} price rows and ${primaryProgram.addons?.length || 0} on-demand add-ons configured in Dhs.` : 'Pricing intelligence activates from real program records.'}</p></div>
        <div className="deepPanel"><span>03</span><h3>Cohort activation lane</h3><p>Use Groups / Cohorts to transform a saved program into a live operational group with seats, participants and trainer ownership.</p></div>
      </section>

      {modal.open ? <ProgramModal modal={modal} setModal={setModal} trainers={dashboard.trainers} saving={saving} saveProgram={saveProgram} /> : null}
    </Shell>
  )
}

function Kpi({ icon, label, value, detail }: { icon: string; label: string; value: any; detail: string }) {
  return <div className="kpi"><span className="kpiIcon">{icon}</span><div><small>{label}</small><b>{value}</b><em>{detail}</em></div><i /></div>
}

function Empty({ title, text, action }: { title: string; text: string; action: () => void }) {
  return <div className="empty"><h2>{title}</h2><p>{text}</p><button className="primaryBtn" onClick={action}>Add Program</button></div>
}

function PathStep({ title, value }: { title: string; value: string }) {
  return <div className="pathStep"><b>{title}</b><span>{value}</span><small>Ready</small></div>
}

function setFormValue(setModal: any, key: string, value: any) {
  setModal((modal: any) => ({ ...modal, form: { ...modal.form, [key]: value } }))
}

function readOnly(mode: Mode) { return mode === 'view' }

function ProgramModal({ modal, setModal, trainers, saving, saveProgram }: any) {
  const form: AcademyProgramPayload = modal.form
  const locked = readOnly(modal.mode)
  const breakdown = priceBreakdown(form)
  const linksByCategory = (category: string) => (form.library_links || []).filter((link) => link.category === category)
  const setList = (key: 'trainers' | 'library_links' | 'pricing_rows' | 'addons', list: any[]) => setFormValue(setModal, key, list)

  function updateLink(category: ProgramLibraryCategory, index: number, patch: any) {
    const all = [...(form.library_links || [])]
    const matches = all.map((link, absoluteIndex) => ({ ...link, absoluteIndex })).filter((link) => link.category === category)
    const target = matches[index]
    if (!target) return
    all[target.absoluteIndex] = { ...all[target.absoluteIndex], ...patch }
    setList('library_links', all)
  }

  function removeLink(category: ProgramLibraryCategory, index: number) {
    const all = [...(form.library_links || [])]
    const matches = all.map((link, absoluteIndex) => ({ ...link, absoluteIndex })).filter((link) => link.category === category)
    const target = matches[index]
    if (!target) return
    all.splice(target.absoluteIndex, 1)
    setList('library_links', all)
  }

  function addLink(category: ProgramLibraryCategory) {
    setList('library_links', [...(form.library_links || []), { category, label: '', url: '' }])
  }

  function addTrainer(id: string) {
    const trainer = trainers.find((item: any) => String(item.id) === String(id))
    if (!trainer) return
    if ((form.trainers || []).some((entry) => String(entry.trainer_id) === String(trainer.id))) return
    setList('trainers', [...(form.trainers || []), { trainer_id: trainer.id, trainer_name: trainer.full_name, role: 'Trainer', specialty: trainer.specialty || 'Registered Trainer' }])
  }

  function printProgram() {
    if (modal.id) previewPdf(`/api/academy/programs/${modal.id}/pdf`)
  }

  return (
    <div className="modalBackdrop">
      <div className="megaModal premiumModal">
        <header className="modalHeader premiumHeader">
          <div className="modalTitleBlock"><span className="modalIcon">🎓</span><div><h2>{modal.mode === 'create' ? 'Create Advanced Training Program' : form.title || 'Training Program'}</h2><p>Enterprise program factory: trainers, schedule, resource links, pricing rows, add-ons, controls and A4 technical record.</p></div></div>
          <div className="refBox"><span>Reference Number</span><input disabled={locked} value={form.reference_number || ''} onChange={(event) => setFormValue(setModal, 'reference_number', event.target.value)} /></div>
          <button className="iconBtn" onClick={() => setModal({ open: false, mode: 'create', form: emptyProgram() })}>×</button>
        </header>

        <div className="modalBody premiumBody">
          <section className="modalContent premiumContent">
            <Panel number="1" title="Program Core Information" tone="blue">
              <div className="formGrid five">
                <Field label="Program Name"><input disabled={locked} value={form.title || ''} onChange={(event) => setFormValue(setModal, 'title', event.target.value)} /></Field>
                <Field label="Category"><input disabled={locked} value={form.category || ''} onChange={(event) => setFormValue(setModal, 'category', event.target.value)} /></Field>
                <Field label="Level"><select disabled={locked} value={form.level || 'advanced'} onChange={(event) => setFormValue(setModal, 'level', event.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="executive">Executive</option></select></Field>
                <Field label="Delivery Format"><select disabled={locked} value={form.delivery_format || 'blended'} onChange={(event) => setFormValue(setModal, 'delivery_format', event.target.value)}><option value="blended">Blended Live + Online</option><option value="onsite">Onsite</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></Field>
                <Field label="Status"><select disabled={locked} value={form.status || 'planning'} onChange={(event) => setFormValue(setModal, 'status', event.target.value)}><option value="planning">Planning</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="archived">Archived</option></select></Field>
                <Field label="Intake Start"><input disabled={locked} type="date" value={form.intake_start || ''} onChange={(event) => setFormValue(setModal, 'intake_start', event.target.value)} /></Field>
                <Field label="Intake End"><input disabled={locked} type="date" value={form.intake_end || ''} onChange={(event) => setFormValue(setModal, 'intake_end', event.target.value)} /></Field>
                <Field label="Target Audience"><input disabled={locked} value={form.target_audience || ''} onChange={(event) => setFormValue(setModal, 'target_audience', event.target.value)} /></Field>
                <Field label="Description"><textarea disabled={locked} value={form.description || ''} onChange={(event) => setFormValue(setModal, 'description', event.target.value)} /></Field>
              </div>
            </Panel>

            <div className="splitRow">
              <Panel number="2" title="Trainer Assignment" tone="orange">
                <div className="trainerToolbar">{!locked ? <select onChange={(event) => { addTrainer(event.target.value); event.currentTarget.value = '' }} defaultValue=""><option value="">+ Add registered trainer</option>{trainers.map((trainer: any) => <option key={trainer.id} value={trainer.id}>{trainer.full_name} · {trainer.specialty || 'Trainer'}</option>)}</select> : null}<span>{form.trainers?.length || 0} trainers selected</span></div>
                <div className="trainerCards">{(form.trainers || []).map((trainer, index) => <div className="trainerCard" key={`${trainer.trainer_id || trainer.trainer_name}-${index}`}><span>{trainer.trainer_name?.slice(0, 1) || 'T'}</span><b>{trainer.trainer_name}</b><small>{trainer.specialty || trainer.role || 'Trainer'}</small>{!locked ? <button onClick={() => setList('trainers', (form.trainers || []).filter((_, itemIndex) => itemIndex !== index))}>×</button> : null}</div>)}{!form.trainers?.length ? <div className="mutedBox">Assign one or multiple registered trainers.</div> : null}</div>
              </Panel>

              <Panel number="3" title="Duration & Schedule" tone="violet">
                <div className="durationGrid">
                  <Field label="Duration (Days)"><input disabled={locked} type="number" value={form.duration_days || 0} onChange={(event) => setFormValue(setModal, 'duration_days', Number(event.target.value))} /></Field>
                  <Field label="Hours per Day"><input disabled={locked} type="number" value={form.hours_per_day || 0} onChange={(event) => setFormValue(setModal, 'hours_per_day', Number(event.target.value))} /></Field>
                  <div className="hoursBox"><span>Total Training Hours</span><b>{totalHours(form)} Hours</b><small>{form.duration_days || 0} days × {form.hours_per_day || 0} hours/day</small></div>
                </div>
              </Panel>
            </div>

            <Panel number="4" title="Smart Learning Library — Multiple Resource Links" tone="green">
              <div className="libraryGrid upgradedLibrary">{libraryCategories.map(([category, label, description]: ProgramLibraryCategoryConfig) => <div className="libraryCard" key={category}><div className="libraryHead"><span>{category === 'training_workbook' ? '📘' : category === 'training_presentation' ? '🖥️' : category === 'assessments_exams' ? '📝' : '🗂️'}</span><div><b>{label}</b><small>{description}</small></div></div>{linksByCategory(category).map((link, index) => <div className="linkRow" key={`${category}-${index}`}><input disabled={locked} placeholder="Resource label" value={link.label || ''} onChange={(event) => updateLink(category, index, { label: event.target.value })} /><input disabled={locked} placeholder="Paste resource URL" value={link.url || ''} onChange={(event) => updateLink(category, index, { url: event.target.value })} />{!locked ? <button onClick={() => removeLink(category, index)}>×</button> : null}</div>)}{!locked ? <button className="linkBtn" onClick={() => addLink(category)}>+ Add another link</button> : null}</div>)}</div>
            </Panel>

            <Panel number="5" title="Pricing Engine — Base Price, Price Rows & On-Demand Add-ons" tone="purple">
              <div className="pricingMegaGrid">
                <div className="basePriceCard"><h4>Base Program Pricing</h4><Field label="Initial Course Price"><input disabled={locked} type="number" value={form.base_price_dhs || 0} onChange={(event) => setFormValue(setModal, 'base_price_dhs', Number(event.target.value))} /></Field><small>Currency: Moroccan Dirhams (Dhs)</small></div>
                <div className="priceRowsCard"><h4>Additional Price Rows</h4><PriceRows rows={form.pricing_rows || []} setRows={(rows: any[]) => setList('pricing_rows', rows)} locked={locked} /></div>
                <div className="addonRowsCard"><h4>On-Demand Add-ons</h4><AddonRows rows={form.addons || []} setRows={(rows: any[]) => setList('addons', rows)} locked={locked} /></div>
                <div className="priceSummary premiumPrice"><h4>Pricing Summary</h4><Summary label="Base Price" value={money(breakdown.base)} /><Summary label="Additional Rows" value={`${form.pricing_rows?.length || 0} rows`} /><Summary label="On-Demand Add-ons" value={`${form.addons?.length || 0} add-ons`} /><Summary label="VAT" value="Not applied" /><div className="summaryTotal"><span>Total Price</span><b>{money(breakdown.total)}</b></div></div>
              </div>
            </Panel>

            <Panel number="6" title="Program Parameters & Options" tone="teal">
              <div className="toggleMatrix">{Object.keys(defaultParameters).map((key) => <label key={key}><span>{key.replaceAll('_', ' ')}</span><input disabled={locked} type="checkbox" checked={Boolean((form.parameters || {})[key])} onChange={(event) => setFormValue(setModal, 'parameters', { ...(form.parameters || {}), [key]: event.target.checked })} /></label>)}</div>
            </Panel>
          </section>

          <aside className="modalSummary premiumSummary"><h3>Program Summary</h3><Summary label="Reference" value={form.reference_number || '—'} /><Summary label="Status" value={form.status || 'planning'} /><Summary label="Category" value={form.category || '—'} /><Summary label="Trainers" value={`${form.trainers?.length || 0} selected`} /><Summary label="Duration" value={`${form.duration_days || 0} days`} /><Summary label="Training Hours" value={`${totalHours(form)} h`} /><Summary label="Library Links" value={`${(form.library_links || []).filter((link) => link.url).length}`} /><div className="summaryTotal"><span>Total package</span><b>{money(breakdown.total)}</b></div><div className="readiness"><strong>{readiness(form)}%</strong><span>Readiness score</span></div><div className="summaryChecks"><span>● Core information</span><span>● Trainers</span><span>● Duration</span><span>● Library links</span><span>● Pricing</span><span>● Parameters</span></div></aside>
        </div>

        <footer className="modalFooter premiumFooter">{modal.mode === 'view' ? <><button onClick={() => setModal((current: any) => ({ ...current, mode: 'edit' }))}>✎ Edit</button><button onClick={printProgram}>▣ Print A4</button><button className="primaryBtn" onClick={() => setModal({ open: false, mode: 'create', form: emptyProgram() })}>Close</button></> : <><button onClick={() => setModal({ open: false, mode: 'create', form: emptyProgram() })}>Cancel</button>{modal.id ? <button onClick={printProgram}>▣ Print A4</button> : null}<button disabled={saving} onClick={saveProgram} className="primaryBtn">{saving ? 'Saving…' : modal.mode === 'create' ? 'Create Program' : 'Save Changes'}</button></>}</footer>
      </div>
    </div>
  )
}

function Panel({ number, title, tone, children }: { number?: string; title: string; tone?: string; children: React.ReactNode }) {
  return <section className={`panel tone-${tone || 'blue'}`}><h3>{number ? <span>{number}</span> : null}{title}</h3>{children}</section>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summaryLine"><span>{label}</span><b>{value}</b></div>
}

function PriceRows({ rows, setRows, locked }: any) {
  return <div className="rows richRows"><div className="rowLabels"><span>Price Label</span><span>Billing Type</span><span>Amount (Dhs)</span><span>No VAT</span><span>Applies To</span></div>{rows.map((row: any, index: number) => <div className="priceRow" key={`${row.label}-${index}`}><input disabled={locked} value={row.label || ''} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder="Standard Seat Price" /><select disabled={locked} value={row.billing_type || 'per_seat'} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, billing_type: event.target.value } : item))}><option value="per_seat">Per Seat</option><option value="flat">Flat</option><option value="corporate">Corporate</option></select><input disabled={locked} type="number" value={row.amount_dhs || 0} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, amount_dhs: Number(event.target.value) } : item))} /><select disabled={locked} value={row.tax_rate ?? 0} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, tax_rate: 0, applies_to: item.applies_to || event.target.value } : item))}><option value={0}>No VAT applied</option></select><input disabled={locked} value={row.applies_to || ''} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, applies_to: event.target.value } : item))} placeholder="All participants" />{!locked ? <button onClick={() => setRows(rows.filter((_: any, itemIndex: number) => itemIndex !== index))}>×</button> : null}</div>)}{!locked ? <button className="linkBtn" onClick={() => setRows([...rows, { label: '', billing_type: 'per_seat', amount_dhs: 0, tax_rate: 0, applies_to: 'All participants' }])}>+ Add another price row</button> : null}</div>
}

function AddonRows({ rows, setRows, locked }: any) {
  return <div className="rows richRows">{rows.map((row: any, index: number) => <div className="addonRow" key={`${row.label}-${index}`}><input disabled={locked} value={row.label || ''} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder="Printed Workbook Pack" /><select disabled={locked} value={row.addon_type || 'service'} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, addon_type: event.target.value } : item))}><option value="service">Service</option><option value="physical">Physical</option><option value="digital">Digital</option></select><input disabled={locked} type="number" value={row.amount_dhs || 0} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, amount_dhs: Number(event.target.value) } : item))} /><select disabled={locked} value={row.optional_required || 'optional'} onChange={(event) => setRows(rows.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, optional_required: event.target.value } : item))}><option value="optional">Optional</option><option value="required">Required</option></select>{!locked ? <button onClick={() => setRows(rows.filter((_: any, itemIndex: number) => itemIndex !== index))}>×</button> : null}</div>)}{!locked ? <button className="linkBtn" onClick={() => setRows([...rows, { label: '', addon_type: 'service', amount_dhs: 0, optional_required: 'optional' }])}>+ Add add-on</button> : null}</div>
}

const styles = `
.premiumModal{width:min(1540px,98vw)!important;border:1px solid rgba(99,102,241,.22);box-shadow:0 40px 140px rgba(15,23,42,.42)!important}.premiumHeader{background:linear-gradient(135deg,#fff,#f5f7ff);border-bottom:1px solid #dfe6f4}.premiumBody{grid-template-columns:minmax(0,1fr) 340px!important}.premiumContent .panel,.panelCard,.kpi{background:linear-gradient(180deg,#fff,#fbfdff)}.modalIcon{width:42px;height:42px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:white;display:grid;place-items:center;font-size:21px}.modalTitleBlock{display:flex;gap:14px;align-items:center}.panel h3:before{content:"";display:inline-block;width:8px;height:8px;border-radius:999px;background:#6366f1;margin-right:8px}.priceRowsCard,.addonRowsCard,.basePriceCard,.premiumPrice{border:1px solid #dbeafe;background:linear-gradient(135deg,#ffffff,#f8fbff);border-radius:18px;padding:14px}.pricingMegaGrid{display:grid;grid-template-columns:1fr 2.15fr 1.15fr;gap:14px}.priceSummary.premiumPrice{background:linear-gradient(135deg,#eef2ff,#ecfeff);border-color:#a5b4fc}.priceSummary h4,.basePriceCard h4,.priceRowsCard h4,.addonRowsCard h4{margin:0 0 10px}.programRow{transition:.18s ease}.programRow:hover,.cohortCard:hover{transform:translateY(-2px);box-shadow:0 20px 44px rgba(15,23,42,.08)}
body{margin:0;background:#f5f7fb;color:#111827;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.academy-page{display:flex;min-height:100vh}.academy-sidebar{width:238px;background:rgba(255,255,255,.95);border-right:1px solid #e5eaf2;padding:22px 16px;position:sticky;top:0;height:100vh;box-sizing:border-box}.brand{display:flex;gap:12px;align-items:center;margin-bottom:22px}.brandMark{width:36px;height:36px;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#14b8a6);color:#fff;display:grid;place-items:center}.brand b{display:block}.brand small,.systemCard span{display:block;color:#64748b}.navTitle{font-size:11px;color:#4f46e5;letter-spacing:.14em;font-weight:900}.nav{display:flex;text-decoration:none;color:#111827;padding:10px 13px;border-radius:10px;font-weight:850;font-size:14px}.nav.active{background:#ede9fe;color:#5b21b6}.systemCard{position:absolute;left:16px;right:16px;bottom:20px;border:1px solid #e5eaf2;border-radius:16px;padding:14px;background:#fff}.systemCard em{font-style:normal;color:#16a34a;font-weight:900}.academy-main{flex:1;padding:24px 28px 70px}.commandTop{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:18px}.crumb{color:#64748b;font-weight:800;font-size:12px}.commandTop h1{font-size:30px;margin:6px 0 0;letter-spacing:-.03em}.commandTop h1 span{font-size:12px;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:5px 8px;vertical-align:middle}.commandTop p{margin:7px 0 0;color:#64748b;font-weight:700}.topActions{display:flex;gap:10px}.primaryBtn,.ghostBtn,.cardHead button,.actionGrid a,.actionGrid button,.toolbar button,.modalFooter button,.iconBtn,.systemCard button{border:1px solid #dbe3ef;background:#fff;border-radius:13px;padding:11px 15px;font-weight:900;color:#0f172a;text-decoration:none;cursor:pointer}.primaryBtn{background:linear-gradient(135deg,#6d5dfc,#2563eb);color:#fff;border-color:#6d5dfc}.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin:18px 0}.kpi{background:#fff;border:1px solid #e5eaf2;border-radius:20px;padding:17px;box-shadow:0 18px 45px rgba(15,23,42,.045);display:flex;gap:13px;position:relative;overflow:hidden}.kpiIcon{width:42px;height:42px;border-radius:14px;background:#eef2ff;color:#4f46e5;display:grid;place-items:center;font-weight:900}.kpi small{color:#64748b;font-weight:900}.kpi b{display:block;font-size:23px;margin:4px 0}.kpi em{font-style:normal;color:#16a34a;font-weight:850;font-size:12px}.kpi i{position:absolute;right:16px;bottom:16px;width:62px;height:24px;border-bottom:3px solid rgba(34,197,94,.45);border-radius:50%}.controlGrid{display:grid;grid-template-columns:1.45fr 1fr 1fr;gap:16px}.panelCard,.panel,.modalSummary{background:#fff;border:1px solid #e5eaf2;border-radius:22px;box-shadow:0 20px 55px rgba(15,23,42,.05)}.panelCard{padding:18px}.panelCard.wide{grid-row:span 2}.cardHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.cardHead h2{font-size:18px;margin:0}.cardHead p{margin:4px 0 0;color:#64748b;font-weight:700}.toolbar.embedded{margin:0 0 12px}.toolbar input{width:100%;border:1px solid #dbe3ef;border-radius:14px;padding:13px}.programTable{display:flex;flex-direction:column;gap:8px}.programRow{display:grid;grid-template-columns:1.55fr 1fr .7fr .6fr .8fr .6fr;gap:10px;align-items:center;border:1px solid #edf2f7;background:#fbfdff;border-radius:14px;padding:12px;text-align:left;cursor:pointer}.programRow b{display:block}.programRow small,.programRow span{color:#64748b}.programRow em{font-style:normal;background:#dcfce7;color:#166534;padding:6px 9px;border-radius:999px;font-weight:900;text-align:center}.empty,.mutedBox{padding:34px;text-align:center;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:18px;color:#64748b}.pathway{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.pathStep{border:1px solid #e5eaf2;border-radius:16px;padding:14px;background:#fbfdff}.pathStep b,.pathStep span,.pathStep small{display:block}.pathStep small{margin-top:12px;color:#16a34a;font-weight:900}.donut{width:160px;height:160px;border-radius:50%;background:conic-gradient(#5b3df5 0 67%,#14b8a6 67% 83%,#f97316 83% 100%);display:grid;place-items:center;margin:auto;position:relative}.donut:after{content:"";position:absolute;inset:28px;background:#fff;border-radius:50%}.donut strong,.donut span{position:relative;z-index:1;text-align:center}.donut strong{font-size:19px}.donut span{font-size:11px;color:#64748b}.summaryLine{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #edf2f7;padding:10px 0}.summaryLine span{color:#64748b}.trainerMiniList{display:grid;gap:9px}.trainerMiniList div{border:1px solid #edf2f7;border-radius:14px;padding:11px}.trainerMiniList small{display:block;color:#64748b}.actionGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.actionGrid a,.actionGrid button{text-align:center}.modalBackdrop{position:fixed;inset:0;background:rgba(15,23,42,.52);z-index:50;display:grid;place-items:center;padding:18px}.megaModal{width:min(1780px,99vw);max-height:96vh;overflow:auto;background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%);border-radius:32px;border:1px solid rgba(148,163,184,.38);box-shadow:0 42px 140px rgba(15,23,42,.38)}.modalHeader,.modalFooter{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:24px 30px;border-bottom:1px solid #e5eaf2}.modalFooter{border-top:1px solid #e5eaf2;border-bottom:0;justify-content:flex-end;background:#fbfdff;position:sticky;bottom:0}.modalTitleBlock{display:flex;align-items:flex-start;gap:14px}.modalIcon{width:44px;height:44px;border-radius:16px;background:linear-gradient(135deg,#ede9fe,#dbeafe);display:grid;place-items:center}.modalHeader h2{margin:0;font-size:25px;letter-spacing:-.02em}.modalHeader p{margin:4px 0 0;color:#64748b;font-weight:700}.refBox{display:flex;align-items:center;gap:10px;margin-left:auto}.refBox span{font-size:12px;font-weight:900;color:#64748b}.refBox input,.field input,.field select,.field textarea,.trainerToolbar select,.priceRow input,.priceRow select,.addonRow input,.addonRow select,.linkRow input{border:1px solid #dbe3ef;border-radius:12px;padding:11px;background:#fff;min-width:0}.iconBtn{font-size:22px;padding:7px 12px}.modalBody{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:24px;padding:24px 30px}.modalContent{display:flex;flex-direction:column;gap:15px}.panel{padding:16px}.panel h3{margin:0 0 13px;font-size:15px;display:flex;align-items:center;gap:8px}.panel h3 span{width:24px;height:24px;border-radius:8px;background:#4f46e5;color:#fff;display:grid;place-items:center;font-size:12px}.formGrid{display:grid;gap:11px}.formGrid.five{grid-template-columns:repeat(5,minmax(0,1fr))}.field{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:900;color:#334155}.field textarea{min-height:68px;grid-column:span 2}.splitRow{display:grid;grid-template-columns:1.15fr .85fr;gap:15px}.trainerToolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.trainerToolbar span{font-size:12px;color:#64748b;font-weight:900}.trainerCards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.trainerCard{position:relative;border:1px solid #e5eaf2;border-radius:16px;background:#fbfdff;padding:12px}.trainerCard span{width:32px;height:32px;border-radius:50%;background:#ede9fe;color:#5b21b6;display:grid;place-items:center;font-weight:900}.trainerCard b,.trainerCard small{display:block;margin-top:6px}.trainerCard small{color:#64748b}.trainerCard button,.linkRow button,.priceRow button,.addonRow button{border:0;background:#fee2e2;color:#dc2626;border-radius:9px;font-weight:900;cursor:pointer}.durationGrid{display:grid;grid-template-columns:.8fr .8fr 1.4fr;gap:11px}.hoursBox,.priceSummary,.summaryTotal{background:linear-gradient(135deg,#eef2ff,#faf5ff);border:1px solid #c4b5fd;border-radius:16px;padding:15px}.hoursBox b,.priceSummary strong,.summaryTotal b{display:block;color:#4f46e5;font-size:28px;margin:6px 0}.libraryGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.libraryCard{border:1px solid #e5eaf2;background:#fbfdff;border-radius:16px;padding:13px}.libraryHead{display:flex;gap:9px;align-items:flex-start;margin-bottom:9px}.libraryHead>span{width:35px;height:35px;border-radius:12px;background:#eef2ff;display:grid;place-items:center}.libraryHead b,.libraryHead small{display:block}.libraryHead small{color:#64748b}.linkRow{display:grid;grid-template-columns:.75fr 1fr auto;gap:7px;margin-top:7px}.linkBtn{border:0;background:transparent;color:#4f46e5;font-weight:900;margin-top:8px;cursor:pointer}.pricingMegaGrid{display:grid;grid-template-columns:220px minmax(0,1.7fr) minmax(0,1.15fr) 220px;gap:13px}.basePriceCard,.priceRowsCard,.addonRowsCard,.premiumPrice{border:1px solid #e5eaf2;border-radius:16px;padding:13px;background:#fbfdff}.basePriceCard h4,.priceRowsCard h4,.addonRowsCard h4,.premiumPrice h4{margin:0 0 10px}.rowLabels,.priceRow{display:grid;grid-template-columns:1.2fr .8fr .8fr .8fr 1fr auto;gap:7px;align-items:center}.rowLabels{font-size:11px;color:#64748b;font-weight:900}.priceRow,.addonRow{margin-bottom:7px}.addonRow{display:grid;grid-template-columns:1.2fr .8fr .8fr .8fr auto;gap:7px;align-items:center}.toggleMatrix{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.toggleMatrix label{display:flex;align-items:center;justify-content:space-between;border:1px solid #e5eaf2;padding:11px;border-radius:13px;text-transform:capitalize;background:#fbfdff}.modalSummary{padding:16px;height:max-content;position:sticky;top:0}.modalSummary h3{margin-top:0}.summaryTotal{margin:14px 0}.readiness{display:flex;align-items:center;justify-content:space-between;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:16px;padding:13px;margin-bottom:12px}.readiness strong{font-size:24px;color:#16a34a}.summaryChecks{display:grid;gap:7px;color:#16a34a;font-weight:850;font-size:12px}@media(max-width:1280px){.kpis,.controlGrid,.formGrid.five,.splitRow,.libraryGrid,.pricingMegaGrid,.toggleMatrix{grid-template-columns:1fr}.modalBody{grid-template-columns:1fr}.academy-sidebar{display:none}.programRow{grid-template-columns:1fr}.megaModal{width:98vw}.trainerCards{grid-template-columns:1fr 1fr}}

.academy-main{padding-top:118px}.commandTop{background:linear-gradient(135deg,#ffffff 0%,#eef2ff 58%,#ecfeff 100%);border:1px solid #dbeafe;border-radius:28px;padding:22px 24px;box-shadow:0 22px 60px rgba(15,23,42,.07)}.commandTop h1{font-size:38px}.academyKpiWall .kpi{min-height:92px;border:1px solid rgba(99,102,241,.16);background:linear-gradient(145deg,#fff,#f8fbff)}.programCommandMatrix{display:grid;grid-template-columns:minmax(0,1.8fr) repeat(3,minmax(0,.7fr));gap:16px;margin:18px 0}.heroCommandPanel,.miniOpsPanel,.deepPanel{border:1px solid #dbeafe;border-radius:28px;background:linear-gradient(135deg,#fff,#f8fbff);box-shadow:0 24px 70px rgba(15,23,42,.07);padding:22px}.heroCommandPanel{position:relative;overflow:hidden}.heroCommandPanel:before{content:"";position:absolute;right:-80px;top:-80px;width:220px;height:220px;border-radius:50%;background:linear-gradient(135deg,rgba(79,70,229,.22),rgba(20,184,166,.18))}.panelEyebrow{font-size:11px;letter-spacing:.16em;color:#4f46e5;font-weight:950}.heroCommandPanel h2{font-size:28px;margin:8px 0}.heroCommandPanel p{color:#475569;font-weight:750;max-width:760px}.commandPills{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}.commandPills span{background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:999px;padding:8px 12px;font-weight:900}.miniOpsPanel b{display:block;font-size:34px}.miniOpsPanel span{display:block;font-weight:950}.miniOpsPanel small{color:#64748b;font-weight:800}.miniOpsPanel.violet{background:linear-gradient(135deg,#f5f3ff,#fff)}.miniOpsPanel.teal{background:linear-gradient(135deg,#ecfeff,#fff)}.miniOpsPanel.amber{background:linear-gradient(135deg,#fff7ed,#fff)}.premiumControlGrid{grid-template-columns:minmax(0,1.35fr) minmax(0,.95fr) minmax(0,.95fr)}.panelCard{min-height:230px}.executionLayerGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}.deepPanel span{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:13px;background:#4f46e5;color:#fff;font-weight:950}.deepPanel h3{font-size:19px;margin:14px 0 8px}.deepPanel p{color:#64748b;font-weight:750}.modalBackdrop{z-index:999999 !important;align-items:flex-start !important;place-items:start center !important;padding:118px 14px 28px !important}.megaModal{width:min(2060px,99.4vw) !important;max-height:calc(100vh - 140px) !important;border-radius:34px !important}.modalBody{grid-template-columns:minmax(0,1fr) 410px !important}.modalHeader{padding:26px 34px !important}.modalHeader h2{font-size:32px !important}.formGrid.five{grid-template-columns:repeat(5,minmax(0,1fr))}.premiumContent .panel{border-radius:22px;background:linear-gradient(180deg,#fff,#fbfdff)}.libraryGrid{grid-template-columns:repeat(4,minmax(250px,1fr))}.pricingMegaGrid{grid-template-columns:260px minmax(0,2fr) minmax(0,1.3fr) 270px}.priceSummary,.hoursBox{box-shadow:inset 0 0 0 1px rgba(99,102,241,.16),0 18px 45px rgba(79,70,229,.08)}@media(max-width:1380px){.programCommandMatrix,.executionLayerGrid,.premiumControlGrid{grid-template-columns:1fr}.academy-main{padding-top:110px}.modalBody{grid-template-columns:1fr !important}.megaModal{width:99vw !important}.pricingMegaGrid,.libraryGrid{grid-template-columns:1fr}.formGrid.five{grid-template-columns:1fr 1fr}}
`
