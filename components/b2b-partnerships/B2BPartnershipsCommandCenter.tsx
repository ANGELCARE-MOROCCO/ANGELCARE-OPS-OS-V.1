'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  B2BApiResult,
  B2BDashboardMetrics,
  B2BPartnerProgram,
  B2BProspectDashboardRow,
} from '@/lib/b2b-partnerships/dashboard-types'
import { formatDate, formatMAD, formatNumber, formatPercent, isOverdue } from '@/lib/b2b-partnerships/ui-format'
import styles from './B2BPartnershipsCommandCenter.module.css'

type WorkspaceTab =
  | 'dashboard'
  | 'directory'
  | 'pipeline'
  | 'outreach'
  | 'meetings'
  | 'proposals'
  | 'programs'
  | 'tasks'
  | 'kpis'
  | 'reports'
  | 'settings'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const DEFAULT_METRICS: B2BDashboardMetrics = {
  total_prospects: 0,
  qualified_prospects: 0,
  hotels_pipeline: 0,
  pediatric_clinics_pipeline: 0,
  decision_makers_identified: 0,
  outreach_sent_this_week: 0,
  calls_completed_this_week: 0,
  positive_replies: 0,
  meetings_booked: 0,
  meetings_completed: 0,
  proposals_sent: 0,
  pilots_agreed: 0,
  signed_partners: 0,
  estimated_monthly_revenue: 0,
  estimated_annual_partnership_value: 0,
  conversion_rate: 0,
  overdue_followups: 0,
}

const PIPELINE_STATUSES = [
  'New',
  'Contacted',
  'No Response',
  'Interested',
  'Meeting Booked',
  'Meeting Done',
  'Proposal Sent',
  'Negotiation',
  'Pilot Agreed',
  'Signed Partner',
  'Not Fit',
  'Follow Up Later',
  'Lost',
]

const WORKSPACE_TABS: Array<{ key: WorkspaceTab; label: string; icon: string; readiness: string }> = [
  { key: 'dashboard', label: 'Command Dashboard', icon: '📊', readiness: 'ZIP 2' },
  { key: 'directory', label: 'Prospect Directory', icon: '🏢', readiness: 'ZIP 3' },
  { key: 'pipeline', label: 'Pipeline Board', icon: '🧭', readiness: 'ZIP 3' },
  { key: 'outreach', label: 'Outreach Center', icon: '📨', readiness: 'ZIP 4' },
  { key: 'meetings', label: 'Meetings & Follow-ups', icon: '📅', readiness: 'ZIP 4' },
  { key: 'proposals', label: 'Partnership Proposals', icon: '📄', readiness: 'ZIP 5' },
  { key: 'programs', label: 'Partner Programs', icon: '🤝', readiness: 'ZIP 2' },
  { key: 'tasks', label: 'Tasks & Assignments', icon: '✅', readiness: 'ZIP 4' },
  { key: 'kpis', label: 'Performance KPIs', icon: '📈', readiness: 'ZIP 5' },
  { key: 'reports', label: 'Reports', icon: '🗂️', readiness: 'ZIP 5' },
  { key: 'settings', label: 'Settings', icon: '⚙️', readiness: 'ZIP 5' },
]

function priorityClass(priority: string) {
  if (priority === 'A') return styles.priorityA
  if (priority === 'B') return styles.priorityB
  return styles.priorityC
}

function statusTone(status: string) {
  if (['Signed Partner', 'Pilot Agreed', 'Negotiation'].includes(status)) return styles.statusSuccess
  if (['Interested', 'Meeting Booked', 'Meeting Done', 'Proposal Sent'].includes(status)) return styles.statusActive
  if (['Lost', 'Not Fit', 'No Response'].includes(status)) return styles.statusRisk
  return styles.statusNeutral
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const payload = (await response.json()) as B2BApiResult<T>

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? 'Unable to load data.' : payload.error)
  }

  return payload.data
}

