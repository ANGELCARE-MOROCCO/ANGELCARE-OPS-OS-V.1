'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, EmptyState, formatDate, formatDh, HeroStat, Icon,
  MetricTile, Panel, Pill, SalesHero, SourceBadge, styles, toneForStatus,
} from '../_components/Sales360UI'

type Order = { id: string; order_ref: string; client_id?: string; client_name: string; service_type?: string; service_category?: string; city?: string; total_amount?: number; status?: string; payment_status?: string; fulfillment_status?: string; service_date?: string; created_at?: string; next_action?: string; document_count?: number }
type View = 'all' | 'draft' | 'quoted' | 'confirmed' | 'unpaid' | 'paid' | 'handoff' | 'cancelled'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>('all')
  const [city, setCity] = useState('all')
  const [sort, setSort] = useState('newest')
  const [display, setDisplay] = useState<'cards' | 'table'>('cards')
  const [message, setMessage] = useState('Connexion au portefeuille des commandes…')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/sales-terminal/orders', { cache: 'no-store' })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Orders API indisponible')
      setOrders(json.data || [])
      setMessage(`${json.data?.length || 0} commandes chargées depuis sales_terminal_orders.`)
    } catch (error) {
      setMessage(`Chargement incomplet : ${error instanceof Error ? error.message : 'erreur inconnue'}`)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const stats = useMemo(() => {
    const pipeline = orders.filter(order => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const paid = orders.filter(order => order.payment_status === 'paid')
    const unpaid = orders.filter(order => order.status === 'confirmed' && order.payment_status !== 'paid')
    return {
      pipeline,
      draft: orders.filter(order => !order.status || order.status === 'draft'),
      quoted: orders.filter(order => order.status === 'quoted'),
      confirmed: orders.filter(order => order.status === 'confirmed'),
      paid,
      unpaid,
      handoff: orders.filter(order => order.fulfillment_status === 'handoff_ready'),
      cancelled: orders.filter(order => order.status === 'cancelled'),
      paidValue: paid.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      exposure: unpaid.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    }
  }, [orders])

  const cities = useMemo(() => [...new Set(orders.map(order => order.city).filter(Boolean) as string[])].sort(), [orders])
  const visible = useMemo(() => orders.filter(order => {
    const text = `${order.order_ref} ${order.client_name} ${order.service_type || ''} ${order.city || ''} ${order.status || ''} ${order.payment_status || ''} ${order.fulfillment_status || ''}`.toLowerCase()
    const matchesView = view === 'all'
      || (view === 'draft' && (!order.status || order.status === 'draft'))
      || (view === 'quoted' && order.status === 'quoted')
      || (view === 'confirmed' && order.status === 'confirmed')
      || (view === 'unpaid' && order.status === 'confirmed' && order.payment_status !== 'paid')
      || (view === 'paid' && order.payment_status === 'paid')
      || (view === 'handoff' && order.fulfillment_status === 'handoff_ready')
      || (view === 'cancelled' && order.status === 'cancelled')
    return text.includes(query.toLowerCase()) && matchesView && (city === 'all' || order.city === city)
  }).sort((a, b) => sort === 'value' ? Number(b.total_amount || 0) - Number(a.total_amount || 0) : sort === 'client' ? a.client_name.localeCompare(b.client_name) : String(b.created_at || '').localeCompare(String(a.created_at || ''))), [orders, query, view, city, sort])

  return <AppShell title="Commandes Sales 360" subtitle="Portefeuille commercial, devis, règlements déclarés et transmission opérationnelle." breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Commandes' }]} actions={<><PageAction href="/sales/orders/new">Nouvelle commande</PageAction><PageAction href="/sales/clients" variant="light">Clients</PageAction></>}>
    <div className={styles.page}>
      <SalesHero eyebrow="Commercial Order Portfolio" title="Contrôler la valeur, la progression et le prochain geste de chaque commande." text="Le portefeuille expose les états commerciaux réels du Sales Terminal sans confondre un statut de règlement, un document de vente et une facture Billing 360." actions={<><ActionLink href="/sales/orders/new" tone="light" icon="plus">Créer une commande</ActionLink><ActionLink href="/sales/clients" tone="blue" icon="client">Portefeuille clients</ActionLink><ActionButton tone="navy" icon="refresh" onClick={() => void load()} disabled={loading}>Actualiser</ActionButton></>} aside={<><HeroStat label="Pipeline visible" value={formatDh(stats.pipeline)} detail={`${orders.length} commandes`} /><HeroStat label="Déclaré réglé" value={formatDh(stats.paidValue)} detail={`${stats.paid.length} commandes`} tone="green" /><HeroStat label="Exposition confirmée" value={formatDh(stats.exposure)} detail={`${stats.unpaid.length} commandes non réglées`} tone={stats.unpaid.length ? 'red' : 'green'} /></>} />
      <CommercialNav active="orders" />
      <div className={styles.metricsGrid}>
        <MetricTile label="Commandes" value={orders.length} detail="Source Sales Terminal" icon="order" />
        <MetricTile label="Brouillons" value={stats.draft.length} detail="À transformer en devis" icon="document" tone="blue" onClick={() => setView('draft')} />
        <MetricTile label="À encaisser" value={formatDh(stats.exposure)} detail="Confirmées et non réglées" icon="alert" tone={stats.unpaid.length ? 'red' : 'green'} onClick={() => setView('unpaid')} />
        <MetricTile label="Handoff prêt" value={stats.handoff.length} detail="Transmission, pas mission créée" icon="handoff" tone="green" onClick={() => setView('handoff')} />
      </div>

      <Panel title="Portefeuille des commandes" subtitle={message} action={<SourceBadge tone="green">sales_terminal_orders</SourceBadge>}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}><Icon name="search"/><input className={styles.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Référence, client, service, ville ou statut…" /></div>
          <select className={styles.select} value={view} onChange={event => setView(event.target.value as View)} style={{ maxWidth: 190 }}><option value="all">Toutes</option><option value="draft">Brouillons</option><option value="quoted">Devis émis</option><option value="confirmed">Confirmées</option><option value="unpaid">Non réglées</option><option value="paid">Réglées</option><option value="handoff">Handoff prêt</option><option value="cancelled">Annulées</option></select>
          <select className={styles.select} value={city} onChange={event => setCity(event.target.value)} style={{ maxWidth: 170 }}><option value="all">Toutes les villes</option>{cities.map(item => <option key={item}>{item}</option>)}</select>
          <select className={styles.select} value={sort} onChange={event => setSort(event.target.value)} style={{ maxWidth: 160 }}><option value="newest">Plus récentes</option><option value="value">Valeur décroissante</option><option value="client">Client</option></select>
          <div className={styles.inlineActions}><ActionButton tone={display === 'cards' ? 'navy' : 'light'} onClick={() => setDisplay('cards')}>Cartes</ActionButton><ActionButton tone={display === 'table' ? 'navy' : 'light'} onClick={() => setDisplay('table')}>Table</ActionButton></div>
        </div>

        {visible.length === 0 ? <EmptyState title="Aucune commande dans ce périmètre" text="Aucun élément ne correspond à la recherche, au statut et à la ville sélectionnés." action={<ActionLink href="/sales/orders/new" tone="navy" icon="plus">Créer une commande</ActionLink>} /> : display === 'cards' ? <div className={styles.recordList}>{visible.map(order => <article key={order.id} className={styles.recordCard}>
          <div className={styles.recordMain}>
            <div className={styles.recordTitle}><strong>{order.order_ref}</strong><Pill tone={toneForStatus(order.status)}>{order.status || 'draft'}</Pill><Pill tone={toneForStatus(order.payment_status)}>{order.payment_status || 'unpaid'}</Pill><Pill tone={toneForStatus(order.fulfillment_status)}>{order.fulfillment_status || 'not_started'}</Pill></div>
            <div className={styles.recordMeta}><span>{order.client_name}</span><span>{order.service_type || 'Service non renseigné'}</span><span>{order.city || 'Ville non renseignée'}</span><span>{formatDh(order.total_amount)}</span><span>Service : {formatDate(order.service_date)}</span></div>
            <p className={styles.muted}>Prochaine action : {order.next_action || 'Surveiller la commande'}</p>
          </div>
          <div className={styles.recordActions}><ActionLink href={`/sales/orders/${order.id}`} tone="navy">Ouvrir le dossier</ActionLink></div>
        </article>)}</div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Commande</th><th>Client</th><th>Service</th><th>Valeur</th><th>Statut</th><th>Paiement</th><th>Handoff</th><th>Date service</th><th>Action</th></tr></thead><tbody>{visible.map(order => <tr key={order.id}><td><strong>{order.order_ref}</strong></td><td>{order.client_name}</td><td>{order.service_type || '—'}</td><td>{formatDh(order.total_amount)}</td><td><Pill tone={toneForStatus(order.status)}>{order.status || 'draft'}</Pill></td><td><Pill tone={toneForStatus(order.payment_status)}>{order.payment_status || 'unpaid'}</Pill></td><td>{order.fulfillment_status || 'not_started'}</td><td>{formatDate(order.service_date)}</td><td><ActionLink href={`/sales/orders/${order.id}`} tone="light">Ouvrir</ActionLink></td></tr>)}</tbody></table></div>}
      </Panel>

      <div className={styles.grid3} style={{ marginTop: 18 }}>
        <Panel title="Devis à relancer" subtitle="Commandes au statut quoted."><strong style={{ fontSize: 28 }}>{stats.quoted.length}</strong><p className={styles.muted}>Ces commandes ont un état de devis, sans preuve automatique de réception ou réponse client.</p></Panel>
        <Panel title="Règlements déclarés" subtitle="Statut Sales Terminal uniquement."><strong style={{ fontSize: 28 }}>{formatDh(stats.paidValue)}</strong><p className={styles.muted}>Ce montant ne constitue pas une réconciliation bancaire ni une écriture Billing 360.</p></Panel>
        <Panel title="Annulations" subtitle="Commandes retirées du pipeline actif."><strong style={{ fontSize: 28 }}>{stats.cancelled.length}</strong><p className={styles.muted}>Ouvrez le dossier pour consulter la raison d’annulation enregistrée.</p></Panel>
      </div>
    </div>
  </AppShell>
}
