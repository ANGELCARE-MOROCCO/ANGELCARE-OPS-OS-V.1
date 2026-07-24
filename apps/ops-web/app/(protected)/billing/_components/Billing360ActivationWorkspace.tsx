'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileText, Grid2X2, LayoutList, Search, ShieldCheck, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import styles from './billing360.module.css'
import {
  agingLabel,
  amount,
  BillingContract,
  BillingFinanceEvent,
  BillingInvoice,
  contractLabel,
  eventLabel,
  familyLabel,
  formatDate,
  formatDh,
  isOverdue,
  isPaid,
  normalizedStatus,
  statusLabel,
} from './billing360.types'

type Queue = 'all' | 'pending' | 'overdue' | 'paid' | 'events'
type Mode = 'cards' | 'table'

export default function Billing360ActivationWorkspace({
  invoices,
  contracts,
  events,
  initialStatus,
  dataWarnings,
}: {
  invoices: BillingInvoice[]
  contracts: BillingContract[]
  events: BillingFinanceEvent[]
  initialStatus: string
  dataWarnings: string[]
}) {
  const initialQueue: Queue = ['pending', 'overdue', 'paid'].includes(initialStatus) ? initialStatus as Queue : 'all'
  const [queue, setQueue] = useState<Queue>(initialQueue)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('cards')
  const contractMap = useMemo(() => new Map(contracts.map((contract) => [String(contract.id), contract])), [contracts])
  const totals = useMemo(() => {
    const invoiced = invoices.reduce((sum, invoice) => sum + amount(invoice.amount), 0)
    const paid = invoices.reduce((sum, invoice) => sum + amount(invoice.amount_paid), 0)
    const overdue = invoices.filter((invoice) => isOverdue(invoice))
    return {
      invoiced,
      paid,
      open: Math.max(0, invoiced - paid),
      pending: invoices.filter((invoice) => ['pending', 'partial'].includes(normalizedStatus(invoice.status))).length,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, invoice) => sum + Math.max(0, amount(invoice.amount) - amount(invoice.amount_paid)), 0),
      activeContracts: contracts.filter((contract) => ['active', 'signed', 'confirmed'].includes(normalizedStatus(contract.status))).length,
    }
  }, [contracts, invoices])

  const visibleInvoices = useMemo(() => {
    const term = query.trim().toLowerCase()
    return invoices.filter((invoice) => {
      if (queue === 'pending' && !['pending', 'partial'].includes(normalizedStatus(invoice.status))) return false
      if (queue === 'overdue' && !isOverdue(invoice)) return false
      if (queue === 'paid' && !isPaid(invoice)) return false
      const contract = invoice.contract_id != null ? contractMap.get(String(invoice.contract_id)) : undefined
      if (!term) return true
      return [invoice.invoice_reference, invoice.invoice_label, contract ? contractLabel(contract) : '', contract ? familyLabel(contract) : '', invoice.contract_id]
        .filter(Boolean).join(' ').toLowerCase().includes(term)
    }).sort((a, b) => {
      if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1
      return new Date(String(a.due_date || a.created_at || 0)).getTime() - new Date(String(b.due_date || b.created_at || 0)).getTime()
    })
  }, [contractMap, invoices, query, queue])

  const aging = useMemo(() => {
    const buckets = new Map<string, number>([['À venir', 0], ["Échéance aujourd’hui", 0], ['1–7 jours de retard', 0], ['8–30 jours de retard', 0], ['Plus de 30 jours', 0]])
    invoices.filter((invoice) => !isPaid(invoice)).forEach((invoice) => {
      const label = agingLabel(invoice)
      if (buckets.has(label)) buckets.set(label, (buckets.get(label) || 0) + 1)
    })
    return Array.from(buckets.entries())
  }, [invoices])

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <div className={styles.brandLine}><div className={styles.logoPlate}><Image className={styles.logoImage} src="/logo.png" alt="ANGELCARE" width={260} height={90} priority /></div><div className={styles.brandCopy}><span className={styles.eyebrow}>ANGELCARE SANILA OS</span><strong>Billing 360 · Collections & Activation Control Tower</strong></div></div>
          <h1>Transformer les échéances visibles en actions financières maîtrisées.</h1>
          <p className={styles.heroLead}>Une file opérationnelle pour identifier les factures à suivre, les retards à traiter et le contrat à ouvrir avant toute action.</p>
          <div className={styles.heroMeta}><span className={styles.metaPill}><ShieldCheck size={15} /> Accès CEO / Manager préservé</span><span className={styles.metaPill}><Clock3 size={15} /> {totals.pending} en attente</span></div>
        </div>
        <aside className={styles.heroFinance}><div><div className={styles.heroFinanceLabel}><span>Montant ouvert</span><WalletCards size={18} /></div><div className={styles.heroFinanceValue}>{formatDh(totals.open)}</div><div className={styles.heroFinanceSub}>{formatDh(totals.overdueAmount)} déjà en retard</div></div><div className={styles.heroMiniGrid}><div className={styles.heroMini}><span>Facturé</span><strong>{formatDh(totals.invoiced)}</strong></div><div className={styles.heroMini}><span>Encaissé</span><strong>{formatDh(totals.paid)}</strong></div></div></aside>
      </section>

      {dataWarnings.length ? <div className={styles.warningBanner}><AlertTriangle size={20} /><div><strong>Couverture partielle.</strong> {dataWarnings.join(' ')}</div></div> : null}

      <section className={styles.kpiGrid}>
        <Kpi label="Factures" value={String(invoices.length)} sub="Périmètre chargé" />
        <Kpi label="En attente" value={String(totals.pending)} sub="Pending ou partial" />
        <Kpi label="En retard" value={String(totals.overdueCount)} sub={formatDh(totals.overdueAmount)} />
        <Kpi label="Montant ouvert" value={formatDh(totals.open)} sub="Cible de recouvrement" />
        <Kpi label="Encaissé" value={formatDh(totals.paid)} sub="Montant visible" />
        <Kpi label="Contrats actifs" value={String(totals.activeContracts)} sub={`${contracts.length} contrats chargés`} />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}><h2>Vieillissement des échéances</h2><p>Classification visuelle calculée à partir des dates d’échéance existantes.</p></div>
        <div className={styles.agingGrid}>{aging.map(([label, count]) => <div className={styles.agingCard} key={label}><span>{label}</span><strong>{count}</strong></div>)}</div>
      </section>

      <section className={styles.controlBar}>
        <label className={styles.searchBox}><Search size={17} /><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Facture, contrat, famille…" /></label>
        <div className={styles.filterTabs}>{([['all','Toutes'],['pending','En attente'],['overdue','En retard'],['paid','Réglées'],['events','Événements']] as Array<[Queue,string]>).map(([key,label]) => <button key={key} type="button" onClick={() => setQueue(key)} className={queue === key ? styles.filterButtonActive : styles.filterButton}>{label}</button>)}</div>
        <div className={styles.viewSwitcher}><button type="button" className={styles.viewButton} data-active={mode === 'cards'} onClick={() => setMode('cards')} aria-label="Cartes"><Grid2X2 size={18} /></button><button type="button" className={styles.viewButton} data-active={mode === 'table'} onClick={() => setMode('table')} aria-label="Tableau"><LayoutList size={18} /></button></div>
      </section>

      {queue === 'events' ? <EventFeed events={events} contractMap={contractMap} /> : visibleInvoices.length === 0 ? <Empty title="Aucune facture dans cette file" text="Aucun élément ne correspond actuellement au statut ou à la recherche sélectionnée." /> : mode === 'cards' ? <div className={styles.queueGrid}>{visibleInvoices.map((invoice) => <InvoiceCard key={String(invoice.id)} invoice={invoice} contract={invoice.contract_id != null ? contractMap.get(String(invoice.contract_id)) : undefined} />)}</div> : <InvoiceTable invoices={visibleInvoices} contractMap={contractMap} />}
    </div>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className={styles.kpiCard}><div className={styles.kpiTop}><span>{label}</span><span className={styles.kpiIcon}><FileText size={17} /></span></div><strong>{value}</strong><small>{sub}</small></div> }

