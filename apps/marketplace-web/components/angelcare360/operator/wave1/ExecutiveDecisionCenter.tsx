'use client'

import { useMemo, useState } from 'react'
import { CircleAlert, Gavel, SearchCheck, ShieldCheck } from 'lucide-react'
import type { Wave1Decision, Wave1ExecutiveData } from './Wave1ExecutiveTypes'
import { DecisionChamber, EmptyExecutiveState, ExecutiveRibbon, SearchControl, SectionHeader, Wave1Hero } from './Wave1ExecutivePrimitives'
import styles from './Wave1ExecutiveExperience.module.css'

export default function ExecutiveDecisionCenter({ data }: { data: Wave1ExecutiveData }) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | Wave1Decision['kind']>('all')
  const [selected, setSelected] = useState<Wave1Decision | null>(null)
  const decisions = useMemo(() => {
    const normalized = normalize(query)
    return data.decisions.filter((item) => (kind === 'all' || item.kind === kind) && (!normalized || normalize(`${item.title} ${item.customerName} ${item.entityLabel} ${item.authority} ${item.situation}`).includes(normalized)))
  }, [data.decisions, kind, query])
  const financialExposure = decisions.reduce((sum, item) => sum + item.financialImpactDh, 0)
  const critical = decisions.filter((item) => item.tone === 'critical').length
  const unowned = decisions.filter((item) => item.owner === 'Non attribué' || item.owner.includes('désigner')).length

  return (
    <div className={styles.page} data-domain="decisions">
      <Wave1Hero domain="decisions" eyebrow="Executive Decision Center" title="L’autorité devient une" accent="décision instruite, expliquée et traçable." subtitle="La file sépare les alertes ordinaires des dossiers qui exigent une autorité financière, opérationnelle, commerciale ou de gouvernance." data={data} primary={{ label: 'Voir la preuve d’audit', href: '/angelcare-360-operator/audit' }} secondary={{ label: 'Voir les responsabilités', href: '/angelcare-360-operator/executive/accountability' }} />
      <ExecutiveRibbon signals={data.signals} />

      <section className={styles.section}>
        <SectionHeader eyebrow="Autorité et impact" title="La file des décisions qui méritent une instruction" description="Chaque chambre expose situation, recommandation, alternative, impact, risque de non-action, autorité et preuves avant de rejoindre l’espace de mutation existant." />
        <div className={styles.metricGrid}>
          <article className={styles.metric}><div className={styles.metricTop}><span className={styles.metricLabel}>Décisions visibles</span><span className={styles.metricIcon}><Gavel size={17} /></span></div><div className={styles.metricValue}>{decisions.length}</div><div className={styles.metricDetail}>Dossiers correspondant aux filtres actifs.</div></article>
          <article className={styles.metric}><div className={styles.metricTop}><span className={styles.metricLabel}>Critiques</span><span className={styles.metricIcon}><CircleAlert size={17} /></span></div><div className={styles.metricValue}>{critical}</div><div className={styles.metricDetail}>Dossiers présentant un signal critique.</div></article>
          <article className={styles.metric}><div className={styles.metricTop}><span className={styles.metricLabel}>Impact financier</span><span className={styles.metricIcon}><ShieldCheck size={17} /></span></div><div className={styles.metricValue}>{formatDh(financialExposure)}</div><div className={styles.metricDetail}>Somme des montants liés aux décisions filtrées; pas une perte certaine.</div></article>
          <article className={styles.metric}><div className={styles.metricTop}><span className={styles.metricLabel}>Propriétaire à confirmer</span><span className={styles.metricIcon}><SearchCheck size={17} /></span></div><div className={styles.metricValue}>{unowned}</div><div className={styles.metricDetail}>Décisions sans attribution opérationnelle suffisamment explicite.</div></article>
        </div>
      </section>

      <section className={styles.surface}>
        <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Instruction des décisions</h2><p className={styles.surfaceMeta}>Les décisions sont détectées par des règles visibles: facture en retard, renouvellement à risque, incident critique, activation bloquée ou tenant critique.</p></div><div className={styles.lensBar}>{(['all','finance','service','retention','activation','governance'] as const).map((value) => <button type="button" key={value} className={`${styles.lensButton} ${kind === value ? styles.lensButtonActive : ''}`} onClick={() => setKind(value)}>{labelFor(value)}</button>)}</div></div>
        <div className={styles.surfaceBody}>
          <SearchControl value={query} onChange={setQuery} count={decisions.length} placeholder="Rechercher une décision, un client, une autorité ou une situation…" />
          <div style={{ height: 13 }} />
          {decisions.length ? <div className={styles.decisionList}>{decisions.map((item) => <button type="button" key={item.id} className={styles.decisionItem} data-tone={item.tone} onClick={() => setSelected(item)}><span className={styles.decisionIcon}><Gavel size={17} /></span><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.customerName} · {item.entityLabel}<br />{item.situation}</span></span><span className={styles.decisionValue}>{item.financialImpactDh ? formatDh(item.financialImpactDh) : item.authority}<br /><span className={styles.itemDetail}>{item.deadline ? new Date(item.deadline).toLocaleDateString('fr-FR') : 'Échéance à fixer'}</span></span></button>)}</div> : <EmptyExecutiveState title="Aucune décision correspondante" text="Aucun dossier ne correspond à la catégorie et à la recherche actuelles." />}
        </div>
      </section>

      <DecisionChamber decision={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  )
}

function labelFor(value: 'all' | Wave1Decision['kind']) { return ({ all: 'Toutes', finance: 'Finance', service: 'Service', retention: 'Rétention', activation: 'Activation', governance: 'Gouvernance' })[value] }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }
function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
