'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import CreatePartnerDossierMegaModal from './CreatePartnerDossierMegaModal'
import ExistingPartnerDossierControlModal from './ExistingPartnerDossierControlModal'
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
  recent?: Array<{ id: string; type: string; title: string; subtitle: string; date: string }>
  score?: { health?: number; renewal?: number; conversion?: number; certification?: number; presence?: number }
  finance?: { revenue_mad?: number; forecast_mad?: number }
  alerts?: { high_risks?: number; partners_at_risk?: number; blocked?: number; sla_rate?: number }
  warning?: string
}

type NavItem = { label: string; href: string; icon: string; active?: boolean }
type NavGroup = { title: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  { title: 'PILOTAGE', items: [{ label: 'Command Center', href: '/traininghub', icon: '⌘', active: true }] },
  {
    title: 'PARTENAIRES',
    items: [
      { label: 'Partenaires', href: '/traininghub/partners', icon: '◉' },
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

export default function TrainingHubCommandCenterDynamicPremium() {
  const [snapshot, setSnapshot] = useState<Snapshot>({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('Toutes les villes')
  const [portfolioView, setPortfolioView] = useState<'cards' | 'list'>('cards')
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newPartner, setNewPartner] = useState({ name: '', city: 'Rabat' })
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/traininghub/internal/command-center', { cache: 'no-store' })
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
  const score = snapshot.score || {}
  const finance = snapshot.finance || {}
  const alerts = snapshot.alerts || {}
  const partners = snapshot.partners || []

  const cities = useMemo(() => {
    const list = Array.from(new Set(partners.map((partner) => partner.city).filter(Boolean)))
    return ['Toutes les villes', ...list]
  }, [partners])

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const cityOk = cityFilter === 'Toutes les villes' || partner.city === cityFilter
      const queryOk =
        !query.trim() ||
        `${partner.name} ${partner.city} ${partner.segment} ${partner.owner} ${partner.stage}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())

      return cityOk && queryOk
    })
  }, [cityFilter, partners, query])

  const displayPartners = filteredPartners.length
    ? filteredPartners
    : [
        {
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
        },
      ]

  const kpis = [
    { icon: '👥', label: 'Partenaires actifs', value: counts.partners || partners.length, note: 'portefeuille réel', tone: 'blue' },
    { icon: '💵', label: 'Prévision revenue', value: money(finance.forecast_mad || 0), note: 'potentiel commercial', tone: 'green' },
    { icon: '📁', label: 'Offres ouvertes', value: counts.proposals || 0, note: 'pipeline commercial', tone: 'indigo' },
    { icon: '🛒', label: 'Commandes', value: counts.orders || 0, note: 'confirmées', tone: 'violet' },
    { icon: '🧾', label: 'Factures ouvertes', value: counts.invoices || 0, note: 'à sécuriser', tone: 'orange' },
    { icon: '🗓', label: 'Sessions', value: counts.sessions || 0, note: 'delivery', tone: 'cyan' },
    { icon: '🛡', label: 'Certificats', value: counts.certificates || 0, note: 'preuves', tone: 'emerald' },
    { icon: '↻', label: 'Renouvellement', value: `${score.renewal ?? 100}%`, note: 'santé portefeuille', tone: 'blue' },
  ]

  async function createPartner() {
    setMessage('')
    const name = newPartner.name.trim()
    if (!name) {
      setMessage('Nom partenaire requis.')
      return
    }

    const response = await fetch('/api/traininghub/internal/command-center', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPartner),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      setMessage(payload?.message || payload?.error || 'Création non finalisée.')
      return
    }

    setCreateOpen(false)
    setNewPartner({ name: '', city: 'Rabat' })
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
          {navGroups.map((group) => (
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
      </aside>

      <section style={workspace}>
        <header style={topbar}>
          <div>
            <span style={topEyebrow}>ANGELCARE TRAININGHUB</span>
            <h1>Command Center</h1>
            <p>Pilotage intelligent du portefeuille, de la conversion, de la delivery, des preuves et du renouvellement.</p>
          </div>
          <div style={topActions}>
            <button style={glassButton} onClick={load}>Rafraîchir live</button>
            <button style={primaryButton} onClick={() => setCreateOpen(true)}>Créer partenaire</button>
            <button style={glassButton}>Exporter</button>
          </div>
        </header>

        {snapshot.warning ? <div style={warning}>{snapshot.warning}</div> : null}

        <section style={heroStage}>
          <div style={heroMeshOne} />
          <div style={heroMeshTwo} />
          <div style={heroGlow} />

          <div style={heroCopy}>
            <span style={heroBadge}>COMMAND EXPERIENCE • LIVE PORTFOLIO</span>
            <h2>Un cockpit vivant pour piloter les vrais partenaires, les revenus, les sessions et les preuves sans friction.</h2>
            <p>
              Vue unifiée du portefeuille : activité, conversion, crédits, sessions, certificats, risques, demandes et actions prioritaires.
            </p>
            <div style={heroActions}>
              <button style={primaryButton} onClick={() => setCreateOpen(true)}>Créer partenaire</button>
              <button style={softButton}>Créer une offre</button>
              <button style={softButton}>Planifier session</button>
            </div>
          </div>

          <aside style={smartScoreCard}>
            <div style={scoreTop}>
              <span>Santé portefeuille</span>
              <strong>{score.health ?? 76}/100</strong>
            </div>
            <div style={ringRow}>
              <Ring value={Number(score.health ?? 76)} label="Santé" />
              <Ring value={Number(score.conversion ?? 0)} label="Conversion" />
              <Ring value={Number(score.certification ?? 0)} label="Certif." />
            </div>
            <div style={scoreFooter}>
              <span>{alerts.partners_at_risk || 0} partenaire(s) à risque</span>
              <b>{money(finance.forecast_mad || 0)}</b>
            </div>
          </aside>
        </section>

        <section style={kpiGrid}>
          {kpis.map((item) => <Kpi key={item.label} {...item} />)}
        </section>

        <section style={chainCard}>
          <div style={sectionHeader}>
            <div>
              <span style={miniEyebrow}>CHAÎNE OPÉRATIONNELLE</span>
              <h3>Du partenaire au renouvellement</h3>
            </div>
            <button style={smallGlass}>Vue détaillée</button>
          </div>
          <div style={chainRow}>
            {chain.map(([index, label, key], currentIndex) => (
              <div key={label} style={chainItemWrap}>
                <div style={chainStep}>
                  <b>{index}</b>
                  <strong>{label}</strong>
                  <small>{fmt(counts[key] || 0)}</small>
                </div>
                {currentIndex < chain.length - 1 ? <em style={chainArrow}>→</em> : null}
              </div>
            ))}
          </div>
        </section>

        <section style={portfolioCard}>
          <PartnerDirectory
            partners={displayPartners}
            counts={counts}
            query={query}
            setQuery={setQuery}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            cities={cities}
            viewMode={portfolioView}
            setViewMode={setPortfolioView}
            onOpenPartner={setSelectedPartner}
          />
        </section>

        <section style={insightGrid}>
          <InsightPanel title="Pipeline commercial" eyebrow="REVENU">
            <MetricLine label="Offres ouvertes" value={counts.proposals || 0} width={78} />
            <MetricLine label="Commandes confirmées" value={counts.orders || 0} width={65} />
            <MetricLine label="Factures ouvertes" value={counts.invoices || 0} width={42} warning />
            <MetricLine label="Crédits disponibles" value={counts.credits || 0} width={86} />
          </InsightPanel>

          <InsightPanel title="Delivery & preuves" eyebrow="OPÉRATIONS">
            <MetricLine label="Sessions planifiées" value={counts.sessions || 0} width={70} />
            <MetricLine label="Participants" value={counts.participants || 0} width={58} />
            <MetricLine label="Certificats émis" value={counts.certificates || 0} width={82} />
            <MetricLine label="Documents publiés" value={counts.documents || 0} width={52} />
          </InsightPanel>

          <InsightPanel title="Activité récente" eyebrow="LIVE">
            {(snapshot.recent?.length ? snapshot.recent : [
              { id: 'a', type: 'Commande', title: 'Commande confirmée', subtitle: 'Portefeuille AngelCare', date: '' },
              { id: 'b', type: 'Session', title: 'Session planifiée', subtitle: 'Delivery', date: '' },
              { id: 'c', type: 'Certificat', title: 'Certificat prêt', subtitle: 'Preuves', date: '' },
            ]).slice(0, 4).map((item) => <Activity key={`${item.id}-${item.type}`} item={item} />)}
          </InsightPanel>

          <InsightPanel title="Actions prioritaires" eyebrow="NEXT BEST ACTION">
            <Action text="Finaliser les dossiers partenaires sans owner" />
            <Action text="Convertir les offres acceptées en commandes" />
            <Action text="Planifier les sessions validées commercialement" />
            <Action text="Publier les preuves et certificats disponibles" />
          </InsightPanel>
        </section>
      </section>

      {loading ? <div style={loadingPillStyle}>Synchronisation live…</div> : null}

      {selectedPartner ? (
        <ExistingPartnerDossierControlModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onChanged={async () => { await load() }}
        />
      ) : null}

      {createOpen ? (
        <CreatePartnerDossierMegaModal
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false)
            await load()
          }}
        />
      ) : null}
    </main>
  )
}

function Ring({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div style={{ ...ring, background: `conic-gradient(#78ffca ${safe * 3.6}deg, rgba(255,255,255,.22) 0deg)` }}>
      <div style={ringInner}>
        <strong>{Math.round(safe)}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, note, tone }: { icon: string; label: string; value: ReactNode; note: string; tone: string }) {
  const iconStyle =
    tone === 'green' || tone === 'emerald' ? kpiIconGreen :
    tone === 'orange' ? kpiIconOrange :
    tone === 'violet' ? kpiIconViolet :
    tone === 'cyan' ? kpiIconCyan :
    kpiIconBlue

  return (
    <article style={kpiCard}>
      <span style={iconStyle}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  )
}

function PartnerCard({ partner, onOpen }: { partner: Partner; onOpen: () => void }) {
  const score = Math.max(0, Math.min(100, Number(partner.health || 0)))
  const riskStyle = partner.risk === 'Faible' ? pillGreen : partner.risk === 'Élevé' ? pillRed : pillOrange

  return (
    <article style={partnerCard}>
      <div style={partnerGlow} />
      <div style={partnerHeader}>
        <div style={partnerAvatar}>{partner.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <h4>{partner.name}</h4>
          <p>{partner.id.slice(0, 8)} • {partner.city}</p>
        </div>
        <span style={stagePill}>{partner.stage}</span>
      </div>

      <div style={healthLine}>
        <span>Indice santé</span>
        <strong>{score}/100</strong>
      </div>
      <div style={healthTrack}><i style={{ width: `${score}%` }} /></div>

      <div style={metaGrid}>
        <Meta label="Segment" value={partner.segment} />
        <Meta label="Owner" value={partner.owner} accent />
        <Meta label="Plan" value={partner.plan} />
        <Meta label="Delivery" value={`${partner.participants} participant(s)`} />
        <Meta label="Facturation" value={partner.billing} />
        <Meta label="Preuves" value={`${partner.documents} document(s)`} />
      </div>

      <div style={partnerFooter}>
        <span style={riskStyle}>{partner.risk}</span>
        <button style={miniPrimary} onClick={onOpen}>Ouvrir dossier</button>
      </div>
    </article>
  )
}

function Meta({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div style={metaTile}>
      <span>{label}</span>
      <strong style={accent ? accentText : undefined}>{value}</strong>
    </div>
  )
}


function PartnerDirectory({
  partners,
  counts,
  query,
  setQuery,
  cityFilter,
  setCityFilter,
  cities,
  viewMode,
  setViewMode,
  onOpenPartner,
}: {
  partners: Partner[]
  counts: Record<string, number>
  query: string
  setQuery: (value: string) => void
  cityFilter: string
  setCityFilter: (value: string) => void
  cities: string[]
  viewMode: 'cards' | 'list'
  setViewMode: (value: 'cards' | 'list') => void
  onOpenPartner: (partner: Partner) => void
}) {
  const avgHealth = partners.length
    ? Math.round(partners.reduce((sum, partner) => sum + Number(partner.health || 0), 0) / partners.length)
    : 0

  const atRisk = partners.filter((partner) => partner.risk !== 'Faible' || Number(partner.health || 0) < 70).length
  const withOwner = partners.filter((partner) => partner.owner && partner.owner !== 'Non assigné').length
  const activePartners = partners.filter((partner) => String(partner.stage || '').toLowerCase().includes('active')).length || partners.length

  return (
    <div style={directoryShell}>
      <div style={directoryHero}>
        <div style={directoryHeroGlow} />
        <div style={directoryTitleBlock}>
          <span style={miniEyebrow}>MASTER PORTFOLIO · PARTNERS DIRECTORY</span>
          <h3>Répertoire partenaires & passerelles opérationnelles</h3>
          <p>
            Une vue profonde pour piloter chaque établissement : santé, owner, plan, delivery,
            facturation, preuves, risque, accès portail et prochaines actions.
          </p>
        </div>

        <div style={directoryCommandPanel}>
          <DirectoryStat label="Partenaires" value={partners.length} note={`${activePartners} actif(s)`} />
          <DirectoryStat label="Santé moyenne" value={`${avgHealth}/100`} note={`${atRisk} à surveiller`} />
          <DirectoryStat label="Owners" value={`${withOwner}/${partners.length}`} note="couverture interne" />
        </div>
      </div>

      <div style={gatewayGrid}>
        <GatewayTile icon="◉" title="Dossiers" text="Ouvrir le cockpit 360 partenaire." value={partners.length} />
        <GatewayTile icon="◆" title="Offres" text="Construire et convertir les offres." value={counts.proposals || 0} />
        <GatewayTile icon="▥" title="Billing" text="Compte, abonnement, crédits et factures." value={counts.invoices || 0} />
        <GatewayTile icon="▣" title="Delivery" text="Sessions, participants et présences." value={counts.sessions || 0} />
        <GatewayTile icon="✦" title="Preuves" text="Certificats, documents et kits." value={counts.certificates || 0} />
        <GatewayTile icon="△" title="Risques & SLA" text="Demandes, alertes et priorités." value={counts.requests || 0} />
      </div>

      <div style={directoryToolbar}>
        <div style={directorySearchCluster}>
          <label style={directorySearchBox}>
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher partenaire, ville, owner, plan…" />
          </label>
          <select style={directorySelectBox} value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            {cities.map((city) => <option key={city}>{city}</option>)}
          </select>
        </div>

        <div style={viewSwitch}>
          <button type="button" style={viewMode === 'list' ? viewSwitchActive : viewSwitchButton} onClick={() => setViewMode('list')}>
            ☰ Liste premium
          </button>
          <button type="button" style={viewMode === 'cards' ? viewSwitchActive : viewSwitchButton} onClick={() => setViewMode('cards')}>
            ◫ Cartes premium
          </button>
          <button type="button" style={smallGlass}>Exporter</button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div style={directoryList}>
          <div style={directoryListHeader}>
            <span>Partenaire</span>
            <span>Commercial</span>
            <span>Plan & billing</span>
            <span>Delivery</span>
            <span>Preuves</span>
            <span>Risque</span>
            <span>Action</span>
          </div>
          {partners.map((partner) => (
            <DirectoryPartnerRow key={partner.id} partner={partner} onOpen={() => onOpenPartner(partner)} />
          ))}
        </div>
      ) : (
        <div style={directoryCardsGrid}>
          {partners.map((partner) => (
            <DirectoryPartnerCardVisualForce key={partner.id} partner={partner} onOpen={() => onOpenPartner(partner)} />
          ))}
        </div>
      )}
    </div>
  )
}

function DirectoryStat({ label, value, note }: { label: string; value: ReactNode; note: string }) {
  return (
    <div style={directoryStat}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function GatewayTile({ icon, title, text, value }: { icon: string; title: string; text: string; value: ReactNode }) {
  return (
    <button type="button" style={gatewayTile}>
      <span style={gatewayIcon}>{icon}</span>
      <div style={gatewayBody}>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
      <b style={gatewayValue}>{value}</b>
    </button>
  )
}

function DirectoryPartnerRow({ partner, onOpen }: { partner: Partner; onOpen: () => void }) {
  const score = Math.max(0, Math.min(100, Number(partner.health || 0)))
  const riskStyle = partner.risk === 'Faible' ? directoryPillGreen : partner.risk === 'Élevé' ? directoryPillRed : directoryPillOrange

  return (
    <button type="button" style={directoryRow} onClick={onOpen}>
      <div style={directoryPartnerIdentity}>
        <span style={directoryAvatar}>{partner.name.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{partner.name}</strong>
          <small>{partner.id.slice(0, 8)} · {partner.city}</small>
        </div>
      </div>

      <div style={directoryCell}>
        <span>Owner</span>
        <b>{partner.owner}</b>
        <small>{partner.segment}</small>
      </div>

      <div style={directoryCell}>
        <span>{partner.plan}</span>
        <b>{partner.billing}</b>
        <small>{money(partner.mrr || 0)} MRR</small>
      </div>

      <div style={directoryCell}>
        <span>Participants</span>
        <b>{partner.participants}</b>
        <small>sessions & delivery</small>
      </div>

      <div style={directoryCell}>
        <span>Documents</span>
        <b>{partner.documents}</b>
        <small>certificats & preuves</small>
      </div>

      <div style={directoryRiskCell}>
        <span style={riskStyle}>{partner.risk}</span>
        <div style={directoryHealthTrack}><i style={{ width: `${score}%` }} /></div>
        <small>{score}/100 santé</small>
      </div>

      <div style={directoryActionCell}>
        <span>Ouvrir dossier</span>
      </div>
    </button>
  )
}

function DirectoryPartnerCard({ partner, onOpen }: { partner: Partner; onOpen: () => void }) {
  const score = Math.max(0, Math.min(100, Number(partner.health || 0)))
  const riskStyle = partner.risk === 'Faible' ? directoryPillGreen : partner.risk === 'Élevé' ? directoryPillRed : directoryPillOrange

  return (
    <button type="button" style={directoryPremiumCard} onClick={onOpen}>
      <div style={directoryCardGlow} />
      <header style={directoryCardHeader}>
        <span style={directoryAvatarLarge}>{partner.name.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{partner.name}</strong>
          <small>{partner.city} · {partner.segment}</small>
        </div>
        <em>{partner.stage}</em>
      </header>

      <div style={directoryCardScore}>
        <span>Indice santé</span>
        <b>{score}/100</b>
      </div>
      <div style={directoryHealthTrack}><i style={{ width: `${score}%` }} /></div>

      <div style={directoryCardMetaGrid}>
        <div><span>Owner</span><b>{partner.owner}</b></div>
        <div><span>Plan</span><b>{partner.plan}</b></div>
        <div><span>Billing</span><b>{partner.billing}</b></div>
        <div><span>Delivery</span><b>{partner.participants} participant(s)</b></div>
        <div><span>Preuves</span><b>{partner.documents} document(s)</b></div>
        <div><span>Renouv.</span><b>{partner.renewal}</b></div>
      </div>

      <footer style={directoryCardFooter}>
        <span style={riskStyle}>{partner.risk}</span>
        <strong>Ouvrir dossier 360 →</strong>
      </footer>
    </button>
  )
}


function InsightPanel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <article style={insightPanel}>
      <span style={miniEyebrow}>{eyebrow}</span>
      <h3>{title}</h3>
      <div style={panelBody}>{children}</div>
    </article>
  )
}

function MetricLine({ label, value, width, warning }: { label: string; value: ReactNode; width: number; warning?: boolean }) {
  return (
    <div style={metricLine}>
      <div><span>{label}</span><strong>{value}</strong></div>
      <div style={metricTrack}><i style={{ width: `${width}%`, background: warning ? 'linear-gradient(90deg,#ff8a3d,#ffcf5a)' : 'linear-gradient(90deg,#1d63ff,#5eead4)' }} /></div>
    </div>
  )
}

function Activity({ item }: { item: { type: string; title: string; subtitle: string; date: string } }) {
  return (
    <div style={activityRow}>
      <b>{item.type.slice(0, 1)}</b>
      <div><strong>{item.title}</strong><span>{item.subtitle}</span></div>
      <time>{dateLabel(item.date)}</time>
    </div>
  )
}

function Action({ text }: { text: string }) {
  return <div style={actionRow}><span>✦</span><strong>{text}</strong></div>
}

function ModalTile({ label, value }: { label: string; value: ReactNode }) {
  return <div style={modalTile}><span>{label}</span><strong>{value}</strong></div>
}

const page: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '324px minmax(0,1fr)',
  background:
    'radial-gradient(circle at 15% 8%, rgba(66,133,244,.12), transparent 28%), radial-gradient(circle at 80% 0%, rgba(0,214,201,.10), transparent 26%), #f4f7fd',
  color: '#071630',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const sidebarShell: CSSProperties = {
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflow: 'auto',
  background: 'rgba(255,255,255,.96)',
  borderRight: '1px solid #dfe8f6',
  padding: '22px 20px 28px',
  display: 'grid',
  alignContent: 'start',
  gap: 18,
  boxShadow: '10px 0 34px rgba(22,47,88,.035)',
  backdropFilter: 'blur(20px)',
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
}

const sidebarLogo: CSSProperties = { width: 218, maxWidth: '88%', height: 72, objectFit: 'contain' }
const sidebarProductTitle: CSSProperties = { display: 'grid', gap: 4, color: '#12213c' }
const sidebarNav: CSSProperties = { display: 'grid', gap: 17 }
const sidebarGroupBlock: CSSProperties = { display: 'grid', gap: 8 }
const sidebarGroupTitle: CSSProperties = { color: '#3d73ff', fontSize: 12, lineHeight: 1, letterSpacing: '.17em', fontWeight: 950, textTransform: 'uppercase', padding: '0 8px' }

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

const workspace: CSSProperties = { minWidth: 0, padding: 24, display: 'grid', gap: 20 }
const topbar: CSSProperties = {
  minHeight: 94,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  padding: '20px 22px',
  borderRadius: 28,
  background: 'rgba(255,255,255,.86)',
  border: '1px solid rgba(219,230,246,.92)',
  boxShadow: '0 20px 48px rgba(15,42,90,.07)',
  backdropFilter: 'blur(20px)',
}

const topEyebrow: CSSProperties = { color: '#2264ff', fontSize: 12, letterSpacing: '.18em', fontWeight: 950 }
const topActions: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const primaryButton: CSSProperties = { border: 0, color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', borderRadius: 16, padding: '14px 18px', fontWeight: 950, boxShadow: '0 18px 34px rgba(17,105,255,.24)', cursor: 'pointer' }
const softButton: CSSProperties = { border: '1px solid rgba(213,225,245,.98)', color: '#143866', background: 'rgba(255,255,255,.82)', borderRadius: 16, padding: '13px 17px', fontWeight: 950, cursor: 'pointer' }
const glassButton: CSSProperties = { ...softButton, background: '#fff' }
const smallGlass: CSSProperties = { border: '1px solid #d9e5f6', color: '#184171', background: '#fff', borderRadius: 14, padding: '11px 14px', fontWeight: 950 }

const warning: CSSProperties = { padding: 12, borderRadius: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontWeight: 900 }

const heroStage: CSSProperties = {
  position: 'relative',
  minHeight: 390,
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 430px',
  gap: 24,
  overflow: 'hidden',
  borderRadius: 34,
  padding: 34,
  background:
    'linear-gradient(135deg,rgba(255,255,255,.96) 0%,rgba(239,247,255,.94) 45%,rgba(223,238,255,.96) 100%)',
  border: '1px solid #d9e5f6',
  boxShadow: '0 26px 66px rgba(18,45,89,.09)',
}

const heroMeshOne: CSSProperties = { position: 'absolute', right: 300, top: -250, width: 760, height: 760, borderRadius: '50%', border: '1px solid rgba(79,134,255,.22)' }
const heroMeshTwo: CSSProperties = { position: 'absolute', right: -80, bottom: -300, width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,214,201,.13), transparent 63%)' }
const heroGlow: CSSProperties = { position: 'absolute', left: -100, top: -140, width: 430, height: 430, borderRadius: '50%', background: 'radial-gradient(circle, rgba(17,105,255,.16), transparent 64%)' }
const heroCopy: CSSProperties = { position: 'relative', zIndex: 2, display: 'grid', alignContent: 'center', maxWidth: 1080 }
const heroBadge: CSSProperties = { color: '#1169ff', fontWeight: 950, letterSpacing: '.18em', fontSize: 13 }
const heroActions: CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }

const smartScoreCard: CSSProperties = {
  position: 'relative',
  zIndex: 3,
  display: 'grid',
  gap: 22,
  alignContent: 'space-between',
  minHeight: 310,
  padding: 26,
  borderRadius: 30,
  color: '#fff',
  background:
    'radial-gradient(circle at 25% 10%, rgba(120,255,202,.28), transparent 38%), linear-gradient(135deg,#082a68 0%,#0d54dd 58%,#126dff 100%)',
  boxShadow: '0 30px 70px rgba(18,83,210,.28)',
  overflow: 'hidden',
}

const scoreTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }
const ringRow: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }
const ring: CSSProperties = { width: 104, height: 104, borderRadius: '50%', padding: 8, display: 'grid', placeItems: 'center' }
const ringInner: CSSProperties = { width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(4,24,66,.58)', display: 'grid', placeItems: 'center', textAlign: 'center', color: '#fff' }
const scoreFooter: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.22)', paddingTop: 16 }

const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 14 }
const kpiCard: CSSProperties = { minHeight: 140, position: 'relative', display: 'grid', gridTemplateColumns: '58px 1fr', alignItems: 'center', gap: 14, padding: 18, borderRadius: 24, background: 'linear-gradient(180deg,#ffffff,#fbfdff)', border: '1px solid #dce7f6', boxShadow: '0 18px 40px rgba(17,42,88,.06)', overflow: 'hidden' }
const kpiIconBase: CSSProperties = { width: 56, height: 56, display: 'grid', placeItems: 'center', borderRadius: 20, fontSize: 22, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.7)' }
const kpiIconBlue: CSSProperties = { ...kpiIconBase, background: 'linear-gradient(135deg,#e8f1ff,#dbeafe)', color: '#1169ff' }
const kpiIconGreen: CSSProperties = { ...kpiIconBase, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', color: '#059669' }
const kpiIconOrange: CSSProperties = { ...kpiIconBase, background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', color: '#ea580c' }
const kpiIconViolet: CSSProperties = { ...kpiIconBase, background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', color: '#7c3aed' }
const kpiIconCyan: CSSProperties = { ...kpiIconBase, background: 'linear-gradient(135deg,#ecfeff,#cffafe)', color: '#0891b2' }

const chainCard: CSSProperties = { display: 'grid', gap: 18, padding: 24, borderRadius: 30, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 20px 48px rgba(17,42,88,.065)' }
const sectionHeader: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }
const miniEyebrow: CSSProperties = { color: '#1169ff', fontWeight: 950, letterSpacing: '.16em', fontSize: 12 }
const chainRow: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(17,minmax(0,auto))', gap: 10, alignItems: 'center', overflowX: 'auto', paddingBottom: 6 }
const chainItemWrap: CSSProperties = { display: 'contents' }
const chainStep: CSSProperties = { minWidth: 150, minHeight: 92, display: 'grid', placeItems: 'center', gap: 5, padding: 14, borderRadius: 20, color: '#0f4db4', background: 'linear-gradient(180deg,#f8fbff,#eef5ff)', border: '1px solid #c9dcfb', boxShadow: '0 12px 24px rgba(17,85,205,.06)' }
const chainArrow: CSSProperties = { color: '#205796', fontWeight: 950, fontStyle: 'normal' }

const portfolioCard: CSSProperties = { display: 'grid', gap: 20, padding: 26, borderRadius: 34, background: 'rgba(255,255,255,.96)', border: '1px solid #dce7f6', boxShadow: '0 24px 60px rgba(17,42,88,.07)' }
const portfolioTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center' }
const filters: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const searchBox: CSSProperties = { minWidth: 320, height: 48, display: 'flex', alignItems: 'center', gap: 9, border: '1px solid #d9e5f6', borderRadius: 16, padding: '0 14px', background: '#fbfdff' }
const selectBox: CSSProperties = { height: 48, border: '1px solid #d9e5f6', borderRadius: 16, padding: '0 14px', background: '#fff', color: '#143866', fontWeight: 900 }
const partnerGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(440px,1fr))', gap: 18 }
const partnerCard: CSSProperties = { position: 'relative', display: 'grid', gap: 16, padding: 22, overflow: 'hidden', borderRadius: 28, background: 'linear-gradient(180deg,#ffffff,#fafdff)', border: '1px solid #dce7f6', boxShadow: '0 18px 42px rgba(17,42,88,.06)' }
const partnerGlow: CSSProperties = { position: 'absolute', right: -70, top: -80, width: 190, height: 190, borderRadius: '50%', background: 'radial-gradient(circle, rgba(17,105,255,.13), transparent 66%)' }
const partnerHeader: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 14, alignItems: 'center' }
const partnerAvatar: CSSProperties = { width: 64, height: 64, display: 'grid', placeItems: 'center', borderRadius: 22, background: 'linear-gradient(135deg,#e8f1ff,#dbeafe)', color: '#0d4cb7', fontSize: 24, fontWeight: 950 }
const stagePill: CSSProperties = { padding: '10px 13px', borderRadius: 999, background: '#ecfdf5', color: '#059669', fontWeight: 950 }
const healthLine: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 900, color: '#263c5c' }
const healthTrack: CSSProperties = { height: 10, borderRadius: 999, background: '#e6edf7', overflow: 'hidden' }
const metaGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const metaTile: CSSProperties = { minHeight: 82, display: 'grid', alignContent: 'center', gap: 6, padding: 13, borderRadius: 18, background: '#f8fbff', border: '1px solid #e1e9f6', overflow: 'hidden' }
const accentText: CSSProperties = { color: '#1169ff' }
const partnerFooter: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const pillGreen: CSSProperties = { borderRadius: 999, padding: '9px 12px', color: '#059669', background: '#ecfdf5', fontWeight: 950 }
const pillOrange: CSSProperties = { ...pillGreen, color: '#ea580c', background: '#fff7ed' }
const pillRed: CSSProperties = { ...pillGreen, color: '#e11d48', background: '#fff1f2' }
const miniPrimary: CSSProperties = { border: 0, borderRadius: 14, padding: '11px 14px', color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', fontWeight: 950, cursor: 'pointer' }

const insightGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 18 }
const insightPanel: CSSProperties = { minHeight: 300, display: 'grid', alignContent: 'start', gap: 14, padding: 22, borderRadius: 28, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 20px 48px rgba(17,42,88,.06)' }
const panelBody: CSSProperties = { display: 'grid', gap: 12 }
const metricLine: CSSProperties = { display: 'grid', gap: 8 }
const metricTrack: CSSProperties = { height: 11, borderRadius: 999, background: '#e7eef8', overflow: 'hidden' }
const activityRow: CSSProperties = { display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 10, alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #edf2fa' }
const actionRow: CSSProperties = { display: 'flex', gap: 9, color: '#0d4cb7', fontWeight: 900, padding: '8px 0' }

const loadingPillStyle: CSSProperties = { position: 'fixed', right: 24, bottom: 24, padding: '13px 18px', borderRadius: 999, background: '#1169ff', color: '#fff', fontWeight: 950, boxShadow: '0 18px 34px rgba(17,105,255,.25)', zIndex: 120 }
const modalOverlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(6,18,40,.48)', backdropFilter: 'blur(9px)' }
const partnerModal: CSSProperties = { width: 'min(980px,100%)', display: 'grid', gap: 18, padding: 28, borderRadius: 34, background: '#fff', boxShadow: '0 42px 100px rgba(6,18,40,.25)' }
const createModal: CSSProperties = { width: 'min(720px,100%)', display: 'grid', gap: 18, padding: 28, borderRadius: 34, background: '#fff', boxShadow: '0 42px 100px rgba(6,18,40,.25)' }
const modalHeader: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'start' }
const closeButton: CSSProperties = { width: 50, height: 50, borderRadius: 18, border: '1px solid #d9e5f6', background: '#fff', color: '#0b1733', fontSize: 28, fontWeight: 950, cursor: 'pointer' }
const modalGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const modalTile: CSSProperties = { minHeight: 96, display: 'grid', alignContent: 'center', gap: 7, padding: 16, borderRadius: 20, border: '1px solid #e1e9f6', background: '#f8fbff' }
const modalActions: CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }
const formMessage: CSSProperties = { padding: 12, borderRadius: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontWeight: 900 }
const field: CSSProperties = { display: 'grid', gap: 8, fontWeight: 900, color: '#243955' }



function DirectoryPartnerCardVisualForce({ partner, onOpen }: { partner: Partner; onOpen: () => void }) {
  const score = Math.max(0, Math.min(100, Number(partner.health || 0)))
  const safeScore = `${score}%`
  const riskStyle = partner.risk === 'Faible' ? acForceRiskSafe : partner.risk === 'Élevé' ? acForceRiskHigh : acForceRiskWatch
  const stageLabel = String(partner.stage || 'active')
  const ownerReady = partner.owner && partner.owner !== 'Non assigné'
  const planReady = partner.plan && partner.plan !== 'Aucun plan'
  const hasProofs = Number(partner.documents || 0) > 0

  return (
    <button type="button" style={acForcePartnerCard} onClick={onOpen}>
      <div style={acForceAuraBlue} />
      <div style={acForceAuraMint} />
      <div style={acForceTopAccent} />

      <header style={acForceCardHeader}>
        <div style={acForceAvatarCluster}>
          <span style={acForceAvatar}>{partner.name.slice(0, 1).toUpperCase()}</span>
          <span style={acForceOnlineDot} />
        </div>

        <div style={acForceIdentityBlock}>
          <strong>{partner.name}</strong>
          <div style={acForceIdentityMeta}>
            <span>{partner.city}</span>
            <i>•</i>
            <span>{partner.segment}</span>
          </div>
        </div>

        <span style={acForceStagePill}>{stageLabel}</span>
      </header>

      <section style={acForceHealthPanel}>
        <div style={acForceHealthTop}>
          <span>Indice santé partenaire</span>
          <strong>{score}/100</strong>
        </div>
        <div style={acForceHealthTrack}>
          <i style={{ width: safeScore, display: 'block', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#10b981,#38bdf8,#1169ff)' }} />
        </div>
        <div style={acForceTagRow}>
          <span style={riskStyle}>{partner.risk}</span>
          <span style={ownerReady ? acForceTagGreen : acForceTagOrange}>{ownerReady ? 'Owner affecté' : 'Owner à affecter'}</span>
          <span style={planReady ? acForceTagBlue : acForceTagSlate}>{planReady ? partner.plan : 'Plan à définir'}</span>
        </div>
      </section>

      <section style={acForceKpiRibbon}>
        <div style={acForceKpiTile}>
          <span>MRR</span>
          <strong>{money(partner.mrr || 0)}</strong>
          <small>revenu récurrent</small>
        </div>
        <div style={acForceKpiTile}>
          <span>Delivery</span>
          <strong>{partner.participants}</strong>
          <small>participant(s)</small>
        </div>
        <div style={acForceKpiTile}>
          <span>Preuves</span>
          <strong>{partner.documents}</strong>
          <small>{hasProofs ? 'publié(s)' : 'à publier'}</small>
        </div>
      </section>

      <section style={acForceInfoGrid}>
        <div style={acForceInfoItem}>
          <span>Owner</span>
          <strong>{partner.owner}</strong>
        </div>
        <div style={acForceInfoItem}>
          <span>Billing</span>
          <strong>{partner.billing}</strong>
        </div>
        <div style={acForceInfoItem}>
          <span>Renouvellement</span>
          <strong>{partner.renewal}</strong>
        </div>
        <div style={acForceInfoItem}>
          <span>Pipeline</span>
          <strong>{partner.plan}</strong>
        </div>
      </section>

      <footer style={acForceCardFooter}>
        <div style={acForceFooterTags}>
          <span>Billing</span>
          <span>Sessions</span>
          <span>Certificats</span>
        </div>
        <strong>Ouvrir dossier 360 →</strong>
      </footer>
    </button>
  )
}

const directoryShell: CSSProperties = {
  display: 'grid',
  gap: 18,
}

const directoryHero: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  minHeight: 240,
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 520px',
  gap: 24,
  alignItems: 'stretch',
  padding: 30,
  borderRadius: 34,
  background:
    'linear-gradient(135deg,rgba(255,255,255,.98),rgba(236,245,255,.98)), radial-gradient(circle at 88% 14%,rgba(17,105,255,.22),transparent 36%), radial-gradient(circle at 70% 85%,rgba(126,211,255,.18),transparent 28%)',
  border: '1px solid #d7e5f8',
  boxShadow: '0 28px 70px rgba(17,42,88,.10)',
}

const directoryHeroGlow: CSSProperties = {
  position: 'absolute',
  right: -180,
  top: -220,
  width: 560,
  height: 560,
  borderRadius: '50%',
  background: 'radial-gradient(circle,rgba(17,105,255,.18),transparent 66%)',
}

const directoryTitleBlock: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  alignContent: 'center',
  gap: 10,
}

const directoryCommandPanel: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 12,
  padding: 14,
  borderRadius: 24,
  background: 'rgba(255,255,255,.78)',
  border: '1px solid rgba(215,229,248,.9)',
  boxShadow: '0 20px 46px rgba(17,42,88,.07)',
  backdropFilter: 'blur(14px)',
}

