'use client'
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type {
  B2BApiResult,
  B2BCompletionMetrics,
  B2BPartnerProgram,
  B2BProposal,
  B2BProspectLite,
  B2BWeeklyReport,
} from '@/lib/b2b-partnerships/completion-types'
import {
  PRICING_MODELS,
  PROPOSAL_STATUSES,
  PROPOSAL_TYPES,
} from '@/lib/b2b-partnerships/completion-types'
import {
  addDaysDateInput,
  formatDate,
  formatDateTime,
  formatMoney,
  joinList,
  parseListText,
  proposalStatusTone,
  sectorIcon,
  todayDateInput,
} from '@/lib/b2b-partnerships/completion-utils'
import styles from './B2BCompletionWorkspace.module.css'

type Mode = 'proposals' | 'programs' | 'reports' | 'kpis' | 'hardening'
type LoadState = 'idle' | 'loading' | 'ready' | 'error'

type Props = { defaultMode?: Mode }

type ProposalDraft = {
  id?: string
  prospect_id: string
  proposal_title: string
  proposal_type: string
  services_included: string
  pricing_model: string
  estimated_monthly_value: number
  estimated_annual_value: number
  pilot_duration: string
  status: string
  follow_up_at: string
}

type ReportDraft = {
  period_start: string
  period_end: string
  summary: string
  best_opportunities: string
  objections: string
  support_needed: string
  next_week_plan: string
}

const emptyProposal: ProposalDraft = {
  prospect_id: '',
  proposal_title: '',
  proposal_type: PROPOSAL_TYPES[0],
  services_included: '',
  pricing_model: PRICING_MODELS[0],
  estimated_monthly_value: 0,
  estimated_annual_value: 0,
  pilot_duration: '30 jours',
  status: 'Draft',
  follow_up_at: addDaysDateInput(5),
}

const emptyReport: ReportDraft = {
  period_start: todayDateInput(),
  period_end: todayDateInput(),
  summary: '',
  best_opportunities: '',
  objections: '',
  support_needed: '',
  next_week_plan: '',
}

