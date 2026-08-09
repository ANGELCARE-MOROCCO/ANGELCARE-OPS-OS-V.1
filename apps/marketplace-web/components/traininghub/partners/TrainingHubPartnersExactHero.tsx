'use client'

import Link from 'next/link'
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

type Snapshot = {
  counts?: Record<string, number>
  partners?: Partner[]
  overview?: { revenue_mad?: number; sessions_delivered?: number; certification_rate?: number }
  health?: { score?: number; at_risk?: number; blocked?: number }
  warning?: string
}

const sidebarGroups = [
  {
    title: 'PILOTAGE',
    items: [
      { label: 'Command Center', href: '/traininghub', icon: '⌘' },
    ],
  },
  {
    title: 'PARTENAIRES',
    items: [
      { label: 'Partenaires', href: '/traininghub/partners', icon: '◉', active: true },
      { label: 'Dossier partenaire', href: '/traininghub/partners', icon: '▦' },
    ],
  },
  {
    title: 'REVENUS',
    items: [
      { label: 'Commercial', href: '/traininghub/commercial', icon: '◆' },
      { label: 'Offres', href: '/traininghub/offres', icon: '▱' },
      { label: 'Commandes', href: '/traininghub/orders', icon: '◈' },
      { label: 'Facturation', href: '/traininghub/billing', icon: '○' },
      { label: 'Crédits formation', href: '/traininghub/credits', icon: '◇' },
    ],
  },
  {
    title: 'DELIVERY',
    items: [
      { label: 'Catalogue', href: '/traininghub/catalogue', icon: '▤' },
      { label: 'Catégories', href: '/traininghub/categories', icon: '▥' },
      { label: 'Sessions', href: '/traininghub/sessions', icon: '◷' },
      { label: 'Participants', href: '/traininghub/participants', icon: '●' },
      { label: 'Formateurs', href: '/traininghub/trainers', icon: '▲' },
      { label: 'Présences', href: '/traininghub/attendance', icon: '✓' },
    ],
  },
  {
    title: 'PREUVES',
    items: [
      { label: 'Certificats', href: '/traininghub/certificates', icon: '✦' },
      { label: 'Documents', href: '/traininghub/documents', icon: '▣' },
      { label: 'Refresh', href: '/traininghub/refresh', icon: '↻' },
      { label: 'Qualité', href: '/traininghub/quality', icon: '★' },
      { label: 'Rapports', href: '/traininghub/reports', icon: '▧' },
    ],
  },
  {
    title: 'RELATION PARTENAIRE',
    items: [
      { label: 'Demandes partenaires', href: '/traininghub/requests', icon: '✉' },
      { label: 'Notifications', href: '/traininghub/notifications', icon: '◔' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Utilisateurs', href: '/traininghub/users', icon: '◍' },
      { label: 'Rôles & accès', href: '/traininghub/access', icon: '△' },
      { label: 'Paramètres', href: '/traininghub/settings', icon: '⚙' },
      { label: 'Journal & sécurité', href: '/traininghub/audit', icon: '◜' },
      { label: 'Production readiness', href: '/traininghub/readiness', icon: '◎' },
    ],
  },
]

function formatNumber(value: unknown) {
  return new Intl.NumberFormat('fr-MA').format(Number(value || 0))
}

function formatMoney(value: unknown) {
  const n = Number(value || 0)
  if (n >= 1000) return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(n / 1000)} K MAD`
  return `${new Intl.NumberFormat('fr-MA').format(n)} MAD`
}

export default function TrainingHubPartnersExactHero() {
  const [snapshot, setSnapshot] = useState<Snapshot>({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Tous les statuts')
  const [city, setCity] = useState('Toutes les villes')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', city: 'Rabat' })
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/traininghub/internal/partners-portfolio', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (payload?.data) setSnapshot(payload.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = snapshot.counts || {}
  const overview = snapshot.overview || {}
  const health = snapshot.health || {}
  const partners = snapshot.partners || []

  const cities = useMemo(() => {
    const values = Array.from(new Set(partners.map((partner) => partner.city).filter(Boolean)))
    return ['Toutes les villes', ...values]
  }, [partners])

  const filtered = useMemo(() => {
    return partners.filter((partner) => {
      const queryOk = !query.trim() || `${partner.name} ${partner.city} ${partner.segment} ${partner.owner} ${partner.stage}`.toLowerCase().includes(query.trim().toLowerCase())
      const cityOk = city === 'Toutes les villes' || partner.city === city
      const statusOk = status === 'Tous les statuts' || partner.stage === status
      return queryOk && cityOk && statusOk
    })
  }, [city, partners, query, status])

  const visiblePartners: Partner[] = filtered.length ? filtered : [{
    id: 'preview',
    name: 'AngelCare',
    city: 'Rabat',
    segment: 'angelcare_internal',
    owner: 'Non assigné',
    stage: 'active',
    plan: 'Aucun plan',
    mrr: 0,
    health: 62,
    participants: 0,
    documents: 0,
    billing: 'À jour',
    renewal: 'À préparer',
    risk: 'Faible',
  }]

  async function createPartner() {
    setMessage('')
    const name = form.name.trim()
    if (!name) {
      setMessage('Nom partenaire requis.')
      return
    }

    const response = await fetch('/api/traininghub/internal/partners-portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      setMessage(payload?.message || payload?.error || 'Création non finalisée.')
      return
    }

    setCreateOpen(false)
    setForm({ name: '', city: 'Rabat' })
    await load()
  }

  return (
    <main style={page}>
      <aside style={sidebarShell}>
        <div style={sidebarBrandCard}>
          <div style={sidebarLogoFrame}>
            <img src="/logo.png" alt="AngelCare" style={sidebarLogo} />
          </div>
          <div style={sidebarProductTitle}>
            <strong>TrainingHub</strong>
            <span>Internal Admin OS</span>
          </div>
        </div>

        <nav style={sidebarNav}>
          {sidebarGroups.map((group) => (
            <div key={group.title} style={sidebarGroupBlock}>
              <div style={sidebarGroupTitle}>{group.title}</div>
              {group.items.map((item) => (
                <Link key={`${group.title}-${item.label}`} href={item.href} style={item.active ? sidebarFinalActive : sidebarFinalLink}>
                  <span style={sidebarFinalIcon}>{item.icon}</span>
                  <b>{item.label}</b>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div style={sidebarBottomSpace} />
      </aside>

      <section style={workspace}>
        <header style={topbar}>
          <div style={topBrand}>
            <span>ANGELCARE</span>
            <b>TRAININGHUB</b>
          </div>
          <div style={topRight}>
            <label style={globalSearch}>
              <span>⌕</span>
              <input style={bareInput} placeholder="Rechercher un partenaire, une session…" />
            </label>
            <button style={iconButton}>🔔</button>
            <button style={iconButton}>?</button>
            <div style={user}>
              <strong>M</strong>
              <span>Marie Dupont<small>Admin</small></span>
            </div>
          </div>
        </header>

        {snapshot.warning ? <div style={warning}>{snapshot.warning}</div> : null}

        <section style={exactHero}>
          <div style={heroOrbOne} />
          <div style={heroOrbTwo} />
          <div style={heroCopy}>
            <span style={welcome}>Bienvenue Marie</span>
            <h1 style={heroTitle}>Pilotez vos partenaires, revenus, sessions, certificats, demandes, risques et opérations en temps réel.</h1>
            <p style={heroLead}><b style={infoIcon}>ⓘ</b> Chaîne opérationnelle intégrée du partenariat à la délivrance et au renouvellement.</p>
          </div>

          <aside style={overviewCard}>
            <div style={overviewTop}>
              <strong>Vue d’ensemble</strong>
              <button style={monthButton}>Ce mois-ci⌄</button>
            </div>
            <div style={overviewMetrics}>
              <OverviewMetric label="Chiffre d’affaires" value={formatMoney(overview.revenue_mad || 128400)} delta="4,8%" />
              <OverviewMetric label="Sessions délivrées" value={overview.sessions_delivered || counts.sessions || 42} delta="9,5%" />
              <OverviewMetric label="Taux de certification" value={`${overview.certification_rate || 92.7} %`} delta="4,3pts" />
            </div>
          </aside>
        </section>

        <section style={portfolioHero}>
          <div>
            <span style={eyebrow}>ANGELCARE TRAININGHUB · PARTENAIRES</span>
            <h2 style={sectionTitle}>Portefeuille partenaires</h2>
            <p style={sectionLead}>Vue stratégique, commerciale, delivery, preuves et renouvellement de tous les établissements partenaires.</p>
            <div style={heroActions}>
              <button style={primary} onClick={() => setCreateOpen(true)}>Créer partenaire</button>
              <button style={secondary}>Exporter</button>
              <button style={secondary} onClick={load}>Rafraîchir</button>
            </div>
          </div>

          <div style={healthBox}>
            <span>Health Score global</span>
            <strong>{health.score || 62}/100</strong>
            <small>{health.at_risk || 0} partenaire(s) à risque · {health.blocked || 0} bloqué(s)</small>
          </div>
        </section>

        <section style={kpiStrip}>
          <Kpi icon="👥" label="Partenaires actifs" value={counts.partners || partners.length} note="portefeuille réel" />
          <Kpi icon="📁" label="Offres ouvertes" value={counts.proposals || 0} note="pipeline commercial" />
          <Kpi icon="🛒" label="Commandes" value={counts.orders || 0} note="confirmées" />
          <Kpi icon="🧾" label="Factures ouvertes" value={counts.invoices || 0} note="à suivre" />
          <Kpi icon="🗓" label="Sessions" value={counts.sessions || 0} note="delivery" />
          <Kpi icon="🛡" label="Certificats" value={counts.certificates || 0} note="preuves" />
          <Kpi icon="↻" label="Renouvellement" value="100%" note="santé portefeuille" />
        </section>

        <section style={portfolioCard}>
          <div style={portfolioTop}>
            <div>
              <span style={eyebrow}>MASTER PORTFOLIO</span>
              <h3 style={portfolioTitle}>Partenaires ({visiblePartners.length})</h3>
            </div>
            <div style={filters}>
              <label style={search}>
                <span>⌕</span>
                <input style={bareInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un partenaire…" />
              </label>
              <select style={select} value={city} onChange={(event) => setCity(event.target.value)}>
                {cities.map((value) => <option key={value}>{value}</option>)}
              </select>
              <select style={select} value={status} onChange={(event) => setStatus(event.target.value)}>
                {['Tous les statuts', 'active', 'onboarding', 'paused', 'archived'].map((value) => <option key={value}>{value}</option>)}
              </select>
              <button style={secondary}>Colonnes</button>
            </div>
          </div>

          <div style={partnerGrid}>
            {visiblePartners.map((partner) => <PartnerCard key={partner.id} partner={partner} />)}
          </div>
        </section>
      </section>

      {loading ? <div style={loadingPill}>Synchronisation portefeuille…</div> : null}

      {createOpen ? (
        <div style={modalOverlay}>
          <div style={modal}>
            <div style={modalTop}>
              <div>
                <span style={eyebrow}>NOUVEAU PARTENAIRE</span>
                <h2 style={modalTitle}>Créer un établissement partenaire</h2>
                <p style={sectionLead}>Création directe dans le portefeuille TrainingHub.</p>
              </div>
              <button style={close} onClick={() => setCreateOpen(false)}>×</button>
            </div>

            {message ? <div style={formMessage}>{message}</div> : null}

            <label style={field}>
              <span>Nom établissement</span>
              <input style={fieldInput} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Crèche / école partenaire" />
            </label>
            <label style={field}>
              <span>Ville</span>
              <input style={fieldInput} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </label>

            <div style={modalFooter}>
              <button style={secondary} onClick={() => setCreateOpen(false)}>Annuler</button>
              <button style={primary} onClick={createPartner}>Créer partenaire</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function OverviewMetric({ label, value, delta }: { label: string; value: ReactNode; delta: string }) {
  return (
    <div style={overviewMetric}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>▲ {delta} vs mai</small>
    </div>
  )
}

function Kpi({ icon, label, value, note }: { icon: string; label: string; value: ReactNode; note: string }) {
  return (
    <article style={kpi}>
      <span style={kpiIcon}>{icon}</span>
      <div>
        <p style={kpiLabel}>{label}</p>
        <strong style={kpiValue}>{value}</strong>
        <small style={kpiNote}>{note}</small>
      </div>
    </article>
  )
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <article style={partnerCard}>
      <div style={partnerHead}>
        <div style={avatar}>{partner.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <h4 style={partnerName}>{partner.name}</h4>
          <p style={partnerSub}>{partner.id.slice(0, 8)} · {partner.city}</p>
        </div>
        <span style={stagePill}>{partner.stage}</span>
      </div>

      <div style={metaGrid}>
        <Meta label="Segment" value={partner.segment} />
        <Meta label="Owner" value={partner.owner} accent />
        <Meta label="Plan" value={partner.plan} />
        <Meta label="Santé" value={`${partner.health}/100`} />
        <Meta label="Delivery" value={`${partner.participants} participant(s)`} />
        <Meta label="Facturation" value={partner.billing} />
        <Meta label="Preuves" value={`${partner.documents} document(s)`} />
        <Meta label="Risque" value={partner.risk} good />
      </div>

      <div style={partnerActions}>
        <button style={partnerButton}>Diagnostic partenaire</button>
        <button style={partnerButton}>Créer offre</button>
        <button style={partnerButtonPrimary}>Ouvrir dossier</button>
      </div>
    </article>
  )
}

function Meta({ label, value, accent, good }: { label: string; value: ReactNode; accent?: boolean; good?: boolean }) {
  return (
    <div style={meta}>
      <span>{label}</span>
      <strong style={good ? greenText : accent ? blueText : undefined}>{value}</strong>
    </div>
  )
}

const page: CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '324px minmax(0,1fr)', background: '#f4f7fd', color: '#0b1733', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const side: CSSProperties = { position: 'sticky', top: 0, height: '100vh', overflow: 'auto', background: '#fff', borderRight: '1px solid #dfe8f5', padding: 20, display: 'grid', gap: 20, alignContent: 'start' }
const brand: CSSProperties = { display: 'grid', gap: 4, padding: 14, border: '1px solid #e0e8f5', borderRadius: 18, boxShadow: '0 14px 32px rgba(17,42,88,.06)' }
const logo: CSSProperties = { width: 170, height: 54, objectFit: 'contain', objectPosition: 'left center' }
const nav: CSSProperties = { display: 'grid', gap: 8 }
const navItem: CSSProperties = { minHeight: 54, display: 'grid', gridTemplateColumns: '34px 1fr auto', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#17284b', borderRadius: 14, padding: '0 14px', fontWeight: 850 }
const navActive: CSSProperties = { ...navItem, color: '#075cff', background: '#edf4ff', boxShadow: 'inset 0 0 0 1px #e0eaff' }
const workspace: CSSProperties = { minWidth: 0, padding: 24, display: 'grid', gap: 20 }
const topbar: CSSProperties = { minHeight: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '0 6px 14px', borderBottom: '1px solid #dfe8f5' }
const topBrand: CSSProperties = { display: 'flex', gap: 14, alignItems: 'center', letterSpacing: '.12em', fontWeight: 950 }
const topRight: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 }
const globalSearch: CSSProperties = { width: 420, height: 46, display: 'flex', alignItems: 'center', gap: 9, border: '1px solid #d7e3f4', background: '#fff', borderRadius: 14, padding: '0 14px', color: '#7990b2' }
const bareInput: CSSProperties = { width: '100%', border: 0, outline: 0, background: 'transparent', color: '#12203b', fontWeight: 800 }
const iconButton: CSSProperties = { width: 42, height: 42, display: 'grid', placeItems: 'center', border: '1px solid #d7e3f4', background: '#fff', borderRadius: 999 }
const user: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900 }
const warning: CSSProperties = { padding: 12, borderRadius: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontWeight: 900 }
const exactHero: CSSProperties = { position: 'relative', minHeight: 360, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 720px', gap: 28, alignItems: 'center', padding: '38px 32px 38px 56px', borderRadius: 28, border: '1px solid #dbe6f6', background: 'linear-gradient(135deg,#edf5ff 0%,#ffffff 47%,#eaf2ff 100%)', boxShadow: '0 20px 46px rgba(19,48,96,.08)' }
const heroOrbOne: CSSProperties = { position: 'absolute', right: 600, top: -240, width: 760, height: 760, borderRadius: '50%', border: '1px solid rgba(255,255,255,.86)', background: 'radial-gradient(circle, rgba(255,255,255,.50), rgba(255,255,255,.08) 58%, transparent 65%)' }
const heroOrbTwo: CSSProperties = { position: 'absolute', right: 520, top: -320, width: 900, height: 900, borderRadius: '50%', border: '1px solid rgba(255,255,255,.70)' }
const heroCopy: CSSProperties = { position: 'relative', zIndex: 2, maxWidth: 1050 }
const welcome: CSSProperties = { display: 'block', color: '#075cff', fontSize: 24, fontWeight: 950, marginBottom: 22 }
const heroTitle: CSSProperties = { margin: 0, color: '#061a44', fontSize: 54, lineHeight: 1.16, letterSpacing: '-.045em', fontWeight: 950, maxWidth: 1120 }
const heroLead: CSSProperties = { margin: '30px 0 0', display: 'flex', alignItems: 'center', gap: 14, color: '#6a7c98', fontSize: 21, fontWeight: 800 }
const infoIcon: CSSProperties = { color: '#075cff', fontSize: 27 }
const overviewCard: CSSProperties = { position: 'relative', zIndex: 3, minHeight: 210, borderRadius: 24, background: '#fff', border: '1px solid #e0e8f6', boxShadow: '0 22px 44px rgba(20,45,90,.12)', padding: 34 }
const overviewTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 30 }
const monthButton: CSSProperties = { border: '1px solid #d8e2f2', background: '#fff', borderRadius: 12, padding: '11px 18px', color: '#253957', fontWeight: 850 }
const overviewMetrics: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 30 }
const overviewMetric: CSSProperties = { minHeight: 104, display: 'grid', gap: 10, paddingLeft: 28, borderLeft: '1px solid #dfe7f5' }
const portfolioHero: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 28, alignItems: 'center', padding: 28, borderRadius: 28, background: '#fff', border: '1px solid #dfe8f5', boxShadow: '0 16px 36px rgba(19,48,96,.06)' }
const eyebrow: CSSProperties = { color: '#075cff', fontSize: 13, fontWeight: 950, letterSpacing: '.18em' }
const sectionTitle: CSSProperties = { margin: '7px 0 6px', fontSize: 25, letterSpacing: '-.03em' }
const sectionLead: CSSProperties = { margin: 0, color: '#435572', fontWeight: 750 }
const heroActions: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }
const primary: CSSProperties = { border: 0, background: 'linear-gradient(135deg,#063d99,#075cff)', color: '#fff', borderRadius: 13, padding: '13px 18px', fontWeight: 950, boxShadow: '0 16px 32px rgba(7,92,255,.22)', cursor: 'pointer' }
const secondary: CSSProperties = { border: '1px solid #d7e3f4', background: '#fff', color: '#173969', borderRadius: 13, padding: '12px 16px', fontWeight: 900, cursor: 'pointer' }
const healthBox: CSSProperties = { minWidth: 310, padding: 24, borderRadius: 24, background: 'linear-gradient(135deg,#0b347e,#075cff)', color: '#fff', boxShadow: '0 18px 40px rgba(7,92,255,.24)' }
const kpiStrip: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 14 }
const kpi: CSSProperties = { minHeight: 122, display: 'grid', gridTemplateColumns: '54px 1fr', alignItems: 'center', gap: 14, padding: 18, borderRadius: 22, background: '#fff', border: '1px solid #dfe8f5', boxShadow: '0 14px 30px rgba(19,48,96,.055)', overflow: 'hidden' }
const kpiIcon: CSSProperties = { width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 999, background: '#edf4ff' }
const kpiLabel: CSSProperties = { margin: 0, color: '#20344f', fontSize: 15, fontWeight: 850 }
const kpiValue: CSSProperties = { display: 'block', margin: '4px 0', fontSize: 23, letterSpacing: '-.03em' }
const kpiNote: CSSProperties = { color: '#059669', fontWeight: 800 }
const portfolioCard: CSSProperties = { borderRadius: 30, background: '#fff', border: '1px solid #dfe8f5', padding: 24, boxShadow: '0 20px 46px rgba(19,48,96,.07)' }
const portfolioTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 20 }
const portfolioTitle: CSSProperties = { margin: '8px 0 0', fontSize: 24, letterSpacing: '-.03em' }
const filters: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }
const search: CSSProperties = { width: 320, height: 48, display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px', border: '1px solid #d7e3f4', background: '#fbfcff', borderRadius: 14 }
const select: CSSProperties = { height: 48, border: '1px solid #d7e3f4', borderRadius: 14, padding: '0 13px', background: '#fff', fontWeight: 850 }
const partnerGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(430px,1fr))', gap: 18 }
const partnerCard: CSSProperties = { display: 'grid', gap: 16, padding: 20, borderRadius: 24, background: 'linear-gradient(180deg,#ffffff,#fbfdff)', border: '1px solid #e0e8f5', boxShadow: '0 12px 28px rgba(19,48,96,.05)' }
const partnerHead: CSSProperties = { display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 14, alignItems: 'center' }
const avatar: CSSProperties = { width: 60, height: 60, display: 'grid', placeItems: 'center', borderRadius: 20, background: '#eaf1ff', color: '#174ea6', fontSize: 23, fontWeight: 950 }
const partnerName: CSSProperties = { margin: 0, fontSize: 21, letterSpacing: '-.03em' }
const partnerSub: CSSProperties = { margin: '4px 0 0', color: '#6b7b96', fontWeight: 750 }
const stagePill: CSSProperties = { padding: '9px 12px', borderRadius: 999, background: '#ecfdf5', color: '#059669', fontWeight: 950 }
const metaGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const meta: CSSProperties = { minHeight: 78, display: 'grid', alignContent: 'center', gap: 5, padding: 12, borderRadius: 16, background: '#f8fbff', border: '1px solid #e0e8f5', overflow: 'hidden' }
const greenText: CSSProperties = { color: '#059669' }
const blueText: CSSProperties = { color: '#075cff' }
const partnerActions: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const partnerButton: CSSProperties = { ...secondary, padding: '10px 13px' }
const partnerButtonPrimary: CSSProperties = { ...primary, padding: '10px 13px' }
const loadingPill: CSSProperties = { position: 'fixed', right: 24, bottom: 24, padding: '12px 16px', borderRadius: 999, background: '#075cff', color: '#fff', fontWeight: 950, boxShadow: '0 18px 34px rgba(7,92,255,.25)' }
const modalOverlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center', background: 'rgba(7,19,42,.45)', padding: 24 }
const modal: CSSProperties = { width: 'min(760px,100%)', display: 'grid', gap: 16, padding: 28, borderRadius: 28, background: '#fff', boxShadow: '0 44px 100px rgba(8,18,36,.24)' }
const modalTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14 }
const modalTitle: CSSProperties = { margin: '8px 0 8px', fontSize: 32, letterSpacing: '-.04em' }
const close: CSSProperties = { width: 48, height: 48, borderRadius: 16, border: '1px solid #d7e3f4', background: '#fff', fontSize: 26, fontWeight: 950 }
const field: CSSProperties = { display: 'grid', gap: 8, fontWeight: 900 }
const fieldInput: CSSProperties = { minHeight: 48, border: '1px solid #d7e3f4', borderRadius: 14, padding: '0 14px', fontWeight: 850 }
const modalFooter: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10 }
const formMessage: CSSProperties = { padding: 12, borderRadius: 14, background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', fontWeight: 900 }


const sidebarShell: CSSProperties = {
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflow: 'auto',
  background: '#ffffff',
  borderRight: '1px solid #dfe8f6',
  padding: '22px 20px 28px',
  display: 'grid',
  alignContent: 'start',
  gap: 18,
  boxShadow: '10px 0 34px rgba(22,47,88,.035)',
}

const sidebarBrandCard: CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  background: 'linear-gradient(180deg,#ffffff,#fbfdff)',
  border: '1px solid #d9e5f6',
  boxShadow: '0 18px 46px rgba(18,45,89,.08)',
}

const sidebarLogoFrame: CSSProperties = {
  height: 92,
  borderRadius: 20,
  display: 'grid',
  placeItems: 'center',
  background: '#ffffff',
  border: '1px solid #dce8f7',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.7)',
}

const sidebarLogo: CSSProperties = {
  width: 218,
  maxWidth: '88%',
  height: 72,
  objectFit: 'contain',
}

const sidebarProductTitle: CSSProperties = {
  display: 'grid',
  gap: 4,
  color: '#12213c',
}

const sidebarNav: CSSProperties = {
  display: 'grid',
  gap: 17,
}

const sidebarGroupBlock: CSSProperties = {
  display: 'grid',
  gap: 8,
}

const sidebarGroupTitle: CSSProperties = {
  color: '#3d73ff',
  fontSize: 12,
  lineHeight: 1,
  letterSpacing: '.17em',
  fontWeight: 950,
  textTransform: 'uppercase',
  padding: '0 8px',
}

const sidebarFinalLink: CSSProperties = {
  minHeight: 46,
  display: 'grid',
  gridTemplateColumns: '34px 1fr',
  alignItems: 'center',
  gap: 10,
  padding: '0 12px',
  borderRadius: 15,
  color: '#52677f',
  textDecoration: 'none',
  fontSize: 16,
  fontWeight: 900,
  transition: 'background .18s ease, color .18s ease, transform .18s ease',
}

const sidebarFinalActive: CSSProperties = {
  ...sidebarFinalLink,
  color: '#ffffff',
  background: 'linear-gradient(135deg,#123b8f,#315fd8)',
  boxShadow: '0 18px 34px rgba(49,95,216,.24)',
}

const sidebarFinalIcon: CSSProperties = {
  width: 32,
  height: 32,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 999,
  background: 'rgba(231,239,255,.95)',
  color: '#637b9d',
  fontSize: 14,
  fontWeight: 950,
}

const sidebarBottomSpace: CSSProperties = {
  height: 24,
}
