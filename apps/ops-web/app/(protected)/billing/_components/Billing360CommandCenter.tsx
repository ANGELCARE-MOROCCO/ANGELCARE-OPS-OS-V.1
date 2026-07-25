'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Grid2X2,
  LayoutList,
  ReceiptText,
  Search,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import styles from './billing360.module.css'
import {
  ActionLink as CoreActionLink,
  CommandHeader,
  CommercialCoreBar,
  Metric,
  MetricStrip,
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
  familyFromContract,
  familyLabel,
  formatDate,
  formatDh,
  isOverdue,
  isPaid,
  normalizedStatus,
  statusLabel,
} from './billing360.types'

type Account = {
  contract: BillingContract
  invoices: BillingInvoice[]
  events: BillingFinanceEvent[]
  contractValue: number
  invoiced: number
  paid: number
  open: number
  overdueAmount: number
  overdueCount: number
  latestEvent: BillingFinanceEvent | null
}

type ViewKey = 'all' | 'open' | 'overdue' | 'paid' | 'uninvoiced' | 'activation' | 'events'
type DisplayMode = 'cards' | 'table'

export default function Billing360CommandCenter({
  contracts,
  invoices,
  events,
  dataWarnings,
}: {
  contracts: BillingContract[]
  invoices: BillingInvoice[]
  events: BillingFinanceEvent[]
  dataWarnings: string[]
}) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewKey>('all')
  const [display, setDisplay] = useState<DisplayMode>('cards')

  const accounts = useMemo(() => buildAccounts(contracts, invoices, events), [contracts, invoices, events])
  const totals = useMemo(() => summarize(accounts, invoices), [accounts, invoices])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return accounts.filter((account) => {
      if (!matchesView(account, view)) return false
      if (!term) return true
      const family = familyFromContract(account.contract)
      const haystack = [
        contractLabel(account.contract),
        familyLabel(account.contract),
        family?.parent_name,
        family?.city,
        account.contract.service_type,
        ...account.invoices.flatMap((invoice) => [invoice.invoice_reference, invoice.invoice_label]),
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(term)
    })
  }, [accounts, query, view])

  const priorities = useMemo(() => accounts
    .filter((account) => account.overdueAmount > 0 || (account.open > 0 && account.invoices.length > 0))
    .sort((a, b) => (b.overdueAmount - a.overdueAmount) || (b.open - a.open))
    .slice(0, 8), [accounts])

  const dataQuality = useMemo(() => collectDataQuality(accounts, invoices), [accounts, invoices])
  const collectionRate = totals.invoiced > 0 ? Math.min(100, Math.max(0, (totals.paid / totals.invoiced) * 100)) : 0

  const aging = useMemo(() => {
    const buckets = { future: 0, today: 0, late7: 0, late30: 0, late30plus: 0, paid: 0 }
    invoices.forEach((invoice) => {
      const outstanding = Math.max(0, amount(invoice.amount) - amount(invoice.amount_paid))
      if (isPaid(invoice)) { buckets.paid += amount(invoice.amount); return }
      const label = agingLabel(invoice)
      if (label === 'À venir' || label === 'Sans échéance') buckets.future += outstanding
      else if (label === 'Échéance aujourd’hui') buckets.today += outstanding
      else if (label === '1–7 jours de retard') buckets.late7 += outstanding
      else if (label === '8–30 jours de retard') buckets.late30 += outstanding
      else buckets.late30plus += outstanding
    })
    return buckets
  }, [invoices])

  const views: Array<{ key: ViewKey; label: string }> = [
    { key: 'all', label: 'Vue consolidée' },
    { key: 'open', label: 'À encaisser' },
    { key: 'overdue', label: 'En retard' },
    { key: 'paid', label: 'Payées' },
    { key: 'uninvoiced', label: 'Contrats non facturés' },
    { key: 'activation', label: 'Activation requise' },
    { key: 'events', label: 'Événements récents' },
  ]

  const workspaceItems = [
    { href: '/billing', label: 'Accounts Receivable', description: 'Exposition & actions' },
    { href: '/billing/overview', label: 'Executive Overview', description: 'Position financière' },
    { href: '/billing/activation', label: 'Collections', description: 'Files d’encaissement' },
    { href: '/contracts', label: 'Contrats', description: 'Base contractuelle' },
  ]

  return (
    <div className={styles.root}>
      <CommercialCoreBar active="billing" />

      <CommandHeader
        eyebrow="SANILA Billing Control · Accounts Receivable"
        title="Ce qui reste à encaisser, ce qui est en retard et où intervenir maintenant."
        description="Billing est recentré sur le suivi des comptes contractuels : montant facturé, encaissé, solde ouvert, échéances et priorités de recouvrement."
        actions={
          <>
            <CoreActionLink href="/billing/overview">Vue exécutive</CoreActionLink>
            <CoreActionLink href="/billing/activation" primary>Ouvrir les collections</CoreActionLink>
            <CoreActionLink href="/contracts">Contrats</CoreActionLink>
          </>
        }
        aside={
          <div style={{ display: 'grid', gap: 10 }}>
            <span style={{ color: '#bfdbfe', fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>Exposition ouverte</span>
            <strong style={{ fontSize: 34, letterSpacing: '-.04em' }}>{formatDh(totals.open)}</strong>
            <span style={{ color: '#dbeafe', fontSize: 11, lineHeight: 1.5 }}>{totals.overdueCount} facture(s) en retard · {formatDh(totals.overdueAmount)} exposés.</span>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${collectionRate}%` }} /></div>
            <span style={{ color: '#bfdbfe', fontSize: 10, fontWeight: 800 }}>Taux d’encaissement visible : {Math.round(collectionRate)}%</span>
          </div>
        }
        source="Sources : contracts, billing_invoices et contract_finance_events. Aucune écriture financière modifiée."
      />

      <WorkspaceNav items={workspaceItems} activeHref="/billing" />

      {dataWarnings.length > 0 ? (
        <TruthNotice title="Couverture de données partielle" tone="attention">{dataWarnings.join(' ')}</TruthNotice>
      ) : null}

      <MetricStrip>
        <Metric label="Valeur contractuelle" value={formatDh(totals.contractValue)} context={`${contracts.length} contrats`} tone="neutral" />
        <Metric label="Total facturé" value={formatDh(totals.invoiced)} context={`${invoices.length} factures`} tone="neutral" />
        <Metric label="Total encaissé" value={formatDh(totals.paid)} context={`${totals.paidCount} factures réglées`} tone="good" />
        <Metric label="Solde ouvert" value={formatDh(totals.open)} context={`${totals.openCount} comptes`} tone={totals.open ? 'attention' : 'good'} />
        <Metric label="En retard" value={formatDh(totals.overdueAmount)} context={`${totals.overdueCount} factures`} tone={totals.overdueCount ? 'risk' : 'good'} />
        <Metric label="Contrats actifs" value={totals.activeContracts} context="Signed, active ou confirmed" tone="good" />
      </MetricStrip>

      <section className={styles.lifecycle} aria-label="Aging des encaissements">
        <Lifecycle index="01" label="À venir / sans échéance" value={formatDh(aging.future)} />
        <Lifecycle index="02" label="Échéance aujourd’hui" value={formatDh(aging.today)} />
        <Lifecycle index="03" label="1–7 jours" value={formatDh(aging.late7)} />
        <Lifecycle index="04" label="8–30 jours" value={formatDh(aging.late30)} />
        <Lifecycle index="05" label="Plus de 30 jours" value={formatDh(aging.late30plus)} />
        <Lifecycle index="06" label="Réglé" value={formatDh(aging.paid)} />
      </section>

      <section className={styles.controlBar} aria-label="Navigation du portefeuille financier">
        <label className={styles.searchBox}>
          <Search size={17} />
          <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Famille, contrat, facture ou service…" />
        </label>
        <div className={styles.filterTabs}>
          {views.map((item) => (
            <button key={item.key} type="button" onClick={() => setView(item.key)} className={view === item.key ? styles.filterButtonActive : styles.filterButton}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.contentColumn}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>{view === 'events' ? 'Événements financiers' : 'Comptes contractuels & recouvrement'}</h2>
              <p>{view === 'events' ? 'Traçabilité des mouvements disponibles.' : 'Une ligne représente un compte contractuel et son exposition financière visible.'}</p>
            </div>
            <span className={styles.resultCount}>{view === 'events' ? events.length : filtered.length} résultat(s)</span>
          </div>

          {view === 'events' ? (
            <FinanceEventFeed events={events} contracts={contracts} />
          ) : filtered.length === 0 ? (
            <EmptyState title="Aucun compte dans cette vue" text="Aucun contrat ne correspond actuellement au filtre ou à la recherche sélectionnée." />
          ) : (
            <AccountTable accounts={filtered} />
          )}
        </div>

        <aside className={styles.rail}>
          <section className={styles.railPanel}>
            <div className={styles.panelHeader}><h2>Priorités de recouvrement</h2><p>Retards et soldes ouverts classés par exposition.</p></div>
            {priorities.length > 0 ? (
              <div className={styles.priorityList}>{priorities.map((account) => <PriorityItem key={String(account.contract.id)} account={account} />)}</div>
            ) : (
              <EmptyState title="Aucune priorité critique" text="Aucune exposition ouverte significative n’est visible." compact />
            )}
          </section>

          <TruthNotice title="Séparation financière" tone="attention">
            La consommation contractuelle décrit un service ou des sessions utilisés. Elle ne représente pas un paiement ni un mouvement bancaire.
          </TruthNotice>

          <section className={styles.railPanel}>
            <div className={styles.panelHeader}><h2>Qualité des données</h2><p>Observations uniquement — aucune correction automatique.</p></div>
            {dataQuality.length > 0 ? (
              <div className={styles.qualityList}>{dataQuality.slice(0, 6).map((item, index) => <div key={`${item.title}-${index}`} className={styles.qualityItem}><strong>{item.title}</strong><span>{item.detail}</span></div>)}</div>
            ) : (
              <EmptyState title="Aucune incohérence évidente" text="Les contrôles visibles n’ont détecté aucun signal majeur." compact />
            )}
          </section>
        </aside>
      </section>
    </div>
  )
}

function Kpi({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return <div className={styles.kpiCard}><div className={styles.kpiTop}><span>{label}</span><span className={styles.kpiIcon}>{icon}</span></div><strong>{value}</strong><small>{sub}</small></div>
}

function Lifecycle({ index, label, value }: { index: string; label: string; value: string }) {
  return <div className={styles.lifecycleStep}><span className={styles.lifecycleIndex}>{index}</span><div><strong>{label}</strong><span>{value}</span></div></div>
}

function AccountCard({ account }: { account: Account }) {
  const family = familyFromContract(account.contract)
  const status = account.overdueCount > 0 ? 'overdue' : account.open > 0 ? 'pending' : account.invoices.length > 0 ? 'paid' : 'draft'
  const latestDue = account.invoices.filter((invoice) => !isPaid(invoice) && invoice.due_date).sort((a, b) => new Date(String(a.due_date)).getTime() - new Date(String(b.due_date)).getTime())[0]
  return (
    <article className={styles.accountCard}>
      <div className={styles.accountHead}>
        <div className={styles.accountIdentity}>
          <span className={styles.accountMonogram}>{initials(familyLabel(account.contract))}</span>
          <div className={styles.accountTitle}><strong>{familyLabel(account.contract)}</strong><span>{contractLabel(account.contract)} · {account.contract.service_type || 'Service non défini'}</span></div>
        </div>
        <StatusPill status={status} />
      </div>
      <div className={styles.accountNumbers}>
        <NumberCell label="Valeur" value={formatDh(account.contractValue)} />
        <NumberCell label="Facturé" value={formatDh(account.invoiced)} />
        <NumberCell label="Encaissé" value={formatDh(account.paid)} />
      </div>
      <div className={styles.balanceRow}><span>Solde ouvert</span><strong>{formatDh(account.open)}</strong></div>
      {account.overdueCount > 0 ? <div className={styles.cardAlert}><AlertTriangle size={15} /><span>{account.overdueCount} facture(s) en retard · {formatDh(account.overdueAmount)} exposés{latestDue ? ` · ${agingLabel(latestDue)}` : ''}</span></div> : null}
      <div className={styles.cardActions}>
        <Link className={styles.primaryLink} href={`/contracts/${account.contract.id}/activation`}>Activation finance <ArrowRight size={14} /></Link>
        <Link className={styles.quietLink} href={`/contracts/${account.contract.id}`}>Dossier contrat</Link>
        {account.contract.family_id ? <Link className={styles.secondaryLink} href={`/families/${account.contract.family_id}`}>Famille</Link> : null}
      </div>
    </article>
  )
}

function AccountTable({ accounts }: { accounts: Account[] }) {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Client</th><th>Contrat</th><th>Valeur</th><th>Facturé</th><th>Encaissé</th><th>Solde</th><th>Factures</th><th>Situation</th><th>Action</th></tr></thead>
          <tbody>{accounts.map((account) => (
            <tr key={String(account.contract.id)}>
              <td><div className={styles.tableIdentity}><strong>{familyLabel(account.contract)}</strong><span>{familyFromContract(account.contract)?.parent_name || 'Parent non renseigné'}</span></div></td>
              <td>{contractLabel(account.contract)}</td>
              <td>{formatDh(account.contractValue)}</td>
              <td>{formatDh(account.invoiced)}</td>
              <td>{formatDh(account.paid)}</td>
              <td><strong>{formatDh(account.open)}</strong></td>
              <td>{account.invoices.length}</td>
              <td><StatusPill status={account.overdueCount ? 'overdue' : account.open ? 'pending' : account.invoices.length ? 'paid' : 'draft'} /></td>
              <td><Link className={styles.primaryLink} href={`/contracts/${account.contract.id}/activation`}>Ouvrir</Link></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  )
}

function PriorityItem({ account }: { account: Account }) {
  const oldest = account.invoices.filter((invoice) => isOverdue(invoice)).sort((a, b) => new Date(String(a.due_date)).getTime() - new Date(String(b.due_date)).getTime())[0]
  return (
    <div className={styles.priorityItem}>
      <div className={styles.priorityItemTop}><strong>{familyLabel(account.contract)}</strong><StatusPill status={account.overdueCount > 0 ? 'overdue' : 'pending'} /></div>
      <span>{contractLabel(account.contract)}</span>
      <strong>{formatDh(account.overdueAmount || account.open)} à traiter</strong>
      <small>{oldest ? `${agingLabel(oldest)} · échéance ${formatDate(oldest.due_date)}` : 'Solde ouvert sans retard identifié'}</small>
      <Link href={`/contracts/${account.contract.id}/activation`}>Ouvrir le studio financier</Link>
    </div>
  )
}

function FinanceEventFeed({ events, contracts }: { events: BillingFinanceEvent[]; contracts: BillingContract[] }) {
  const contractMap = new Map(contracts.map((contract) => [String(contract.id), contract]))
  if (!events.length) return <EmptyState title="Aucun événement financier" text="Aucun mouvement financier n’est disponible dans le périmètre chargé." />
  return (
    <section className={styles.panel}>
      <div className={styles.eventList}>{events.slice(0, 30).map((event) => {
        const contract = event.contract_id != null ? contractMap.get(String(event.contract_id)) : undefined
        return <div className={styles.eventItem} key={String(event.id)}><div className={styles.eventItemTop}><strong>{eventLabel(event.event_type)}</strong><span>{formatDate(event.created_at, true)}</span></div><span>{contract ? `${familyLabel(contract)} · ${contractLabel(contract)}` : `Contrat #${event.contract_id || '—'}`}</span><strong>{formatDh(event.amount)}</strong>{event.note ? <small>{event.note}</small> : null}{event.contract_id ? <Link href={`/contracts/${event.contract_id}/activation`}>Consulter le contexte</Link> : null}</div>
      })}</div>
    </section>
  )
}

