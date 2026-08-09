'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Partner = {
  id: string
  name: string
  city: string
  segment: string
  owner: string
  status: string
  stage: string
  plan: string
  users: number
  mrr_mad: number
  revenue_mad: number
  open_amount_mad: number
  proposals: number
  orders: number
  open_invoices: number
  credits: number
  sessions: number
  participants: number
  certificates: number
  requests: number
  documents: number
  health: number
  conversion_rate: number
  certification_rate: number
  maturity: string
  risk: string
  next_action: string
  renewal_at: string | null
}

type Snapshot = {
  generated_at?: string
  kpis?: Record<string, number>
  partners?: Partner[]
  buckets?: Record<string, Record<string, number>>
  trends?: Record<string, Array<{ label: string; value: number }>>
  alerts?: Array<{ id: string; title: string; count: number; severity: string; section: string }>
  recommended_actions?: Array<{ id: string; title: string; priority: string; section: string }>
  warnings?: string[]
}

const menu = [
  { group: 'PILOTAGE', items: [['Command Center', '/traininghub', '⌘']] },
  { group: 'PARTENAIRES', items: [['Partenaires', '/traininghub/partners', '◈', 'active'], ['Dossier partenaire', '/traininghub/partners', '▣']] },
  { group: 'REVENUS', items: [['Commercial', '/traininghub/commercial', '◉'], ['Offres', '/traininghub/offres', '▱'], ['Commandes', '/traininghub/orders', '▰'], ['Facturation', '/traininghub/billing', '◇'], ['Crédits formation', '/traininghub/credits', '◎']] },
  { group: 'DELIVERY', items: [['Catalogue', '/traininghub/catalogue', '▤'], ['Catégories', '/traininghub/categories', '◫'], ['Sessions', '/traininghub/sessions', '▦'], ['Participants', '/traininghub/participants', '♟'], ['Formateurs', '/traininghub/trainers', '▲'], ['Présences', '/traininghub/attendance', '✓']] },
  { group: 'PREUVES', items: [['Certificats', '/traininghub/certificates', '✦'], ['Documents', '/traininghub/documents', '▣'], ['Refresh', '/traininghub/refresh', '↻']] },
]

const stages = ['Prospect', 'Diagnostic', 'Offre', 'Accord', 'Activation', 'Delivery', 'Preuves', 'Renouvellement']

function fmt(value: unknown) {
  return new Intl.NumberFormat('fr-MA').format(Number(value || 0))
}

function money(value: unknown) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(Number(value || 0))} MAD`
}

function shortMoney(value: unknown) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(Number(value || 0) / 1000)} K MAD`
}

function dateLabel(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  } catch {
    return '—'
  }
}

function qstring(params: Record<string, string>) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString()
}

