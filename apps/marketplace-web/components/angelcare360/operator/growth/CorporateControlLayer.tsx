'use client'

import {
  BadgeDollarSign, BarChart3, BriefcaseBusiness, CalendarClock, CheckCircle2, ChevronRight, CircleDollarSign,
  FilePenLine, Gauge, HeartHandshake, Network, Plus, Scale, ShieldCheck, Siren, Target, TrendingUp, UsersRound,
} from 'lucide-react'
import type { GrowthWorkspaceSnapshot } from '@/types/angelcare360/operator/growth'
import type { GrowthEntityType, GrowthPortalState } from './GrowthPortal'
import styles from './CorporateControlLayer.module.css'

type Open = (entity: GrowthEntityType, mode: GrowthPortalState['mode'], record?: Record<string, unknown> | null) => void

type Props = {
  snapshot: GrowthWorkspaceSnapshot
  open: Open
  clientId?: string | null
  compact?: boolean
  emphasis?: 'strategy' | 'relationship' | 'forecast' | 'approvals' | 'change-orders' | 'outcomes' | 'health' | 'support'
}

export default function CorporateControlLayer({ snapshot, open, clientId = null, compact = false, emphasis }: Props) {
  const plans = scoped(snapshot.accountPlans, clientId)
  const coverage = scoped(snapshot.relationshipCoverage, clientId)
  const forecasts = clientId
    ? snapshot.forecasts.filter((row) => snapshot.opportunities.some((opportunity) => opportunity.id === row.opportunity_id && opportunity.client_id === clientId))
    : snapshot.forecasts
  const approvals = scoped(snapshot.approvals, clientId)
  const changeOrders = scoped(snapshot.changeOrders, clientId)
  const successPlans = scoped(snapshot.successPlans, clientId)
  const entitlements = scoped(snapshot.supportEntitlements, clientId)
  const escalations = scoped(snapshot.escalations, clientId)
  const defaultHealth = snapshot.healthModels.find((row) => row.is_default) || snapshot.healthModels[0]
  const clientHealth = clientId ? computeClientHealth(snapshot, clientId, defaultHealth?.dimensions || []) : null
  const selected = emphasis || 'strategy'
  const clientSeed = clientId ? { client_id: clientId } : {}

  const controls = [
    {
      key: 'strategy', icon: <Target size={18}/>, label: 'Account Strategy', title: 'Plan de compte stratégique',
      metric: `${plans.length} plan(s)`, tone: plans.length ? 'good' : 'warning',
      summary: plans[0]?.title || 'Aucun plan de compte gouverné',
      action: () => open('account_plan', plans[0] ? 'edit' : 'create', plans[0] as unknown as Record<string, unknown> || { ...clientSeed, status: 'active', horizon_months: 36 }), actionLabel: plans[0] ? 'Piloter' : 'Créer plan',
    },
    {
      key: 'relationship', icon: <Network size={18}/>, label: 'Relationship Coverage', title: 'Couverture décisionnelle',
      metric: coverage.length ? `${coverageScore(coverage[0])}/100` : 'Non évaluée', tone: coverage.length ? coverageTone(coverageScore(coverage[0])) : 'warning',
      summary: coverage[0]?.missing_roles?.length ? `${coverage[0].missing_roles.length} rôle(s) critique(s) manquant(s)` : 'Sponsor, buyer, autorité et champion',
      action: () => open('relationship_coverage', coverage[0] ? 'edit' : 'create', coverage[0] as unknown as Record<string, unknown> || { ...clientSeed, status: 'active', assessed_at: new Date().toISOString() }), actionLabel: coverage[0] ? 'Actualiser' : 'Évaluer',
    },
    {
      key: 'forecast', icon: <BarChart3 size={18}/>, label: 'Forecast Governance', title: 'Prévision management',
      metric: money(forecasts.reduce((sum, row) => sum + number(row.manager_amount_mad || row.seller_amount_mad), 0)), tone: 'neutral',
      summary: `${forecasts.filter((row) => row.forecast_category === 'commit').length} engagement(s) Commit`,
      action: () => open('forecast', 'create', { forecast_category: 'pipeline', period_key: currentPeriod(), snapshot_at: new Date().toISOString() }), actionLabel: 'Snapshot',
    },
    {
      key: 'approvals', icon: <Scale size={18}/>, label: 'Authority Matrix', title: 'Approbations commerciales',
      metric: `${approvals.filter((row) => ['requested', 'pending'].includes(row.status)).length} en attente`, tone: approvals.some((row) => row.status === 'pending') ? 'warning' : 'good',
      summary: 'Discount, marge, paiement, support et dérogations',
      action: () => open('approval', 'create', { ...clientSeed, status: 'requested', approval_type: 'commercial_exception' }), actionLabel: 'Demander',
    },
    {
      key: 'change-orders', icon: <FilePenLine size={18}/>, label: 'Change Orders', title: 'Amendements & changements',
      metric: `${changeOrders.filter((row) => !['completed', 'cancelled'].includes(row.status)).length} actif(s)`, tone: 'neutral',
      summary: 'Upgrade, downgrade, capacité, prix et co-term',
      action: () => open('change_order', 'create', { ...clientSeed, status: 'draft', change_type: 'package_change' }), actionLabel: 'Composer',
    },
    {
      key: 'outcomes', icon: <HeartHandshake size={18}/>, label: 'Customer Outcomes', title: 'Success plans & résultats',
      metric: `${successPlans.filter((row) => row.status === 'active').length} actif(s)`, tone: successPlans.length ? 'good' : 'warning',
      summary: successPlans[0]?.objective || 'Objectifs, baseline, cible et preuve',
      action: () => open('success_plan', successPlans[0] ? 'edit' : 'create', successPlans[0] as unknown as Record<string, unknown> || { ...clientSeed, status: 'active', title: 'Plan de réussite client' }), actionLabel: successPlans[0] ? 'Piloter' : 'Créer plan',
    },
    {
      key: 'health', icon: <Gauge size={18}/>, label: 'Health Score Studio', title: 'Score de santé explicable',
      metric: clientHealth ? `${clientHealth.score}/100` : defaultHealth ? 'Modèle actif' : 'À configurer', tone: clientHealth ? clientHealth.tone : defaultHealth ? 'good' : 'warning',
      summary: clientHealth?.reason || defaultHealth?.name || 'Relation, adoption, finance, service et renouvellement',
      action: () => open('health_model', defaultHealth ? 'edit' : 'create', defaultHealth as unknown as Record<string, unknown> || { status: 'active', is_default: true }), actionLabel: defaultHealth ? 'Configurer' : 'Créer modèle',
    },
    {
      key: 'support', icon: <ShieldCheck size={18}/>, label: 'Contractual Service', title: 'Entitlements & escalades',
      metric: `${entitlements.filter((row) => row.status === 'active').length} entitlement(s)`, tone: escalations.some((row) => !['resolved', 'closed'].includes(row.status)) ? 'critical' : 'good',
      summary: `${escalations.filter((row) => !['resolved', 'closed'].includes(row.status)).length} escalade(s) de compte ouverte(s)`,
      action: () => open('support_entitlement', entitlements[0] ? 'edit' : 'create', entitlements[0] as unknown as Record<string, unknown> || { ...clientSeed, status: 'active', support_tier: 'standard' }), actionLabel: entitlements[0] ? 'Gouverner' : 'Configurer',
    },
  ] as const

  const visible = compact ? controls.filter((control) => control.key === selected || ['strategy', 'approvals', 'support'].includes(control.key)) : controls

  return <section className={styles.layer} data-compact={compact}>
    <header className={styles.header}>
      <div><span>Corporate Control Layer</span><h3>Stratégie, autorité, résultat et service contractuel</h3><p>Huit contrôles de direction intégrés au Revenue Relationship Graph, sans nouveau menu global.</p></div>
      <div className={styles.headerSignals}><span><ShieldCheck size={14}/>Audité</span><span><Network size={14}/>Client-linked</span><span><CircleDollarSign size={14}/>Impact Dh</span></div>
    </header>
    <div className={styles.grid}>
      {visible.map((control) => <article key={control.key} className={styles.control} data-tone={control.tone} data-emphasis={control.key === selected}>
        <div className={styles.controlTop}><span>{control.icon}</span><b>{control.label}</b><i/></div>
        <h4>{control.title}</h4><strong>{control.metric}</strong><p>{control.summary}</p>
        <button type="button" onClick={control.action}>{control.actionLabel}<ChevronRight size={14}/></button>
      </article>)}
    </div>
    <div className={styles.controlMatrix}>
      <MatrixLane title="Approval queue" icon={<Scale size={15}/>} value={String(approvals.filter((row) => ['requested','pending'].includes(row.status)).length)} detail={approvals.find((row) => ['requested','pending'].includes(row.status))?.approval_type || 'Aucune exception en attente'} tone={approvals.some((row) => ['requested','pending'].includes(row.status)) ? 'warning' : 'good'}/>
      <MatrixLane title="Forecast commit" icon={<TrendingUp size={15}/>} value={money(forecasts.filter((row) => row.forecast_category === 'commit').reduce((sum, row) => sum + number(row.manager_amount_mad || row.seller_amount_mad), 0))} detail={`${forecasts.filter((row) => row.forecast_category === 'commit').length} snapshot(s) gouverné(s)`} tone="neutral"/>
      <MatrixLane title="Customer outcomes" icon={<HeartHandshake size={15}/>} value={String(successPlans.filter((row) => row.outcome_status === 'achieved').length)} detail={`${successPlans.filter((row) => row.status === 'at_risk').length} plan(s) à risque`} tone={successPlans.some((row) => row.status === 'at_risk') ? 'warning' : 'good'}/>
      <MatrixLane title="Account escalation" icon={<Siren size={15}/>} value={String(escalations.filter((row) => !['resolved','closed'].includes(row.status)).length)} detail={escalations.find((row) => !['resolved','closed'].includes(row.status))?.title || 'Aucune escalade ouverte'} tone={escalations.some((row) => row.severity === 'critical' && !['resolved','closed'].includes(row.status)) ? 'critical' : 'good'}/>
    </div>
    {!compact ? <div className={styles.commandStrip}>
      <div><span>Management agenda</span><strong>{approvalPressure(approvals, escalations, changeOrders)}</strong><small>Décisions, risques et changements ayant une conséquence client ou financière.</small></div>
      <button type="button" onClick={() => open('approval', 'create', { ...clientSeed, status: 'requested', approval_type: 'executive_exception' })}><Scale size={15}/>Ouvrir une décision</button>
      <button type="button" onClick={() => open('escalation', 'create', { ...clientSeed, status: 'open', severity: 'high', escalation_type: 'account' })}><Siren size={15}/>Escalade compte</button>
      <button type="button" onClick={() => open('change_order', 'create', { ...clientSeed, status: 'draft', change_type: 'commercial_change' })}><Plus size={15}/>Change order</button>
    </div> : null}
  </section>
}

