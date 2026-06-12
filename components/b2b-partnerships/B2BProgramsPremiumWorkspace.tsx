'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BProgramsPremiumWorkspace.module.css'

type SectorKey = 'hospitality' | 'healthcare' | 'education' | 'corporate' | 'events'
type ViewMode = 'command' | 'library' | 'pipeline' | 'dossiers' | 'activation'
type ModalMode = 'create' | 'view' | 'edit' | null

type ProgramRecord = {
  id: string
  sector: SectorKey
  name: string
  status: string
  category: string
  icon: string
  targetPartners: string[]
  positioning: string
  executivePitch: string
  valueProposition: string
  services: string[]
  advantages: string[]
  operatingModel: string[]
  commercialModel: string
  rollout: string[]
  kpis: string[]
  activationAssets: string[]
  riskControls: string[]
  nextAction: string
  owner: string
  priority: string
  createdAt: string
}

const SECTORS: { key: SectorKey; label: string; icon: string; color: string; description: string }[] = [
  { key: 'hospitality', label: 'Hotels & Resorts', icon: '🏨', color: 'blue', description: 'Premium family experience programs for hotels, resorts, riads and serviced residences.' },
  { key: 'healthcare', label: 'Healthcare & Pediatrics', icon: '🏥', color: 'emerald', description: 'Trust-based family support programs for pediatric clinics, medical centers and family health partners.' },
  { key: 'education', label: 'Schools & Childcare', icon: '🎓', color: 'violet', description: 'Parent convenience, after-school, and family value programs for schools, crèches and educational groups.' },
  { key: 'corporate', label: 'Corporate Employers', icon: '🏢', color: 'amber', description: 'Employee-parent support, employer-brand and family concierge programs for companies and institutions.' },
  { key: 'events', label: 'Events & Venues', icon: '🎉', color: 'rose', description: 'Kids corner, family guest experience and premium child-care programs for events and reception venues.' },
]

