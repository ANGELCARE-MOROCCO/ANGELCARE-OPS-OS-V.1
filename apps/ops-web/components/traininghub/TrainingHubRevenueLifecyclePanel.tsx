'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  courses: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits?: any[]
  sessions?: any[]
}

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(amountMinor?: number | null, currency = 'MAD') {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n(amountMinor) / 100)} ${currency}`
}

function isPartner(org: any) {
  const type = normalize(org.organization_type)
  return type.includes('partner') || type.includes('school') || type.includes('creche') || type.includes('crèche') || type !== 'angelcare_internal'
}

function orgName(org?: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Partenaire non renseigné')
}

function courseLabel(course?: any) {
  return course ? `${course.ref || 'TRN'} • ${course.title || 'Formation'}` : 'Formation non sélectionnée'
}

function statusLabel(value?: string | null) {
  const status = normalize(value)
  if (status === 'draft') return 'Brouillon'
  if (status === 'sent') return 'Envoyée'
  if (status === 'accepted') return 'Acceptée'
  if (status === 'converted_to_order') return 'Convertie'
  if (status === 'confirmed') return 'Confirmée'
  if (status === 'issued') return 'Émise'
  if (status === 'planned') return 'Planifiée'
  if (status === 'available') return 'Disponible'
  return clean(value, 'À configurer').replace(/_/g, ' ')
}

function statusTone(status?: string | null) {
  const value = normalize(status)
  if (['accepted', 'converted_to_order', 'confirmed', 'issued', 'planned', 'available'].includes(value)) return { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' }
  if (['sent', 'draft'].includes(value)) return { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' }
  return { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' }
}

export default function TrainingHubRevenueLifecyclePanel({ organizations, courses, proposals, orders, invoices, credits = [], sessions = [] }: Props) {
  const partnerOrganizations = useMemo(() => organizations.filter(isPartner), [organizations])
  const activeCourses = useMemo(() => courses.filter((course) => !['archived', 'inactive', 'disabled'].includes(normalize(course.status || course.publication_status))), [courses])
  const [selectedOrgId, setSelectedOrgId] = useState(partnerOrganizations[0]?.id || '')
  const [selectedCourseId, setSelectedCourseId] = useState(activeCourses[0]?.id || '')
  const [participantCount, setParticipantCount] = useState(8)
  const [requestedHours, setRequestedHours] = useState(6)
  const [discountMad, setDiscountMad] = useState(0)
  const [validUntil, setValidUntil] = useState('')
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const selectedOrg = partnerOrganizations.find((org) => org.id === selectedOrgId)
  const selectedCourse = activeCourses.find((course) => course.id === selectedCourseId)

  const orgProposals = proposals.filter((proposal) => proposal.organization_id === selectedOrgId)
  const orgOrders = orders.filter((order) => order.organization_id === selectedOrgId)
  const orgInvoices = invoices.filter((invoice) => invoice.organization_id === selectedOrgId)
  const orgCredits = credits.filter((credit) => credit.organization_id === selectedOrgId)
  const orgSessions = sessions.filter((session) => session.organization_id === selectedOrgId)
  const latestProposal = orgProposals[0]
  const latestOrder = orgOrders[0]

  const lifecycleScore = Math.min(
    100,
    Math.round(
      (selectedOrg ? 15 : 0) +
        (orgProposals.length ? 17 : 0) +
        (orgOrders.length ? 17 : 0) +
        (orgInvoices.length ? 17 : 0) +
        (orgCredits.length ? 17 : 0) +
        (orgSessions.length ? 17 : 0),
    ),
  )

  async function runAction(action: string, body: Record<string, any>) {
    setBusyAction(action)
    setMessage(null)
    setResult(null)
    try {
      const response = await fetch('/api/traininghub/commercial/revenue-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error?.message || payload?.message || 'Action commerciale non finalisée.')
        return
      }
      setResult(payload.data)
      setMessage('Action commerciale exécutée avec succès.')
      window.setTimeout(() => window.location.reload(), 900)
    } finally {
      setBusyAction(null)
    }
  }

  async function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction('create_proposal', {
      organization_id: selectedOrgId,
      course_id: selectedCourseId,
      participant_count: participantCount,
      requested_hours: requestedHours,
      discount_mad: discountMad,
      valid_until: validUntil || undefined,
    })
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>CHAÎNE COMMERCIALE & FORMATION</div>
          <h2 style={titleStyle}>Parcours guidé offre → commande → facture → crédits → session</h2>
          <p style={textStyle}>
            Pilotez le passage complet d’une offre partenaire vers la commande, la facture, les crédits formation et la session opérationnelle.
          </p>
        </div>
        <div style={scoreCardStyle}>
          <span>Avancement partenaire</span>
          <strong>{lifecycleScore}/100</strong>
          <small>{orgName(selectedOrg)}</small>
        </div>
      </div>

      <div style={builderGridStyle}>
        <form onSubmit={submitProposal} style={builderStyle}>
          <div style={builderHeaderStyle}>
            <strong>Créer une offre partenaire</strong>
            <span>L’offre relie l’établissement, la formation, les participants et le montant commercial.</span>
          </div>

          <label style={fieldStyle}>
            <span>Partenaire</span>
            <select value={selectedOrgId} onChange={(event) => setSelectedOrgId(event.target.value)} style={inputStyle} required>
              {partnerOrganizations.map((org) => <option key={org.id} value={org.id}>{orgName(org)}</option>)}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Formation / offre</span>
            <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} style={inputStyle} required>
              {activeCourses.map((course) => <option key={course.id} value={course.id}>{courseLabel(course)}</option>)}
            </select>
          </label>

          <div style={formGridStyle}>
            <label style={fieldStyle}>
              <span>Participants</span>
              <input type="number" value={participantCount} onChange={(event) => setParticipantCount(Number(event.target.value || 0))} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span>Heures</span>
              <input type="number" value={requestedHours} onChange={(event) => setRequestedHours(Number(event.target.value || 0))} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span>Remise MAD</span>
              <input type="number" value={discountMad} onChange={(event) => setDiscountMad(Number(event.target.value || 0))} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span>Validité</span>
              <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} style={inputStyle} />
            </label>
          </div>

          <button type="submit" disabled={Boolean(busyAction) || !selectedOrgId || !selectedCourseId} style={primaryButtonStyle}>
            {busyAction === 'create_proposal' ? 'Création…' : 'Créer offre'}
          </button>
        </form>

        <div style={chainStyle}>
          <Step number="01" title="Proposition" value={orgProposals.length} active={Boolean(orgProposals.length)} />
          <Step number="02" title="Commande" value={orgOrders.length} active={Boolean(orgOrders.length)} />
          <Step number="03" title="Facture" value={orgInvoices.length} active={Boolean(orgInvoices.length)} />
          <Step number="04" title="Crédits" value={orgCredits.length} active={Boolean(orgCredits.length)} />
          <Step number="05" title="Session" value={orgSessions.length} active={Boolean(orgSessions.length)} />
        </div>
      </div>

      <div style={actionGridStyle}>
        <button disabled={!latestProposal || Boolean(busyAction)} type="button" onClick={() => runAction('send_proposal', { proposal_id: latestProposal?.id })} style={softButtonStyle}>
          Envoyer offre
        </button>
        <button disabled={!latestProposal || Boolean(busyAction)} type="button" onClick={() => runAction('accept_proposal', { proposal_id: latestProposal?.id })} style={softButtonStyle}>
          Valider accord
        </button>
        <button disabled={!latestProposal || Boolean(busyAction)} type="button" onClick={() => runAction('convert_to_order_invoice', { proposal_id: latestProposal?.id })} style={primaryButtonStyle}>
          Créer commande + facture
        </button>
        <button disabled={!latestOrder || Boolean(busyAction)} type="button" onClick={() => runAction('issue_credits', { order_id: latestOrder?.id })} style={softButtonStyle}>
          Activer crédits formation
        </button>
        <button disabled={!latestOrder || Boolean(busyAction)} type="button" onClick={() => runAction('create_session_from_order', { order_id: latestOrder?.id })} style={softButtonStyle}>
          Planifier depuis commande
        </button>
        <button disabled={!selectedOrgId || !selectedCourseId || Boolean(busyAction)} type="button" onClick={() => runAction('run_full_chain', { organization_id: selectedOrgId, course_id: selectedCourseId, participant_count: participantCount, requested_hours: requestedHours, discount_mad: discountMad })} style={dangerButtonStyle}>
          Parcours complet
        </button>
      </div>

      <div style={latestGridStyle}>
        <Latest label="Dernière proposition" value={latestProposal?.proposal_number || latestProposal?.title || 'Aucune'} status={statusLabel(latestProposal?.status)} />
        <Latest label="Dernière commande" value={latestOrder?.order_number || latestOrder?.title || 'Aucune'} status={statusLabel(latestOrder?.status)} />
        <Latest label="Facturation ouverte" value={money(orgInvoices.reduce((total, invoice) => total + n(invoice.amount_due_minor || invoice.grand_total_minor), 0))} status={`${orgInvoices.length} facture(s)`} />
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}
      {result?.verification ? (
        <div style={resultStyle}>
          <strong>Lecture partenaire: {result.verification.score}/100</strong>
          <span>{result.verification.next_best_actions?.length ? result.verification.next_best_actions.join(' • ') : 'Parcours commercial et formation lisible.'}</span>
        </div>
      ) : null}
    </section>
  )
}

function Step({ number, title, value, active }: { number: string; title: string; value: number; active: boolean }) {
  return (
    <div style={active ? stepActiveStyle : stepStyle}>
      <span>{number}</span>
      <strong>{title}</strong>
      <b>{value}</b>
    </div>
  )
}

function Latest({ label, value, status }: { label: string; value: string; status: string }) {
  const tone = statusTone(status)
  return (
    <div style={latestStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
      <em style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{status}</em>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 32, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 16, alignItems: 'start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 25, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 950 }
const textStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 850 }
const scoreCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 22, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const builderGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(360px,.85fr)', gap: 14 }
const builderStyle: CSSProperties = { display: 'grid', gap: 12, borderRadius: 24, padding: 18, background: '#f8fbff', border: '1px solid #dbeafe' }
const builderHeaderStyle: CSSProperties = { display: 'grid', gap: 4, color: '#0f172a' }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 16, padding: '12px 14px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { ...primaryButtonStyle, background: 'linear-gradient(135deg,#7c2d12,#ea580c)' }
const chainStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }
const stepStyle: CSSProperties = { display: 'grid', gap: 7, alignContent: 'center', justifyItems: 'start', borderRadius: 20, padding: 15, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }
const stepActiveStyle: CSSProperties = { ...stepStyle, background: '#ecfdf5', borderColor: '#bbf7d0', color: '#047857' }
const actionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10, marginTop: 14 }
const latestGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 14 }
const latestStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 18, padding: 14, background: '#fff', border: '1px solid #e2e8f0' }
const badgeStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap', fontStyle: 'normal', justifySelf: 'start' }
const messageStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const resultStyle: CSSProperties = { marginTop: 14, display: 'grid', gap: 4, borderRadius: 18, padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 850 }
