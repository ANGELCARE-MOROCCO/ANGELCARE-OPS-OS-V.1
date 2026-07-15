'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type Partner = {
  id: string
  name: string
  city: string
  segment: string
  owner: string | null
  stage: string
  plan: string
  mrr: number
  health: number
  participants: number
  documents: number
  billing: string
  risk: string
}

type Snapshot = {
  counts?: Record<string, number>
  partners?: Partner[]
  recent?: Array<{ id: string; type: string; title: string; subtitle: string; date: string }>
  score?: { health?: number; renewal?: number; conversion?: number; certification?: number }
  finance?: { mrr_mad?: number; forecast_mad?: number }
  warning?: string
}

const navGroups = [
  { title: 'Pilotage', items: [['Command Center', '/traininghub', '⌘', true]] },
  { title: 'Partenaires', items: [['Partenaires', '/traininghub/partners', '◉'], ['Dossier partenaire', '/traininghub/partners', '▦']] },
  { title: 'Revenus', items: [['Commercial', '/traininghub/commercial', '◆'], ['Offres', '/traininghub/offres', '▱'], ['Commandes', '/traininghub/orders', '◈'], ['Facturation', '/traininghub/billing', '◌'], ['Crédits formation', '/traininghub/credits', '◇']] },
  { title: 'Catalogue', items: [['Catalogue', '/traininghub/catalogue', '▤'], ['Catégories', '/traininghub/categories', '◫'], ['Sessions', '/traininghub/sessions', '◷'], ['Participants', '/traininghub/participants', '●'], ['Formateurs', '/traininghub/trainers', '▲'], ['Présences', '/traininghub/attendance', '✓']] },
  { title: 'Administration', items: [['Certificats', '/traininghub/certificates', '✦'], ['Documents', '/traininghub/documents', '▣'], ['Qualité', '/traininghub/quality', '★'], ['Rapports', '/traininghub/reports', '▧'], ['Demandes', '/traininghub/requests', '✉']] },
]

const chain = [
  ['01', 'Partenaires', 'partners'],
  ['02', 'Offres', 'proposals'],
  ['03', 'Commandes', 'orders'],
  ['04', 'Factures', 'invoices'],
  ['05', 'Crédits', 'credits'],
  ['06', 'Sessions', 'sessions'],
  ['07', 'Présence', 'participants'],
  ['08', 'Certificat', 'certificates'],
  ['09', 'Preuves', 'documents'],
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
  if (!value) return 'Aujourd’hui'
  try {
    return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return 'Aujourd’hui'
  }
}

