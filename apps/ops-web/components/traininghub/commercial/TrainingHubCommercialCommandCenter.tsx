'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'slate'
type ViewMode = 'overview' | 'pipeline' | 'opportunities' | 'offers' | 'negotiation' | 'orders' | 'subscriptions' | 'billing' | 'credits' | 'followups' | 'forecast' | 'reports' | 'audit'
type DisplayMode = 'board' | 'table'
type ModalType = null | 'preview' | 'opportunity' | 'offer' | 'dossier' | 'invoice' | 'credits' | 'session' | 'visibility' | 'followup' | 'print' | 'delete' | 'audit' | 'subscription' | 'convert'

type PartnerRecord = {
  id: string
  name: string
  city: string
  owner: string
  segment: string
  status: string
  health: number
  stage: string
  plan: string
  amountMinor: number
  arrMinor: number
  risk: 'low' | 'medium' | 'high' | 'blocked'
  nextAction: string
  lastUpdate: string
  portalVisibility: 'hidden' | 'partial' | 'published'
  sync: Record<string, boolean>
  counts: Record<string, number>
}

type Workspace = {
  generatedAt: string
  kpis: Array<{ id: string; label: string; value: string | number; sublabel: string; tone: Tone; filter?: string }>
  stages: Array<{ id: string; index: string; label: string; count: number; amountMinor: number }>
  partners: PartnerRecord[]
  actions: Array<{ id: string; title: string; description: string; priority: 'high' | 'medium' | 'low'; action_type: string; organization_id?: string }>
  syncHealth: { score: number; tables: Array<{ table: string; count: number; ok: boolean; error: string | null }> }
  warnings: string[]
  raw?: Record<string, any[]>
}

type FormState = {
  organization_id: string
  title: string
  plan_name: string
  package: string
  amount_minor: number
  credits: number
  participants: number
  owner_name: string
  stage: string
  status: string
  probability: number
  city: string
  notes: string
  portal_visible: boolean
  payment_policy: string
  renewal_policy: string
  line_items: string[]
}

const NAV: Array<{ id: ViewMode; label: string }> = [
  { id: 'overview', label: 'Vue globale' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'opportunities', label: 'Opportunités' },
  { id: 'offers', label: 'Offres' },
  { id: 'negotiation', label: 'Négociation' },
  { id: 'orders', label: 'Commandes' },
  { id: 'subscriptions', label: 'Abonnements' },
  { id: 'billing', label: 'Facturation' },
  { id: 'credits', label: 'Crédits' },
  { id: 'followups', label: 'Relances' },
  { id: 'forecast', label: 'Prévisions' },
  { id: 'reports', label: 'Rapports' },
  { id: 'audit', label: 'Audit' },
]

const PACKAGES = [
  { id: 'activation', label: 'Activation', price: 720000, credits: 10, tone: 'blue' as Tone, description: 'Dossier, offre, accès, première session et kit démarrage.' },
  { id: 'growth', label: 'Growth', price: 1850000, credits: 24, tone: 'green' as Tone, description: 'Abonnement annuel, crédits, refresh et reporting.' },
  { id: 'premium', label: 'Premium', price: 4200000, credits: 60, tone: 'violet' as Tone, description: 'Compte avancé, preuves premium, SLA renforcé.' },
  { id: 'enterprise', label: 'Enterprise', price: 9500000, credits: 120, tone: 'amber' as Tone, description: 'Gouvernance, analytics, renouvellement et réseau.' },
  { id: 'custom', label: 'Custom', price: 0, credits: 0, tone: 'slate' as Tone, description: 'Offre sur mesure avec règles dédiées.' },
]

const LINE_ITEMS = ['Session formation', 'Participants supplémentaires', 'Crédits formation', 'Refresh annuel', 'Pack certificats', 'Pack preuves & reporting', 'Visite sur site', 'Support premium', 'Kit démarrage', 'Module sur mesure']

const DEFAULT_FORM: FormState = {
  organization_id: '',
  title: 'Offre TrainingHub partenaire',
  plan_name: 'Activation annuelle TrainingHub',
  package: 'activation',
  amount_minor: 720000,
  credits: 10,
  participants: 10,
  owner_name: 'Non assigné',
  stage: 'diagnostic_done',
  status: 'draft',
  probability: 35,
  city: 'Rabat',
  notes: '',
  portal_visible: false,
  payment_policy: 'manual_agreement',
  renewal_policy: 'manual_review_30_days_before_end',
  line_items: ['Session formation', 'Crédits formation', 'Kit démarrage'],
}

