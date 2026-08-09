'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type Partner = {
  id: string
  name: string
  city: string
  segment: string
  owner: string
  stage: string
  plan: string
  mrr: number
  health: number
  participants: number
  documents: number
  billing: string
  renewal: string
  risk: string
}

type DossierData = {
  organization?: Record<string, any> | null
  rows?: Record<string, Record<string, any>[]>
  counts?: Record<string, number>
  warnings?: string[]
  score?: {
    health?: number
    revenue_mad?: number
    conversion?: number
    certification?: number
    proof_readiness?: number
  }
}

type Props = {
  partner: Partner
  onClose: () => void
}

const tabs = [
  { key: 'overview', label: 'Vue 360', icon: '◉' },
  { key: 'commercial', label: 'Commercial & revenu', icon: '◆' },
  { key: 'delivery', label: 'Delivery formations', icon: '▣' },
  { key: 'team', label: 'Équipe & accès', icon: '●' },
  { key: 'proofs', label: 'Preuves & certificats', icon: '✦' },
  { key: 'requests', label: 'Demandes & SLA', icon: '✉' },
  { key: 'monetization', label: 'Plan & monétisation', icon: '↻' },
  { key: 'activity', label: 'Journal', icon: '◷' },
]

function fmt(value: unknown) {
  return new Intl.NumberFormat('fr-MA').format(Number(value || 0))
}