function InvoiceCard({ invoice, contract }: { invoice: BillingInvoice; contract?: BillingContract }) {
  const open = Math.max(0, amount(invoice.amount) - amount(invoice.amount_paid))
  return <article className={styles.invoiceCard}><div className={styles.invoiceCardHeader}><div><strong>{invoice.invoice_reference || invoice.invoice_label || `Facture #${invoice.id}`}</strong><span>{contract ? `${familyLabel(contract)} · ${contractLabel(contract)}` : `Contrat #${invoice.contract_id || '—'}`}</span></div><Status status={isOverdue(invoice) ? 'overdue' : normalizedStatus(invoice.status)} /></div><div className={styles.invoiceAmounts}><div><span>Montant</span><strong>{formatDh(invoice.amount)}</strong></div><div><span>Encaissé</span><strong>{formatDh(invoice.amount_paid)}</strong></div><div><span>Ouvert</span><strong>{formatDh(open)}</strong></div></div><div className={styles.balanceRow}><span>{agingLabel(invoice)}</span><strong>{formatDate(invoice.due_date)}</strong></div>{invoice.contract_id ? <Link className={styles.primaryLink} href={`/contracts/${invoice.contract_id}/activation`}>Ouvrir le contrat <ArrowRight size={14} /></Link> : null}</article>
}