export default function B2BPartnershipsCommandCenter() {
  const [tab, setTab] = useState<WorkspaceTab>('dashboard')
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<B2BDashboardMetrics>(DEFAULT_METRICS)
  const [prospects, setProspects] = useState<B2BProspectDashboardRow[]>([])
  const [programs, setPrograms] = useState<B2BPartnerProgram[]>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [query, setQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  async function refreshData() {
    setState((current) => (current === 'ready' ? 'ready' : 'loading'))
    setError(null)

    try {
      const [nextMetrics, nextProspects, nextPrograms] = await Promise.all([
        readJson<B2BDashboardMetrics>('/api/b2b-partnerships/metrics'),
        readJson<B2BProspectDashboardRow[]>('/api/b2b-partnerships/prospects'),
        readJson<B2BPartnerProgram[]>('/api/b2b-partnerships/partner-programs'),
      ])

      setMetrics(nextMetrics)
      setProspects(nextProspects)
      setPrograms(nextPrograms)
      setLastSyncedAt(new Date())
      setState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to synchronize B2B workspace.')
      setState('error')
    }
  }

  useEffect(() => {
    void refreshData()
    const sync = window.setInterval(() => {
      void refreshData()
    }, 30000)

    return () => window.clearInterval(sync)
  }, [])

  const filteredProspects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return prospects.filter((prospect) => {
      const matchesQuery = normalizedQuery
        ? [prospect.name, prospect.city, prospect.sector, prospect.status, prospect.decision_maker_name]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        : true

      const matchesSector = sectorFilter === 'All' || prospect.sector === sectorFilter
      const matchesPriority = priorityFilter === 'All' || prospect.priority_score === priorityFilter

      return matchesQuery && matchesSector && matchesPriority
    })
  }, [priorityFilter, prospects, query, sectorFilter])

  const sectors = useMemo(() => ['All', ...Array.from(new Set(prospects.map((prospect) => prospect.sector))).sort()], [prospects])

  const priorityOpportunities = useMemo(
    () =>
      [...prospects]
        .filter((prospect) => prospect.priority_score === 'A')
        .sort((a, b) => Number(b.estimated_annual_value ?? 0) - Number(a.estimated_annual_value ?? 0))
        .slice(0, 6),
    [prospects]
  )

  const overdueProspects = useMemo(
    () => prospects.filter((prospect) => isOverdue(prospect.next_follow_up_at)).slice(0, 6),
    [prospects]
  )

  const pipelineCounts = useMemo(() => {
    return PIPELINE_STATUSES.map((status) => ({
      status,
      count: prospects.filter((prospect) => prospect.status === status).length,
    }))
  }, [prospects])

  const lastSyncLabel = lastSyncedAt
    ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastSyncedAt)
    : 'En attente'

  return (
    <main className={styles.workspaceShell}>
      <section className={styles.heroPanel}>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <span className={styles.liveDot} /> Live-synced production workspace · White enterprise module
          </div>
          <h1>B2B Partnerships Command Center</h1>
          <p>
            Pilotage premium des partenariats ANGELCARE, de la prospection aux hôtels, resorts, cliniques pédiatriques et
            centres de développement de l’enfant jusqu’aux pilotes et partenariats signés.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryButton} onClick={() => setTab('directory')} type="button">
              Ouvrir le pipeline prospects
            </button>
            <button className={styles.secondaryButton} onClick={() => void refreshData()} type="button">
              Synchroniser maintenant
            </button>
          </div>
        </div>

        <aside className={styles.syncCard}>
          <span className={styles.cardLabel}>Production Sync</span>
          <strong>{state === 'loading' ? 'Synchronisation…' : 'Live Ready'}</strong>
          <p>Dernière synchronisation : {lastSyncLabel}</p>
          <div className={styles.syncGrid}>
            <div>
              <span>API</span>
              <strong>{state === 'error' ? 'Erreur' : 'OK'}</strong>
            </div>
            <div>
              <span>DB</span>
              <strong>{state === 'error' ? 'À vérifier' : 'Connectée'}</strong>
            </div>
          </div>
        </aside>
      </section>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <section className={styles.navigationGrid} aria-label="B2B workspace navigation">
        {WORKSPACE_TABS.map((item) => (
          <button
            className={`${styles.navCard} ${tab === item.key ? styles.navCardActive : ''}`}
            key={item.key}
            onClick={() => setTab(item.key)}
            type="button"
          >
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
            <small>{item.readiness}</small>
          </button>
        ))}
      </section>

      {tab === 'dashboard' ? (
        <DashboardView
          filteredProspects={filteredProspects}
          metrics={metrics}
          overdueProspects={overdueProspects}
          pipelineCounts={pipelineCounts}
          priorityOpportunities={priorityOpportunities}
          programs={programs}
          query={query}
          sectorFilter={sectorFilter}
          sectors={sectors}
          setPriorityFilter={setPriorityFilter}
          setQuery={setQuery}
          setSectorFilter={setSectorFilter}
          priorityFilter={priorityFilter}
        />
      ) : null}

      {tab !== 'dashboard' ? (
        <PreparedWorkspaceView
          metrics={metrics}
          programs={programs}
          tab={tab}
          prospects={filteredProspects}
          pipelineCounts={pipelineCounts}
        />
      ) : null}
    </main>
  )
}