function money(value: unknown) {
  const n = Number(value || 0)
  if (n >= 1000) return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(n / 1000)} K MAD`
  return `${new Intl.NumberFormat('fr-MA').format(n)} MAD`
}

function dateLabel(value?: string) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return '—'
  }
}

export default function PartnerDossierMegaModal({ partner, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [dossier, setDossier] = useState<DossierData>({})
  const [loading, setLoading] = useState(true)
  const [actionOpen, setActionOpen] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    amount: '7200',
    participants: '10',
    sessionTitle: '',
    location: 'Site partenaire',
    requestTitle: '',
    documentTitle: '',
    notificationTitle: '',
    owner: partner.owner || '',
    stage: partner.stage || 'active',
    plan: partner.plan || 'Activation',
  })

  async function load() {
    setLoading(true)
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${partner.id}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (payload?.data) setDossier(payload.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [partner.id])

  const rows = dossier.rows || {}
  const counts = dossier.counts || {}
  const score = dossier.score || {}

  const snapshot = useMemo(() => [
    { label: 'Santé dossier', value: `${score.health ?? partner.health}/100`, note: 'qualité globale', tone: 'blue' },
    { label: 'Revenu lié', value: money(score.revenue_mad || partner.mrr || 0), note: 'commandes + factures + crédits', tone: 'green' },
    { label: 'Conversion', value: `${score.conversion || 0}%`, note: 'offres vers commandes', tone: 'violet' },
    { label: 'Certification', value: `${score.certification || 0}%`, note: 'participants certifiés', tone: 'cyan' },
  ], [partner.health, partner.mrr, score])

  async function runAction(action: string, payload: Record<string, any>) {
    setMessage('')
    setActionBusy(true)

    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${partner.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        setMessage(result?.message || result?.error || 'Action non finalisée.')
        return
      }
      setActionOpen(null)
      await load()
      setMessage('Action synchronisée avec succès.')
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div style={overlay}>
      <section style={modal}>
        <div style={ambientOne} />
        <div style={ambientTwo} />

        <header style={header}>
          <div style={identity}>
            <div style={avatar}>{partner.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <span style={eyebrow}>DOSSIER PARTENAIRE · TRAININGHUB 360</span>
              <h2>{partner.name}</h2>
              <p>{partner.city} · {partner.segment} · {partner.stage}</p>
            </div>
          </div>

          <div style={headerActions}>
            <button style={ghostButton} onClick={load}>{loading ? 'Lecture…' : 'Rafraîchir'}</button>
            <button style={primaryButton} onClick={() => setActionOpen('create_offer')}>Créer offre</button>
            <button style={closeButton} onClick={onClose}>×</button>
          </div>
        </header>

        {message ? <div style={successMessage}>{message}</div> : null}
        {dossier.warnings?.length ? <div style={warningMessage}>{dossier.warnings.slice(0, 2).join(' · ')}</div> : null}

        <div style={bodyGrid}>
          <aside style={leftRail}>
            <div style={partnerCard}>
              <div style={smallAvatar}>{partner.name.slice(0, 1).toUpperCase()}</div>
              <strong>{partner.name}</strong>
              <span>{partner.city}</span>
              <div style={healthTrack}><i style={{ width: `${Math.max(5, Math.min(100, Number(score.health ?? partner.health ?? 62)))}%` }} /></div>
              <small>Indice santé {score.health ?? partner.health}/100</small>
            </div>

            <nav style={tabNav}>
              {tabs.map((tab) => (
                <button key={tab.key} style={activeTab === tab.key ? tabActive : tabButton} onClick={() => setActiveTab(tab.key)}>
                  <span>{tab.icon}</span>
                  <b>{tab.label}</b>
                </button>
              ))}
            </nav>

            <div style={quickBox}>
              <span style={eyebrow}>NEXT BEST ACTION</span>
              <button onClick={() => setActionOpen('create_offer')}>Structurer une offre</button>
              <button onClick={() => setActionOpen('plan_session')}>Planifier session</button>
              <button onClick={() => setActionOpen('publish_document')}>Publier preuve</button>
              <button onClick={() => setActionOpen('create_request')}>Ouvrir demande</button>
            </div>
          </aside>

          <main style={content}>
            <section style={snapshotGrid}>
              {snapshot.map((item) => <ScoreCard key={item.label} {...item} />)}
            </section>

            {activeTab === 'overview' ? (
              <div style={dashboardGrid}>
                <Panel title="Résumé exécutif" eyebrow="360">
                  <div style={summaryHero}>
                    <div>
                      <h3>{partner.name}</h3>
                      <p>Vue consolidée des revenus, formations, accès, preuves et demandes liées au partenariat.</p>
                    </div>
                    <Ring value={Number(score.health ?? partner.health ?? 62)} label="Santé" />
                  </div>
                </Panel>
                <Panel title="Chaîne active" eyebrow="WORKFLOW">
                  <Workflow counts={counts} />
                </Panel>
                <Panel title="Risques & alertes" eyebrow="GOUVERNANCE">
                  <RiskRow label="Risque commercial" value={partner.risk || 'Faible'} tone={partner.risk === 'Faible' ? 'green' : 'orange'} />
                  <RiskRow label="Facturation" value={partner.billing || 'À jour'} tone="green" />
                  <RiskRow label="Renouvellement" value={partner.renewal || 'À préparer'} tone="blue" />
                </Panel>
              </div>
            ) : null}

            {activeTab === 'commercial' ? (
              <div style={sectionGrid}>
                <Panel title="Offres" eyebrow="PIPELINE">
                  <List rows={rows.proposals} empty="Aucune offre ouverte." fields={['proposal_number', 'title', 'status']} />
                  <div style={panelActions}>
                    <button style={primaryButton} onClick={() => setActionOpen('create_offer')}>Créer offre</button>
                    <button style={ghostButton} onClick={() => setActionOpen('convert_offer')}>Convertir en commande</button>
                  </div>
                </Panel>
                <Panel title="Commandes & factures" eyebrow="REVENU">
                  <MetricLine label="Commandes" value={counts.orders || 0} width={70} />
                  <MetricLine label="Factures" value={counts.invoices || 0} width={45} />
                  <MetricLine label="Paiements" value={counts.payments || 0} width={35} />
                </Panel>
                <Panel title="Crédits formation" eyebrow="MONÉTISATION">
                  <List rows={rows.credits} empty="Aucun crédit formation." fields={['credit_type', 'status', 'quantity_available']} />
                </Panel>
              </div>
            ) : null}

            {activeTab === 'delivery' ? (
              <div style={sectionGrid}>
                <Panel title="Sessions planifiées" eyebrow="DELIVERY">
                  <List rows={rows.sessions} empty="Aucune session planifiée." fields={['session_code', 'title', 'status']} />
                  <div style={panelActions}>
                    <button style={primaryButton} onClick={() => setActionOpen('plan_session')}>Planifier session</button>
                    <button style={ghostButton} onClick={() => setActionOpen('validate_attendance')}>Valider présences</button>
                  </div>
                </Panel>
                <Panel title="Participants" eyebrow="ÉQUIPE FORMÉE">
                  <List rows={rows.participants} empty="Aucun participant." fields={['full_name', 'role', 'attendance_status']} />
                </Panel>
                <Panel title="Capacité & delivery" eyebrow="QUALITÉ">
                  <MetricLine label="Sessions" value={counts.sessions || 0} width={70} />
                  <MetricLine label="Participants" value={counts.participants || 0} width={55} />
                  <MetricLine label="Présences validées" value={score.certification || 0} width={Number(score.certification || 0)} />
                </Panel>
              </div>
            ) : null}

            {activeTab === 'team' ? (
              <div style={sectionGrid}>
                <Panel title="Utilisateurs & accès" eyebrow="PORTAIL PARTENAIRE">
                  <List rows={rows.memberships} empty="Aucun accès partenaire." fields={['role', 'status', 'created_at']} />
                  <div style={panelActions}>
                    <button style={ghostButton} onClick={() => setActionOpen('publish_notification')}>Notifier le partenaire</button>
                  </div>
                </Panel>
                <Panel title="Responsabilité interne" eyebrow="OWNER">
                  <FormLine label="Owner" value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} />
                  <FormLine label="Étape" value={form.stage} onChange={(value) => setForm({ ...form, stage: value })} />
                  <button style={primaryButton} onClick={() => runAction('update_partner', { owner: form.owner, stage: form.stage, plan: form.plan })}>Sauvegarder</button>
                </Panel>
              </div>
            ) : null}

            {activeTab === 'proofs' ? (
              <div style={sectionGrid}>
                <Panel title="Certificats" eyebrow="PREUVES">
                  <List rows={rows.certificates} empty="Aucun certificat." fields={['certificate_number', 'participant_name', 'status']} />
                  <div style={panelActions}>
                    <button style={primaryButton} onClick={() => setActionOpen('issue_certificates')}>Émettre certificats</button>
                  </div>
                </Panel>
                <Panel title="Documents publiés" eyebrow="KITS & PREUVES">
                  <List rows={rows.documents} empty="Aucun document publié." fields={['document_type', 'title', 'status']} />
                  <button style={primaryButton} onClick={() => setActionOpen('publish_document')}>Publier document</button>
                </Panel>
              </div>
            ) : null}

            {activeTab === 'requests' ? (
              <div style={sectionGrid}>
                <Panel title="Demandes partenaires" eyebrow="SLA">
                  <List rows={rows.requests} empty="Aucune demande ouverte." fields={['request_type', 'title', 'status']} />
                  <button style={primaryButton} onClick={() => setActionOpen('create_request')}>Créer demande</button>
                </Panel>
                <Panel title="Notifications" eyebrow="RELATION PARTENAIRE">
                  <List rows={rows.notifications} empty="Aucune notification." fields={['notification_type', 'title', 'status']} />
                  <button style={ghostButton} onClick={() => setActionOpen('publish_notification')}>Publier notification</button>
                </Panel>
              </div>
            ) : null}

            {activeTab === 'monetization' ? (
              <div style={sectionGrid}>
                <Panel title="Plan partenaire" eyebrow="BUSINESS MODEL">
                  <FormLine label="Plan" value={form.plan} onChange={(value) => setForm({ ...form, plan: value })} />
                  <MetricLine label="MRR actuel" value={money(partner.mrr || 0)} width={40} />
                  <MetricLine label="Prévision dossier" value={money(score.revenue_mad || 0)} width={65} />
                  <button style={primaryButton} onClick={() => runAction('update_partner', { plan: form.plan })}>Sauvegarder plan</button>
                </Panel>
                <Panel title="Leviers monétisation" eyebrow="UPSELL">
                  <ActionItem text="Abonnement partenaire TrainingHub" />
                  <ActionItem text="Pack crédits formation" />
                  <ActionItem text="Refresh annuel & renouvellement certificats" />
                  <ActionItem text="Preuves premium, documents, kits et reporting" />
                </Panel>
              </div>
            ) : null}

            {activeTab === 'activity' ? (
              <div style={sectionGrid}>
                <Panel title="Journal d’activité" eyebrow="AUDIT TRAIL">
                  <List rows={rows.activity} empty="Aucune activité enregistrée." fields={['event_type', 'title', 'created_at']} />
                </Panel>
              </div>
            ) : null}
          </main>
        </div>
      </section>

      {actionOpen ? (
        <div style={subOverlay}>
          <div style={subModal}>
            <div style={subHeader}>
              <div>
                <span style={eyebrow}>ACTION DOSSIER</span>
                <h3>{actionTitle(actionOpen)}</h3>
                <p>Action synchronisée dans la chaîne TrainingHub.</p>
              </div>
              <button style={closeButton} onClick={() => setActionOpen(null)}>×</button>
            </div>

            <ActionForm
              action={actionOpen}
              form={form}
              setForm={setForm}
              busy={actionBusy}
              onRun={(payload) => runAction(actionOpen, payload)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function actionTitle(action: string) {
  const map: Record<string, string> = {
    create_offer: 'Créer une offre partenaire',
    convert_offer: 'Convertir offre → commande → facture → crédits',
    plan_session: 'Planifier une session',
    validate_attendance: 'Valider les présences',
    issue_certificates: 'Émettre certificats',
    publish_document: 'Publier document / preuve',
    create_request: 'Créer demande partenaire',
    publish_notification: 'Publier notification',
  }
  return map[action] || 'Action dossier'
}

function ActionForm({ action, form, setForm, busy, onRun }: {
  action: string
  form: Record<string, string>
  setForm: (next: any) => void
  busy: boolean
  onRun: (payload: Record<string, any>) => void
}) {
  if (action === 'create_offer') {
    return (
      <div style={formGrid}>
        <Input label="Titre offre" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Pack TrainingHub Activation" />
        <Input label="Montant MAD" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
        <Input label="Participants" value={form.participants} onChange={(value) => setForm({ ...form, participants: value })} />
        <button style={primaryButton} disabled={busy} onClick={() => onRun({ title: form.title || 'Offre TrainingHub partenaire', amount: form.amount, participants: form.participants })}>
          {busy ? 'Synchronisation…' : 'Créer offre'}
        </button>
      </div>
    )
  }

  if (action === 'convert_offer') {
    return (
      <div style={formGrid}>
        <Input label="Montant MAD" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
        <Input label="Crédits à créer" value={form.participants} onChange={(value) => setForm({ ...form, participants: value })} />
        <button style={primaryButton} disabled={busy} onClick={() => onRun({ amount: form.amount, credits: form.participants })}>
          {busy ? 'Conversion…' : 'Convertir maintenant'}
        </button>
      </div>
    )
  }

  if (action === 'plan_session') {
    return (
      <div style={formGrid}>
        <Input label="Titre session" value={form.sessionTitle} onChange={(value) => setForm({ ...form, sessionTitle: value })} placeholder="Session TrainingHub" />
        <Input label="Lieu" value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
        <Input label="Capacité" value={form.participants} onChange={(value) => setForm({ ...form, participants: value })} />
        <button style={primaryButton} disabled={busy} onClick={() => onRun({ title: form.sessionTitle || 'Session TrainingHub', location: form.location, participants: form.participants })}>
          {busy ? 'Planification…' : 'Planifier session'}
        </button>
      </div>
    )
  }

  if (action === 'publish_document') {
    return (
      <div style={formGrid}>
        <Input label="Titre document" value={form.documentTitle} onChange={(value) => setForm({ ...form, documentTitle: value })} placeholder="Kit de preuves TrainingHub" />
        <button style={primaryButton} disabled={busy} onClick={() => onRun({ title: form.documentTitle || 'Kit de preuves TrainingHub' })}>
          {busy ? 'Publication…' : 'Publier preuve'}
        </button>
      </div>
    )
  }

  if (action === 'create_request') {
    return (
      <div style={formGrid}>
        <Input label="Titre demande" value={form.requestTitle} onChange={(value) => setForm({ ...form, requestTitle: value })} placeholder="Demande partenaire" />
        <button style={primaryButton} disabled={busy} onClick={() => onRun({ title: form.requestTitle || 'Demande partenaire' })}>
          {busy ? 'Création…' : 'Créer demande'}
        </button>
      </div>
    )
  }

  if (action === 'publish_notification') {
    return (
      <div style={formGrid}>
        <Input label="Titre notification" value={form.notificationTitle} onChange={(value) => setForm({ ...form, notificationTitle: value })} placeholder="Notification partenaire" />
        <button style={primaryButton} disabled={busy} onClick={() => onRun({ title: form.notificationTitle || 'Notification partenaire' })}>
          {busy ? 'Publication…' : 'Publier notification'}
        </button>
      </div>
    )
  }

  return (
    <div style={formGrid}>
      <button style={primaryButton} disabled={busy} onClick={() => onRun({})}>{busy ? 'Synchronisation…' : 'Exécuter action'}</button>
    </div>
  )
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label style={field}>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function FormLine({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Input label={label} value={value} onChange={onChange} />
}

function ScoreCard({ label, value, note, tone }: { label: string; value: ReactNode; note: string; tone: string }) {
  const icon = tone === 'green' ? '↗' : tone === 'violet' ? '◈' : tone === 'cyan' ? '✦' : '●'
  return (
    <article style={scoreCard}>
      <span style={tone === 'green' ? scoreIconGreen : tone === 'violet' ? scoreIconViolet : tone === 'cyan' ? scoreIconCyan : scoreIconBlue}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  )
}

function Panel({ title, eyebrow: eyebrowText, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section style={panel}>
      <span style={eyebrow}>{eyebrowText}</span>
      <h3>{title}</h3>
      <div style={panelBody}>{children}</div>
    </section>
  )
}

function Workflow({ counts }: { counts: Record<string, number> }) {
  const items = [
    ['Offres', counts.proposals || 0],
    ['Commandes', counts.orders || 0],
    ['Crédits', counts.credits || 0],
    ['Sessions', counts.sessions || 0],
    ['Certificats', counts.certificates || 0],
  ]
  return (
    <div style={workflow}>
      {items.map(([label, value], index) => (
        <div key={label} style={workflowItem}>
          <b>0{index + 1}</b>
          <strong>{label}</strong>
          <span>{value}</span>
        </div>
      ))}
    </div>
  )
}

function List({ rows, empty, fields }: { rows?: Record<string, any>[]; empty: string; fields: string[] }) {
  const items = Array.isArray(rows) ? rows.slice(0, 8) : []

  if (!items.length) {
    return <div style={emptyState}>{empty}</div>
  }

  return (
    <div style={list}>
      {items.map((row, index) => (
        <div key={row.id || index} style={listRow}>
          <div>
            <strong>{row[fields[0]] || row.title || row.name || `Ligne ${index + 1}`}</strong>
            <span>{row[fields[1]] || row.status || row.type || '—'}</span>
          </div>
          <em>{row[fields[2]] || row.created_at ? dateLabel(row[fields[2]] || row.created_at) : '—'}</em>
        </div>
      ))}
    </div>
  )
}

function RiskRow({ label, value, tone }: { label: string; value: ReactNode; tone: 'green' | 'orange' | 'blue' }) {
  return (
    <div style={riskRow}>
      <span>{label}</span>
      <strong style={tone === 'green' ? greenText : tone === 'orange' ? orangeText : blueText}>{value}</strong>
    </div>
  )
}

function MetricLine({ label, value, width }: { label: string; value: ReactNode; width: number }) {
  return (
    <div style={metricLine}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={metricTrack}><i style={{ width: `${Math.max(5, Math.min(100, width))}%` }} /></div>
    </div>
  )
}

function ActionItem({ text }: { text: string }) {
  return <div style={actionItem}>✦ <span>{text}</span></div>
}

function Ring({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div style={{ ...ring, background: `conic-gradient(#6ee7b7 ${safe * 3.6}deg, #e7eef9 0deg)` }}>
      <div style={ringInner}>
        <strong>{Math.round(safe)}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 140, padding: 28, background: 'rgba(8,18,38,.58)', backdropFilter: 'blur(14px)', display: 'grid', placeItems: 'center' }
