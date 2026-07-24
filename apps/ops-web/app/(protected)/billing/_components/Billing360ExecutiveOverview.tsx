import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Banknote, BriefcaseBusiness, CheckCircle2, Clock3, FileText, ShieldCheck, TrendingUp, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './billing360.module.css'
import {
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
} from './billing360.types'

export default function Billing360ExecutiveOverview({
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
  const totalContractValue = contracts.reduce((sum, contract) => sum + amount(contract.contract_value || contract.monthly_amount), 0)
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + amount(invoice.amount), 0)
  const totalPaid = invoices.reduce((sum, invoice) => sum + amount(invoice.amount_paid), 0)
  const openAmount = Math.max(0, totalInvoiced - totalPaid)
  const overdueInvoices = invoices.filter((invoice) => isOverdue(invoice))
  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + Math.max(0, amount(invoice.amount) - amount(invoice.amount_paid)), 0)
  const collectionRate = totalInvoiced > 0 ? Math.min(100, Math.max(0, totalPaid / totalInvoiced * 100)) : 0
  const invoiceCoverage = totalContractValue > 0 ? Math.min(100, Math.max(0, totalInvoiced / totalContractValue * 100)) : 0
  const activeContracts = contracts.filter((contract) => ['active', 'signed', 'confirmed'].includes(normalizedStatus(contract.status)))
  const contractsWithInvoices = new Set(invoices.map((invoice) => String(invoice.contract_id)))
  const activeWithoutInvoice = activeContracts.filter((contract) => !contractsWithInvoices.has(String(contract.id)))
  const contractMap = new Map(contracts.map((contract) => [String(contract.id), contract]))
  const oldestOverdue = [...overdueInvoices].sort((a, b) => new Date(String(a.due_date)).getTime() - new Date(String(b.due_date)).getTime()).slice(0, 8)
  const managementAction = overdueAmount > 0
    ? `Prioriser ${overdueInvoices.length} facture(s) en retard représentant ${formatDh(overdueAmount)}.`
    : activeWithoutInvoice.length > 0
      ? `Vérifier ${activeWithoutInvoice.length} contrat(s) actif(s) sans facture visible.`
      : openAmount > 0
        ? `Suivre ${formatDh(openAmount)} de solde ouvert avant échéance.`
        : 'Aucune exposition financière critique détectée dans le périmètre chargé.'

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <div className={styles.brandLine}>
            <div className={styles.logoPlate}><Image className={styles.logoImage} src="/logo.png" alt="ANGELCARE" width={260} height={90} priority /></div>
            <div className={styles.brandCopy}><span className={styles.eyebrow}>ANGELCARE SANILA OS</span><strong>Billing 360 · Executive Finance Brief</strong></div>
          </div>
          <h1>Une lecture direction claire de la valeur contractée, facturée et encaissée.</h1>
          <p className={styles.heroLead}>Cette vue synthétise l’exposition financière visible et dirige l’attention vers les contrats qui exigent une décision ou un suivi.</p>
          <div className={styles.heroMeta}><span className={styles.metaPill}><ShieldCheck size={15} /> Brief financier read-first</span><span className={styles.metaPill}><Clock3 size={15} /> Données chargées à l’ouverture</span></div>
        </div>
        <aside className={styles.heroFinance}>
          <div><div className={styles.heroFinanceLabel}><span>Situation générale</span><TrendingUp size={18} /></div><div className={styles.heroFinanceValue}>{Math.round(collectionRate)}%</div><div className={styles.heroFinanceSub}>Taux d’encaissement sur le montant facturé visible</div></div>
          <div className={styles.heroMiniGrid}><div className={styles.heroMini}><span>Solde ouvert</span><strong>{formatDh(openAmount)}</strong></div><div className={styles.heroMini}><span>En retard</span><strong>{formatDh(overdueAmount)}</strong></div></div>
        </aside>
      </section>

      {dataWarnings.length ? <div className={styles.warningBanner}><AlertTriangle size={20} /><div><strong>Vue partielle.</strong> {dataWarnings.join(' ')}</div></div> : null}

      <section className={styles.kpiGrid}>
        <Kpi icon={<BriefcaseBusiness size={18} />} label="Valeur contractuelle" value={formatDh(totalContractValue)} sub={`${contracts.length} contrats chargés`} />
        <Kpi icon={<FileText size={18} />} label="Facturé" value={formatDh(totalInvoiced)} sub={`${Math.round(invoiceCoverage)}% de la valeur contractuelle`} />
        <Kpi icon={<CheckCircle2 size={18} />} label="Encaissé" value={formatDh(totalPaid)} sub={`${invoices.filter(isPaid).length} factures réglées`} />
        <Kpi icon={<WalletCards size={18} />} label="Solde ouvert" value={formatDh(openAmount)} sub="Exposition totale visible" />
        <Kpi icon={<AlertTriangle size={18} />} label="En retard" value={formatDh(overdueAmount)} sub={`${overdueInvoices.length} factures`} />
        <Kpi icon={<Clock3 size={18} />} label="Sans facture" value={String(activeWithoutInvoice.length)} sub="Contrats actifs à vérifier" />
        <Kpi icon={<Banknote size={18} />} label="Factures" value={String(invoices.length)} sub="Documents visibles" />
        <Kpi icon={<TrendingUp size={18} />} label="Contrats actifs" value={String(activeContracts.length)} sub="Active, signed ou confirmed" />
      </section>

      <section className={styles.overviewGrid}>
        <div className={styles.contentColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}><h2>Composition financière</h2><p>Progression de la valeur contractuelle vers l’encaissement visible.</p></div>
            <div className={styles.metricComposition}>
              <Composition label="Valeur contractuelle" value={totalContractValue} base={totalContractValue} className={styles.compositionFillBlue} />
              <Composition label="Facturé" value={totalInvoiced} base={totalContractValue || totalInvoiced} className={styles.compositionFillBlue} />
              <Composition label="Encaissé" value={totalPaid} base={totalInvoiced || totalPaid} className={styles.compositionFillGreen} />
              <Composition label="Solde ouvert" value={openAmount} base={totalInvoiced || openAmount} className={styles.compositionFillAmber} />
              <Composition label="Montant en retard" value={overdueAmount} base={totalInvoiced || overdueAmount} className={styles.compositionFillRed} />
            </div>
          </section>

          <section className={styles.twoColumn}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}><h2>Exposition en retard</h2><p>Factures les plus anciennes ou les plus critiques.</p></div>
              {oldestOverdue.length ? <div className={styles.priorityList}>{oldestOverdue.map((invoice) => {
                const contract = invoice.contract_id != null ? contractMap.get(String(invoice.contract_id)) : undefined
                return <div className={styles.priorityItem} key={String(invoice.id)}><div className={styles.priorityItemTop}><strong>{invoice.invoice_reference || invoice.invoice_label || `Facture #${invoice.id}`}</strong><span className={styles.statusPillRed}>En retard</span></div><span>{contract ? `${familyLabel(contract)} · ${contractLabel(contract)}` : `Contrat #${invoice.contract_id || '—'}`}</span><strong>{formatDh(Math.max(0, amount(invoice.amount) - amount(invoice.amount_paid)))}</strong><small>Échéance {formatDate(invoice.due_date)}</small>{invoice.contract_id ? <Link href={`/contracts/${invoice.contract_id}/activation`}>Ouvrir le contexte</Link> : null}</div>
              })}</div> : <Empty title="Aucune facture en retard" text="Aucune échéance impayée n’est actuellement identifiée dans le périmètre chargé." />}
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}><h2>Contrats sans facture</h2><p>Contrats actifs sans document de facturation visible.</p></div>
              {activeWithoutInvoice.length ? <div className={styles.priorityList}>{activeWithoutInvoice.slice(0, 8).map((contract) => <div className={styles.priorityItem} key={String(contract.id)}><strong>{familyLabel(contract)}</strong><span>{contractLabel(contract)}</span><small>{contract.service_type || 'Service non défini'} · {statusLabelSafe(contract.status)}</small><Link href={`/contracts/${contract.id}/activation`}>Activer la finance</Link></div>)}</div> : <Empty title="Aucun contrat actif non facturé" text="Tous les contrats actifs visibles disposent d’au moins une facture dans le périmètre chargé." />}
            </div>
          </section>
        </div>

        <aside className={styles.rail}>
          <section className={styles.railPanel}>
            <div className={styles.panelHeader}><h2>Brief direction</h2><p>Lecture déterministe de la situation actuelle.</p></div>
            <div className={styles.briefGrid}>
              <BriefRow label="Encaissement" value={`${Math.round(collectionRate)}%`} />
              <BriefRow label="Exposition ouverte" value={formatDh(openAmount)} />
              <BriefRow label="Exposition en retard" value={formatDh(overdueAmount)} />
              <BriefRow label="Contrats à surveiller" value={String(activeWithoutInvoice.length + overdueInvoices.length)} />
              <BriefRow label="Dernier mouvement" value={events[0] ? eventLabel(events[0].event_type) : 'Aucun événement'} />
            </div>
            <div className={styles.warningBanner} style={{ marginTop: 16 }}><TrendingUp size={18} /><div><strong>Action recommandée</strong><br />{managementAction}</div></div>
          </section>

          <section className={styles.railPanel}>
            <div className={styles.panelHeader}><h2>Mouvements financiers</h2><p>Derniers événements disponibles.</p></div>
            {events.length ? <div className={styles.eventList}>{events.slice(0, 10).map((event) => <div className={styles.eventItem} key={String(event.id)}><div className={styles.eventItemTop}><strong>{eventLabel(event.event_type)}</strong><span>{formatDate(event.created_at, true)}</span></div><span>Contrat #{event.contract_id || '—'}</span><strong>{formatDh(event.amount)}</strong>{event.note ? <small>{event.note}</small> : null}</div>)}</div> : <Empty title="Aucun mouvement" text="Aucun événement financier n’est actuellement disponible." />}
          </section>
        </aside>
      </section>
    </div>
  )
}

function Kpi({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return <div className={styles.kpiCard}><div className={styles.kpiTop}><span>{label}</span><span className={styles.kpiIcon}>{icon}</span></div><strong>{value}</strong><small>{sub}</small></div>
}

function Composition({ label, value, base, className }: { label: string; value: number; base: number; className: string }) {
  const ratio = base > 0 ? Math.min(100, Math.max(0, value / base * 100)) : 0
  return <div className={styles.compositionRow}><div className={styles.compositionHead}><span>{label}</span><strong>{formatDh(value)}</strong></div><div className={styles.compositionTrack}><div className={className} style={{ width: `${ratio}%` }} /></div></div>
}

function BriefRow({ label, value }: { label: string; value: string }) {
  return <div className={styles.briefRow}><span>{label}</span><strong>{value}</strong></div>
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className={styles.emptyState} style={{ minHeight: 170 }}><FileText size={23} /><strong>{title}</strong><p>{text}</p></div>
}

function statusLabelSafe(value: unknown) {
  const status = normalizedStatus(value)
  return status === 'active' ? 'Actif' : status === 'signed' ? 'Signé' : status === 'confirmed' ? 'Confirmé' : status
}