function money(minor: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((Number(minor) || 0) / 100)} MAD`
}

function toneBg(tone: Tone) {
  if (tone === 'green') return '#ecfdf5'
  if (tone === 'amber') return '#fff7ed'
  if (tone === 'red') return '#fef2f2'
  if (tone === 'violet') return '#f5f3ff'
  if (tone === 'slate') return '#f8fafc'
  return '#eff6ff'
}

function toneBorder(tone: Tone) {
  if (tone === 'green') return '#bbf7d0'
  if (tone === 'amber') return '#fed7aa'
  if (tone === 'red') return '#fecaca'
  if (tone === 'violet') return '#ddd6fe'
  if (tone === 'slate') return '#e2e8f0'
  return '#bfdbfe'
}

function toneText(tone: Tone) {
  if (tone === 'green') return '#047857'
  if (tone === 'amber') return '#c2410c'
  if (tone === 'red') return '#b91c1c'
  if (tone === 'violet') return '#6d28d9'
  if (tone === 'slate') return '#475569'
  return '#1d4ed8'
}

function riskTone(risk: PartnerRecord['risk']): Tone {
  if (risk === 'high' || risk === 'blocked') return 'red'
  if (risk === 'medium') return 'amber'
  return 'green'
}

function visibilityTone(value: PartnerRecord['portalVisibility']): Tone {
  if (value === 'published') return 'green'
  if (value === 'partial') return 'amber'
  return 'slate'
}

function stageLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function TrainingHubCommercialCommandCenter() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ViewMode>('overview')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('board')
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<PartnerRecord | null>(null)
  const [modal, setModal] = useState<ModalType>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/commercial/workspace', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error || 'Workspace commercial indisponible.')
        return
      }
      setWorkspace(payload.data)
      const warnings = Array.isArray(payload.data?.warnings) ? payload.data.warnings : []
      setMessage(warnings.length ? `${warnings.length} table(s) à vérifier. Le cockpit reste opérationnel avec les données disponibles.` : null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const partners = useMemo(() => {
    const base = workspace?.partners || []
    const q = query.trim().toLowerCase()
    return base.filter((partner) => {
      const search = !q || `${partner.name} ${partner.city} ${partner.owner} ${partner.stage} ${partner.plan}`.toLowerCase().includes(q)
      const city = cityFilter === 'all' || partner.city === cityFilter
      const status = statusFilter === 'all' || partner.status === statusFilter || partner.stage === statusFilter || partner.risk === statusFilter
      const view =
        activeView === 'overview' ||
        activeView === 'pipeline' ||
        (activeView === 'opportunities' && partner.sync.opportunity) ||
        (activeView === 'offers' && partner.sync.offer) ||
        (activeView === 'negotiation' && ['offer_sent', 'negotiation', 'agreement'].includes(partner.stage)) ||
        (activeView === 'orders' && partner.sync.order) ||
        (activeView === 'subscriptions' && partner.sync.subscription) ||
        (activeView === 'billing' && (partner.sync.invoice || partner.sync.subscription)) ||
        (activeView === 'credits' && partner.sync.credits) ||
        (activeView === 'followups' && partner.counts.requests > 0) ||
        activeView === 'forecast' ||
        activeView === 'reports' ||
        activeView === 'audit'
      return search && city && status && view
    })
  }, [workspace, query, cityFilter, statusFilter, activeView])

  const cities = useMemo(() => Array.from(new Set((workspace?.partners || []).map((partner) => partner.city).filter(Boolean))), [workspace])

  function openModal(type: ModalType, partner?: PartnerRecord | null) {
    const target = partner || selected
    if (target) {
      setSelected(target)
      setForm({ ...DEFAULT_FORM, organization_id: target.id, title: `Offre TrainingHub - ${target.name}`, owner_name: target.owner, city: target.city, plan_name: target.plan === 'Aucun plan' ? 'Activation annuelle TrainingHub' : target.plan, amount_minor: target.amountMinor || 720000 })
    } else {
      setForm(DEFAULT_FORM)
    }
    setModal(type)
  }

  function selectPackage(id: string) {
    const pack = PACKAGES.find((item) => item.id === id)
    if (!pack) return
    setForm((current) => ({ ...current, package: pack.id, plan_name: pack.id === 'custom' ? current.plan_name : `${pack.label} TrainingHub`, amount_minor: pack.price || current.amount_minor, credits: pack.credits || current.credits, participants: pack.credits || current.participants, line_items: pack.id === 'custom' ? current.line_items : ['Session formation', 'Crédits formation', 'Pack preuves & reporting', 'Kit démarrage'] }))
  }

  async function runAction(action: string, extra?: Partial<FormState> & Record<string, any>) {
    setSaving(true)
    setMessage(null)
    try {
      const payload = { ...form, ...(extra || {}), organization_id: extra?.organization_id || form.organization_id || selected?.id }
      const response = await fetch('/api/traininghub/commercial/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ action, payload }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || body?.ok === false) {
        setMessage(body?.error || `Action ${action} non complétée.`)
        return
      }
      setMessage(`Action exécutée : ${action}`)
      setModal(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  if (loading && !workspace) return <main style={loadingStyle}>Chargement du cockpit commercial TrainingHub…</main>

  return (
    <main style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={brandCardStyle}><div style={logoBoxStyle}>ANGEL CARE</div><strong>TrainingHub</strong><span>Internal Admin OS</span></div>
        <SideGroup title="Pilotage" items={['Command Center']} active="" />
        <SideGroup title="Partenaires" items={['Partenaires', 'Dossier partenaire']} active="" />
        <SideGroup title="Revenus" items={['Commercial', 'Offres', 'Commandes', 'Facturation', 'Crédits formation']} active="Commercial" />
        <SideGroup title="Delivery" items={['Catalogue', 'Catégories', 'Sessions', 'Participants', 'Formateurs', 'Présences']} active="" />
        <SideGroup title="Preuves" items={['Certificats', 'Documents', 'Rapports']} active="" />
      </aside>

      <section style={workspaceStyle}>
        <header style={topbarStyle}>
          <div><div style={eyebrowStyle}>ANGELCARE TRAININGHUB • REVENUS</div><h1 style={pageTitleStyle}>Pipeline commercial</h1><p style={pageLeadStyle}>Cockpit entreprise pour offres, abonnements, crédits, facturation, relances et activation partenaire.</p></div>
          <div style={topActionsStyle}><button style={ghostButtonStyle} onClick={() => openModal('print')}>Rapport A4</button><button style={ghostButtonStyle} onClick={() => openModal('opportunity')}>Créer opportunité</button><button style={primaryButtonStyle} onClick={() => openModal('offer')}>Créer offre</button></div>
        </header>

        {message ? <div style={messageStyle}>{message}</div> : null}

        <section style={heroStyle}>
          <div style={heroCopyStyle}>
            <div style={eyebrowStyle}>BLUEPRINT MODULE • COMMERCIAL COMMAND CENTER</div>
            <h2 style={heroTitleStyle}>Pilotez acquisition, offres, négociations, conversions, prévisions et relances partenaires.</h2>
            <p style={heroLeadStyle}>Chaque action reste liée au dossier partenaire, à la chaîne commerciale, à la delivery, aux preuves et au portail partenaire.</p>
            <div style={heroButtonsStyle}><button style={primaryButtonStyle} onClick={() => openModal('opportunity')}>Créer opportunité</button><button style={softButtonStyle} onClick={() => openModal('offer')}>Studio offre</button><button style={softButtonStyle} onClick={() => openModal('visibility')}>Visibilité portail</button><button style={softButtonStyle} onClick={load}>Rafraîchir live</button></div>
          </div>
          <div style={forecastCardStyle}><span>Commercial Health</span><strong>{workspace?.syncHealth?.score || 0}/100</strong><div style={ringsRowStyle}><MiniRing label="Partners" value={workspace?.partners?.length || 0} /><MiniRing label="Offres" value={workspace?.raw?.proposals?.length || 0} /><MiniRing label="Credits" value={workspace?.raw?.credits?.length || 0} /></div><small>{workspace?.warnings?.length || 0} alerte(s) de synchronisation</small></div>
        </section>

        <section style={kpiGridStyle}>
          {(workspace?.kpis || []).map((kpi) => (
            <button key={kpi.id} style={{ ...kpiStyle, borderColor: toneBorder(kpi.tone) }} onClick={() => setActiveView(kpi.filter === 'billing' ? 'billing' : kpi.filter === 'credits' ? 'credits' : 'pipeline')}>
              <span style={{ ...kpiIconStyle, background: toneBg(kpi.tone), color: toneText(kpi.tone) }}>●</span><span>{kpi.label}</span><strong>{typeof kpi.value === 'number' && ['forecast','arr'].includes(kpi.id) ? money(kpi.value) : kpi.value}</strong><small>{kpi.sublabel}</small>
            </button>
          ))}
        </section>

        <nav style={navStyle}>{NAV.map((item) => <button key={item.id} onClick={() => setActiveView(item.id)} style={activeView === item.id ? navActiveStyle : navItemStyle}>{item.label}</button>)}</nav>

        <section style={toolbarStyle}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher partenaire, owner, statut, étape, plan…" style={searchStyle} />
          <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} style={selectStyle}><option value="all">Toutes les villes</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}><option value="all">Tous statuts</option><option value="low">Risque faible</option><option value="medium">Risque moyen</option><option value="high">Risque élevé</option><option value="offer_sent">Offre envoyée</option><option value="subscription_active">Abonnement actif</option></select>
          <button style={displayMode === 'board' ? primarySmallButtonStyle : smallButtonStyle} onClick={() => setDisplayMode('board')}>Board</button>
          <button style={displayMode === 'table' ? primarySmallButtonStyle : smallButtonStyle} onClick={() => setDisplayMode('table')}>Liste premium</button>
        </section>

        <section style={mainGridStyle}>
          <div style={mainPanelStyle}>{displayMode === 'board' ? <PipelineBoard workspace={workspace} partners={partners} onOpen={(partner) => openModal('dossier', partner)} onOffer={(partner) => openModal('offer', partner)} /> : <PremiumTable partners={partners} onOpen={(partner) => openModal('dossier', partner)} onOffer={(partner) => openModal('offer', partner)} onInvoice={(partner) => openModal('invoice', partner)} />}</div>
          <aside style={rightPanelStyle}>
            <section style={rightCardStyle}><div style={eyebrowStyle}>INTELLIGENCE COMMERCIALE</div><h3 style={rightTitleStyle}>Actions prioritaires</h3><div style={actionListStyle}>{(workspace?.actions || []).length ? (workspace?.actions || []).map((action) => <button key={action.id} style={{ ...actionItemStyle, borderColor: action.priority === 'high' ? '#fecaca' : '#bfdbfe' }} onClick={() => { const partner = workspace?.partners?.find((item) => item.id === action.organization_id); openModal(action.action_type === 'issue_credits' ? 'credits' : action.action_type === 'plan_session' ? 'session' : action.action_type === 'publish_portal_visibility' ? 'visibility' : 'offer', partner) }}><strong>{action.title}</strong><span>{action.description}</span></button>) : <p style={emptyTextStyle}>Aucune action urgente.</p>}</div></section>
            <section style={rightCardStyle}><div style={eyebrowStyle}>SYNC END-TO-END</div><h3 style={rightTitleStyle}>Chaîne réelle connectée</h3><div style={syncGridStyle}>{(workspace?.syncHealth?.tables || []).map((table) => <div key={table.table} style={{ ...syncPillStyle, background: table.ok ? '#ecfdf5' : '#fff7ed', borderColor: table.ok ? '#bbf7d0' : '#fed7aa' }}><strong>{table.count}</strong><span>{table.table}</span></div>)}</div></section>
          </aside>
        </section>
      </section>

      {modal ? <CommercialModal type={modal} partner={selected} form={form} setForm={setForm} saving={saving} onClose={() => setModal(null)} onRun={runAction} onPrint={() => window.print()} onSelectPackage={selectPackage} /> : null}
    </main>
  )
}


function trainingHubSidebarHref(item: string) {
  const routes: Record<string, string> = {
    'Command Center': '/traininghub',
    'Partenaires': '/traininghub/partners',
    'Dossier partenaire': '/traininghub/partners?view=dossier',
    'Commercial': '/traininghub/commercial',
    'Offres': '/traininghub/offres',
    'Commandes': '/traininghub/commercial?view=orders',
    'Facturation': '/traininghub/commercial?view=billing',
    'Crédits formation': '/traininghub/commercial?view=credits',
    'Catalogue': '/traininghub/catalogue',
    'Catégories': '/traininghub/categories',
    'Sessions': '/traininghub/sessions',
    'Participants': '/traininghub/participants',
    'Formateurs': '/traininghub/trainers',
    'Présences': '/traininghub/attendance',
    'Certificats': '/traininghub/certificates',
    'Documents': '/traininghub/documents',
    'Rapports': '/traininghub/reports',
  }

  return routes[item] || '/traininghub'
}

function SideGroup({ title, items, active }: { title: string; items: string[]; active: string }) {
  return (
    <nav style={sideGroupStyle} aria-label={title}>
      <p>{title}</p>
      {items.map((item) => {
        const href = trainingHubSidebarHref(item)
        const isActive = item === active

        return (
          <a
            key={item}
            href={href}
            style={isActive ? sideItemActiveLinkStyle : sideItemLinkStyle}
            aria-current={isActive ? 'page' : undefined}
          >
            <span>{isActive ? '◆' : '●'}</span>
            <strong>{item}</strong>
          </a>
        )
      })}
    </nav>
  )
}

function MiniRing({ label, value }: { label: string; value: number }) {
  return <div style={miniRingStyle}><strong>{value}</strong><span>{label}</span></div>
}

function PipelineBoard({ workspace, partners, onOpen, onOffer }: { workspace: Workspace | null; partners: PartnerRecord[]; onOpen: (partner: PartnerRecord) => void; onOffer: (partner: PartnerRecord) => void }) {
  return <div style={boardWrapStyle}>{(workspace?.stages || []).map((stage) => { const scoped = partners.filter((partner) => partner.stage === stage.id); return <section key={stage.id} style={stageColumnStyle}><header style={stageHeaderStyle}><span>{stage.index}</span><strong>{stage.label}</strong><small>{scoped.length} dossier(s)</small></header><div style={stageCardsStyle}>{scoped.length ? scoped.map((partner) => <article key={partner.id} style={boardCardStyle} onClick={() => onOpen(partner)}><div style={boardCardTopStyle}><strong>{partner.name}</strong><span style={{ ...pillStyle, background: toneBg(riskTone(partner.risk)), color: toneText(riskTone(partner.risk)) }}>{partner.risk}</span></div><p>{partner.city} • {partner.owner}</p><div style={progressRailStyle}><span style={{ ...progressFillStyle, width: `${partner.health}%` }} /></div><div style={boardMetaStyle}><span>{money(partner.amountMinor)}</span><span>{partner.portalVisibility}</span></div><button type="button" style={textButtonStyle} onClick={(event) => { event.stopPropagation(); onOffer(partner) }}>Créer / éditer offre →</button></article>) : <div style={emptyStageStyle}>Aucun dossier</div>}</div></section> })}</div>
}

function PremiumTable({ partners, onOpen, onOffer, onInvoice }: { partners: PartnerRecord[]; onOpen: (partner: PartnerRecord) => void; onOffer: (partner: PartnerRecord) => void; onInvoice: (partner: PartnerRecord) => void }) {
  return <div style={tableWrapStyle}><div style={tableHeaderStyle}>{['Partenaire','Owner','Étape','Plan','CA / ARR','Sync','Portail','Action'].map((item) => <strong key={item}>{item}</strong>)}</div>{partners.length ? partners.map((partner) => <div key={partner.id} style={tableRowStyle}><div><strong>{partner.name}</strong><span>{partner.city} • {partner.segment}</span></div><div>{partner.owner}</div><div><span style={{ ...pillStyle, background: toneBg(riskTone(partner.risk)), color: toneText(riskTone(partner.risk)) }}>{stageLabel(partner.stage)}</span></div><div>{partner.plan}</div><div><strong>{money(partner.amountMinor)}</strong><span>ARR {money(partner.arrMinor)}</span></div><div style={smallSyncStyle}>{Object.entries(partner.sync).slice(0,6).map(([key, ok]) => <span key={key} style={{ color: ok ? '#047857' : '#c2410c' }}>{ok ? '✓' : '•'} {key}</span>)}</div><div><span style={{ ...pillStyle, background: toneBg(visibilityTone(partner.portalVisibility)), color: toneText(visibilityTone(partner.portalVisibility)) }}>{partner.portalVisibility}</span></div><div style={rowActionsStyle}><button style={miniButtonStyle} onClick={() => onOpen(partner)}>Dossier</button><button style={miniButtonStyle} onClick={() => onOffer(partner)}>Offre</button><button style={miniButtonStyle} onClick={() => onInvoice(partner)}>Facture</button></div></div>) : <div style={emptyTextStyle}>Aucun partenaire dans ce filtre.</div>}</div>
}

function CommercialModal({ type, partner, form, setForm, saving, onClose, onRun, onPrint, onSelectPackage }: { type: Exclude<ModalType, null>; partner: PartnerRecord | null; form: FormState; setForm: (updater: FormState | ((current: FormState) => FormState)) => void; saving: boolean; onClose: () => void; onRun: (action: string, extra?: Partial<FormState> & Record<string, any>) => Promise<void>; onPrint: () => void; onSelectPackage: (id: string) => void }) {
  const titleMap: Record<Exclude<ModalType, null>, string> = { opportunity: 'Créer opportunité commerciale', offer: 'Offer Studio TrainingHub', preview: 'Prévisualisation offre A4', convert: 'Convertir en commande', subscription: 'Créer abonnement', invoice: 'Générer facture', credits: 'Émettre crédits formation', session: 'Planifier session', visibility: 'Visibilité portail partenaire', followup: 'Relance commerciale', dossier: 'Dossier commercial 360', delete: 'Archive / suppression contrôlée', audit: 'Journal & audit', print: 'Centre impression & rapports' }
  return <div style={modalBackdropStyle}><section style={modalStyle}><header style={modalHeaderStyle}><div><div style={eyebrowStyle}>TRAININGHUB COMMERCIAL • {type.toUpperCase()}</div><h2 style={modalTitleStyle}>{titleMap[type]}</h2><p style={modalLeadStyle}>{partner ? `${partner.name} • ${partner.city} • ${partner.stage}` : 'Nouvelle opération commerciale liée au dossier partenaire.'}</p></div><button style={closeButtonStyle} onClick={onClose}>×</button></header>
    {type === 'dossier' && partner ? <div style={modalGridStyle}><Panel eyebrow="Vue 360" title="État commercial"><MetricGrid partner={partner} /></Panel><Panel eyebrow="Synchronisation" title="Dossier → Billing → Delivery → Portail"><SyncChecklist partner={partner} /></Panel><Panel eyebrow="Actions" title="Commandes rapides"><ActionGrid partner={partner} onRun={onRun} /></Panel></div> : null}
    {type === 'offer' ? <div style={modalGridStyle}><Panel eyebrow="Packages préintégrés" title="Choisir une offre"><div style={packageGridStyle}>{PACKAGES.map((pack) => <button key={pack.id} style={{ ...packageCardStyle, borderColor: form.package === pack.id ? '#2563eb' : toneBorder(pack.tone), background: form.package === pack.id ? '#eff6ff' : '#fff' }} onClick={() => onSelectPackage(pack.id)}><strong>{pack.label}</strong><span>{money(pack.price)}</span><small>{pack.credits} crédits</small><p>{pack.description}</p></button>)}</div></Panel><Panel eyebrow="Studio offre" title="Configuration commerciale"><FormGrid form={form} setForm={setForm} /><LineItems form={form} setForm={setForm} /></Panel></div> : null}
    {type === 'opportunity' ? <Panel eyebrow="Pipeline" title="Créer / qualifier une opportunité"><FormGrid form={form} setForm={setForm} mode="opportunity" /></Panel> : null}
    {['invoice','credits','session','followup'].includes(type) ? <Panel eyebrow="Action commerciale" title={titleMap[type]}><FormGrid form={form} setForm={setForm} mode={type} /></Panel> : null}
    {type === 'visibility' ? <Panel eyebrow="Portail partenaire" title="Contrôler la visibilité"><div style={visibilityGridStyle}>{['Offre','Facture','Crédits','Session','Documents','Certificats','Renouvellement'].map((item) => <label key={item} style={toggleCardStyle}><input type="checkbox" defaultChecked={['Crédits','Session','Documents'].includes(item)} /><strong>{item}</strong><span>Visible au partenaire après publication</span></label>)}</div></Panel> : null}
    {type === 'print' ? <Panel eyebrow="A4 / Export" title="Centre de rapports"><div style={printGridStyle}>{['Offre partenaire','Résumé commercial','Prévision revenus','État crédits','Activation partenaire','Renewal report'].map((item) => <button key={item} style={printCardStyle} onClick={onPrint}>{item}</button>)}</div></Panel> : null}
    {type === 'audit' ? <Panel eyebrow="Audit" title="Journal des actions"><p style={hintStyle}>Les actions du cockpit écrivent un événement auto_events lorsque disponible.</p></Panel> : null}
    <footer style={modalFooterStyle}><button style={ghostButtonStyle} onClick={onClose}>Fermer</button>{type === 'opportunity' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('create_opportunity')}>Créer opportunité</button> : null}{type === 'offer' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('create_offer')}>Enregistrer offre</button> : null}{type === 'invoice' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('generate_invoice')}>Générer facture</button> : null}{type === 'credits' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('issue_credits')}>Émettre crédits</button> : null}{type === 'session' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('plan_session')}>Planifier</button> : null}{type === 'visibility' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('publish_portal_visibility')}>Publier visibilité</button> : null}{type === 'followup' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('create_followup')}>Créer relance</button> : null}{type === 'dossier' ? <><button style={softButtonStyle} disabled={saving} onClick={() => onRun('create_offer')}>Créer offre</button><button style={softButtonStyle} disabled={saving} onClick={() => onRun('issue_credits')}>Émettre crédits</button><button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('plan_session')}>Planifier session</button></> : null}</footer>
  </section></div>
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) { return <section style={panelStyle}><div style={eyebrowStyle}>{eyebrow}</div><h3 style={panelTitleStyle}>{title}</h3>{children}</section> }

function FormGrid({ form, setForm }: { form: FormState; setForm: (updater: FormState | ((current: FormState) => FormState)) => void; mode?: string }) {
  function patch(key: keyof FormState, value: any) { setForm((current) => ({ ...current, [key]: value })) }
  return <div style={formGridStyle}><label style={fieldStyle}>Organisation ID<input value={form.organization_id} onChange={(e) => patch('organization_id', e.target.value)} /></label><label style={fieldStyle}>Titre<input value={form.title} onChange={(e) => patch('title', e.target.value)} /></label><label style={fieldStyle}>Plan<input value={form.plan_name} onChange={(e) => patch('plan_name', e.target.value)} /></label><label style={fieldStyle}>Montant centimes<input type="number" value={form.amount_minor} onChange={(e) => patch('amount_minor', Number(e.target.value))} /></label><label style={fieldStyle}>Crédits<input type="number" value={form.credits} onChange={(e) => patch('credits', Number(e.target.value))} /></label><label style={fieldStyle}>Participants<input type="number" value={form.participants} onChange={(e) => patch('participants', Number(e.target.value))} /></label><label style={fieldStyle}>Owner<input value={form.owner_name} onChange={(e) => patch('owner_name', e.target.value)} /></label><label style={fieldStyle}>Statut<select value={form.status} onChange={(e) => patch('status', e.target.value)}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="active">Active</option><option value="planned">Planned</option></select></label><label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>Notes<textarea value={form.notes} onChange={(e) => patch('notes', e.target.value)} /></label></div>
}

function LineItems({ form, setForm }: { form: FormState; setForm: (updater: FormState | ((current: FormState) => FormState)) => void }) {
  function toggle(item: string) { setForm((current) => ({ ...current, line_items: current.line_items.includes(item) ? current.line_items.filter((line) => line !== item) : [...current.line_items, item] })) }
  return <div style={lineGridStyle}>{LINE_ITEMS.map((item) => <button key={item} type="button" style={form.line_items.includes(item) ? lineActiveStyle : lineStyle} onClick={() => toggle(item)}>{form.line_items.includes(item) ? '✓' : '+'} {item}</button>)}</div>
}

function MetricGrid({ partner }: { partner: PartnerRecord }) { return <div style={metricGridStyle}>{[['Santé',`${partner.health}/100`],['Montant',money(partner.amountMinor)],['ARR',money(partner.arrMinor)],['Risque',partner.risk],['Portail',partner.portalVisibility],['Action',partner.nextAction]].map(([label, value]) => <div key={label} style={metricBoxStyle}><span>{label}</span><strong>{value}</strong></div>)}</div> }
function SyncChecklist({ partner }: { partner: PartnerRecord }) { return <div style={checkGridStyle}>{Object.entries(partner.sync).map(([key, ok]) => <span key={key} style={{ ...checkPillStyle, background: ok ? '#ecfdf5' : '#fff7ed', color: ok ? '#047857' : '#c2410c', borderColor: ok ? '#bbf7d0' : '#fed7aa' }}>{ok ? '✓' : '•'} {key}</span>)}</div> }
function ActionGrid({ partner, onRun }: { partner: PartnerRecord; onRun: (action: string, extra?: Record<string, any>) => Promise<void> }) { return <div style={actionButtonGridStyle}>{[['create_offer','Créer offre'],['convert_offer_to_order','Commande'],['create_subscription','Abonnement'],['generate_invoice','Facture'],['issue_credits','Crédits'],['plan_session','Session'],['publish_portal_visibility','Portail'],['create_followup','Relance']].map(([action, label]) => <button key={action} style={miniActionButtonStyle} onClick={() => onRun(action, { organization_id: partner.id })}>{label}</button>)}</div> }

const shellStyle: CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '290px minmax(0,1fr)', background: 'linear-gradient(135deg,#eef6ff,#f8fbff)', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui' }
const loadingStyle: CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f9ff', fontWeight: 900 }
const sidebarStyle: CSSProperties = { position: 'sticky', top: 0, height: '100vh', overflow: 'auto', padding: 14, background: 'rgba(255,255,255,.92)', borderRight: '1px solid #dbeafe', boxShadow: '16px 0 44px rgba(15,23,42,.05)' }
const brandCardStyle: CSSProperties = { border: '1px solid #dbeafe', borderRadius: 24, padding: 16, display: 'grid', gap: 8, background: '#fff', marginBottom: 18 }
const logoBoxStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 16, padding: 14, color: '#1d4ed8', fontWeight: 950, textAlign: 'center' }
const sideGroupStyle: CSSProperties = { display: 'grid', gap: 8, marginBottom: 18 }
const sideItemStyle: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 14, color: '#475569' }
const sideItemLinkStyle: CSSProperties = { ...sideItemStyle, textDecoration: 'none', cursor: 'pointer' }
const sideItemActiveLinkStyle: CSSProperties = { ...sideItemStyle, background: 'linear-gradient(135deg,#0b49b7,#2563eb)', color: '#fff', boxShadow: '0 14px 28px rgba(37,99,235,.22)', textDecoration: 'none', cursor: 'pointer' }
const sideItemActiveStyle: CSSProperties = { ...sideItemStyle, background: 'linear-gradient(135deg,#0b49b7,#2563eb)', color: '#fff', boxShadow: '0 14px 28px rgba(37,99,235,.22)' }
const workspaceStyle: CSSProperties = { minWidth: 0, padding: 22, display: 'grid', gap: 18, alignContent: 'start' }
const topbarStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 26, padding: '20px 24px', border: '1px solid #dbeafe', boxShadow: '0 18px 45px rgba(15,23,42,.05)' }
const topActionsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }
const pageTitleStyle: CSSProperties = { margin: '6px 0', fontSize: 30, lineHeight: 1, letterSpacing: '-.05em' }
const pageLeadStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 18, background: 'linear-gradient(135deg,#ffffff,#eaf3ff)', border: '1px solid #dbeafe', borderRadius: 34, padding: 24, boxShadow: '0 24px 62px rgba(37,99,235,.10)' }
const heroCopyStyle: CSSProperties = { display: 'grid', gap: 12, alignContent: 'center' }
const heroTitleStyle: CSSProperties = { margin: 0, maxWidth: 860, fontSize: 42, lineHeight: .98, letterSpacing: '-.065em' }
const heroLeadStyle: CSSProperties = { margin: 0, maxWidth: 760, color: '#64748b', fontWeight: 800, lineHeight: 1.55 }
const heroButtonsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 17, padding: '12px 16px', color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2563eb)', fontWeight: 950, cursor: 'pointer', boxShadow: '0 16px 34px rgba(37,99,235,.25)' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 17, padding: '12px 16px', color: '#12366d', background: '#fff', fontWeight: 950, cursor: 'pointer' }
const ghostButtonStyle: CSSProperties = { ...softButtonStyle, boxShadow: 'none' }
const primarySmallButtonStyle: CSSProperties = { ...primaryButtonStyle, padding: '10px 14px' }
const smallButtonStyle: CSSProperties = { ...softButtonStyle, padding: '10px 14px' }
const forecastCardStyle: CSSProperties = { borderRadius: 28, padding: 22, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2563eb)', boxShadow: '0 26px 64px rgba(37,99,235,.25)', display: 'grid', gap: 14 }
const ringsRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }
const miniRingStyle: CSSProperties = { minHeight: 82, borderRadius: 18, border: '1px solid rgba(255,255,255,.24)', background: 'rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', textAlign: 'center' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(9,minmax(150px,1fr))', gap: 12, overflowX: 'auto' }
const kpiStyle: CSSProperties = { minHeight: 128, display: 'grid', justifyItems: 'start', gap: 5, borderRadius: 24, padding: 16, background: '#fff', border: '1px solid', boxShadow: '0 18px 42px rgba(15,23,42,.05)', cursor: 'pointer', color: '#0f172a' }
const kpiIconStyle: CSSProperties = { width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center' }
const navStyle: CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap', borderRadius: 24, background: '#fff', border: '1px solid #dbeafe', padding: 10 }
const navItemStyle: CSSProperties = { border: 0, background: 'transparent', borderRadius: 999, padding: '11px 14px', color: '#475569', fontWeight: 950, cursor: 'pointer' }
const navActiveStyle: CSSProperties = { ...navItemStyle, background: '#eff6ff', color: '#1d4ed8', boxShadow: 'inset 0 0 0 1px #bfdbfe' }
const toolbarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) 190px 190px auto auto', gap: 10, background: '#fff', border: '1px solid #dbeafe', padding: 12, borderRadius: 24 }
const searchStyle: CSSProperties = { border: '1px solid #dbeafe', borderRadius: 16, padding: '12px 14px', fontWeight: 800, outline: 'none', background: '#f8fbff' }
const selectStyle: CSSProperties = { ...searchStyle }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 18, alignItems: 'start' }
const mainPanelStyle: CSSProperties = { minWidth: 0, background: '#fff', border: '1px solid #dbeafe', borderRadius: 28, padding: 16, boxShadow: '0 20px 54px rgba(15,23,42,.05)' }
const rightPanelStyle: CSSProperties = { display: 'grid', gap: 14, position: 'sticky', top: 18 }
const rightCardStyle: CSSProperties = { background: '#fff', border: '1px solid #dbeafe', borderRadius: 26, padding: 18, boxShadow: '0 18px 42px rgba(15,23,42,.05)' }
const rightTitleStyle: CSSProperties = { margin: '6px 0 12px', fontSize: 20, letterSpacing: '-.04em' }
const actionListStyle: CSSProperties = { display: 'grid', gap: 9 }
const actionItemStyle: CSSProperties = { textAlign: 'left', display: 'grid', gap: 5, borderRadius: 18, padding: 12, background: '#f8fbff', border: '1px solid', cursor: 'pointer', color: '#0f172a' }
const syncGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }
const syncPillStyle: CSSProperties = { display: 'grid', gap: 3, borderRadius: 14, padding: 10, border: '1px solid' }
const messageStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '12px 16px', fontWeight: 900 }
const boardWrapStyle: CSSProperties = { display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(270px, 1fr)', gap: 12, overflowX: 'auto', paddingBottom: 8 }
const stageColumnStyle: CSSProperties = { display: 'grid', alignContent: 'start', gap: 10, borderRadius: 22, background: '#f8fbff', border: '1px solid #e2e8f0', padding: 12, minHeight: 460 }
const stageHeaderStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, padding: 12, background: '#fff', border: '1px solid #dbeafe', color: '#12366d' }
const stageCardsStyle: CSSProperties = { display: 'grid', gap: 10 }
const boardCardStyle: CSSProperties = { background: '#fff', border: '1px solid #dbeafe', borderRadius: 20, padding: 14, display: 'grid', gap: 9, cursor: 'pointer', boxShadow: '0 14px 30px rgba(15,23,42,.04)' }
const boardCardTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8 }
const boardMetaStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 900 }
const progressRailStyle: CSSProperties = { height: 8, borderRadius: 999, overflow: 'hidden', background: '#eaf1fb' }
const progressFillStyle: CSSProperties = { display: 'block', height: '100%', background: 'linear-gradient(90deg,#2563eb,#22c55e)', borderRadius: 999 }
const textButtonStyle: CSSProperties = { border: 0, background: 'transparent', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer', textAlign: 'left', padding: 0 }
const emptyStageStyle: CSSProperties = { borderRadius: 18, padding: 14, background: '#fff', color: '#94a3b8', fontWeight: 900, border: '1px dashed #cbd5e1' }
const tableWrapStyle: CSSProperties = { display: 'grid', gap: 10, overflowX: 'auto' }
const tableHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.4fr .8fr .9fr .9fr .8fr 1.4fr .7fr 1fr', gap: 10, minWidth: 1160, padding: 14, borderRadius: 18, background: '#eff6ff', color: '#475569' }
const tableRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.4fr .8fr .9fr .9fr .8fr 1.4fr .7fr 1fr', gap: 10, alignItems: 'center', minWidth: 1160, padding: 14, borderRadius: 18, border: '1px solid #dbeafe', background: '#fff' }
const smallSyncStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: 11, fontWeight: 900 }
const rowActionsStyle: CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' }
const miniButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', color: '#1d4ed8', background: '#fff', borderRadius: 12, padding: '7px 9px', fontWeight: 900, cursor: 'pointer' }
const emptyTextStyle: CSSProperties = { color: '#64748b', fontWeight: 850 }
const pillStyle: CSSProperties = { display: 'inline-flex', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }
const modalBackdropStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', background: 'rgba(15,23,42,.48)', backdropFilter: 'blur(12px)', padding: 24 }
const modalStyle: CSSProperties = { width: 'min(1480px, 96vw)', maxHeight: '92vh', overflow: 'auto', borderRadius: 34, background: 'linear-gradient(135deg,#ffffff,#f6f9ff)', border: '1px solid #dbeafe', boxShadow: '0 40px 140px rgba(2,6,23,.32)', padding: 18, display: 'grid', gap: 16 }
const modalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', background: '#fff', border: '1px solid #dbeafe', borderRadius: 26, padding: 18 }
const modalTitleStyle: CSSProperties = { margin: '6px 0', fontSize: 32, letterSpacing: '-.05em' }
const modalLeadStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800 }
const closeButtonStyle: CSSProperties = { width: 42, height: 42, borderRadius: 999, border: '1px solid #dbeafe', background: '#fff', color: '#0f172a', fontSize: 24, fontWeight: 950, cursor: 'pointer' }
const modalGridStyle: CSSProperties = { display: 'grid', gap: 14 }
const panelStyle: CSSProperties = { borderRadius: 26, border: '1px solid #dbeafe', background: '#fff', padding: 18, display: 'grid', gap: 14 }
const panelTitleStyle: CSSProperties = { margin: 0, fontSize: 22, letterSpacing: '-.04em' }
const packageGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }
const packageCardStyle: CSSProperties = { display: 'grid', gap: 6, textAlign: 'left', borderRadius: 20, padding: 14, border: '1px solid', background: '#fff', cursor: 'pointer', color: '#0f172a' }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 7, fontWeight: 900, color: '#334155' }
const lineGridStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const lineStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#fff', color: '#334155', borderRadius: 999, padding: '9px 12px', fontWeight: 900, cursor: 'pointer' }
const lineActiveStyle: CSSProperties = { ...lineStyle, background: '#ecfdf5', color: '#047857', borderColor: '#bbf7d0' }
const hintStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800, lineHeight: 1.5 }
const metricGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const metricBoxStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, border: '1px solid #dbeafe', background: '#f8fbff', padding: 14 }
const checkGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }
const checkPillStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '8px 10px', fontWeight: 950 }
const actionButtonGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 }
const miniActionButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 16, padding: '10px 12px', fontWeight: 950, cursor: 'pointer' }
const visibilityGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const toggleCardStyle: CSSProperties = { display: 'grid', gap: 6, border: '1px solid #dbeafe', borderRadius: 18, padding: 14, background: '#f8fbff', fontWeight: 900 }
const printGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const printCardStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#fff', borderRadius: 18, padding: 18, fontWeight: 950, cursor: 'pointer', color: '#12366d' }
const modalFooterStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', background: '#fff', border: '1px solid #dbeafe', borderRadius: 24, padding: 14 }
