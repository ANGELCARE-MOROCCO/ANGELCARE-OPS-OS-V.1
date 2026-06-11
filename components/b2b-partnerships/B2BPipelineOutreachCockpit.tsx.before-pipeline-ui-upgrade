'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BPipelineOutreachCockpit.module.css'

type Workspace = 'pipeline' | 'outreach'
type ProspectStatus =
  | 'New'
  | 'Contacted'
  | 'No Response'
  | 'Interested'
  | 'Meeting Booked'
  | 'Meeting Done'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Pilot Agreed'
  | 'Signed Partner'
  | 'Not Fit'
  | 'Follow Up Later'
  | 'Lost'

type Prospect = {
  id: string
  name: string
  sector?: string | null
  city?: string | null
  status?: ProspectStatus | string | null
  priority_score?: 'A' | 'B' | 'C' | string | null
  relationship_warmth?: string | null
  assigned_owner_id?: string | null
  decision_maker_name?: string | null
  decision_maker_role?: string | null
  decision_maker_email?: string | null
  decision_maker_phone?: string | null
  potential_service_fit?: string | null
  pain_points?: string | null
  opportunity_description?: string | null
  estimated_monthly_value?: number | string | null
  estimated_annual_value?: number | string | null
  next_action?: string | null
  last_contact_at?: string | null
  next_follow_up_at?: string | null
  created_at?: string | null
}

type OutreachLog = {
  id: string
  prospect_id: string
  channel?: string | null
  template_key?: string | null
  subject?: string | null
  message_body?: string | null
  outcome?: string | null
  sent_at?: string | null
  next_follow_up_at?: string | null
  prospect?: { name?: string | null; city?: string | null; sector?: string | null } | null
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

const STATUSES: ProspectStatus[] = [
  'New',
  'Contacted',
  'No Response',
  'Interested',
  'Meeting Booked',
  'Meeting Done',
  'Proposal Sent',
  'Negotiation',
  'Pilot Agreed',
  'Signed Partner',
  'Not Fit',
  'Follow Up Later',
  'Lost',
]

const PIPELINE_GROUPS: Array<{ title: string; statuses: ProspectStatus[]; accent: string; description: string }> = [
  { title: 'Prospection', statuses: ['New', 'Contacted', 'No Response'], accent: 'blue', description: 'Identification, premier contact et relance initiale.' },
  { title: 'Qualification', statuses: ['Interested', 'Meeting Booked', 'Meeting Done'], accent: 'amber', description: 'Décideur identifié, besoin validé, réunion structurée.' },
  { title: 'Commercial', statuses: ['Proposal Sent', 'Negotiation'], accent: 'purple', description: 'Proposition, objection, pricing, validation interne.' },
  { title: 'Conversion', statuses: ['Pilot Agreed', 'Signed Partner'], accent: 'green', description: 'Pilote, signature, onboarding et lancement opérationnel.' },
  { title: 'Sortie contrôlée', statuses: ['Not Fit', 'Follow Up Later', 'Lost'], accent: 'slate', description: 'Non pertinent, à réactiver, ou perdu avec raison.' },
]

const HOTEL_TEMPLATE = `Bonjour [Nom],\n\nJe me permets de vous contacter au nom d’ANGELCARE, une structure spécialisée dans les solutions d’accompagnement, d’animation et de services dédiés aux enfants et aux familles.\n\nNous développons actuellement des partenariats avec des hôtels souhaitant renforcer leur expérience client familiale à travers des services tels que l’accompagnement enfants, l’animation ludique, le support kids club, la garde encadrée, les activités éducatives et les solutions événementielles pour familles.\n\nSeriez-vous disponible pour un court échange cette semaine afin d’explorer une collaboration possible ?\n\nBien cordialement,\nANGELCARE`;

const CLINIC_TEMPLATE = `Bonjour [Nom],\n\nJe vous contacte au nom d’ANGELCARE, une structure dédiée aux solutions pour l’enfance, l’accompagnement familial et le développement de services autour de l’enfant.\n\nNous souhaitons développer des partenariats avec des cliniques pédiatriques et professionnels de santé afin de proposer un accompagnement complémentaire aux familles : orientation parentale, ateliers de développement, programmes éducatifs, support post-consultation et accompagnement structuré.\n\nSeriez-vous disponible pour un échange de 15 minutes cette semaine ?\n\nBien cordialement,\nANGELCARE`;

const CALL_SCRIPT = `Bonjour, je suis [Nom] de ANGELCARE.\n\nNous développons actuellement des partenariats avec des établissements comme le vôtre afin de proposer des solutions professionnelles autour de l’enfant, des familles et de l’expérience client.\n\nJe voulais simplement savoir qui serait la meilleure personne chez vous pour discuter d’un partenariat autour des services enfants / familles ?\n\nL’objectif n’est pas de vendre directement par téléphone, mais de proposer un court échange pour voir s’il y a un potentiel de collaboration.`;

function money(value: unknown) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '0 MAD'
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)
}