const directoryStat: CSSProperties = {
  display: 'grid',
  alignContent: 'center',
  gap: 7,
  padding: 18,
  borderRadius: 22,
  background: 'linear-gradient(180deg,#ffffff,#f5f9ff)',
  border: '1px solid #d9e7fb',
  boxShadow: '0 16px 30px rgba(17,42,88,.05)',
}

const gatewayGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6,minmax(0,1fr))',
  gap: 14,
}

const gatewayTile: CSSProperties = {
  minHeight: 136,
  position: 'relative',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateColumns: '54px 1fr auto',
  gap: 14,
  alignItems: 'center',
  padding: 18,
  borderRadius: 26,
  border: '1px solid #dce7f6',
  background: 'linear-gradient(145deg,#ffffff 0%,#f6faff 100%)',
  color: '#12213c',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: '0 16px 36px rgba(17,42,88,.06)',
}

const gatewayIcon: CSSProperties = {
  width: 54,
  height: 54,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 20,
  color: '#1169ff',
  background: 'linear-gradient(135deg,#eef5ff,#dce9ff)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9)',
  fontWeight: 950,
  fontSize: 18,
}

const directoryToolbar: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
  padding: 14,
  borderRadius: 24,
  background: 'linear-gradient(180deg,#fbfdff,#f7fbff)',
  border: '1px solid #e0e9f7',
  boxShadow: '0 12px 28px rgba(17,42,88,.04)',
}

