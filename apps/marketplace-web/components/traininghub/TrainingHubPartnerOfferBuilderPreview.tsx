'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  courses: any[]
  proposals?: any[]
  invoices?: any[]
}

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function isPartner(org: any) {
  const type = normalize(org.organization_type || org.type)
  const name = normalize(org.name || org.legal_name || org.display_name)
  return !type.includes('internal') && !name.includes('smoke')
}

function orgName(org: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Établissement partenaire')
}

function courseName(course: any) {
  return `${clean(course?.ref, 'TRN')} — ${clean(course?.title || course?.name, 'Formation AngelCare')}`
}

function moneyMinor(value: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((Number(value) || 0) / 100)} MAD`
}

function moneyMad(value: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(Number(value) || 0)} MAD`
}

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function priceMinor(course: any, participants: number, hours: number, discountMad: number) {
  const baseMinor = n(course?.onsite_entry_price_minor || course?.refresh_entry_price_minor || course?.price_minor || 0)
  const base = baseMinor > 0 ? baseMinor : Math.max(100000, hours * 100000)
  const packageSize = Math.max(1, n(course?.starter_max_participants || 8))
  const multiplier = Math.max(1, Math.ceil(Math.max(1, participants) / packageSize))
  return Math.max(0, base * multiplier - Math.max(0, discountMad) * 100)
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function TrainingHubPartnerOfferBuilderPreview({ organizations, courses, proposals = [], invoices = [] }: Props) {
  const partners = useMemo(() => organizations.filter(isPartner), [organizations])
  const activeCourses = useMemo(
    () => courses.filter((course) => !['archived', 'inactive', 'disabled'].includes(normalize(course.status || course.publication_status))),
    [courses],
  )

  const [organizationId, setOrganizationId] = useState(partners[0]?.id || '')
  const [courseId, setCourseId] = useState(activeCourses[0]?.id || '')
  const [participants, setParticipants] = useState(8)
  const [hours, setHours] = useState(6)
  const [discountMad, setDiscountMad] = useState(0)
  const [validUntil, setValidUntil] = useState(addDays(15))
  const [objective, setObjective] = useState('Renforcer les standards d’accueil, sécurité, pédagogie et expérience parents.')
  const [commitment, setCommitment] = useState('Session encadrée, supports formation, suivi participants et certificats disponibles après validation.')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [createdProposal, setCreatedProposal] = useState<any | null>(null)

  const partner = partners.find((item) => item.id === organizationId)
  const course = activeCourses.find((item) => item.id === courseId)
  const totalMinor = priceMinor(course, participants, hours, discountMad)
  const partnerProposals = proposals.filter((proposal) => proposal.organization_id === organizationId)
  const partnerInvoices = invoices.filter((invoice) => invoice.organization_id === organizationId)
  const draftNumber = `TH-OFFRE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
  const latestProposal = createdProposal || partnerProposals[0]

  async function createOffer() {
    setBusy(true)
    setMessage(null)
    setCreatedProposal(null)

    try {
      const response = await fetch('/api/traininghub/commercial/revenue-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_proposal',
          organization_id: organizationId,
          course_id: courseId,
          participant_count: participants,
          requested_hours: hours,
          discount_mad: discountMad,
          valid_until: validUntil,
          title: `Offre formation — ${courseName(course)}`,
          partner_notes: `${objective}\n\nEngagement: ${commitment}`,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error?.message || payload?.message || 'Offre non créée.')
        return
      }

      const proposal = payload.data?.proposal || payload.data
      setCreatedProposal(proposal)
      setMessage('Offre créée avec succès. Elle est prête à être envoyée ou convertie après accord.')
      window.setTimeout(() => window.location.reload(), 1000)
    } finally {
      setBusy(false)
    }
  }

  async function actionOnProposal(action: string, proposalId: string, success: string) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/commercial/revenue-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, proposal_id: proposalId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error?.message || payload?.message || 'Action offre non finalisée.')
        return
      }
      setMessage(success)
      window.setTimeout(() => window.location.reload(), 900)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>OFFRE PARTENAIRE • PRÉVISUALISATION COMMERCIALE</div>
          <h2 style={titleStyle}>Construire une offre claire avant commande</h2>
          <p style={textStyle}>
            Préparez une proposition lisible pour un établissement partenaire avec formation, volume, montant, validité, promesse de livraison et prochaine action commerciale.
          </p>
        </div>
        <div style={scoreCardStyle}>
          <span>Offres du partenaire</span>
          <strong>{partnerProposals.length}</strong>
          <small>{partnerInvoices.length} facture(s) rattachée(s)</small>
        </div>
      </div>

      <div style={builderGridStyle}>
        <div style={formStyle}>
          <div style={formHeaderStyle}>
            <strong>Paramètres de l’offre</strong>
            <span>Chaque champ alimente la prévisualisation commerciale à droite.</span>
          </div>

          <label style={fieldStyle}>
            <span>Établissement partenaire</span>
            <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} style={inputStyle}>
              {partners.map((item) => <option key={item.id} value={item.id}>{orgName(item)}</option>)}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Formation proposée</span>
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)} style={inputStyle}>
              {activeCourses.map((item) => <option key={item.id} value={item.id}>{courseName(item)}</option>)}
            </select>
          </label>

          <div style={miniGridStyle}>
            <label style={fieldStyle}>
              <span>Participants</span>
              <input type="number" min={1} value={participants} onChange={(event) => setParticipants(Number(event.target.value || 0))} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span>Heures</span>
              <input type="number" min={1} value={hours} onChange={(event) => setHours(Number(event.target.value || 0))} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span>Remise MAD</span>
              <input type="number" min={0} value={discountMad} onChange={(event) => setDiscountMad(Number(event.target.value || 0))} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span>Validité</span>
              <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} style={inputStyle} />
            </label>
          </div>

          <label style={fieldStyle}>
            <span>Objectif commercial</span>
            <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={3} style={textareaStyle} />
          </label>

          <label style={fieldStyle}>
            <span>Engagement AngelCare</span>
            <textarea value={commitment} onChange={(event) => setCommitment(event.target.value)} rows={3} style={textareaStyle} />
          </label>

          <div style={actionRowStyle}>
            <button type="button" disabled={busy || !organizationId || !courseId} onClick={createOffer} style={primaryButtonStyle}>
              {busy ? 'Création…' : 'Créer l’offre'}
            </button>
            <button type="button" disabled={busy || !latestProposal?.id} onClick={() => actionOnProposal('send_proposal', latestProposal.id, 'Offre marquée envoyée.')} style={softButtonStyle}>
              Marquer envoyée
            </button>
            <button type="button" disabled={busy || !latestProposal?.id} onClick={() => actionOnProposal('accept_proposal', latestProposal.id, 'Accord partenaire validé.')} style={softButtonStyle}>
              Valider accord
            </button>
          </div>
        </div>

        <aside style={previewStyle}>
          <div style={previewTopStyle}>
            <div>
              <div style={previewEyebrowStyle}>PROPOSITION ANGELCARE</div>
              <h3 style={previewTitleStyle}>{courseName(course)}</h3>
            </div>
            <div style={previewNumberStyle}>{latestProposal?.proposal_number || draftNumber}</div>
          </div>

          <div style={partnerBoxStyle}>
            <span>Établissement</span>
            <strong>{orgName(partner)}</strong>
            <small>{clean(partner?.city || partner?.metadata?.city, 'Ville non renseignée')} • {clean(partner?.primary_contact_email || partner?.billing_email, 'Email à compléter')}</small>
          </div>

          <div style={previewMetricsStyle}>
            <PreviewMetric label="Participants" value={participants} />
            <PreviewMetric label="Volume" value={`${hours}h`} />
            <PreviewMetric label="Validité" value={validUntil || 'À définir'} />
            <PreviewMetric label="Montant" value={moneyMinor(totalMinor)} strong />
          </div>

          <div style={sectionBoxStyle}>
            <strong>Objectif</strong>
            <p>{objective}</p>
          </div>

          <div style={sectionBoxStyle}>
            <strong>Livrables inclus</strong>
            <ul>
              <li>Session formation encadrée par AngelCare.</li>
              <li>Suivi des participants et présence.</li>
              <li>Crédits formation activables après validation.</li>
              <li>Certificats et preuves disponibles dans le portail partenaire.</li>
            </ul>
          </div>

          <div style={totalBoxStyle}>
            <span>Total proposition</span>
            <strong>{moneyMinor(totalMinor)}</strong>
            {discountMad ? <small>Remise appliquée: {moneyMad(discountMad)}</small> : <small>Tarif selon configuration formation</small>}
          </div>

          <div style={sectionBoxStyle}>
            <strong>Engagement</strong>
            <p>{commitment}</p>
          </div>
        </aside>
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}
    </section>
  )
}

function PreviewMetric({ label, value, strong = false }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <div style={strong ? previewMetricStrongStyle : previewMetricStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 34, padding: 24, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 230px', gap: 16, alignItems: 'start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 7 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 28, lineHeight: 1.06, letterSpacing: '-.05em', fontWeight: 950, color: '#0f172a' }
const textStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6, fontSize: 14, fontWeight: 750, maxWidth: 920 }
const scoreCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const builderGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(430px,.88fr)', gap: 16, alignItems: 'start' }
const formStyle: CSSProperties = { display: 'grid', gap: 12, borderRadius: 24, padding: 16, background: '#f8fbff', border: '1px solid #dbeafe' }
const formHeaderStyle: CSSProperties = { display: 'grid', gap: 4, color: '#0f172a' }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const textareaStyle: CSSProperties = { ...inputStyle, resize: 'vertical', lineHeight: 1.5 }
const miniGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const actionRowStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 16, padding: '12px 14px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer' }
const previewStyle: CSSProperties = { display: 'grid', gap: 12, borderRadius: 28, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 22px 54px rgba(15,23,42,.08)' }
const previewTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }
const previewEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 10, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase' }
const previewTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 22, lineHeight: 1.08, letterSpacing: '-.04em' }
const previewNumberStyle: CSSProperties = { borderRadius: 999, padding: '9px 12px', background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap' }
const partnerBoxStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, padding: 14, background: 'linear-gradient(135deg,#0b2348,#2557d6)', color: '#fff' }
const previewMetricsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 }
const previewMetricStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 16, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const previewMetricStrongStyle: CSSProperties = { ...previewMetricStyle, background: '#ecfdf5', borderColor: '#bbf7d0', color: '#047857' }
const sectionBoxStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 13, lineHeight: 1.55 }
const totalBoxStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 18, padding: 16, background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }
const messageStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
