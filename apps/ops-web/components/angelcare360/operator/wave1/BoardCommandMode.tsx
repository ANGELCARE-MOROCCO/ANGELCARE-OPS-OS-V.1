'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Expand, FileQuestion, Maximize2, ShieldCheck } from 'lucide-react'
import type { Wave1ExecutiveData } from './Wave1ExecutiveTypes'
import { EmptyExecutiveState } from './Wave1ExecutivePrimitives'
import styles from './Wave1ExecutiveExperience.module.css'

type Scene = {
  key: string
  eyebrow: string
  title: string
  narrative: string
  metrics: Array<{ label: string; value: string }>
  agenda: Array<{ title: string; detail: string }>
  evidenceHref: string
}

export default function BoardCommandMode({ data }: { data: Wave1ExecutiveData }) {
  const [index, setIndex] = useState(0)
  const scenes = useMemo(() => buildScenes(data), [data])
  const scene = scenes[index]

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(current + 1, scenes.length - 1))
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(current - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scenes.length])

  if (!scene) return <div className={styles.page} data-domain="board"><EmptyExecutiveState title="Aucune scène de conseil disponible" text="Le mode conseil n’a reçu aucune donnée exploitable." /></div>

  return (
    <div className={styles.page} data-domain="board">
      <section className={styles.boardScene}>
        <div className={styles.boardTop}>
          <div className={styles.boardIdentity}>
            <div className={styles.boardEyebrow}>{scene.eyebrow} · scène {index + 1}/{scenes.length}</div>
            <h1 className={styles.boardTitle}>{scene.title}</h1>
          </div>
          <div className={styles.boardPeriod}>{data.periodLabel} · actualisé {new Date(data.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <div className={styles.boardContent}>
          <div className={styles.boardMain}>
            <div className={styles.boardMetricRail}>{scene.metrics.map((metric) => <article key={metric.label} className={styles.boardMetric}><div className={styles.boardMetricLabel}>{metric.label}</div><div className={styles.boardMetricValue}>{metric.value}</div></article>)}</div>
            <p className={styles.boardNarrative}>{scene.narrative}</p>
          </div>
          <aside className={styles.boardAgenda}>
            <div className={styles.boardAgendaTitle}>Agenda et décisions</div>
            {scene.agenda.length ? scene.agenda.slice(0, 6).map((item) => <div key={`${item.title}-${item.detail}`} className={styles.boardAgendaItem}><strong>{item.title}</strong><span>{item.detail}</span></div>) : <div className={styles.boardAgendaItem}><strong>Aucune action requise</strong><span>Les règles déterministes ne remontent aucun dossier pour cette scène.</span></div>}
            <Link href={scene.evidenceHref} className={styles.boardButton}>Explorer les preuves<ShieldCheck size={12} /></Link>
            <button type="button" className={styles.boardButton} title="La persistance des questions Board sera activée lorsqu’un backend d’annotations approuvé sera disponible."><FileQuestion size={12} />Question au management · verrouillée</button>
          </aside>
        </div>

        <footer className={styles.boardFooter}>
          <div>Navigation clavier ← → · Chaque chiffre est relié à un registre opérationnel existant.</div>
          <div className={styles.boardControls}>
            <Link href="/angelcare-360-operator/executive" className={styles.boardButton}><ArrowLeft size={12} />Quitter le mode conseil</Link>
            <button type="button" className={styles.boardButton} onClick={() => document.documentElement.requestFullscreen?.()}><Maximize2 size={12} />Plein écran</button>
            <button type="button" className={styles.boardButton} disabled={index === 0} onClick={() => setIndex((current) => Math.max(current - 1, 0))}><ArrowLeft size={12} /></button>
            <button type="button" className={styles.boardButton} disabled={index === scenes.length - 1} onClick={() => setIndex((current) => Math.min(current + 1, scenes.length - 1))}><ArrowRight size={12} /></button>
          </div>
        </footer>
      </section>

      <div className={styles.lensBar} aria-label="Sommaire des scènes conseil">
        {scenes.map((item, sceneIndex) => <button type="button" key={item.key} className={`${styles.lensButton} ${sceneIndex === index ? styles.lensButtonActive : ''}`} onClick={() => setIndex(sceneIndex)}>{sceneIndex + 1}. {item.eyebrow}</button>)}
      </div>
    </div>
  )
}

function buildScenes(data: Wave1ExecutiveData): Scene[] {
  const criticalCustomers = data.customers.filter((item) => item.healthBand === 'critical')
  const renewalRisk = data.decisions.filter((item) => item.kind === 'retention')
  const financialDecisions = data.decisions.filter((item) => item.kind === 'finance')
  const serviceDecisions = data.decisions.filter((item) => item.kind === 'service')
  const unowned = data.accountability.filter((item) => item.owner === 'Non attribué')
  const overdueCommitments = data.accountability.filter((item) => item.dueDate && new Date(item.dueDate).getTime() < Date.now())
  return [
    {
      key: 'summary', eyebrow: 'Synthèse exécutive', title: 'AngelCare 360 · Situation du portefeuille SaaS', narrative: data.narrative.body,
      metrics: [
        { label: 'MRR estimé', value: formatDh(data.summary.mrrDh) },
        { label: 'Clients actifs', value: `${data.summary.activeClients}/${data.summary.totalClients}` },
        { label: 'Décisions ouvertes', value: String(data.summary.executiveDecisionCount) },
      ],
      agenda: data.decisions.slice(0, 5).map((item) => ({ title: item.title, detail: `${item.customerName} · ${item.financialImpactDh ? formatDh(item.financialImpactDh) : item.authority}` })), evidenceHref: '/angelcare-360-operator/executive/decisions',
    },
    {
      key: 'revenue', eyebrow: 'Revenu et encaissement', title: 'La valeur contractée doit devenir une valeur collectée et protégée', narrative: `${formatDh(data.summary.invoicedPeriodDh)} ont été facturés pendant la période et ${formatDh(data.summary.collectedPeriodDh)} sont confirmés comme encaissés. L’encours total est de ${formatDh(data.summary.outstandingDh)}, dont ${formatDh(data.summary.overdueDh)} au statut en retard.`,
      metrics: [
        { label: 'Facturé période', value: formatDh(data.summary.invoicedPeriodDh) },
        { label: 'Collecté période', value: formatDh(data.summary.collectedPeriodDh) },
        { label: 'En retard', value: formatDh(data.summary.overdueDh) },
      ],
      agenda: financialDecisions.slice(0, 6).map((item) => ({ title: item.customerName, detail: `${item.entityLabel} · ${formatDh(item.financialImpactDh)}` })), evidenceHref: '/angelcare-360-operator/executive/revenue',
    },
    {
      key: 'customers', eyebrow: 'Valeur et risque client', title: 'La concentration de valeur exige une maîtrise relationnelle explicable', narrative: `${criticalCustomers.length} client(s) présentent au moins un facteur critique. La santé n’est pas un score opaque: elle est décomposée entre finance, service, continuité commerciale, activation et activité tenant.`,
      metrics: [
        { label: 'Relations critiques', value: String(criticalCustomers.length) },
        { label: 'Revenu renouvellement exposé', value: formatDh(data.summary.renewalRiskDh) },
        { label: 'Potentiel expansion', value: formatDh(data.summary.expansionPotentialDh) },
      ],
      agenda: criticalCustomers.slice(0, 6).map((item) => ({ title: item.name, detail: `${item.healthLabel} · ${formatDh(item.mrrDh)} MRR · ${item.factors.filter((factor) => factor.state === 'critical').length} facteur(s) critique(s)` })), evidenceHref: '/angelcare-360-operator/executive/customers',
    },
    {
      key: 'retention', eyebrow: 'Rétention et croissance', title: 'Les renouvellements doivent être commandés avant l’entrée en urgence', narrative: `${formatDh(data.summary.renewalRiskDh)} sont exposés selon les statuts et probabilités enregistrés. ${formatDh(data.summary.expansionPotentialDh)} apparaissent comme valeur attendue sur les renouvellements à probabilité élevée, sans constituer une prévision garantie.`,
      metrics: [
        { label: 'Risque renouvellement', value: formatDh(data.summary.renewalRiskDh) },
        { label: 'Décisions rétention', value: String(renewalRisk.length) },
        { label: 'Échéances ≤ 90 j', value: String(data.horizon.filter((item) => item.category === 'renewal' && item.daysRemaining <= 90).length) },
      ],
      agenda: renewalRisk.slice(0, 6).map((item) => ({ title: item.customerName, detail: `${item.situation} · propriétaire ${item.owner}` })), evidenceHref: '/angelcare-360-operator/renewals',
    },
    {
      key: 'service', eyebrow: 'Service et risques opérationnels', title: 'La pression de service doit être reliée à son impact client et financier', narrative: `${data.summary.criticalServiceCount} pression(s) critique(s) sont visibles. Chaque signal relie ticket, incident, blocage ou demande au client concerné, à sa durée, à son propriétaire et à la valeur récurrente potentiellement exposée.`,
      metrics: [
        { label: 'Pressions critiques', value: String(data.summary.criticalServiceCount) },
        { label: 'Décisions service', value: String(serviceDecisions.length) },
        { label: 'Clients impactés', value: String(new Set(data.servicePressure.map((item) => item.customerName)).size) },
      ],
      agenda: data.servicePressure.filter((item) => item.severity === 'critical').slice(0, 6).map((item) => ({ title: item.title, detail: `${item.customerName} · ${item.durationLabel} · ${item.financialExposureDh ? formatDh(item.financialExposureDh) : 'impact à qualifier'}` })), evidenceHref: '/angelcare-360-operator/executive/service',
    },
    {
      key: 'accountability', eyebrow: 'Responsabilité management', title: 'Aucun risque important ne doit rester sans propriétaire, délai ou preuve', narrative: `${unowned.length} engagement(s) sont sans propriétaire explicite et ${overdueCommitments.length} ont une échéance dépassée. Le système distingue l’exécution, le sponsor, la preuve attendue et l’issue réelle.`,
      metrics: [
        { label: 'Sans propriétaire', value: String(unowned.length) },
        { label: 'Échéances dépassées', value: String(overdueCommitments.length) },
        { label: 'Preuves manquantes', value: String(data.accountability.filter((item) => item.evidenceState === 'missing').length) },
      ],
      agenda: data.accountability.slice(0, 6).map((item) => ({ title: item.title, detail: `${item.owner} · ${item.state} · ${item.impact}` })), evidenceHref: '/angelcare-360-operator/executive/accountability',
    },
    {
      key: 'horizon', eyebrow: 'Horizon 180 jours', title: 'Le futur opérationnel doit être gouverné avant qu’il ne devienne une urgence', narrative: `${data.horizon.length} événement(s) sont visibles dans l’horizon de 180 jours: renouvellements, échéances financières, contrats, activations, capacités et engagements. La priorité combine temps restant, risque et valeur.`,
      metrics: [
        { label: 'Dans 7 jours', value: String(data.horizon.filter((item) => item.daysRemaining <= 7).length) },
        { label: 'Dans 30 jours', value: String(data.horizon.filter((item) => item.daysRemaining <= 30).length) },
        { label: 'Dans 90 jours', value: String(data.horizon.filter((item) => item.daysRemaining <= 90).length) },
      ],
      agenda: data.horizon.slice(0, 6).map((item) => ({ title: item.title, detail: `${item.customerName} · ${item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)} j dépassés` : `dans ${item.daysRemaining} j`} · ${item.valueDh ? formatDh(item.valueDh) : item.readiness}` })), evidenceHref: '/angelcare-360-operator/executive/horizon',
    },
  ]
}
function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
