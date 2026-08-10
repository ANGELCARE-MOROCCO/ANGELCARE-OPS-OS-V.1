'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CircleDollarSign, FileWarning, ReceiptText, Scale, WalletCards } from 'lucide-react'
import type { Wave1Decision, Wave1ExecutiveData, Wave1RevenueStage } from './Wave1ExecutiveTypes'
import {
  DecisionChamber,
  EmptyExecutiveState,
  ExecutiveDrawer,
  ExecutiveRibbon,
  MetricCard,
  SearchControl,
  SectionHeader,
  Wave1Hero,
} from './Wave1ExecutivePrimitives'
import styles from './Wave1ExecutiveExperience.module.css'

export default function RevenueExecutiveCommand({ data }: { data: Wave1ExecutiveData }) {
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState<Wave1RevenueStage | null>(null)
  const [decision, setDecision] = useState<Wave1Decision | null>(null)
  const financialDecisions = useMemo(() => data.decisions.filter((item) => item.kind === 'finance'), [data.decisions])
  const filteredCustomers = useMemo(() => {
    const normalized = normalize(query)
    return data.customers.filter((item) => !normalized || normalize(`${item.name} ${item.code} ${item.city}`).includes(normalized)).sort((a, b) => b.balanceDh - a.balanceDh)
  }, [data.customers, query])

  const collectionRatio = data.summary.invoicedPeriodDh > 0 ? Math.min(100, Math.round(data.summary.collectedPeriodDh / data.summary.invoicedPeriodDh * 100)) : 0
  const overdueShare = data.summary.outstandingDh > 0 ? Math.min(100, Math.round(data.summary.overdueDh / data.summary.outstandingDh * 100)) : 0

  return (
    <div className={styles.page} data-domain="revenue">
      <Wave1Hero
        domain="revenue"
        eyebrow="Executive Revenue Command"
        title="La valeur contractée devient"
        accent="cash, protection et discipline."
        subtitle="Une architecture financière exécutive qui relie abonnements, factures, encaissements, encours, retards, renouvellements et décisions de restriction sans confondre projection et trésorerie confirmée."
        data={data}
        primary={{ label: 'Ouvrir les factures', href: '/angelcare-360-operator/billing/invoices' }}
        secondary={{ label: 'Commander le recouvrement', href: '/angelcare-360-operator/billing/dunning' }}
      />
      <ExecutiveRibbon signals={data.signals} />

      <section className={styles.section}>
        <SectionHeader eyebrow="Performance de période" title="Le revenu sous quatre angles de gouvernance" description="Facturation, encaissement, exposition et renouvellement sont séparés afin d’éviter toute lecture trompeuse." />
        <div className={styles.metricGrid}>
          <MetricCard label="Facturé période" value={formatDh(data.summary.invoicedPeriodDh)} detail={`Période ${data.periodLabel}`} href="/angelcare-360-operator/billing/invoices" icon="money" />
          <MetricCard label="Collecté confirmé" value={formatDh(data.summary.collectedPeriodDh)} detail={`${collectionRatio}% du facturé de période, sans prétendre à une attribution parfaite`} href="/angelcare-360-operator/billing/payments" icon="target" />
          <MetricCard label="Encours total" value={formatDh(data.summary.outstandingDh)} detail={`${overdueShare}% de l’encours se trouve au statut en retard`} href="/angelcare-360-operator/billing/balances" icon="risk" />
          <MetricCard label="Renouvellement exposé" value={formatDh(data.summary.renewalRiskDh)} detail="Valeur enregistrée sur les renouvellements à risque" href="/angelcare-360-operator/renewals" icon="calendar" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader eyebrow="Mouvement financier" title="Du revenu récurrent à l’exposition réelle" description="Chaque étape est cliquable et explique précisément sa source de calcul." />
        <article className={styles.surface}>
          <div className={styles.revenueFlow}>
            {data.revenueStages.map((item, index) => <button type="button" key={item.key} className={styles.revenueStage} data-tone={item.tone} onClick={() => setStage(item)}><span className={styles.stageIndex}>0{index + 1}</span><div><div className={styles.stageLabel}>{item.label}</div><div className={styles.stageValue}>{formatDh(item.valueDh)}</div><div className={styles.stageCount}>{item.count} registre(s)</div></div><div className={styles.stageDescription}>{item.description}</div></button>)}
          </div>
        </article>
      </section>

      <section className={styles.controlGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Matrice d’exposition client</h2><p className={styles.surfaceMeta}>Clients classés par solde ouvert. Les facteurs service et renouvellement restent visibles pour éviter une décision financière isolée.</p></div><WalletCards size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}>
            <SearchControl value={query} onChange={setQuery} count={filteredCustomers.length} placeholder="Rechercher un client, une ville ou un code…" />
            <div style={{ height: 12 }} />
            {filteredCustomers.length ? <div className={styles.accountabilityList}>{filteredCustomers.slice(0, 20).map((client) => <Link key={client.id} href={client.href} className={styles.accountabilityItem}><span><span className={styles.itemTitle}>{client.name}</span><span className={styles.itemDetail}>{client.code} · {client.city} · {client.healthLabel}</span></span><span><span className={styles.statusChip}>{client.overdueInvoices} en retard</span></span><span><span className={styles.itemTitle}>{formatDh(client.balanceDh)}</span><span className={styles.itemDetail}>MRR {formatDh(client.mrrDh)}</span></span><span className={styles.itemMeta}>{client.openTickets} ticket(s)<br />{client.openIncidents} incident(s)</span></Link>)}</div> : <EmptyExecutiveState title="Aucun client correspondant" text="Aucune exposition client ne correspond à cette recherche." />}
          </div>
        </article>

        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Décisions financières</h2><p className={styles.surfaceMeta}>Chaque dossier ouvre une chambre de conséquence avant l’espace de recouvrement ou de facturation.</p></div><Scale size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}>{financialDecisions.length ? <div className={styles.decisionList}>{financialDecisions.slice(0, 12).map((item) => <button type="button" key={item.id} className={styles.decisionItem} data-tone={item.tone} onClick={() => setDecision(item)}><span className={styles.decisionIcon}><FileWarning size={17} /></span><span><span className={styles.itemTitle}>{item.customerName}</span><span className={styles.itemDetail}>{item.entityLabel} · {item.situation}</span></span><span className={styles.decisionValue}>{formatDh(item.financialImpactDh)}</span></button>)}</div> : <EmptyExecutiveState title="Aucune décision financière déclenchée" text="Aucune facture au statut en retard n’est visible dans la source actuelle." />}</div>
        </article>
      </section>

      <section className={styles.equalGrid}>
        <article className={`${styles.surface} ${styles.surfaceSoft}`}>
          <div className={styles.surfaceBody}>
            <div className={styles.sectionEyebrow}>Contrôle de collection</div>
            <h2 className={styles.sectionTitle}>{collectionRatio}%</h2>
            <p className={styles.sectionDescription}>Rapport indicatif entre paiements confirmés pendant la période et factures émises pendant la même période. Ce rapport n’implique pas que chaque paiement soit automatiquement alloué à une facture de la période.</p>
            <div className={styles.progressTrack}><div className={styles.progressBar} style={{ '--progress': `${collectionRatio}%` } as React.CSSProperties} /></div>
            <div className={styles.heroActions}><Link href="/angelcare-360-operator/billing/payments" className={styles.secondaryButton}>Vérifier les paiements<ReceiptText size={14} /></Link></div>
          </div>
        </article>
        <article className={`${styles.surface} ${styles.surfaceSoft}`}>
          <div className={styles.surfaceBody}>
            <div className={styles.sectionEyebrow}>Pression de retard</div>
            <h2 className={styles.sectionTitle}>{overdueShare}%</h2>
            <p className={styles.sectionDescription}>Part de l’encours actuel portée par des factures au statut en retard. Une valeur élevée exige une stratégie de recouvrement et non une simple relance automatique.</p>
            <div className={styles.progressTrack}><div className={styles.progressBar} style={{ '--progress': `${overdueShare}%` } as React.CSSProperties} /></div>
            <div className={styles.heroActions}><Link href="/angelcare-360-operator/billing/dunning" className={styles.secondaryButton}>Ouvrir le commandement de recouvrement<ArrowRight size={14} /></Link></div>
          </div>
        </article>
      </section>

      <ExecutiveDrawer open={Boolean(stage)} onClose={() => setStage(null)} eyebrow="Preuve du mouvement financier" title={stage?.label || ''} subtitle={stage?.description || ''} stats={stage ? [{ label: 'Valeur', value: formatDh(stage.valueDh) }, { label: 'Registres', value: String(stage.count) }, { label: 'Statut', value: stage.tone }, { label: 'Source', value: 'Registre Operator' }] : []} footer={stage ? <><button type="button" className={styles.secondaryButton} onClick={() => setStage(null)}>Fermer</button><Link href={stage.href} className={styles.primaryButton}>Ouvrir les registres<ArrowRight size={13} /></Link></> : null}>
        {stage ? <><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Définition</span><span className={styles.categoryChip}>{stage.key}</span></div><div className={styles.drawerSectionText}>{stage.description}</div></section><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Règle de lecture</span></div><div className={styles.drawerSectionText}>Cette valeur est calculée depuis les enregistrements disponibles dans la table opérationnelle correspondante. Elle ne doit pas être interprétée comme un rapprochement bancaire ou une prévision garantie lorsque ces preuves ne sont pas présentes.</div></section></> : null}
      </ExecutiveDrawer>
      <DecisionChamber decision={decision} open={Boolean(decision)} onClose={() => setDecision(null)} />
    </div>
  )
}

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }
function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
