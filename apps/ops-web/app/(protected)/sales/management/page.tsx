'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, EmptyState, formatDate, formatDh, HeroStat, MetricTile,
  Notice, Panel, Pill, SalesHero, SourceBadge, styles, toneForStatus,
} from '../_components/Sales360UI'

type Order = { id: string; order_ref: string; client_name: string; service_type?: string; city?: string; status?: string; payment_status?: string; fulfillment_status?: string; total_amount?: number; created_at?: string; service_date?: string; next_action?: string; discount_amount?: number }
type ActionRow = { id: string; order_id?: string; title?: string; priority?: string; status?: string; due_at?: string; action_type?: string }
type Rule = { id?: string; name?: string; label?: string; rule_name?: string; is_active?: boolean; active?: boolean; sort_order?: number; description?: string; action_type?: string }
type Insights = { pipeline_value?: number; conversion_rate?: number; avg_deal_size?: number; risk_orders?: number; action_queue?: number; document_count?: number; agent_actions?: number }

export default function SalesManagementPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [actions, setActions] = useState<ActionRow[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [insights, setInsights] = useState<Insights | null>(null)
  const [message, setMessage] = useState('Chargement du cockpit de management…')
  const [sourceWarning, setSourceWarning] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const results = await Promise.allSettled([
      fetch('/api/sales-terminal/orders', { cache: 'no-store' }).then(response => response.json()),
      fetch('/api/sales-terminal/actions', { cache: 'no-store' }).then(response => response.json()),
      fetch('/api/sales-terminal/autopilot', { cache: 'no-store' }).then(response => response.json()),
      fetch('/api/sales-terminal/insights', { cache: 'no-store' }).then(response => response.json()),
    ])
    const [ordersResult, actionsResult, rulesResult, insightsResult] = results
    if (ordersResult.status === 'fulfilled' && ordersResult.value.ok) setOrders(ordersResult.value.data || [])
    if (actionsResult.status === 'fulfilled' && actionsResult.value.ok) setActions(actionsResult.value.data || [])
    if (rulesResult.status === 'fulfilled' && rulesResult.value.ok) setRules(rulesResult.value.data || [])
    if (insightsResult.status === 'fulfilled' && insightsResult.value.ok) setInsights(insightsResult.value.data || null)
    const missing = results.filter(result => result.status !== 'fulfilled' || !result.value?.ok).length
    setSourceWarning(missing > 0)
    setMessage(missing ? `${missing} source(s) secondaire(s) indisponible(s). Le portefeuille Sales Terminal reste prioritaire.` : 'Cockpit commercial chargé. Les sources Sales Terminal et Sales Execution OS sont affichées séparément.')
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const stats = useMemo(() => {
    const active = orders.filter(order => order.status !== 'cancelled')
    const draft = orders.filter(order => !order.status || order.status === 'draft')
    const quoted = orders.filter(order => order.status === 'quoted')
    const confirmed = orders.filter(order => ['confirmed', 'paid', 'assigned', 'delivered'].includes(String(order.status)))
    const unpaid = orders.filter(order => order.status === 'confirmed' && order.payment_status !== 'paid')
    const paid = orders.filter(order => order.payment_status === 'paid')
    const handoffGap = paid.filter(order => order.fulfillment_status !== 'handoff_ready')
    const cancelled = orders.filter(order => order.status === 'cancelled')
    return {
      active, draft, quoted, confirmed, unpaid, paid, handoffGap, cancelled,
      pipeline: active.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      confirmedValue: confirmed.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      exposure: unpaid.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      paidValue: paid.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    }
  }, [orders])

  const attention = useMemo(() => orders.map(order => {
    const issues: string[] = []
    if (!order.status || order.status === 'draft') issues.push('Brouillon à finaliser')
    if (order.status === 'quoted') issues.push('Devis à relancer')
    if (order.status === 'confirmed' && order.payment_status !== 'paid') issues.push('Règlement à sécuriser')
    if (order.payment_status === 'paid' && order.fulfillment_status !== 'handoff_ready') issues.push('Handoff à préparer')
    if (!order.service_type) issues.push('Service manquant')
    if (!order.service_date) issues.push('Date de service manquante')
    if (Number(order.discount_amount || 0) > Number(order.total_amount || 0)) issues.push('Remise à contrôler')
    return { order, issues }
  }).filter(item => item.issues.length).sort((a, b) => Number(b.order.total_amount || 0) - Number(a.order.total_amount || 0)), [orders])

  const openActions = actions.filter(action => action.status === 'open')
  const activeRules = rules.filter(rule => rule.is_active !== false && rule.active !== false)

  return <AppShell title="Sales 360 Management" subtitle="Executive Sales Management Cockpit" breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Management' }]} actions={<><PageAction href="/sales">Command Center</PageAction><PageAction href="/sales/orders" variant="light">Commandes</PageAction><PageAction href="/sales/configuration" variant="light">Configuration</PageAction></>}>
    <div className={styles.page}>
      <SalesHero eyebrow="Executive Sales Management" title="Piloter la valeur commerciale, les décisions requises et les risques de conversion." text="Le cockpit distingue le pipeline opérationnel sales_terminal_* des insights et files d’action sales_* afin de ne jamais présenter deux sources comme un seul registre canonique." actions={<><ActionLink href="/sales/orders" tone="light">Portefeuille commandes</ActionLink><ActionLink href="/sales/clients" tone="blue">Portefeuille clients</ActionLink><ActionButton tone="navy" icon="refresh" onClick={() => void load()} disabled={loading}>Actualiser</ActionButton></>} aside={<><HeroStat label="Pipeline Sales Terminal" value={formatDh(stats.pipeline)} detail={`${stats.active.length} commandes actives`} /><HeroStat label="Revenue confirmé" value={formatDh(stats.confirmedValue)} detail={`${stats.confirmed.length} commandes`} tone="green" /><HeroStat label="Exposition non réglée" value={formatDh(stats.exposure)} detail={`${stats.unpaid.length} commandes`} tone={stats.unpaid.length ? 'red' : 'green'} /><HeroStat label="Décisions requises" value={attention.length} detail={`${openActions.length} actions ouvertes séparées`} tone={attention.length ? 'amber' : 'green'} /></>} />
      <CommercialNav active="management" />
      {sourceWarning ? <Notice tone="amber" title="Sources partielles" text="Une ou plusieurs sources Sales Execution OS n’ont pas répondu. Le cockpit n’invente pas de zéro et conserve la distinction avec le portefeuille Sales Terminal." /> : null}
      <div className={styles.metricsGrid}><MetricTile label="Pipeline" value={formatDh(stats.pipeline)} detail="Sales Terminal" icon="chart" tone="navy" /><MetricTile label="Devis à relancer" value={stats.quoted.length} detail="Statut quoted" icon="document" tone="amber" /><MetricTile label="À encaisser" value={formatDh(stats.exposure)} detail="Confirmées non réglées" icon="money" tone={stats.unpaid.length ? 'red' : 'green'} /><MetricTile label="Handoffs en attente" value={stats.handoffGap.length} detail="Payées, pas prêtes" icon="handoff" tone="blue" /></div>

      <div className={styles.grid2}>
        <Panel title="Décisions et interventions requises" subtitle={message} action={<SourceBadge tone="green">Sales Terminal</SourceBadge>}>
          <div className={styles.recordList}>{attention.length === 0 ? <EmptyState title="Aucune intervention prioritaire" text="Aucune incohérence ou étape en attente n’est actuellement détectée dans les commandes visibles." /> : attention.slice(0, 30).map(item => <article key={item.order.id} className={styles.recordCard}><div className={styles.recordMain}><div className={styles.recordTitle}><strong>{item.order.order_ref} · {item.order.client_name}</strong><Pill tone={toneForStatus(item.order.status)}>{item.order.status || 'draft'}</Pill></div><div className={styles.recordMeta}><span>{item.order.service_type || 'Service manquant'}</span><span>{item.order.city || 'Ville non renseignée'}</span><span>{formatDh(item.order.total_amount)}</span></div><div className={styles.recordTags}>{item.issues.map(issue => <Pill key={issue} tone={issue.includes('Règlement') || issue.includes('Remise') ? 'red' : 'amber'}>{issue}</Pill>)}</div></div><ActionLink href={`/sales/orders/${item.order.id}`} tone="navy">Décider</ActionLink></article>)}</div>
        </Panel>

        <div className={styles.stack}>
          <Panel title="Brief direction" subtitle="Lecture déterministe du portefeuille."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Brouillons</small><strong>{stats.draft.length}</strong></div><div className={styles.summaryCell}><small>Devis ouverts</small><strong>{stats.quoted.length}</strong></div><div className={styles.summaryCell}><small>Payées</small><strong>{formatDh(stats.paidValue)}</strong></div><div className={styles.summaryCell}><small>Annulées</small><strong>{stats.cancelled.length}</strong></div><div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Priorité recommandée</small><strong>{stats.unpaid.length ? 'Sécuriser les règlements des commandes confirmées.' : stats.quoted.length ? 'Relancer les devis sans réponse visible.' : stats.handoffGap.length ? 'Préparer les transmissions opérationnelles.' : 'Maintenir la qualité du portefeuille.'}</strong></div></div></Panel>
          <Notice tone="blue" title="Règle de vérité" text="Les contrôles ci-dessus sont des observations de présentation. Aucun statut, paiement, document ou handoff n’est modifié automatiquement." />
          <Notice tone="slate" title="Source distincte" text="Les insights et autopilot peuvent lire sales_orders tandis que les écrans actifs lisent sales_terminal_orders. Toute comparaison reste indicative jusqu’à consolidation backend." />
        </div>
      </div>

      <div className={styles.grid3} style={{ marginTop: 18 }}>
        <Panel title="Sales Execution OS" subtitle="Intelligence distincte, présentée sans fusion."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Pipeline endpoint</small><strong>{insights ? formatDh(insights.pipeline_value) : 'Indisponible'}</strong></div><div className={styles.summaryCell}><small>Conversion</small><strong>{insights ? `${Number(insights.conversion_rate || 0).toFixed(1)} %` : 'Indisponible'}</strong></div><div className={styles.summaryCell}><small>Deal moyen</small><strong>{insights ? formatDh(insights.avg_deal_size) : 'Indisponible'}</strong></div><div className={styles.summaryCell}><small>Risque</small><strong>{insights?.risk_orders ?? '—'}</strong></div></div></Panel>
        <Panel title="File d’actions" subtitle="sales_action_queue — source complémentaire."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Ouvertes</small><strong>{openActions.length}</strong></div><div className={styles.summaryCell}><small>Urgentes</small><strong>{openActions.filter(action => action.priority === 'urgent').length}</strong></div></div><div className={styles.recordList} style={{ marginTop: 12 }}>{openActions.slice(0, 4).map(action => <article key={action.id} className={styles.recordCard}><div><strong>{action.title || action.action_type || 'Action'}</strong><div className={styles.recordMeta}><span>{action.priority || 'medium'}</span><span>{formatDate(action.due_at, true)}</span></div></div></article>)}</div></Panel>
        <Panel title="Règles autopilot" subtitle="Configuration existante, aucune exécution externe."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Règles visibles</small><strong>{rules.length}</strong></div><div className={styles.summaryCell}><small>Actives</small><strong>{activeRules.length}</strong></div></div><div className={styles.recordList} style={{ marginTop: 12 }}>{activeRules.slice(0, 4).map((rule, index) => <article key={rule.id || index} className={styles.recordCard}><div><strong>{rule.label || rule.name || rule.rule_name || `Règle ${index + 1}`}</strong><p className={styles.muted}>{rule.description || rule.action_type || 'Règle interne configurée'}</p></div></article>)}</div></Panel>
      </div>
    </div>
  </AppShell>
}
