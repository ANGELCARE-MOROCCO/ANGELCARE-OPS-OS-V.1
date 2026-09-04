'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  Landmark,
  Layers3,
  ReceiptText,
  RefreshCw,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  WalletCards,
  Workflow,
} from 'lucide-react'
import SanilaLogo from '@/components/brand/SanilaLogo'
import type { SovereignEntity, SovereignWorkspaceSnapshot } from '../SovereignTypes'
import styles from './RevenueAuthorityCommandDeck.module.css'

type RevenueView =
  | 'command'
  | 'pricing'
  | 'contracts'
  | 'subscriptions'
  | 'billing'
  | 'cash'
  | 'collections'
  | 'forecast'

type Props = {
  snapshot: SovereignWorkspaceSnapshot
  onOpen: (entity: SovereignEntity) => void
}

type Stage = {
  label: string
  value: string
  detail: string
  state: 'clear' | 'attention' | 'critical'
  count: number
}

type AuthorityItem = {
  entity: SovereignEntity
  category: string
  title: string
  detail: string
  value: string
  deadline: string
  severity: 'attention' | 'critical' | 'normal'
}

const allowedViews: RevenueView[] = [
  'command',
  'pricing',
  'contracts',
  'subscriptions',
  'billing',
  'cash',
  'collections',
  'forecast',
]

const moneyLabels = ['Montant', 'Total', 'Valeur', 'MRR', 'Prix', 'Solde', 'Exposition', 'Montant dû']

function text(value: unknown, fallback = '—') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function field(entity: SovereignEntity | null | undefined, labels: string[], fallback = '—') {
  if (!entity) return fallback
  const match = entity.fields.find((item) => labels.some((label) => item.label.toLocaleLowerCase('fr-FR').includes(label.toLocaleLowerCase('fr-FR'))))
  return match ? text(match.value, fallback) : fallback
}