const directorySearchCluster: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const directorySearchBox: CSSProperties = {
  minWidth: 420,
  height: 54,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #d9e5f6',
  borderRadius: 18,
  padding: '0 16px',
  background: '#fff',
}

const directorySelectBox: CSSProperties = {
  height: 54,
  minWidth: 210,
  border: '1px solid #d9e5f6',
  borderRadius: 18,
  padding: '0 16px',
  background: '#fff',
  color: '#143866',
  fontWeight: 900,
}

const viewSwitch: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const viewSwitchButton: CSSProperties = {
  minHeight: 46,
  border: '1px solid #d9e5f6',
  background: '#fff',
  color: '#36506f',
  borderRadius: 16,
  padding: '0 14px',
  fontWeight: 950,
  cursor: 'pointer',
}

const viewSwitchActive: CSSProperties = {
  ...viewSwitchButton,
  color: '#fff',
  background: 'linear-gradient(135deg,#073b9d,#1169ff)',
  border: '1px solid #1169ff',
  boxShadow: '0 14px 28px rgba(17,105,255,.2)',
}

const directoryCardsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
  gap: 18,
  alignItems: 'start',
  justifyItems: 'stretch',
}

const directoryPremiumCard: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  display: 'grid',
  gap: 16,
  minHeight: 360,
  padding: 22,
  borderRadius: 30,
  border: '1px solid #dce7f6',
  background: 'linear-gradient(180deg,#ffffff 0%,#fbfdff 54%,#f5f9ff 100%)',
  color: '#10203f',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: '0 22px 56px rgba(17,42,88,.08)',
}