function InvoiceTable({ invoices, contractMap }: { invoices: BillingInvoice[]; contractMap: Map<string, BillingContract> }) {
  return <section className={styles.tablePanel}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Référence</th><th>Client / contrat</th><th>Montant</th><th>Encaissé</th><th>Ouvert</th><th>Situation</th><th>Échéance</th><th>Action</th></tr></thead><tbody>{invoices.map((invoice) => { const contract = invoice.contract_id != null ? contractMap.get(String(invoice.contract_id)) : undefined; return <tr key={String(invoice.id)}><td><strong>{invoice.invoice_reference || invoice.invoice_label || `#${invoice.id}`}</strong></td><td><div className={styles.tableIdentity}><strong>{contract ? familyLabel(contract) : 'Famille non définie'}</strong><span>{contract ? contractLabel(contract) : `Contrat #${invoice.contract_id || '—'}`}</span></div></td><td>{formatDh(invoice.amount)}</td><td>{formatDh(invoice.amount_paid)}</td><td><strong>{formatDh(Math.max(0, amount(invoice.amount)-amount(invoice.amount_paid)))}</strong></td><td><Status status={isOverdue(invoice) ? 'overdue' : normalizedStatus(invoice.status)} /></td><td>{formatDate(invoice.due_date)}</td><td>{invoice.contract_id ? <Link className={styles.primaryLink} href={`/contracts/${invoice.contract_id}/activation`}>Ouvrir</Link> : '—'}</td></tr> })}</tbody></table></div></section>
}

function EventFeed({ events, contractMap }: { events: BillingFinanceEvent[]; contractMap: Map<string, BillingContract> }) {
  if (!events.length) return <Empty title="Aucun événement financier" text="Aucun mouvement financier n’est actuellement disponible." />
  return <section className={styles.panel}><div className={styles.eventList}>{events.map((event) => { const contract = event.contract_id != null ? contractMap.get(String(event.contract_id)) : undefined; return <div className={styles.eventItem} key={String(event.id)}><div className={styles.eventItemTop}><strong>{eventLabel(event.event_type)}</strong><span>{formatDate(event.created_at, true)}</span></div><span>{contract ? `${familyLabel(contract)} · ${contractLabel(contract)}` : `Contrat #${event.contract_id || '—'}`}</span><strong>{formatDh(event.amount)}</strong>{event.note ? <small>{event.note}</small> : null}{event.contract_id ? <Link href={`/contracts/${event.contract_id}/activation`}>Ouvrir le contexte</Link> : null}</div> })}</div></section>
}

function Status({ status }: { status: string }) { const normalized = normalizedStatus(status); const className = normalized === 'paid' ? styles.statusPillGreen : normalized === 'overdue' ? styles.statusPillRed : ['pending','partial'].includes(normalized) ? styles.statusPillAmber : styles.statusPillSlate; return <span className={className}>{statusLabel(normalized)}</span> }
function Empty({ title, text }: { title: string; text: string }) { return <div className={styles.emptyState}><FileText size={25} /><strong>{title}</strong><p>{text}</p></div> }
