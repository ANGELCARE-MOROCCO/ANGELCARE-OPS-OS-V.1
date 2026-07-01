'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

type PartnerSummary = {
  organization: any
  organization_id: string
  stage: string
  next_action: string
  maturity: number
  open_invoice_minor: number
  memberships: any[]
  accounts: any[]
  subscriptions: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits: any[]
  sessions: any[]
  participants: any[]
  certificates: any[]
  warnings: string[]
}

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function money(value: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((Number(value) || 0) / 100)} MAD`
}

function statusLabel(value: unknown) {
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
  return clean(value, 'à suivre').replace(/_/g, ' ')
}

function dateLabel(value: unknown) {
  if (!value) return 'Date à confirmer'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(String(value)))
  } catch {
    return clean(value)
  }
}

function amount(row: any) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || row.subtotal_minor || 0) || 0
}

export default function TrainingHubPartnerBusinessPortalBoard() {
  const [data, setData] = useState<PartnerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setMessage(null)
      try {
        const response = await fetch('/api/traininghub/partner/business-summary', { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || payload?.ok === false) {
          setMessage(payload?.error?.message || payload?.message || 'Lecture du portail partenaire indisponible.')
          return
        }
        if (!cancelled) setData(payload.data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const organizationName = clean(data?.organization?.name || data?.organization?.legal_name || data?.organization?.display_name, 'Établissement partenaire')

  const upcomingSession = useMemo(() => {
    return [...(data?.sessions || [])]
      .sort((a, b) => String(a.scheduled_start_at || a.created_at || '').localeCompare(String(b.scheduled_start_at || b.created_at || '')))[0]
  }, [data?.sessions])

  const latestInvoice = data?.invoices?.[0]
  const latestCertificate = data?.certificates?.[0]

  if (loading) {
    return (
      <section style={panelStyle}>
        <div style={eyebrowStyle}>ESPACE PARTENAIRE</div>
        <h2 style={titleStyle}>Chargement de votre espace formation…</h2>
      </section>
    )
  }

  if (message) {
    return (
      <section style={panelStyle}>
        <div style={eyebrowStyle}>ESPACE PARTENAIRE</div>
        <h2 style={titleStyle}>Portail formation</h2>
        <div style={alertStyle}>{message}</div>
      </section>
    )
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>ANGELCARE TRAININGHUB • ESPACE PARTENAIRE</div>
          <h2 style={titleStyle}>Votre tableau de bord formation</h2>
          <p style={textStyle}>
            Suivez vos offres, commandes, factures, crédits formation, sessions, participants et certificats depuis un seul espace clair et sécurisé.
          </p>
        </div>
        <div style={identityCardStyle}>
          <span>Établissement</span>
          <strong>{organizationName}</strong>
          <small>{clean(data?.organization?.city || data?.organization?.metadata?.city, 'Ville non renseignée')} • {statusLabel(data?.organization?.status)}</small>
        </div>
      </div>

      <div style={progressGridStyle}>
        <div style={progressCardStyle}>
          <div style={progressTopStyle}>
            <span>Progression formation</span>
            <strong>{data?.maturity || 0}/100</strong>
          </div>
          <div style={barStyle}><i style={{ ...barFillStyle, width: `${data?.maturity || 0}%` }} /></div>
          <p>{data?.next_action || 'Action à définir avec AngelCare'}</p>
        </div>
        <Metric label="Offres" value={data?.proposals.length || 0} />
        <Metric label="Commandes" value={data?.orders.length || 0} />
        <Metric label="Factures" value={data?.invoices.length || 0} />
        <Metric label="Crédits" value={data?.credits.length || 0} />
        <Metric label="Certificats" value={data?.certificates.length || 0} />
      </div>

      <div style={businessGridStyle}>
        <article style={cardStyle}>
          <div style={cardHeadStyle}>
            <strong>Situation commerciale</strong>
            <em>{data?.stage || 'activation'}</em>
          </div>
          <Row label="Dernière facture" value={latestInvoice ? `${clean(latestInvoice.invoice_number || latestInvoice.title, 'Facture')} • ${statusLabel(latestInvoice.status)}` : 'Aucune facture ouverte'} />
          <Row label="Montant à suivre" value={money(data?.open_invoice_minor || 0)} />
          <Row label="Compte partenaire" value={data?.accounts?.[0] ? statusLabel(data.accounts[0].status) : 'Compte en préparation'} />
        </article>

        <article style={cardStyle}>
          <div style={cardHeadStyle}>
            <strong>Formation planifiée</strong>
            <em>{upcomingSession ? statusLabel(upcomingSession.status) : 'à planifier'}</em>
          </div>
          <Row label="Session" value={upcomingSession ? clean(upcomingSession.session_code || upcomingSession.title, 'Session formation') : 'Aucune session planifiée'} />
          <Row label="Date" value={upcomingSession ? dateLabel(upcomingSession.scheduled_start_at) : 'À confirmer'} />
          <Row label="Participants" value={`${data?.participants.length || 0} inscrit(s)`} />
        </article>

        <article style={cardStyle}>
          <div style={cardHeadStyle}>
            <strong>Preuves & certificats</strong>
            <em>{data?.certificates.length || 0}</em>
          </div>
          <Row label="Dernier certificat" value={latestCertificate ? clean(latestCertificate.certificate_number || latestCertificate.title, 'Certificat émis') : 'Aucun certificat émis'} />
          <Row label="Statut" value={latestCertificate ? statusLabel(latestCertificate.status) : 'À venir'} />
          <Row label="Émission" value={latestCertificate ? dateLabel(latestCertificate.issued_at) : 'Après validation présence'} />
        </article>
      </div>

      <div style={timelineStyle}>
        <Step title="Offre" active={Boolean(data?.proposals.length)} />
        <Step title="Commande" active={Boolean(data?.orders.length)} />
        <Step title="Facture" active={Boolean(data?.invoices.length)} />
        <Step title="Crédits" active={Boolean(data?.credits.length)} />
        <Step title="Session" active={Boolean(data?.sessions.length)} />
        <Step title="Certificats" active={Boolean(data?.certificates.length)} />
      </div>

      <div style={helpStyle}>
        <strong>Besoin d’une action ?</strong>
        <span>Contactez votre référent AngelCare pour valider une offre, planifier une session, ajouter des participants ou préparer un renouvellement.</span>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={metricStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={rowStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Step({ title, active }: { title: string; active: boolean }) {
  return (
    <div style={active ? stepActiveStyle : stepStyle}>
      <b>{active ? '✓' : '•'}</b>
      <span>{title}</span>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 34, padding: 24, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)', marginBottom: 18 }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 16, alignItems: 'start', marginBottom: 18 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 7 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: '-.05em', fontWeight: 950, color: '#0f172a' }
const textStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6, fontSize: 14, fontWeight: 750, maxWidth: 880 }
const identityCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const progressGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(300px,1.4fr) repeat(5,minmax(0,1fr))', gap: 9, marginBottom: 14 }
const progressCardStyle: CSSProperties = { display: 'grid', gap: 8, borderRadius: 20, padding: 14, background: '#f8fbff', border: '1px solid #dbeafe', color: '#0f172a' }
const progressTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 950 }
const barStyle: CSSProperties = { height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const barFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#0f2a52,#2563eb)' }
const metricStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 17, padding: 13, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }
const businessGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 14 }
const cardStyle: CSSProperties = { display: 'grid', gap: 10, borderRadius: 22, padding: 16, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.04)' }
const cardHeadStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }
const rowStyle: CSSProperties = { display: 'grid', gap: 3, color: '#64748b', fontSize: 12, fontWeight: 800 }
const timelineStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8, marginBottom: 14 }
const stepStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, borderRadius: 16, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 900 }
const stepActiveStyle: CSSProperties = { ...stepStyle, background: '#ecfdf5', borderColor: '#bbf7d0', color: '#047857' }
const helpStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 18, padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 850 }
const alertStyle: CSSProperties = { marginTop: 12, borderRadius: 18, padding: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontWeight: 850 }
