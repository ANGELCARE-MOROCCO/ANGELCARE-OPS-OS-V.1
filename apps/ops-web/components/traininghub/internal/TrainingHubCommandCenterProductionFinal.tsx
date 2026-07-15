'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Alert = {
  id: string
  severity: 'ok' | 'warning' | 'danger' | string
  title: string
  description: string
  count: number
  section: string
}

type RecommendedAction = {
  id: string
  title: string
  priority: string
  section: string
}

type Snapshot = {
  generated_at?: string
  counts?: Record<string, number>
  kpis?: Record<string, number>
  finance?: { revenue_mad?: number; forecast_mad?: number; unpaid_mad?: number }
  score?: { health?: number; certification_rate?: number; conversion_rate?: number; presence_rate?: number }
  pipeline?: { partners_by_stage?: Record<string, number>; proposals_by_status?: Record<string, number>; orders_by_status?: Record<string, number>; cities?: Record<string, number> }
  trends?: { revenue?: Array<{ label: string; value: number }>; sessions?: Array<{ label: string; value: number }>; certificates?: Array<{ label: string; value: number }> }
  alerts?: Alert[]
  recommended_actions?: RecommendedAction[]
  module_status?: Array<{ module: string; status: string; count: number }>
  chain?: Array<{ key: string; label: string; count: number }>
  recent?: Array<{ id: string; label: string; title: string; subtitle: string; status?: string; date: string }>
  warnings?: string[]
  table_status?: Array<{ key: string; table: string; count: number; ok: boolean }>
}

type DrillRow = {
  id: string
  title: string
  subtitle: string
  status: string
  amount_mad: number
  date: string
}

const groups = [
  { title: 'PILOTAGE', items: [{ label: 'Command Center', href: '/traininghub', icon: '⌘', active: true }] },
  { title: 'PARTENAIRES', items: [{ label: 'Partenaires', href: '/traininghub/partners', icon: '◈' }, { label: 'Dossier partenaire', href: '/traininghub/partners', icon: '▣' }] },
  { title: 'REVENUS', items: [{ label: 'Commercial', href: '/traininghub/commercial', icon: '◉' }, { label: 'Offres', href: '/traininghub/offres', icon: '▱' }, { label: 'Commandes', href: '/traininghub/orders', icon: '▰' }, { label: 'Facturation', href: '/traininghub/billing', icon: '◇' }, { label: 'Crédits formation', href: '/traininghub/credits', icon: '◎' }] },
  { title: 'CATALOGUE', items: [{ label: 'Catalogue', href: '/traininghub/catalogue', icon: '▤' }, { label: 'Catégories', href: '/traininghub/categories', icon: '◫' }, { label: 'Sessions', href: '/traininghub/sessions', icon: '▦' }, { label: 'Participants', href: '/traininghub/participants', icon: '♟' }, { label: 'Formateurs', href: '/traininghub/trainers', icon: '▲' }, { label: 'Inscriptions', href: '/traininghub/attendance', icon: '✓' }] },
  { title: 'ADMINISTRATION', items: [{ label: 'Certificats', href: '/traininghub/certificates', icon: '✦' }, { label: 'Documents', href: '/traininghub/documents', icon: '▣' }, { label: 'Qualité', href: '/traininghub/quality', icon: '★' }, { label: 'Rapports', href: '/traininghub/reports', icon: '◴' }] },
  { title: 'PILOTAGE PARTENAIRES', items: [{ label: 'Demandes partenaires', href: '/traininghub/requests', icon: '☞' }, { label: 'Notifications', href: '/traininghub/notifications', icon: '◔' }] },
]

function fmt(value: unknown) {
  return new Intl.NumberFormat('fr-MA').format(Number(value || 0))
}