export default function TrainingHubPartnersPortfolioProduction() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [city, setCity] = useState('Toutes les villes')
  const [status, setStatus] = useState('Tous statuts')
  const [segment, setSegment] = useState('Tous segments')
  const [drawer, setDrawer] = useState<Partner | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [actionPartner, setActionPartner] = useState<Partner | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', city: 'Rabat', segment: 'Crèche', owner: '', plan: 'Premium', mrr_mad: '0', email: '', phone: '', notes: '' })
  const [actionText, setActionText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = qstring({ q, city, status, segment })
      const response = await fetch(`/api/traininghub/internal/partners-portfolio?${query}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setToast(payload?.message || 'Lecture portefeuille impossible.')
        setSnapshot(null)
        return
      }
      setSnapshot(payload.data || null)
    } finally {
      setLoading(false)
    }
  }, [city, q, segment, status])

  useEffect(() => {
    const timer = setTimeout(() => load(), 180)
    return () => clearTimeout(timer)
  }, [load])

  const kpis = snapshot?.kpis || {}
  const partners = snapshot?.partners || []
  const buckets = snapshot?.buckets || {}
  const cities = useMemo(() => ['Toutes les villes', ...Object.keys(buckets.by_city || {}).filter((item) => item && item !== '—' && item !== 'Non renseigné')], [buckets.by_city])
  const statuses = useMemo(() => ['Tous statuts', ...Object.keys(buckets.by_status || {}).filter(Boolean)], [buckets.by_status])
  const segments = useMemo(() => ['Tous segments', ...Object.keys(buckets.by_segment || {}).filter(Boolean)], [buckets.by_segment])
  const alerts = snapshot?.alerts || []
  const actions = snapshot?.recommended_actions || []

  async function createPartner() {
    const response = await fetch('/api/traininghub/internal/partners-portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, owner_name: form.owner, mrr_mad: Number(form.mrr_mad || 0) }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      setToast(payload?.error || payload?.message || 'Création impossible.')
      return
    }
    setToast('Partenaire créé et relié au portefeuille TrainingHub.')
    setCreateOpen(false)
    setForm({ name: '', city: 'Rabat', segment: 'Crèche', owner: '', plan: 'Premium', mrr_mad: '0', email: '', phone: '', notes: '' })
    load()
  }

  async function disablePartner(partner: Partner) {
    const response = await fetch(`/api/traininghub/internal/partners-portfolio/${partner.id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      setToast(payload?.error || payload?.message || 'Désactivation impossible.')
      return
    }
    setToast('Partenaire désactivé temporairement.')
    setDrawer(null)
    load()
  }

  async function createAction() {
    if (!actionPartner) return
    const response = await fetch(`/api/traininghub/internal/partners-portfolio/${actionPartner.id}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionText || actionPartner.next_action, priority: actionPartner.risk === 'Élevé' ? 'high' : 'normal', section: 'partners', notes: actionText }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      setToast(payload?.error || payload?.message || 'Action impossible.')
      return
    }
    setToast('Action partenaire enregistrée.')
    setActionPartner(null)
    setActionText('')
    load()
  }

  function exportCsv() {
    window.open('/api/traininghub/internal/partners-portfolio/export', '_blank')
  }

  return (
    <main style={page}>
      <aside style={sidebar}>
        <div style={brandCard}>
          <img src="/logo.png" alt="AngelCare" style={logo} />
          <strong>TrainingHub</strong>
          <span>Internal Admin OS</span>
        </div>

        <nav style={nav}>
          {menu.map((group) => (
            <div key={group.group} style={navGroup}>
              <div style={navTitle}>{group.group}</div>
              {group.items.map(([label, href, icon, active]) => (
                <Link key={label} href={href} style={active ? navActive : navItem}>
                  <span>{icon}</span>
                  <b>{label}</b>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <button style={settings} type="button">⚙ Paramètres</button>
      </aside>

      <section style={main}>
        <header style={topbar}>
          <label style={searchTop}>
            <span>⌕</span>
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Rechercher un partenaire…" />
          </label>
          <div style={topActions}>
            <button style={softBtn} type="button">⌘ Filtres intelligents</button>
            <button style={softBtn} type="button" onClick={exportCsv}>⇩ Exporter portefeuille</button>
            <button style={softBtn} type="button" onClick={() => { const partner = partners[0]; if (partner) setActionPartner(partner); }}>✉ Nouvelle action</button>
            <button style={primaryBtn} type="button" onClick={() => setCreateOpen(true)}>+ Créer partenaire</button>
          </div>
        </header>

        {toast ? <div className={toast}>{toast}<button type="button" onClick={() => setToast(null)}>×</button></div> : null}

        <section style={workspaceGrid}>
          <div style={workspace}>
            <section style={hero}>
              <div style={heroGlow} />
              <div style={heroMain}>
                <span style={eyebrow}>ANGELCARE TRAININGHUB · PARTENAIRES</span>
                <h1>Portefeuille partenaires</h1>
                <p>Vue stratégique, commerciale, delivery, preuves et renouvellement de tous les établissements partenaires.</p>
                <div style={heroActions}>
                  <button style={primaryBtn} type="button" onClick={() => setCreateOpen(true)}>Créer partenaire</button>
                  <button style={softBtn} type="button" onClick={exportCsv}>Exporter</button>
                  <button style={softBtn} type="button" onClick={load}>Rafraîchir</button>
                </div>
              </div>
              <aside style={heroPanel}>
                <span>Health Score global</span>
                <strong>{kpis.health_average || 0}/100</strong>
                <i><b style={{ width: `${Math.max(3, Math.min(100, Number(kpis.health_average || 0)))}%` }} /></i>
                <small>{kpis.at_risk || 0} partenaire(s) à risque · {kpis.renewals_90d || 0} renouvellement(s)</small>
              </aside>
            </section>

            <section style={kpiStrip}>
              <Kpi icon="👥" label="Partenaires actifs" value={kpis.partners_active || 0} delta="portefeuille réel" />
              <Kpi icon="💶" label="MRR partenaires" value={shortMoney(kpis.mrr_mad || 0)} delta="revenu récurrent" />
              <Kpi icon="📁" label="Offres ouvertes" value={kpis.open_proposals || 0} delta="pipeline commercial" />
              <Kpi icon="🛒" label="Commandes" value={kpis.confirmed_orders || 0} delta="confirmées" />
              <Kpi icon="🧾" label="Factures ouvertes" value={kpis.pending_invoices || 0} delta={shortMoney(kpis.open_amount_mad || 0)} danger={Boolean(kpis.pending_invoices)} />
              <Kpi icon="🗓" label="Sessions" value={kpis.planned_sessions || 0} delta="delivery" />
              <Kpi icon="🛡" label="Certificats" value={kpis.certificates || 0} delta="preuves" />
              <Kpi icon="↻" label="Renouvellement" value={`${kpis.renewal_rate || 0}%`} delta="santé portefeuille" />
            </section>

            <section style={journey}>
              <div style={journeyHead}>
                <strong>Parcours partenaire</strong>
                <span>Prospection, activation, delivery, preuves et renouvellement</span>
              </div>
              <div style={stageRow}>
                {stages.map((stage, index) => (
                  <button key={stage} style={stage === 'Delivery' ? stageActive : stageBox} type="button" onClick={() => setStatus(stage)}>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    <span>{stage}</span>
                    <small>{buckets.by_stage?.[stage] || 0}</small>
                  </button>
                ))}
              </div>
            </section>

            <section style={filters}>
              <label style={searchWide}>
                <span>⌕</span>
                <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Rechercher partenaire, owner, statut…" />
              </label>
              <select value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={segment} onChange={(event) => setSegment(event.target.value)}>{segments.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
              <button type="button" onClick={exportCsv}>Exporter</button>
            </section>

            <section style={tableCard}>
              <div style={tableTop}>
                <div>
                  <span style={eyebrow}>MASTER PORTFOLIO</span>
                  <h2>Partenaires ({partners.length})</h2>
                </div>
                <div style={topActions}>
                  <button style={softBtn} type="button">Colonnes</button>
                  <button style={softBtn} type="button" onClick={exportCsv}>Exporter</button>
                </div>
              </div>

              <div style={tableScroller}>
                <div style={tableHeader}>
                  <span>Établissement</span><span>Ville</span><span>Segment</span><span>Owner</span><span>Étape</span><span>Plan</span><span>Santé</span><span>Delivery</span><span>Facturation</span><span>Preuves</span><span>Renouv.</span><span>Risque</span><span>Action</span>
                </div>

                {partners.length ? partners.slice(0, 100).map((partner) => (
                  <button key={partner.id} style={tableRow} type="button" onClick={() => setDrawer(partner)}>
                    <span style={nameCell}><i style={avatarBadge}>{partner.name.slice(0, 1).toUpperCase()}</i><span style={tableCellStack}><b style={tablePrimaryText}>{partner.name}</b><small style={tableSecondaryText}>{partner.id.slice(0, 8)}</small></span></span>
                    <span>{partner.city}</span>
                    <span><Pill tone="blue">{partner.segment}</Pill></span>
                    <span style={tableCellStack}><em style={ownerChip}>{partner.owner}</em><small style={tableSecondaryText}>responsable partenaire</small></span>
                    <span><Pill tone="green">{partner.stage}</Pill></span>
                    <span style={tableCellStack}><b style={tablePrimaryText}>{partner.plan}</b><small style={tableSecondaryText}>{money(partner.mrr_mad)} MRR</small></span>
                    <span><Health value={partner.health} /></span>
                    <span style={tableCellStack}><b style={tablePrimaryText}>{partner.sessions}</b><small style={tableSecondaryText}>{partner.participants} participant(s)</small></span>
                    <span style={tableCellStack}><b style={tablePrimaryText}>{partner.open_invoices ? 'À suivre' : 'À jour'}</b><small style={tableSecondaryText}>{money(partner.open_amount_mad)}</small></span>
                    <span style={tableCellStack}><b style={tablePrimaryText}>{partner.certificates}</b><small style={tableSecondaryText}>{partner.documents} document(s)</small></span>
                    <span>{dateLabel(partner.renewal_at)}</span>
                    <span><Risk risk={partner.risk} /></span>
                    <span style={tableCellStack}><b style={tablePrimaryText}>{partner.next_action}</b><small style={tableSecondaryText}>ouvrir dossier</small></span>
                  </button>
                )) : (
                  <div style={emptyState}>
                    <strong>Aucun partenaire ne correspond aux filtres.</strong>
                    <span>Créez un partenaire ou modifiez les filtres pour afficher le portefeuille réel.</span>
                    <button style={primaryBtn} type="button" onClick={() => setCreateOpen(true)}>Créer partenaire</button>
                  </div>
                )}
              </div>
            </section>

            <section style={analyticsGrid}>
              <Panel title="Pipeline commercial" value={shortMoney(kpis.revenue_mad || 0)} subtitle="Valeur totale portefeuille"><Donut buckets={buckets.by_stage || {}} /></Panel>
              <Panel title="Onboarding & activation" value={`${kpis.health_average || 0}/100`} subtitle="Santé moyenne"><Ring value={kpis.health_average || 0} /></Panel>
              <Panel title="Revenus & facturation" value={shortMoney(kpis.mrr_mad || 0)} subtitle="MRR total"><Spark values={snapshot?.trends?.revenue || []} /></Panel>
              <Panel title="Demandes partenaires" value={kpis.open_requests || 0} subtitle="Demandes ouvertes"><BucketList buckets={buckets.by_risk || {}} /></Panel>
              <Panel title="Opportunités de renouvellement" value={kpis.renewals_90d || 0} subtitle="90 prochains jours"><BucketList buckets={buckets.by_plan || {}} /></Panel>
              <Panel title="Conformité & documents" value={kpis.certificates || 0} subtitle="Certificats et preuves"><Spark values={snapshot?.trends?.certificates || []} /></Panel>
            </section>
          </div>

          <aside style={rail}>
            <Rail title="Intelligence partenaire">
              <Gauge value={kpis.health_average || 0} label="Health Score global" />
            </Rail>
            <Rail title="SLA respecté">
              <BigNumber value={`${kpis.sla || 0}%`} subtitle="Calculé depuis les demandes ouvertes" />
            </Rail>
            <Rail title="Alertes critiques">
              {alerts.map((alert) => <Alert key={alert.id} alert={alert} />)}
            </Rail>
            <Rail title="Renouvellements à venir">
              <BigNumber value={kpis.renewals_90d || 0} subtitle="Dans les 90 prochains jours" />
            </Rail>
            <Rail title="Risque de churn">
              <BigNumber value={kpis.at_risk || 0} subtitle="Partenaires à risque" />
            </Rail>
            <Rail title="Actions prioritaires">
              {actions.map((action) => <Action key={action.id} action={action} onClick={() => { const partner = partners[0]; if (partner) setActionPartner(partner); setActionText(action.title) }} />)}
            </Rail>
          </aside>
        </section>
      </section>

      {loading ? <div style={loadingStyle}>Synchronisation portefeuille…</div> : null}

      {drawer ? (
        <Modal onClose={() => setDrawer(null)}>
          <div style={drawerHead}>
            <div>
              <span style={eyebrow}>DOSSIER PARTENAIRE</span>
              <h2>{drawer.name}</h2>
              <p>{drawer.city} · {drawer.segment} · {drawer.stage}</p>
            </div>
            <Health value={drawer.health} />
          </div>

          <section style={drawerKpis}>
            <Kpi icon="💶" label="MRR" value={money(drawer.mrr_mad)} delta={drawer.plan} />
            <Kpi icon="📁" label="Offres" value={drawer.proposals} delta="pipeline" />
            <Kpi icon="🧾" label="Factures" value={drawer.open_invoices} delta={money(drawer.open_amount_mad)} danger={Boolean(drawer.open_invoices)} />
            <Kpi icon="🛡" label="Certificats" value={drawer.certificates} delta="preuves" />
          </section>

          <section style={drawerGrid}>
            <Info title="Cycle de vie"><p>Étape actuelle : <b>{drawer.stage}</b></p><p>Maturité : <b>{drawer.maturity}</b></p><p>Risque : <b>{drawer.risk}</b></p></Info>
            <Info title="Prochaine action"><p>{drawer.next_action}</p><button style={primaryBtn} type="button" onClick={() => setActionPartner(drawer)}>Créer action</button></Info>
            <Info title="Facturation"><p>Revenu : <b>{money(drawer.revenue_mad)}</b></p><p>Ouvert : <b>{money(drawer.open_amount_mad)}</b></p></Info>
            <Info title="Delivery"><p>Sessions : <b>{drawer.sessions}</b></p><p>Participants : <b>{drawer.participants}</b></p><p>Certificats : <b>{drawer.certificates}</b></p></Info>
          </section>

          <div style={drawerFooter}>
            <button style={softBtn} type="button" onClick={() => setActionPartner(drawer)}>Créer action</button>
            <button style={softBtn} type="button">Ouvrir dossier complet</button>
            <button style={dangerBtn} type="button" onClick={() => disablePartner(drawer)}>Désactiver temporairement</button>
          </div>
        </Modal>
      ) : null}

      {createOpen ? (
        <Modal onClose={() => setCreateOpen(false)}>
          <div style={drawerHead}>
            <div>
              <span style={eyebrow}>NOUVEAU PARTENAIRE</span>
              <h2>Créer un partenaire TrainingHub</h2>
              <p>Création réelle dans le portefeuille partenaire et préparation du compte de facturation.</p>
            </div>
          </div>

          <div style={formGrid}>
            {Object.entries(form).map(([key, value]) => (
              <label key={key} style={field}>
                <span>{key}</span>
                <input value={value} onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))} />
              </label>
            ))}
          </div>

          <div style={drawerFooter}>
            <button style={softBtn} type="button" onClick={() => setCreateOpen(false)}>Annuler</button>
            <button style={primaryBtn} type="button" onClick={createPartner}>Créer partenaire</button>
          </div>
        </Modal>
      ) : null}

      {actionPartner ? (
        <Modal onClose={() => setActionPartner(null)}>
          <div style={drawerHead}>
            <div>
              <span style={eyebrow}>ACTION PARTENAIRE</span>
              <h2>{actionPartner.name}</h2>
              <p>Action opérationnelle reliée au partenaire et journalisée.</p>
            </div>
          </div>
          <textarea style={textarea} value={actionText} onChange={(event) => setActionText(event.target.value)} placeholder="Action, responsable, échéance, contexte…" />
          <div style={drawerFooter}>
            <button style={softBtn} type="button" onClick={() => setActionPartner(null)}>Annuler</button>
            <button style={primaryBtn} type="button" onClick={createAction}>Enregistrer action</button>
          </div>
        </Modal>
      ) : null}
    </main>
  )
}

function Kpi({ icon, label, value, delta, danger }: { icon: string; label: string; value: ReactNode; delta: string; danger?: boolean }) {
  return (
    <article style={kpi}>
      <div style={kpiIcon}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small style={danger ? redText : greenText}>{delta}</small>
      </div>
    </article>
  )
}

function Health({ value }: { value: number }) {
  return (
    <div style={health}>
      <span>{value}/100</span>
      <i><b style={{ width: `${Math.max(3, Math.min(100, value))}%` }} /></i>
    </div>
  )
}

function Pill({ tone, children }: { tone: 'blue' | 'green'; children: ReactNode }) {
  return <em style={tone === 'green' ? greenPill : bluePill}>{children}</em>
}

function Risk({ risk }: { risk: string }) {
  return <em style={risk === 'Élevé' ? redPill : risk === 'Moyen' ? amberPill : greenPill}>{risk}</em>
}

function Rail({ title, children }: { title: string; children: ReactNode }) {
  return <article style={railCard}><h3>{title}</h3>{children}</article>
}

function Gauge({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div style={gauge}>
      <strong>{label}</strong>
      <svg viewBox="0 0 180 112">
        <path d="M25 94 A65 65 0 0 1 155 94" fill="none" stroke="#e2e8f4" strokeWidth="14" strokeLinecap="round" />
        <path d="M25 94 A65 65 0 0 1 155 94" fill="none" stroke={v >= 70 ? '#0f9f7a' : v >= 45 ? '#f59e0b' : '#ef4444'} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(v / 100) * 205} 205`} />
      </svg>
      <span><b>{v}</b>/100</span>
    </div>
  )
}