function dateLabel(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}

function isHotelSector(sector?: string | null) {
  return ['Hotel', 'Resort', 'Family hotel', 'Boutique hotel', 'Event venue'].includes(String(sector ?? ''))
}

function isClinicSector(sector?: string | null) {
  return ['Pediatric clinic', 'Pediatrician', 'Child development center', 'Orthophonist', 'Psychomotor specialist', 'Family wellness center'].includes(String(sector ?? ''))
}

function isOverdue(value?: string | null) {
  if (!value) return false
  return new Date(value).getTime() < Date.now()
}

async function readJson<T>(url: string): Promise<ApiResult<T>> {
  const res = await fetch(url, { cache: 'no-store' })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ok) return { ok: false, error: json?.error || `Request failed: ${res.status}` }
  return json
}

export default function B2BPipelineOutreachCockpit({ initialWorkspace = 'pipeline' }: { initialWorkspace?: Workspace }) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [outreach, setOutreach] = useState<OutreachLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<'all' | 'hotels' | 'clinics' | 'priority' | 'overdue'>('all')
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [stageModal, setStageModal] = useState<{ prospect: Prospect; nextStatus: ProspectStatus } | null>(null)
  const [outreachModal, setOutreachModal] = useState<Prospect | null>(null)
  const [callModal, setCallModal] = useState<Prospect | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    const [prospectRes, outreachRes] = await Promise.all([
      readJson<Prospect[]>('/api/b2b-partnerships/prospects'),
      readJson<OutreachLog[]>('/api/b2b-partnerships/outreach'),
    ])

    if (prospectRes.ok) setProspects(Array.isArray(prospectRes.data) ? prospectRes.data : [])
    else setError(prospectRes.error)

    if (outreachRes.ok) setOutreach(Array.isArray(outreachRes.data) ? outreachRes.data : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setWorkspace(initialWorkspace)
  }, [initialWorkspace])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prospects.filter((p) => {
      const text = [p.name, p.city, p.sector, p.status, p.decision_maker_name, p.next_action, p.potential_service_fit].join(' ').toLowerCase()
      if (q && !text.includes(q)) return false
      if (segment === 'hotels' && !isHotelSector(p.sector)) return false
      if (segment === 'clinics' && !isClinicSector(p.sector)) return false
      if (segment === 'priority' && p.priority_score !== 'A') return false
      if (segment === 'overdue' && !isOverdue(p.next_follow_up_at)) return false
      return true
    })
  }, [prospects, query, segment])

  const metrics = useMemo(() => {
    const priorityA = prospects.filter((p) => p.priority_score === 'A').length
    const overdue = prospects.filter((p) => isOverdue(p.next_follow_up_at)).length
    const negotiations = prospects.filter((p) => ['Negotiation', 'Proposal Sent'].includes(String(p.status))).length
    const signed = prospects.filter((p) => p.status === 'Signed Partner').length
    const value = prospects.reduce((sum, p) => sum + Number(p.estimated_monthly_value ?? 0), 0)
    const hot = prospects.filter((p) => p.relationship_warmth === 'Hot').length
    return { priorityA, overdue, negotiations, signed, value, hot }
  }, [prospects])

  async function updateStage(prospect: Prospect, nextStatus: ProspectStatus, reason?: string, nextAction?: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/b2b-partnerships/prospects/${prospect.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, reason, next_action: nextAction }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Unable to update stage')
      setToast(`Stage mis à jour : ${nextStatus}`)
      setStageModal(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stage update failed')
    } finally {
      setSaving(false)
    }
  }

  const stageCounts = useMemo(() => {
    const map = new Map<string, number>()
    prospects.forEach((p) => map.set(String(p.status || 'New'), (map.get(String(p.status || 'New')) || 0) + 1))
    return map
  }, [prospects])

  return (
    <main className={styles.shell}>
      {toast && <div className={styles.toast} onAnimationEnd={() => setToast(null)}>{toast}</div>}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>ANGELCARE B2B Growth OS</span>
          <h1>Pipeline & Outreach Cockpit</h1>
          <p>Un vrai poste de pilotage commercial pour transformer les hôtels, resorts, cliniques pédiatriques et centres de développement enfant en partenaires actifs ANGELCARE.</p>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.primaryBtn} onClick={() => setOutreachModal(filtered[0] || prospects[0] || null)}>Log outreach</button>
          <button className={styles.secondaryBtn} onClick={() => setCallModal(filtered[0] || prospects[0] || null)}>Log call</button>
          <button className={styles.secondaryBtn} onClick={() => setSegment('overdue')}>Open follow-ups</button>
          <button className={styles.secondaryBtn} onClick={load}>Refresh live data</button>
        </div>
      </section>

      {error && (
        <section className={styles.diagnostic}>
          <strong>Action required</strong>
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </section>
      )}

      <section className={styles.metricGrid}>
        <Metric label="Priority A" value={metrics.priorityA} hint="High-value accounts" />
        <Metric label="Overdue" value={metrics.overdue} hint="Follow-ups requiring action" danger={metrics.overdue > 0} />
        <Metric label="Negotiation" value={metrics.negotiations} hint="Commercial movement" />
        <Metric label="Signed" value={metrics.signed} hint="Converted partners" />
        <Metric label="Hot accounts" value={metrics.hot} hint="Relationship warmth" />
        <Metric label="Monthly pipeline" value={money(metrics.value)} hint="Estimated recurring value" />
      </section>

      <nav className={styles.workspaceSwitch}>
        <button className={workspace === 'pipeline' ? styles.activeSwitch : ''} onClick={() => setWorkspace('pipeline')}>Pipeline Board</button>
        <button className={workspace === 'outreach' ? styles.activeSwitch : ''} onClick={() => setWorkspace('outreach')}>Outreach Cockpit</button>
      </nav>

      <section className={styles.commandBar}>
        <div className={styles.searchBox}>
          <span>Search</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hotel, clinic, city, decision maker, next action..." />
        </div>
        <div className={styles.segments}>
          {[
            ['all', 'All accounts'],
            ['hotels', 'Hotels / Resorts'],
            ['clinics', 'Clinics / Child health'],
            ['priority', 'Priority A'],
            ['overdue', 'Overdue'],
          ].map(([key, label]) => (
            <button key={key} className={segment === key ? styles.segmentActive : ''} onClick={() => setSegment(key as any)}>{label}</button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className={styles.emptyState}><strong>Loading B2B cockpit...</strong><p>Synchronisation des prospects, actions, appels et relances.</p></section>
      ) : workspace === 'pipeline' ? (
        <PipelineView prospects={filtered} stageCounts={stageCounts} onOpen={setSelectedProspect} onStage={setStageModal} onOutreach={setOutreachModal} onCall={setCallModal} />
      ) : (
        <OutreachView prospects={filtered} outreach={outreach} onOutreach={setOutreachModal} onCall={setCallModal} onOpen={setSelectedProspect} />
      )}

      {selectedProspect && <ProspectPanel prospect={selectedProspect} onClose={() => setSelectedProspect(null)} onOutreach={setOutreachModal} onCall={setCallModal} onStage={setStageModal} />}
      {stageModal && <StageModal modal={stageModal} saving={saving} onClose={() => setStageModal(null)} onSave={updateStage} />}
      {outreachModal && <OutreachModal prospect={outreachModal} saving={saving} setSaving={setSaving} onClose={() => setOutreachModal(null)} onDone={load} setToast={setToast} setError={setError} />}
      {callModal && <CallModal prospect={callModal} saving={saving} setSaving={setSaving} onClose={() => setCallModal(null)} onDone={load} setToast={setToast} setError={setError} />}
    </main>
  )
}

