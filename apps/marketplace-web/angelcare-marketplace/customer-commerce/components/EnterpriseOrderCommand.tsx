'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Activity,
  BadgeDollarSign,
  Boxes,
  ExternalLink,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  WalletCards,
  X,
} from 'lucide-react'
import type { EnterpriseOrderSummary } from '../types'
import type { AssistedOrderOptions } from '../../total-commerce-control/types'
import type { OrderCommandPermissions } from '../order-permissions'
import { AssistedOrderComposer } from './AssistedOrderComposer'
import styles from '../customer-commerce.module.css'

type Envelope<T> = { data: T }

async function patch<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) {
    throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  }
  return payload.data
}

const journeyLabels: Record<string, string> = {
  product_order: 'Produit',
  kit_order: 'Kit',
  family_booking: 'Réservation famille',
  recurring_service: 'Service récurrent',
  academy_enrollment: 'Inscription Academy',
  b2b_quotation: 'Devis B2B',
  hospitality_programme: 'Hospitality',
  corporate_benefit: 'Corporate',
  quality_assessment: 'Quality',
}

const transitionLabels: Record<string, string> = {
  in_preparation: 'Préparation',
  in_progress: 'En cours',
  completed: 'Clôturer',
  recovery: 'Recovery',
  cancelled: 'Annuler',
}

