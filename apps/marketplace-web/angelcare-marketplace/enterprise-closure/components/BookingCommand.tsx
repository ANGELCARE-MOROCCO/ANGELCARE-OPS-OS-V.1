'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CalendarCheck, Clock3, Plus, Search, X } from 'lucide-react'
import type { BookingRecord, EnterpriseCatalogRef, EnterpriseCustomerRef } from '../types'
import { enterpriseRequest } from './client'
import styles from '../../customer-commerce/customer-commerce.module.css'

const lifecycle = ['registered', 'awaiting_customer', 'awaiting_angelcare', 'qualified', 'scheduled', 'in_preparation', 'in_progress', 'completed', 'blocked', 'recovery', 'cancelled']

export function BookingCommand({
  initial,
  customers,
  catalog,
  canCreate,
  canManage,
}: {
  initial: BookingRecord[]
  customers: EnterpriseCustomerRef[]
  catalog: EnterpriseCatalogRef[]
  canCreate: boolean
  canManage: boolean
}) {
  const [items, setItems] = useState(initial)
  const [selectedId, setSelectedId] = useState(initial[0]?.id || '')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [journeyFilter, setJourneyFilter] = useState('all')
  const [customerId, setCustomerId] = useState(customers[0]?.id || '')
  const [catalogItemId, setCatalogItemId] = useState('')
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [amount, setAmount] = useState('')
  const [journeyType, setJourneyType] = useState('family_booking')
  const [decision, setDecision] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const selected = items.find((item) => item.id === selectedId) || null
  const filtered = useMemo(() => items.filter((item) =>
    (statusFilter === 'all' || item.status === statusFilter)
    && (journeyFilter === 'all' || item.journey_type === journeyFilter)
    && (!query || `${item.customer_name} ${item.catalog_item_name || ''} ${item.public_reference} ${item.title}`.toLowerCase().includes(query.toLowerCase())),
  ), [items, journeyFilter, query, statusFilter])
  const today = new Date().toISOString().slice(0, 10)

  async function create() {
    if (!canCreate || !customerId || !start) return
    if (end && new Date(end) <= new Date(start)) { setError('La fin doit être postérieure au début.'); return }
    setBusy(true); setError(null); setNotice(null)
    try {
      const item = await enterpriseRequest<BookingRecord>('/api/angelcare-marketplace/admin/bookings', {
        method: 'POST',
        body: JSON.stringify({ customerId, catalogItemId: catalogItemId || null, title, scheduledStartAt: start, scheduledEndAt: end || null, amount: amount ? Number(amount) : undefined, journeyType }),
      })
      setItems((current) => [item, ...current])
      setSelectedId(item.id)
      setNotice(`Réservation ${item.public_reference} créée.`)
      setTitle(''); setStart(''); setEnd(''); setAmount('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Création impossible.') }
    finally { setBusy(false) }
  }

  async function transition() {
    if (!selected || !decision || !reason.trim() || !canManage) return
    setBusy(true); setError(null); setNotice(null)
    try {
      const item = await enterpriseRequest<BookingRecord>(`/api/angelcare-marketplace/admin/bookings/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: decision, scheduledStartAt: selected.scheduled_start_at, scheduledEndAt: selected.scheduled_end_at, title: selected.title, reason: reason.trim() }),
      })
      setItems((current) => current.map((record) => record.id === item.id ? item : record))
      setNotice(`${item.public_reference} → ${decision}.`)
      setDecision(''); setReason('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Mise à jour impossible.') }
    finally { setBusy(false) }
  }

  const statuses = [...new Set(items.map((item) => item.status))]
  const journeys = [...new Set(items.map((item) => item.journey_type))]
  return <main className={styles.orderWorkspace}>
    <header className={styles.orderWorkspaceHeader}><div><span className={styles.eyebrow}>BOOKING COMMAND</span><h1>Réservations & services planifiés</h1><p>Créer, rechercher et piloter le cycle réel des services clients.</p></div><div className={styles.orderHeaderActions}><Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/orders">Commandes</Link><a className={styles.primaryButton} href="#create-booking">+ Nouvelle réservation</a></div></header>
    {error ? <div className={styles.error} role="alert">{error}</div> : null}{notice ? <div className={styles.orderNotice} role="status">{notice}</div> : null}
    <section className={styles.orderMetricGrid} aria-label="Indicateurs réservations">
      <Metric label="Réservations" value={items.length} hint="Dossiers réels" icon={<CalendarCheck />} />
      <Metric label="Confirmées" value={items.filter((item) => ['qualified', 'scheduled', 'in_preparation', 'in_progress', 'completed'].includes(item.status)).length} hint="Cycle engagé" icon={<CalendarCheck />} />
      <Metric label="Planifiées" value={items.filter((item) => item.status === 'scheduled').length} hint="À venir" icon={<Clock3 />} />
      <Metric label="En attente" value={items.filter((item) => item.status.startsWith('awaiting')).length} hint="Action requise" icon={<Clock3 />} tone="warning" />
      <Metric label="Annulées" value={items.filter((item) => item.status === 'cancelled').length} hint="Historique" icon={<X />} tone="danger" />
      <Metric label="Aujourd’hui" value={items.filter((item) => item.scheduled_start_at?.slice(0, 10) === today).length} hint="Créneaux" icon={<CalendarCheck />} />
    </section>
    <div className={styles.orderCommandGrid}>
      <section className={styles.orderRegistryPanel}>
        <div className={styles.orderPanelHeader}><div><h2>Bookings & services</h2><p>Réservations, créneaux, état de cycle et montant réel.</p></div><span className={styles.status}>{filtered.length} affichées</span></div>
        <div className={styles.orderFilters}><label className={styles.orderSearch}><Search size={15}/><span className="sr-only">Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Client, service, référence…" /></label><label><span className="sr-only">Statut</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tous statuts</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="sr-only">Journey</span><select value={journeyFilter} onChange={(event) => setJourneyFilter(event.target.value)}><option value="all">Tous journeys</option>{journeys.map((value) => <option key={value}>{value}</option>)}</select></label><button className={styles.secondaryButton} onClick={() => { setQuery(''); setStatusFilter('all'); setJourneyFilter('all') }}>Réinitialiser</button></div>
        <div className={styles.orderTableWrap}><table className={styles.orderTable}><thead><tr><th>Référence</th><th>Client</th><th>Service / offre</th><th>Début</th><th>Fin</th><th>Statut</th><th>Action</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} data-selected={selectedId === item.id}><td><button className={styles.orderReferenceButton} onClick={() => setSelectedId(item.id)}>{item.public_reference}</button></td><td><strong>{item.customer_name}</strong><small>{item.customer_reference}</small></td><td><strong>{item.catalog_item_name || item.title}</strong><small>{item.journey_type}</small></td><td>{item.scheduled_start_at ? new Date(item.scheduled_start_at).toLocaleString('fr-FR') : '—'}</td><td>{item.scheduled_end_at ? new Date(item.scheduled_end_at).toLocaleString('fr-FR') : '—'}</td><td><span className={styles.status} data-state={item.status}>{item.status}</span></td><td><button className={styles.secondaryButton} onClick={() => setSelectedId(item.id)}>Ouvrir</button></td></tr>)}</tbody></table>{!filtered.length ? <div className={styles.emptyState}>Aucune réservation ne correspond aux filtres.</div> : null}</div>
        {selected ? <div className={styles.orderPanelHeader}><div><h2>{selected.public_reference} · réservation sélectionnée</h2><p>{selected.customer_name} · {selected.title} · {selected.next_action_label || 'Aucune prochaine action'}</p></div><Link className={styles.secondaryButton} href={`/angelcare-marketplace/admin/customers/${selected.customer_account_id}`}>Client 360</Link></div> : null}
      </section>
      <aside className={styles.orderContextRail}>
        <section><h3>Actions de cycle</h3><div className={styles.orderTransitionGrid}>{lifecycle.map((target) => <button key={target} className={target === 'cancelled' ? styles.dangerButton : styles.secondaryButton} disabled={!canManage || busy || selected?.status === target || !selected} title={!canManage ? 'Permission marketplace.operations.missions.manage requise' : undefined} onClick={() => setDecision(target)}>{target.replaceAll('_', ' ')}</button>)}</div></section>
        <section id="create-booking"><h3>Créer une réservation</h3><div className={styles.bookingForm}><label><span>Client</span><select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.display_name} · {customer.public_reference}</option>)}</select></label><label><span>Offre</span><select value={catalogItemId} onChange={(event) => setCatalogItemId(event.target.value)}><option value="">Service manuel</option>{catalog.filter((item) => ['service', 'training', 'audit', 'kit'].includes(item.kind)).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.kind}</option>)}</select></label><label><span>Journey</span><select value={journeyType} onChange={(event) => setJourneyType(event.target.value)}><option value="family_booking">Booking famille</option><option value="recurring_service">Service récurrent</option><option value="academy_enrollment">Academy</option></select></label><label><span>Titre</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label><span>Début</span><input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} /></label><label><span>Fin</span><input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} /></label><label><span>Montant override</span><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><button className={styles.primaryButton} disabled={busy || !canCreate || !customerId || !start} title={!canCreate ? 'Permission marketplace.operations.missions.create requise' : undefined} onClick={() => void create()}><Plus size={14}/>{busy ? 'Création…' : 'Créer'}</button></div></section>
      </aside>
    </div>
    {selected && decision ? <div className={styles.orderModalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDecision('') }}><section className={styles.orderModal} role="dialog" aria-modal="true" aria-labelledby="booking-decision"><header><div><span>Décision de réservation</span><h2 id="booking-decision">{selected.public_reference} → {decision}</h2></div><button aria-label="Fermer" onClick={() => setDecision('')}><X size={18}/></button></header><div className={styles.orderDecisionSummary}><div><span>État actuel</span><strong>{selected.status}</strong></div><div><span>État proposé</span><strong>{decision}</strong></div></div><p>La modification met à jour le Journey réel et inscrit la raison dans ses événements et son audit.</p><label><span>Motif obligatoire</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label><footer><button className={styles.secondaryButton} disabled={busy} onClick={() => setDecision('')}>Retour</button><button className={decision === 'cancelled' ? styles.dangerButton : styles.primaryButton} disabled={busy || !reason.trim()} onClick={() => void transition()}>{busy ? 'Application…' : 'Confirmer'}</button></footer></section></div> : null}
  </main>
}

function Metric({ label, value, hint, icon, tone = 'neutral' }: { label: string; value: number; hint: string; icon: React.ReactNode; tone?: string }) { return <article data-tone={tone}><div>{icon}<span>{label}</span></div><strong>{value.toLocaleString('fr-FR')}</strong><small>{hint}</small></article> }
