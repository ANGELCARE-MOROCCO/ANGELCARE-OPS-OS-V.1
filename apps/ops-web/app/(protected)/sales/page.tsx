'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, ContinuityRibbon, EmptyState, formatDate, formatDh,
  HeroStat, Icon, Notice, Panel, Pill, SalesHero, SourceBadge, statusLabel, styles, toneForStatus,
} from './_components/Sales360UI'
import {
  Metric,
  MetricStrip,
  SectionHeading,
  TruthNotice,
} from '@/components/commercial-core/CommercialCoreShell'

type Client = { id: string; client_name: string; client_type?: string; phone?: string; email?: string; city?: string; status?: string; created_at?: string }
type Order = { id: string; order_ref: string; client_id?: string; client_name: string; customer_type?: string; service_category?: string; service_type?: string; city?: string; total_amount?: number; status?: string; payment_status?: string; fulfillment_status?: string; next_action?: string; created_at?: string; service_date?: string }
type Option = { id: string; area: string; label: string; value: string; is_active?: boolean }
type ActionRow = { id: string; order_id?: string; title?: string; priority?: string; status?: string; due_at?: string; action_type?: string }
type Communication = { id: string; order_id?: string; channel?: string; direction?: string; outcome?: string; created_at?: string }
type Insights = { revenue_today?: number; pipeline_value?: number; conversion_rate?: number; avg_deal_size?: number; risk_orders?: number; action_queue?: number; document_count?: number; agent_actions?: number }

type Focus = 'all' | 'draft' | 'quoted' | 'confirmed' | 'unpaid' | 'paid' | 'handoff'

async function readJson(response: Response) {
  try { return await response.json() } catch { return { ok: false, message: `HTTP ${response.status}` } }
}

