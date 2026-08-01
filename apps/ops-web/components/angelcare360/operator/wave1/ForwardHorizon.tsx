'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CalendarClock, ClockAlert, Compass, TimerReset } from 'lucide-react'
import type { Wave1ExecutiveData, Wave1HorizonItem } from './Wave1ExecutiveTypes'
import { EmptyExecutiveState, ExecutiveDrawer, ExecutiveRibbon, SectionHeader, Wave1Hero } from './Wave1ExecutivePrimitives'
import styles from './Wave1ExecutiveExperience.module.css'

export default function ForwardHorizon({ data }: { data: Wave1ExecutiveData }) {
  const [windowDays, setWindowDays] = useState<7 | 30 | 60 | 90 | 180>(90)
  const [category, setCategory] = useState<'all' | Wave1HorizonItem['category']>('all')
  const [selected, setSelected] = useState<Wave1HorizonItem | null>(null)
  const items = useMemo(() => data.horizon.filter((item) => item.daysRemaining <= windowDays && (category === 'all' || item.category === category)), [category, data.horizon, windowDays])
  const critical = items.filter((item) => item.risk === 'critical')
  const valueDh = items.reduce((sum, item) => sum + item.valueDh, 0)
  const overdue = items.filter((item) => item.daysRemaining < 0)

  return (
    <div className={styles.page} data-domain="horizon">
      <Wave1Hero domain="horizon" eyebrow="Forward Horizon" title="Le futur devient une" accent="obligation visible avant l’urgence." subtitle="Renouvellements, échéances financières, contrats, activations, limites et engagements sont regroupés selon le temps restant, la valeur, le risque et la préparation." data={data} primary={{ label: 'Ouvrir les renouvellements', href: '/angelcare-360-operator/renewals' }} secondary={{ label: 'Voir les engagements', href: '/angelcare-360-operator/executive/accountability' }} />
      <ExecutiveRibbon signals={data.signals} />

      <section className={styles.section}>
        <SectionHeader eyebrow="Horizon de management" title={`Les ${windowDays} prochains jours sous contrôle`} description="Un événement dépassé reste visible comme dette de management. Un événement sans date n’est pas inventé et ne peut pas apparaître dans l’horizon." actions={<div className={styles.lensBar}>{([7,30,60,90,180] as const).map((value) => <button key={value} type="button" className={`${styles.lensButton} ${windowDays === value ? styles.lensButtonActive : ''}`} onClick={() => setWindowDays(value)}>{value} jours</button>)}</div>} />
        <div className={styles.metricGrid}>
          <article className={styles.metric}><div className={styles.metricTop}><span className={styles.metricLabel}>Événements visibles</span><span className={styles.metricIcon}><Compass size={17} /></span></div><div className={styles.metricValue}>{items.length}</div><div className={styles.metricDetail}>Éléments dans la fenêtre et la catégorie sélectionnées.</div></article>
          <article className={styles.metric}><div className={styles.metricTop}><span className={styles.metricLabel}>Critiques</span><span className={styles.metricIcon}><ClockAlert size={17} /></span></div><div className={styles.metricValue}>{critical.length}</div><div className={styles.metricDetail}>Événements dépassés, à risque ou très proches selon leur type.</div></article>
          <article className={styles.metric}><div className={styles.metricTop}><span className={styles.metricLabel}>Valeur datée</span><span className={styles.metricIcon}><CalendarClock size={17} /></span></div><div className={styles.metricValue}>{formatDh(valueDh)}</div><div className={styles.metricDetail}>Valeur rattachée aux factures et renouvellements visibles.</div></article>
          <article className={styles.metric}><div className={styles.metricTop}><span className={styles.metricLabel}>Déjà dépassés</span><span className={styles.metricIcon}><TimerReset size={17} /></span></div><div className={styles.metricValue}>{overdue.length}</div><div className={styles.metricDetail}>Obligations dont la date disponible est antérieure à aujourd’hui.</div></article>
        </div>
      </section>

      <section className={styles.surface}>
        <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Horizon par impact</h2><p className={styles.surfaceMeta}>Les catégories permettent de séparer rétention, revenu, contrat, activation, capacité, service et engagement.</p></div><div className={styles.lensBar}>{(['all','renewal','billing','contract','activation','capacity','service','commitment'] as const).map((value) => <button type="button" key={value} className={`${styles.lensButton} ${category === value ? styles.lensButtonActive : ''}`} onClick={() => setCategory(value)}>{labelFor(value)}</button>)}</div></div>
        <div className={styles.surfaceBody}>
          {items.length ? <div className={styles.horizonList}>{items.map((item) => <button type="button" key={item.id} className={styles.horizonItem} data-tone={item.risk} onClick={() => setSelected(item)}><span><span className={styles.itemTitle}>{item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)} j dépassés` : item.daysRemaining === 0 ? 'Aujourd’hui' : `Dans ${item.daysRemaining} j`}</span><span className={styles.itemDetail}>{new Date(item.date).toLocaleDateString('fr-FR')}</span></span><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.customerName} · {labelFor(item.category)}</span></span><span><span className={styles.ownerChip}>{item.owner}</span><span className={styles.itemDetail}>{item.readiness}</span></span><span className={styles.itemMeta}>{item.valueDh ? formatDh(item.valueDh) : item.risk}</span></button>)}</div> : <EmptyExecutiveState title="Aucun événement dans cette fenêtre" text="Aucun élément daté ne correspond à la fenêtre et à la catégorie sélectionnées." />}
        </div>
      </section>

      <section className={styles.equalGrid}>
        {[7,30,90,180].map((days) => {
          const bucket = data.horizon.filter((item) => item.daysRemaining <= days)
          return <article className={`${styles.surface} ${styles.surfaceSoft}`} key={days}><div className={styles.surfaceBody}><div className={styles.sectionEyebrow}>Horizon ≤ {days} jours</div><h2 className={styles.sectionTitle}>{bucket.length} événement(s)</h2><p className={styles.sectionDescription}>{formatDh(bucket.reduce((sum, item) => sum + item.valueDh, 0))} de valeur datée · {bucket.filter((item) => item.risk === 'critical').length} critique(s).</p><div className={styles.heroActions}><button type="button" className={styles.secondaryButton} onClick={() => setWindowDays(days as 7 | 30 | 90 | 180)}>Examiner cette fenêtre<ArrowRight size={13} /></button></div></div></article>
        })}
      </section>

      <ExecutiveDrawer open={Boolean(selected)} onClose={() => setSelected(null)} eyebrow="Événement du Forward Horizon" title={selected?.title || ''} subtitle={selected ? `${selected.customerName} · ${labelFor(selected.category)}` : ''} stats={selected ? [{ label: 'Date', value: new Date(selected.date).toLocaleDateString('fr-FR') }, { label: 'Temps restant', value: selected.daysRemaining < 0 ? `${Math.abs(selected.daysRemaining)} j dépassés` : `${selected.daysRemaining} j` }, { label: 'Valeur', value: selected.valueDh ? formatDh(selected.valueDh) : 'Non financière' }, { label: 'Propriétaire', value: selected.owner }] : []} footer={selected ? <><button type="button" className={styles.secondaryButton} onClick={() => setSelected(null)}>Fermer</button><Link href={selected.href} className={styles.primaryButton}>Ouvrir l’exécution<ArrowRight size={13} /></Link></> : null}>
        {selected ? <><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Préparation actuelle</span><span className={styles.statusChip}>{selected.risk}</span></div><div className={styles.drawerSectionText}>{selected.readiness}</div></section><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Question de management</span></div><div className={styles.drawerSectionText}>Le propriétaire est-il confirmé, la prochaine action est-elle datée, la preuve attendue est-elle définie et le risque de non-action est-il compris avant l’échéance?</div></section></> : null}
      </ExecutiveDrawer>
    </div>
  )
}

function labelFor(value: 'all' | Wave1HorizonItem['category']) { return ({ all: 'Tous', renewal: 'Renouvellement', billing: 'Facturation', contract: 'Contrat', activation: 'Activation', capacity: 'Capacité', service: 'Service', commitment: 'Engagement' })[value] }
function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