export function EnterpriseOrderCommand({
  initial,
  options,
  initialQuery,
  permissions,
}: {
  initial: EnterpriseOrderSummary
  options: AssistedOrderOptions
  initialQuery?: Record<string, string | undefined>
  permissions: OrderCommandPermissions
}) {
  const [summary, setSummary] = useState(initial)
  const [query, setQuery] = useState(initialQuery?.q || initialQuery?.customer || '')
  const [type, setType] = useState('all')
  const [source, setSource] = useState('all')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(initial.records[0]?.id || '')
  const [transitionTarget, setTransitionTarget] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const rows = useMemo(() => summary.records.filter((record) =>
    (type === 'all' || record.journeyType === type)
    && (source === 'all' || record.creationSource === source)
    && (status === 'all' || record.status === status)
    && (!query || `${record.publicReference} ${record.title} ${record.customerName} ${record.creationSource}`.toLowerCase().includes(query.toLowerCase())),
  ), [summary.records, type, source, status, query])
  const selected = summary.records.find((record) => record.id === selectedId) || rows[0] || null
  const sources = [...new Set(summary.records.map((record) => record.creationSource))]
  const statuses = [...new Set(summary.records.map((record) => record.status))]

  async function transition() {
    if (!selected || !transitionTarget || !reason.trim() || !permissions.manageOrder) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await patch(`/api/angelcare-marketplace/admin/orders/${selected.id}`, {
        status: transitionTarget,
        reason: reason.trim(),
      })
      setSummary((current) => ({
        ...current,
        records: current.records.map((record) => record.id === selected.id ? { ...record, status: transitionTarget } : record),
      }))
      setNotice(`${selected.publicReference} est passé à ${transitionTarget}.`)
      setTransitionTarget(null)
      setReason('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }

  return <main className={styles.orderWorkspace}>
    <header className={styles.orderWorkspaceHeader}>
      <div>
        <span className={styles.eyebrow}>COMMANDES & RÉSERVATIONS</span>
        <h1>Centre de commandement commercial</h1>
        <p>Une vue opérateur des commandes canoniques, de leurs obligations financières, de leur fulfillment et de leur prochaine action.</p>
      </div>
      <div className={styles.orderHeaderActions}>
        <Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/bookings">Réservations</Link>
        {permissions.createOrder
          ? <AssistedOrderComposer options={options} initialQuery={initialQuery} onCreated={() => location.reload()} />
          : <button className={styles.primaryButton} disabled title="Permission marketplace.operations.missions.create requise">Créer</button>}
      </div>
    </header>

    {error ? <div className={styles.error} role="alert">{error}</div> : null}
    {notice ? <div className={styles.orderNotice} role="status">{notice}</div> : null}

    <section className={styles.orderMetricGrid} aria-label="Indicateurs opérationnels">
      <Metric icon={<ShoppingBag />} label="Objets commerciaux" value={summary.total} hint="Portefeuille canonique" />
      <Metric icon={<Activity />} label="Actions requises" value={summary.requiringAction} hint="À traiter maintenant" tone="danger" />
      <Metric icon={<BadgeDollarSign />} label="Exceptions paiement" value={summary.paymentExceptions} hint="État réel" tone="warning" />
      <Metric icon={<Boxes />} label="Exceptions fulfillment" value={summary.fulfillmentExceptions} hint="À coordonner" tone="attention" />
      <Metric icon={<WalletCards />} label="Exceptions Wallet" value={summary.walletExceptions} hint="Contribution à vérifier" />
      <Metric icon={<RefreshCcw />} label="Remboursements" value={summary.refundsPending} hint="En attente" tone="warning" />
    </section>

    <div className={styles.orderCommandGrid}>
      <section className={styles.orderRegistryPanel}>
        <div className={styles.orderPanelHeader}>
          <div><h2>Live portfolio</h2><p>Créer, retrouver et piloter les objets commerciaux réels.</p></div>
          {permissions.createOrder
            ? <Link className={styles.primaryButton} href="/angelcare-marketplace/admin/orders/new">+ Commande manuelle</Link>
            : <button className={styles.primaryButton} disabled title="Permission marketplace.operations.missions.create requise">+ Commande manuelle</button>}
        </div>
        <div className={styles.orderFilters}>
          <label className={styles.orderSearch}><Search size={15} /><span className="sr-only">Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Référence, client, offre, source…" /></label>
          <label><span className="sr-only">Journey</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">Tous types</option>{Object.entries(journeyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span className="sr-only">Origine</span><select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Toutes origines</option>{sources.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span className="sr-only">Statut</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous statuts</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
          <button className={styles.secondaryButton} onClick={() => { setQuery(''); setType('all'); setSource('all'); setStatus('all') }}>Réinitialiser</button>
        </div>
        <div className={styles.orderTableWrap}>
          <table className={styles.orderTable}>
            <thead><tr><th>Référence</th><th>Client / offre</th><th>Journey</th><th>Origine</th><th>Statut</th><th>Paiement / Wallet</th><th>Fulfillment</th><th>Action</th></tr></thead>
            <tbody>{rows.map((record) => <tr key={record.id} data-selected={selected?.id === record.id} data-risk={record.riskLevel}>
              <td><button className={styles.orderReferenceButton} onClick={() => setSelectedId(record.id)}>{record.publicReference}</button></td>
              <td><strong>{record.customerName}</strong><small>{record.title}</small></td>
              <td>{journeyLabels[record.journeyType] || record.journeyType}</td>
              <td>{record.creationSource}</td>
              <td><span className={styles.status} data-state={record.status}>{record.status}</span></td>
              <td><strong>{record.paymentAmount.toLocaleString('fr-FR')} Dh</strong><small>{record.walletContribution.toLocaleString('fr-FR')} AC + {record.externalContribution.toLocaleString('fr-FR')} Dh</small></td>
              <td><strong>{record.fulfillmentStatus}</strong><small>{record.nextAction || 'Aucune prochaine action déclarée'}</small></td>
              <td><button className={styles.secondaryButton} onClick={() => setSelectedId(record.id)}>Ouvrir</button></td>
            </tr>)}</tbody>
          </table>
          {!rows.length ? <div className={styles.emptyState}>Aucun dossier ne correspond aux filtres actifs.</div> : null}
        </div>
        <footer className={styles.orderTableFooter}><span>{rows.length} dossier(s) affiché(s)</span><span>Le dossier 360, Mega Order Command et Journey restent reliés au même objet.</span></footer>
      </section>

      <aside className={styles.orderContextRail} aria-label="Dossier sélectionné">
        {selected ? <>
          <section><div className={styles.orderRailHeading}><div><span>Dossier sélectionné</span><h2>{selected.publicReference}</h2></div><ShieldCheck size={20} /></div>
            <dl className={styles.orderFacts}>
              <div><dt>Client</dt><dd>{selected.customerName}</dd></div>
              <div><dt>Journey</dt><dd>{journeyLabels[selected.journeyType] || selected.journeyType}</dd></div>
              <div><dt>Signal</dt><dd><span className={styles.status} data-state={selected.riskLevel}>{selected.riskLevel}</span></dd></div>
              <div><dt>Mis à jour</dt><dd>{new Date(selected.updatedAt).toLocaleString('fr-FR')}</dd></div>
            </dl>
          </section>
          <section><h3>Ouvrir dans</h3>
            <Link className={styles.primaryButton} href={`/angelcare-marketplace/admin/orders/${selected.id}`}>Order 360 <ExternalLink size={14} /></Link>
            <Link className={styles.secondaryButton} href={`/angelcare-marketplace/admin/journeys/${selected.id}`}>Journey dossier</Link>
            <Link className={styles.secondaryButton} href={`/angelcare-marketplace/admin/payments?order=${selected.id}`}>Contexte Finance</Link>
          </section>
          <section><h3>Transition gouvernée</h3>
            <div className={styles.orderTransitionGrid}>{Object.entries(transitionLabels).map(([value, label]) => <button key={value} className={value === 'cancelled' ? styles.dangerButton : styles.secondaryButton} disabled={!permissions.manageOrder || busy || selected.status === value} title={!permissions.manageOrder ? 'Permission marketplace.operations.missions.manage requise' : undefined} onClick={() => setTransitionTarget(value)}>{label}</button>)}</div>
          </section>
          <section><h3>Pression opérateur</h3><p>{selected.nextAction || 'Aucune prochaine action déclarée.'}</p><p>Paiement : {selected.paymentStatus} · Fulfillment : {selected.fulfillmentStatus}</p></section>
          <section><h3>Accès rapides</h3>
            {permissions.createOrder ? <Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/orders/new">Nouvelle commande</Link> : <button className={styles.secondaryButton} disabled title="Permission marketplace.operations.missions.create requise">Nouvelle commande</button>}
            <Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/bookings">Réservations</Link>
            <Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/commercial/quotes">Devis & paniers</Link>
            <Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/subscriptions">Abonnements</Link>
            <Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/conversion">Conversion cockpit</Link>
          </section>
        </> : <div className={styles.emptyState}>Sélectionnez une commande.</div>}
      </aside>
    </div>

    {selected && transitionTarget ? <div className={styles.orderModalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setTransitionTarget(null) }}>
      <section className={styles.orderModal} role="dialog" aria-modal="true" aria-labelledby="order-transition-title">
        <header><div><span>Décision de cycle</span><h2 id="order-transition-title">{transitionLabels[transitionTarget]} · {selected.publicReference}</h2></div><button aria-label="Fermer" disabled={busy} onClick={() => setTransitionTarget(null)}><X size={18} /></button></header>
        <div className={styles.orderDecisionSummary}><div><span>État actuel</span><strong>{selected.status}</strong></div><div><span>État proposé</span><strong>{transitionTarget}</strong></div></div>
        <p>{transitionTarget === 'completed' ? 'La clôture vérifie les obligations de paiement et le fulfillment avant d’être acceptée.' : transitionTarget === 'cancelled' ? 'L’annulation modifie le cycle canonique et reste auditée. Les effets financiers sont opérés depuis Finance.' : 'La transition est validée par le lifecycle de la commande et inscrite dans son historique.'}</p>
        <label><span>Motif obligatoire</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Contexte, décision et prochaine action…" /></label>
        {error ? <div className={styles.error} role="alert">{error}</div> : null}
        <footer><button className={styles.secondaryButton} disabled={busy} onClick={() => setTransitionTarget(null)}>Retour</button><button className={transitionTarget === 'cancelled' ? styles.dangerButton : styles.primaryButton} disabled={busy || !reason.trim()} onClick={() => void transition()}>{busy ? 'Application…' : 'Confirmer la transition'}</button></footer>
      </section>
    </div> : null}
  </main>
}

function Metric({ icon, label, value, hint, tone = 'neutral' }: { icon: React.ReactNode; label: string; value: number; hint: string; tone?: string }) {
  return <article data-tone={tone}><div>{icon}<span>{label}</span></div><strong>{value.toLocaleString('fr-FR')}</strong><small>{hint}</small></article>
}