function money(value: unknown) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(Number(value || 0) / 1000)} K MAD`
}

function dateLabel(value?: string) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return '—'
  }
}

function qs(params: Record<string, string>) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString()
}

export default function TrainingHubCommandCenterProductionFinal() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [city, setCity] = useState('Toutes les villes')
  const [status, setStatus] = useState('Tous statuts')
  const [range, setRange] = useState('month')
  const [drill, setDrill] = useState<{ section: string; title: string; rows: DrillRow[]; loading: boolean } | null>(null)
  const [actionModal, setActionModal] = useState<RecommendedAction | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = qs({ q, city, status, range })
      const response = await fetch(`/api/traininghub/internal/command-center?${query}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setToast(payload?.message || 'Lecture Command Center impossible.')
        setSnapshot(null)
        return
      }
      setSnapshot(payload.data || null)
    } finally {
      setLoading(false)
    }
  }, [city, q, range, status])

  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 180)
    return () => clearTimeout(timer)
  }, [load])

  async function openDrill(section: string, title: string) {
    setDrill({ section, title, rows: [], loading: true })
    const query = qs({ section, q, status })
    const response = await fetch(`/api/traininghub/internal/command-center/drilldown?${query}`, { cache: 'no-store' })
    const payload = await response.json().catch(() => ({}))
    setDrill({ section, title, rows: Array.isArray(payload.rows) ? payload.rows : [], loading: false })
  }

  async function createAction(action?: RecommendedAction | null) {
    const target = action || actionModal
    if (!target) return
    const response = await fetch('/api/traininghub/internal/command-center/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: target.title, priority: target.priority, section: target.section, notes: actionNotes }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      setToast(payload?.message || 'Action non enregistrée.')
      return
    }
    setToast('Action prioritaire enregistrée dans le journal TrainingHub.')
    setActionModal(null)
    setActionNotes('')
    load()
  }

  function exportCsv() {
    window.open('/api/traininghub/internal/command-center/export', '_blank')
  }

  const counts = snapshot?.counts || {}
  const kpis = snapshot?.kpis || {}
  const score = snapshot?.score || {}
  const finance = snapshot?.finance || {}
  const alerts = snapshot?.alerts || []
  const actions = snapshot?.recommended_actions || []
  const recent = snapshot?.recent || []
  const pipeline = snapshot?.pipeline || {}
  const stages = Object.entries(pipeline.partners_by_stage || {})
  const totalStages = stages.reduce((sum, [, value]) => sum + Number(value || 0), 0)
  const chain = snapshot?.chain || [
    { key: 'partners', label: 'Partenaires', count: counts.partners || 0 },
    { key: 'proposals', label: 'Offres', count: counts.proposals || 0 },
    { key: 'orders', label: 'Commandes', count: counts.orders || 0 },
    { key: 'invoices', label: 'Factures', count: counts.invoices || 0 },
    { key: 'credits', label: 'Crédits', count: counts.credits || 0 },
    { key: 'sessions', label: 'Sessions', count: counts.sessions || 0 },
    { key: 'participants', label: 'Présence', count: counts.participants || 0 },
    { key: 'certificates', label: 'Certificats', count: counts.certificates || 0 },
    { key: 'documents', label: 'Archivage', count: counts.documents || 0 },
  ]

  const kpiCards = [
    { icon: '👥', label: 'Partenaires actifs', value: kpis.active_partners || 0, section: 'partners', delta: `${counts.partners || 0} total`, tone: 'blue' },
    { icon: '📄', label: 'Offres ouvertes', value: kpis.open_proposals || 0, section: 'proposals', delta: `${money(finance.forecast_mad || 0)} forecast`, tone: 'blue' },
    { icon: '🛒', label: 'Commandes confirmées', value: kpis.confirmed_orders || 0, section: 'orders', delta: `${money(finance.revenue_mad || 0)} revenu`, tone: 'green' },
    { icon: '🧾', label: 'Factures à livrer', value: kpis.open_invoices || 0, section: 'invoices', delta: `${money(finance.unpaid_mad || 0)} à suivre`, tone: 'purple' },
    { icon: '💳', label: 'Crédits disponibles', value: kpis.available_credits || 0, section: 'credits', delta: 'crédits actifs', tone: 'teal' },
    { icon: '🗓', label: 'Sessions à venir', value: kpis.upcoming_sessions || 0, section: 'sessions', delta: 'planning réel', tone: 'green' },
    { icon: '🛡', label: 'Certificats émis', value: kpis.certificates || 0, section: 'certificates', delta: `${score.certification_rate || 0}% taux`, tone: 'violet' },
    { icon: '📬', label: 'Demandes ouvertes', value: kpis.open_requests || 0, section: 'requests', delta: 'SLA à suivre', tone: 'amber' },
  ]

  return (
    <main style={page}>
      <aside style={sidebar}>
        <div style={brand}>
          <img src="/logo.png" alt="AngelCare" style={logo} />
          <div style={brandLine}>
            <span style={appIcon}>☷</span>
            <div><strong>TrainingHub</strong><small>Portail partenaires</small></div>
          </div>
        </div>

        <nav style={nav}>
          {groups.map((group) => (
            <div key={group.title} style={navGroup}>
              <div style={navTitle}>{group.title}</div>
              {group.items.map((item) => (
                <Link key={`${group.title}-${item.label}`} href={item.href} style={('active' in item && Boolean(item.active)) ? navActive : navItem}>
                  <span style={navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <section style={main}>
        <header style={topbar}>
          <div>
            <h1 style={title}>TrainingHub Command Center</h1>
            <p style={subtitle}>Cockpit production: données réelles, filtres, drill-downs, export et actions opérationnelles.</p>
          </div>

          <div style={topActions}>
            <button style={softBtn} type="button" onClick={() => openDrill('partners', 'Portefeuille partenaires')}>▣ Vue portefeuille</button>
            <button style={mainBtn} type="button" onClick={() => setActionModal(actions[0] || { id: 'manual', title: 'Action prioritaire Command Center', priority: 'high', section: 'global' })}>✦ Action prioritaire</button>
            <select style={selectBtn} value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="month">Ce mois-ci</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            <label style={search}><span>⌕</span><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Rechercher…" style={searchInput} /></label>
            <select style={selectBtn} value={city} onChange={(event) => setCity(event.target.value)}>
              <option>Toutes les villes</option><option>Rabat</option><option>Casablanca</option><option>Kénitra</option><option>Tanger</option><option>Marrakech</option>
            </select>
            <select style={selectBtn} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Tous statuts</option><option>active</option><option>open</option><option>draft</option><option>issued</option><option>confirmed</option><option>resolved</option>
            </select>
            <button style={softBtn} type="button" onClick={exportCsv}>⇩ Exporter</button>
          </div>
        </header>

        {toast ? <div style={toastStyle}>{toast}<button type="button" onClick={() => setToast(null)}>×</button></div> : null}
        {snapshot?.warnings?.length ? <div style={warning}>{snapshot.warnings.slice(0, 2).join(' • ')}</div> : null}

        <section style={heroRow}>
          <article style={hero}>
            <div style={heroRings} />
            <div style={heroContent}>
              <span style={hello}>Production Command Center</span>
              <h2 style={heroTitle}>Pilotez vos partenaires, revenus, sessions, certificats, demandes, risques et opérations en temps réel.</h2>
              <p style={heroText}>Chaîne opérationnelle intégrée: portefeuille → offre → commande → facture → crédits → session → présence → certificat → preuves.</p>
            </div>
          </article>

          <article style={overview}>
            <div style={cardHead}><strong>Vue d’ensemble réelle</strong><button style={smallSelect} type="button" onClick={load}>Rafraîchir</button></div>
            <div style={overviewGrid}>
              <Metric label="Revenu reconnu" value={money(finance.revenue_mad || 0)} delta="factures payées ou commandes" />
              <Metric label="Forecast ouvert" value={money(finance.forecast_mad || 0)} delta="offres ouvertes" />
              <Metric label="À encaisser" value={money(finance.unpaid_mad || 0)} delta="factures non payées" />
            </div>
          </article>

          <article style={healthCard}>
            <div style={sideTitle}><span style={blueDot}>●</span><strong>Score de santé globale</strong></div>
            <Gauge value={Number(score.health || 0)} />
          </article>
        </section>

        <section style={kpiGrid}>
          {kpiCards.map((kpi) => <Kpi key={kpi.label} {...kpi} onClick={() => openDrill(kpi.section, kpi.label)} />)}
        </section>

        <section style={chainCard}>
          <div style={sectionTop}>
            <div><strong>Chaîne opérationnelle</strong><span> — chaque étape est cliquable</span></div>
            <button style={linkBtn} type="button" onClick={() => openDrill('activity', 'Journal Command Center')}>Voir journal ›</button>
          </div>
          <div style={chainRow}>
            {chain.map((step, index) => (
              <div key={step.key} style={chainFrag}>
                <button style={chainBox} type="button" onClick={() => openDrill(step.key, step.label)}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <strong>{step.label}</strong>
                  <small>{fmt(step.count)}</small>
                </button>
                {index < chain.length - 1 ? <span style={arrow}>→</span> : null}
              </div>
            ))}
          </div>
        </section>

        <section style={bodyGrid}>
          <section style={commandPanel}>
            <div style={commandTop}>
              <div>
                <h3 style={sectionTitle}>Centre de commandement opérationnel</h3>
                <p style={sectionSub}>Chaque bloc ouvre son détail réel et permet de créer une action.</p>
              </div>
            </div>

            <div style={panelGrid}>
              <Panel title="Portefeuille partenaires — Pipeline" action="Ouvrir" onAction={() => openDrill('partners', 'Portefeuille partenaires')}>
                <div style={donutWrap}>
                  <div style={donut}><span>{fmt(counts.partners || 0)}</span><small>Total</small></div>
                  <div style={legend}>
                    {stages.length ? stages.slice(0, 5).map(([label, value], index) => (
                      <Legend key={label} color={['#064ee4', '#5e94ff', '#9cc0ff', '#d7e5ff', '#0f9f7a'][index] || '#d7e5ff'} label={label} value={`${fmt(value)} (${totalStages ? Math.round((Number(value) / totalStages) * 100) : 0}%)`} />
                    )) : <Empty text="Aucun statut partenaire exploitable." />}
                  </div>
                </div>
              </Panel>

              <Panel title="Suivi commercial — Conversion" action="Offres" onAction={() => openDrill('proposals', 'Offres & conversion')}>
                <Bar label="Offres ouvertes" value={kpis.open_proposals || 0} width={Math.min(100, (Number(kpis.open_proposals || 0) / Math.max(1, Number(counts.proposals || 1))) * 100)} delta="réel" />
                <Bar label="Taux conversion" value={`${score.conversion_rate || 0}%`} width={Number(score.conversion_rate || 0)} delta="réel" />
                <Bar label="Commandes" value={counts.orders || 0} width={Math.min(100, Number(counts.orders || 0) * 10)} delta="confirmées" />
                <Bar label="Forecast" value={money(finance.forecast_mad || 0)} width={Math.min(100, Number(finance.forecast_mad || 0) / 10000)} delta="MAD" />
              </Panel>

              <Panel title="Planning — Sessions à venir" action="Sessions" onAction={() => openDrill('sessions', 'Sessions à venir')}>
                {recent.filter((item) => item.label === 'Session').slice(0, 4).length
                  ? recent.filter((item) => item.label === 'Session').slice(0, 4).map((item) => <Session key={item.id} title={item.title} date={dateLabel(item.date)} count={item.status || 'planifiée'} />)
                  : <Empty text="Aucune session réelle trouvée." />}
              </Panel>

              <Panel title="Présence & Certifications" action="Certificats" onAction={() => openDrill('certificates', 'Certificats')}>
                <div style={miniCharts}>
                  <MiniChart label="Taux de présence" value={`${score.presence_rate || 0}%`} values={snapshot?.trends?.sessions || []} />
                  <MiniChart label="Taux de certification" value={`${score.certification_rate || 0}%`} values={snapshot?.trends?.certificates || []} />
                </div>
              </Panel>

              <Panel title="Demandes partenaires" action="Demandes" onAction={() => openDrill('requests', 'Demandes partenaires')}>
                {alerts.map((alert) => <Request key={alert.id} title={alert.title} meta={alert.description} status={`${alert.count}`} tone={alert.severity === 'danger' ? 'red' : alert.severity === 'warning' ? 'amber' : 'green'} onClick={() => openDrill(alert.section, alert.title)} />)}
              </Panel>

              <Panel title="Activité récente" action="Journal" onAction={() => openDrill('activity', 'Activité récente')}>
                {recent.length ? recent.slice(0, 5).map((item) => <Activity key={item.id} {...item} />) : <Empty text="Aucune activité réelle disponible." />}
              </Panel>
            </div>
          </section>

          <aside style={rail}>
            <Rail title="SLA & Risques">
              {alerts.map((alert) => <Risk key={alert.id} label={alert.title} value={alert.count} kind={alert.severity === 'danger' ? 'danger' : alert.severity === 'warning' ? 'warn' : 'ok'} onClick={() => openDrill(alert.section, alert.title)} />)}
            </Rail>

            <Rail title="État des modules">
              {(snapshot?.module_status || []).map((module) => <Module key={module.module} name={module.module} status={module.status} count={module.count} />)}
            </Rail>

            <Rail title="Actions recommandées">
              {actions.map((action) => <Action key={action.id} text={action.title} priority={action.priority} onClick={() => setActionModal(action)} />)}
            </Rail>

            <Rail title="Audit production">
              {(snapshot?.table_status || []).slice(0, 6).map((table) => <Module key={table.key} name={table.table} status={table.ok ? 'operational' : 'warning'} count={table.count} />)}
            </Rail>
          </aside>
        </section>
      </section>

      {loading ? <div style={loadingStyle}>Synchronisation production…</div> : null}

      {drill ? (
        <div style={modalOverlay}>
          <section style={modal}>
            <div style={modalHead}>
              <div><span style={hello}>Drill-down production</span><h3>{drill.title}</h3><p>{drill.rows.length} ligne(s) chargée(s) depuis la base.</p></div>
              <button style={closeBtn} type="button" onClick={() => setDrill(null)}>×</button>
            </div>
            {drill.loading ? <Empty text="Chargement…" /> : drill.rows.length ? (
              <div style={drillTable}>
                <div style={drillHeader}><span>Titre</span><span>Statut</span><span>Montant</span><span>Date</span></div>
                {drill.rows.map((row) => (
                  <div key={row.id || `${row.title}-${row.date}`} style={drillRow}>
                    <div><strong>{row.title}</strong><small>{row.subtitle}</small></div>
                    <span>{row.status || '—'}</span>
                    <span>{row.amount_mad ? money(row.amount_mad) : '—'}</span>
                    <span>{dateLabel(row.date)}</span>
                  </div>
                ))}
              </div>
            ) : <Empty text="Aucune ligne trouvée pour ce filtre." />}
          </section>
        </div>
      ) : null}

      {actionModal ? (
        <div style={modalOverlay}>
          <section style={actionModalStyle}>
            <div style={modalHead}>
              <div><span style={hello}>Action prioritaire</span><h3>{actionModal.title}</h3><p>Cette action sera enregistrée dans le journal TrainingHub.</p></div>
              <button style={closeBtn} type="button" onClick={() => setActionModal(null)}>×</button>
            </div>
            <textarea style={textarea} value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} placeholder="Note interne, responsable, échéance, contexte…" />
            <div style={modalFoot}>
              <button style={softBtn} type="button" onClick={() => setActionModal(null)}>Annuler</button>
              <button style={mainBtn} type="button" onClick={() => createAction(actionModal)}>Enregistrer l’action</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function Metric({ label, value, delta }: { label: string; value: ReactNode; delta: string }) {
  return <div style={metric}><span>{label}</span><strong>{value}</strong><small>{delta}</small></div>
}

function Gauge({ value }: { value: number }) {
  const normalized = Math.max(0, Math.min(100, value))
  return (
    <div style={gauge}>
      <svg viewBox="0 0 180 110" style={gaugeSvg}>
        <path d="M25 92 A65 65 0 0 1 155 92" fill="none" stroke="#e2e8f4" strokeWidth="13" strokeLinecap="round" />
        <path d="M25 92 A65 65 0 0 1 155 92" fill="none" stroke={normalized >= 75 ? '#16a34a' : normalized >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${(normalized / 100) * 205} 205`} />
      </svg>
      <div style={gaugeText}><strong>{normalized}</strong><span>/100</span><small>{normalized >= 75 ? 'Solide' : 'À renforcer'}</small></div>
    </div>
  )
}

function Kpi({ icon, label, value, delta, tone, onClick }: { icon: string; label: string; value: ReactNode; delta: string; tone: string; onClick: () => void }) {
  const color = tone === 'green' ? '#18a957' : tone === 'purple' ? '#7c3aed' : tone === 'teal' ? '#0f9f7a' : tone === 'violet' ? '#6d5dfc' : tone === 'amber' ? '#f97316' : '#075bf0'
  return (
    <button style={kpi} type="button" onClick={onClick}>
      <div style={{ ...kpiIcon, color, background: `${color}12` }}>{icon}</div>
      <div><span>{label}</span><strong>{value}</strong><small>{delta}</small></div>
    </button>
  )
}

function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return <article style={panel}><div style={panelHead}><strong>{title}</strong>{action ? <button style={smallSelect} type="button" onClick={onAction}>{action}</button> : null}</div>{children}</article>
}

function Empty({ text }: { text: string }) {
  return <div style={empty}>{text}</div>
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return <div style={legendLine}><span style={{ ...swatch, background: color }} /><span>{label}</span><strong>{value}</strong></div>
}

function Bar({ label, value, width, delta }: { label: string; value: ReactNode; width: number; delta: string }) {
  return <div style={barLine}><span>{label}</span><strong>{value}</strong><div style={barTrack}><i style={{ ...barFill, width: `${Math.max(4, Math.min(100, width))}%` }} /></div><small>{delta}</small></div>
}

function Session({ title, date, count }: { title: string; date: string; count: string }) {
  return <div style={sessionLine}><div><strong>{title}</strong><span>{date}</span></div><b>{count}</b></div>
}

function MiniChart({ label, value, values }: { label: string; value: string; values: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...values.map((item) => Number(item.value || 0)))
  const points = values.length
    ? values.map((item, index) => `${8 + index * (204 / Math.max(1, values.length - 1))},${70 - (Number(item.value || 0) / max) * 54}`).join(' ')
    : '8,70 60,70 112,70 164,70 216,70'
  return (
    <div style={chartBox}>
      <span>{label}</span><strong>{value}</strong><small>calculé depuis la base</small>
      <svg viewBox="0 0 224 78" style={spark}><polyline points={points} fill="none" stroke="#0b5fff" strokeWidth="6" strokeLinecap="round" /></svg>
    </div>
  )
}

function Request({ title, meta, status, tone, onClick }: { title: string; meta: string; status: string; tone: 'red' | 'amber' | 'green'; onClick: () => void }) {
  return <button style={requestLine} type="button" onClick={onClick}><div><strong>{title}</strong><span>{meta}</span></div><em style={tone === 'red' ? pillRed : tone === 'amber' ? pillAmber : pillGreen}>{status}</em></button>
}

function Activity({ label, title, subtitle, date }: { label: string; title: string; subtitle: string; date: string }) {
  return <div style={activityLine}><span>{label.slice(0,1)}</span><div><strong>{title}</strong><small>{subtitle}</small></div><time>{dateLabel(date)}</time></div>
}

function Rail({ title, children }: { title: string; children: ReactNode }) {
  return <article style={railCard}><div style={railHead}><strong>{title}</strong></div>{children}</article>
}

function Risk({ label, value, kind, onClick }: { label: string; value: ReactNode; kind: 'ok' | 'danger' | 'warn'; onClick: () => void }) {
  return <button style={riskLine} type="button" onClick={onClick}><span>{kind === 'ok' ? '◎' : kind === 'danger' ? '●' : '◐'} {label}</span><strong style={kind === 'ok' ? okText : kind === 'danger' ? dangerText : warnText}>{value}</strong></button>
}

function Module({ name, status, count }: { name: string; status: string; count: number }) {
  return <div style={moduleLine}><span>{name}</span><strong style={status === 'operational' ? okText : warnText}>{status === 'operational' ? 'OK' : 'À vérifier'} · {fmt(count)}</strong></div>
}

function Action({ text, priority, onClick }: { text: string; priority: string; onClick: () => void }) {
  return <button style={actionLine} type="button" onClick={onClick}>✦ <span>{text}</span><em>{priority}</em></button>
}

const page: CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '212px minmax(0,1fr)', background: '#f4f8ff', color: '#071834', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const sidebar: CSSProperties = { position: 'sticky', top: 0, height: '100vh', overflow: 'auto', background: '#fff', borderRight: '1px solid #d7e2f3', padding: '18px 12px', display: 'grid', alignContent: 'start', gap: 14 }
const brand: CSSProperties = { display: 'grid', gap: 13, paddingBottom: 10 }
const logo: CSSProperties = { width: '100%', height: 46, objectFit: 'contain' }
const brandLine: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', color: '#09214c', fontWeight: 900 }
const appIcon: CSSProperties = { width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid #dbe5f5', borderRadius: 10 }
const nav: CSSProperties = { display: 'grid', gap: 13 }
const navGroup: CSSProperties = { display: 'grid', gap: 4 }
const navTitle: CSSProperties = { fontSize: 10, color: '#0b5fff', fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', padding: '3px 4px' }
const navItem: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, minHeight: 32, padding: '7px 10px', borderRadius: 8, color: '#143055', fontSize: 12.5, fontWeight: 850, textDecoration: 'none' }
const navActive: CSSProperties = { ...navItem, color: '#fff', background: 'linear-gradient(135deg,#0650e8,#0b62ff)', boxShadow: '0 10px 20px rgba(11,95,255,.25)' }
const navIcon: CSSProperties = { width: 16, textAlign: 'center' }
const main: CSSProperties = { minWidth: 0, display: 'grid', gap: 12, padding: '0 20px 26px' }
const topbar: CSSProperties = { minHeight: 76, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d7e2f3', background: '#fff', margin: '0 -20px', padding: '10px 20px' }
const title: CSSProperties = { margin: 0, fontSize: 21, letterSpacing: '-.03em' }
const subtitle: CSSProperties = { margin: '4px 0 0', fontSize: 11.5, color: '#5c6f8c', fontWeight: 750 }
const topActions: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }
const mainBtn: CSSProperties = { height: 36, border: 0, borderRadius: 8, padding: '0 16px', color: '#fff', background: '#095cff', boxShadow: '0 12px 20px rgba(9,92,255,.22)', fontWeight: 950, cursor: 'pointer' }
const softBtn: CSSProperties = { height: 36, border: '1px solid #d7e2f3', borderRadius: 8, background: '#fff', color: '#153b72', fontWeight: 850, padding: '0 12px', cursor: 'pointer' }
const selectBtn: CSSProperties = { ...softBtn, color: '#153b72' }
const search: CSSProperties = { height: 36, width: 170, border: '1px solid #d7e2f3', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px', color: '#71829d', background: '#fff' }
const searchInput: CSSProperties = { width: '100%', border: 0, outline: 0, fontWeight: 750 }
const warning: CSSProperties = { padding: 11, borderRadius: 10, border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', fontWeight: 850 }
const toastStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, padding: 11, borderRadius: 10, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 900 }
const heroRow: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px 270px', gap: 12, alignItems: 'stretch' }
const hero: CSSProperties = { position: 'relative', overflow: 'hidden', minHeight: 170, border: '1px solid #d7e2f3', borderRadius: 14, background: 'linear-gradient(135deg,#eaf3ff 0%,#ffffff 55%,#e4efff 100%)', boxShadow: '0 14px 26px rgba(15,42,90,.06)' }
const heroRings: CSSProperties = { position: 'absolute', right: -75, top: -160, width: 430, height: 430, borderRadius: '50%', border: '1px solid rgba(9,92,255,.20)', boxShadow: 'inset 0 0 0 60px rgba(9,92,255,.06), inset 0 0 0 120px rgba(255,255,255,.28)' }
const heroContent: CSSProperties = { position: 'relative', zIndex: 1, padding: '31px 28px' }
const hello: CSSProperties = { color: '#075bf0', fontWeight: 950, fontSize: 13 }
const heroTitle: CSSProperties = { margin: '10px 0 14px', maxWidth: 860, fontSize: 29, lineHeight: 1.08, letterSpacing: '-.045em' }
const heroText: CSSProperties = { margin: 0, color: '#687b97', fontWeight: 800 }
const overview: CSSProperties = { alignSelf: 'center', minHeight: 134, padding: 20, borderRadius: 13, background: '#fff', border: '1px solid #d7e2f3', boxShadow: '0 14px 26px rgba(15,42,90,.07)' }
const cardHead: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontWeight: 950 }
const smallSelect: CSSProperties = { border: '1px solid #d7e2f3', borderRadius: 7, background: '#fff', color: '#657996', height: 28, padding: '0 10px', fontSize: 11, fontWeight: 850, cursor: 'pointer' }
const overviewGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 18 }
const metric: CSSProperties = { display: 'grid', gap: 5, borderLeft: '1px solid #e3ebf8', paddingLeft: 12 }
const healthCard: CSSProperties = { padding: 18, borderRadius: 14, background: '#fff', border: '1px solid #d7e2f3', boxShadow: '0 14px 26px rgba(15,42,90,.07)' }
const sideTitle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 950 }
const blueDot: CSSProperties = { color: '#075bf0' }
const gauge: CSSProperties = { position: 'relative', height: 124, display: 'grid', placeItems: 'center' }
const gaugeSvg: CSSProperties = { width: 172, height: 108 }
const gaugeText: CSSProperties = { position: 'absolute', inset: '44px 0 auto', display: 'grid', placeItems: 'center', color: '#091834' }
const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 10 }
const kpi: CSSProperties = { minHeight: 91, display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #d7e2f3', boxShadow: '0 10px 20px rgba(15,42,90,.055)', cursor: 'pointer', color: '#071834', textAlign: 'left' }
const kpiIcon: CSSProperties = { width: 43, height: 43, display: 'grid', placeItems: 'center', borderRadius: 999, fontSize: 19 }
const chainCard: CSSProperties = { padding: 12, borderRadius: 13, background: '#fff', border: '1px solid #d7e2f3', boxShadow: '0 10px 20px rgba(15,42,90,.05)' }
const sectionTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', color: '#11264c', fontWeight: 950 }
const linkBtn: CSSProperties = { border: 0, background: 'transparent', color: '#075bf0', fontWeight: 950, cursor: 'pointer' }
const chainRow: CSSProperties = { marginTop: 11, display: 'grid', gridTemplateColumns: 'repeat(17,auto)', gap: 7, alignItems: 'center' }
const chainFrag: CSSProperties = { display: 'contents' }
const chainBox: CSSProperties = { minWidth: 108, minHeight: 56, display: 'grid', placeItems: 'center', gap: 3, padding: '7px 10px', borderRadius: 9, border: '1px solid #bed1f5', background: '#f8fbff', color: '#0950d8', fontWeight: 950, textAlign: 'center', cursor: 'pointer' }
const arrow: CSSProperties = { color: '#4e6a91', fontWeight: 950 }
const bodyGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 12, alignItems: 'start' }
const commandPanel: CSSProperties = { border: '1px solid #d7e2f3', background: '#fff', borderRadius: 13, padding: 14, boxShadow: '0 10px 20px rgba(15,42,90,.05)' }
const commandTop: CSSProperties = { display: 'flex', justifyContent: 'space-between' }
const sectionTitle: CSSProperties = { margin: 0, fontSize: 15, letterSpacing: '-.02em' }
const sectionSub: CSSProperties = { margin: '4px 0 0', color: '#657995', fontWeight: 750, fontSize: 11.5 }
const panelGrid: CSSProperties = { marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const panel: CSSProperties = { minHeight: 210, display: 'grid', alignContent: 'start', gap: 11, padding: 14, borderRadius: 11, background: '#fff', border: '1px solid #dce5f3' }
const panelHead: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 950, color: '#0d254e' }
const donutWrap: CSSProperties = { display: 'grid', gridTemplateColumns: '150px 1fr', gap: 13, alignItems: 'center' }
const donut: CSSProperties = { width: 130, height: 130, borderRadius: '50%', background: 'conic-gradient(#064ee4 0 52%,#5e94ff 52% 73%,#9cc0ff 73% 88%,#d7e5ff 88% 100%)', display: 'grid', placeItems: 'center', color: '#061b3d', fontWeight: 950 }
const legend: CSSProperties = { display: 'grid', gap: 8 }
const legendLine: CSSProperties = { display: 'grid', gridTemplateColumns: '12px 1fr auto', gap: 8, alignItems: 'center', color: '#415775', fontWeight: 850, fontSize: 12 }
const swatch: CSSProperties = { width: 10, height: 10, borderRadius: 2 }
const empty: CSSProperties = { minHeight: 92, display: 'grid', placeItems: 'center', color: '#64748b', background: '#f8fbff', border: '1px dashed #cddaf0', borderRadius: 10, fontWeight: 850 }
const barLine: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr auto 100px 50px', gap: 9, alignItems: 'center', fontSize: 12, color: '#344c71', fontWeight: 850 }
const barTrack: CSSProperties = { height: 7, borderRadius: 999, background: '#e6eefb', overflow: 'hidden' }
const barFill: CSSProperties = { display: 'block', height: '100%', background: 'linear-gradient(90deg,#0b5fff,#4d8dff)', borderRadius: 999 }
const sessionLine: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid #edf2fb', color: '#314767', fontSize: 12 }
const miniCharts: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const chartBox: CSSProperties = { minHeight: 130, display: 'grid', gap: 5, padding: 12, borderRadius: 10, background: '#fbfdff', border: '1px solid #e2eaf6' }
const spark: CSSProperties = { width: '100%', height: 72 }
const requestLine: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '9px 0', border: 0, borderBottom: '1px solid #edf2fb', background: 'transparent', fontSize: 12, color: '#071834', textAlign: 'left', cursor: 'pointer' }
const pillRed: CSSProperties = { borderRadius: 999, background: '#fff0f0', color: '#e11d48', padding: '6px 8px', fontWeight: 950, fontStyle: 'normal' }
const pillAmber: CSSProperties = { ...pillRed, background: '#fff7ed', color: '#ea580c' }
const pillGreen: CSSProperties = { ...pillRed, background: '#ecfdf5', color: '#16a34a' }
const activityLine: CSSProperties = { display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 9, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #edf2fb', fontSize: 12 }
const rail: CSSProperties = { display: 'grid', gap: 10 }
const railCard: CSSProperties = { padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #d7e2f3', boxShadow: '0 10px 20px rgba(15,42,90,.05)', display: 'grid', gap: 10 }
const railHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 950 }
const riskLine: CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '6px 0', border: 0, borderBottom: '1px solid #edf2fb', background: 'transparent', fontSize: 12, fontWeight: 850, color: '#071834', cursor: 'pointer', textAlign: 'left' }
const okText: CSSProperties = { color: '#16a34a' }
const dangerText: CSSProperties = { color: '#dc2626' }
const warnText: CSSProperties = { color: '#f97316' }
const moduleLine: CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2fb', fontSize: 12, fontWeight: 850, color: '#334865' }
const actionLine: CSSProperties = { display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 7, padding: '7px 0', color: '#173f8a', fontWeight: 850, fontSize: 12, background: 'transparent', border: 0, borderBottom: '1px solid #edf2fb', textAlign: 'left', cursor: 'pointer' }
const loadingStyle: CSSProperties = { position: 'fixed', right: 20, bottom: 20, background: '#075bf0', color: '#fff', borderRadius: 999, padding: '11px 14px', fontWeight: 950, boxShadow: '0 16px 30px rgba(7,91,240,.25)' }
const modalOverlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(7,18,40,.52)', display: 'grid', placeItems: 'center', padding: 24 }
const modal: CSSProperties = { width: 'min(1080px,96vw)', maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 40px 90px rgba(7,18,40,.28)', display: 'grid', gap: 14 }
const actionModalStyle: CSSProperties = { ...modal, width: 'min(720px,96vw)' }
const modalHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }
const closeBtn: CSSProperties = { width: 42, height: 42, borderRadius: 12, border: '1px solid #d7e2f3', background: '#fff', fontSize: 24, fontWeight: 950, cursor: 'pointer' }
const drillTable: CSSProperties = { display: 'grid', border: '1px solid #d7e2f3', borderRadius: 12, overflow: 'hidden' }
const drillHeader: CSSProperties = { display: 'grid', gridTemplateColumns: '1.8fr .8fr .8fr 1fr', gap: 12, padding: 12, background: '#f5f8ff', color: '#075bf0', fontWeight: 950 }
const drillRow: CSSProperties = { display: 'grid', gridTemplateColumns: '1.8fr .8fr .8fr 1fr', gap: 12, padding: 12, borderTop: '1px solid #edf2fb', alignItems: 'center' }
const textarea: CSSProperties = { minHeight: 150, borderRadius: 12, border: '1px solid #d7e2f3', padding: 12, fontWeight: 800 }
const modalFoot: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10 }