const SEED_PROGRAMS: ProgramRecord[] = [
  ...[
    ['Family Stay Booster Program', 'Turn family guests into loyal repeat customers through premium child-care support.'],
    ['VIP Kids Concierge Program', 'A guest-relations program for high-value families requiring flexible child support.'],
    ['Resort Parents Freedom Pass', 'A premium add-on allowing parents to enjoy spa, dining and leisure while children are safely supported.'],
    ['Long Stay Family Support Desk', 'A structured service for expatriate, diplomatic and long-stay families.'],
    ['Wedding Guest Childcare Program', 'A hotel-led childcare add-on for weddings and private celebrations.'],
    ['Family Revenue Upsell Program', 'A commercial program to package ANGELCARE services into room and experience offers.'],
    ['Guest Recovery Family Support', 'A service recovery lever when family logistics create friction during a stay.'],
    ['Weekend Family Experience Pack', 'A weekend activation for Rabat, Salé, Harhoura and luxury leisure hotels.'],
    ['Hotel Staff Family Referral Program', 'Enable concierge and guest relations teams to refer families with clear standards.'],
    ['Premium Nanny-On-Call Partnership', 'A reliable on-demand ANGELCARE support model for hotel family requests.'],
  ].map((item, index) => makeProgram('hospitality', index, item[0], item[1])),

  ...[
    ['Pediatric Family Continuity Program', 'Extend the clinic’s trust after consultation through non-medical family support.'],
    ['Parent Relief Referral Program', 'A referral framework for parents needing safe and structured childcare help.'],
    ['Post-Visit Family Support Pack', 'A post-consultation support offer focused on routines, reassurance and family organization.'],
    ['Clinic Premium Family Desk', 'A value-added concierge desk for clinics serving premium family segments.'],
    ['Young Parents Guidance Program', 'Support young parents with education, routines and practical family organization.'],
    ['Pediatric Loyalty Family Club', 'A trust-building program for recurring clinic families.'],
    ['Emergency Parent Support Protocol', 'A non-medical emergency support framework for family logistics.'],
    ['Family Wellness Education Series', 'Parent workshops and family well-being activations co-branded with clinics.'],
    ['Doctor Referral Partnership Program', 'A compliant referral framework for pediatricians and family doctors.'],
    ['Healthcare Family Experience Upgrade', 'A corporate-level service experience program for private medical centers.'],
  ].map((item, index) => makeProgram('healthcare', index, item[0], item[1])),

  ...[
    ['After-School Premium Care Program', 'A structured after-school support offer for parents needing reliable continuity.'],
    ['Parent Convenience Partnership', 'A school-family service layer that solves daily parent logistics.'],
    ['Holiday Camp Support Program', 'A school-branded family support program during school holidays.'],
    ['School Events Kids Care Program', 'Child support and supervision for open days, galas and parent events.'],
    ['Premium Crèche Family Extension', 'Extended family service add-ons for crèches and early years centers.'],
    ['Family Loyalty Advantage Program', 'A school retention program built around parent convenience and family support.'],
    ['Expat Family Welcome Program', 'A family onboarding service for international families joining private schools.'],
    ['Safe Pick-Up Support Program', 'A structured support model around pickup, transitions and parent coordination.'],
    ['Parent Workshop Partnership', 'Education sessions around routines, autonomy and family organization.'],
    ['School Concierge Family Desk', 'A premium support desk for private school parents.'],
  ].map((item, index) => makeProgram('education', index, item[0], item[1])),

  ...[
    ['Employee Parent Relief Program', 'A corporate benefit reducing stress for employees with children.'],
    ['Emergency Childcare Benefit', 'A flexible backup childcare solution for urgent employee needs.'],
    ['Return-to-Work Parent Support', 'A family support offer for maternity/paternity return and productivity protection.'],
    ['Corporate Family Concierge', 'A premium HR benefit for high-value employees and managers.'],
    ['Working Parents Wellness Program', 'Work-life balance workshops and family support activations.'],
    ['Talent Retention Family Benefit', 'A high-impact employer-brand program for companies competing for talent.'],
    ['Call Center Parent Stability Program', 'A support model for shift-based employees with family constraints.'],
    ['Executive Family Support Pack', 'Discreet family support for executives and expatriate managers.'],
    ['Corporate Event Childcare Program', 'Childcare support for company galas, family days and seminars.'],
    ['HR Family Advantage Partnership', 'A scalable HR partnership with measurable retention and absenteeism impact.'],
  ].map((item, index) => makeProgram('corporate', index, item[0], item[1])),

  ...[
    ['Premium Kids Corner Program', 'A professional children’s area for weddings, galas and family events.'],
    ['Wedding Parents Freedom Program', 'A guest experience upgrade allowing parents to fully enjoy celebrations.'],
    ['Venue Family Add-On Program', 'A commercial add-on for reception venues and event spaces.'],
    ['Event Planner Childcare Alliance', 'A repeatable partnership model with wedding and event planners.'],
    ['Corporate Family Day Support', 'A childcare and animation support model for family corporate events.'],
    ['Luxury Reception Childcare Desk', 'A premium supervised child support desk for high-end receptions.'],
    ['Festival Family Comfort Program', 'A safe family support program for public or semi-private events.'],
    ['Private Dinner Family Support', 'A discreet childcare service for private dinners and VIP gatherings.'],
    ['Event Upsell Revenue Program', 'A revenue-generating childcare option for agencies and venues.'],
    ['Guest Experience Protection Program', 'A risk-control program reducing disruption and improving parent satisfaction.'],
  ].map((item, index) => makeProgram('events', index, item[0], item[1])),
]