function computeClientHealth(snapshot: GrowthWorkspaceSnapshot, clientId: string, dimensions: Array<Record<string, unknown>>) {
  const contacts = snapshot.contacts.filter((row) => row.client_id === clientId)
  const subscriptions = snapshot.subscriptions.filter((row) => String(row.client_id) === clientId)
  const invoices = snapshot.invoices.filter((row) => String(row.client_id) === clientId)
  const cases = snapshot.cases.filter((row) => row.client_id === clientId && !['resolved','closed','archived'].includes(row.status))
  const renewals = snapshot.renewals.filter((row) => String(row.client_id) === clientId)
  const active = subscriptions.filter((row) => String(row.status) === 'active').length
  const overdue = invoices.reduce((sum, row) => sum + number(row.balance_due_mad), 0)
  const critical = cases.filter((row) => row.severity === 'critical').length
  const weights = dimensions.length ? dimensions : [
    { key: 'relationship', weight: 15 }, { key: 'product_adoption', weight: 20 }, { key: 'service_quality', weight: 15 },
    { key: 'support_pressure', weight: 10 }, { key: 'financial_reliability', weight: 20 }, { key: 'renewal_readiness', weight: 20 },
  ]
  const factors: Record<string, number> = {
    relationship: contacts.length >= 3 ? 90 : contacts.length ? 65 : 20,
    product_adoption: active ? 82 : 30,
    service_quality: critical ? 25 : cases.length ? 58 : 88,
    support_pressure: Math.max(10, 100 - cases.length * 12 - critical * 25),
    complaint_severity: critical ? 20 : 82,
    financial_reliability: overdue > 0 ? Math.max(15, 75 - Math.min(50, overdue / 1000)) : 92,
    renewal_readiness: renewals.length ? 78 : 52,
    strategic_value: active ? 80 : 45,
  }
  let total = 0
  let weightTotal = 0
  for (const row of weights) {
    const key = String(row.key || '')
    const weight = number(row.weight || 0)
    total += (factors[key] ?? 60) * weight
    weightTotal += weight
  }
  const score = Math.max(0, Math.min(100, Math.round(total / Math.max(1, weightTotal))))
  const tone = score >= 75 ? 'good' : score >= 50 ? 'warning' : 'critical'
  const reason = critical ? `${critical} cas critique(s) réduisent la santé` : overdue ? `${money(overdue)} d'exposition financière` : contacts.length < 2 ? 'Couverture relationnelle insuffisante' : 'Santé consolidée sur relation, produit, finance et service'
  return { score, tone, reason }
}

