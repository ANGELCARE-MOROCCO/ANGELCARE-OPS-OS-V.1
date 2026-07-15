'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  courses: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits?: any[]
  sessions?: any[]
  participants?: any[]
  certificates?: any[]
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
  return type.includes('partner') || type.includes('school') || type.includes('creche') || type.includes('crèche') || type !== 'angelcare_internal'
}
function orgName(org?: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Partenaire non renseigné')
}

export default function TrainingHubPartnerLifecycleCommandDock({
  organizations,
  courses,
  proposals,
  orders,
  invoices,
  credits = [],
  sessions = [],
  participants = [],
  certificates = [],
}: Props) {
  const partners = useMemo(() => organizations.filter(isPartner), [organizations])
  const activeCourses = useMemo(() => courses.filter((course) => !['archived', 'inactive', 'disabled'].includes(normalize(course.status || course.publication_status))), [courses])
  const [organizationId, setOrganizationId] = useState(partners[0]?.id || '')
  const [courseId, setCourseId] = useState(activeCourses[0]?.id || '')
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const partner = partners.find((item) => item.id === organizationId)
  const orgProposals = proposals.filter((row) => row.organization_id === organizationId)
  const orgOrders = orders.filter((row) => row.organization_id === organizationId)
  const orgInvoices = invoices.filter((row) => row.organization_id === organizationId)
  const orgCredits = credits.filter((row) => row.organization_id === organizationId)
  const orgSessions = sessions.filter((row) => row.organization_id === organizationId)
  const orgParticipants = participants.filter((row) => row.organization_id === organizationId)
  const orgCertificates = certificates.filter((row) => row.organization_id === organizationId)
  const latestProposal = orgProposals[0]
  const latestOrder = orgOrders[0]
  const latestSession = orgSessions[0]

  const score = Math.min(100, Math.round((partner ? 10 : 0) + (orgProposals.length ? 15 : 0) + (orgOrders.length ? 15 : 0) + (orgInvoices.length ? 15 : 0) + (orgCredits.length ? 15 : 0) + (orgSessions.length ? 15 : 0) + (orgParticipants.length ? 8 : 0) + (orgCertificates.length ? 7 : 0)))

  async function post(url: string, body: Record<string, any>, success: string) {
    setBusy(body.action || url)
    setMessage(null)
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error?.message || payload?.message || 'Action non finalisée.')
        return
      }
      setMessage(success)
      window.setTimeout(() => window.location.reload(), 900)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>CENTRE D’ACTIONS PARTENAIRE</div>
          <h2 style={titleStyle}>Actions commerciales directement liées au dossier</h2>
          <p style={textStyle}>Un centre d’actions clair pour piloter l’établissement partenaire : offre, commande, facture, crédits formation, session, présence et certificats.</p>
        </div>
        <div style={scoreStyle}><span>Maturité commerciale</span><strong>{score}/100</strong><small>{orgName(partner)}</small></div>
      </div>

      <div style={selectorGridStyle}>
        <label style={fieldStyle}><span>Partenaire</span><select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} style={inputStyle}>{partners.map((org) => <option key={org.id} value={org.id}>{orgName(org)}</option>)}</select></label>
        <label style={fieldStyle}><span>Formation</span><select value={courseId} onChange={(event) => setCourseId(event.target.value)} style={inputStyle}>{activeCourses.map((course) => <option key={course.id} value={course.id}>{course.ref || 'TRN'} • {course.title || 'Formation'}</option>)}</select></label>
      </div>

      <div style={stepsStyle}>
        <Step label="Propositions" value={orgProposals.length} />
        <Step label="Commandes" value={orgOrders.length} />
        <Step label="Factures" value={orgInvoices.length} />
        <Step label="Crédits" value={orgCredits.length} />
        <Step label="Sessions" value={orgSessions.length} />
        <Step label="Participants" value={orgParticipants.length} />
        <Step label="Certificats" value={orgCertificates.length} />
      </div>

      <div style={actionsStyle}>
        <button type="button" disabled={!organizationId || !courseId || Boolean(busy)} onClick={() => post('/api/traininghub/commercial/revenue-lifecycle', { action: 'create_proposal', organization_id: organizationId, course_id: courseId, participant_count: 8, requested_hours: 6 }, 'Proposition créée.')} style={softButtonStyle}>Créer une offre</button>
        <button type="button" disabled={!latestProposal || Boolean(busy)} onClick={() => post('/api/traininghub/commercial/revenue-lifecycle', { action: 'convert_to_order_invoice', proposal_id: latestProposal?.id }, 'Offre convertie en commande/facture.')} style={primaryButtonStyle}>Convertir en commande</button>
        <button type="button" disabled={!latestOrder || Boolean(busy)} onClick={() => post('/api/traininghub/commercial/revenue-lifecycle', { action: 'issue_credits', order_id: latestOrder?.id }, 'Crédits formation émis.')} style={softButtonStyle}>Activer crédits</button>
        <button type="button" disabled={!latestOrder || Boolean(busy)} onClick={() => post('/api/traininghub/commercial/revenue-lifecycle', { action: 'create_session_from_order', order_id: latestOrder?.id }, 'Session créée.')} style={softButtonStyle}>Planifier session</button>
        <button type="button" disabled={!latestSession || Boolean(busy)} onClick={() => post('/api/traininghub/commercial/delivery-lifecycle', { action: 'run_full_delivery', session_id: latestSession?.id, count: 3 }, 'Delivery complet exécuté.')} style={dangerButtonStyle}>Certifier</button>
        <button type="button" disabled={!organizationId || !courseId || Boolean(busy)} onClick={() => post('/api/traininghub/commercial/revenue-lifecycle', { action: 'run_full_chain', organization_id: organizationId, course_id: courseId, participant_count: 8, requested_hours: 6 }, 'Parcours complet exécutée.')} style={dangerButtonStyle}>Parcours complet</button>
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}
    </section>
  )
}

function Step({ label, value }: { label: string; value: number }) {
  const active = value > 0
  return <div style={active ? stepActiveStyle : stepStyle}><strong>{value}</strong><span>{label}</span></div>
}

const panelStyle: CSSProperties = { borderRadius: 34, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 16, alignItems: 'start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 26, lineHeight: 1.08, letterSpacing: '-.045em', fontWeight: 950 }
const textStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 900 }
const scoreStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 22, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const selectorGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const stepsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 8 }
const stepStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 16, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }
const stepActiveStyle: CSSProperties = { ...stepStyle, background: '#ecfdf5', borderColor: '#bbf7d0', color: '#047857' }
const actionsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8, marginTop: 14 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 15, padding: '12px 12px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 15, padding: '12px 12px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { ...primaryButtonStyle, background: 'linear-gradient(135deg,#7c2d12,#ea580c)' }
const messageStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
