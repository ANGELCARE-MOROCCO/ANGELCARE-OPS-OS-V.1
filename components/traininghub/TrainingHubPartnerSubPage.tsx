'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

type PageKey = 'formations' | 'equipe' | 'certificats' | 'refresh' | 'documents' | 'facturation' | 'demandes' | 'profil'

type Props = {
  page: PageKey
}

type PortalSummary = {
  organization: any
  stage: string
  next_action: string
  maturity: number
  open_invoice_minor: number
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

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function money(value: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((Number(value) || 0) / 100)} MAD`
}

function amount(row: any) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || row.subtotal_minor || 0) || 0
}

function dateLabel(value: unknown) {
  if (!value) return 'Date à confirmer'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(String(value)))
  } catch {
    return clean(value)
  }
}

function statusLabel(value: unknown) {
  const status = normalize(value)
  if (status === 'active') return 'actif'
  if (status === 'draft') return 'brouillon'
  if (status === 'sent') return 'envoyée'
  if (status === 'accepted') return 'acceptée'
  if (status === 'confirmed') return 'confirmée'
  if (status === 'issued') return 'émise'
  if (status === 'paid') return 'payée'
  if (status === 'available') return 'disponible'
  if (status === 'planned') return 'planifiée'
  if (status === 'closed') return 'clôturée'
  return clean(value, 'à suivre').replace(/_/g, ' ')
}

function orgName(org: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Établissement partenaire')
}

const PAGE_COPY: Record<PageKey, { title: string; subtitle: string; eyebrow: string }> = {
  formations: { eyebrow: 'FORMATIONS', title: 'Vos formations activées', subtitle: 'Suivez les sessions planifiées, livrées, certifiées ou à renouveler.' },
  equipe: { eyebrow: 'ÉQUIPE', title: 'Collaborateurs suivis', subtitle: 'Visualisez les collaborateurs rattachés, leur présence et leur statut de certification.' },
  certificats: { eyebrow: 'CERTIFICATS', title: 'Centre de preuves', subtitle: 'Retrouvez certificats, preuves de progression et éléments utiles à votre établissement.' },
  refresh: { eyebrow: 'REFRESH', title: 'Continuité & recyclage', subtitle: 'Préparez les refresh e-learning, renouvellements et recommandations annuelles.' },
  documents: { eyebrow: 'DOCUMENTS', title: 'Coffre documentaire', subtitle: 'Offres, commandes, factures, certificats et supports disponibles au même endroit.' },
  facturation: { eyebrow: 'FACTURATION', title: 'Situation commerciale', subtitle: 'Consultez vos factures, commandes, crédits achetés et crédits utilisés.' },
  demandes: { eyebrow: 'DEMANDES', title: 'Demandes & support', subtitle: 'Créez et suivez vos demandes vers l’équipe AngelCare.' },
  profil: { eyebrow: 'PROFIL', title: 'Profil établissement', subtitle: 'Vérifiez l’identité de l’établissement, les contacts et les accès portail.' },
}

export default function TrainingHubPartnerSubPage({ page }: Props) {
  const [data, setData] = useState<PortalSummary | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [summaryResponse, requestsResponse] = await Promise.all([
          fetch('/api/traininghub/partner/business-summary', { cache: 'no-store' }),
          fetch('/api/traininghub/partner/requests', { cache: 'no-store' }),
        ])
        const summaryPayload = await summaryResponse.json().catch(() => ({}))
        const requestsPayload = await requestsResponse.json().catch(() => ({}))
        if (!summaryResponse.ok || summaryPayload?.ok === false) {
          setMessage(summaryPayload?.error?.message || summaryPayload?.message || 'Portail indisponible.')
          return
        }
        if (!cancelled) {
          setData(summaryPayload.data)
          setRequests(Array.isArray(requestsPayload?.data) ? requestsPayload.data : [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const docs = useMemo(() => {
    if (!data) return []
    return [
      ...data.proposals.map((row) => ({ id: row.id, title: clean(row.proposal_number || row.title, 'Offre partenaire'), meta: `Offre • ${statusLabel(row.status)}`, detail: dateLabel(row.created_at) })),
      ...data.orders.map((row) => ({ id: row.id, title: clean(row.order_number || row.title, 'Commande'), meta: `Commande • ${statusLabel(row.status)}`, detail: dateLabel(row.created_at) })),
      ...data.invoices.map((row) => ({ id: row.id, title: clean(row.invoice_number || row.title, 'Facture'), meta: `Facture • ${statusLabel(row.status)}`, detail: `${money(amount(row))} • ${dateLabel(row.issued_at || row.created_at)}` })),
      ...data.certificates.map((row) => ({ id: row.id, title: clean(row.certificate_number || row.title, 'Certificat'), meta: `Certificat • ${statusLabel(row.status)}`, detail: dateLabel(row.issued_at || row.created_at) })),
    ]
  }, [data])

  const copy = PAGE_COPY[page]

  if (loading) return <main style={pageStyle}><section style={panelStyle}>Chargement…</section></main>
  if (message) return <main style={pageStyle}><section style={panelStyle}>{message}</section></main>

  const rows =
    page === 'formations' ? (data?.sessions || []).map((row) => ({ id: row.id, title: clean(row.session_code || row.title, 'Session formation'), meta: `${statusLabel(row.status)} • ${dateLabel(row.scheduled_start_at)}`, detail: `${data?.participants.length || 0} participant(s)` })) :
    page === 'equipe' ? (data?.participants || []).map((row) => ({ id: row.id, title: clean(row.full_name || row.participant_name, 'Collaborateur'), meta: `${statusLabel(row.attendance_status)} • ${statusLabel(row.certificate_status)}`, detail: clean(row.job_title || row.email, 'Équipe partenaire') })) :
    page === 'certificats' ? (data?.certificates || []).map((row) => ({ id: row.id, title: clean(row.certificate_number || row.title, 'Certificat'), meta: `${statusLabel(row.status)} • ${dateLabel(row.issued_at || row.created_at)}`, detail: 'Preuve établissement disponible.' })) :
    page === 'documents' ? docs :
    page === 'facturation' ? (data?.invoices || []).map((row) => ({ id: row.id, title: clean(row.invoice_number || row.title, 'Facture'), meta: `${statusLabel(row.status)} • ${money(amount(row))}`, detail: dateLabel(row.issued_at || row.created_at) })) :
    page === 'demandes' ? requests.map((row) => ({ id: row.id, title: clean(row.title, 'Demande partenaire'), meta: `${statusLabel(row.status)} • ${clean(row.request_type, 'demande').replace(/_/g, ' ')}`, detail: clean(row.description, 'Suivi par AngelCare') })) :
    []

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/traininghub/partner" style={backStyle}>← Vue direction</Link>
        <strong>{orgName(data?.organization)}</strong>
        <span>{data?.maturity || 0}/100</span>
      </header>

      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>{copy.eyebrow}</div>
          <h1 style={titleStyle}>{copy.title}</h1>
          <p style={leadStyle}>{copy.subtitle}</p>
        </div>
        <div style={identityStyle}>
          <span>Établissement</span>
          <strong>{orgName(data?.organization)}</strong>
          <small>{clean(data?.next_action, 'Prochaine action à préparer')}</small>
        </div>
      </section>

      <nav style={navStyle}>
        {Object.entries(PAGE_COPY).map(([key, item]) => (
          <Link key={key} href={`/traininghub/partner/${key}`} style={key === page ? navActiveStyle : navLinkStyle}>{item.eyebrow}</Link>
        ))}
      </nav>

      {page === 'refresh' ? (
        <section style={gridStyle}>
          <Feature title="Refresh e-learning" text={`${data?.credits.length || 0} crédit(s) disponible(s) ou activés.`} />
          <Feature title="Recommandation" text={clean(data?.next_action, 'Votre référent AngelCare peut proposer le prochain refresh.')} />
          <Feature title="Renouvellement" text="Préparez la continuité annuelle et la montée en gamme." />
        </section>
      ) : page === 'profil' ? (
        <section style={gridStyle}>
          <Feature title="Identité établissement" text={`${orgName(data?.organization)} • ${clean(data?.organization?.city || data?.organization?.metadata?.city, 'Ville non renseignée')}`} />
          <Feature title="Compte partenaire" text={data?.accounts?.[0] ? statusLabel(data.accounts[0].status) : 'Compte en préparation'} />
          <Feature title="Accès portail" text={`${data?.memberships.length || 0} accès rattaché(s)`} />
        </section>
      ) : (
        <section style={recordGridStyle}>
          {rows.length ? rows.map((row) => (
            <article key={row.id} style={recordStyle}>
              <strong>{row.title}</strong>
              <span>{row.meta}</span>
              <p>{row.detail}</p>
            </article>
          )) : <div style={emptyStyle}>Aucun élément disponible pour le moment.</div>}
        </section>
      )}
    </main>
  )
}

function Feature({ title, text }: { title: string; text: string }) {
  return <article style={featureStyle}><strong>{title}</strong><p>{text}</p></article>
}

const pageStyle: CSSProperties = { minHeight: '100vh', background: '#f5f9ff', color: '#0f172a', padding: 18, display: 'grid', gap: 18, alignContent: 'start' }
const panelStyle: CSSProperties = { borderRadius: 28, padding: 22, background: '#fff', border: '1px solid #e2e8f0' }
const headerStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, borderRadius: 24, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0' }
const backStyle: CSSProperties = { color: '#1d4ed8', textDecoration: 'none', fontWeight: 950 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 18, borderRadius: 34, padding: 26, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase' }
const titleStyle: CSSProperties = { margin: '7px 0', fontSize: 42, lineHeight: .98, letterSpacing: '-.06em', fontWeight: 950 }
const leadStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800, lineHeight: 1.6 }
const identityStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const navStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 9, borderRadius: 24, padding: 12, background: '#fff', border: '1px solid #e2e8f0' }
const navLinkStyle: CSSProperties = { borderRadius: 999, padding: '10px 12px', color: '#475569', textDecoration: 'none', fontWeight: 950 }
const navActiveStyle: CSSProperties = { ...navLinkStyle, color: '#1d4ed8', background: '#eff6ff' }
const recordGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const recordStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 22, padding: 16, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.04)' }
const emptyStyle: CSSProperties = { gridColumn: '1/-1', borderRadius: 18, padding: 16, background: '#fff', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const featureStyle: CSSProperties = { display: 'grid', gap: 8, borderRadius: 22, padding: 16, background: '#fff', border: '1px solid #e2e8f0' }
