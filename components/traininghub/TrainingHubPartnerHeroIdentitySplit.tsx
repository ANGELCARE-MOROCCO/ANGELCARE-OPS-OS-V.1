'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

type PartnerSummary = {
  organization: any
  stage: string
  next_action: string
  maturity: number
  memberships: any[]
  accounts: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits: any[]
  sessions: any[]
  participants: any[]
  certificates: any[]
}

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function statusLabel(value: unknown) {
  const status = String(value || '').trim().toLowerCase()
  if (status === 'active') return 'actif'
  if (status === 'inactive') return 'inactif'
  if (status === 'pending') return 'en préparation'
  if (status === 'planned') return 'planifiée'
  if (status === 'closed') return 'clôturée'
  return clean(value, 'actif').replace(/_/g, ' ')
}

export default function TrainingHubPartnerHeroIdentitySplit() {
  const [data, setData] = useState<PartnerSummary | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/traininghub/partner/business-summary', { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (!cancelled && response.ok && payload?.ok !== false) {
          setData(payload.data)
        }
      } catch {
        // Keep premium fallback instead of showing a technical portal error.
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const org = data?.organization || {}
  const name = clean(org.name || org.legal_name || org.display_name, 'AngelCare')
  const city = clean(org.city || org.metadata?.city, 'Rabat')
  const maturity = data?.maturity || 0
  const staffCount = data?.participants.length || data?.memberships.length || 0
  const trainingCount = data?.sessions.length || 0
  const certificateCount = data?.certificates.length || 0

  const maturityLabel = useMemo(() => {
    if (maturity >= 80) return 'Excellence visible'
    if (maturity >= 50) return 'Progression solide'
    if (maturity > 0) return 'En montée en gamme'
    return 'À activer'
  }, [maturity])

  return (
    <section style={shellStyle}>
      <div style={heroTextStyle}>
        <div style={eyebrowStyle}>ANGELCARE • PARTNER EXPERIENCE</div>
        <h1 style={titleStyle}>Votre montée en gamme devient visible.</h1>
        <p style={leadStyle}>
          Un espace premium pour suivre vos formations, vos équipes, vos refresh e-learning, vos certificats et les preuves de progression de votre établissement.
        </p>

        <div style={actionsStyle}>
          <button type="button" style={primaryButtonStyle}>Voir mes formations</button>
          <button type="button" style={softButtonStyle}>Ouvrir le refresh</button>
          <button type="button" style={whiteButtonStyle}>Preuves & kits</button>
        </div>

        <div style={miniGridStyle}>
          <Mini label="Formations" value={trainingCount} />
          <Mini label="Équipe" value={staffCount} />
          <Mini label="Certificats" value={certificateCount} />
        </div>
      </div>

      <aside style={identityStyle}>
        <div style={identityTopStyle}>
          <div style={avatarStyle}>{name.slice(0, 1).toUpperCase()}</div>
          <div>
            <div style={identityLabelStyle}>Identité partenaire</div>
            <h2 style={identityTitleStyle}>{name}</h2>
            <p style={identityMetaStyle}>{city} • {statusLabel(org.status)}</p>
          </div>
          <button type="button" onClick={() => setExpanded((value) => !value)} style={toggleStyle}>
            {expanded ? 'Réduire ↑' : 'Détails ↓'}
          </button>
        </div>

        <div style={identityCardsStyle}>
          <div style={metricStyle}>
            <span>Indice</span>
            <strong>{maturity}/100</strong>
            <small>{maturityLabel}</small>
          </div>
          <div style={metricStyle}>
            <span>Formations</span>
            <strong>{trainingCount}</strong>
            <small>sessions suivies</small>
          </div>
          <div style={metricStyle}>
            <span>Équipe</span>
            <strong>{staffCount}</strong>
            <small>collaborateurs</small>
          </div>
        </div>

        <div style={barStyle}><i style={{ ...barFillStyle, width: `${maturity}%` }} /></div>

        {expanded ? (
          <div style={expandedStyle}>
            <div><span>Étape</span><strong>{clean(data?.stage, 'activation')}</strong></div>
            <div><span>Prochaine action</span><strong>{clean(data?.next_action, 'Finaliser votre première offre')}</strong></div>
            <div><span>Offres</span><strong>{data?.proposals.length || 0}</strong></div>
            <div><span>Factures</span><strong>{data?.invoices.length || 0}</strong></div>
            <div><span>Crédits</span><strong>{data?.credits.length || 0}</strong></div>
            <div><span>Preuves</span><strong>{certificateCount}</strong></div>
          </div>
        ) : null}
      </aside>
    </section>
  )
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div style={miniStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

const shellStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.05fr) minmax(420px, .95fr)',
  gap: 28,
  alignItems: 'stretch',
  padding: 28,
  borderRadius: 34,
  background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 58%,#eff6ff 100%)',
  border: '1px solid #e2e8f0',
  boxShadow: '0 24px 70px rgba(15,23,42,.08)',
  marginBottom: 22,
}

