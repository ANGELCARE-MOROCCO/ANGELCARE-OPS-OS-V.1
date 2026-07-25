'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  History,
  MapPin,
  ReceiptText,
  Route,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { BillingConsumption, BillingFinanceEvent, BillingInvoice, BillingMission } from '@/app/(protected)/billing/_components/billing360.types'
import {
  agingLabel,
  amount,
  eventLabel,
  formatDate,
  formatDh,
  isOverdue,
  isPaid,
  normalizedStatus,
  statusLabel,
} from '@/app/(protected)/billing/_components/billing360.types'
import styles from './contract-finance-studio.module.css'
import {
  ActionLink as CoreActionLink,
  CommandHeader,
  CommercialCoreBar,
  TruthNotice,
  WorkspaceNav,
} from '@/components/commercial-core/CommercialCoreShell'

type ContractFamily = { family_name?: string | null; parent_name?: string | null; city?: string | null; phone?: string | null }
type ContractRecord = Record<string, unknown> & {
  id: string | number
  family_id?: string | number | null
  contract_reference?: string | null
  package_label?: string | null
  service_type?: string | null
  status?: string | null
  payment_status?: string | null
  billing_cycle?: string | null
  risk_level?: string | null
  contract_value?: number | string | null
  monthly_amount?: number | string | null
  amount_paid?: number | string | null
  total_sessions?: number | string | null
  sessions_used?: number | string | null
  next_billing_date?: string | null
  renewal_date?: string | null
  start_date?: string | null
  end_date?: string | null
  families?: ContractFamily | ContractFamily[] | null
}

type Tab = 'overview' | 'invoices' | 'payments' | 'consumption' | 'events'

type Action = (formData: FormData) => Promise<void>