function StatusPill({ status }: { status: string }) {
  const normalized = normalizedStatus(status)
  const className = normalized === 'paid' ? styles.statusPillGreen : normalized === 'overdue' ? styles.statusPillRed : normalized === 'pending' || normalized === 'partial' ? styles.statusPillAmber : normalized === 'active' || normalized === 'signed' || normalized === 'confirmed' ? styles.statusPillBlue : styles.statusPillSlate
  return <span className={className}>{statusLabel(normalized)}</span>
}

function NumberCell({ label, value }: { label: string; value: string }) {
  return <div className={styles.numberCell}><span>{label}</span><strong>{value}</strong></div>
}

function EmptyState({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return <div className={styles.emptyState} style={compact ? { minHeight: 150 } : undefined}><ReceiptText size={24} /><strong>{title}</strong><p>{text}</p></div>
}

function buildAccounts(contracts: BillingContract[], invoices: BillingInvoice[], events: BillingFinanceEvent[]): Account[] {
  return contracts.map((contract) => {
    const contractInvoices = invoices.filter((invoice) => String(invoice.contract_id) === String(contract.id))
    const contractEvents = events.filter((event) => String(event.contract_id) === String(contract.id))
    const invoiced = contractInvoices.reduce((sum, invoice) => sum + amount(invoice.amount), 0)
    const paid = contractInvoices.reduce((sum, invoice) => sum + amount(invoice.amount_paid), 0)
    const overdueInvoices = contractInvoices.filter((invoice) => isOverdue(invoice))
    return {
      contract,
      invoices: contractInvoices,
      events: contractEvents,
      contractValue: amount(contract.contract_value || contract.monthly_amount),
      invoiced,
      paid,
      open: Math.max(0, invoiced - paid),
      overdueAmount: overdueInvoices.reduce((sum, invoice) => sum + Math.max(0, amount(invoice.amount) - amount(invoice.amount_paid)), 0),
      overdueCount: overdueInvoices.length,
      latestEvent: contractEvents[0] || null,
    }
  }).sort((a, b) => (b.overdueAmount - a.overdueAmount) || (b.open - a.open) || (new Date(String(b.contract.created_at || 0)).getTime() - new Date(String(a.contract.created_at || 0)).getTime()))
}

function summarize(accounts: Account[], invoices: BillingInvoice[]) {
  const invoiced = invoices.reduce((sum, invoice) => sum + amount(invoice.amount), 0)
  const paid = invoices.reduce((sum, invoice) => sum + amount(invoice.amount_paid), 0)
  const overdueInvoices = invoices.filter((invoice) => isOverdue(invoice))
  return {
    contractValue: accounts.reduce((sum, account) => sum + account.contractValue, 0),
    invoiced,
    paid,
    open: Math.max(0, invoiced - paid),
    overdueAmount: overdueInvoices.reduce((sum, invoice) => sum + Math.max(0, amount(invoice.amount) - amount(invoice.amount_paid)), 0),
    overdueCount: overdueInvoices.length,
    pendingCount: invoices.filter((invoice) => ['pending', 'partial'].includes(normalizedStatus(invoice.status))).length,
    paidCount: invoices.filter(isPaid).length,
    openCount: accounts.filter((account) => account.open > 0).length,
    activeContracts: accounts.filter((account) => ['active', 'signed', 'confirmed'].includes(normalizedStatus(account.contract.status))).length,
  }
}

function matchesView(account: Account, view: ViewKey): boolean {
  if (view === 'all') return true
  if (view === 'open') return account.open > 0
  if (view === 'overdue') return account.overdueCount > 0
  if (view === 'paid') return account.invoices.length > 0 && account.open === 0
  if (view === 'uninvoiced') return account.invoices.length === 0
  if (view === 'activation') return ['pending', 'partial', 'overdue'].includes(normalizedStatus(account.contract.payment_status)) || account.invoices.length === 0
  return true
}

function collectDataQuality(accounts: Account[], invoices: BillingInvoice[]) {
  const observations: Array<{ title: string; detail: string }> = []
  accounts.forEach((account) => {
    if (!familyFromContract(account.contract)) observations.push({ title: `${contractLabel(account.contract)} sans famille visible`, detail: 'Le contrat ne présente pas de contexte familial dans la relation chargée.' })
    if (['active', 'signed', 'confirmed'].includes(normalizedStatus(account.contract.status)) && account.invoices.length === 0) observations.push({ title: `${contractLabel(account.contract)} non facturé`, detail: 'Contrat actif sans facture visible dans le périmètre chargé.' })
  })
  invoices.forEach((invoice) => {
    if (!invoice.due_date && !isPaid(invoice)) observations.push({ title: `${invoice.invoice_reference || `Facture #${invoice.id}`} sans échéance`, detail: 'Aucune date d’échéance n’est visible pour cette facture ouverte.' })
    if (isPaid(invoice) && amount(invoice.amount_paid) <= 0) observations.push({ title: `${invoice.invoice_reference || `Facture #${invoice.id}`} réglée sans montant`, detail: 'Le statut est réglé, mais aucun montant encaissé positif n’est visible.' })
    if (amount(invoice.amount_paid) > amount(invoice.amount)) observations.push({ title: `${invoice.invoice_reference || `Facture #${invoice.id}`} surpayée`, detail: 'Le montant encaissé visible dépasse le montant facturé.' })
  })
  return observations
}

function initials(value: string): string {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC'
}
