'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowRight, CircleDollarSign, Command, ShieldCheck, UserRoundSearch } from 'lucide-react'
import type { Wave1Customer, Wave1Decision, Wave1ExecutiveData, Wave1ServicePressure } from './Wave1ExecutiveTypes'
import {
  DecisionChamber,
  EmptyExecutiveState,
  EvidenceDrawer,
  ExecutiveDrawer,
  ExecutiveRibbon,
  MetricCard,
  SectionHeader,
  Wave1Hero,
} from './Wave1ExecutivePrimitives'
import styles from './Wave1ExecutiveExperience.module.css'

type NodeStyle = CSSProperties & { '--node-size': string; '--node-color': string }

export default function ExecutiveCommandCenter({ data }: { data: Wave1ExecutiveData }) {
  const [customer, setCustomer] = useState<Wave1Customer | null>(null)
  const [pressure, setPressure] = useState<Wave1ServicePressure | null>(null)
  const [decision, setDecision] = useState<Wave1Decision | null>(null)
  const landscape = useMemo(() => data.customers.slice(0, 18), [data.customers])

  return (
    <div className={styles.page} data-domain="executive">
      <Wave1Hero
        domain="executive"
        eyebrow="Wave 1 · Executive Intelligence"
        title="Le système exécutif qui transforme les signaux en"
        accent="décisions gouvernées."
        subtitle="Une situation connectée pour comprendre le portefeuille, protéger le revenu, anticiper les obligations, commander le service et rendre chaque intervention attribuée, datée et prouvable."
        data={data}
        primary={{ label: 'Entrer en mode conseil', href: '/angelcare-360-operator/executive/board' }}
        secondary={{ label: 'Ouvrir la file de décisions', href: '/angelcare-360-operator/executive/decisions' }}
      />
      <ExecutiveRibbon signals={data.signals} />

      <section className={styles.section}>
        <SectionHeader eyebrow="Situation réseau" title="Les six lectures qui gouvernent la journée de direction" description="Chaque lecture conduit vers ses causes, ses entités et son espace d’intervention réel." />
        <div className={styles.metricGrid}>
          <MetricCard label="MRR estimé" value={formatDh(data.summary.mrrDh)} detail={`${data.summary.activeSubscriptions} abonnement(s) actifs · ARR ${formatDh(data.summary.arrDh)}`} href="/angelcare-360-operator/executive/revenue" icon="money" />
          <MetricCard label="Exposition en retard" value={formatDh(data.summary.overdueDh)} detail={`${data.summary.outstandingDh ? formatDh(data.summary.outstandingDh) : 'Aucun'} d’encours total`} href="/angelcare-360-operator/billing/balances" icon="risk" />
          <MetricCard label="Clients critiques" value={String(data.customers.filter((item) => item.healthBand === 'critical').length)} detail="Relations présentant au moins un facteur critique explicable" href="/angelcare-360-operator/executive/customers" icon="users" />
          <MetricCard label="Décisions à instruire" value={String(data.decisions.length)} detail="Dossiers détectés par règles déterministes et preuves disponibles" href="/angelcare-360-operator/executive/decisions" icon="target" />
        </div>
      </section>

      <section className={styles.controlGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div><h2 className={styles.surfaceTitle}>Paysage valeur × maîtrise client</h2><p className={styles.surfaceMeta}>Position horizontale: valeur récurrente relative · position verticale: niveau de maîtrise relationnelle. Cliquez sur chaque institution.</p></div>
            <Link className={styles.ghostButton} href="/angelcare-360-operator/executive/customers">Portefeuille complet<ArrowRight size={12} /></Link>
          </div>
          {landscape.length ? (
            <div className={styles.valueLandscape}>
              <div className={styles.landscapeZone} /><div className={styles.landscapeZone} /><div className={styles.landscapeZone} /><div className={styles.landscapeZone} />
              <span className={`${styles.axisLabel} ${styles.axisLabelX}`}>Valeur récurrente →</span><span className={`${styles.axisLabel} ${styles.axisLabelY}`}>Maîtrise relationnelle →</span>
              {landscape.map((item, index) => {
                const position = nodePosition(item, index, landscape)
                const style: NodeStyle = { left: `${position.x}%`, top: `${position.y}%`, '--node-size': `${position.size}px`, '--node-color': colorFor(item.healthBand) }
                return <button type="button" key={item.id} className={styles.customerNode} style={style} onClick={() => setCustomer(item)} aria-label={`Ouvrir l’intelligence de ${item.name}`}><span><span className={styles.customerNodeName}>{item.name}</span><span className={styles.customerNodeValue}>{formatDh(item.mrrDh)}</span></span></button>
              })}
            </div>
          ) : <EmptyExecutiveState title="Aucun client disponible" text="Le paysage reste vide tant que la source clients ne fournit aucun enregistrement. Aucun client fictif n’est injecté." />}
        </article>

        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Agenda de direction</h2><p className={styles.surfaceMeta}>Pressions classées par sévérité, valeur exposée et durée.</p></div><Command size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}>
            {data.servicePressure.length ? <div className={styles.pressureList}>{data.servicePressure.slice(0, 9).map((item) => <button type="button" key={item.id} className={styles.pressureItem} data-tone={item.severity} onClick={() => setPressure(item)}><span className={styles.toneDot} /><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.customerName} · {item.impact}</span></span><span className={styles.itemMeta}>{item.durationLabel}<br />{item.financialExposureDh ? formatDh(item.financialExposureDh) : 'Impact à qualifier'}</span></button>)}</div> : <EmptyExecutiveState title="Aucune pression ouverte" text="Aucun ticket urgent, incident actif ou blocage prioritaire n’est visible dans les sources actuelles." />}
          </div>
        </article>
      </section>

      <section className={styles.section}>
        <SectionHeader eyebrow="Revenu récurrent" title="De l’abonnement à la valeur protégée" description="La chaîne n’est pas une illustration: chaque étape ouvre le registre financier ou commercial qui la justifie." actions={<Link href="/angelcare-360-operator/executive/revenue" className={styles.secondaryButton}>Commandement revenu<CircleDollarSign size={14} /></Link>} />
        <article className={styles.surface}><div className={styles.revenueFlow}>{data.revenueStages.map((stage, index) => <Link key={stage.key} href={stage.href} className={styles.revenueStage} data-tone={stage.tone}><span className={styles.stageIndex}>0{index + 1}</span><div><div className={styles.stageLabel}>{stage.label}</div><div className={styles.stageValue}>{formatDh(stage.valueDh)}</div><div className={styles.stageCount}>{stage.count} registre(s)</div></div><div className={styles.stageDescription}>{stage.description}</div></Link>)}</div></article>
      </section>

      <section className={styles.equalGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Décisions prêtes à instruire</h2><p className={styles.surfaceMeta}>Aucune mutation n’est simulée ici: la chambre expose l’impact puis ouvre l’espace d’exécution protégé.</p></div><ShieldCheck size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}>{data.decisions.length ? <div className={styles.decisionList}>{data.decisions.slice(0, 8).map((item) => <button type="button" key={item.id} className={styles.decisionItem} data-tone={item.tone} onClick={() => setDecision(item)}><span className={styles.decisionIcon}><ShieldCheck size={17} /></span><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.customerName} · {item.situation}</span></span><span className={styles.decisionValue}>{item.financialImpactDh ? formatDh(item.financialImpactDh) : item.authority}</span></button>)}</div> : <EmptyExecutiveState title="Aucune décision déclenchée" text="Les règles déterministes ne détectent actuellement aucun impayé en retard, renouvellement à risque, incident critique ou activation prioritaire bloquée." />}</div>
        </article>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Responsabilité visible</h2><p className={styles.surfaceMeta}>Les engagements non attribués, bloqués, en retard ou sans preuve remontent en premier.</p></div><UserRoundSearch size={18} color="#64748b" /></div>
          <div className={styles.surfaceBody}>{data.accountability.length ? <div className={styles.accountabilityList}>{data.accountability.slice(0, 8).map((item) => <Link href={item.href} key={item.id} className={styles.accountabilityItem}><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.customerName} · {item.impact}</span></span><span><span className={styles.ownerChip}>{item.owner}</span></span><span><div className={styles.progressTrack}><div className={styles.progressBar} style={{ '--progress': `${item.progress}%` } as CSSProperties} /></div><span className={styles.itemDetail}>{item.state}</span></span><span className={styles.itemMeta}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('fr-FR') : 'Échéance à fixer'}</span></Link>)}</div> : <EmptyExecutiveState title="Aucun engagement ouvert" text="Les sources actuelles ne contiennent aucune tâche, activation, demande ou décision ouverte." />}</div>
        </article>
      </section>

      <section className={styles.section}>
        <SectionHeader eyebrow="Preuve et gouvernance" title="Derniers événements qui ont modifié la situation" description="Le flux réunit audit opérateur et événements de service, triés chronologiquement." />
        <article className={styles.surface}><div className={styles.surfaceBody}>{data.auditEvents.length ? <div className={styles.auditList}>{data.auditEvents.slice(0, 14).map((item) => <Link key={item.id} href={item.href} className={styles.auditItem} data-tone={item.tone}><span className={styles.toneDot} /><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.detail}</span></span><span className={styles.itemMeta}>{new Date(item.timestamp).toLocaleString('fr-FR')}</span></Link>)}</div> : <EmptyExecutiveState title="Aucune preuve disponible" text="Le registre d’audit et les événements de service ne renvoient aucun élément récent." />}</div></article>
      </section>

      <CustomerDrawer customer={customer} onClose={() => setCustomer(null)} />
      <PressureDrawer pressure={pressure} onClose={() => setPressure(null)} />
      <DecisionChamber decision={decision} open={Boolean(decision)} onClose={() => setDecision(null)} />
    </div>
  )
}