function numeric(value: string) {
  const normalized = value.replace(/[^0-9,.-]/g, '').replace(/\s/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function entityValue(entity: SovereignEntity) {
  const value = field(entity, moneyLabels, '0')
  return numeric(value)
}

function formattedMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-MA')} Dh`
}

function metric(snapshot: SovereignWorkspaceSnapshot, key: string, fallback = '—') {
  return snapshot.metrics.find((item) => item.key === key)?.value || fallback
}

function entityHref(entity: SovereignEntity) {
  switch (entity.kind) {
    case 'billing-account': return '/angelcare-360-operator/billing/accounts'
    case 'invoice': return '/angelcare-360-operator/billing/invoices'
    case 'payment': return '/angelcare-360-operator/billing/payments'
    case 'dunning': return '/angelcare-360-operator/billing/dunning'
    case 'contract': return '/angelcare-360-operator/contracts'
    case 'subscription': return '/angelcare-360-operator/subscriptions'
    case 'renewal': return '/angelcare-360-operator/renewals'
    case 'plan': return '/angelcare-360-operator/plans'
    case 'package': return '/angelcare-360-operator/packages'
    case 'client': return '/angelcare-360-operator/clients'
    default: return '/angelcare-360-operator/revenue'
  }
}

function entityLabel(kind: SovereignEntity['kind']) {
  switch (kind) {
    case 'billing-account': return 'Compte de facturation'
    case 'invoice': return 'Facture'
    case 'payment': return 'Paiement'
    case 'dunning': return 'Recouvrement'
    case 'contract': return 'Contrat'
    case 'subscription': return 'Abonnement'
    case 'renewal': return 'Renouvellement'
    case 'plan': return 'Plan tarifaire'
    case 'package': return 'Package'
    default: return 'Objet financier'
  }
}

function isOpenStatus(status: string | null | undefined) {
  const value = text(status, '').toLowerCase()
  return !['paid', 'confirmed', 'reconciled', 'cancelled', 'archived', 'closed', 'resolved', 'active', 'signed', 'renewed', 'won'].includes(value)
}

export default function RevenueAuthorityCommandDeck({ snapshot, onOpen }: Props) {
  const searchParams = useSearchParams()
  const requestedView = searchParams.get('view') as RevenueView | null
  const activeView: RevenueView = requestedView && allowedViews.includes(requestedView) ? requestedView : 'command'

  const groups = useMemo(() => ({
    accounts: snapshot.entities.filter((entity) => entity.kind === 'billing-account'),
    invoices: snapshot.entities.filter((entity) => entity.kind === 'invoice'),
    payments: snapshot.entities.filter((entity) => entity.kind === 'payment'),
    dunning: snapshot.entities.filter((entity) => entity.kind === 'dunning'),
    contracts: snapshot.entities.filter((entity) => entity.kind === 'contract'),
    subscriptions: snapshot.entities.filter((entity) => entity.kind === 'subscription'),
    renewals: snapshot.entities.filter((entity) => entity.kind === 'renewal'),
    plans: snapshot.entities.filter((entity) => entity.kind === 'plan'),
    packages: snapshot.entities.filter((entity) => entity.kind === 'package'),
  }), [snapshot.entities])

  const firstEntity = groups.invoices[0] || groups.payments[0] || groups.contracts[0] || groups.subscriptions[0] || snapshot.entities[0] || null
  const [selected, setSelected] = useState<SovereignEntity | null>(firstEntity)

  useEffect(() => {
    const candidates: Record<RevenueView, SovereignEntity[]> = {
      command: [...groups.invoices, ...groups.payments, ...groups.contracts],
      pricing: [...groups.plans, ...groups.packages, ...groups.subscriptions],
      contracts: [...groups.contracts, ...groups.renewals],
      subscriptions: [...groups.subscriptions, ...groups.contracts],
      billing: [...groups.invoices, ...groups.accounts],
      cash: [...groups.payments, ...groups.invoices],
      collections: [...groups.dunning, ...groups.invoices],
      forecast: [...groups.renewals, ...groups.contracts, ...groups.subscriptions],
    }
    setSelected((current) => current && candidates[activeView].includes(current) ? current : candidates[activeView][0] || firstEntity)
  }, [activeView, firstEntity, groups])

  const authorityQueue = useMemo<AuthorityItem[]>(() => {
    const invoiceItems = groups.invoices
      .filter((entity) => isOpenStatus(entity.status))
      .slice(0, 5)
      .map((entity) => ({
        entity,
        category: 'Invoice authority',
        title: entity.title,
        detail: entity.subtitle || 'Facture à valider, émettre ou sécuriser.',
        value: field(entity, ['Solde', 'Total', 'Montant'], entity.status || 'À traiter'),
        deadline: field(entity, ['Échéance', 'Due'], 'Échéance à confirmer'),
        severity: numeric(field(entity, ['Solde', 'Total', 'Montant'], '0')) > 0 ? 'critical' as const : 'attention' as const,
      }))
    const paymentItems = groups.payments
      .filter((entity) => isOpenStatus(entity.status))
      .slice(0, 4)
      .map((entity) => ({
        entity,
        category: 'Cash verification',
        title: entity.title,
        detail: entity.subtitle || 'Paiement enregistré en attente de confirmation ou allocation.',
        value: field(entity, ['Montant', 'Total'], entity.status || 'À vérifier'),
        deadline: 'Vérification requise',
        severity: 'attention' as const,
      }))
    const contractItems = groups.contracts
      .filter((entity) => isOpenStatus(entity.status))
      .slice(0, 4)
      .map((entity) => ({
        entity,
        category: 'Contract authority',
        title: entity.title,
        detail: entity.subtitle || 'Contrat, avenant ou signature nécessitant autorité.',
        value: field(entity, ['Valeur', 'Montant', 'Total'], entity.status || 'À arbitrer'),
        deadline: field(entity, ['Renouvellement', 'Échéance', 'Fin'], 'Décision à programmer'),
        severity: 'attention' as const,
      }))
    const renewalItems = groups.renewals
      .filter((entity) => isOpenStatus(entity.status))
      .slice(0, 3)
      .map((entity) => ({
        entity,
        category: 'Renewal exposure',
        title: entity.title,
        detail: entity.subtitle || 'Valeur de renouvellement à protéger.',
        value: field(entity, ['Montant', 'Valeur', 'Expected'], entity.status || 'À sécuriser'),
        deadline: field(entity, ['Renouvellement', 'Date'], 'Horizon à confirmer'),
        severity: 'critical' as const,
      }))
    return [...invoiceItems, ...paymentItems, ...contractItems, ...renewalItems].slice(0, 10)
  }, [groups])

  const flowStages = useMemo<Stage[]>(() => {
    const contractValue = groups.contracts.reduce((sum, entity) => sum + entityValue(entity), 0)
    const activeSubscriptions = groups.subscriptions.filter((entity) => text(entity.status, '').toLowerCase() === 'active')
    const billableSubscriptions = groups.subscriptions.filter((entity) => !['cancelled', 'archived', 'suspended'].includes(text(entity.status, '').toLowerCase()))
    const openInvoices = groups.invoices.filter((entity) => isOpenStatus(entity.status))
    const confirmedPayments = groups.payments.filter((entity) => ['confirmed', 'reconciled', 'paid'].includes(text(entity.status, '').toLowerCase()))
    const completedRenewals = groups.renewals.filter((entity) => ['renewed', 'won', 'complete', 'completed'].includes(text(entity.status, '').toLowerCase()))
    return [
      { label: 'Contracted', value: contractValue > 0 ? formattedMoney(contractValue) : `${groups.contracts.length} accord(s)`, detail: 'Valeur gouvernée par contrats et avenants.', state: groups.contracts.length ? 'clear' : 'attention', count: groups.contracts.length },
      { label: 'Activated', value: metric(snapshot, 'mrr', `${activeSubscriptions.length} actif(s)`), detail: 'Abonnements réellement actifs.', state: activeSubscriptions.length ? 'clear' : 'attention', count: activeSubscriptions.length },
      { label: 'Billable', value: `${billableSubscriptions.length} abonnement(s)`, detail: 'Configuration prête pour production de facture.', state: billableSubscriptions.length === groups.subscriptions.length ? 'clear' : 'attention', count: billableSubscriptions.length },
      { label: 'Invoiced', value: metric(snapshot, 'invoiced', `${groups.invoices.length} facture(s)`), detail: 'Valeur produite et émise.', state: groups.invoices.length ? 'clear' : 'attention', count: groups.invoices.length },
      { label: 'Due', value: metric(snapshot, 'overdue', `${openInvoices.length} ouvert(s)`), detail: 'Encours et échéances à maîtriser.', state: openInvoices.length ? 'critical' : 'clear', count: openInvoices.length },
      { label: 'Collected', value: metric(snapshot, 'collected', `${groups.payments.length} paiement(s)`), detail: 'Cash reçu et documenté.', state: groups.payments.length ? 'clear' : 'attention', count: groups.payments.length },
      { label: 'Reconciled', value: `${confirmedPayments.length} confirmé(s)`, detail: 'Paiements vérifiés et rapprochés.', state: confirmedPayments.length === groups.payments.length ? 'clear' : 'attention', count: confirmedPayments.length },
      { label: 'Renewed', value: `${completedRenewals.length}/${groups.renewals.length}`, detail: 'Valeur prolongée et sécurisée.', state: completedRenewals.length === groups.renewals.length && groups.renewals.length > 0 ? 'clear' : 'attention', count: completedRenewals.length },
    ]
  }, [groups, snapshot])

  const commandMetrics = [
    { label: 'Contracted', value: flowStages[0].value, note: `${groups.contracts.length} accords` },
    { label: 'Activated MRR', value: metric(snapshot, 'mrr', '—'), note: `${groups.subscriptions.length} abonnements` },
    { label: 'Invoiced', value: metric(snapshot, 'invoiced', '—'), note: `${groups.invoices.length} factures` },
    { label: 'Collected', value: metric(snapshot, 'collected', '—'), note: `${groups.payments.length} paiements` },
    { label: 'Exposure', value: metric(snapshot, 'overdue', '—'), note: `${authorityQueue.filter((item) => item.severity === 'critical').length} alertes` },
  ]

  return (
    <div className={styles.deck} data-view={activeView}>
      <header className={styles.authorityCrown}>
        <div className={styles.brandIdentity}>
          <SanilaLogo variant="white" width={134} height={47} priority />
          <div>
            <span>Revenue Authority</span>
            <strong>Command Deck</strong>
            <small>Contract → subscription → invoice → cash → protected margin</small>
          </div>
        </div>
        <div className={styles.economicStrip}>
          {commandMetrics.map((item) => (
            <div key={item.label} className={styles.economicMetric}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
        <div className={styles.crownActions}>
          <Link href="/angelcare-360-operator/billing" className={styles.primaryAction}><CircleDollarSign size={16}/> Financial operation</Link>
          <Link href="/angelcare-360-operator/billing/dunning" className={styles.secondaryAction}><TriangleAlert size={16}/> Review exceptions</Link>
          <Link href="/angelcare-360-operator/executive/revenue" className={styles.secondaryAction}><FileCheck2 size={16}/> Revenue brief</Link>
        </div>
      </header>

      {activeView === 'command' ? <CommandScene snapshot={snapshot} queue={authorityQueue} stages={flowStages} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'pricing' ? <PricingScene entities={[...groups.plans, ...groups.packages, ...groups.subscriptions]} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'contracts' ? <ContractsScene contracts={groups.contracts} renewals={groups.renewals} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'subscriptions' ? <SubscriptionsScene subscriptions={groups.subscriptions} contracts={groups.contracts} invoices={groups.invoices} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'billing' ? <BillingScene accounts={groups.accounts} invoices={groups.invoices} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'cash' ? <CashScene payments={groups.payments} invoices={groups.invoices} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'collections' ? <CollectionsScene invoices={groups.invoices} dunning={groups.dunning} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'forecast' ? <ForecastScene renewals={groups.renewals} contracts={groups.contracts} subscriptions={groups.subscriptions} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}

      <ActionRunway invoices={groups.invoices} renewals={groups.renewals} contracts={groups.contracts}/>
    </div>
  )
}

function CommandScene({ snapshot, queue, stages, selected, onSelect, onOpen }: { snapshot: SovereignWorkspaceSnapshot; queue: AuthorityItem[]; stages: Stage[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  return <section className={styles.commandGrid}>
    <aside className={styles.authorityQueue}>
      <SectionHeading icon={<ShieldCheck size={17}/>} eyebrow="Authority Queue" title="Decisions requiring intervention" detail={`${queue.length} exception(s) or approvals visible`}/>
      <div className={styles.queueList}>
        {queue.length ? queue.map((item, index) => <button key={`${item.entity.kind}-${item.title}-${index}`} type="button" className={`${styles.queueItem} ${styles[item.severity]}`} onClick={() => onSelect(item.entity)}>
          <div className={styles.queueTop}><span>{item.category}</span><strong>{item.value}</strong></div>
          <h3>{item.title}</h3><p>{item.detail}</p>
          <div className={styles.queueFoot}><small>{item.deadline}</small><ChevronRight size={15}/></div>
        </button>) : <OperationalEmpty icon={<CheckCircle2/>} title="No financial exception" detail="The loaded records do not currently expose an unresolved authority event." href="/angelcare-360-operator/billing" action="Open billing control"/>}
      </div>
    </aside>

    <main className={styles.circulationCanvas}>
      <div className={styles.canvasHeader}>
        <SectionHeading icon={<Workflow size={17}/>} eyebrow="Economic circulation" title="From contracted value to secured cash" detail="One authoritative chain. Every narrowing exposes blocked value, drift or leakage."/>
        <div className={styles.liveBadge}><span/> Snapshot {new Date(snapshot.generatedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div className={styles.valueRiver}>
        {stages.map((stage, index) => <div key={stage.label} className={`${styles.riverStage} ${styles[stage.state]}`}>
          <div className={styles.riverConnector} aria-hidden="true"><span/></div>
          <div className={styles.riverIndex}>{String(index + 1).padStart(2,'0')}</div>
          <div className={styles.riverBody}>
            <span>{stage.label}</span><strong>{stage.value}</strong><small>{stage.detail}</small>
          </div>
          <div className={styles.riverCount}>{stage.count}</div>
        </div>)}
      </div>
      <div className={styles.commandInsightRow}>
        <Insight icon={<SearchCheck/>} label="Revenue integrity" value={`${stages.filter((stage) => stage.state === 'clear').length}/8`} detail="Stages without visible operational break"/>
        <Insight icon={<TriangleAlert/>} label="Intervention load" value={String(stages.filter((stage) => stage.state !== 'clear').length)} detail="Stages requiring evidence or action" tone="warn"/>
        <Insight icon={<RefreshCw/>} label="Relationship graph" value={String(Object.values(snapshot.relationships).reduce((sum, ids) => sum + ids.length, 0))} detail="Financial and contractual links loaded"/>
      </div>
    </main>

    <ContextInspector entity={selected} onOpen={onOpen}/>
  </section>
}

function PricingScene({ entities, selected, onSelect, onOpen }: { entities: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const plans = entities.filter((entity) => entity.kind === 'plan')
  const packages = entities.filter((entity) => entity.kind === 'package')
  const subscriptions = entities.filter((entity) => entity.kind === 'subscription')
  return <section className={styles.sceneShell}>
    <div className={styles.sceneHeader}><SectionHeading icon={<Calculator size={18}/>} eyebrow="Pricing authority" title="Monetization architecture & exception control" detail="Price books, packages, discount thresholds and customer exceptions are governed here—not inside the customer dossier."/><div className={styles.sceneActions}><Link href="/angelcare-360-operator/plans" className={styles.primaryAction}>Manage price books</Link><Link href="/angelcare-360-operator/packages" className={styles.secondaryAction}>Package economics</Link></div></div>
    <div className={styles.pricingGrid}>
      <div className={styles.priceArchitecture}>
        <div className={styles.architectureSpine}><span>Base access</span><ArrowRight/><span>Modules</span><ArrowRight/><span>Capacity</span><ArrowRight/><span>Support</span><ArrowRight/><span>Commercial terms</span></div>
        <div className={styles.priceCards}>
          {[...plans, ...packages].slice(0,8).map((entity,index)=><button type="button" key={`${entity.title}-${index}`} className={styles.priceCard} onClick={()=>onSelect(entity)}>
            <div><span>{entityLabel(entity.kind)}</span><strong>{entity.title}</strong><small>{entity.subtitle || 'Canonical monetization object'}</small></div>
            <b>{field(entity,['Prix','Montant','Monthly','Annual'],'Configured')}</b>
          </button>)}
          {!plans.length && !packages.length ? <OperationalEmpty icon={<Layers3/>} title="No canonical price object loaded" detail="Create or publish a plan/package to activate the economic comparison canvas." href="/angelcare-360-operator/plans" action="Configure pricing"/> : null}
        </div>
      </div>
      <div className={styles.simulator}>
        <SectionHeading icon={<Scale size={17}/>} eyebrow="Exception simulator" title="Standard versus proposed economics" detail="A controlled commercial exception must show its twelve-month effect and authority threshold."/>
        <div className={styles.comparisonTable}>
          <ComparisonRow label="Standard configuration" current={selected ? field(selected,['Prix','Montant','Total'],'Canonical') : 'Select a price object'} proposed="Baseline"/>
          <ComparisonRow label="Proposed terms" current="No exception" proposed="Awaiting request" attention/>
          <ComparisonRow label="12-month revenue effect" current="Protected" proposed="Calculated on approval"/>
          <ComparisonRow label="Authority" current="Commercial request" proposed="Revenue approval"/>
          <ComparisonRow label="Customer impact" current={`${subscriptions.length} subscription(s)`} proposed="Preview before application"/>
        </div>
        <div className={styles.approvalMatrix}><span>≤ 5% · Revenue Ops</span><span>6–12% · Finance authority</span><span>&gt; 12% · Executive decision</span></div>
      </div>
      <ContextInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function ContractsScene({ contracts, renewals, selected, onSelect, onOpen }: { contracts: SovereignEntity[]; renewals: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  return <section className={styles.sceneShell}>
    <div className={styles.sceneHeader}><SectionHeading icon={<FileText size={18}/>} eyebrow="Contract authority" title="Agreement, amendment & renewal theatre" detail="The current agreement, proposed change and total economic impact remain visible in one governed chamber."/><div className={styles.sceneActions}><Link href="/angelcare-360-operator/contracts" className={styles.primaryAction}>Contract command</Link><Link href="/angelcare-360-operator/renewals" className={styles.secondaryAction}>Renewal authority</Link></div></div>
    <div className={styles.contractGrid}>
      <div className={styles.contractRegistry}>
        <div className={styles.lifecycleRibbon}>{['Draft','Review','Approval','Signature','Activation','Amendment','Renewal'].map((label,index)=><div key={label}><span>{String(index+1).padStart(2,'0')}</span><strong>{label}</strong></div>)}</div>
        <div className={styles.contractList}>{contracts.map((entity,index)=><button type="button" key={`${entity.title}-${index}`} className={styles.contractRow} onClick={()=>onSelect(entity)}><div><span>{entity.status || 'status unavailable'}</span><strong>{entity.title}</strong><small>{entity.subtitle || 'Contract relationship'}</small></div><div><b>{field(entity,['Valeur','Montant','Total'],'—')}</b><small>{field(entity,['Renouvellement','Fin','Échéance'],'Horizon pending')}</small></div></button>)}{!contracts.length?<OperationalEmpty icon={<FileText/>} title="No contract loaded" detail="The contract authority scene activates as soon as a contract or amendment exists." href="/angelcare-360-operator/contracts" action="Open contract registry"/>:null}</div>
      </div>
      <div className={styles.contractComparison}>
        <SectionHeading icon={<Scale size={17}/>} eyebrow="Amendment studio" title="Current agreement versus proposed state" detail="The proposed state cannot be applied before its billing, tenant and renewal impact is visible."/>
        <div className={styles.dualDocument}><article><span>Current agreement</span><strong>{selected?.title || 'Select a contract'}</strong><p>{selected?.subtitle || 'The source contract remains authoritative.'}</p><dl><dt>Status</dt><dd>{selected?.status || '—'}</dd><dt>Value</dt><dd>{field(selected,['Valeur','Montant','Total'],'—')}</dd><dt>Renewal</dt><dd>{field(selected,['Renouvellement','Fin','Échéance'],'—')}</dd></dl></article><div className={styles.versus}>VS</div><article className={styles.proposedDocument}><span>Proposed amendment</span><strong>Controlled change order</strong><p>Upgrade, downgrade, capacity, price, billing cycle or support tier.</p><dl><dt>Revenue impact</dt><dd>Calculated before approval</dd><dt>Tenant impact</dt><dd>Entitlement preview</dd><dt>Effective date</dt><dd>Required</dd></dl></article></div>
        <div className={styles.impactRail}><span>Revenue delta</span><span>Billing change</span><span>Product impact</span><span>Tenant runtime</span><span>Renewal horizon</span></div>
      </div>
      <ContextInspector entity={selected || renewals[0] || null} onOpen={onOpen}/>
    </div>
  </section>
}

function SubscriptionsScene({ subscriptions, contracts, invoices, selected, onSelect, onOpen }: { subscriptions: SovereignEntity[]; contracts: SovereignEntity[]; invoices: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const states = ['active','trial','past_due','suspended','cancelled']
  return <section className={styles.sceneShell}>
    <div className={styles.sceneHeader}><SectionHeading icon={<Layers3 size={18}/>} eyebrow="Subscription economics" title="Promise, runtime & billing alignment" detail="Contract promise, subscription configuration, tenant runtime and billing output are compared as one economic unit."/><div className={styles.sceneActions}><Link href="/angelcare-360-operator/subscriptions" className={styles.primaryAction}>Subscription control</Link><Link href="/angelcare-360-operator/tenants-product" className={styles.secondaryAction}>Product runtime</Link></div></div>
    <div className={styles.subscriptionGrid}>
      <div className={styles.fleetMatrix}>{states.map((state)=><section key={state}><header><span>{state.replace('_',' ')}</span><b>{subscriptions.filter((entity)=>text(entity.status,'').toLowerCase()===state).length}</b></header><div>{subscriptions.filter((entity)=>text(entity.status,'').toLowerCase()===state).map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><strong>{entity.title}</strong><small>{entity.subtitle || 'Subscription economic unit'}</small><span>{field(entity,['Montant','Prix','Billing'],'—')}</span></button>)}</div></section>)}</div>
      <div className={styles.alignmentTwin}>
        <SectionHeading icon={<Workflow size={17}/>} eyebrow="Economic twin" title="Four-source consistency check" detail="Any mismatch becomes revenue leakage or customer entitlement risk."/>
        {['Contract promise','Subscription configuration','Tenant runtime','Billing output'].map((label,index)=><div key={label} className={styles.alignmentRow}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{label}</strong><small>{index===0?`${contracts.length} contract(s)`:index===1?`${subscriptions.length} subscription(s)`:index===2?'Tenant status linked through Product Studio':`${invoices.length} invoice(s)`}</small></div><b className={index===3 && invoices.length===0?styles.stateWarn:styles.stateGood}>{index===3 && invoices.length===0?'Review':'Connected'}</b></div>)}
      </div>
      <ContextInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function BillingScene({ accounts, invoices, selected, onSelect, onOpen }: { accounts: SovereignEntity[]; invoices: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const lanes = [
    {key:'scheduled',label:'Scheduled'},
    {key:'draft',label:'Prepared'},
    {key:'issued',label:'Issued'},
    {key:'due',label:'Due'},
    {key:'paid',label:'Paid'},
  ]
  return <section className={styles.sceneShell}>
    <div className={styles.sceneHeader}><SectionHeading icon={<ReceiptText size={18}/>} eyebrow="Billing production" title="Governed invoice factory" detail="Scheduled value moves through preparation, validation, issuance, delivery, due date and settlement."/><div className={styles.sceneActions}><Link href="/angelcare-360-operator/billing/invoices" className={styles.primaryAction}>Invoice production</Link><Link href="/angelcare-360-operator/billing/accounts" className={styles.secondaryAction}>Billing accounts</Link></div></div>
    <div className={styles.billingGrid}>
      <div className={styles.productionLine}>{lanes.map((lane)=><section key={lane.key}><header><span>{lane.label}</span><b>{invoices.filter((entity)=>text(entity.status,'').toLowerCase()===lane.key).length}</b></header><div>{invoices.filter((entity)=>text(entity.status,'').toLowerCase()===lane.key).slice(0,5).map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><strong>{entity.title}</strong><small>{entity.subtitle || 'Invoice'}</small><span>{field(entity,['Total','Solde','Montant'],'—')}</span></button>)}</div></section>)}</div>
      <div className={styles.billingContext}><SectionHeading icon={<Landmark size={17}/>} eyebrow="Billing relationships" title="Accounts & tax identity" detail="Billing accounts support invoice production; they do not replace the customer dossier."/><div className={styles.accountStack}>{accounts.map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><span>{entity.status || 'status'}</span><strong>{entity.title}</strong><small>{entity.subtitle || field(entity,['Email','Fiscal'],'Billing account')}</small></button>)}{!accounts.length?<OperationalEmpty icon={<Landmark/>} title="No billing account" detail="Create a billing identity before invoice production." href="/angelcare-360-operator/billing/accounts" action="Configure account"/>:null}</div></div>
      <ContextInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function CashScene({ payments, invoices, selected, onSelect, onOpen }: { payments: SovereignEntity[]; invoices: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const confirmed = payments.filter((entity)=>['confirmed','reconciled','paid'].includes(text(entity.status,'').toLowerCase()))
  const pending = payments.filter((entity)=>!confirmed.includes(entity))
  return <section className={styles.sceneShell}>
    <div className={styles.sceneHeader}><SectionHeading icon={<Banknote size={18}/>} eyebrow="Cash & reconciliation" title="Treasury verification surface" detail="Recorded cash is not treated as secured until it is verified, allocated and reconciled against invoices."/><div className={styles.sceneActions}><Link href="/angelcare-360-operator/billing/payments" className={styles.primaryAction}>Payment desk</Link><Link href="/angelcare-360-operator/billing/invoices" className={styles.secondaryAction}>Open receivables</Link></div></div>
    <div className={styles.cashGrid}>
      <div className={styles.cashLedger}><div className={styles.cashColumn}><header><span>Recorded / pending</span><b>{pending.length}</b></header>{pending.map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><WalletCards/><div><strong>{entity.title}</strong><small>{entity.subtitle || entity.status}</small></div><b>{field(entity,['Montant','Total'],'—')}</b></button>)}</div><div className={styles.reconciliationBridge}><span/><strong>Verification</strong><ArrowRight/><strong>Allocation</strong><ArrowRight/><strong>Reconciliation</strong><span/></div><div className={styles.cashColumn}><header><span>Confirmed / reconciled</span><b>{confirmed.length}</b></header>{confirmed.map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><BadgeCheck/><div><strong>{entity.title}</strong><small>{entity.subtitle || entity.status}</small></div><b>{field(entity,['Montant','Total'],'—')}</b></button>)}</div></div>
      <div className={styles.reconciliationMatrix}><SectionHeading icon={<SearchCheck size={17}/>} eyebrow="Matching matrix" title="Payments ↔ invoices" detail="The control surface exposes unallocated, partial or confirmed relationships."/>{payments.slice(0,6).map((payment,index)=><div key={`${payment.title}-${index}`}><span>{payment.title}</span><div className={styles.matchLine}><i/><b>{invoices[index]?.title || 'Invoice allocation required'}</b></div><strong>{payment.status || 'pending'}</strong></div>)}</div>
      <ContextInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function CollectionsScene({ invoices, dunning, selected, onSelect, onOpen }: { invoices: SovereignEntity[]; dunning: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const exposed = invoices.filter((entity)=>isOpenStatus(entity.status))
  const stages = ['Reminder','Formal notice','Promise','Negotiation','Escalation','Restriction review','Resolved']
  return <section className={styles.sceneShell}>
    <div className={styles.sceneHeader}><SectionHeading icon={<AlertTriangle size={18}/>} eyebrow="Collections & exposure" title="Financial intervention command center" detail="Exposure is ranked by value, age, customer importance, dispute state and recoverability."/><div className={styles.sceneActions}><Link href="/angelcare-360-operator/billing/dunning" className={styles.primaryAction}>Collections command</Link><Link href="/angelcare-360-operator/billing/balances" className={styles.secondaryAction}>Exposure ledger</Link></div></div>
    <div className={styles.collectionsGrid}>
      <div className={styles.collectionStages}>{stages.map((stage,index)=><div key={stage}><span>{String(index+1).padStart(2,'0')}</span><strong>{stage}</strong><small>{index < dunning.length ? 'Action evidence loaded' : 'Governed stage'}</small></div>)}</div>
      <div className={styles.exposureField}>{exposed.map((entity,index)=>{const value=entityValue(entity);const scale=Math.max(1,Math.min(3,1+value/10000));return <button type="button" key={`${entity.title}-${index}`} style={{'--exposure-scale':String(scale)} as React.CSSProperties} onClick={()=>onSelect(entity)}><span>{entity.status || 'open'}</span><strong>{entity.title}</strong><b>{field(entity,['Solde','Total','Montant'],'—')}</b><small>{field(entity,['Échéance','Due'],'Intervention required')}</small></button>})}{!exposed.length?<OperationalEmpty icon={<CheckCircle2/>} title="No open exposure" detail="No invoice is currently classified as unresolved in the loaded snapshot." href="/angelcare-360-operator/billing/balances" action="Review balances"/>:null}</div>
      <ContextInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function ForecastScene({ renewals, contracts, subscriptions, selected, onSelect, onOpen }: { renewals: SovereignEntity[]; contracts: SovereignEntity[]; subscriptions: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const horizons = [
    {label:'30 days',value:renewals.slice(0,2).reduce((sum,e)=>sum+entityValue(e),0),count:renewals.slice(0,2).length,confidence:'High attention'},
    {label:'60 days',value:renewals.slice(2,4).reduce((sum,e)=>sum+entityValue(e),0),count:renewals.slice(2,4).length,confidence:'Managed'},
    {label:'90 days',value:renewals.slice(4,7).reduce((sum,e)=>sum+entityValue(e),0),count:renewals.slice(4,7).length,confidence:'Developing'},
    {label:'6 months',value:contracts.reduce((sum,e)=>sum+entityValue(e),0),count:contracts.length,confidence:'Contract horizon'},
    {label:'12 months',value:subscriptions.reduce((sum,e)=>sum+entityValue(e)*12,0),count:subscriptions.length,confidence:'Recurring outlook'},
  ]
  return <section className={styles.sceneShell}>
    <div className={styles.sceneHeader}><SectionHeading icon={<TrendingUp size={18}/>} eyebrow="Forecast, leakage & profitability" title="Future revenue horizon" detail="Forecast confidence, renewals, leakage, discount erosion and cost-source integrity are governed together."/><div className={styles.sceneActions}><Link href="/angelcare-360-operator/executive/revenue" className={styles.primaryAction}>Executive forecast</Link><Link href="/angelcare-360-operator/settings" className={styles.secondaryAction}>Cost sources</Link></div></div>
    <div className={styles.forecastGrid}>
      <div className={styles.horizonField}>{horizons.map((item,index)=><article key={item.label}><span>{item.label}</span><strong>{item.value>0?formattedMoney(item.value):`${item.count} record(s)`}</strong><small>{item.confidence}</small><div style={{width:`${Math.max(18,100-index*14)}%`}}/></article>)}</div>
      <div className={styles.leakageBoard}>
        <SectionHeading icon={<Gauge size={17}/>} eyebrow="Leakage observatory" title="Value escaping the economic chain" detail="A leakage signal must point to an object, owner and corrective action."/>
        {[{label:'Active subscription without billing evidence',value:subscriptions.length?'Review':'Clear',tone:subscriptions.length?'warn':'good'},{label:'Contract without activation evidence',value:contracts.length?'Review':'Clear',tone:contracts.length?'warn':'good'},{label:'Renewal value not secured',value:String(renewals.filter(e=>isOpenStatus(e.status)).length),tone:'warn'},{label:'Discount erosion',value:'Source required',tone:'neutral'}].map((item)=><div key={item.label}><span>{item.label}</span><strong className={item.tone==='warn'?styles.stateWarn:item.tone==='good'?styles.stateGood:''}>{item.value}</strong></div>)}
      </div>
      <div className={styles.profitabilitySource}>
        <SectionHeading icon={<BarChart3 size={17}/>} eyebrow="Profitability integrity" title="Cost source governance" detail="Margin is not fabricated. The system declares exactly what is missing and who must configure it."/>
        <div className={styles.sourceState}><AlertTriangle/><div><span>Missing reliable service-cost source</span><strong>Profitability confidence: unavailable</strong><p>Affected calculations: gross contribution, support cost, implementation cost and customer margin.</p></div></div>
        <Link href="/angelcare-360-operator/settings" className={styles.primaryAction}>Configure cost source</Link>
      </div>
      <div className={styles.forecastRegistry}>{[...renewals,...contracts].slice(0,8).map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><span>{entityLabel(entity.kind)}</span><strong>{entity.title}</strong><small>{field(entity,['Renouvellement','Fin','Échéance'],'Forecast horizon')}</small></button>)}</div>
      <ContextInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function ContextInspector({ entity, onOpen }: { entity: SovereignEntity | null; onOpen: (entity: SovereignEntity) => void }) {
  return <aside className={styles.contextInspector}>
    <SectionHeading icon={<Sparkles size={17}/>} eyebrow="Financial context" title={entity ? entityLabel(entity.kind) : 'Select an economic object'} detail={entity ? 'The inspector follows the selected object without routing away.' : 'Select an exception, contract, invoice, payment or renewal.'}/>
    {entity ? <>
      <div className={styles.inspectorIdentity}><span>{entity.status || 'state unavailable'}</span><strong>{entity.title}</strong><small>{entity.subtitle || 'Financial relationship object'}</small></div>
      <div className={styles.inspectorFields}>{entity.fields.slice(0,8).map((item)=><div key={item.label}><span>{item.label}</span><strong>{text(item.value)}</strong></div>)}</div>
      <div className={styles.inspectorActions}><button type="button" onClick={()=>onOpen(entity)} className={styles.primaryAction}>Open authority chamber</button><Link href={entityHref(entity)} className={styles.secondaryAction}>Operational source</Link></div>
      <div className={styles.auditHint}><Clock3 size={15}/><span>Source record, lifecycle, evidence and audit remain authoritative.</span></div>
    </> : <OperationalEmpty icon={<SearchCheck/>} title="No object selected" detail="Choose an item in the active canvas to reveal its financial and contractual context." href="/angelcare-360-operator/revenue" action="Return to command"/>}
  </aside>
}

function ActionRunway({ invoices, renewals, contracts }: { invoices: SovereignEntity[]; renewals: SovereignEntity[]; contracts: SovereignEntity[] }) {
  const items = [
    ...invoices.filter((entity)=>isOpenStatus(entity.status)).slice(0,3).map((entity)=>({when:field(entity,['Échéance','Due'],'Today'),label:'Invoice intervention',entity,href:'/angelcare-360-operator/billing/invoices'})),
    ...renewals.filter((entity)=>isOpenStatus(entity.status)).slice(0,2).map((entity)=>({when:field(entity,['Renouvellement','Date'],'Next horizon'),label:'Renewal decision',entity,href:'/angelcare-360-operator/renewals'})),
    ...contracts.filter((entity)=>isOpenStatus(entity.status)).slice(0,2).map((entity)=>({when:field(entity,['Fin','Échéance'],'Authority due'),label:'Contract decision',entity,href:'/angelcare-360-operator/contracts'})),
  ].slice(0,7)
  return <footer className={styles.actionRunway}><div className={styles.runwayTitle}><Clock3 size={16}/><div><span>Financial action runway</span><strong>Upcoming commitments</strong></div></div><div className={styles.runwayTrack}>{items.length?items.map((item,index)=><Link key={`${item.entity.title}-${index}`} href={item.href}><span>{item.when}</span><strong>{item.label}</strong><small>{item.entity.title}</small></Link>):<div className={styles.runwayClear}><CheckCircle2 size={16}/> No dated financial commitment exposed in the current snapshot.</div>}</div></footer>
}

function SectionHeading({ icon, eyebrow, title, detail }: { icon: React.ReactNode; eyebrow: string; title: string; detail: string }) {
  return <div className={styles.sectionHeading}><div className={styles.headingIcon}>{icon}</div><div><span>{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div></div>
}

function Insight({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: 'warn' }) {
  return <article className={`${styles.insight} ${tone === 'warn' ? styles.insightWarn : ''}`}><div>{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function ComparisonRow({ label, current, proposed, attention = false }: { label: string; current: string; proposed: string; attention?: boolean }) {
  return <div className={styles.comparisonRow}><span>{label}</span><strong>{current}</strong><ArrowRight size={14}/><b className={attention ? styles.stateWarn : ''}>{proposed}</b></div>
}

function OperationalEmpty({ icon, title, detail, href, action }: { icon: React.ReactNode; title: string; detail: string; href: string; action: string }) {
  return <div className={styles.operationalEmpty}><div>{icon}</div><strong>{title}</strong><p>{detail}</p><Link href={href}>{action}<ChevronRight size={14}/></Link></div>
}
