'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, ContinuityRibbon, EmptyState, formatDate, formatDh,
  HeroStat, Icon, MetricTile, Notice, Panel, Pill, SalesHero, SourceBadge, styles, toneForStatus,
} from './_components/Sales360UI'

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
    results.forEach((result, index) => {
      const key = sources[index][0]
      if (result.status !== 'fulfilled' || !result.value?.ok) {
        missing.push(key)
        return
      }
      const value = result.value
      if (key === 'clients') setClients(value.data || [])
      if (key === 'orders') setOrders(value.data || [])
      if (key === 'options') setOptions(value.data || [])
      if (key === 'actions') setActions(value.data || [])
      if (key === 'communications') setCommunications(value.data || [])
      if (key === 'insights') setInsights(value.data || null)
    })
    setPartialSources(missing)
    setMessage(missing.includes('orders') || missing.includes('clients')
      ? 'Le périmètre principal est partiellement indisponible. Les chiffres visibles peuvent être incomplets.'
      : `${orders.length || 0} commandes et ${clients.length || 0} clients synchronisés avec le Sales Terminal.`)
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
    title="Sales 360"
    subtitle="Client Acquisition, Commercial Execution, Revenue Assurance & Operational Handoff Command Center."
    breadcrumbs={[{ label: 'Sales 360' }]}
    actions={<><PageAction href="/sales/clients">Nouveau client</PageAction><PageAction href="/sales/orders/new" variant="light">Nouvelle commande</PageAction><PageAction href="/sales/management" variant="light">Management</PageAction></>}
  >
    <div className={styles.page}>
      <SalesHero
        eyebrow="Revenue Command · Sales Terminal"
        title="Transformer chaque demande en décision commerciale claire, sécurisée et transmissible."
        text="Une vue consolidée des clients, commandes, devis, règlements déclarés et handoffs opérationnels, sans confondre documents commerciaux, paiements vérifiés ou activations réellement exécutées."
        actions={<><ActionLink href="/sales/clients" tone="light" icon="client">Créer ou qualifier un client</ActionLink><ActionLink href="/sales/orders/new" tone="blue" icon="plus">Composer une commande</ActionLink><ActionButton tone="navy" icon="refresh" onClick={() => void load()} disabled={loading}>Actualiser</ActionButton></>}
        aside={<>
          <HeroStat label="Pipeline Sales Terminal" value={formatDh(stats.pipeline)} detail={`${orders.length} commandes visibles`} tone="blue" />
          <HeroStat label="Revenue confirmé" value={formatDh(stats.confirmedValue)} detail={`${stats.confirmed.length} commandes commercialement actives`} tone="green" />
          <HeroStat label="Exposition non réglée" value={formatDh(stats.exposure)} detail={`${stats.unpaidConfirmed.length} commandes confirmées`} tone={stats.unpaidConfirmed.length ? 'red' : 'green'} />
          <HeroStat label="Dernier mouvement" value={formatDate(lastActivity, true)} detail={partialSources.length ? 'Sources partielles détectées' : 'Source Sales Terminal active'} tone={partialSources.length ? 'amber' : 'slate'} />
        </>}
      />

      <CommercialNav active="command" />

      {partialSources.length ? <Notice tone="amber" icon="alert" title="Périmètre partiellement chargé" text={`Sources indisponibles ou distinctes : ${partialSources.join(', ')}. Les données Sales Execution OS ne doivent pas être interprétées comme le même pipeline que sales_terminal_*.`} /> : null}

      <div className={styles.metricsGrid}>
        <MetricTile label="Clients" value={clients.length} detail="Dossiers Sales Terminal" icon="client" tone="blue" />
        <MetricTile label="Pipeline" value={formatDh(stats.pipeline)} detail={`${stats.draft.length} brouillons · ${stats.quoted.length} devis`} icon="chart" tone="navy" />
        <MetricTile label="À sécuriser" value={formatDh(stats.exposure)} detail={`${stats.unpaidConfirmed.length} confirmées non réglées`} icon="alert" tone={stats.unpaidConfirmed.length ? 'red' : 'green'} onClick={() => setFocus('unpaid')} />
        <MetricTile label="Handoff prêt" value={stats.handoffReady.length} detail="Statut de transmission, pas preuve de mission" icon="handoff" tone="green" onClick={() => setFocus('handoff')} />
      </div>

      <ContinuityRibbon items={[
        { label: 'Client', value: `${clients.length} dossiers`, tone: 'blue', href: '/sales/clients' },
        { label: 'Services', value: 'Catalogue connecté', tone: 'green', href: '/services' },
        { label: 'Commande', value: `${orders.length} visibles`, tone: 'blue', href: '/sales/orders' },
        { label: 'Devis', value: `${stats.quoted.length} ouverts`, tone: stats.quoted.length ? 'amber' : 'slate' },
        { label: 'Paiement', value: 'Statut déclaré', tone: stats.unpaidConfirmed.length ? 'amber' : 'green' },
        { label: 'Handoff', value: `${stats.handoffReady.length} prêts`, tone: 'green' },
        { label: 'Contrat', value: 'Lien non certifié', tone: 'slate' },
        { label: 'Billing', value: 'Document ≠ facture Billing', tone: 'amber', href: '/billing' },
      ]} />

      <div className={styles.grid2}>
        <Panel title="File d’exécution commerciale" subtitle="Priorités déterministes calculées depuis les statuts existants du Sales Terminal." action={<SourceBadge tone="green">Sales Terminal live</SourceBadge>}>
          <div className={styles.recordList}>
            {actionQueue.length === 0 ? <EmptyState title="Aucune intervention prioritaire" text="Aucune commande visible ne nécessite actuellement de devis, relance, sécurisation de règlement ou handoff." /> : actionQueue.map(item => <article key={item.id} className={styles.recordCard}>
              <div className={styles.recordMain}>
                <div className={styles.recordTitle}><strong>{item.title}</strong><Pill tone={item.tone}>{item.order.order_ref}</Pill></div>
                <div className={styles.recordMeta}><span>{item.order.client_name}</span><span>{item.order.service_type || 'Service non renseigné'}</span><span>{formatDh(item.order.total_amount)}</span></div>
                <p className={styles.muted}>{item.reason}</p>
              </div>
              <div className={styles.recordActions}><ActionLink href={`/sales/orders/${item.order.id}`} tone="light">Ouvrir</ActionLink></div>
            </article>)}
          </div>
        </Panel>

        <div className={styles.stack}>
          <Panel title="Brief direction commerciale" subtitle="Lecture immédiate des enjeux à traiter.">
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCell}><small>Situation pipeline</small><strong>{stats.pipeline > 0 ? 'Portefeuille actif' : 'Aucune valeur visible'}</strong></div>
              <div className={styles.summaryCell}><small>Encaissement déclaré</small><strong>{formatDh(stats.paidValue)}</strong></div>
              <div className={styles.summaryCell}><small>Devis à relancer</small><strong>{stats.quoted.length}</strong></div>
              <div className={styles.summaryCell}><small>Handoffs à préparer</small><strong>{stats.paid.filter(order => order.fulfillment_status !== 'handoff_ready').length}</strong></div>
              <div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Action recommandée</small><strong>{stats.unpaidConfirmed.length ? 'Prioriser les commandes confirmées non réglées.' : stats.quoted.length ? 'Relancer les devis en attente de réponse.' : stats.draft.length ? 'Finaliser les commandes brouillon.' : 'Maintenir le suivi du portefeuille.'}</strong></div>
            </div>
          </Panel>
          <Notice tone="blue" title="Vérité financière" text="Une commande marquée réglée représente un statut Sales Terminal. Elle ne constitue pas, à elle seule, une preuve bancaire ni un enregistrement Billing 360." />
          <Notice tone="slate" title="Vérité opérationnelle" text="Le statut Handoff prêt signifie que la commande est prête à être transmise. Il ne prouve ni création de contrat, ni mission, ni dispatch." />
        </div>
      </div>

      <div style={{ height: 18 }} />

      <Panel title="Portefeuille commercial récent" subtitle={message} action={<div className={styles.inlineActions}><ActionLink href="/sales/orders" tone="light">Toutes les commandes</ActionLink><ActionLink href="/sales/orders/new" tone="navy" icon="plus">Créer</ActionLink></div>}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}><Icon name="search"/><input className={styles.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Référence, client, service, ville ou statut…" /></div>
          <select className={styles.select} value={focus} onChange={event => setFocus(event.target.value as Focus)} style={{ maxWidth: 210 }}>
            <option value="all">Vue consolidée</option><option value="draft">Brouillons</option><option value="quoted">Devis émis</option><option value="confirmed">Confirmées</option><option value="unpaid">Non réglées</option><option value="paid">Réglées</option><option value="handoff">Handoff prêt</option>
          </select>
        </div>
        <div className={styles.recordList}>
          {visibleOrders.length === 0 ? <EmptyState title="Aucune commande dans cette vue" text="Aucun élément ne correspond à la recherche et au périmètre sélectionnés." action={<ActionLink href="/sales/orders/new" tone="navy" icon="plus">Créer une commande</ActionLink>} /> : visibleOrders.map(order => <article key={order.id} className={styles.recordCard}>
            <div className={styles.recordMain}>
              <div className={styles.recordTitle}><strong>{order.order_ref}</strong><Pill tone={toneForStatus(order.status)}>{order.status ? order.status.replaceAll('_', ' ') : 'draft'}</Pill><Pill tone={toneForStatus(order.payment_status)}>{order.payment_status || 'unpaid'}</Pill></div>
              <div className={styles.recordMeta}><span>{order.client_name}</span><span>{order.service_type || 'Service non renseigné'}</span><span>{order.city || 'Ville non renseignée'}</span><span>{formatDh(order.total_amount)}</span></div>
              <div className={styles.recordTags}><SourceBadge tone="blue">Sales Terminal</SourceBadge><Pill tone={toneForStatus(order.fulfillment_status)}>{order.fulfillment_status || 'not_started'}</Pill></div>
            </div>
            <div className={styles.recordActions}><ActionLink href={`/sales/orders/${order.id}`} tone="navy">Piloter la commande</ActionLink></div>
          </article>)}
        </div>
      </Panel>

      <div className={styles.grid3} style={{ marginTop: 18 }}>
        <Panel title="Intelligence distincte" subtitle="Sales Execution OS — source potentiellement différente du Sales Terminal.">
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCell}><small>Pipeline déclaré</small><strong>{insights ? formatDh(insights.pipeline_value) : 'Indisponible'}</strong></div>
            <div className={styles.summaryCell}><small>Conversion</small><strong>{insights ? `${Number(insights.conversion_rate || 0).toFixed(1)} %` : 'Indisponible'}</strong></div>
            <div className={styles.summaryCell}><small>Actions ouvertes</small><strong>{actions.filter(item => item.status === 'open').length || insights?.action_queue || 0}</strong></div>
            <div className={styles.summaryCell}><small>Risque détecté</small><strong>{insights?.risk_orders ?? '—'}</strong></div>
          </div>
          <p className={styles.pageFooterNote}>Ces chiffres proviennent des endpoints d’intelligence existants et peuvent lire les tables sales_* plutôt que sales_terminal_*. Ils sont présentés comme une source distincte.</p>
        </Panel>
        <Panel title="Communications enregistrées" subtitle="Journal interne, sans présumer d’un envoi externe.">
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCell}><small>Logs visibles</small><strong>{communications.length}</strong></div>
            <div className={styles.summaryCell}><small>Canal dominant</small><strong>{communications[0]?.channel || 'Aucun'}</strong></div>
            <div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Garantie</small><strong>Log enregistré ≠ message envoyé ou livré</strong></div>
          </div>
        </Panel>
        <Panel title="Gouvernance du terminal" subtitle="Configuration et surfaces techniques clairement séparées.">
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCell}><small>Options actives</small><strong>{configActive}</strong></div>
            <div className={styles.summaryCell}><small>Sources partielles</small><strong>{partialSources.length}</strong></div>
          </div>
          <div className={styles.inlineActions} style={{ marginTop: 12 }}><ActionLink href="/sales/configuration" tone="light" icon="settings">Configuration</ActionLink><ActionLink href="/sales/qa" tone="light" icon="technical">Assurance technique</ActionLink></div>
        </Panel>
      </div>
    </div>
  </AppShell>
}