function CustomerDrawer({ customer, onClose }: { customer: Wave1Customer | null; onClose: () => void }) {
  const [evidence, setEvidence] = useState<Wave1Customer['factors'][number] | null>(null)
  const closeAll = () => { setEvidence(null); onClose() }
  return <>
    <ExecutiveDrawer open={Boolean(customer)} onClose={closeAll} eyebrow="Intelligence relationnelle" title={customer?.name || ''} subtitle={customer ? `${customer.code} · ${customer.city} · ${customer.healthLabel}` : ''} stats={customer ? [{ label: 'MRR', value: formatDh(customer.mrrDh) }, { label: 'Encours', value: formatDh(customer.balanceDh) }, { label: 'Tenants', value: String(customer.tenantCount) }, { label: 'Renouvellement', value: customer.renewalDate ? new Date(customer.renewalDate).toLocaleDateString('fr-FR') : 'Non disponible' }] : []} footer={customer ? <><button type="button" className={styles.secondaryButton} onClick={closeAll}>Fermer</button><Link href={customer.href} className={styles.primaryButton}>Ouvrir le dossier 360°<ArrowRight size={13} /></Link></> : null}>
      {customer ? <>
        <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Explication de santé</span><span className={styles.statusChip}>{customer.healthLabel}</span></div><div className={styles.healthGrid}>{customer.factors.map((factor) => <button type="button" key={factor.key} className={styles.healthFactor} data-state={factor.state} onClick={() => setEvidence(factor)}><span className={styles.factorLabel}>{factor.label}</span><span className={styles.factorValue}>{factor.value}</span></button>)}</div></section>
        {customer.factors.map((factor) => <section className={styles.drawerSection} key={`explain-${factor.key}`}><div className={styles.drawerSectionTitle}><span>{factor.label}</span><span className={styles.categoryChip}>{factor.source}</span></div><div className={styles.drawerSectionText}>{factor.explanation}</div><button type="button" className={styles.drawerEvidenceLink} onClick={() => setEvidence(factor)}><strong>Inspecter la preuve sans perdre le dossier</strong><span>{factor.value}</span></button></section>)}
      </> : null}
    </ExecutiveDrawer>
    <EvidenceDrawer open={Boolean(evidence)} onClose={() => setEvidence(null)} eyebrow={`Preuve · ${customer?.name || ''}`} title={evidence?.label || ''} value={evidence?.value || ''} explanation={evidence?.explanation || ''} source={evidence?.source || ''} href={evidence?.href || '/angelcare-360-operator'} />
  </>
}