function BigNumber({ value, subtitle }: { value: ReactNode; subtitle?: string }) {
  return <div style={bigNumber}><strong>{value}</strong><span>{subtitle || 'Calculé depuis la base'}</span></div>
}

function Alert({ alert }: { alert: { title: string; count: number; severity: string } }) {
  return <div style={alertLine}><span>{alert.severity === 'danger' ? '⚠' : alert.severity === 'warning' ? '◐' : '✓'}</span><b>{alert.title}</b><strong>{alert.count}</strong></div>
}

function Action({ action, onClick }: { action: { title: string; priority: string }; onClick: () => void }) {
  return <button style={actionLine} type="button" onClick={onClick}><span>✦</span><b>{action.title}</b><em>{action.priority}</em></button>
}

function Panel({ title, value, subtitle, children }: { title: string; value: ReactNode; subtitle: string; children: ReactNode }) {
  return <article style={panel}><h3>{title}</h3><strong>{value}</strong><span>{subtitle}</span>{children}</article>
}

function Donut({ buckets }: { buckets: Record<string, number> }) {
  const entries = Object.entries(buckets).slice(0, 4)
  return <div style={donutWrap}><div style={donut} /><div style={legend}>{entries.length ? entries.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>) : <span>Aucune donnée</span>}</div></div>
}

