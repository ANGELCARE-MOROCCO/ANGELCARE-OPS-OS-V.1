'use client'

import { ArrowUpRight, Ban, CalendarClock, CircleDollarSign, Gauge, Repeat2, ShieldCheck, Zap } from 'lucide-react'
import styles from './GeminiResourcesWorkspace.module.css'

type Governance = {
  generatedAt?: string
  quota?: {
    max_requests_per_day?: number | null
    max_requests_per_week?: number | null
    max_input_tokens_per_week?: number | null
    max_output_tokens_per_week?: number | null
    max_estimated_cost_usd_per_day?: number | null
    max_estimated_cost_usd_per_week?: number | null
  } | null
  rollups?: {
    todayRequests?: number
    weekRequests?: number
    todayInputTokens?: number
    todayOutputTokens?: number
    weekInputTokens?: number
    weekOutputTokens?: number
    todayCostUsd?: number
    weekCostUsd?: number
    cacheHits?: number
    joinedRequests?: number
    blockedRequests?: number
    avoidedRequests?: number
    avoidedTokens?: number
    avoidedCostUsd?: number
    activeSchedules?: number
  }
  recentRequests?: Array<{
    id: string
    command_code?: string | null
    capability?: string
    decision?: string
    status?: string
    model_code?: string | null
    estimated_cost_usd?: number
    actual_cost_usd?: number
    created_at?: string
  }>
}

const n = (value: unknown) => new Intl.NumberFormat('fr-FR').format(Number(value || 0))
const usd = (value: unknown) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(Number(value || 0))
const dt = (value: unknown) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(String(value))) : '—'

export default function AiSovereigntyGovernancePanel({ governance }: { governance: Governance | null }) {
  const quota = governance?.quota
  const rollups = governance?.rollups || {}
  const dailyRemaining = quota?.max_requests_per_day == null ? null : Math.max(0, Number(quota.max_requests_per_day) - Number(rollups.todayRequests || 0))
  const weeklyRemaining = quota?.max_requests_per_week == null ? null : Math.max(0, Number(quota.max_requests_per_week) - Number(rollups.weekRequests || 0))

  return <section className={styles.sovereigntyPanel}>
    <header className={styles.sovereigntyHead}>
      <div><p>AI Provider Control · Sovereign Gateway</p><h2>Préflight, quotas, répétitions et coûts Revenue OS</h2><span>Le module n’appelle plus Gemini directement. Le gateway central décide d’exécuter, réutiliser, joindre, différer ou bloquer.</span></div>
      <a href="/ai-provider-control"><ShieldCheck size={16}/> Ouvrir le Control Plane <ArrowUpRight size={14}/></a>
    </header>
    <div className={styles.sovereigntyMetrics}>
      <article><Gauge size={18}/><span>Aujourd’hui</span><strong>{n(rollups.todayRequests)}</strong><small>{dailyRemaining == null ? 'Plafond non publié' : `${n(dailyRemaining)} restantes`}</small></article>
      <article><CalendarClock size={18}/><span>Cette semaine</span><strong>{n(rollups.weekRequests)}</strong><small>{weeklyRemaining == null ? 'Plafond non publié' : `${n(weeklyRemaining)} restantes`}</small></article>
      <article><Repeat2 size={18}/><span>Réutilisations</span><strong>{n(Number(rollups.cacheHits || 0) + Number(rollups.joinedRequests || 0))}</strong><small>Demandes évitées : {n(rollups.avoidedRequests)}</small></article>
      <article><CircleDollarSign size={18}/><span>Coût semaine</span><strong>{usd(rollups.weekCostUsd)}</strong><small>{usd(rollups.avoidedCostUsd)} évités</small></article>
      <article><Zap size={18}/><span>Tokens semaine</span><strong>{n(Number(rollups.weekInputTokens || 0) + Number(rollups.weekOutputTokens || 0))}</strong><small>{n(rollups.avoidedTokens)} évités</small></article>
      <article><Ban size={18}/><span>Bloqués</span><strong>{n(rollups.blockedRequests)}</strong><small>Aucun coût fournisseur</small></article>
    </div>
    <div className={styles.sovereigntyLedger}>
      {(governance?.recentRequests || []).slice(0, 6).map((request) => <article key={request.id}>
        <span data-decision={request.decision}>{request.decision || request.status}</span>
        <div><strong>{request.command_code || request.capability || 'Commande gouvernée'}</strong><small>{request.model_code || 'routage central'} · {dt(request.created_at)}</small></div>
        <strong>{usd(request.actual_cost_usd || request.estimated_cost_usd)}</strong>
      </article>)}
      {!governance?.recentRequests?.length ? <div className={styles.sovereigntyEmpty}>La migration Phase 5 n’est pas encore appliquée ou aucune demande gouvernée n’a été exécutée.</div> : null}
    </div>
  </section>
}