const directoryCardGlow: CSSProperties = {
  position: 'absolute',
  right: -86,
  top: -120,
  width: 250,
  height: 250,
  borderRadius: '50%',
  background: 'radial-gradient(circle,rgba(17,105,255,.14),transparent 66%)',
}

const directoryCardHeader: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '68px 1fr auto',
  gap: 14,
  alignItems: 'center',
}

const directoryAvatarLarge: CSSProperties = {
  width: 68,
  height: 68,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 24,
  color: '#0d4cb7',
  background: 'linear-gradient(135deg,#e8f1ff,#dbeafe)',
  fontSize: 26,
  fontWeight: 950,
}

const directoryCardScore: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  color: '#243955',
  fontWeight: 950,
}

const directoryHealthTrack: CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: '#e6edf7',
  overflow: 'hidden',
}

const directoryCardMetaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
  gap: 10,
}

const directoryCardFooter: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  paddingTop: 6,
  borderTop: '1px solid #ebf1fa',
}

const directoryList: CSSProperties = {
  display: 'grid',
  gap: 10,
}

const directoryListHeader: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.45fr 1fr 1fr .8fr .8fr .9fr .8fr',
  gap: 12,
  padding: '0 18px',
  color: '#6b7d96',
  fontSize: 12,
  letterSpacing: '.12em',
  fontWeight: 950,
  textTransform: 'uppercase',
}

