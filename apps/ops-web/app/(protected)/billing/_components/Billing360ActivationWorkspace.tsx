'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileText, Grid2X2, LayoutList, Search, ShieldCheck, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import styles from './billing360.module.css'
import {
  ActionLink as CoreActionLink,
  CommandHeader,
  CommercialCoreBar,
  TruthNotice,
  WorkspaceNav,
} from '@/components/commercial-core/CommercialCoreShell'
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
      <CommercialCoreBar active="billing" />

      <CommandHeader
        eyebrow="SANILA Billing Control · Collections"
        title="Une file d’encaissement claire, classée par urgence et exposition."
        description="Cette vue opérationnelle organise les factures en attente, en retard ou réglées et ouvre le contexte contractuel avant toute action."
        actions={<><CoreActionLink href="/billing">Accounts Receivable</CoreActionLink><CoreActionLink href="/billing/overview">Vue exécutive</CoreActionLink><CoreActionLink href="/contracts" primary>Ouvrir les contrats</CoreActionLink></>}
        aside={<div style={{ display: 'grid', gap: 10 }}><span style={{ color: '#bfdbfe', fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>Montant ouvert</span><strong style={{ fontSize: 36, letterSpacing: '-.04em' }}>{formatDh(totals.open)}</strong><span style={{ color: '#dbeafe', fontSize: 11 }}>{formatDh(totals.overdueAmount)} déjà en retard.</span></div>}
        source="File opérationnelle calculée à partir des statuts et échéances existants."
      />

      <WorkspaceNav items={[
        { href: '/billing', label: 'Accounts Receivable', description: 'Exposition & actions' },
        { href: '/billing/overview', label: 'Executive Overview', description: 'Position financière' },
        { href: '/billing/activation', label: 'Collections', description: 'Files d’encaissement' },
        { href: '/contracts', label: 'Contrats', description: 'Base contractuelle' },
      ]} activeHref="/billing/activation" />

      {dataWarnings.length ? <TruthNotice title="Couverture partielle" tone="attention">{dataWarnings.join(' ')}</TruthNotice> : null}

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
