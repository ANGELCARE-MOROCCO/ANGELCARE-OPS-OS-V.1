'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CalendarClock, Plus, RefreshCcw, Search, X } from 'lucide-react'
import type { CustomerSubscriptionRecord, EnterpriseCatalogRef, EnterpriseCustomerRef } from '../types'
import { enterpriseRequest } from './client'
import styles from '../../customer-commerce/customer-commerce.module.css'

export function SubscriptionCommand({ initial, customers, catalog, canManage }: { initial: CustomerSubscriptionRecord[]; customers: EnterpriseCustomerRef[]; catalog: EnterpriseCatalogRef[]; canManage: boolean }) {
  const [items, setItems] = useState(initial)
  const [selectedId, setSelectedId] = useState(initial[0]?.id || '')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerId, setCustomerId] = useState(customers[0]?.id || '')
  const [catalogItemId, setCatalogItemId] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState('monthly')
  const [startsAt, setStartsAt] = useState('')
  const [decision, setDecision] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const selected = items.find((item) => item.id === selectedId) || null
  const filtered = useMemo(() => items.filter((item) => (statusFilter === 'all' || item.status === statusFilter) && (!query || `${item.customer_name} ${item.catalog_item_name || ''} ${item.public_reference}`.toLowerCase().includes(query.toLowerCase()))), [items, query, statusFilter])

  async function save(subscriptionId?: string, status = 'active', operatorReason = '') {
    if (!canManage) return
    setBusy(true); setError(null); setNotice(null)
    try {
      const current = subscriptionId ? items.find((item) => item.id === subscriptionId) : null
      const item = await enterpriseRequest<CustomerSubscriptionRecord>(subscriptionId ? `/api/angelcare-marketplace/admin/subscriptions/${subscriptionId}` : '/api/angelcare-marketplace/admin/subscriptions', {
        method: subscriptionId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          customerId: current?.customer_account_id || customerId,
          catalogItemId: current?.catalog_item_id || catalogItemId || null,
          status,
          billingPeriod: current?.billing_period || period,
          quantity: current?.quantity || 1,
          amount: current?.amount ?? Number(amount || 0),
          currencyLabel: current?.currency_label || 'Dh',
          startsAt: current?.starts_at || startsAt || null,
          currentPeriodStartsAt: current?.current_period_starts_at || null,
          currentPeriodEndsAt: current?.current_period_ends_at || null,
          nextBillingAt: current?.next_billing_at || null,
          renewalMode: status === 'cancelled' ? 'non_renewing' : current?.renewal_mode || 'automatic',
          cancelReason: status === 'cancelled' ? operatorReason : current?.cancel_reason || null,
          metadata: { ...(current?.metadata || {}), operatorReason: operatorReason || undefined },
        }),
      })
      setItems((currentItems) => subscriptionId ? currentItems.map((record) => record.id === item.id ? item : record) : [item, ...currentItems])
      setSelectedId(item.id)
      setNotice(`Abonnement ${item.public_reference} enregistré.`)
      if (!subscriptionId) { setAmount(''); setStartsAt('') }
      setDecision(''); setReason('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Action impossible.') }
    finally { setBusy(false) }
  }

  const statuses = [...new Set(items.map((item) => item.status))]
  return <main className={styles.orderWorkspace}>
    <header className={styles.orderWorkspaceHeader}><div><span className={styles.eyebrow}>RECURRING COMMERCE</span><h1>Abonnements clients</h1><p>Créer et piloter les services récurrents, leur cycle de facturation et leur état commercial.</p></div><div className={styles.orderHeaderActions}><Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/orders">Commandes</Link><Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/finance-monetization/subscriptions">Contexte Finance</Link><a className={styles.primaryButton} href="#create-subscription">+ Abonnement</a></div></header>
    {error ? <div className={styles.error} role="alert">{error}</div> : null}{notice ? <div className={styles.orderNotice} role="status">{notice}</div> : null}
    <section className={styles.orderMetricGrid}>
      <Metric label="Abonnements" value={items.length} hint="Dossiers récurrents" icon={<RefreshCcw />} />
      <Metric label="Actifs" value={items.filter((item) => item.status === 'active').length} hint="Commerce récurrent" icon={<RefreshCcw />} />
      <Metric label="En pause" value={items.filter((item) => item.status === 'paused').length} hint="Cycle suspendu" icon={<CalendarClock />} tone="warning" />
      <Metric label="Annulés" value={items.filter((item) => item.status === 'cancelled').length} hint="Non renewing" icon={<X />} tone="danger" />
      <Metric label="Past due" value={items.filter((item) => item.status === 'past_due').length} hint="Contexte Finance" icon={<CalendarClock />} tone="danger" />
      <Metric label="Essais" value={items.filter((item) => item.status === 'trial').length} hint="Cycle trial" icon={<CalendarClock />} />
    </section>
    <div className={styles.orderCommandGrid}>
      <section className={styles.orderRegistryPanel}>
        <div className={styles.orderPanelHeader}><div><h2>Portefeuille récurrent</h2><p>Client, offre, montant, prochain cycle et renouvellement.</p></div><span className={styles.status}>{filtered.length} affichés</span></div>
        <div className={styles.orderFilters}><label className={styles.orderSearch}><Search size={15}/><span className="sr-only">Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Client, offre, référence…" /></label><label><span className="sr-only">Statut</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tous statuts</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><button className={styles.secondaryButton} onClick={() => { setQuery(''); setStatusFilter('all') }}>Réinitialiser</button></div>
        <div className={styles.orderTableWrap}><table className={styles.orderTable}><thead><tr><th>Référence</th><th>Client</th><th>Offre</th><th>Montant / cycle</th><th>Prochain cycle</th><th>Renouvellement</th><th>Statut</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} data-selected={selectedId === item.id} onClick={() => setSelectedId(item.id)}><td><button className={styles.orderReferenceButton}>{item.public_reference}</button></td><td><strong>{item.customer_name}</strong><small>{item.customer_reference}</small></td><td>{item.catalog_item_name || 'Service récurrent'}</td><td><strong>{item.amount.toLocaleString('fr-FR')} {item.currency_label}</strong><small>{item.billing_period}</small></td><td>{item.next_billing_at ? new Date(item.next_billing_at).toLocaleString('fr-FR') : '—'}</td><td>{item.renewal_mode}</td><td><span className={styles.status} data-state={item.status}>{item.status}</span></td></tr>)}</tbody></table>{!filtered.length ? <div className={styles.emptyState}>Aucun abonnement ne correspond aux filtres.</div> : null}</div>
      </section>
      <aside className={styles.orderContextRail}>
        <section>{selected ? <><div className={styles.orderRailHeading}><div><span>Abonnement sélectionné</span><h2>{selected.public_reference}</h2></div><RefreshCcw size={19}/></div><dl className={styles.orderFacts}><div><dt>Client</dt><dd>{selected.customer_name}</dd></div><div><dt>Offre</dt><dd>{selected.catalog_item_name || 'Service récurrent'}</dd></div><div><dt>Cycle</dt><dd>{selected.billing_period}</dd></div><div><dt>Statut</dt><dd>{selected.status}</dd></div></dl><h3>Actions de cycle</h3><div className={styles.orderTransitionGrid}><button className={styles.secondaryButton} disabled={!canManage || selected.status === 'active'} onClick={() => setDecision('active')}>Activer</button><button className={styles.secondaryButton} disabled={!canManage || selected.status === 'paused'} onClick={() => setDecision('paused')}>Mettre en pause</button><button className={styles.dangerButton} disabled={!canManage || selected.status === 'cancelled'} onClick={() => setDecision('cancelled')}>Annuler</button></div></> : <div className={styles.emptyState}>Sélectionnez un abonnement.</div>}</section>
        <section id="create-subscription"><h3>Créer un abonnement</h3><div className={styles.bookingForm}><label><span>Client</span><select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.display_name} · {customer.public_reference}</option>)}</select></label><label><span>Offre</span><select value={catalogItemId} onChange={(event) => setCatalogItemId(event.target.value)}><option value="">Service sans catalogue</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Montant</span><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label><span>Cycle</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="weekly">Hebdomadaire</option><option value="monthly">Mensuel</option><option value="quarterly">Trimestriel</option><option value="yearly">Annuel</option></select></label><label><span>Début</span><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><button className={styles.primaryButton} disabled={busy || !canManage || !customerId} title={!canManage ? 'Permission marketplace.admin.access requise' : undefined} onClick={() => void save()}><Plus size={14}/>{busy ? 'Création…' : 'Créer'}</button></div></section>
      </aside>
    </div>
    {selected && decision ? <div className={styles.orderModalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDecision('') }}><section className={styles.orderModal} role="dialog" aria-modal="true" aria-labelledby="subscription-decision"><header><div><span>Décision de cycle récurrent</span><h2 id="subscription-decision">{selected.public_reference} → {decision}</h2></div><button aria-label="Fermer" onClick={() => setDecision('')}><X size={18}/></button></header><div className={styles.orderDecisionSummary}><div><span>État actuel</span><strong>{selected.status}</strong></div><div><span>État proposé</span><strong>{decision}</strong></div></div><p>{decision === 'cancelled' ? 'L’abonnement devient non renouvelable. Cette action ne fabrique aucune annulation financière rétroactive.' : 'Le cycle commercial est mis à jour et conserve la justification opérateur.'}</p><label><span>Motif obligatoire</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label><footer><button className={styles.secondaryButton} disabled={busy} onClick={() => setDecision('')}>Retour</button><button className={decision === 'cancelled' ? styles.dangerButton : styles.primaryButton} disabled={busy || !reason.trim()} onClick={() => void save(selected.id, decision, reason.trim())}>{busy ? 'Application…' : 'Confirmer'}</button></footer></section></div> : null}
  </main>
}

function Metric({ label, value, hint, icon, tone = 'neutral' }: { label: string; value: number; hint: string; icon: React.ReactNode; tone?: string }) { return <article data-tone={tone}><div>{icon}<span>{label}</span></div><strong>{value.toLocaleString('fr-FR')}</strong><small>{hint}</small></article> }