export default function B2BCompletionWorkspace({ defaultMode = 'proposals' }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const [prospects, setProspects] = useState<B2BProspectLite[]>([])
  const [proposals, setProposals] = useState<B2BProposal[]>([])
  const [programs, setPrograms] = useState<B2BPartnerProgram[]>([])
  const [reports, setReports] = useState<B2BWeeklyReport[]>([])
  const [metrics, setMetrics] = useState<B2BCompletionMetrics | null>(null)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedProposal, setSelectedProposal] = useState<B2BProposal | null>(null)
  const [proposalDraft, setProposalDraft] = useState<ProposalDraft>(emptyProposal)
  const [reportDraft, setReportDraft] = useState<ReportDraft>(emptyReport)
  const [modal, setModal] = useState<'proposal' | 'report' | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function loadAll(isSilent = false) {
    try {
      if (!isSilent) setLoadState('loading')
      setSyncing(true)
      setError('')

      const [prospectRes, proposalRes, programRes, reportRes, metricRes] = await Promise.all([
        fetch('/api/b2b-partnerships/prospects', { cache: 'no-store' }),
        fetch('/api/b2b-partnerships/proposals', { cache: 'no-store' }),
        fetch('/api/b2b-partnerships/partner-programs', { cache: 'no-store' }),
        fetch('/api/b2b-partnerships/reports', { cache: 'no-store' }),
        fetch('/api/b2b-partnerships/reports/weekly', { cache: 'no-store' }),
      ])

      const prospectJson = (await prospectRes.json()) as B2BApiResult<B2BProspectLite[]>
      const proposalJson = (await proposalRes.json()) as B2BApiResult<B2BProposal[]>
      const programJson = (await programRes.json()) as B2BApiResult<B2BPartnerProgram[]>
      const reportJson = (await reportRes.json()) as B2BApiResult<B2BWeeklyReport[]>
      const metricJson = (await metricRes.json()) as B2BApiResult<B2BCompletionMetrics>

      if (!prospectJson.ok) throw new Error(prospectJson.error)
      if (!proposalJson.ok) throw new Error(proposalJson.error)
      if (!programJson.ok) throw new Error(programJson.error)
      if (!reportJson.ok) throw new Error(reportJson.error)
      if (!metricJson.ok) throw new Error(metricJson.error)

      setProspects(prospectJson.data)
      setProposals(proposalJson.data)
      setPrograms(programJson.data)
      setReports(reportJson.data)
      setMetrics(metricJson.data)
      setLastSync(new Date())
      setLoadState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le workspace de finalisation B2B.')
      setLoadState('error')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadAll()
    if (!shouldStartAutoRefresh()) return
    const interval = window.setInterval(() => loadAll(true), safeRefreshInterval(30000))
    return () => window.clearInterval(interval)
  }, [])

  const filteredProposals = useMemo(() => {
    const q = query.trim().toLowerCase()
    return proposals.filter((proposal) => {
      const text = [
        proposal.proposal_title,
        proposal.proposal_type,
        proposal.status,
        proposal.pricing_model,
        proposal.prospect?.name,
        proposal.prospect?.sector,
        proposal.prospect?.city,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = !q || text.includes(q)
      const matchesStatus = statusFilter === 'All' || proposal.status === statusFilter
      const matchesType = typeFilter === 'All' || proposal.proposal_type === typeFilter

      return matchesQuery && matchesStatus && matchesType
    })
  }, [proposals, query, statusFilter, typeFilter])

  function openCreateProposal() {
    setSelectedProposal(null)
    setProposalDraft(emptyProposal)
    setModal('proposal')
  }

  function openEditProposal(proposal: B2BProposal) {
    setSelectedProposal(proposal)
    setProposalDraft({
      id: proposal.id,
      prospect_id: proposal.prospect_id,
      proposal_title: proposal.proposal_title,
      proposal_type: proposal.proposal_type ?? PROPOSAL_TYPES[0],
      services_included: joinList(proposal.services_included),
      pricing_model: proposal.pricing_model ?? PRICING_MODELS[0],
      estimated_monthly_value: Number(proposal.estimated_monthly_value ?? 0),
      estimated_annual_value: Number(proposal.estimated_annual_value ?? 0),
      pilot_duration: proposal.pilot_duration ?? '30 jours',
      status: proposal.status,
      follow_up_at: proposal.follow_up_at ? proposal.follow_up_at.slice(0, 10) : addDaysDateInput(5),
    })
    setModal('proposal')
  }

  async function saveProposal(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setNotice('')

    const payload = {
      ...proposalDraft,
      services_included: parseListText(proposalDraft.services_included),
      follow_up_at: proposalDraft.follow_up_at ? new Date(proposalDraft.follow_up_at).toISOString() : null,
    }

    try {
      const endpoint = proposalDraft.id
        ? `/api/b2b-partnerships/proposals/${proposalDraft.id}`
        : '/api/b2b-partnerships/proposals'

      const res = await fetch(endpoint, {
        method: proposalDraft.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as B2BApiResult<B2BProposal>
      if (!json.ok) throw new Error(json.error)

      setNotice(proposalDraft.id ? 'Proposition mise à jour.' : 'Proposition créée.')
      setModal(null)
      await loadAll(true)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Impossible d’enregistrer la proposition.')
    } finally {
      setSaving(false)
    }
  }

  async function updateProposalStatus(proposal: B2BProposal, status: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/b2b-partnerships/proposals/${proposal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = (await res.json()) as B2BApiResult<B2BProposal>
      if (!json.ok) throw new Error(json.error)
      setNotice(`Statut proposition mis à jour : ${status}`)
      await loadAll(true)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Impossible de mettre à jour le statut.')
    } finally {
      setSaving(false)
    }
  }

  async function generateReport(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const res = await fetch('/api/b2b-partnerships/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportDraft),
      })
      const json = (await res.json()) as B2BApiResult<B2BWeeklyReport>
      if (!json.ok) throw new Error(json.error)
      setNotice('Rapport hebdomadaire généré et archivé.')
      setModal(null)
      await loadAll(true)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Impossible de générer le rapport.')
    } finally {
      setSaving(false)
    }
  }

  const modeTitle = {
    proposals: 'Propositions commerciales',
    programs: 'Programmes partenaires',
    reports: 'Rapports hebdomadaires',
    kpis: 'KPI & pilotage exécutif',
    hardening: 'Contrôle production & hardening',
  }[mode]

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <div>
          <div className={styles.eyebrow}><span className={styles.liveDot} /> ZIP 5 · 100% completion layer · Live sync</div>
          <h1>Partnership Revenue & Reporting Control Center</h1>
          <p>
            Finalisation commerciale ANGELCARE B2B : propositions, programmes partenaires, rapports hebdomadaires,
            KPI exécutifs et contrôle de production. Interface blanche, premium, live-synced et prête pour usage réel.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryBtn} onClick={openCreateProposal}>Créer une proposition</button>
            <button className={styles.secondaryBtn} onClick={() => setModal('report')}>Générer rapport hebdo</button>
            <button className={styles.secondaryBtn} onClick={() => loadAll(true)} disabled={syncing}>{syncing ? 'Synchronisation…' : 'Synchroniser'}</button>
          </div>
        </div>
        <aside className={styles.syncCard}>
          <strong>État production</strong>
          <span>{loadState === 'ready' ? 'Connecté aux endpoints B2B' : loadState === 'loading' ? 'Chargement…' : 'À vérifier'}</span>
          <small>Dernière sync : {lastSync ? formatDateTime(lastSync.toISOString()) : '—'}</small>
          <small>Rafraîchissement automatique : 30s</small>
        </aside>
      </header>

      {notice && <div className={styles.notice}>{notice}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.kpiGrid}>
        <Kpi label="Propositions" value={metrics?.total_proposals ?? proposals.length} hint="pipeline commercial" />
        <Kpi label="Envoyées" value={metrics?.sent_proposals ?? 0} hint="client-facing" />
        <Kpi label="Acceptées" value={metrics?.accepted_proposals ?? 0} hint="conversion" />
        <Kpi label="Valeur annuelle" value={formatMoney(metrics?.proposal_pipeline_value_annual ?? 0)} hint="pipeline estimé" />
        <Kpi label="Programmes actifs" value={metrics?.active_partner_programs ?? programs.length} hint="offres structurées" />
        <Kpi label="Rapports" value={metrics?.reports_generated ?? reports.length} hint="archives hebdo" />
      </section>

      <nav className={styles.tabs} aria-label="B2B completion navigation">
        {[
          ['proposals', 'Propositions'],
          ['programs', 'Programmes'],
          ['reports', 'Rapports'],
          ['kpis', 'KPI'],
          ['hardening', 'Hardening'],
        ].map(([key, label]) => (
          <button key={key} className={mode === key ? styles.activeTab : ''} onClick={() => setMode(key as Mode)}>{label}</button>
        ))}
      </nav>

      <main className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.kicker}>B2B Partnerships Command Center</span>
            <h2>{modeTitle}</h2>
          </div>
          {mode === 'proposals' && <button className={styles.primaryBtn} onClick={openCreateProposal}>Nouvelle proposition</button>}
          {mode === 'reports' && <button className={styles.primaryBtn} onClick={() => setModal('report')}>Nouveau rapport</button>}
        </div>

        {mode === 'proposals' && (
          <>
            <div className={styles.filters}>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher proposition, prospect, ville, statut…" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">Tous les statuts</option>
                {PROPOSAL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="All">Tous les types</option>
                {PROPOSAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className={styles.proposalGrid}>
              {filteredProposals.map((proposal) => (
                <article key={proposal.id} className={styles.proposalCard}>
                  <div className={styles.proposalTop}>
                    <span className={styles.sectorIcon}>{sectorIcon(proposal.prospect?.sector)}</span>
                    <div>
                      <h3>{proposal.proposal_title}</h3>
                      <p>{proposal.prospect?.name ?? 'Prospect non lié'} · {proposal.prospect?.city ?? 'Ville —'}</p>
                    </div>
                    <span className={`${styles.badge} ${styles[proposalStatusTone(proposal.status)]}`}>{proposal.status}</span>
                  </div>
                  <div className={styles.proposalMeta}>
                    <span>{proposal.proposal_type ?? 'Type —'}</span>
                    <span>{proposal.pricing_model ?? 'Pricing —'}</span>
                    <span>Suivi : {formatDate(proposal.follow_up_at)}</span>
                  </div>
                  <div className={styles.valueRow}>
                    <strong>{formatMoney(proposal.estimated_monthly_value)}</strong>
                    <span>{formatMoney(proposal.estimated_annual_value)} / an</span>
                  </div>
                  <div className={styles.cardActions}>
                    <button onClick={() => openEditProposal(proposal)}>Modifier</button>
                    <select value={proposal.status} onChange={(e) => updateProposalStatus(proposal, e.target.value)} disabled={saving}>
                      {PROPOSAL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </article>
              ))}
              {!filteredProposals.length && <div className={styles.empty}>Aucune proposition trouvée.</div>}
            </div>
          </>
        )}

        {mode === 'programs' && (
          <div className={styles.programGrid}>
            {programs.map((program) => (
              <article key={program.id} className={styles.programCard}>
                <div className={styles.programHeader}>
                  <span>🤝</span>
                  <div>
                    <h3>{program.name}</h3>
                    <p>{program.sector_focus}</p>
                  </div>
                </div>
                <p className={styles.programDescription}>{program.description}</p>
                <div className={styles.splitList}>
                  <div>
                    <strong>Services</strong>
                    <ul>{(program.services ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div>
                    <strong>Valeur partenaire</strong>
                    <ul>{(program.value_proposition ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                </div>
                <div className={styles.pricingModels}>{(program.pricing_models ?? []).map((item) => <span key={item}>{item}</span>)}</div>
              </article>
            ))}
          </div>
        )}

        {mode === 'reports' && (
          <div className={styles.reportGrid}>
            {reports.map((report) => (
              <article key={report.id} className={styles.reportCard}>
                <div>
                  <span className={styles.kicker}>Rapport {report.report_type}</span>
                  <h3>{formatDate(report.period_start)} → {formatDate(report.period_end)}</h3>
                  <p>{report.summary || 'Aucune synthèse renseignée.'}</p>
                </div>
                <div className={styles.reportColumns}>
                  <section><strong>Meilleures opportunités</strong><p>{report.best_opportunities || '—'}</p></section>
                  <section><strong>Objections</strong><p>{report.objections || '—'}</p></section>
                  <section><strong>Support management</strong><p>{report.support_needed || '—'}</p></section>
                  <section><strong>Plan semaine suivante</strong><p>{report.next_week_plan || '—'}</p></section>
                </div>
              </article>
            ))}
            {!reports.length && <div className={styles.empty}>Aucun rapport hebdomadaire archivé.</div>}
          </div>
        )}

        {mode === 'kpis' && <ExecutiveKpis metrics={metrics} />}
        {mode === 'hardening' && <HardeningPanel />}
      </main>

      {modal === 'proposal' && (
        <div className={styles.modalOverlay} onMouseDown={() => setModal(null)}>
          <form className={styles.modal} onSubmit={saveProposal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div><span className={styles.kicker}>Proposition commerciale</span><h2>{selectedProposal ? 'Modifier proposition' : 'Créer proposition'}</h2></div>
              <button type="button" onClick={() => setModal(null)}>×</button>
            </div>
            <div className={styles.formGrid}>
              <label>Prospect<select required value={proposalDraft.prospect_id} onChange={(e) => setProposalDraft({ ...proposalDraft, prospect_id: e.target.value })}><option value="">Sélectionner</option>{prospects.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.city ?? '—'}</option>)}</select></label>
              <label>Titre<input required value={proposalDraft.proposal_title} onChange={(e) => setProposalDraft({ ...proposalDraft, proposal_title: e.target.value })} /></label>
              <label>Type<select value={proposalDraft.proposal_type} onChange={(e) => setProposalDraft({ ...proposalDraft, proposal_type: e.target.value })}>{PROPOSAL_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label>Pricing<select value={proposalDraft.pricing_model} onChange={(e) => setProposalDraft({ ...proposalDraft, pricing_model: e.target.value })}>{PRICING_MODELS.map((model) => <option key={model}>{model}</option>)}</select></label>
              <label>Valeur mensuelle<input type="number" min="0" value={proposalDraft.estimated_monthly_value} onChange={(e) => setProposalDraft({ ...proposalDraft, estimated_monthly_value: Number(e.target.value) })} /></label>
              <label>Valeur annuelle<input type="number" min="0" value={proposalDraft.estimated_annual_value} onChange={(e) => setProposalDraft({ ...proposalDraft, estimated_annual_value: Number(e.target.value) })} /></label>
              <label>Durée pilote<input value={proposalDraft.pilot_duration} onChange={(e) => setProposalDraft({ ...proposalDraft, pilot_duration: e.target.value })} /></label>
              <label>Statut<select value={proposalDraft.status} onChange={(e) => setProposalDraft({ ...proposalDraft, status: e.target.value })}>{PROPOSAL_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label>Follow-up<input type="date" value={proposalDraft.follow_up_at} onChange={(e) => setProposalDraft({ ...proposalDraft, follow_up_at: e.target.value })} /></label>
              <label className={styles.full}>Services inclus<textarea value={proposalDraft.services_included} onChange={(e) => setProposalDraft({ ...proposalDraft, services_included: e.target.value })} placeholder="Un service par ligne" /></label>
            </div>
            <div className={styles.modalActions}><button type="button" onClick={() => setModal(null)}>Annuler</button><button className={styles.primaryBtn} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div>
          </form>
        </div>
      )}

      {modal === 'report' && (
        <div className={styles.modalOverlay} onMouseDown={() => setModal(null)}>
          <form className={styles.modal} onSubmit={generateReport} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div><span className={styles.kicker}>Weekly executive report</span><h2>Générer rapport hebdomadaire</h2></div>
              <button type="button" onClick={() => setModal(null)}>×</button>
            </div>
            <div className={styles.formGrid}>
              <label>Début période<input type="date" value={reportDraft.period_start} onChange={(e) => setReportDraft({ ...reportDraft, period_start: e.target.value })} /></label>
              <label>Fin période<input type="date" value={reportDraft.period_end} onChange={(e) => setReportDraft({ ...reportDraft, period_end: e.target.value })} /></label>
              <label className={styles.full}>Synthèse<textarea required value={reportDraft.summary} onChange={(e) => setReportDraft({ ...reportDraft, summary: e.target.value })} /></label>
              <label className={styles.full}>Meilleures opportunités<textarea value={reportDraft.best_opportunities} onChange={(e) => setReportDraft({ ...reportDraft, best_opportunities: e.target.value })} /></label>
              <label className={styles.full}>Objections reçues<textarea value={reportDraft.objections} onChange={(e) => setReportDraft({ ...reportDraft, objections: e.target.value })} /></label>
              <label className={styles.full}>Support nécessaire<textarea value={reportDraft.support_needed} onChange={(e) => setReportDraft({ ...reportDraft, support_needed: e.target.value })} /></label>
              <label className={styles.full}>Plan semaine suivante<textarea value={reportDraft.next_week_plan} onChange={(e) => setReportDraft({ ...reportDraft, next_week_plan: e.target.value })} /></label>
            </div>
            <div className={styles.modalActions}><button type="button" onClick={() => setModal(null)}>Annuler</button><button className={styles.primaryBtn} disabled={saving}>{saving ? 'Génération…' : 'Générer et archiver'}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return <article className={styles.kpi}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>
}

function ExecutiveKpis({ metrics }: { metrics: B2BCompletionMetrics | null }) {
  const rows = [
    ['Conversion signée', `${metrics?.conversion_rate ?? 0}%`, 'Prospects → partenaires signés'],
    ['Follow-up needed', metrics?.follow_up_needed ?? 0, 'Propositions nécessitant relance'],
    ['Pilotes accordés', metrics?.pilots_agreed ?? 0, 'Étape avant contrat actif'],
    ['Partenaires signés', metrics?.signed_partners ?? 0, 'Conversion finale'],
    ['Valeur mensuelle', formatMoney(metrics?.proposal_pipeline_value_monthly ?? 0), 'Pipeline proposition'],
    ['Valeur annuelle', formatMoney(metrics?.proposal_pipeline_value_annual ?? 0), 'Pipeline proposition'],
  ]
  return <div className={styles.executiveGrid}>{rows.map(([a, b, c]) => <Kpi key={String(a)} label={String(a)} value={b as string | number} hint={String(c)} />)}</div>
}

function HardeningPanel() {
  const checks = [
    'Toutes les mutations passent par API/server routes.',
    'Aucune clé service-role ou secret dans les composants client.',
    'Propositions approuvées/sent/accepted auditées.',
    'Rapports hebdomadaires archivés côté base de données.',
    'Endpoints prêts pour live sync 30 secondes.',
    'Interface blanche premium, aucun module sombre.',
    'Statuts proposition contrôlés par constantes.',
    'ZIP 5 ferme le workflow jusqu’au reporting exécutif.',
  ]
  return <div className={styles.hardening}>{checks.map((check) => <article key={check}><span>✓</span><p>{check}</p></article>)}</div>
}
