'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Activity, ArrowRight, CircleAlert, Clock3, Headphones, Siren } from 'lucide-react'
import type { Wave1ExecutiveData, Wave1ServicePressure } from './Wave1ExecutiveTypes'
import { EmptyExecutiveState, ExecutiveDrawer, ExecutiveRibbon, MetricCard, SearchControl, SectionHeader, Wave1Hero } from './Wave1ExecutivePrimitives'
import styles from './Wave1ExecutiveExperience.module.css'

export default function ServiceExecutiveCommand({ data }: { data: Wave1ExecutiveData }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Wave1ServicePressure | null>(null)
  const items = useMemo(() => {
    const normalized = normalize(query)
    return data.servicePressure.filter((item) => !normalized || normalize(`${item.title} ${item.customerName} ${item.type} ${item.owner} ${item.impact}`).includes(normalized))
  }, [data.servicePressure, query])
  const critical = items.filter((item) => item.severity === 'critical')
  const exposedDh = critical.reduce((sum, item) => sum + item.financialExposureDh, 0)
  const unowned = items.filter((item) => item.owner === 'Non attribué')
  const affected = new Set(items.map((item) => item.customerName)).size

  return (
    <div className={styles.page} data-domain="service">
      <Wave1Hero domain="service" eyebrow="Service Executive Command" title="Le service devient une" accent="pression quantifiée et commandée." subtitle="Tickets, incidents, demandes et blocages d’activation sont reliés à leur durée, leur client, leur propriétaire et la valeur récurrente potentiellement exposée." data={data} primary={{ label: 'Ouvrir le support', href: '/angelcare-360-operator/support' }} secondary={{ label: 'Entrer en salle d’incident', href: '/angelcare-360-operator/incidents' }} />
      <ExecutiveRibbon signals={data.signals} />

      <section className={styles.section}>
        <SectionHeader eyebrow="Pression opérationnelle" title="Ce qui menace actuellement l’expérience client" description="Les pressions ne sont pas classées uniquement par priorité déclarée: sévérité, durée, répétition et valeur client sont visibles ensemble." />
        <div className={styles.metricGrid}>
          <MetricCard label="Pressions critiques" value={String(critical.length)} detail="Incidents critiques et tickets ou demandes urgentes" href="/angelcare-360-operator/incidents" icon="risk" />
          <MetricCard label="Clients affectés" value={String(affected)} detail="Institutions présentes dans la file de pression actuelle" href="/angelcare-360-operator/clients" icon="users" />
          <MetricCard label="Valeur potentiellement exposée" value={formatDh(exposedDh)} detail="ARR indicatif des clients liés aux pressions critiques; pas une perte constatée" href="/angelcare-360-operator/executive/customers" icon="money" />
          <MetricCard label="Sans propriétaire" value={String(unowned.length)} detail="Pressions ouvertes sans attribution explicite" href="/angelcare-360-operator/executive/accountability" icon="target" />
        </div>
      </section>

      <section className={styles.controlGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Radar de pression service</h2><p className={styles.surfaceMeta}>Cliquez sur une pression pour ouvrir son micro-espace exécutif puis rejoindre la résolution opérationnelle.</p></div><Siren size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}>
            <SearchControl value={query} onChange={setQuery} count={items.length} placeholder="Rechercher un client, un incident, un ticket ou un propriétaire…" />
            <div style={{ height: 12 }} />
            {items.length ? <div className={styles.pressureList}>{items.map((item) => <button type="button" key={item.id} className={styles.pressureItem} data-tone={item.severity} onClick={() => setSelected(item)}><span className={styles.toneDot} /><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.customerName} · {item.type} · {item.impact}</span></span><span className={styles.itemMeta}>{item.durationLabel}<br />{item.financialExposureDh ? formatDh(item.financialExposureDh) : 'Impact à qualifier'}</span></button>)}</div> : <EmptyExecutiveState title="Aucune pression correspondante" text="Aucun ticket, incident, blocage ou demande ouverte ne correspond à la recherche actuelle." />}
          </div>
        </article>

        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Distribution des causes</h2><p className={styles.surfaceMeta}>Lecture simple des objets qui alimentent la pression exécutive.</p></div><Activity size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}>
            {(['incident', 'ticket', 'activation', 'request'] as const).map((type) => {
              const count = items.filter((item) => item.type === type).length
              const ratio = items.length ? Math.round(count / items.length * 100) : 0
              return <section className={styles.drawerSection} key={type}><div className={styles.drawerSectionTitle}><span>{labelFor(type)}</span><span className={styles.statusChip}>{count} · {ratio}%</span></div><div className={styles.progressTrack}><div className={styles.progressBar} style={{ '--progress': `${ratio}%` } as React.CSSProperties} /></div><div className={styles.drawerSectionText}>{explainType(type)}</div></section>
            })}
          </div>
        </article>
      </section>

      <section className={styles.equalGrid}>
        <article className={styles.surface}><div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Commandement par propriétaire</h2><p className={styles.surfaceMeta}>La pression ne doit pas rester anonyme.</p></div><Headphones size={18} color="#64748b" /></div><div className={styles.surfaceBody}><OwnerBreakdown items={items} /></div></article>
        <article className={styles.surface}><div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Décisions service</h2><p className={styles.surfaceMeta}>Incidents critiques ou d’avertissement détectés par les règles Wave 1.</p></div><CircleAlert size={18} color="#64748b" /></div><div className={styles.surfaceBody}>{data.decisions.filter((item) => item.kind === 'service').length ? <div className={styles.decisionList}>{data.decisions.filter((item) => item.kind === 'service').slice(0, 10).map((item) => <Link href="/angelcare-360-operator/executive/decisions" key={item.id} className={styles.decisionItem} data-tone={item.tone}><span className={styles.decisionIcon}><CircleAlert size={17} /></span><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.customerName} · {item.situation}</span></span><span className={styles.decisionValue}>{item.authority}</span></Link>)}</div> : <EmptyExecutiveState title="Aucune décision service déclenchée" text="Aucun incident critique ou d’avertissement ouvert ne remplit actuellement la règle de décision." />}</div></article>
      </section>

      <ServicePressureDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function OwnerBreakdown({ items }: { items: Wave1ServicePressure[] }) {
  const groups = Array.from(items.reduce((map, item) => map.set(item.owner, (map.get(item.owner) || 0) + 1), new Map<string, number>())).sort((a, b) => b[1] - a[1])
  if (!groups.length) return <EmptyExecutiveState title="Aucun propriétaire visible" text="La file de pression est vide." />
  return <div className={styles.accountabilityList}>{groups.map(([owner, count]) => <Link key={owner} href="/angelcare-360-operator/executive/accountability" className={styles.accountabilityItem}><span><span className={styles.itemTitle}>{owner}</span><span className={styles.itemDetail}>Responsabilité service actuelle</span></span><span><span className={styles.ownerChip}>{count} pression(s)</span></span><span><div className={styles.progressTrack}><div className={styles.progressBar} style={{ '--progress': `${Math.min(100, count * 18)}%` } as React.CSSProperties} /></div></span><span className={styles.itemMeta}>{owner === 'Non attribué' ? 'Escalade requise' : 'Attribué'}</span></Link>)}</div>
}