const heroTextStyle: CSSProperties = { display: 'grid', alignContent: 'center', gap: 16, minHeight: 310 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }
const titleStyle: CSSProperties = { margin: 0, maxWidth: 760, color: '#0f172a', fontSize: 56, lineHeight: .95, letterSpacing: '-.07em', fontWeight: 950 }
const leadStyle: CSSProperties = { margin: 0, maxWidth: 760, color: '#64748b', fontSize: 16, lineHeight: 1.65, fontWeight: 800 }
const actionsStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 18, padding: '14px 18px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, boxShadow: '0 14px 34px rgba(37,99,235,.18)', cursor: 'pointer' }
const softButtonStyle: CSSProperties = { border: '1px solid #99f6e4', borderRadius: 18, padding: '14px 18px', background: '#ecfeff', color: '#0f766e', fontWeight: 950, cursor: 'pointer' }
const whiteButtonStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 18, padding: '14px 18px', background: '#fff', color: '#475569', fontWeight: 950, cursor: 'pointer' }
const miniGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, maxWidth: 680 }
const miniStyle: CSSProperties = { display: 'grid', gap: 3, borderRadius: 18, padding: 14, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }

const identityStyle: CSSProperties = { borderRadius: 32, padding: 22, color: '#fff', background: 'linear-gradient(135deg,#112f5e 0%,#214d96 48%,#2d5be3 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.16),0 22px 50px rgba(37,99,235,.18)' }
const identityTopStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '66px minmax(0,1fr) auto', gap: 14, alignItems: 'center', marginBottom: 18 }
const avatarStyle: CSSProperties = { width: 66, height: 66, borderRadius: 22, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.18)', fontSize: 24, fontWeight: 950 }
const identityLabelStyle: CSSProperties = { fontSize: 11, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .78 }
const identityTitleStyle: CSSProperties = { margin: '4px 0 0', fontSize: 28, lineHeight: 1, letterSpacing: '-.04em' }
const identityMetaStyle: CSSProperties = { margin: '5px 0 0', opacity: .82, fontWeight: 800 }
const toggleStyle: CSSProperties = { border: '1px solid rgba(255,255,255,.18)', borderRadius: 999, padding: '10px 12px', color: '#fff', background: 'rgba(255,255,255,.14)', fontWeight: 950, cursor: 'pointer' }
const identityCardsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const metricStyle: CSSProperties = { display: 'grid', gap: 4, minHeight: 86, borderRadius: 18, padding: 14, background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.16)' }
const barStyle: CSSProperties = { height: 10, borderRadius: 999, background: 'rgba(255,255,255,.18)', overflow: 'hidden', marginTop: 14 }
const barFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999, background: 'rgba(255,255,255,.82)' }
const expandedStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 14 }