const directoryRow: CSSProperties = {
  width: '100%',
  minHeight: 118,
  display: 'grid',
  gridTemplateColumns: '1.45fr 1fr 1fr .8fr .8fr .9fr .8fr',
  gap: 12,
  alignItems: 'center',
  padding: 18,
  borderRadius: 24,
  border: '1px solid #dce7f6',
  background: 'linear-gradient(180deg,#ffffff,#fbfdff)',
  color: '#10203f',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: '0 16px 34px rgba(17,42,88,.055)',
}

const directoryPartnerIdentity: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '58px 1fr',
  gap: 12,
  alignItems: 'center',
}

const directoryAvatar: CSSProperties = {
  width: 58,
  height: 58,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 20,
  color: '#0d4cb7',
  background: '#e8f1ff',
  fontWeight: 950,
  fontSize: 22,
}

const directoryCell: CSSProperties = {
  display: 'grid',
  gap: 5,
  minWidth: 0,
}

const directoryRiskCell: CSSProperties = {
  display: 'grid',
  gap: 8,
}

const directoryActionCell: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  minHeight: 48,
  color: '#fff',
  background: 'linear-gradient(135deg,#073b9d,#1169ff)',
  borderRadius: 16,
  fontWeight: 950,
}

const directoryPillGreen: CSSProperties = {
  width: 'fit-content',
  borderRadius: 999,
  padding: '9px 12px',
  color: '#059669',
  background: '#ecfdf5',
  fontWeight: 950,
}