function ServicePressureDrawer({ item, onClose }: { item: Wave1ServicePressure | null; onClose: () => void }) {
  return <ExecutiveDrawer open={Boolean(item)} onClose={onClose} eyebrow="Service Pressure Micro-App" title={item?.title || ''} subtitle={item ? `${item.customerName} · ${labelFor(item.type)}` : ''} stats={item ? [{ label: 'Sévérité', value: item.severity }, { label: 'Durée', value: item.durationLabel }, { label: 'Propriétaire', value: item.owner }, { label: 'ARR exposé indicatif', value: item.financialExposureDh ? formatDh(item.financialExposureDh) : 'À qualifier' }] : []} footer={item ? <><button type="button" className={styles.secondaryButton} onClick={onClose}>Fermer</button><Link href={item.href} className={styles.primaryButton}>Ouvrir la résolution<ArrowRight size={13} /></Link></> : null}>
    {item ? <>
      <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Impact observé</span><span className={styles.statusChip}>{item.severity}</span></div><div className={styles.drawerSectionText}>{item.impact}</div></section>
      <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Ordre de commandement</span><Clock3 size={14} color="#64748b" /></div><div className={styles.drawerSectionText}>1. confirmer la portée; 2. confirmer le propriétaire; 3. fixer la prochaine mise à jour; 4. relier la communication client; 5. vérifier l’issue dans le registre d’audit.</div></section>
      <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Limite de lecture</span></div><div className={styles.drawerSectionText}>La valeur exposée correspond à l’ARR indicatif du client lié. Elle ne constitue pas une perte, un SLA calculé ni une prédiction de churn.</div></section>
    </> : null}
  </ExecutiveDrawer>
}

function labelFor(type: Wave1ServicePressure['type']) { return ({ incident: 'Incident', ticket: 'Ticket support', activation: 'Blocage activation', request: 'Demande de service' })[type] }
function explainType(type: Wave1ServicePressure['type']) { return ({ incident: 'Événement opérationnel nécessitant investigation, confinement ou récupération.', ticket: 'Demande ou défaut client traité selon priorité et état.', activation: 'Étape d’onboarding bloquant la mise en service.', request: 'Demande structurée de configuration ou de service.' })[type] }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }
function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