function DashboardView(props: {
  metrics: B2BDashboardMetrics
  filteredProspects: B2BProspectDashboardRow[]
  priorityOpportunities: B2BProspectDashboardRow[]
  overdueProspects: B2BProspectDashboardRow[]
  pipelineCounts: Array<{ status: string; count: number }>
  programs: B2BPartnerProgram[]
  query: string
  sectorFilter: string
  priorityFilter: string
  sectors: string[]
  setQuery: (value: string) => void
  setSectorFilter: (value: string) => void
  setPriorityFilter: (value: string) => void
}) {
  const kpis = [
    { label: 'Total prospects', value: formatNumber(props.metrics.total_prospects), hint: 'Base CRM active', icon: '🏢' },
    { label: 'Prospects qualifiés', value: formatNumber(props.metrics.qualified_prospects), hint: 'Priorités A/B', icon: '🎯' },
    { label: 'Pipeline hôtels', value: formatNumber(props.metrics.hotels_pipeline), hint: 'Hospitality & resorts', icon: '🏨' },
    { label: 'Pipeline cliniques', value: formatNumber(props.metrics.pediatric_clinics_pipeline), hint: 'Pédiatrie & enfance', icon: '🩺' },
    { label: 'Décideurs identifiés', value: formatNumber(props.metrics.decision_makers_identified), hint: 'Contacts stratégiques', icon: '👤' },
    { label: 'Outreach semaine', value: formatNumber(props.metrics.outreach_sent_this_week), hint: 'Emails, WhatsApp, LinkedIn', icon: '📨' },
    { label: 'Appels semaine', value: formatNumber(props.metrics.calls_completed_this_week), hint: 'Call discipline', icon: '☎️' },
    { label: 'Réponses positives', value: formatNumber(props.metrics.positive_replies), hint: 'Signaux chauds', icon: '✅' },
    { label: 'Meetings bookés', value: formatNumber(props.metrics.meetings_booked), hint: 'À venir', icon: '📅' },
    { label: 'Meetings réalisés', value: formatNumber(props.metrics.meetings_completed), hint: 'Discovery & négociation', icon: '🤝' },
    { label: 'Propositions actives', value: formatNumber(props.metrics.proposals_sent), hint: 'Envoyées / négociation', icon: '📄' },
    { label: 'Pilotes accordés', value: formatNumber(props.metrics.pilots_agreed), hint: 'Pré-conversion', icon: '🚀' },
    { label: 'Partenaires signés', value: formatNumber(props.metrics.signed_partners), hint: 'Conversion finale', icon: '🏆' },
    { label: 'MRR estimé', value: formatMAD(props.metrics.estimated_monthly_revenue), hint: 'Mensuel potentiel', icon: '💰' },
    { label: 'Valeur annuelle', value: formatMAD(props.metrics.estimated_annual_partnership_value), hint: 'Pipeline annuel', icon: '📈' },
    { label: 'Conversion', value: formatPercent(props.metrics.conversion_rate), hint: 'Signés / total', icon: '⚡' },
  ]

  return (
    <section className={styles.dashboardGrid}>
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <article className={styles.kpiCard} key={kpi.label}>
            <div className={styles.kpiIcon}>{kpi.icon}</div>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.hint}</small>
          </article>
        ))}
      </div>

      <section className={styles.controlPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.cardLabel}>Executive Pipeline Control</span>
            <h2>Prospects prioritaires & filtres rapides</h2>
          </div>
          <strong>{props.filteredProspects.length} affichés</strong>
        </div>

        <div className={styles.filterBar}>
          <input
            aria-label="Rechercher prospect"
            onChange={(event) => props.setQuery(event.target.value)}
            placeholder="Rechercher hôtel, clinique, ville, décideur…"
            value={props.query}
          />
          <select onChange={(event) => props.setSectorFilter(event.target.value)} value={props.sectorFilter}>
            {props.sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector === 'All' ? 'Tous les secteurs' : sector}
              </option>
            ))}
          </select>
          <select onChange={(event) => props.setPriorityFilter(event.target.value)} value={props.priorityFilter}>
            <option value="All">Toutes priorités</option>
            <option value="A">Priorité A</option>
            <option value="B">Priorité B</option>
            <option value="C">Priorité C</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.prospectTable}>
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Secteur</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Valeur annuelle</th>
                <th>Prochaine action</th>
              </tr>
            </thead>
            <tbody>
              {props.filteredProspects.slice(0, 10).map((prospect) => (
                <tr key={prospect.id}>
                  <td>
                    <strong>{prospect.name}</strong>
                    <span>{prospect.city || 'Ville non définie'} · {prospect.decision_maker_name || 'Décideur à identifier'}</span>
                  </td>
                  <td>{prospect.sector}</td>
                  <td><span className={`${styles.statusBadge} ${statusTone(prospect.status)}`}>{prospect.status}</span></td>
                  <td><span className={`${styles.priorityBadge} ${priorityClass(prospect.priority_score)}`}>{prospect.priority_score}</span></td>
                  <td>{formatMAD(prospect.estimated_annual_value)}</td>
                  <td>
                    <strong>{prospect.next_action || 'À définir'}</strong>
                    <span className={isOverdue(prospect.next_follow_up_at) ? styles.overdueText : ''}>{formatDate(prospect.next_follow_up_at)}</span>
                  </td>
                </tr>
              ))}
              {props.filteredProspects.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>Aucun prospect ne correspond aux filtres actuels.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <aside className={styles.sideStack}>
        <InsightCard title="Pipeline Health" label="CRM stages" icon="🧭">
          <div className={styles.stageList}>
            {props.pipelineCounts.map((stage) => (
              <div key={stage.status}>
                <span>{stage.status}</span>
                <strong>{stage.count}</strong>
              </div>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="Opportunités priorité A" label="High-value focus" icon="🔥">
          <OpportunityList prospects={props.priorityOpportunities} empty="Aucune priorité A pour le moment." />
        </InsightCard>

        <InsightCard title="Follow-ups en retard" label="Execution discipline" icon="⏱️">
          <OpportunityList prospects={props.overdueProspects} empty="Aucun retard critique." overdue />
        </InsightCard>
      </aside>

      <section className={styles.programsPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.cardLabel}>Partner Programs</span>
            <h2>Offres B2B ANGELCARE prêtes à vendre</h2>
          </div>
          <strong>{props.programs.length} programmes actifs</strong>
        </div>
        <div className={styles.programGrid}>
          {props.programs.map((program) => (
            <article className={styles.programCard} key={program.id}>
              <span>{program.sector_focus || 'Secteur B2B'}</span>
              <h3>{program.name}</h3>
              <p>{program.description}</p>
              <div className={styles.programChips}>
                {(program.services || []).slice(0, 4).map((service) => <small key={service}>{service}</small>)}
              </div>
            </article>
          ))}
          {props.programs.length === 0 ? <div className={styles.emptyPanel}>Aucun programme actif trouvé.</div> : null}
        </div>
      </section>
    </section>
  )
}

function OpportunityList(props: { prospects: B2BProspectDashboardRow[]; empty: string; overdue?: boolean }) {
  if (props.prospects.length === 0) return <p className={styles.emptyText}>{props.empty}</p>

  return (
    <div className={styles.opportunityList}>
      {props.prospects.map((prospect) => (
        <article key={prospect.id}>
          <div>
            <strong>{prospect.name}</strong>
            <span>{prospect.sector} · {prospect.city || '—'}</span>
          </div>
          <small className={props.overdue ? styles.overduePill : priorityClass(prospect.priority_score)}>
            {props.overdue ? formatDate(prospect.next_follow_up_at) : prospect.priority_score}
          </small>
        </article>
      ))}
    </div>
  )
}

function InsightCard(props: { title: string; label: string; icon: string; children: ReactNode }) {
  return (
    <article className={styles.insightCard}>
      <div className={styles.insightHeader}>
        <div>
          <span className={styles.cardLabel}>{props.label}</span>
          <h3>{props.title}</h3>
        </div>
        <span className={styles.insightIcon}>{props.icon}</span>
      </div>
      {props.children}
    </article>
  )
}

function PreparedWorkspaceView(props: {
  tab: WorkspaceTab
  metrics: B2BDashboardMetrics
  prospects: B2BProspectDashboardRow[]
  programs: B2BPartnerProgram[]
  pipelineCounts: Array<{ status: string; count: number }>
}) {
  const current = WORKSPACE_TABS.find((item) => item.key === props.tab)

  return (
    <section className={styles.preparedShell}>
      <div className={styles.preparedHero}>
        <span>{current?.icon}</span>
        <div>
          <strong>{current?.label}</strong>
          <p>
            Cette zone est préparée dans l’architecture ZIP 2 et connectée aux fondations live. Les workflows complets arrivent
            dans les ZIPs suivants sans casser la structure actuelle.
          </p>
        </div>
      </div>

      <div className={styles.preparedGrid}>
        <article>
          <span className={styles.cardLabel}>Live foundation</span>
          <strong>{formatNumber(props.metrics.total_prospects)}</strong>
          <p>Prospects disponibles depuis le backend ZIP 1.</p>
        </article>
        <article>
          <span className={styles.cardLabel}>Pipeline readiness</span>
          <strong>{props.pipelineCounts.filter((item) => item.count > 0).length}</strong>
          <p>Étapes CRM ayant déjà des données actives.</p>
        </article>
        <article>
          <span className={styles.cardLabel}>Programs</span>
          <strong>{props.programs.length}</strong>
          <p>Programmes de partenariat disponibles pour commercialisation.</p>
        </article>
      </div>
    </section>
  )
}