function makeProgram(sector: SectorKey, index: number, name: string, pitch: string): ProgramRecord {
  const config = SECTORS.find((s) => s.key === sector)!
  const partnerMap: Record<SectorKey, string[]> = {
    hospitality: ['5-star hotels', 'resorts', 'riads', 'serviced residences', 'guest relations teams'],
    healthcare: ['pediatric clinics', 'private practices', 'medical centers', 'family doctors', 'healthcare groups'],
    education: ['private schools', 'crèches', 'language centers', 'clubs enfants', 'education groups'],
    corporate: ['banks', 'insurance firms', 'corporates', 'call centers', 'embassies', 'institutions'],
    events: ['venues', 'wedding planners', 'event agencies', 'caterers', 'private reception spaces'],
  }

  return {
    id: `${sector}-${index + 1}`,
    sector,
    name,
    status: index < 3 ? 'Ready to pitch' : index < 7 ? 'Strategic template' : 'Advanced concept',
    category: config.label,
    icon: config.icon,
    targetPartners: partnerMap[sector],
    positioning: `High-value ${config.label.toLowerCase()} partnership program designed to create measurable family experience differentiation.`,
    executivePitch: pitch,
    valueProposition: `ANGELCARE enables the partner to offer a premium, flexible and trusted family-support layer without building internal operational complexity. The program increases satisfaction, creates differentiation and unlocks new commercial conversations.`,
    services: [
      'Partner-branded service positioning',
      'ANGELCARE operational delivery framework',
      'Decision-maker presentation support',
      'Family experience journey design',
      'Service request intake and qualification',
      'Follow-up and satisfaction loop',
      'Monthly performance review',
    ],
    advantages: [
      'Differentiates the partner in a competitive market',
      'Solves a real family pain point with a structured offer',
      'Creates new value without heavy internal staffing',
      'Improves loyalty, satisfaction and perceived premium service',
      'Can be piloted quickly and scaled after validation',
    ],
    operatingModel: [
      'Phase 1 — Qualification: partner profile, decision maker, demand pattern and commercial fit',
      'Phase 2 — Pilot: limited launch with clear service scope, communication assets and feedback loop',
      'Phase 3 — Scale: standard operating protocol, partner staff briefing and monthly performance review',
      'Phase 4 — Optimization: refine services, pricing, scripts, objections and upsell opportunities',
    ],
    commercialModel: 'Pilot fee, referral model, monthly retainer, revenue share or bundled partner package depending on volume, sector and service depth.',
    rollout: [
      'Week 1: partner alignment and program adaptation',
      'Week 2: assets, scripts and internal briefing',
      'Week 3: pilot launch with selected service scope',
      'Week 4: performance review and scale decision',
    ],
    kpis: [
      'Qualified partner leads',
      'Program activations',
      'Family satisfaction score',
      'Repeat usage potential',
      'Partner referral rate',
      'Monthly revenue potential',
      'Operational incident rate',
    ],
    activationAssets: [
      'One-page partner pitch',
      'Decision-maker presentation',
      'WhatsApp/email outreach script',
      'Program landing copy',
      'FAQ and objections handling',
      'Internal partner briefing note',
    ],
    riskControls: [
      'Clear service scope and exclusions',
      'Partner approval before public communication',
      'Documented family request intake',
      'Escalation path for exceptional cases',
      'Monthly quality review',
    ],
    nextAction: 'Select target partner list, assign owner, customize pitch and schedule decision-maker presentation.',
    owner: 'B2B Partnerships',
    priority: index < 3 ? 'A' : index < 7 ? 'B' : 'C',
    createdAt: new Date().toISOString(),
  }
}

function emptyProgram(sector: SectorKey): ProgramRecord {
  const config = SECTORS.find((s) => s.key === sector)!
  return {
    id: `custom-${Date.now()}`,
    sector,
    name: '',
    status: 'Draft',
    category: config.label,
    icon: config.icon,
    targetPartners: [],
    positioning: '',
    executivePitch: '',
    valueProposition: '',
    services: [],
    advantages: [],
    operatingModel: [],
    commercialModel: '',
    rollout: [],
    kpis: [],
    activationAssets: [],
    riskControls: [],
    nextAction: '',
    owner: 'B2B Partnerships',
    priority: 'B',
    createdAt: new Date().toISOString(),
  }
}

function splitLines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

function joinLines(value: string[]) {
  return (value || []).join('\n')
}


function programReference(program: ProgramRecord) {
  return `ANG-PROG-${program.sector.toUpperCase()}-${program.priority}-${program.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}`
}