const directoryPillOrange: CSSProperties = {
  ...directoryPillGreen,
  color: '#ea580c',
  background: '#fff7ed',
}

const directoryPillRed: CSSProperties = {
  ...directoryPillGreen,
  color: '#e11d48',
  background: '#fff1f2',
}


const gatewayBody: CSSProperties = {
  display: 'grid',
  gap: 6,
}

const gatewayValue: CSSProperties = {
  color: '#0e2242',
  fontSize: 24,
  fontWeight: 950,
}

const directoryCardAccent: CSSProperties = {
  position: 'absolute',
  inset: '0 0 auto 0',
  height: 5,
  background: 'linear-gradient(90deg,#1f66ff,#6ab8ff,#9fe2ff)',
}

const directoryCardIdentity: CSSProperties = {
  display: 'grid',
  gap: 4,
}

const directoryStagePill: CSSProperties = {
  width: 'fit-content',
  padding: '9px 12px',
  borderRadius: 999,
  background: '#eef5ff',
  color: '#0f57e2',
  fontStyle: 'normal',
  fontWeight: 900,
}

const directoryCardTopline: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
}

const directoryCardScoreWrap: CSSProperties = {
  display: 'grid',
  gap: 4,
  color: '#243955',
  fontWeight: 950,
}

const directoryCardKpiRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 10,
}