export default function Sales360CommandPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [actions, setActions] = useState<ActionRow[]>([])
  const [communications, setCommunications] = useState<Communication[]>([])
  const [insights, setInsights] = useState<Insights | null>(null)
  const [message, setMessage] = useState('Connexion au Sales Terminal…')
  const [partialSources, setPartialSources] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<Focus>('all')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setMessage('Actualisation du périmètre commercial…')
    const sources = [
      ['clients', '/api/sales-terminal/clients'],
      ['orders', '/api/sales-terminal/orders'],
      ['options', '/api/sales-terminal/options'],
      ['actions', '/api/sales-terminal/actions'],
      ['communications', '/api/sales-terminal/communications'],
      ['insights', '/api/sales-terminal/insights'],
    ] as const
    const results = await Promise.allSettled(sources.map(([, url]) => fetch(url, { cache: 'no-store' }).then(readJson)))
    const missing: string[] = []
    let loadedClients: Client[] = []
    let loadedOrders: Order[] = []
    results.forEach((result, index) => {
      const key = sources[index][0]
      if (result.status !== 'fulfilled' || !result.value?.ok) {
        missing.push(key)
        return
      }
      const value = result.value
      if (key === 'clients') {
        loadedClients = value.data || []
        setClients(loadedClients)
      }
      if (key === 'orders') {
        loadedOrders = value.data || []
        setOrders(loadedOrders)
      }
      if (key === 'options') setOptions(value.data || [])
      if (key === 'actions') setActions(value.data || [])
      if (key === 'communications') setCommunications(value.data || [])
      if (key === 'insights') setInsights(value.data || null)
    })
    setPartialSources(missing)
    setMessage(missing.includes('orders') || missing.includes('clients')
      ? 'Le périmètre principal est partiellement indisponible. Les chiffres visibles peuvent être incomplets.'
      : `${loadedOrders.length} commandes et ${loadedClients.length} clients synchronisés avec le Sales Terminal.`)
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const stats = useMemo(() => {
    const draft = orders.filter(order => !order.status || order.status === 'draft')
    const quoted = orders.filter(order => order.status === 'quoted')
    const confirmed = orders.filter(order => ['confirmed', 'paid', 'assigned', 'delivered'].includes(String(order.status)))
    const paid = orders.filter(order => order.payment_status === 'paid')
    const unpaidConfirmed = orders.filter(order => order.status === 'confirmed' && order.payment_status !== 'paid')
    const handoffReady = orders.filter(order => order.fulfillment_status === 'handoff_ready')
    const pipeline = orders.filter(order => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const confirmedValue = confirmed.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const paidValue = paid.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const exposure = unpaidConfirmed.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    return { draft, quoted, confirmed, paid, unpaidConfirmed, handoffReady, pipeline, confirmedValue, paidValue, exposure }
  }, [orders])

  const actionQueue = useMemo(() => {
    const rows: Array<{ id: string; order: Order; title: string; reason: string; tone: 'blue' | 'amber' | 'red' | 'green' }> = []
    stats.draft.forEach(order => rows.push({ id: `draft-${order.id}`, order, title: 'Préparer le devis', reason: 'Commande encore au stade brouillon', tone: 'blue' }))
    stats.quoted.forEach(order => rows.push({ id: `quote-${order.id}`, order, title: 'Relancer le client', reason: 'Devis émis sans confirmation visible', tone: 'amber' }))
    stats.unpaidConfirmed.forEach(order => rows.push({ id: `pay-${order.id}`, order, title: 'Sécuriser le règlement', reason: 'Commande confirmée et non réglée', tone: 'red' }))
    stats.paid.filter(order => order.fulfillment_status !== 'handoff_ready').forEach(order => rows.push({ id: `handoff-${order.id}`, order, title: 'Préparer le handoff', reason: 'Paiement déclaré, transmission non prête', tone: 'green' }))
    return rows.sort((a, b) => Number(b.order.total_amount || 0) - Number(a.order.total_amount || 0)).slice(0, 10)
  }, [stats])

  const visibleOrders = useMemo(() => orders.filter(order => {
    const search = `${order.order_ref} ${order.client_name} ${order.service_type || ''} ${order.city || ''} ${order.status || ''} ${order.payment_status || ''} ${order.fulfillment_status || ''}`.toLowerCase()
    const matchesQuery = search.includes(query.toLowerCase())
    const matchesFocus = focus === 'all'
      || (focus === 'draft' && (!order.status || order.status === 'draft'))
      || (focus === 'quoted' && order.status === 'quoted')
      || (focus === 'confirmed' && order.status === 'confirmed')
      || (focus === 'unpaid' && order.status === 'confirmed' && order.payment_status !== 'paid')
      || (focus === 'paid' && order.payment_status === 'paid')
      || (focus === 'handoff' && order.fulfillment_status === 'handoff_ready')
    return matchesQuery && matchesFocus
  }).slice(0, 14), [orders, query, focus])

  const configActive = options.filter(option => option.is_active !== false).length
  const lastActivity = [...orders].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0]?.created_at

  return <AppShell
    title="Sales"
    subtitle="Conversion client, commandes et exécution commerciale"
    breadcrumbs={[{ label: 'Commercial Core' }, { label: 'Sales' }]}
    actions={<><PageAction href="/sales/clients">Nouveau client</PageAction><PageAction href="/sales/orders/new" variant="light">Nouvelle commande</PageAction></>}
  >
    <div className={styles.page}>
      <SalesHero
        eyebrow="SANILA Sales Command · Daily Revenue Execution"
        title="Ce qui doit avancer aujourd’hui pour transformer le pipeline en revenu exécutable."
        text="Le Sales Terminal est recentré sur les décisions quotidiennes : devis à produire, clients à relancer, règlements à vérifier et commandes à transmettre aux opérations."
        actions={<><ActionLink href="/sales/clients" tone="light" icon="client">Créer ou qualifier un client</ActionLink><ActionLink href="/sales/orders/new" tone="blue" icon="plus">Composer une commande</ActionLink><ActionButton tone="navy" icon="refresh" onClick={() => void load()} disabled={loading}>Actualiser</ActionButton></>}
        aside={<>
          <HeroStat label="Pipeline ouvert" value={formatDh(stats.pipeline)} detail={`${orders.length} commandes visibles`} tone="blue" />
          <HeroStat label="À sécuriser" value={formatDh(stats.exposure)} detail={`${stats.unpaidConfirmed.length} commandes confirmées non réglées`} tone={stats.unpaidConfirmed.length ? 'red' : 'green'} />
          <HeroStat label="Actions du jour" value={actionQueue.length} detail="Devis, relances, paiement et handoff" tone={actionQueue.length ? 'amber' : 'green'} />
          <HeroStat label="Dernier mouvement" value={formatDate(lastActivity, true)} detail={partialSources.length ? 'Sources partielles détectées' : 'Sales Terminal chargé'} tone={partialSources.length ? 'amber' : 'slate'} />
        </>}
      />

      <CommercialNav active="command" />

      {partialSources.length ? <Notice tone="amber" icon="alert" title="Périmètre partiellement chargé" text={`Sources indisponibles : ${partialSources.join(', ')}. Les chiffres visibles peuvent être incomplets.`} /> : null}

      <MetricStrip>
        <Metric label="Clients" value={clients.length} context="Dossiers Sales Terminal" tone="good" />
        <Metric label="Brouillons" value={stats.draft.length} context="Devis à préparer" tone={stats.draft.length ? 'attention' : 'good'} />
        <Metric label="Devis émis" value={stats.quoted.length} context="Relances potentielles" tone={stats.quoted.length ? 'attention' : 'neutral'} />
        <Metric label="Confirmées" value={stats.confirmed.length} context={formatDh(stats.confirmedValue)} tone="good" />
        <Metric label="Réglées" value={stats.paid.length} context={formatDh(stats.paidValue)} tone="good" />
        <Metric label="Handoffs à préparer" value={stats.paid.filter(order => order.fulfillment_status !== 'handoff_ready').length} context="Paiement déclaré, transmission non prête" tone={stats.paid.some(order => order.fulfillment_status !== 'handoff_ready') ? 'attention' : 'good'} />
      </MetricStrip>

      <ContinuityRibbon items={[
        { label: 'Brouillons', value: `${stats.draft.length} · ${formatDh(stats.draft.reduce((sum, order) => sum + Number(order.total_amount || 0), 0))}`, tone: 'blue' },
        { label: 'Devis', value: `${stats.quoted.length} · ${formatDh(stats.quoted.reduce((sum, order) => sum + Number(order.total_amount || 0), 0))}`, tone: 'amber' },
        { label: 'Confirmées', value: `${stats.confirmed.length} · ${formatDh(stats.confirmedValue)}`, tone: 'green' },
        { label: 'Réglées', value: `${stats.paid.length} · ${formatDh(stats.paidValue)}`, tone: 'green' },
        { label: 'Handoff prêt', value: `${stats.handoffReady.length}`, tone: 'blue' },
        { label: 'Billing', value: 'Document ≠ facture Billing', tone: 'amber', href: '/billing' },
      ]} />

      <div className={styles.grid2}>
        <Panel title="File d’exécution commerciale" subtitle="Les actions sont déduites des statuts existants du Sales Terminal, sans automatisation externe." action={<SourceBadge tone="green">Source Sales Terminal</SourceBadge>}>
          <div className={styles.recordList}>
            {actionQueue.length === 0 ? <EmptyState title="Aucune intervention prioritaire" text="Aucune commande visible ne nécessite actuellement de devis, relance, vérification de règlement ou handoff." /> : actionQueue.map(item => <article key={item.id} className={styles.recordCard}>
              <div className={styles.recordMain}>
                <div className={styles.recordTitle}><strong>{item.title}</strong><Pill tone={item.tone}>{item.order.order_ref}</Pill></div>
                <div className={styles.recordMeta}><span>{item.order.client_name}</span><span>{item.order.service_type || 'Service non renseigné'}</span><span>{formatDh(item.order.total_amount)}</span></div>
                <p className={styles.muted}>{item.reason}</p>
              </div>
              <div className={styles.recordActions}><ActionLink href={`/sales/orders/${item.order.id}`} tone="navy">Traiter</ActionLink></div>
            </article>)}
          </div>
        </Panel>

        <div className={styles.stack}>
          <Panel title="Brief direction commerciale" subtitle="Une seule recommandation dominante, basée sur le portefeuille chargé.">
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCell}><small>Pipeline</small><strong>{formatDh(stats.pipeline)}</strong></div>
              <div className={styles.summaryCell}><small>Exposition non réglée</small><strong>{formatDh(stats.exposure)}</strong></div>
              <div className={styles.summaryCell}><small>Devis à relancer</small><strong>{stats.quoted.length}</strong></div>
              <div className={styles.summaryCell}><small>Handoffs à préparer</small><strong>{stats.paid.filter(order => order.fulfillment_status !== 'handoff_ready').length}</strong></div>
              <div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Priorité recommandée</small><strong>{stats.unpaidConfirmed.length ? 'Sécuriser les commandes confirmées non réglées.' : stats.quoted.length ? 'Relancer les devis en attente de réponse.' : stats.draft.length ? 'Finaliser les commandes brouillon.' : 'Maintenir le suivi du portefeuille.'}</strong></div>
            </div>
          </Panel>
          <TruthNotice title="Vérité financière" tone="attention">Une commande marquée réglée représente un statut Sales Terminal. Elle ne constitue pas une preuve bancaire ni une facture Billing 360.</TruthNotice>
          <TruthNotice title="Vérité opérationnelle">Le statut Handoff prêt indique une transmission possible. Il ne prouve ni création de contrat, ni mission, ni dispatch.</TruthNotice>
        </div>
      </div>

      <Panel
        title="Portefeuille commercial"
        subtitle={message}
        action={<div className={styles.inlineActions}><ActionLink href="/sales/orders" tone="light">Toutes les commandes</ActionLink><ActionLink href="/sales/orders/new" tone="navy" icon="plus">Créer</ActionLink></div>}
      >
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}><Icon name="search"/><input className={styles.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Référence, client, service, ville ou statut…" /></div>
          <select className={styles.select} value={focus} onChange={event => setFocus(event.target.value as Focus)} style={{ maxWidth: 210 }}>
            <option value="all">Vue consolidée</option><option value="draft">Brouillons</option><option value="quoted">Devis émis</option><option value="confirmed">Confirmées</option><option value="unpaid">Non réglées</option><option value="paid">Réglées</option><option value="handoff">Handoff prêt</option>
          </select>
        </div>

        {visibleOrders.length === 0 ? <EmptyState title="Aucune commande dans cette vue" text="Aucun élément ne correspond à la recherche et au périmètre sélectionnés." action={<ActionLink href="/sales/orders/new" tone="navy" icon="plus">Créer une commande</ActionLink>} /> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Commande</th><th>Client</th><th>Service</th><th>Valeur</th><th>Étape commerciale</th><th>Paiement</th><th>Handoff</th><th>Prochaine action</th></tr></thead>
              <tbody>{visibleOrders.map(order => <tr key={order.id}>
                <td><Link href={`/sales/orders/${order.id}`} style={{ color: '#123e70', fontWeight: 900, textDecoration: 'none' }}>{order.order_ref}</Link></td>
                <td>{order.client_name}</td>
                <td>{order.service_type || 'Non renseigné'}</td>
                <td><strong>{formatDh(order.total_amount)}</strong></td>
                <td><Pill tone={toneForStatus(order.status)}>{statusLabel(order.status)}</Pill></td>
                <td><Pill tone={toneForStatus(order.payment_status)}>{statusLabel(order.payment_status || 'unpaid')}</Pill></td>
                <td><Pill tone={toneForStatus(order.fulfillment_status)}>{statusLabel(order.fulfillment_status || 'not_started')}</Pill></td>
                <td><Link href={`/sales/orders/${order.id}`} style={{ color: '#1d4ed8', fontWeight: 850, textDecoration: 'none' }}>{order.next_action || 'Ouvrir le dossier'}</Link></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </Panel>

      <SectionHeading
        eyebrow="Systèmes distincts"
        title="Intelligence, communications et configuration restent séparées du pipeline principal."
        description="Les endpoints d’intelligence peuvent lire des tables sales_* différentes. Les communications enregistrées ne prouvent pas un envoi externe."
        actions={<><ActionLink href="/sales/management" tone="light">Management</ActionLink><ActionLink href="/sales/configuration" tone="light">Configuration</ActionLink></>}
      />
    </div>
  </AppShell>
}
