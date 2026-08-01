'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowRight, Building2, ChartNoAxesCombined, CircleDollarSign, HeartPulse, MapPinned } from 'lucide-react'
import type { Wave1Customer, Wave1ExecutiveData, Wave1Lens } from './Wave1ExecutiveTypes'
import {
  EmptyExecutiveState,
  ExecutiveDrawer,
  ExecutiveRibbon,
  LensSwitcher,
  SearchControl,
  SectionHeader,
  Wave1Hero,
} from './Wave1ExecutivePrimitives'
import styles from './Wave1ExecutiveExperience.module.css'

type NodeStyle = CSSProperties & { '--node-size': string; '--node-color': string }

export default function CustomerValueCommand({ data }: { data: Wave1ExecutiveData }) {
  const [lens, setLens] = useState<Wave1Lens>('executive')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Wave1Customer | null>(null)
  const customers = useMemo(() => {
    const normalized = normalize(query)
    const list = data.customers.filter((item) => !normalized || normalize(`${item.name} ${item.code} ${item.city} ${item.healthLabel} ${item.lifecycle}`).includes(normalized))
    return [...list].sort((a, b) => compareByLens(a, b, lens))
  }, [data.customers, lens, query])
  const totalMrr = customers.reduce((sum, item) => sum + item.mrrDh, 0)
  const critical = customers.filter((item) => item.healthBand === 'critical')
  const topThree = [...customers].sort((a, b) => b.mrrDh - a.mrrDh).slice(0, 3)
  const concentration = totalMrr ? Math.round(topThree.reduce((sum, item) => sum + item.mrrDh, 0) / totalMrr * 100) : 0

  return (
    <div className={styles.page} data-domain="customers">
      <Wave1Hero
        domain="customers"
        eyebrow="Customer Value & Risk Command"
        title="Chaque relation devient une"
        accent="carte de valeur explicable."
        subtitle="La direction peut comparer valeur récurrente, exposition financière, pression service, activation et renouvellement sans réduire la relation à un score opaque."
        data={data}
        primary={{ label: 'Ouvrir le portefeuille opérationnel', href: '/angelcare-360-operator/clients' }}
        secondary={{ label: 'Voir les renouvellements', href: '/angelcare-360-operator/renewals' }}
      />
      <ExecutiveRibbon signals={data.signals} />

      <section className={styles.section}>
        <SectionHeader
          eyebrow="Lentilles management"
          title="Le même portefeuille, six questions de direction"
          description="Chaque lentille réorganise les comptes selon l’enjeu de management sans modifier les données sources."
          actions={<LensSwitcher value={lens} onChange={setLens} options={[{ value: 'executive', label: 'Vue exécutive' }, { value: 'financial', label: 'Risque financier' }, { value: 'service', label: 'Pression service' }, { value: 'retention', label: 'Rétention' }, { value: 'activation', label: 'Activation' }, { value: 'governance', label: 'Responsabilité' }]} />}
        />
        <div className={styles.metricGrid}>
          <Link className={styles.metric} href="/angelcare-360-operator/clients"><div className={styles.metricTop}><span className={styles.metricLabel}>Portefeuille visible</span><span className={styles.metricIcon}><Building2 size={17} /></span></div><div className={styles.metricValue}>{customers.length}</div><div className={styles.metricDetail}>Clients correspondant à la recherche et à la source actuelle.</div></Link>
          <Link className={styles.metric} href="/angelcare-360-operator/customer-health"><div className={styles.metricTop}><span className={styles.metricLabel}>Relations critiques</span><span className={styles.metricIcon}><HeartPulse size={17} /></span></div><div className={styles.metricValue}>{critical.length}</div><div className={styles.metricDetail}>Au moins un facteur critique ou un état relationnel à risque.</div></Link>
          <Link className={styles.metric} href="/angelcare-360-operator/executive/revenue"><div className={styles.metricTop}><span className={styles.metricLabel}>MRR du périmètre</span><span className={styles.metricIcon}><CircleDollarSign size={17} /></span></div><div className={styles.metricValue}>{formatDh(totalMrr)}</div><div className={styles.metricDetail}>Somme des abonnements actifs rattachés aux clients affichés.</div></Link>
          <Link className={styles.metric} href="/angelcare-360-operator/executive/customers"><div className={styles.metricTop}><span className={styles.metricLabel}>Concentration top 3</span><span className={styles.metricIcon}><ChartNoAxesCombined size={17} /></span></div><div className={styles.metricValue}>{concentration}%</div><div className={styles.metricDetail}>Part du MRR visible portée par les trois principaux comptes.</div></Link>
        </div>
      </section>

      <section className={styles.controlGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Paysage relationnel interactif</h2><p className={styles.surfaceMeta}>La position et la taille s’adaptent à la lentille active. Cliquez pour ouvrir la décomposition causale.</p></div><MapPinned size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}><SearchControl value={query} onChange={setQuery} count={customers.length} placeholder="Rechercher une institution, une ville, un état ou une étape…" /></div>
          {customers.length ? <div className={styles.valueLandscape}>
            <div className={styles.landscapeZone} /><div className={styles.landscapeZone} /><div className={styles.landscapeZone} /><div className={styles.landscapeZone} />
            <span className={`${styles.axisLabel} ${styles.axisLabelX}`}>{axisX(lens)} →</span><span className={`${styles.axisLabel} ${styles.axisLabelY}`}>{axisY(lens)} →</span>
            {customers.slice(0, 24).map((item, index) => {
              const node = positionFor(item, index, customers, lens)
              const style: NodeStyle = { left: `${node.x}%`, top: `${node.y}%`, '--node-size': `${node.size}px`, '--node-color': colorFor(item.healthBand) }
              return <button type="button" key={item.id} className={styles.customerNode} style={style} onClick={() => setSelected(item)}><span><span className={styles.customerNodeName}>{item.name}</span><span className={styles.customerNodeValue}>{node.label}</span></span></button>
            })}
          </div> : <EmptyExecutiveState title="Aucun client correspondant" text="Aucune institution ne correspond à cette recherche. Le système n’ajoute aucun compte fictif." />}
        </article>

        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Concentration et intervention</h2><p className={styles.surfaceMeta}>Les comptes les plus significatifs sont reliés à leur santé, leur encours et leur renouvellement.</p></div><ChartNoAxesCombined size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}>
            {topThree.length ? <div className={styles.pressureList}>{topThree.map((item, index) => <button type="button" key={item.id} className={styles.pressureItem} data-tone={toneFor(item)} onClick={() => setSelected(item)}><span className={styles.toneDot} /><span><span className={styles.itemTitle}>#{index + 1} · {item.name}</span><span className={styles.itemDetail}>{item.healthLabel} · {item.city} · {item.lifecycle}</span></span><span className={styles.itemMeta}>{formatDh(item.mrrDh)} MRR<br />{formatDh(item.balanceDh)} encours</span></button>)}</div> : <EmptyExecutiveState title="Concentration indisponible" text="Aucun MRR client ne peut être calculé à partir des abonnements disponibles." />}
            <div style={{ height: 13 }} />
            <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Lecture management</span><span className={styles.statusChip}>{lensLabel(lens)}</span></div><div className={styles.drawerSectionText}>{lensExplanation(lens)}</div></section>
          </div>
        </article>
      </section>

      <section className={styles.section}>
        <SectionHeader eyebrow="Matrice explicable" title="Les facteurs qui renforcent ou fragilisent chaque relation" description="Chaque cellule ouvre sa source opérationnelle. Les valeurs inconnues restent explicitement inconnues." />
        <article className={styles.surface}><div className={styles.surfaceBody}>{customers.length ? <div className={styles.accountabilityList}>{customers.slice(0, 24).map((item) => <button type="button" key={item.id} className={styles.accountabilityItem} onClick={() => setSelected(item)}><span><span className={styles.itemTitle}>{item.name}</span><span className={styles.itemDetail}>{item.healthLabel} · {item.owner}</span></span><span><span className={styles.statusChip}>{formatDh(item.mrrDh)}</span></span><span><div className={styles.healthGrid}>{item.factors.slice(0, 3).map((factor) => <span key={factor.key} className={styles.healthFactor} data-state={factor.state}><span className={styles.factorLabel}>{factor.label}</span><span className={styles.factorValue}>{factor.value}</span></span>)}</div></span><span className={styles.itemMeta}>{item.renewalDate ? new Date(item.renewalDate).toLocaleDateString('fr-FR') : 'Renouvellement non disponible'}</span></button>)}</div> : <EmptyExecutiveState title="Aucune relation à analyser" text="Le registre clients ne contient aucun élément visible." />}</div></article>
      </section>

      <CustomerIntelligenceDrawer customer={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function CustomerIntelligenceDrawer({ customer, onClose }: { customer: Wave1Customer | null; onClose: () => void }) {
  return <ExecutiveDrawer open={Boolean(customer)} onClose={onClose} eyebrow="Customer Operational Twin · Wave 1" title={customer?.name || ''} subtitle={customer ? `${customer.code} · ${customer.city} · ${customer.status} / ${customer.lifecycle}` : ''} stats={customer ? [{ label: 'MRR', value: formatDh(customer.mrrDh) }, { label: 'Encours', value: formatDh(customer.balanceDh) }, { label: 'Service', value: `${customer.openTickets} tickets / ${customer.openIncidents} incidents` }, { label: 'Renouvellement', value: customer.renewalDate ? new Date(customer.renewalDate).toLocaleDateString('fr-FR') : 'Non disponible' }] : []} footer={customer ? <><button type="button" className={styles.secondaryButton} onClick={onClose}>Fermer</button><Link href={customer.href} className={styles.primaryButton}>Ouvrir le dossier complet<ArrowRight size={13} /></Link></> : null}>
    {customer ? <>
      <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Situation exécutive</span><span className={styles.statusChip}>{customer.healthLabel}</span></div><div className={styles.drawerSectionText}>Cette lecture ne repose pas sur un score opaque. Elle combine exclusivement les facteurs ci-dessous à partir des factures, tickets, incidents, renouvellements, onboarding et activité tenant disponibles.</div></section>
      {customer.factors.map((factor, index) => <section key={factor.key} className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>{index + 1}. {factor.label}</span><span className={styles.categoryChip}>{factor.state}</span></div><div className={styles.factorValue}>{factor.value}</div><div className={styles.drawerSectionText}>{factor.explanation}</div><Link href={factor.href} className={styles.drawerEvidenceLink}><strong>Source · {factor.source}</strong><span>Explorer<ArrowRight size={11} /></span></Link></section>)}
      <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Intervention management</span></div><div className={styles.drawerSectionText}>Confirmer un propriétaire, choisir le facteur prioritaire, fixer une échéance et exiger une preuve de résultat dans les espaces opérationnels existants.</div></section>
    </> : null}
  </ExecutiveDrawer>
}

function compareByLens(a: Wave1Customer, b: Wave1Customer, lens: Wave1Lens) {
  if (lens === 'financial') return b.balanceDh - a.balanceDh || b.overdueInvoices - a.overdueInvoices
  if (lens === 'service') return (b.openIncidents * 10 + b.urgentTickets * 5 + b.openTickets) - (a.openIncidents * 10 + a.urgentTickets * 5 + a.openTickets)
  if (lens === 'retention') return (a.renewalDate ? +new Date(a.renewalDate) : Infinity) - (b.renewalDate ? +new Date(b.renewalDate) : Infinity)
  if (lens === 'activation') return b.blockedActivation - a.blockedActivation || a.tenantCount - b.tenantCount
  if (lens === 'governance') return Number(a.owner === 'Non attribué') - Number(b.owner === 'Non attribué') || b.mrrDh - a.mrrDh
  return riskScore(b) - riskScore(a) || b.mrrDh - a.mrrDh
}
function riskScore(item: Wave1Customer) { return item.healthBand === 'critical' ? 100 : item.healthBand === 'watch' ? 50 : item.healthBand === 'unknown' ? 20 : 0 }
function positionFor(item: Wave1Customer, index: number, all: Wave1Customer[], lens: Wave1Lens) {
  const maxMrr = Math.max(...all.map((client) => client.mrrDh), 1)
  const maxBalance = Math.max(...all.map((client) => client.balanceDh), 1)
  const maxService = Math.max(...all.map((client) => client.openTickets + client.openIncidents * 4), 1)
  const xMetric = lens === 'financial' ? item.balanceDh / maxBalance : lens === 'service' ? (item.openTickets + item.openIncidents * 4) / maxService : item.mrrDh / maxMrr
  const yMetric = lens === 'retention' ? (item.renewalDate ? Math.max(0, Math.min(1, (180 - daysUntil(item.renewalDate)) / 180)) : .3) : lens === 'activation' ? Math.min(1, (item.blockedActivation + Number(item.tenantCount === 0)) / 3) : item.healthBand === 'critical' ? .88 : item.healthBand === 'watch' ? .62 : item.healthBand === 'unknown' ? .5 : .24
  return { x: 12 + xMetric * 76, y: 12 + yMetric * 76 + ((index * 11) % 8) - 4, size: 56 + Math.sqrt(item.mrrDh / maxMrr) * 48, label: lens === 'financial' ? formatDh(item.balanceDh) : lens === 'service' ? `${item.openTickets + item.openIncidents} pression(s)` : lens === 'retention' ? (item.renewalDate ? `${daysUntil(item.renewalDate)} j` : '—') : formatDh(item.mrrDh) }
}
function axisX(lens: Wave1Lens) { return lens === 'financial' ? 'Exposition financière' : lens === 'service' ? 'Pression service' : lens === 'retention' ? 'Valeur récurrente' : lens === 'activation' ? 'Valeur client' : 'Valeur récurrente' }
function axisY(lens: Wave1Lens) { return lens === 'retention' ? 'Proximité renouvellement' : lens === 'activation' ? 'Blocage activation' : lens === 'governance' ? 'Déficit de responsabilité' : 'Niveau de risque' }
function lensLabel(lens: Wave1Lens) { return ({ executive: 'Exécutive', financial: 'Financière', service: 'Service', retention: 'Rétention', activation: 'Activation', governance: 'Gouvernance' })[lens] }
function lensExplanation(lens: Wave1Lens) { return ({ executive: 'Priorise simultanément risque explicable et valeur récurrente.', financial: 'Classe les clients selon l’encours, le retard et le poids financier.', service: 'Remonte incidents, tickets urgents et volume de pression.', retention: 'Met en avant la proximité et le risque de renouvellement.', activation: 'Met en avant les blocages onboarding, tenants absents ou non actifs.', governance: 'Met en avant les relations sans propriétaire ou sans responsabilité explicite.' })[lens] }
function colorFor(band: Wave1Customer['healthBand']) { return band === 'critical' ? '#dc2626' : band === 'watch' ? '#d97706' : band === 'healthy' ? '#16a34a' : '#64748b' }
function toneFor(item: Wave1Customer) { return item.healthBand === 'critical' ? 'critical' : item.healthBand === 'watch' ? 'warning' : item.healthBand === 'healthy' ? 'success' : 'info' }
function daysUntil(value: string) { return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000) }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }
function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