function Ring({ value }: { value: number }) {
  return <div style={ring}><b>{value}%</b></div>
}

function Spark({ values }: { values: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...values.map((item) => Number(item.value || 0)))
  const points = values.length ? values.map((item, index) => `${8 + index * (164 / Math.max(1, values.length - 1))},${68 - (Number(item.value || 0) / max) * 52}`).join(' ') : '8,68 42,68 76,68 110,68 144,68 172,68'
  return <svg viewBox="0 0 180 74" style={spark}><polyline points={points} fill="none" stroke="#0b5fff" strokeWidth="5" strokeLinecap="round" /></svg>
}

function BucketList({ buckets }: { buckets: Record<string, number> }) {
  return <div style={bucketList}>{Object.entries(buckets).slice(0, 4).map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
}

function Info({ title, children }: { title: string; children: ReactNode }) {
  return <article style={infoCard}><h3>{title}</h3>{children}</article>
}

function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div style={overlay}>
      <section style={modal}>
        <button style={close} type="button" onClick={onClose}>×</button>
        {children}
      </section>
    </div>
  )
}

const page: CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '230px minmax(0,1fr)', background: '#f1f6ff', color: '#071834', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const sidebar: CSSProperties = { position: 'sticky', top: 0, height: '100vh', overflow: 'auto', padding: 18, background: '#fff', borderRight: '1px solid #d7e2f3', display: 'grid', alignContent: 'start', gap: 17 }
const brandCard: CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 18, border: '1px solid #d7e2f3', boxShadow: '0 14px 30px rgba(15,42,90,.08)' }
const logo: CSSProperties = { width: '100%', height: 54, objectFit: 'contain' }
const nav: CSSProperties = { display: 'grid', gap: 14 }
const navGroup: CSSProperties = { display: 'grid', gap: 5 }
const navTitle: CSSProperties = { fontSize: 10, letterSpacing: '.16em', color: '#0b5fff', fontWeight: 950 }
const navItem: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', minHeight: 36, padding: '8px 12px', borderRadius: 10, color: '#163055', fontSize: 13, textDecoration: 'none' }
const navActive: CSSProperties = { ...navItem, color: '#fff', background: 'linear-gradient(135deg,#063b92,#0b5fff)', boxShadow: '0 16px 30px rgba(11,95,255,.26)' }
const settings: CSSProperties = { marginTop: 40, height: 42, borderRadius: 12, border: '1px solid #d7e2f3', background: '#fff', color: '#153b72', fontWeight: 900 }
const main: CSSProperties = { minWidth: 0, display: 'grid', gap: 14, padding: '0 20px 26px' }
const topbar: CSSProperties = { minHeight: 72, margin: '0 -20px', padding: '10px 20px', background: 'rgba(255,255,255,.92)', borderBottom: '1px solid #d7e2f3', display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(14px)' }
const searchTop: CSSProperties = { height: 42, width: 520, maxWidth: '42vw', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 12, border: '1px solid #d7e2f3', color: '#5b6d89', background: '#fff' }
const topActions: CSSProperties = { display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }
const softBtn: CSSProperties = { height: 38, borderRadius: 11, border: '1px solid #d7e2f3', background: '#fff', color: '#153b72', fontWeight: 900, padding: '0 14px', cursor: 'pointer' }
const primaryBtn: CSSProperties = { height: 38, borderRadius: 11, border: 0, background: 'linear-gradient(135deg,#062f78,#0b5fff)', color: '#fff', boxShadow: '0 14px 28px rgba(11,95,255,.24)', fontWeight: 950, padding: '0 16px', cursor: 'pointer' }
const dangerBtn: CSSProperties = { ...softBtn, color: '#dc2626', borderColor: '#fecaca' }
const toast: CSSProperties = { display: 'flex', justifyContent: 'space-between', borderRadius: 14, padding: 13, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 900 }
const workspaceGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 306px', gap: 14, alignItems: 'start' }
const workspace: CSSProperties = { display: 'grid', gap: 14, minWidth: 0 }
const hero: CSSProperties = { position: 'relative', overflow: 'hidden', minHeight: 210, borderRadius: 24, border: '1px solid #d7e2f3', background: 'linear-gradient(135deg,#ffffff 0%,#f7fbff 52%,#e3efff 100%)', boxShadow: '0 22px 52px rgba(15,42,90,.10)', padding: 28, display: 'grid', gridTemplateColumns: '1fr 330px', gap: 24 }
const heroGlow: CSSProperties = { position: 'absolute', right: -120, top: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(11,95,255,.16),rgba(11,95,255,0) 62%)' }
const heroMain: CSSProperties = { position: 'relative', zIndex: 1 }
const eyebrow: CSSProperties = { color: '#075bf0', fontSize: 11, letterSpacing: '.16em', fontWeight: 950 }
const heroActions: CSSProperties = { marginTop: 18, display: 'flex', gap: 10 }
const heroPanel: CSSProperties = { position: 'relative', zIndex: 1, alignSelf: 'center', display: 'grid', gap: 10, padding: 22, borderRadius: 22, background: 'linear-gradient(135deg,#08245a,#0b5fff)', color: '#fff', boxShadow: '0 22px 46px rgba(11,95,255,.28)' }
const kpiStrip: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 10 }
const kpi: CSSProperties = { minHeight: 104, display: 'flex', gap: 11, alignItems: 'center', borderRadius: 16, border: '1px solid #d7e2f3', background: '#fff', padding: 14, boxShadow: '0 13px 26px rgba(15,42,90,.07)', minWidth: 0 }
const kpiIcon: CSSProperties = { width: 42, height: 42, borderRadius: 999, background: '#eef4ff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
const greenText: CSSProperties = { color: '#0f9f7a' }
const redText: CSSProperties = { color: '#dc2626' }
const journey: CSSProperties = { borderRadius: 18, border: '1px solid #d7e2f3', background: '#fff', padding: 14, boxShadow: '0 10px 24px rgba(15,42,90,.055)' }
const journeyHead: CSSProperties = { display: 'grid', gap: 3, color: '#1a2f52', marginBottom: 12 }
const stageRow: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 8 }
const stageBox: CSSProperties = { minHeight: 62, border: '1px solid #d7e2f3', background: '#f8fbff', color: '#0b5fff', borderRadius: 12, fontWeight: 950, display: 'grid', placeItems: 'center', cursor: 'pointer' }
const stageActive: CSSProperties = { ...stageBox, background: 'linear-gradient(135deg,#071b41,#123b89)', color: '#fff', boxShadow: '0 14px 26px rgba(18,59,137,.24)' }
const filters: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 170px 170px 170px 112px', gap: 8, padding: 10, border: '1px solid #d7e2f3', background: '#fff', borderRadius: 16 }
const searchWide: CSSProperties = { display: 'flex', gap: 9, alignItems: 'center', border: '1px solid #d7e2f3', borderRadius: 12, padding: '0 12px', color: '#6b7d98', background: '#fff' }
const tableCard: CSSProperties = { border: '1px solid #d7e2f3', background: '#fff', borderRadius: 18, padding: 14, overflow: 'hidden', boxShadow: '0 16px 34px rgba(15,42,90,.075)' }
const tableTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 12px' }
const tableScroller: CSSProperties = { display: 'grid', overflowX: 'auto' }
const tableHeader: CSSProperties = { minWidth: 1790, display: 'grid', gridTemplateColumns: '270px 104px 156px 188px 124px 168px 132px 144px 148px 132px 124px 114px 226px', gap: 10, padding: '14px 18px', background: '#f5f8ff', borderRadius: 14, color: '#647491', fontSize: 11, fontWeight: 950, letterSpacing: '.02em' }
const tableRow: CSSProperties = { minWidth: 1790, display: 'grid', gridTemplateColumns: '270px 104px 156px 188px 124px 168px 132px 144px 148px 132px 124px 114px 226px', gap: 10, alignItems: 'center', padding: '18px 18px', background: '#fff', border: 0, borderBottom: '1px solid #edf2fb', color: '#132749', textAlign: 'left', cursor: 'pointer' }
const nameCell: CSSProperties = { display: 'grid', gridTemplateColumns: '52px minmax(0,1fr)', columnGap: 12, alignItems: 'center' }
const avatarBadge: CSSProperties = { width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#eef4ff,#dbeafe)', color: '#163c88', fontStyle: 'normal', fontWeight: 950, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)' }
const tableCellStack: CSSProperties = { display: 'grid', gap: 4, minWidth: 0 }
const tablePrimaryText: CSSProperties = { fontSize: 15, fontWeight: 900, color: '#132749', lineHeight: 1.2, whiteSpace: 'normal', overflowWrap: 'anywhere' }
const tableSecondaryText: CSSProperties = { fontSize: 12, color: '#6b7d98', lineHeight: 1.2, whiteSpace: 'normal', overflowWrap: 'anywhere' }
const ownerChip: CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 32, padding: '0 12px', borderRadius: 12, background: '#eef4ff', color: '#0b5fff', fontWeight: 900, fontStyle: 'normal', width: 'fit-content', maxWidth: '100%' }
const bluePill: CSSProperties = { padding: '6px 8px', borderRadius: 9, background: '#eef4ff', color: '#0b5fff', fontStyle: 'normal', fontWeight: 900, display: 'inline-block' }
const greenPill: CSSProperties = { ...bluePill, background: '#eefdf6', color: '#0f9f7a' }
const amberPill: CSSProperties = { ...bluePill, background: '#fff7ed', color: '#ea580c' }
const redPill: CSSProperties = { ...bluePill, background: '#fff1f2', color: '#e11d48' }
const health: CSSProperties = { display: 'grid', gap: 5 }
const emptyState: CSSProperties = { display: 'grid', gap: 10, placeItems: 'center', padding: 38, color: '#64748b', fontWeight: 900 }
const analyticsGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const panel: CSSProperties = { minHeight: 210, borderRadius: 16, border: '1px solid #d7e2f3', background: '#fff', padding: 16, display: 'grid', gap: 8, boxShadow: '0 14px 30px rgba(15,42,90,.06)' }
const rail: CSSProperties = { display: 'grid', gap: 12 }
const railCard: CSSProperties = { borderRadius: 16, border: '1px solid #d7e2f3', background: '#fff', padding: 16, boxShadow: '0 14px 30px rgba(15,42,90,.07)', display: 'grid', gap: 10 }
const gauge: CSSProperties = { display: 'grid', placeItems: 'center', gap: 6 }
const bigNumber: CSSProperties = { display: 'grid', gap: 5 }
const alertLine: CSSProperties = { display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #edf2fb' }
const actionLine: CSSProperties = { display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 8, background: 'transparent', border: 0, borderBottom: '1px solid #edf2fb', padding: '8px 0', color: '#173f8a', fontWeight: 850, textAlign: 'left', cursor: 'pointer' }
const donutWrap: CSSProperties = { display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12, alignItems: 'center' }
const donut: CSSProperties = { width: 82, height: 82, borderRadius: '50%', background: 'conic-gradient(#0b5fff 0 42%,#0f9f7a 42% 70%,#f59e0b 70% 88%,#dbe7ff 88% 100%)' }
const legend: CSSProperties = { display: 'grid', gap: 5, fontSize: 12 }
const ring: CSSProperties = { width: 86, height: 86, borderRadius: '50%', border: '12px solid #0b5fff', display: 'grid', placeItems: 'center' }
const spark: CSSProperties = { width: '100%', height: 80 }
const bucketList: CSSProperties = { display: 'grid', gap: 6, fontSize: 12 }
const overlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(7,18,40,.52)', display: 'grid', placeItems: 'center', padding: 24 }
const modal: CSSProperties = { position: 'relative', width: 'min(1120px,96vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 24, padding: 24, display: 'grid', gap: 16, boxShadow: '0 40px 90px rgba(7,18,40,.3)' }
const close: CSSProperties = { position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 13, border: '1px solid #d7e2f3', background: '#fff', fontSize: 24, fontWeight: 950, cursor: 'pointer' }
const drawerHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', paddingRight: 60 }
const drawerKpis: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }
const drawerGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }
const infoCard: CSSProperties = { border: '1px solid #d7e2f3', borderRadius: 14, background: '#f8fbff', padding: 14 }
const drawerFooter: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10 }
const formGrid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const field: CSSProperties = { display: 'grid', gap: 7, fontWeight: 850, color: '#253b5e' }
const textarea: CSSProperties = { minHeight: 150, borderRadius: 12, border: '1px solid #d7e2f3', padding: 12, fontWeight: 800 }
const loadingStyle: CSSProperties = { position: 'fixed', right: 20, bottom: 20, background: '#075bf0', color: '#fff', borderRadius: 999, padding: '11px 14px', fontWeight: 950, boxShadow: '0 16px 30px rgba(7,91,240,.25)' }