const directoryMiniKpi: CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: 12,
  borderRadius: 18,
  background: '#f6faff',
  border: '1px solid #e3edf9',
}

const directoryMetaCard: CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: 12,
  borderRadius: 18,
  background: 'rgba(248,251,255,.95)',
  border: '1px solid #e6eef9',
}

const directoryFooterBadges: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const directoryMiniBadge: CSSProperties = {
  padding: '7px 10px',
  borderRadius: 999,
  background: '#eff5ff',
  color: '#2759b8',
  fontSize: 12,
  fontWeight: 900,
}


const acForcePartnerCard: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  minHeight: 430,
  display: 'grid',
  gap: 16,
  padding: 22,
  borderRadius: 32,
  border: '1px solid #d9e7fb',
  background: 'linear-gradient(180deg,#ffffff 0%,#fbfdff 48%,#f4f9ff 100%)',
  color: '#0b1733',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: '0 24px 58px rgba(17,42,88,.10), 0 1px 0 rgba(255,255,255,.9) inset',
}

const acForceAuraBlue: CSSProperties = { position: 'absolute', right: -100, top: -120, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(17,105,255,.18),transparent 66%)' }
const acForceAuraMint: CSSProperties = { position: 'absolute', left: -120, bottom: -140, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(20,184,166,.12),transparent 68%)' }
const acForceTopAccent: CSSProperties = { position: 'absolute', inset: '0 0 auto 0', height: 6, background: 'linear-gradient(90deg,#073b9d 0%,#1169ff 34%,#38bdf8 68%,#2dd4bf 100%)' }
const acForceCardHeader: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '76px minmax(0,1fr) auto', gap: 14, alignItems: 'center' }
const acForceAvatarCluster: CSSProperties = { position: 'relative', width: 72, height: 72 }
const acForceAvatar: CSSProperties = { width: 72, height: 72, display: 'grid', placeItems: 'center', borderRadius: 25, color: '#0b4fc5', background: 'linear-gradient(135deg,#e8f1ff 0%,#dbeafe 100%)', fontSize: 28, fontWeight: 950, boxShadow: '0 14px 28px rgba(17,105,255,.12)' }
const acForceOnlineDot: CSSProperties = { position: 'absolute', right: -1, bottom: 7, width: 17, height: 17, borderRadius: '50%', background: '#10b981', border: '3px solid #fff', boxShadow: '0 0 0 4px rgba(16,185,129,.12)' }
const acForceIdentityBlock: CSSProperties = { minWidth: 0, display: 'grid', gap: 6 }
const acForceIdentityMeta: CSSProperties = { display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', color: '#60718b', fontWeight: 800 }
const acForceStagePill: CSSProperties = { width: 'fit-content', padding: '10px 14px', borderRadius: 999, color: '#0f57e2', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1px solid #d9e7fb', fontStyle: 'normal', fontWeight: 950, boxShadow: '0 10px 20px rgba(17,105,255,.08)' }
const acForceHealthPanel: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gap: 10, padding: 16, borderRadius: 24, background: 'linear-gradient(135deg,#f8fbff,#eef6ff)', border: '1px solid #deebfb' }
const acForceHealthTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', color: '#243955', fontWeight: 950 }
const acForceHealthTrack: CSSProperties = { height: 11, overflow: 'hidden', borderRadius: 999, background: '#dbe7f6' }
const acForceTagRow: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const acForceBaseTag: CSSProperties = { width: 'fit-content', padding: '8px 11px', borderRadius: 999, fontSize: 12, fontWeight: 950 }
const acForceRiskSafe: CSSProperties = { ...acForceBaseTag, color: '#047857', background: '#ecfdf5', border: '1px solid #bbf7d0' }
const acForceRiskWatch: CSSProperties = { ...acForceBaseTag, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa' }
const acForceRiskHigh: CSSProperties = { ...acForceBaseTag, color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3' }
const acForceTagGreen: CSSProperties = { ...acForceBaseTag, color: '#047857', background: '#ecfdf5', border: '1px solid #bbf7d0' }
const acForceTagOrange: CSSProperties = { ...acForceBaseTag, color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa' }
const acForceTagBlue: CSSProperties = { ...acForceBaseTag, color: '#0f57e2', background: '#eff6ff', border: '1px solid #bfdbfe' }
const acForceTagSlate: CSSProperties = { ...acForceBaseTag, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0' }
const acForceKpiRibbon: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const acForceKpiTile: CSSProperties = { display: 'grid', gap: 4, padding: 13, borderRadius: 20, background: '#ffffff', border: '1px solid #e2edf9', boxShadow: '0 12px 24px rgba(17,42,88,.045)' }
const acForceInfoGrid: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const acForceInfoItem: CSSProperties = { display: 'grid', gap: 5, padding: 13, borderRadius: 20, background: 'rgba(255,255,255,.88)', border: '1px solid #e4edf8' }
const acForceCardFooter: CSSProperties = { position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e7eff9' }
const acForceFooterTags: CSSProperties = { display: 'flex', gap: 7, flexWrap: 'wrap' }