function Metric({ label, value, hint, danger }: { label: string; value: string | number; hint: string; danger?: boolean }) {
  return <article className={`${styles.metricCard} ${danger ? styles.metricDanger : ''}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>
}

function PipelineView({ prospects, stageCounts, onOpen, onStage, onOutreach, onCall }: { prospects: Prospect[]; stageCounts: Map<string, number>; onOpen: (p: Prospect) => void; onStage: (m: { prospect: Prospect; nextStatus: ProspectStatus }) => void; onOutreach: (p: Prospect) => void; onCall: (p: Prospect) => void }) {
  if (!prospects.length) return <EnterpriseEmpty title="No accounts in this view" text="Start by creating hotel and pediatric clinic accounts from the CRM directory, then run outreach and move them through the pipeline." />

  return (
    <section className={styles.pipelineCanvas}>
      {PIPELINE_GROUPS.map((group) => {
        const cards = prospects.filter((p) => group.statuses.includes(String(p.status || 'New') as ProspectStatus))
        return (
          <div className={styles.pipelineColumn} data-accent={group.accent} key={group.title}>
            <header>
              <div><strong>{group.title}</strong><span>{group.description}</span></div>
              <em>{group.statuses.reduce((sum, s) => sum + (stageCounts.get(s) || 0), 0)}</em>
            </header>
            <div className={styles.stagePills}>{group.statuses.map((s) => <span key={s}>{s}</span>)}</div>
            <div className={styles.cardStack}>
              {cards.map((p) => <ProspectPipelineCard key={p.id} prospect={p} onOpen={onOpen} onStage={onStage} onOutreach={onOutreach} onCall={onCall} />)}
              {!cards.length && <div className={styles.columnEmpty}>No accounts in this lane.</div>}
            </div>
          </div>
        )
      })}
    </section>
  )
}

function ProspectPipelineCard({ prospect, onOpen, onStage, onOutreach, onCall }: { prospect: Prospect; onOpen: (p: Prospect) => void; onStage: (m: { prospect: Prospect; nextStatus: ProspectStatus }) => void; onOutreach: (p: Prospect) => void; onCall: (p: Prospect) => void }) {
  const status = String(prospect.status || 'New') as ProspectStatus
  const index = Math.max(0, STATUSES.indexOf(status))
  const nextStatus = STATUSES[Math.min(STATUSES.length - 1, index + 1)]
  return (
    <article className={styles.pipelineCard}>
      <div className={styles.cardTop}><span className={styles.priority}>{prospect.priority_score || 'B'}</span><span className={styles.sector}>{prospect.sector || 'Other'}</span></div>
      <button className={styles.cardTitle} onClick={() => onOpen(prospect)}>{prospect.name}</button>
      <p>{prospect.potential_service_fit || prospect.opportunity_description || 'No fit description yet.'}</p>
      <div className={styles.cardFacts}><span>{prospect.city || '—'}</span><span>{prospect.relationship_warmth || 'Cold'}</span><span>{money(prospect.estimated_monthly_value)}</span></div>
      <div className={styles.nextLine} data-overdue={isOverdue(prospect.next_follow_up_at)}><strong>Next:</strong> {prospect.next_action || 'Define next action'} · {dateLabel(prospect.next_follow_up_at)}</div>
      <div className={styles.cardActions}>
        <button onClick={() => onStage({ prospect, nextStatus })}>Move</button>
        <button onClick={() => onOutreach(prospect)}>Outreach</button>
        <button onClick={() => onCall(prospect)}>Call</button>
      </div>
    </article>
  )
}

function OutreachView({ prospects, outreach, onOutreach, onCall, onOpen }: { prospects: Prospect[]; outreach: OutreachLog[]; onOutreach: (p: Prospect) => void; onCall: (p: Prospect) => void; onOpen: (p: Prospect) => void }) {
  const due = prospects.filter((p) => isOverdue(p.next_follow_up_at)).slice(0, 8)
  const priority = prospects.filter((p) => p.priority_score === 'A').slice(0, 8)
  return (
    <section className={styles.outreachLayout}>
      <aside className={styles.scriptPanel}>
        <span className={styles.eyebrow}>Execution scripts</span>
        <h2>Call script</h2>
        <pre>{CALL_SCRIPT}</pre>
        <h3>Hotel email</h3>
        <pre>{HOTEL_TEMPLATE}</pre>
        <h3>Pediatric clinic email</h3>
        <pre>{CLINIC_TEMPLATE}</pre>
      </aside>
      <section className={styles.outreachMain}>
        <div className={styles.queueGrid}>
          <Queue title="Follow-up queue" prospects={due} onOutreach={onOutreach} onCall={onCall} onOpen={onOpen} />
          <Queue title="Priority A accounts" prospects={priority} onOutreach={onOutreach} onCall={onCall} onOpen={onOpen} />
        </div>
        <div className={styles.tableCard}>
          <header><div><strong>Recent outreach</strong><span>Live communication log across email, WhatsApp, LinkedIn and calls.</span></div></header>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>Prospect</th><th>Channel</th><th>Outcome</th><th>Subject</th><th>Sent</th><th>Next follow-up</th></tr></thead>
              <tbody>{outreach.slice(0, 14).map((row) => <tr key={row.id}><td><strong>{row.prospect?.name || prospectName(prospects, row.prospect_id)}</strong><small>{row.prospect?.city || '—'}</small></td><td>{row.channel}</td><td><em>{row.outcome}</em></td><td>{row.subject || row.template_key || '—'}</td><td>{dateLabel(row.sent_at)}</td><td data-overdue={isOverdue(row.next_follow_up_at)}>{dateLabel(row.next_follow_up_at)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  )
}

function Queue({ title, prospects, onOutreach, onCall, onOpen }: { title: string; prospects: Prospect[]; onOutreach: (p: Prospect) => void; onCall: (p: Prospect) => void; onOpen: (p: Prospect) => void }) {
  return <div className={styles.queueCard}><header><strong>{title}</strong><span>{prospects.length} accounts</span></header>{prospects.length ? prospects.map((p) => <div className={styles.queueRow} key={p.id}><button onClick={() => onOpen(p)}>{p.name}<small>{p.city || '—'} · {p.sector || 'Other'}</small></button><div><button onClick={() => onOutreach(p)}>Message</button><button onClick={() => onCall(p)}>Call</button></div></div>) : <p className={styles.softText}>No account waiting in this queue.</p>}</div>
}

function ProspectPanel({ prospect, onClose, onOutreach, onCall, onStage }: { prospect: Prospect; onClose: () => void; onOutreach: (p: Prospect) => void; onCall: (p: Prospect) => void; onStage: (m: { prospect: Prospect; nextStatus: ProspectStatus }) => void }) {
  return <div className={styles.drawerBackdrop} onClick={onClose}><aside className={styles.drawer} onClick={(e) => e.stopPropagation()}><header><div><span className={styles.eyebrow}>Account command file</span><h2>{prospect.name}</h2><p>{prospect.city || '—'} · {prospect.sector || 'Other'} · {prospect.status || 'New'}</p></div><button onClick={onClose}>×</button></header><div className={styles.drawerActions}><button className={styles.primaryBtn} onClick={() => onOutreach(prospect)}>Log outreach</button><button className={styles.secondaryBtn} onClick={() => onCall(prospect)}>Log call</button><button className={styles.secondaryBtn} onClick={() => onStage({ prospect, nextStatus: 'Negotiation' })}>Move to negotiation</button></div><section className={styles.drawerGrid}><Info title="Decision maker" value={prospect.decision_maker_name || 'Not identified'} hint={prospect.decision_maker_role || prospect.decision_maker_email || 'Find and qualify the decision-maker.'} /><Info title="Service fit" value={prospect.potential_service_fit || 'Not mapped'} hint={prospect.pain_points || 'Clarify pain points, current family services and expected need.'} /><Info title="Revenue" value={money(prospect.estimated_monthly_value)} hint={`Annual: ${money(prospect.estimated_annual_value)}`} /><Info title="Next action" value={prospect.next_action || 'Missing'} hint={dateLabel(prospect.next_follow_up_at)} /></section><section className={styles.deepNotes}><h3>Execution intelligence</h3><p><strong>Opportunity:</strong> {prospect.opportunity_description || 'No opportunity description yet.'}</p><p><strong>Pain points:</strong> {prospect.pain_points || 'No pain points captured yet.'}</p></section></aside></div>
}

function Info({ title, value, hint }: { title: string; value: string; hint: string }) {
  return <article className={styles.infoCard}><span>{title}</span><strong>{value}</strong><small>{hint}</small></article>
}

function StageModal({ modal, saving, onClose, onSave }: { modal: { prospect: Prospect; nextStatus: ProspectStatus }; saving: boolean; onClose: () => void; onSave: (p: Prospect, status: ProspectStatus, reason?: string, nextAction?: string) => void }) {
  const [status, setStatus] = useState<ProspectStatus>(modal.nextStatus)
  const [reason, setReason] = useState('')
  const [nextAction, setNextAction] = useState(modal.prospect.next_action || '')
  const needsReason = ['Lost', 'Not Fit'].includes(status)
  return <div className={styles.modalBackdrop}><section className={styles.megaModal}><header><div><span className={styles.eyebrow}>Pipeline movement control</span><h2>Move {modal.prospect.name}</h2><p>Every stage change updates the CRM, activity timeline and audit trail.</p></div><button onClick={onClose}>×</button></header><div className={styles.modalGrid}><label><span>Target stage</span><select value={status} onChange={(e) => setStatus(e.target.value as ProspectStatus)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label><label><span>Next action</span><input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Example: send hotel partnership proposal" /></label><label className={styles.fullField}><span>{needsReason ? 'Reason required' : 'Stage note / internal reason'}</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Capture the business reason, decision context, objection or next commercial logic." /></label></div><footer><button className={styles.secondaryBtn} onClick={onClose}>Cancel</button><button className={styles.primaryBtn} disabled={saving || (needsReason && !reason.trim())} onClick={() => onSave(modal.prospect, status, reason, nextAction)}>{saving ? 'Saving...' : 'Confirm movement'}</button></footer></section></div>
}

function OutreachModal({ prospect, saving, setSaving, onClose, onDone, setToast, setError }: { prospect: Prospect; saving: boolean; setSaving: (v: boolean) => void; onClose: () => void; onDone: () => void; setToast: (v: string) => void; setError: (v: string | null) => void }) {
  const defaultTemplate = isHotelSector(prospect.sector) ? HOTEL_TEMPLATE : CLINIC_TEMPLATE
  const [channel, setChannel] = useState('Email')
  const [outcome, setOutcome] = useState('No response')
  const [subject, setSubject] = useState(isHotelSector(prospect.sector) ? 'Opportunité de partenariat expérience familiale' : `Collaboration ANGELCARE x ${prospect.name}`)
  const [message, setMessage] = useState(defaultTemplate)
  const [nextFollowUp, setNextFollowUp] = useState('')
  async function submit() {
    setSaving(true)
    try {
      const res = await fetch('/api/b2b-partnerships/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prospect_id: prospect.id, channel, outcome, subject, message_body: message, template_key: isHotelSector(prospect.sector) ? 'hotel_first_contact' : 'clinic_first_contact', next_follow_up_at: nextFollowUp || null }) })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Unable to log outreach')
      setToast('Outreach logged successfully')
      onClose(); onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to log outreach') } finally { setSaving(false) }
  }
  return <div className={styles.modalBackdrop}><section className={styles.megaModal}><header><div><span className={styles.eyebrow}>Large corporate outreach execution</span><h2>Log outreach — {prospect.name}</h2><p>Capture the channel, message, outcome, follow-up and commercial context.</p></div><button onClick={onClose}>×</button></header><div className={styles.modalGrid}><label><span>Channel</span><select value={channel} onChange={(e) => setChannel(e.target.value)}>{['Email','Phone','WhatsApp','LinkedIn','Instagram','In-person visit','Referral introduction'].map((x) => <option key={x}>{x}</option>)}</select></label><label><span>Outcome</span><select value={outcome} onChange={(e) => setOutcome(e.target.value)}>{['No response','Positive reply','Negative reply','Asked for info','Meeting booked','Wrong contact','Follow up later','Not interested'].map((x) => <option key={x}>{x}</option>)}</select></label><label><span>Next follow-up</span><input type="datetime-local" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} /></label><label className={styles.fullField}><span>Subject</span><input value={subject} onChange={(e) => setSubject(e.target.value)} /></label><label className={styles.fullField}><span>Message body</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} /></label></div><footer><button className={styles.secondaryBtn} onClick={onClose}>Cancel</button><button className={styles.primaryBtn} disabled={saving} onClick={submit}>{saving ? 'Saving...' : 'Log outreach'}</button></footer></section></div>
}

function CallModal({ prospect, saving, setSaving, onClose, onDone, setToast, setError }: { prospect: Prospect; saving: boolean; setSaving: (v: boolean) => void; onClose: () => void; onDone: () => void; setToast: (v: string) => void; setError: (v: string | null) => void }) {
  const [callResult, setCallResult] = useState('Decision maker reached')
  const [summary, setSummary] = useState('')
  const [objections, setObjections] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [nextFollowUp, setNextFollowUp] = useState('')
  async function submit() {
    setSaving(true)
    try {
      const res = await fetch('/api/b2b-partnerships/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prospect_id: prospect.id, call_type: 'partnership_development', call_result: callResult, summary, objections, decision_maker_identified: callResult === 'Decision maker reached', next_step: nextStep, next_follow_up_at: nextFollowUp || null }) })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Unable to log call')
      setToast('Call logged successfully')
      onClose(); onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to log call') } finally { setSaving(false) }
  }
  return <div className={styles.modalBackdrop}><section className={styles.megaModal}><header><div><span className={styles.eyebrow}>Call execution layer</span><h2>Log call — {prospect.name}</h2><p>Structure the phone conversation and convert it into a clear next action.</p></div><button onClick={onClose}>×</button></header><div className={styles.modalTwoCols}><aside className={styles.callScript}><h3>Call script</h3><pre>{CALL_SCRIPT}</pre></aside><div className={styles.modalGrid}><label><span>Call result</span><select value={callResult} onChange={(e) => setCallResult(e.target.value)}>{['No answer','Wrong number','Gatekeeper answered','Decision maker reached','Interested','Not interested','Meeting booked','Asked to send email','Follow up later'].map((x) => <option key={x}>{x}</option>)}</select></label><label><span>Next follow-up</span><input type="datetime-local" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} /></label><label className={styles.fullField}><span>Summary</span><textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What happened? Who answered? What was confirmed?" /></label><label className={styles.fullField}><span>Objections</span><textarea value={objections} onChange={(e) => setObjections(e.target.value)} placeholder="Pricing, timing, decision-maker unavailable, not relevant..." /></label><label className={styles.fullField}><span>Next step</span><input value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Example: send presentation and follow up Friday" /></label></div></div><footer><button className={styles.secondaryBtn} onClick={onClose}>Cancel</button><button className={styles.primaryBtn} disabled={saving} onClick={submit}>{saving ? 'Saving...' : 'Log call'}</button></footer></section></div>
}

function EnterpriseEmpty({ title, text }: { title: string; text: string }) {
  return <section className={styles.emptyState}><strong>{title}</strong><p>{text}</p><div><button>Open Prospect Directory</button><button>Import Accounts</button></div></section>
}

function prospectName(prospects: Prospect[], id: string) {
  return prospects.find((p) => p.id === id)?.name || 'Unknown prospect'
}