export default function TrainingHubCommandCenterPolishedFinal() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('Toutes les villes')

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/traininghub/internal/command-center', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      setSnapshot(payload?.data || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = snapshot?.counts || {}
  const partners = snapshot?.partners || []
  const score = snapshot?.score || {}
  const finance = snapshot?.finance || {}

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesCity = cityFilter === 'Toutes les villes' || partner.city === cityFilter
      const matchesQuery = !query.trim() || `${partner.name} ${partner.city} ${partner.segment} ${partner.stage}`.toLowerCase().includes(query.trim().toLowerCase())
      return matchesCity && matchesQuery
    })
  }, [cityFilter, partners, query])

  const cities = useMemo(() => {
    const values = Array.from(new Set(partners.map((p) => p.city).filter(Boolean)))
    return ['Toutes les villes', ...values]
  }, [partners])

  const kpis = [
    { icon: '👥', label: 'Partenaires actifs', value: counts.partners || partners.length, note: 'portefeuille réel', tone: 'blue' },
    { icon: '💵', label: 'MRR partenaires', value: money(finance.mrr_mad || 0), note: 'revenu récurrent', tone: 'green' },
    { icon: '📁', label: 'Offres ouvertes', value: counts.proposals || 0, note: 'pipeline commercial', tone: 'blue' },
    { icon: '🛒', label: 'Commandes', value: counts.orders || 0, note: 'confirmées', tone: 'purple' },
    { icon: '🧾', label: 'Factures ouvertes', value: counts.invoices || 0, note: 'à suivre', tone: 'orange' },
    { icon: '🗓', label: 'Sessions', value: counts.sessions || 0, note: 'delivery', tone: 'blue' },
    { icon: '🛡', label: 'Certificats', value: counts.certificates || 0, note: 'preuves', tone: 'green' },
    { icon: '↻', label: 'Renouvellement', value: `${score.renewal ?? 100}%`, note: 'santé portefeuille', tone: 'blue' },
  ]

  const recent = snapshot?.recent?.length ? snapshot.recent : [
    { id: '1', type: 'Commande', title: 'Commande confirmée', subtitle: 'Portefeuille AngelCare', date: '' },
    { id: '2', type: 'Session', title: 'Session planifiée', subtitle: 'Delivery', date: '' },
    { id: '3', type: 'Certificat', title: 'Certificat prêt', subtitle: 'Preuves', date: '' },
  ]

  return (
    <main style={page}>
      <aside style={sidebar}>
        <div style={brand}>
          <img src="/logo.png" alt="AngelCare" style={logo} />
          <div><strong>TrainingHub</strong><span>Command Center</span></div>
        </div>

        <nav style={nav}>
          {navGroups.map((group) => (
            <div key={group.title} style={navGroup}>
              <div style={navTitle}>{group.title}</div>
              {group.items.map(([label, href, icon, active]) => (
                <Link key={`${group.title}-${label}`} href={String(href)} style={active ? navActive : navLink}>
                  <span>{icon}</span><b>{label}</b>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <section style={main}>
        <header style={topbar}>
          <div>
            <h1>TrainingHub Command Center</h1>
            <p>Pilotage premium du portefeuille partenaires, revenus, delivery, preuves, risques et renouvellement.</p>
          </div>

          <div style={topActions}>
            <button style={ghost}>Vue portefeuille</button>
            <button style={primary}>Action prioritaire</button>
            <button style={ghost}>Filtres</button>
            <button style={ghost} onClick={load}>Rafraîchir</button>
          </div>
        </header>

        {snapshot?.warning ? <div style={warning}>{snapshot.warning}</div> : null}

        <section style={heroGrid}>
          <article style={hero}>
            <div style={orbOne} />
            <div style={orbTwo} />
            <div style={heroInner}>
              <span>ANGELCARE TRAININGHUB • COMMAND EXPERIENCE</span>
              <h2>Un cockpit propre, clair et utilisable pour piloter les vrais partenaires sans écran cassé ni données comprimées.</h2>
              <p>Vue unifiée : portefeuille, revenus, offres, factures, sessions, certificats, preuves et actions prioritaires.</p>
              <div style={heroButtons}>
                <button style={primary}>Ouvrir dossier partenaire</button>
                <button style={heroGhost}>Créer une offre</button>
                <button style={heroGhost}>Planifier session</button>
              </div>
            </div>
          </article>

          <article style={heroBlue}>
            <div style={heroBlueTop}>
              <div><span>Santé portefeuille</span><strong>{score.health ?? 86}/100</strong></div>
              <div><span>Prévision</span><strong>{money(finance.forecast_mad || 0)}</strong></div>
            </div>
            <div style={gaugeLine}><i style={{ width: `${Math.max(8, Math.min(100, Number(score.health || 86)))}%` }} /></div>
            <p>Synchronisé avec les tables partenaires, offres, commandes, factures, crédits, sessions, certificats et demandes.</p>
          </article>
        </section>

        <section style={kpiStrip}>
          {kpis.map((item) => <Kpi key={item.label} {...item} />)}
        </section>

        <section style={chainCard}>
          <div style={sectionTop}>
            <div><span>CHAÎNE OPÉRATIONNELLE</span><strong>Du partenaire au renouvellement</strong></div>
            <button style={smallGhost}>Vue détaillée</button>
          </div>
          <div style={chainRow}>
            {chain.map(([index, label, key], i) => (
              <div key={label} style={chainWrap}>
                <div style={chainStep}>
                  <b>{index}</b>
                  <strong>{label}</strong>
                  <small>{fmt(counts[key] || 0)}</small>
                </div>
                {i < chain.length - 1 ? <em>→</em> : null}
              </div>
            ))}
          </div>
        </section>

        <section style={portfolioCard}>
          <div style={portfolioTop}>
            <div>
              <span>MASTER PORTFOLIO</span>
              <h3>Partenaires ({filteredPartners.length || 0})</h3>
            </div>
            <div style={filters}>
              <label style={search}><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher partenaire…" /></label>
              <select style={select} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                {cities.map((city) => <option key={city}>{city}</option>)}
              </select>
              <button style={smallGhost}>Colonnes</button>
              <button style={smallGhost}>Exporter</button>
            </div>
          </div>

          <div style={partnerGrid}>
            {(filteredPartners.length ? filteredPartners : [{
              id: 'preview',
              name: 'AngelCare',
              city: 'Rabat',
              segment: 'angelcare_internal',
              owner: null,
              stage: 'active',
              plan: 'Aucun plan',
              mrr: 0,
              health: 62,
              participants: 0,
              documents: 0,
              billing: 'À jour',
              risk: 'Faible',
            }]).map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </section>

        <section style={lowerGrid}>
          <Panel title="Pipeline commercial">
            <MetricLine label="Offres ouvertes" value={counts.proposals || 0} width={70} />
            <MetricLine label="Commandes confirmées" value={counts.orders || 0} width={55} />
            <MetricLine label="Factures ouvertes" value={counts.invoices || 0} width={40} />
            <MetricLine label="Crédits disponibles" value={counts.credits || 0} width={78} />
          </Panel>

          <Panel title="Delivery & preuves">
            <MetricLine label="Sessions planifiées" value={counts.sessions || 0} width={64} />
            <MetricLine label="Participants" value={counts.participants || 0} width={58} />
            <MetricLine label="Certificats émis" value={counts.certificates || 0} width={76} />
            <MetricLine label="Documents publiés" value={counts.documents || 0} width={48} />
          </Panel>

          <Panel title="Activité récente">
            {recent.slice(0, 4).map((item) => <Activity key={`${item.type}-${item.id}-${item.title}`} item={item} />)}
          </Panel>

          <Panel title="Actions prioritaires">
            <Action text="Finaliser les dossiers partenaires sans owner" />
            <Action text="Convertir les offres acceptées en commandes" />
            <Action text="Planifier les sessions validées commercialement" />
            <Action text="Publier les preuves et certificats disponibles" />
          </Panel>
        </section>
      </section>

      {loading ? <div style={loadingPillStyle}>Synchronisation…</div> : null}
    </main>
  )
}

function Kpi({ icon, label, value, note, tone }: { icon: string; label: string; value: ReactNode; note: string; tone: string }) {
  return (
    <article style={kpi}>
      <span style={tone === 'green' ? kpiGreen : tone === 'orange' ? kpiOrange : tone === 'purple' ? kpiPurple : kpiBlue}>{icon}</span>
      <div><p>{label}</p><strong>{value}</strong><small>{note}</small></div>
    </article>
  )
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <article style={partnerCard}>
      <div style={partnerHead}>
        <div style={avatar}>{partner.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <h4>{partner.name}</h4>
          <p>{partner.id.slice(0, 8)} • {partner.city}</p>
        </div>
        <span style={stagePill}>{partner.stage}</span>
      </div>

      <div style={partnerMeta}>
        <Meta label="Segment" value={partner.segment} />
        <Meta label="Owner" value={partner.owner || 'Non assigné'} />
        <Meta label="Plan" value={partner.plan} />
        <Meta label="Santé" value={`${partner.health}/100`} />
        <Meta label="Delivery" value={`${partner.participants} participant(s)`} />
        <Meta label="Facturation" value={partner.billing} />
        <Meta label="Preuves" value={`${partner.documents} document(s)`} />
        <Meta label="Risque" value={partner.risk} tone="green" />
      </div>

      <div style={partnerFooter}>
        <button>Diagnostic partenaire</button>
        <button>Créer offre</button>
        <button>Ouvrir dossier</button>
      </div>
    </article>
  )
}

function Meta({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return <div style={meta}><span>{label}</span><strong style={tone === 'green' ? greenText : undefined}>{value}</strong></div>
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <article style={panel}><h3>{title}</h3><div style={panelBody}>{children}</div></article>
}

function MetricLine({ label, value, width }: { label: string; value: ReactNode; width: number }) {
  return <div style={metricLine}><div><span>{label}</span><strong>{value}</strong></div><div style={bar}><i style={{ width: `${width}%` }} /></div></div>
}

function Activity({ item }: { item: { type: string; title: string; subtitle: string; date: string } }) {
  return <div style={activity}><b>{item.type.slice(0, 1)}</b><div><strong>{item.title}</strong><span>{item.subtitle}</span></div><time>{dateLabel(item.date)}</time></div>
}

function Action({ text }: { text: string }) {
  return <div style={action}>✦ <span>{text}</span></div>
}

const page: CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '292px minmax(0, 1fr)', background: '#f3f7fd', color: '#0c1733', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const sidebar: CSSProperties = { position: 'sticky', top: 0, height: '100vh', overflow: 'auto', background: '#fff', borderRight: '1px solid #dfe8f6', padding: 18, display: 'grid', gap: 18, alignContent: 'start' }
const brand: CSSProperties = { display: 'grid', gap: 10, padding: 14, border: '1px solid #dfe8f6', borderRadius: 18, boxShadow: '0 12px 28px rgba(16,42,90,.06)' }
const logo: CSSProperties = { width: 170, height: 56, objectFit: 'contain', objectPosition: 'left center' }
const nav: CSSProperties = { display: 'grid', gap: 15 }
const navGroup: CSSProperties = { display: 'grid', gap: 7 }
const navTitle: CSSProperties = { fontSize: 11, fontWeight: 950, letterSpacing: '.15em', textTransform: 'uppercase', color: '#2462ef' }
const navLink: CSSProperties = { minHeight: 40, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '9px 12px', textDecoration: 'none', color: '#243955' }
const navActive: CSSProperties = { ...navLink, color: '#fff', background: 'linear-gradient(135deg,#063b92,#1d63ff)', boxShadow: '0 14px 28px rgba(29,99,255,.24)' }

const main: CSSProperties = { minWidth: 0, padding: 24, display: 'grid', gap: 18 }
const topbar: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.96)', border: '1px solid #dfe8f6', boxShadow: '0 18px 42px rgba(16,42,90,.07)' }
const topActions: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const primary: CSSProperties = { border: 0, background: 'linear-gradient(135deg,#063b92,#1d63ff)', color: '#fff', borderRadius: 14, padding: '13px 16px', fontWeight: 950, cursor: 'pointer', boxShadow: '0 16px 30px rgba(29,99,255,.22)' }
const ghost: CSSProperties = { border: '1px solid #d7e3f5', background: '#fff', color: '#173969', borderRadius: 14, padding: '12px 15px', fontWeight: 900, cursor: 'pointer' }
const warning: CSSProperties = { padding: 12, borderRadius: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontWeight: 900 }

const heroGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 430px', gap: 18 }
const hero: CSSProperties = { position: 'relative', minHeight: 330, overflow: 'hidden', borderRadius: 28, border: '1px solid #d9e4f5', background: 'linear-gradient(135deg,#ffffff 0%,#f7fbff 52%,#e6f0ff 100%)', boxShadow: '0 22px 54px rgba(16,42,90,.08)' }
const orbOne: CSSProperties = { position: 'absolute', right: -150, top: -220, width: 650, height: 650, borderRadius: '50%', border: '1px solid rgba(29,99,255,.20)', background: 'radial-gradient(circle, rgba(29,99,255,.10), transparent 58%)' }
const orbTwo: CSSProperties = { position: 'absolute', right: 70, bottom: -260, width: 520, height: 520, borderRadius: '50%', border: '1px solid rgba(29,99,255,.14)' }
const heroInner: CSSProperties = { position: 'relative', zIndex: 1, padding: 38, maxWidth: 920 }
const heroButtons: CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }
const heroGhost: CSSProperties = { ...ghost, background: 'rgba(255,255,255,.80)' }
const heroBlue: CSSProperties = { minHeight: 330, borderRadius: 28, padding: 26, background: 'linear-gradient(135deg,#09265e,#1f65ff)', color: '#fff', boxShadow: '0 22px 54px rgba(29,99,255,.24)', display: 'grid', alignContent: 'space-between' }
const heroBlueTop: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const gaugeLine: CSSProperties = { height: 12, borderRadius: 999, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }

const kpiStrip: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 14 }
const kpi: CSSProperties = { minHeight: 132, display: 'grid', gridTemplateColumns: '54px 1fr', gap: 14, alignItems: 'center', padding: 18, background: '#fff', border: '1px solid #dce6f5', borderRadius: 22, boxShadow: '0 16px 34px rgba(16,42,90,.06)', overflow: 'hidden' }
const kpiIcon: CSSProperties = { width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 999 }
const kpiBlue: CSSProperties = { ...kpiIcon, background: '#edf4ff', color: '#1d63ff' }
const kpiGreen: CSSProperties = { ...kpiIcon, background: '#ecfdf5', color: '#059669' }
const kpiOrange: CSSProperties = { ...kpiIcon, background: '#fff7ed', color: '#ea580c' }
const kpiPurple: CSSProperties = { ...kpiIcon, background: '#f5f3ff', color: '#7c3aed' }

const chainCard: CSSProperties = { padding: 20, borderRadius: 24, background: '#fff', border: '1px solid #dce6f5', boxShadow: '0 16px 34px rgba(16,42,90,.06)' }
const sectionTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const smallGhost: CSSProperties = { border: '1px solid #d7e3f5', background: '#fff', color: '#173969', borderRadius: 12, padding: '10px 13px', fontWeight: 900 }
const chainRow: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(17,minmax(0,auto))', gap: 10, alignItems: 'center', marginTop: 18, overflowX: 'auto', paddingBottom: 4 }
const chainWrap: CSSProperties = { display: 'contents' }
const chainStep: CSSProperties = { minWidth: 140, minHeight: 82, display: 'grid', placeItems: 'center', gap: 4, padding: 12, borderRadius: 16, background: '#f8fbff', border: '1px solid #bed1f2', color: '#174ea6' }

const portfolioCard: CSSProperties = { borderRadius: 28, background: '#fff', border: '1px solid #dce6f5', boxShadow: '0 20px 44px rgba(16,42,90,.07)', padding: 22 }
const portfolioTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18 }
const filters: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const search: CSSProperties = { minWidth: 280, height: 44, display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #d7e3f5', borderRadius: 14, padding: '0 12px', background: '#fbfcff' }
const select: CSSProperties = { height: 44, border: '1px solid #d7e3f5', borderRadius: 14, padding: '0 12px', background: '#fff', fontWeight: 850 }
const partnerGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16 }
const partnerCard: CSSProperties = { border: '1px solid #e0e8f5', borderRadius: 22, background: 'linear-gradient(180deg,#ffffff,#fbfdff)', padding: 18, display: 'grid', gap: 16, boxShadow: '0 12px 26px rgba(16,42,90,.045)' }
const partnerHead: CSSProperties = { display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 14, alignItems: 'center' }
const avatar: CSSProperties = { width: 56, height: 56, borderRadius: 18, display: 'grid', placeItems: 'center', background: '#eaf1ff', color: '#174ea6', fontWeight: 950, fontSize: 22 }
const stagePill: CSSProperties = { padding: '9px 12px', borderRadius: 999, background: '#ecfdf5', color: '#059669', fontWeight: 950 }
const partnerMeta: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const meta: CSSProperties = { minHeight: 74, display: 'grid', alignContent: 'center', gap: 5, padding: 12, borderRadius: 16, background: '#f8fbff', border: '1px solid #e0e8f5', overflow: 'hidden' }
const greenText: CSSProperties = { color: '#059669' }
const partnerFooter: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }

const lowerGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16 }
const panel: CSSProperties = { minHeight: 260, border: '1px solid #dce6f5', borderRadius: 24, background: '#fff', padding: 18, boxShadow: '0 16px 34px rgba(16,42,90,.055)', display: 'grid', alignContent: 'start', gap: 14 }
const panelBody: CSSProperties = { display: 'grid', gap: 12 }
const metricLine: CSSProperties = { display: 'grid', gap: 8 }
const bar: CSSProperties = { height: 10, borderRadius: 999, background: '#e8effa', overflow: 'hidden' }
const activity: CSSProperties = { display: 'grid', gridTemplateColumns: '38px 1fr auto', gap: 10, alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #edf2fa' }
const action: CSSProperties = { display: 'flex', gap: 8, color: '#174ea6', fontWeight: 850, padding: '8px 0' }
const loadingPillStyle: CSSProperties = { position: 'fixed', right: 24, bottom: 24, padding: '12px 16px', borderRadius: 999, background: '#1d63ff', color: '#fff', fontWeight: 950, boxShadow: '0 18px 34px rgba(29,99,255,.25)' }
