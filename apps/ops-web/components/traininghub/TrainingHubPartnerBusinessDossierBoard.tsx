'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  accounts?: any[]
  subscriptions?: any[]
  proposals?: any[]
  orders?: any[]
  invoices?: any[]
  credits?: any[]
  sessions?: any[]
  participants?: any[]
  certificates?: any[]
  profiles?: any[]
  memberships?: any[]
  courses?: any[]
}

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function isPartner(org: any) {
  const type = normalize(org.organization_type)
  const name = normalize(org.name || org.legal_name || org.display_name)
  return !type.includes('internal') && !name.includes('smoke')
}

function money(amountMinor: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((Number(amountMinor) || 0) / 100)} MAD`
}

function amount(row: any) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || row.subtotal_minor || 0) || 0
}

function orgName(org: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Établissement partenaire')
}

function dateLabel(value: unknown) {
  if (!value) return 'Non défini'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(String(value)))
  } catch {
    return clean(value)
  }
}

function statusText(value: unknown, fallback = 'À suivre') {
  const status = normalize(value)
  if (status === 'active') return 'actif'
  if (status === 'draft') return 'brouillon'
  if (status === 'sent') return 'envoyée'
  if (status === 'accepted') return 'acceptée'
  if (status === 'converted_to_order') return 'convertie'
  if (status === 'confirmed') return 'confirmée'
  if (status === 'issued') return 'émise'
  if (status === 'paid') return 'payée'
  if (status === 'available') return 'disponible'
  if (status === 'planned') return 'planifiée'
  if (status === 'closed') return 'clôturée'
  return clean(value, fallback).replace(/_/g, ' ')
}

function stageFor(row: {
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits: any[]
  sessions: any[]
  certificates: any[]
}) {
  if (row.certificates.length) return 'Certifié'
  if (row.sessions.length) return 'Formation'
  if (row.credits.length) return 'Crédits activés'
  if (row.invoices.length) return 'Facturation'
  if (row.orders.length) return 'Commande'
  if (row.proposals.length) return 'Offre'
  return 'À activer'
}

function nextBestAction(stage: string) {
  if (stage === 'À activer') return 'Créer la première offre'
  if (stage === 'Offre') return 'Convertir l’accord'
  if (stage === 'Commande') return 'Émettre facture et crédits'
  if (stage === 'Facturation') return 'Activer la formation'
  if (stage === 'Crédits activés') return 'Planifier la session'
  if (stage === 'Formation') return 'Valider présence et certificats'
  return 'Préparer renouvellement'
}

function riskLevel(openInvoiceMinor: number, stage: string, sessions: any[], certificates: any[]) {
  if (openInvoiceMinor > 0 && ['Formation', 'Certifié'].includes(stage)) return 'Encaissement à suivre'
  if (stage === 'À activer') return 'Activation requise'
  if (sessions.length && !certificates.length) return 'Certification à finaliser'
  return 'Sous contrôle'
}

function score(row: {
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits: any[]
  sessions: any[]
  participants: any[]
  certificates: any[]
}) {
  return Math.min(
    100,
    Math.round(
      (row.proposals.length ? 15 : 0) +
        (row.orders.length ? 15 : 0) +
        (row.invoices.length ? 15 : 0) +
        (row.credits.length ? 15 : 0) +
        (row.sessions.length ? 15 : 0) +
        (row.participants.length ? 12 : 0) +
        (row.certificates.length ? 13 : 0),
    ),
  )
}

export default function TrainingHubPartnerBusinessDossierBoard({
  organizations,
  accounts = [],
  subscriptions = [],
  proposals = [],
  orders = [],
  invoices = [],
  credits = [],
  sessions = [],
  participants = [],
  certificates = [],
  profiles = [],
  memberships = [],
  courses = [],
}: Props) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const rows = useMemo(() => {
    return organizations.filter(isPartner).map((org) => {
      const orgId = org.id
      const rowProposals = proposals.filter((row) => row.organization_id === orgId)
      const rowOrders = orders.filter((row) => row.organization_id === orgId)
      const rowInvoices = invoices.filter((row) => row.organization_id === orgId)
      const rowCredits = credits.filter((row) => row.organization_id === orgId)
      const rowSessions = sessions.filter((row) => row.organization_id === orgId)
      const rowParticipants = participants.filter((row) => row.organization_id === orgId)
      const rowCertificates = certificates.filter((row) => row.organization_id === orgId)
      const rowAccounts = accounts.filter((row) => row.organization_id === orgId)
      const rowSubscriptions = subscriptions.filter((row) => row.organization_id === orgId)
      const rowMemberships = memberships.filter((row) => row.organization_id === orgId)
      const relatedProfileIds = new Set(rowMemberships.map((row) => row.user_id).filter(Boolean))
      const rowProfiles = profiles.filter((profile) => relatedProfileIds.has(profile.id))
      const openInvoiceMinor = rowInvoices
        .filter((invoice) => !['paid', 'settled', 'closed', 'cancelled'].includes(normalize(invoice.status)))
        .reduce((total, invoice) => total + amount(invoice), 0)
      const stage = stageFor({
        proposals: rowProposals,
        orders: rowOrders,
        invoices: rowInvoices,
        credits: rowCredits,
        sessions: rowSessions,
        certificates: rowCertificates,
      })
      return {
        org,
        accounts: rowAccounts,
        subscriptions: rowSubscriptions,
        proposals: rowProposals,
        orders: rowOrders,
        invoices: rowInvoices,
        credits: rowCredits,
        sessions: rowSessions,
        participants: rowParticipants,
        certificates: rowCertificates,
        memberships: rowMemberships,
        profiles: rowProfiles,
        openInvoiceMinor,
        stage,
        next: nextBestAction(stage),
        risk: riskLevel(openInvoiceMinor, stage, rowSessions, rowCertificates),
        score: score({
          proposals: rowProposals,
          orders: rowOrders,
          invoices: rowInvoices,
          credits: rowCredits,
          sessions: rowSessions,
          participants: rowParticipants,
          certificates: rowCertificates,
        }),
      }
    })
  }, [organizations, accounts, subscriptions, proposals, orders, invoices, credits, sessions, participants, certificates, profiles, memberships])

  const selected = rows.find((row) => row.org.id === selectedId) || rows[0]

  const filteredRows = rows.filter((row) => {
    const haystack = `${orgName(row.org)} ${row.org.city || ''} ${row.org.primary_contact_email || ''} ${row.org.phone || ''}`.toLowerCase()
    if (search && !haystack.includes(search.toLowerCase())) return false
    if (stageFilter !== 'all' && row.stage !== stageFilter) return false
    if (riskFilter !== 'all' && row.risk !== riskFilter) return false
    return true
  })

  const totalOpen = rows.reduce((total, row) => total + row.openInvoiceMinor, 0)
  const averageScore = rows.length ? Math.round(rows.reduce((total, row) => total + row.score, 0) / rows.length) : 0
  const stageOptions = Array.from(new Set(rows.map((row) => row.stage)))
  const riskOptions = Array.from(new Set(rows.map((row) => row.risk)))

  const defaultCourse = courses.find((course) => !['archived', 'inactive', 'disabled'].includes(normalize(course.status || course.publication_status))) || courses[0]

  async function run(url: string, body: Record<string, any>, success: string) {
    setBusy(body.action || url)
    setMessage(null)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error?.message || payload?.message || 'Action non finalisée.')
        return
      }
      setMessage(success)
      window.setTimeout(() => window.location.reload(), 850)
    } finally {
      setBusy(null)
    }
  }

  function selectedLatest<T extends any[]>(items: T) {
    return items[0]
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>DOSSIER PARTENAIRE • PILOTAGE 360</div>
          <h2 style={titleStyle}>Mega dossier commercial connecté</h2>
          <p style={textStyle}>
            Chaque établissement est suivi depuis l’ouverture du compte jusqu’à l’offre, la commande, la facturation, les crédits formation, la session, les participants et les certificats.
          </p>
        </div>
        <div style={scoreCardStyle}>
          <span>Maturité moyenne</span>
          <strong>{averageScore}/100</strong>
          <small>{rows.length} établissement(s) suivis</small>
        </div>
      </div>

      <div style={summaryGridStyle}>
        <Summary label="Partenaires" value={rows.length} />
        <Summary label="Offres" value={proposals.length} />
        <Summary label="Commandes" value={orders.length} />
        <Summary label="Factures ouvertes" value={money(totalOpen)} />
        <Summary label="Sessions" value={sessions.length} />
        <Summary label="Certificats" value={certificates.length} />
      </div>

      <div style={filterGridStyle}>
        <label style={fieldStyle}>
          <span>Recherche partenaire</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, ville, email, téléphone…" style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Étape</span>
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} style={inputStyle}>
            <option value="all">Toutes les étapes</option>
            {stageOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label style={fieldStyle}>
          <span>Priorité</span>
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} style={inputStyle}>
            <option value="all">Toutes les priorités</option>
            {riskOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div style={boardGridStyle}>
        <div style={listStyle}>
          {filteredRows.map((row) => (
            <button
              key={row.org.id}
              type="button"
              onClick={() => setSelectedId(row.org.id)}
              style={selected?.org.id === row.org.id ? partnerButtonActiveStyle : partnerButtonStyle}
            >
              <span>
                <strong>{orgName(row.org)}</strong>
                <small>{clean(row.org.city || row.org.metadata?.city, 'Ville non renseignée')}</small>
              </span>
              <em>{row.stage}</em>
            </button>
          ))}
          {!filteredRows.length ? <div style={emptyStyle}>Aucun partenaire trouvé.</div> : null}
        </div>

        {selected ? (
          <div style={detailStyle}>
            <div style={identityStyle}>
              <div style={avatarStyle}>{orgName(selected.org).slice(0, 1).toUpperCase()}</div>
              <div>
                <div style={identityLabelStyle}>Établissement partenaire</div>
                <h3 style={detailTitleStyle}>{orgName(selected.org)}</h3>
                <p style={detailTextStyle}>
                  {clean(selected.org.city || selected.org.metadata?.city, 'Ville non renseignée')} • {statusText(selected.org.status)}
                </p>
              </div>
              <div style={stageBadgeStyle}>{selected.stage}</div>
            </div>

            <div style={progressBoxStyle}>
              <div style={progressTopStyle}>
                <strong>Maturité dossier</strong>
                <span>{selected.score}/100</span>
              </div>
              <div style={barStyle}><i style={{ ...barFillStyle, width: `${selected.score}%` }} /></div>
              <p>{selected.next}</p>
            </div>

            <div style={detailMetricGridStyle}>
              <DetailMetric label="Utilisateurs" value={selected.profiles.length || selected.memberships.length} />
              <DetailMetric label="Offres" value={selected.proposals.length} />
              <DetailMetric label="Commandes" value={selected.orders.length} />
              <DetailMetric label="Factures" value={selected.invoices.length} />
              <DetailMetric label="Crédits" value={selected.credits.length} />
              <DetailMetric label="Sessions" value={selected.sessions.length} />
              <DetailMetric label="Participants" value={selected.participants.length} />
              <DetailMetric label="Certificats" value={selected.certificates.length} />
            </div>

            <div style={timelineStyle}>
              <Timeline title="Compte" done={Boolean(selected.accounts.length || selected.memberships.length)} description={selected.accounts[0]?.status ? statusText(selected.accounts[0].status) : 'Compte à finaliser'} />
              <Timeline title="Offre" done={Boolean(selected.proposals.length)} description={selected.proposals[0]?.title || selected.proposals[0]?.proposal_number || 'Première offre à créer'} />
              <Timeline title="Commande" done={Boolean(selected.orders.length)} description={selected.orders[0]?.order_number || 'Commande non créée'} />
              <Timeline title="Facture" done={Boolean(selected.invoices.length)} description={selected.invoices[0] ? `${selected.invoices[0].invoice_number || 'Facture'} • ${money(amount(selected.invoices[0]))}` : 'Facturation à venir'} />
              <Timeline title="Formation" done={Boolean(selected.sessions.length)} description={selected.sessions[0] ? `${selected.sessions[0].session_code || 'Session'} • ${dateLabel(selected.sessions[0].scheduled_start_at)}` : 'Session à planifier'} />
              <Timeline title="Certificats" done={Boolean(selected.certificates.length)} description={selected.certificates.length ? `${selected.certificates.length} certificat(s) émis` : 'Certificats à émettre'} />
            </div>

            <div style={actionGridStyle}>
              <button
                type="button"
                disabled={Boolean(busy) || !defaultCourse?.id}
                onClick={() => run('/api/traininghub/commercial/revenue-lifecycle', { action: 'create_proposal', organization_id: selected.org.id, course_id: defaultCourse?.id, participant_count: 8, requested_hours: 6 }, 'Offre créée.')}
                style={softButtonStyle}
              >
                Créer offre
              </button>
              <button
                type="button"
                disabled={Boolean(busy) || !selectedLatest(selected.proposals)?.id}
                onClick={() => run('/api/traininghub/commercial/revenue-lifecycle', { action: 'convert_to_order_invoice', proposal_id: selectedLatest(selected.proposals)?.id }, 'Commande et facture créées.')}
                style={primaryButtonStyle}
              >
                Transformer accord
              </button>
              <button
                type="button"
                disabled={Boolean(busy) || !selectedLatest(selected.orders)?.id}
                onClick={() => run('/api/traininghub/commercial/revenue-lifecycle', { action: 'issue_credits', order_id: selectedLatest(selected.orders)?.id }, 'Crédits activés.')}
                style={softButtonStyle}
              >
                Activer crédits
              </button>
              <button
                type="button"
                disabled={Boolean(busy) || !selectedLatest(selected.orders)?.id}
                onClick={() => run('/api/traininghub/commercial/revenue-lifecycle', { action: 'create_session_from_order', order_id: selectedLatest(selected.orders)?.id }, 'Session planifiée.')}
                style={softButtonStyle}
              >
                Planifier session
              </button>
              <button
                type="button"
                disabled={Boolean(busy) || !selectedLatest(selected.sessions)?.id}
                onClick={() => run('/api/traininghub/commercial/delivery-lifecycle', { action: 'run_full_delivery', session_id: selectedLatest(selected.sessions)?.id, count: 3 }, 'Session finalisée et certificats émis.')}
                style={primaryButtonStyle}
              >
                Certifier
              </button>
            </div>

            <div style={priorityStyle}>
              <span>Priorité</span>
              <strong>{selected.risk}</strong>
              <small>{selected.openInvoiceMinor ? `À encaisser: ${money(selected.openInvoiceMinor)}` : 'Aucune alerte financière ouverte'}</small>
            </div>

            {message ? <div style={messageStyle}>{message}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={summaryStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function DetailMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={detailMetricStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Timeline({ title, done, description }: { title: string; done: boolean; description: string }) {
  return (
    <article style={done ? timelineDoneStyle : timelineTodoStyle}>
      <b>{done ? '✓' : '•'}</b>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </article>
  )
}

const panelStyle: CSSProperties = { borderRadius: 34, padding: 24, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 16, alignItems: 'start', marginBottom: 18 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 7 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: '-.05em', fontWeight: 950, color: '#0f172a' }
const textStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6, fontSize: 14, fontWeight: 750, maxWidth: 920 }
const scoreCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const summaryGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 9, marginBottom: 14 }
const summaryStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 17, padding: 13, background: '#f8fbff', border: '1px solid #dbeafe', color: '#0f172a' }
const filterGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 230px 230px', gap: 10, marginBottom: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const boardGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '360px minmax(0,1fr)', gap: 14 }
const listStyle: CSSProperties = { display: 'grid', gap: 8, alignContent: 'start', maxHeight: 680, overflow: 'auto', paddingRight: 4 }
const partnerButtonStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 18, padding: 14, cursor: 'pointer', color: '#0f172a' }
const partnerButtonActiveStyle: CSSProperties = { ...partnerButtonStyle, borderColor: '#bfdbfe', background: '#eff6ff' }
const emptyStyle: CSSProperties = { borderRadius: 18, padding: 16, background: '#f8fafc', color: '#64748b', fontWeight: 800, border: '1px dashed #cbd5e1' }
const detailStyle: CSSProperties = { display: 'grid', gap: 14, borderRadius: 26, padding: 18, background: '#f8fbff', border: '1px solid #dbeafe' }
const identityStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '76px minmax(0,1fr) auto', gap: 14, alignItems: 'center' }
const avatarStyle: CSSProperties = { width: 76, height: 76, borderRadius: 24, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)', fontSize: 28, fontWeight: 950 }
const identityLabelStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase' }
const detailTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 28, letterSpacing: '-.04em' }
const detailTextStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800 }
const stageBadgeStyle: CSSProperties = { borderRadius: 999, padding: '10px 13px', background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', fontWeight: 950 }
const progressBoxStyle: CSSProperties = { display: 'grid', gap: 8, borderRadius: 20, padding: 14, background: '#fff', border: '1px solid #e2e8f0' }
const progressTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12 }
const barStyle: CSSProperties = { height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const barFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#0f2a52,#2563eb)' }
const detailMetricGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 8 }
const detailMetricStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 16, padding: 12, background: '#fff', border: '1px solid #e2e8f0' }
const timelineStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }
const timelineDoneStyle: CSSProperties = { display: 'flex', gap: 10, borderRadius: 16, padding: 12, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857' }
const timelineTodoStyle: CSSProperties = { ...timelineDoneStyle, background: '#fff', borderColor: '#e2e8f0', color: '#64748b' }
const actionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 8 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 15, padding: '12px 12px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 15, padding: '12px 12px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer' }
const priorityStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 18, padding: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }
const messageStyle: CSSProperties = { borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