export default function ContractFinanceStudio({
  contract,
  invoices,
  events,
  consumption,
  missions,
  createInvoiceAction,
  markInvoicePaidAction,
  logConsumptionAction,
  dataWarnings,
}: {
  contract: ContractRecord
  invoices: BillingInvoice[]
  events: BillingFinanceEvent[]
  consumption: BillingConsumption[]
  missions: BillingMission[]
  createInvoiceAction: Action
  markInvoicePaidAction: Action
  logConsumptionAction: Action
  dataWarnings: string[]
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const family = Array.isArray(contract.families) ? contract.families[0] : contract.families
  const reference = contract.contract_reference || contract.package_label || `Contrat #${contract.id}`
  const familyName = family?.family_name || family?.parent_name || 'Famille non définie'
  const contractValue = amount(contract.contract_value || contract.monthly_amount)
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + amount(invoice.amount), 0)
  const totalPaid = invoices.reduce((sum, invoice) => sum + amount(invoice.amount_paid), 0)
  const openAmount = Math.max(0, totalInvoiced - totalPaid)
  const overdueInvoices = invoices.filter((invoice) => isOverdue(invoice))
  const consumedValue = consumption.reduce((sum, item) => sum + amount(item.amount_value), 0)
  const totalSessions = amount(contract.total_sessions)
  const sessionsUsed = amount(contract.sessions_used)
  const sessionsRemaining = Math.max(0, totalSessions - sessionsUsed)
  const dataQuality = useMemo(() => collectDataQuality(invoices, contract), [contract, invoices])
  const tabs: Array<{ key: Tab; label: string; icon: ReactNode }> = [
    { key: 'overview', label: 'Vue financière', icon: <BriefcaseBusiness size={16} /> },
    { key: 'invoices', label: 'Factures', icon: <FileText size={16} /> },
    { key: 'payments', label: 'Paiements', icon: <Banknote size={16} /> },
    { key: 'consumption', label: 'Consommation', icon: <ClipboardList size={16} /> },
    { key: 'events', label: 'Événements financiers', icon: <History size={16} /> },
  ]

  return (
    <div className={styles.root}>
      <CommercialCoreBar active="billing" />

      <CommandHeader
        eyebrow="SANILA Billing Control · Contract Finance Dossier"
        title={reference}
        description={`${familyName} · ${String(contract.service_type || 'Service non défini')} · cycle ${String(contract.billing_cycle || 'one_time').replaceAll('_',' ')}`}
        actions={<><CoreActionLink href="/billing">Accounts Receivable</CoreActionLink><CoreActionLink href="/billing/activation">Collections</CoreActionLink><CoreActionLink href={`/contracts/${contract.id}`} primary>Contrat</CoreActionLink></>}
        aside={<div style={{ display: 'grid', gap: 10 }}><span style={{ color: '#bfdbfe', fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>Solde ouvert du contrat</span><strong style={{ fontSize: 36, letterSpacing: '-.04em' }}>{formatDh(openAmount)}</strong><span style={{ color: '#dbeafe', fontSize: 11 }}>{overdueInvoices.length} facture(s) en retard · statut {statusLabel(contract.payment_status)}</span></div>}
        source={`${missions.length} mission(s) liée(s) · ${family?.city || 'Ville non renseignée'} · actions backend existantes préservées.`}
      />

      <WorkspaceNav items={[
        { href: '/billing', label: 'Accounts Receivable', description: 'Exposition & actions' },
        { href: '/billing/overview', label: 'Executive Overview', description: 'Position financière' },
        { href: '/billing/activation', label: 'Collections', description: 'Files d’encaissement' },
        { href: '/contracts', label: 'Contrats', description: 'Base contractuelle' },
      ]} activeHref="/contracts" />

      {dataWarnings.length ? <TruthNotice title="Couverture partielle" tone="attention">{dataWarnings.join(' ')}</TruthNotice> : null}

      <section className={styles.kpis}>
        <Kpi icon={<BriefcaseBusiness size={17} />} label="Valeur du contrat" value={formatDh(contractValue)} sub="Base contractuelle visible" />
        <Kpi icon={<FileText size={17} />} label="Facturé" value={formatDh(totalInvoiced)} sub={`${invoices.length} facture(s)`} />
        <Kpi icon={<CheckCircle2 size={17} />} label="Encaissé" value={formatDh(totalPaid)} sub="Montant enregistré" />
        <Kpi icon={<WalletCards size={17} />} label="Solde ouvert" value={formatDh(openAmount)} sub="Reste à sécuriser" />
        <Kpi icon={<AlertTriangle size={17} />} label="Retards" value={String(overdueInvoices.length)} sub="Factures exposées" />
        <Kpi icon={<ClipboardList size={17} />} label="Consommation" value={formatDh(consumedValue)} sub={`${sessionsUsed}/${totalSessions || '—'} sessions`} />
      </section>

      <section className={styles.continuity}>
        <Continuity icon={<BriefcaseBusiness size={15} />} label="Famille" value={familyName} />
        <Continuity icon={<ShieldCheck size={15} />} label="Contrat" value={statusLabel(contract.status)} />
        <Continuity icon={<Route size={15} />} label="Missions" value={String(missions.length)} />
        <Continuity icon={<ClipboardList size={15} />} label="Consommation" value={totalSessions > 0 ? `${sessionsUsed}/${totalSessions}` : `${consumption.length} entrées`} />
        <Continuity icon={<ReceiptText size={15} />} label="Factures" value={String(invoices.length)} />
        <Continuity icon={<Banknote size={15} />} label="Encaissement" value={statusLabel(contract.payment_status)} />
      </section>

      <nav className={styles.tabs} aria-label="Espaces du studio financier">
        {tabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={tab === item.key ? styles.tabActive : styles.tab}>{item.icon}{item.label}</button>)}
      </nav>

      <div className={styles.workspace}>
        {tab === 'overview' ? <Overview contract={contract} familyName={familyName} familyId={contract.family_id} invoices={invoices} events={events} missions={missions} dataQuality={dataQuality} openAmount={openAmount} sessionsRemaining={sessionsRemaining} /> : null}
        {tab === 'invoices' ? <InvoicesWorkspace contract={contract} familyName={familyName} invoices={invoices} createInvoiceAction={createInvoiceAction} /> : null}
        {tab === 'payments' ? <PaymentsWorkspace contract={contract} invoices={invoices} markInvoicePaidAction={markInvoicePaidAction} dataQuality={dataQuality} /> : null}
        {tab === 'consumption' ? <ConsumptionWorkspace contract={contract} consumption={consumption} missions={missions} logConsumptionAction={logConsumptionAction} /> : null}
        {tab === 'events' ? <EventsWorkspace events={events} /> : null}
      </div>
    </div>
  )
}

function Overview({ contract, familyName, familyId, invoices, events, missions, dataQuality, openAmount, sessionsRemaining }: { contract: ContractRecord; familyName: string; familyId?: string | number | null; invoices: BillingInvoice[]; events: BillingFinanceEvent[]; missions: BillingMission[]; dataQuality: Array<{ title: string; detail: string }>; openAmount: number; sessionsRemaining: number }) {
  return <div className={styles.financeGrid}><div className={styles.workspace}><section className={styles.panel}><Header title="Dossier financier du contrat" subtitle="Contexte contractuel et exposition visible avant toute action." tag="Read-first" /><div className={styles.infoList}><Info label="Famille" value={familyName} /><Info label="Référence" value={String(contract.contract_reference || contract.package_label || `#${contract.id}`)} /><Info label="Service" value={String(contract.service_type || '—')} /><Info label="Cycle de facturation" value={String(contract.billing_cycle || 'one_time').replaceAll('_',' ')} /><Info label="Statut contrat" value={statusLabel(contract.status)} /><Info label="Statut paiement" value={statusLabel(contract.payment_status)} /><Info label="Prochaine facturation" value={formatDate(contract.next_billing_date)} /><Info label="Renouvellement" value={formatDate(contract.renewal_date || contract.end_date)} /><Info label="Sessions restantes" value={String(sessionsRemaining)} /></div><div className={styles.inlineActions} style={{ marginTop: 15 }}><Link className={styles.link} href={`/contracts/${contract.id}`}>Ouvrir le dossier contrat <ArrowRight size={13} /></Link>{familyId ? <Link className={styles.linkQuiet} href={`/families/${familyId}`}>Dossier famille</Link> : null}</div></section><section className={styles.twoCol}><div className={styles.panel}><Header title="Missions liées" subtitle="Livraison opérationnelle rattachée au contrat." tag={`${missions.length}`} />{missions.length ? <div className={styles.missionList}>{missions.slice(0,8).map((mission) => <div className={styles.missionCard} key={String(mission.id)}><div className={styles.missionHead}><strong>{mission.mission_code || `Mission #${mission.id}`}</strong><Status status={mission.status || 'draft'} /></div><span>{mission.service_type || 'Service'} · {formatDate(mission.mission_date || mission.created_at)}</span><Link className={styles.linkQuiet} href={`/missions/${mission.id}`}>Ouvrir la mission</Link></div>)}</div> : <Empty title="Aucune mission liée" text="Aucune prestation opérationnelle n’est actuellement visible pour ce contrat." />}</div><div className={styles.panel}><Header title="Derniers mouvements" subtitle="Événements financiers récents." tag={`${events.length}`} />{events.length ? <div className={styles.eventList}>{events.slice(0,8).map((event) => <EventCard key={String(event.id)} event={event} />)}</div> : <Empty title="Aucun mouvement" text="Aucun événement financier n’est actuellement disponible." />}</div></section></div><aside className={styles.sidePanel}><Header title="Brief de contrôle" subtitle="Lecture honnête de la situation financière." tag="Manager" /><div className={styles.infoList}><Info label="Solde ouvert" value={formatDh(openAmount)} /><Info label="Factures" value={String(invoices.length)} /><Info label="Factures en retard" value={String(invoices.filter((invoice) => isOverdue(invoice)).length)} /><Info label="Risque contrat" value={String(contract.risk_level || 'normal')} /></div>{dataQuality.length ? <div className={styles.qualityList} style={{ marginTop: 15 }}>{dataQuality.map((item) => <div className={styles.qualityCard} key={item.title}><strong>{item.title}</strong><span>{item.detail}</span></div>)}</div> : <div className={styles.warning} style={{ marginTop: 15 }}><CheckCircle2 size={18} /><div><strong>Aucune incohérence évidente.</strong><br />Les contrôles de présentation n’ont détecté aucun signal majeur.</div></div>}</aside></div>
}

function InvoicesWorkspace({ contract, familyName, invoices, createInvoiceAction }: { contract: ContractRecord; familyName: string; invoices: BillingInvoice[]; createInvoiceAction: Action }) {
  const defaultAmount = String(contract.monthly_amount || contract.contract_value || 0)
  return <div className={styles.financeGrid}><section className={styles.panel}><Header title="Créer une facture contractuelle" subtitle="Le comportement d’enregistrement existant reste strictement inchangé." tag="Action existante" /><form action={createInvoiceAction} className={styles.formGrid}><input type="hidden" name="contract_id" value={String(contract.id)} /><Field name="invoice_label" label="Libellé de la facture" defaultValue="Facture contrat AngelCare" /><Field name="amount" label="Montant (Dh)" type="number" defaultValue={defaultAmount} /><Field name="due_date" label="Date d’échéance" type="date" /><label className={styles.fieldWide}><span>Notes</span><textarea className={styles.textarea} name="notes" /></label><div className={styles.formReview}><Review label="Contrat" value={String(contract.contract_reference || contract.package_label || `#${contract.id}`)} /><Review label="Client" value={familyName} /><Review label="Base proposée" value={formatDh(defaultAmount)} /></div><button className={styles.primaryButton} type="submit"><ReceiptText size={16} /> Créer la facture</button></form></section><aside className={styles.sidePanel}><Header title="Factures existantes" subtitle="Historique visible du contrat." tag={`${invoices.length}`} />{invoices.length ? <div className={styles.invoiceList}>{invoices.map((invoice) => <InvoiceCard invoice={invoice} key={String(invoice.id)} />)}</div> : <Empty title="Aucune facture liée" text="Ce contrat ne dispose actuellement d’aucun document de facturation visible." />}</aside></div>
}

function PaymentsWorkspace({ contract, invoices, markInvoicePaidAction, dataQuality }: { contract: ContractRecord; invoices: BillingInvoice[]; markInvoicePaidAction: Action; dataQuality: Array<{ title: string; detail: string }> }) {
  const openInvoices = invoices.filter((invoice) => !isPaid(invoice))
  return <div className={styles.financeGrid}><section className={styles.panel}><Header title="Règlements à enregistrer" subtitle="L’action existante enregistre le règlement intégral visible sur la facture sélectionnée." tag={`${openInvoices.length} ouvertes`} />{openInvoices.length ? <div className={styles.invoiceList}>{openInvoices.map((invoice) => <article className={styles.invoiceCard} key={String(invoice.id)}><div className={styles.invoiceHead}><div><strong>{invoice.invoice_reference || invoice.invoice_label || `Facture #${invoice.id}`}</strong><span>Échéance {formatDate(invoice.due_date)} · {agingLabel(invoice)}</span></div><Status status={isOverdue(invoice) ? 'overdue' : invoice.status || 'pending'} /></div><div className={styles.amountGrid}><AmountCell label="Facturé" value={formatDh(invoice.amount)} /><AmountCell label="Déjà encaissé" value={formatDh(invoice.amount_paid)} /><AmountCell label="Montant transmis" value={formatDh(invoice.amount)} /></div><div className={styles.warning}><AlertTriangle size={17} /><div>Cette action marque la facture comme réglée et enregistre le montant total de la facture, conformément au comportement backend actuel.</div></div><form action={markInvoicePaidAction}><input type="hidden" name="contract_id" value={String(contract.id)} /><input type="hidden" name="invoice_id" value={String(invoice.id)} /><input type="hidden" name="amount_paid" value={String(invoice.amount || 0)} /><button className={styles.primaryButton} type="submit"><Banknote size={16} /> Enregistrer le règlement intégral</button></form></article>)}</div> : <Empty title="Aucun règlement ouvert" text="Toutes les factures visibles sont déjà marquées comme réglées." />}</section><aside className={styles.sidePanel}><Header title="Contrôles de cohérence" subtitle="Observations visuelles, sans correction automatique." tag="Evidence" />{dataQuality.length ? <div className={styles.qualityList}>{dataQuality.map((item) => <div className={styles.qualityCard} key={item.title}><strong>{item.title}</strong><span>{item.detail}</span></div>)}</div> : <Empty title="Aucune incohérence évidente" text="Les statuts et montants visibles ne présentent pas de signal majeur." />}</aside></div>
}

function ConsumptionWorkspace({ contract, consumption, missions, logConsumptionAction }: { contract: ContractRecord; consumption: BillingConsumption[]; missions: BillingMission[]; logConsumptionAction: Action }) {
  return <div className={styles.financeGrid}><section className={styles.panel}><Header title="Enregistrer une consommation" subtitle="Suivi manuel existant de l’usage ou de la valeur consommée sur le contrat." tag="Action existante" /><form action={logConsumptionAction} className={styles.formGrid}><input type="hidden" name="contract_id" value={String(contract.id)} /><Field name="units_used" label="Unités consommées" type="number" defaultValue="1" /><Field name="amount_value" label="Valeur consommée (Dh)" type="number" defaultValue="0" /><label className={styles.fieldWide}><span>Notes de consommation</span><textarea className={styles.textarea} name="notes" /></label><div className={styles.formReview}><Review label="Contrat" value={String(contract.contract_reference || contract.package_label || `#${contract.id}`)} /><Review label="Missions liées" value={String(missions.length)} /><Review label="Historique" value={`${consumption.length} entrées`} /></div><button className={styles.primaryButton} type="submit"><ClipboardList size={16} /> Enregistrer la consommation</button></form></section><aside className={styles.sidePanel}><Header title="Historique de consommation" subtitle="Entrées visibles les plus récentes." tag={`${consumption.length}`} />{consumption.length ? <div className={styles.eventList}>{consumption.map((item) => <div className={styles.eventCard} key={String(item.id)}><div className={styles.eventHead}><strong>{item.action_type || 'Consommation contractuelle'}</strong><span>{formatDate(item.created_at, true)}</span></div><div className={styles.amountGrid}><AmountCell label="Unités" value={String(item.units_used || 0)} /><AmountCell label="Valeur" value={formatDh(item.amount_value)} /><AmountCell label="Mission" value={String(item.mission_id || '—')} /></div>{item.notes ? <small>{item.notes}</small> : null}<details className={styles.techDetails}><summary>Evidence technique</summary><div className={styles.techGrid}><span>ID: {String(item.id)}</span><span>Contract ID: {String(item.contract_id || contract.id)}</span></div></details></div>)}</div> : <Empty title="Aucune consommation enregistrée" text="Aucune entrée de consommation n’est actuellement visible pour ce contrat." />}</aside></div>
}

function EventsWorkspace({ events }: { events: BillingFinanceEvent[] }) {
  return <section className={styles.panel}><Header title="Événements financiers" subtitle="Chronologie des mouvements existants, avec evidence technique disponible à la demande." tag={`${events.length}`} />{events.length ? <div className={styles.eventList}>{events.map((event) => <EventCard key={String(event.id)} event={event} technical />)}</div> : <Empty title="Aucun événement financier" text="Aucun événement n’est disponible pour ce contrat." />}</section>
}

function EventCard({ event, technical = false }: { event: BillingFinanceEvent; technical?: boolean }) { return <div className={styles.eventCard}><div className={styles.eventHead}><strong>{eventLabel(event.event_type)}</strong><span>{formatDate(event.created_at, true)}</span></div><strong>{formatDh(event.amount)}</strong>{event.note ? <small>{event.note}</small> : null}{technical ? <details className={styles.techDetails}><summary>Evidence & détails techniques</summary><div className={styles.techGrid}><span>ID: {String(event.id)}</span><span>Type stocké: {String(event.event_type || '—')}</span><span>Contract ID: {String(event.contract_id || '—')}</span></div></details> : null}</div> }
function InvoiceCard({ invoice }: { invoice: BillingInvoice }) { return <div className={styles.invoiceCard}><div className={styles.invoiceHead}><div><strong>{invoice.invoice_reference || invoice.invoice_label || `Facture #${invoice.id}`}</strong><span>{formatDate(invoice.created_at)} · échéance {formatDate(invoice.due_date)}</span></div><Status status={isOverdue(invoice) ? 'overdue' : invoice.status || 'pending'} /></div><div className={styles.amountGrid}><AmountCell label="Montant" value={formatDh(invoice.amount)} /><AmountCell label="Encaissé" value={formatDh(invoice.amount_paid)} /><AmountCell label="Ouvert" value={formatDh(Math.max(0,amount(invoice.amount)-amount(invoice.amount_paid)))} /></div></div> }
function Kpi({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) { return <div className={styles.kpi}><div className={styles.kpiHeader}><span>{label}</span><span className={styles.kpiIcon}>{icon}</span></div><strong>{value}</strong><small>{sub}</small></div> }
function Continuity({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className={styles.continuityStep}><span className={styles.stepIcon}>{icon}</span><div><strong>{label}</strong><span>{value}</span></div></div> }
function Header({ title, subtitle, tag }: { title: string; subtitle: string; tag?: string }) { return <div className={styles.panelHeader}><div><h2>{title}</h2><p>{subtitle}</p></div>{tag ? <span className={styles.panelTag}>{tag}</span> : null}</div> }
function Field({ name, label, type = 'text', defaultValue = '' }: { name: string; label: string; type?: string; defaultValue?: string }) { return <label className={styles.field}><span>{label}</span><input className={styles.input} name={name} type={type} defaultValue={defaultValue} /></label> }
function Review({ label, value }: { label: string; value: string }) { return <div className={styles.reviewCell}><span>{label}</span><strong>{value}</strong></div> }
function Info({ label, value }: { label: string; value: string }) { return <div className={styles.infoRow}><span>{label}</span><strong>{value}</strong></div> }
function AmountCell({ label, value }: { label: string; value: string }) { return <div className={styles.amountCell}><span>{label}</span><strong>{value}</strong></div> }
function Status({ status }: { status: unknown }) { const normalized = normalizedStatus(status); const className = normalized === 'paid' ? styles.statusGreen : normalized === 'overdue' ? styles.statusRed : ['pending','partial'].includes(normalized) ? styles.statusAmber : ['active','signed','confirmed'].includes(normalized) ? styles.statusBlue : styles.statusSlate; return <span className={className}>{statusLabel(normalized)}</span> }
function Empty({ title, text }: { title: string; text: string }) { return <div className={styles.empty}><FileText size={24} /><strong>{title}</strong><p>{text}</p></div> }

function collectDataQuality(invoices: BillingInvoice[], contract: ContractRecord) {
  const rows: Array<{ title: string; detail: string }> = []
  if (['active','signed','confirmed'].includes(normalizedStatus(contract.status)) && invoices.length === 0) rows.push({ title: 'Contrat actif sans facture', detail: 'Aucun document de facturation n’est visible pour ce contrat actif.' })
  invoices.forEach((invoice) => {
    if (!invoice.due_date && !isPaid(invoice)) rows.push({ title: `${invoice.invoice_reference || `Facture #${invoice.id}`} sans échéance`, detail: 'Aucune date d’échéance n’est visible sur cette facture ouverte.' })
    if (isPaid(invoice) && amount(invoice.amount_paid) <= 0) rows.push({ title: `${invoice.invoice_reference || `Facture #${invoice.id}`} réglée sans montant`, detail: 'Le statut est réglé, mais aucun montant encaissé positif n’est visible.' })
    if (amount(invoice.amount_paid) > amount(invoice.amount)) rows.push({ title: `${invoice.invoice_reference || `Facture #${invoice.id}`} surpayée`, detail: 'Le montant encaissé visible dépasse le montant facturé.' })
  })
  return rows
}