export default function B2BProgramsPremiumWorkspace() {
  const [sector, setSector] = useState<SectorKey>('hospitality')
  const [view, setView] = useState<ViewMode>('command')
  const [programs, setPrograms] = useState<ProgramRecord[]>(SEED_PROGRAMS)
  const [selectedProgram, setSelectedProgram] = useState<ProgramRecord | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [form, setForm] = useState<ProgramRecord>(emptyProgram('hospitality'))

  useEffect(() => {
    try {
      const saved = localStorage.getItem('angelcare:b2b-programs')
      if (saved) setPrograms(JSON.parse(saved))
    } catch {}
  }, [])

  function persist(next: ProgramRecord[]) {
    setPrograms(next)
    try { localStorage.setItem('angelcare:b2b-programs', JSON.stringify(next)) } catch {}
  }

  const sectorPrograms = useMemo(() => programs.filter((program) => program.sector === sector), [programs, sector])
  const currentSector = SECTORS.find((s) => s.key === sector)!

  const metrics = [
    { label: 'Programs', value: programs.length, helper: 'Total strategic dossiers', icon: '🧭' },
    { label: currentSector.label, value: sectorPrograms.length, helper: 'Current sector library', icon: currentSector.icon },
    { label: 'Ready to pitch', value: programs.filter((p) => p.status === 'Ready to pitch').length, helper: 'Immediate BD usage', icon: '🚀' },
    { label: 'Priority A', value: programs.filter((p) => p.priority === 'A').length, helper: 'High-conviction programs', icon: '🎯' },
    { label: 'Custom', value: programs.filter((p) => p.id.startsWith('custom-')).length, helper: 'User-created programs', icon: '✍️' },
  ]

  function openCreate(targetSector = sector) {
    const next = emptyProgram(targetSector)
    setForm(next)
    setSelectedProgram(null)
    setModalMode('create')
  }

  function openView(program: ProgramRecord) {
    setSelectedProgram(program)
    setForm(program)
    setModalMode('view')
  }

  function openEdit() {
    if (!selectedProgram) return
    setModalMode('edit')
  }

  function saveProgram() {
    const clean: ProgramRecord = {
      ...form,
      id: form.id || `custom-${Date.now()}`,
      icon: SECTORS.find((s) => s.key === form.sector)?.icon || '🧭',
      category: SECTORS.find((s) => s.key === form.sector)?.label || form.category,
      createdAt: form.createdAt || new Date().toISOString(),
    }

    const exists = programs.some((program) => program.id === clean.id)
    const next = exists ? programs.map((program) => program.id === clean.id ? clean : program) : [clean, ...programs]
    persist(next)
    setSelectedProgram(clean)
    setModalMode('view')
  }

  function deleteProgram() {
    if (!selectedProgram) return
    if (!window.confirm('Delete this program dossier?')) return

    persist(programs.filter((program) => program.id !== selectedProgram.id))
    setSelectedProgram(null)
    setModalMode(null)
  }

  function printProgramDossier() {
    const node = document.querySelector(`.${styles.programA4Document}`) as HTMLElement | null

    if (!node) {
      alert('A4 dossier is not ready. Open a program dossier first.')
      return
    }

    const printWindow = window.open('', '_blank', 'width=980,height=1200')
    if (!printWindow) {
      alert('Please allow popups to print the A4 program dossier.')
      return
    }

    printWindow.document.open()
    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${form.name || 'ANGELCARE Program Dossier'}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; font-family: Calibri, Arial, Helvetica, sans-serif; color: #111827; }
    .${styles.programA4Document} {
      width: 210mm !important;
      min-height: 297mm !important;
      max-width: none !important;
      margin: 0 auto !important;
      padding: 13mm 14mm !important;
      background: #fff !important;
      color: #111827 !important;
      box-shadow: none !important;
      border: 0 !important;
      font-family: Calibri, Arial, Helvetica, sans-serif !important;
    }
    .${styles.a4Header} {
      display: grid;
      grid-template-columns: 1fr 58mm;
      gap: 18px;
      border-bottom: 3px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .${styles.a4Brand} strong { display:block; font-size: 28px; letter-spacing: .16em; font-weight: 900; line-height: 1; }
    .${styles.a4Brand} span { display:block; margin-top: 6px; font-size: 12px; font-weight: 800; color:#1f2937; }
    .${styles.a4Brand} small { display:block; margin-top: 4px; font-size: 10px; color:#6b7280; line-height: 1.35; }
    .${styles.a4Ref} { border-left: 4px solid #111827; padding-left: 12px; }
    .${styles.a4Ref} span { display:block; font-size: 9px; color:#6b7280; font-weight:900; text-transform:uppercase; letter-spacing:.12em; }
    .${styles.a4Ref} strong { display:block; margin-top: 5px; font-size: 11px; line-height: 1.25; }
    .${styles.a4Ref} small { display:block; margin-top: 5px; font-size: 10px; color:#6b7280; }
    .${styles.a4TitleBlock} { margin: 10px 0 12px; padding-bottom: 10px; border-bottom: 1px solid #d1d5db; }
    .${styles.a4TitleBlock} span { display:inline-flex; background:#111827; color:white; padding: 5px 8px; font-size: 9px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; }
    .${styles.a4TitleBlock} h1 { margin: 9px 0 6px; font-size: 28px; line-height: .98; letter-spacing:-.035em; font-weight:900; }
    .${styles.a4TitleBlock} p { margin:0; font-size: 11.5px; color:#374151; line-height:1.45; max-width: 94%; }
    .${styles.a4MetaGrid} { display:grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin: 10px 0 12px; }
    .${styles.a4MetaGrid} article { border:1px solid #d1d5db; background:#f9fafb; padding: 8px; min-height: 58px; }
    .${styles.a4MetaGrid} span { display:block; font-size: 8.5px; color:#6b7280; font-weight:900; text-transform:uppercase; letter-spacing:.1em; margin-bottom:4px; }
    .${styles.a4MetaGrid} strong { display:block; font-size: 11px; color:#111827; line-height:1.2; }
    .${styles.a4Executive} { border-left: 5px solid #111827; background:#f3f4f6; padding: 10px 12px; margin: 10px 0 12px; }
    .${styles.a4Executive} h2, .${styles.a4Section} h2 { margin:0 0 5px; font-size: 13px; font-weight:900; color:#111827; }
    .${styles.a4Executive} p, .${styles.a4Section} p, .${styles.a4Section} li { font-size: 10.5px; line-height: 1.42; color:#374151; }
    .${styles.a4Executive} p, .${styles.a4Section} p { margin:0; }
    .${styles.a4TwoCol} { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .${styles.a4ThreeCol} { display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .${styles.a4Section} { border:1px solid #d1d5db; background:#fff; padding: 9px; break-inside: avoid; }
    .${styles.a4Section} ul, .${styles.a4Section} ol { margin: 4px 0 0; padding-left: 16px; }
    .${styles.a4Section} li { margin-bottom: 2px; }
    .${styles.a4Footer} { display:flex; justify-content:space-between; gap:18px; border-top:3px solid #111827; margin-top: 12px; padding-top: 8px; }
    .${styles.a4Footer} strong { display:block; font-size: 11px; font-weight:900; }
    .${styles.a4Footer} span { display:block; font-size: 8.8px; color:#6b7280; line-height:1.3; }
    .${styles.a4Footer} div:last-child { text-align:right; }
  </style>
</head>
<body>
  ${node.outerHTML}
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    }
  </script>
</body>
</html>`)
    printWindow.document.close()
  }

  function updateTextArray(key: keyof ProgramRecord, value: string) {
    setForm({ ...form, [key]: splitLines(value) } as ProgramRecord)
  }

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>B2B program domination OS</span>
          <h1>Partner programs, strategic dossiers & sector playbooks</h1>
          <p>Explore, customize and activate premium ANGELCARE partnership programs by sector, with detailed corporate dossiers, value creation logic, rollout models and commercial activation assets.</p>
        </div>

        <aside className={styles.heroCommand}>
          <span>Current sector</span>
          <strong>{currentSector.icon} {currentSector.label}</strong>
          <button type="button" onClick={() => openCreate()}>+ Add new program</button>
          <button type="button" onClick={() => setView('library')}>Open library</button>
        </aside>
      </section>

      <section className={styles.metrics}>
        {metrics.map((metric) => (
          <article key={metric.label}>
            <div>{metric.icon}</div>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className={styles.sectorNav}>
        {SECTORS.map((item) => (
          <button key={item.key} type="button" className={sector === item.key ? styles.activeSector : ''} onClick={() => setSector(item.key)}>
            <strong>{item.icon}</strong>
            <span>{item.label}</span>
          </button>
        ))}
      </section>

      <section className={styles.viewNav}>
        {(['command', 'library', 'pipeline', 'dossiers', 'activation'] as ViewMode[]).map((item) => (
          <button key={item} type="button" className={view === item ? styles.activeView : ''} onClick={() => setView(item)}>
            {item === 'command' ? 'Command Center' : item === 'library' ? 'Program Library' : item === 'pipeline' ? 'Pipeline View' : item === 'dossiers' ? 'Dossiers' : 'Activation Assets'}
          </button>
        ))}
      </section>

      <section className={styles.sectorBanner}>
        <div>
          <span>{currentSector.icon} Sector playbook</span>
          <h2>{currentSector.label}</h2>
          <p>{currentSector.description}</p>
        </div>
        <button type="button" onClick={() => openCreate(sector)}>Create {currentSector.label} program</button>
      </section>

      <section className={styles.layout}>
        <div className={styles.programPanel}>
          <div className={styles.panelHeader}>
            <span>{view === 'pipeline' ? 'Commercial pipeline' : view === 'activation' ? 'Activation-ready programs' : 'Program command library'}</span>
            <h2>{currentSector.label} programs</h2>
            <p>Each program is clickable and opens a full enterprise dossier with services, model, rollout, KPIs, risks and commercial activation assets.</p>
          </div>

          <div className={styles.programGrid}>
            {sectorPrograms.map((program) => (
              <article key={program.id} className={styles.programCard} onClick={() => openView(program)}>
                <div className={styles.programTop}>
                  <div>{program.icon}</div>
                  <span>{program.status}</span>
                </div>

                <h3>{program.name}</h3>
                <p>{program.executivePitch}</p>

                <div className={styles.chips}>
                  <span>Priority {program.priority}</span>
                  <span>{program.targetPartners[0] || 'Partner target'}</span>
                  <span>{program.owner}</span>
                </div>

                <div className={styles.programFooter}>
                  <button type="button" onClick={(event) => { event.stopPropagation(); openView(program) }}>Open dossier</button>
                  <strong>{program.nextAction || 'Ready to activate'}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className={styles.commandPanel}>
          <div className={styles.panelHeader}>
            <span>McKinsey-style program logic</span>
            <h2>Domination checklist</h2>
            <p>Winning programs should be clear, sector-specific, measurable and easy for a decision maker to approve.</p>
          </div>

          <div className={styles.commandList}>
            <article><div>🎯</div><h3>Sharp target</h3><p>Define the partner category, decision maker and economic pain point.</p></article>
            <article><div>💎</div><h3>Premium value</h3><p>Show why ANGELCARE improves family experience and partner differentiation.</p></article>
            <article><div>⚙️</div><h3>Operating model</h3><p>Explain pilot, rollout, governance, escalation and monthly review.</p></article>
            <article><div>📊</div><h3>Measurable KPIs</h3><p>Track activations, satisfaction, referrals, conversion and revenue potential.</p></article>
            <article><div>🚀</div><h3>Activation assets</h3><p>Prepare pitch, scripts, FAQ, objections and partner briefing materials.</p></article>
          </div>
        </aside>
      </section>

      {modalMode && (
        <div className={styles.modalBackdrop}>
          <section className={styles.programModal}>
            <div className={styles.modalHeader}>
              <div>
                <span>{modalMode === 'create' ? 'Create program dossier' : modalMode === 'edit' ? 'Edit program dossier' : 'Program enterprise dossier'}</span>
                <h2>{form.name || 'New ANGELCARE B2B Program'}</h2>
                <p>{SECTORS.find((s) => s.key === form.sector)?.label} · {form.status}</p>
              </div>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>

            {modalMode === 'view' ? (
              <div className={styles.dossierView}>
                <div className={styles.dossierMetrics}>
                  <article><span>Sector</span><strong>{form.category}</strong></article>
                  <article><span>Status</span><strong>{form.status}</strong></article>
                  <article><span>Priority</span><strong>{form.priority}</strong></article>
                  <article><span>Owner</span><strong>{form.owner}</strong></article>
                </div>

                <div className={styles.dossierGrid}>
                  <article><h3>Executive pitch</h3><p>{form.executivePitch}</p></article>
                  <article><h3>Positioning</h3><p>{form.positioning}</p></article>
                  <article><h3>Value proposition</h3><p>{form.valueProposition}</p></article>
                </div>

                <DossierSection title="Target partners" items={form.targetPartners} />
                <DossierSection title="Service scope" items={form.services} />
                <DossierSection title="Partner advantages" items={form.advantages} />
                <DossierSection title="Operating model" items={form.operatingModel} />
                <DossierSection title="Rollout roadmap" items={form.rollout} />
                <DossierSection title="Success KPIs" items={form.kpis} />
                <DossierSection title="Activation assets" items={form.activationAssets} />
                <DossierSection title="Risk controls" items={form.riskControls} />

                <div className={styles.dossierGrid}>
                  <article><h3>Commercial model</h3><p>{form.commercialModel}</p></article>
                  <article><h3>Next action</h3><p>{form.nextAction}</p></article>
                </div>

                <aside className={styles.programA4Preview}>
                  <div className={styles.programA4Document}>
                    <header className={styles.a4Header}>
                      <div className={styles.a4Brand}>
                        <strong>ANGELCARE</strong>
                        <span>Département Partenariats B2B & Programmes Stratégiques</span>
                        <small>Program dossier · Commercial strategy · Operating model · Activation assets</small>
                      </div>

                      <div className={styles.a4Ref}>
                        <span>Program reference</span>
                        <strong>{programReference(form)}</strong>
                        <small>{new Date().toLocaleDateString('fr-FR')}</small>
                      </div>
                    </header>

                    <section className={styles.a4TitleBlock}>
                      <span>Confidential strategic program dossier</span>
                      <h1>{form.name}</h1>
                      <p>{form.executivePitch}</p>
                    </section>

                    <section className={styles.a4MetaGrid}>
                      <article><span>Sector</span><strong>{form.category}</strong></article>
                      <article><span>Priority</span><strong>{form.priority}</strong></article>
                      <article><span>Status</span><strong>{form.status}</strong></article>
                      <article><span>Owner</span><strong>{form.owner}</strong></article>
                    </section>

                    <section className={styles.a4Executive}>
                      <h2>Executive summary</h2>
                      <p>{form.valueProposition}</p>
                    </section>

                    <div className={styles.a4TwoCol}>
                      <section className={styles.a4Section}>
                        <h2>Strategic positioning</h2>
                        <p>{form.positioning}</p>
                      </section>

                      <section className={styles.a4Section}>
                        <h2>Commercial model</h2>
                        <p>{form.commercialModel}</p>
                      </section>
                    </div>

                    <div className={styles.a4ThreeCol}>
                      <A4List title="Target partners" items={form.targetPartners.slice(0, 5)} />
                      <A4List title="Program services" items={form.services.slice(0, 5)} />
                      <A4List title="Partner advantages" items={form.advantages.slice(0, 5)} />
                    </div>

                    <div className={styles.a4TwoCol}>
                      <A4List title="Operating model" items={form.operatingModel.slice(0, 4)} ordered />
                      <A4List title="Rollout roadmap" items={form.rollout.slice(0, 4)} ordered />
                    </div>

                    <div className={styles.a4ThreeCol}>
                      <A4List title="Success KPIs" items={form.kpis.slice(0, 6)} />
                      <A4List title="Activation assets" items={form.activationAssets.slice(0, 6)} />
                      <A4List title="Risk controls" items={form.riskControls.slice(0, 5)} />
                    </div>

                    <section className={styles.a4Executive}>
                      <h2>Recommended next action</h2>
                      <p>{form.nextAction}</p>
                    </section>

                    <footer className={styles.a4Footer}>
                      <div>
                        <strong>ANGELCARE · B2B Strategic Programs</strong>
                        <span>Internal strategic dossier · Prepared for commercial activation and partner decision-making</span>
                      </div>
                      <div>
                        <span>{programReference(form)}</span>
                        <span>Single-page A4 dossier</span>
                      </div>
                    </footer>
                  </div>
                </aside>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setModalMode(null)}>Close</button>
                  <button type="button" onClick={openEdit}>Edit program</button>
                  <button type="button" className={styles.printButton} onClick={printProgramDossier}>Print A4 dossier</button>
                  <button type="button" className={styles.deleteButton} onClick={deleteProgram}>Delete</button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.formGrid}>
                  <label className={styles.fullField}>Program name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                  <label>Sector<select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value as SectorKey })}>{SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></label>
                  <label>Status<input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} /></label>
                  <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>A</option><option>B</option><option>C</option></select></label>
                  <label>Owner<input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></label>
                  <label className={styles.fullField}>Executive pitch<textarea value={form.executivePitch} onChange={(e) => setForm({ ...form, executivePitch: e.target.value })} /></label>
                  <label className={styles.fullField}>Positioning<textarea value={form.positioning} onChange={(e) => setForm({ ...form, positioning: e.target.value })} /></label>
                  <label className={styles.fullField}>Value proposition<textarea value={form.valueProposition} onChange={(e) => setForm({ ...form, valueProposition: e.target.value })} /></label>
                  <label className={styles.fullField}>Target partners<textarea value={joinLines(form.targetPartners)} onChange={(e) => updateTextArray('targetPartners', e.target.value)} /></label>
                  <label className={styles.fullField}>Services<textarea value={joinLines(form.services)} onChange={(e) => updateTextArray('services', e.target.value)} /></label>
                  <label className={styles.fullField}>Advantages<textarea value={joinLines(form.advantages)} onChange={(e) => updateTextArray('advantages', e.target.value)} /></label>
                  <label className={styles.fullField}>Operating model<textarea value={joinLines(form.operatingModel)} onChange={(e) => updateTextArray('operatingModel', e.target.value)} /></label>
                  <label className={styles.fullField}>Rollout roadmap<textarea value={joinLines(form.rollout)} onChange={(e) => updateTextArray('rollout', e.target.value)} /></label>
                  <label className={styles.fullField}>KPIs<textarea value={joinLines(form.kpis)} onChange={(e) => updateTextArray('kpis', e.target.value)} /></label>
                  <label className={styles.fullField}>Activation assets<textarea value={joinLines(form.activationAssets)} onChange={(e) => updateTextArray('activationAssets', e.target.value)} /></label>
                  <label className={styles.fullField}>Risk controls<textarea value={joinLines(form.riskControls)} onChange={(e) => updateTextArray('riskControls', e.target.value)} /></label>
                  <label className={styles.fullField}>Commercial model<textarea value={form.commercialModel} onChange={(e) => setForm({ ...form, commercialModel: e.target.value })} /></label>
                  <label className={styles.fullField}>Next action<textarea value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} /></label>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setModalMode(null)}>Cancel</button>
                  <button type="button" onClick={saveProgram}>{modalMode === 'create' ? 'Create program' : 'Save changes'}</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

function DossierSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className={styles.dossierSection}>
      <h3>{title}</h3>
      <div>{items.map((item) => <span key={item}>{item}</span>)}</div>
    </section>
  )
}


function A4List({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul'

  return (
    <section className={styles.a4Section}>
      <h2>{title}</h2>
      <Tag>
        {(items || []).map((item) => <li key={item}>{item}</li>)}
      </Tag>
    </section>
  )
}