const modal: CSSProperties = { position: 'relative', overflow: 'hidden', width: 'min(1680px, calc(100vw - 44px))', height: 'min(920px, calc(100vh - 44px))', display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 16, padding: 26, borderRadius: 36, background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 55%,#eef6ff 100%)', border: '1px solid rgba(221,231,246,.96)', boxShadow: '0 50px 120px rgba(5,16,36,.34)' }
const ambientOne: CSSProperties = { position: 'absolute', right: -140, top: -180, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(17,105,255,.15), transparent 64%)' }
const ambientTwo: CSSProperties = { position: 'absolute', left: -160, bottom: -220, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,214,201,.14), transparent 64%)' }
const header: CSSProperties = { position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', padding: 18, borderRadius: 26, background: 'rgba(255,255,255,.78)', border: '1px solid #dce7f6', boxShadow: '0 18px 44px rgba(17,42,88,.07)', backdropFilter: 'blur(18px)' }
const identity: CSSProperties = { display: 'grid', gridTemplateColumns: '72px 1fr', gap: 16, alignItems: 'center' }
const avatar: CSSProperties = { width: 72, height: 72, display: 'grid', placeItems: 'center', borderRadius: 24, color: '#0d4cb7', background: 'linear-gradient(135deg,#e8f1ff,#dbeafe)', fontSize: 26, fontWeight: 950 }
const eyebrow: CSSProperties = { color: '#1169ff', fontWeight: 950, letterSpacing: '.16em', fontSize: 12, textTransform: 'uppercase' }
const headerActions: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }
const primaryButton: CSSProperties = { border: 0, color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', borderRadius: 16, padding: '13px 17px', fontWeight: 950, boxShadow: '0 16px 30px rgba(17,105,255,.24)', cursor: 'pointer' }
const ghostButton: CSSProperties = { border: '1px solid #d9e5f6', color: '#16406f', background: '#fff', borderRadius: 16, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' }
const closeButton: CSSProperties = { width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 18, border: '1px solid #d9e5f6', background: '#fff', color: '#0b1733', fontSize: 28, fontWeight: 950, cursor: 'pointer' }
const successMessage: CSSProperties = { position: 'relative', zIndex: 1, padding: 12, borderRadius: 16, background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', fontWeight: 900 }
const warningMessage: CSSProperties = { position: 'relative', zIndex: 1, padding: 12, borderRadius: 16, background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', fontWeight: 900 }
const bodyGrid: CSSProperties = { position: 'relative', zIndex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '330px minmax(0,1fr)', gap: 18 }
const leftRail: CSSProperties = { minHeight: 0, overflow: 'auto', display: 'grid', alignContent: 'start', gap: 16 }
const partnerCard: CSSProperties = { display: 'grid', placeItems: 'center', textAlign: 'center', gap: 8, padding: 18, borderRadius: 28, color: '#fff', background: 'radial-gradient(circle at 20% 0%, rgba(110,231,183,.28), transparent 34%), linear-gradient(135deg,#09265e,#1169ff)', boxShadow: '0 26px 60px rgba(17,105,255,.22)' }
const smallAvatar: CSSProperties = { width: 60, height: 60, display: 'grid', placeItems: 'center', borderRadius: 20, background: 'rgba(255,255,255,.18)', fontWeight: 950, fontSize: 22 }
const healthTrack: CSSProperties = { width: '100%', height: 10, borderRadius: 99, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }
const tabNav: CSSProperties = { display: 'grid', gap: 8 }
const tabButton: CSSProperties = { minHeight: 50, display: 'grid', gridTemplateColumns: '32px 1fr', alignItems: 'center', gap: 10, padding: '0 12px', borderRadius: 16, border: '1px solid #dce7f6', color: '#425872', background: '#fff', textAlign: 'left', fontWeight: 900, cursor: 'pointer' }
const tabActive: CSSProperties = { ...tabButton, color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', boxShadow: '0 18px 34px rgba(17,105,255,.22)' }
const quickBox: CSSProperties = { display: 'grid', gap: 9, padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dce7f6' }
const content: CSSProperties = { minHeight: 0, overflow: 'auto', display: 'grid', alignContent: 'start', gap: 16, paddingRight: 6 }
const snapshotGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const scoreCard: CSSProperties = { minHeight: 118, display: 'grid', gridTemplateColumns: '54px 1fr', gap: 12, alignItems: 'center', padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 16px 32px rgba(17,42,88,.055)' }
const scoreIconBase: CSSProperties = { width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 18, fontWeight: 950 }
const scoreIconBlue: CSSProperties = { ...scoreIconBase, background: '#e8f1ff', color: '#1169ff' }
const scoreIconGreen: CSSProperties = { ...scoreIconBase, background: '#ecfdf5', color: '#059669' }
const scoreIconViolet: CSSProperties = { ...scoreIconBase, background: '#f5f3ff', color: '#7c3aed' }
const scoreIconCyan: CSSProperties = { ...scoreIconBase, background: '#ecfeff', color: '#0891b2' }
const dashboardGrid: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14 }
const sectionGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const panel: CSSProperties = { minHeight: 300, display: 'grid', alignContent: 'start', gap: 14, padding: 18, borderRadius: 24, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 16px 32px rgba(17,42,88,.055)' }
const panelBody: CSSProperties = { display: 'grid', gap: 12 }
const summaryHero: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16, alignItems: 'center' }
const ring: CSSProperties = { width: 112, height: 112, padding: 9, borderRadius: '50%', display: 'grid', placeItems: 'center' }
const ringInner: CSSProperties = { width: '100%', height: '100%', borderRadius: '50%', display: 'grid', placeItems: 'center', textAlign: 'center', background: '#fff', color: '#0b1733', boxShadow: 'inset 0 0 0 1px #dce7f6' }
const workflow: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 8 }
const workflowItem: CSSProperties = { minHeight: 90, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 10, borderRadius: 16, background: '#f8fbff', border: '1px solid #e1e9f6', color: '#0d4cb7' }
const riskRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '12px 0', borderBottom: '1px solid #edf2fa', fontWeight: 900 }
const greenText: CSSProperties = { color: '#059669' }
const orangeText: CSSProperties = { color: '#ea580c' }
const blueText: CSSProperties = { color: '#1169ff' }
const list: CSSProperties = { display: 'grid', gap: 9 }
const listRow: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: 12, borderRadius: 16, background: '#f8fbff', border: '1px solid #e1e9f6' }
const emptyState: CSSProperties = { minHeight: 110, display: 'grid', placeItems: 'center', borderRadius: 18, color: '#63748c', background: '#f8fbff', border: '1px dashed #cbd8ec', fontWeight: 850 }
const panelActions: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const metricLine: CSSProperties = { display: 'grid', gap: 8 }
const metricTrack: CSSProperties = { height: 10, borderRadius: 99, background: '#e7eef8', overflow: 'hidden' }
const actionItem: CSSProperties = { padding: 12, borderRadius: 16, background: '#f8fbff', border: '1px solid #e1e9f6', color: '#0d4cb7', fontWeight: 900 }
const subOverlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 180, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(8,18,38,.45)', backdropFilter: 'blur(8px)' }
const subModal: CSSProperties = { width: 'min(780px,100%)', display: 'grid', gap: 16, padding: 24, borderRadius: 30, background: '#fff', boxShadow: '0 44px 100px rgba(8,18,38,.28)' }
const subHeader: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }
const formGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, alignItems: 'end' }
const field: CSSProperties = { display: 'grid', gap: 8, fontWeight: 900, color: '#243955' }
const modalGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const modalTile: CSSProperties = { minHeight: 100, display: 'grid', alignContent: 'center', gap: 8, padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6' }