function PressureDrawer({ pressure, onClose }: { pressure: Wave1ServicePressure | null; onClose: () => void }) {
  return <ExecutiveDrawer open={Boolean(pressure)} onClose={onClose} eyebrow="Pression de service" title={pressure?.title || ''} subtitle={pressure ? `${pressure.customerName} · ${pressure.type}` : ''} stats={pressure ? [{ label: 'Sévérité', value: pressure.severity }, { label: 'Durée', value: pressure.durationLabel }, { label: 'Exposition', value: pressure.financialExposureDh ? formatDh(pressure.financialExposureDh) : 'À qualifier' }, { label: 'Propriétaire', value: pressure.owner }] : []} footer={pressure ? <><button type="button" className={styles.secondaryButton} onClick={onClose}>Fermer</button><Link href={pressure.href} className={styles.primaryButton}>Ouvrir la résolution<ArrowRight size={13} /></Link></> : null}>
    {pressure ? <><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Situation</span><span className={styles.statusChip}>{pressure.severity}</span></div><div className={styles.drawerSectionText}>{pressure.impact}</div></section><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Intervention recommandée</span></div><div className={styles.drawerSectionText}>Vérifier l’étendue client, confirmer le propriétaire, imposer une prochaine échéance et ouvrir la preuve complète dans l’espace opérationnel associé.</div></section></> : null}
  </ExecutiveDrawer>
}

function nodePosition(customer: Wave1Customer, index: number, all: Wave1Customer[]) {
  const maxMrr = Math.max(...all.map((item) => item.mrrDh), 1)
  const x = 12 + Math.min(78, (customer.mrrDh / maxMrr) * 70 + (index % 3) * 3)
  const baseY = customer.healthBand === 'healthy' ? 25 : customer.healthBand === 'watch' ? 55 : customer.healthBand === 'critical' ? 80 : 66
  const y = Math.min(87, Math.max(13, baseY + ((index * 17) % 15) - 7))
  const size = 58 + Math.min(48, Math.sqrt(customer.mrrDh / maxMrr) * 48)
  return { x, y, size }
}
function colorFor(band: Wave1Customer['healthBand']) { return band === 'critical' ? '#dc2626' : band === 'watch' ? '#d97706' : band === 'healthy' ? '#16a34a' : '#64748b' }
function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
