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
}

function text(value: unknown, fallback = 'Non défini') {
  const result = String(value || '').trim()
  return result || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function isPartner(org: any) {
  const type = normalize(org.organization_type)
  const name = normalize(org.name || org.legal_name)
  return !type.includes('internal') && !name.includes('smoke')
}

function amountMinor(row: any) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || 0) || 0
}

function money(value: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value / 100)} MAD`
}

function classifyInvoice(invoice: any) {
  const status = normalize(invoice.status)
  if (['paid', 'settled', 'closed'].includes(status)) return 'payée'
  if (['overdue', 'late'].includes(status)) return 'en retard'
  if (['issued', 'sent', 'pending'].includes(status)) return 'ouverte'
  return status || 'à suivre'
}

function classifyPartnerStage(orgId: string, proposals: any[], orders: any[], invoices: any[], sessions: any[], certificates: any[]) {
  if (certificates.some((row) => row.organization_id === orgId)) return 'certifié'
  if (sessions.some((row) => row.organization_id === orgId)) return 'formation planifiée'
  if (invoices.some((row) => row.organization_id === orgId)) return 'facturation'
  if (orders.some((row) => row.organization_id === orgId)) return 'commande'
  if (proposals.some((row) => row.organization_id === orgId)) return 'offre'
  return 'prospection'
}

function nextAction(stage: string) {
  if (stage === 'prospection') return 'Créer une offre'
  if (stage === 'offre') return 'Transformer en commande'
  if (stage === 'commande') return 'Émettre facture / crédits'
  if (stage === 'facturation') return 'Planifier formation'
  if (stage === 'formation planifiée') return 'Valider présence'
  if (stage === 'certifié') return 'Renouvellement / montée en gamme'
  return 'Suivi commercial'
}

export default function TrainingHubCommercialBusinessOverviewPanel({
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
}: Props) {
  const [city, setCity] = useState('all')
  const [stage, setStage] = useState('all')
  const [invoiceStatus, setInvoiceStatus] = useState('all')

  const partners = useMemo(() => organizations.filter(isPartner), [organizations])
  const partnerIds = useMemo(() => new Set(partners.map((partner) => partner.id)), [partners])

  const cities = useMemo(() => {
    const values = partners.map((partner) => text(partner.city || partner.metadata?.city, '')).filter(Boolean)
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [partners])

  const portfolio = useMemo(() => {
    return partners.map((partner) => {
      const orgId = partner.id
      const partnerProposals = proposals.filter((row) => row.organization_id === orgId)
      const partnerOrders = orders.filter((row) => row.organization_id === orgId)
      const partnerInvoices = invoices.filter((row) => row.organization_id === orgId)
      const partnerSessions = sessions.filter((row) => row.organization_id === orgId)
      const partnerCertificates = certificates.filter((row) => row.organization_id === orgId)
      const currentStage = classifyPartnerStage(orgId, proposals, orders, invoices, sessions, certificates)
      const invoiceStates = new Set(partnerInvoices.map(classifyInvoice))
      return {
        partner,
        stage: currentStage,
        next: nextAction(currentStage),
        proposalCount: partnerProposals.length,
        orderCount: partnerOrders.length,
        invoiceCount: partnerInvoices.length,
        sessionCount: partnerSessions.length,
        certificateCount: partnerCertificates.length,
        revenueMinor: partnerInvoices.reduce((total, invoice) => total + amountMinor(invoice), 0),
        city: text(partner.city || partner.metadata?.city, 'Non renseignée'),
        invoiceStates,
      }
    })
  }, [partners, proposals, orders, invoices, sessions, certificates])

  const filtered = portfolio.filter((row) => {
    if (city !== 'all' && row.city !== city) return false
    if (stage !== 'all' && row.stage !== stage) return false
    if (invoiceStatus !== 'all' && !row.invoiceStates.has(invoiceStatus)) return false
    return true
  })

  const openInvoiceMinor = invoices
    .filter((invoice) => partnerIds.has(invoice.organization_id) && !['paid', 'settled', 'closed', 'cancelled'].includes(normalize(invoice.status)))
    .reduce((total, invoice) => total + amountMinor(invoice), 0)

  const activatedPartners = partners.filter((partner) =>
    proposals.some((row) => row.organization_id === partner.id) ||
    orders.some((row) => row.organization_id === partner.id) ||
    invoices.some((row) => row.organization_id === partner.id) ||
    sessions.some((row) => row.organization_id === partner.id),
  ).length

  const stages = ['prospection', 'offre', 'commande', 'facturation', 'formation planifiée', 'certifié']

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>TRAININGHUB • PILOTAGE COMMERCIAL</div>
          <h2 style={titleStyle}>Vue portefeuille partenaires, revenus et formations</h2>
          <p style={textStyle}>
            Une lecture directionnelle pour suivre les établissements, leurs offres, leurs commandes, leurs factures, leurs crédits formation et leur progression jusqu’à la certification.
          </p>
        </div>
        <div style={focusCardStyle}>
          <span>Partenaires actifs</span>
          <strong>{activatedPartners}/{partners.length}</strong>
          <small>{partners.length ? `${Math.round((activatedPartners / Math.max(1, partners.length)) * 100)}% du portefeuille engagé` : 'Portefeuille à construire'}</small>
        </div>
      </div>

      <div style={kpiGridStyle}>
        <Kpi label="Établissements" value={partners.length} />
        <Kpi label="Comptes ouverts" value={accounts.length} />
        <Kpi label="Offres commerciales" value={proposals.length} />
        <Kpi label="Commandes" value={orders.length} />
        <Kpi label="Factures" value={invoices.length} />
        <Kpi label="Crédits formation" value={credits.length} />
        <Kpi label="Sessions" value={sessions.length} />
        <Kpi label="Certificats" value={certificates.length} />
      </div>

      <div style={filterGridStyle}>
        <label style={fieldStyle}>
          <span>Ville</span>
          <select value={city} onChange={(event) => setCity(event.target.value)} style={inputStyle}>
            <option value="all">Toutes les villes</option>
            {cities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label style={fieldStyle}>
          <span>Étape commerciale</span>
          <select value={stage} onChange={(event) => setStage(event.target.value)} style={inputStyle}>
            <option value="all">Toutes les étapes</option>
            {stages.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label style={fieldStyle}>
          <span>Facturation</span>
          <select value={invoiceStatus} onChange={(event) => setInvoiceStatus(event.target.value)} style={inputStyle}>
            <option value="all">Tous les statuts</option>
            <option value="ouverte">Ouverte</option>
            <option value="payée">Payée</option>
            <option value="en retard">En retard</option>
          </select>
        </label>
        <div style={valueCardStyle}>
          <span>À encaisser</span>
          <strong>{money(openInvoiceMinor)}</strong>
        </div>
      </div>

      <div style={portfolioGridStyle}>
        {filtered.slice(0, 6).map((row) => (
          <article key={row.partner.id} style={partnerCardStyle}>
            <div style={partnerTopStyle}>
              <div>
                <strong>{text(row.partner.name || row.partner.legal_name, 'Établissement partenaire')}</strong>
                <span>{row.city}</span>
              </div>
              <em>{row.stage}</em>
            </div>
            <div style={miniMetricsStyle}>
              <span>{row.proposalCount} offres</span>
              <span>{row.orderCount} commandes</span>
              <span>{row.invoiceCount} factures</span>
              <span>{row.sessionCount} sessions</span>
            </div>
            <div style={nextStyle}>
              <span>Prochaine action</span>
              <strong>{row.next}</strong>
            </div>
          </article>
        ))}
        {!filtered.length ? (
          <div style={emptyStyle}>Aucun partenaire ne correspond aux filtres sélectionnés.</div>
        ) : null}
      </div>
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={kpiStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 34, padding: 24, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 16, alignItems: 'start', marginBottom: 18 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 7 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: '-.05em', fontWeight: 950, color: '#0f172a' }
const textStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6, fontSize: 14, fontWeight: 750, maxWidth: 900 }
const focusCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 9, marginBottom: 14 }
const kpiStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 17, padding: 13, background: '#f8fbff', border: '1px solid #dbeafe', color: '#0f172a' }
const filterGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr)) 240px', gap: 10, marginBottom: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const valueCardStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 17, padding: 13, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857' }
const portfolioGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const partnerCardStyle: CSSProperties = { display: 'grid', gap: 12, borderRadius: 22, padding: 16, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.04)' }
const partnerTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }
const miniMetricsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, color: '#64748b', fontSize: 12, fontWeight: 800 }
const nextStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 16, padding: 12, background: '#eff6ff', color: '#1d4ed8' }
const emptyStyle: CSSProperties = { gridColumn: '1/-1', borderRadius: 18, padding: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