function MatrixLane({ title, icon, value, detail, tone }: { title: string; icon: React.ReactNode; value: string; detail: string; tone: string }) { return <div className={styles.matrixLane} data-tone={tone}><span>{icon}{title}</span><strong>{value}</strong><small>{detail}</small></div> }

function scoped<T extends { client_id?: string | null }>(rows: T[], clientId: string | null) { return clientId ? rows.filter((row) => row.client_id === clientId) : rows }
function number(value: unknown) { const parsed = Number(value || 0); return Number.isFinite(parsed) ? parsed : 0 }
function money(value: number) { return `${Math.round(value).toLocaleString('fr-FR')} Dh` }
function currentPeriod() { const date = new Date(); return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}` }
function coverageScore(row: { executive_sponsor_score: number | string; economic_buyer_score: number | string; contract_authority_score: number | string; operational_champion_score: number | string; relationship_recency_score: number | string }) { return Math.round(([row.executive_sponsor_score,row.economic_buyer_score,row.contract_authority_score,row.operational_champion_score,row.relationship_recency_score].reduce<number>((sum, value) => sum + number(value), 0)) / 5) }
function coverageTone(score: number) { return score >= 75 ? 'good' : score >= 50 ? 'warning' : 'critical' }
function approvalPressure(approvals: Array<{ status: string }>, escalations: Array<{ status: string }>, changeOrders: Array<{ status: string }>) { const total = approvals.filter((row) => ['requested','pending'].includes(row.status)).length + escalations.filter((row) => !['resolved','closed'].includes(row.status)).length + changeOrders.filter((row) => ['draft','review','pending_approval'].includes(row.status)).length; return total ? `${total} décision(s) requise(s)` : 'Aucune décision bloquante' }
