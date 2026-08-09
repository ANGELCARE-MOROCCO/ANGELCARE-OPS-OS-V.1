import Link from 'next/link'
import { Activity, ArrowRight, BrainCircuit, CircleDollarSign, FileSearch, Radar, ShieldAlert, Sparkles } from 'lucide-react'
import type { IntelligenceOverview } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { EmptyIntelligenceState, MetricDial, ProviderBadge, SourceModeBadge, StatusPill, formatMoney } from './IntelligencePrimitives'

export default function IntelligenceCommandBridge({ data }: { data: IntelligenceOverview }) {
  const decisionQueue = [
    ...data.missions.filter((item) => ['submitted', 'evidence_review', 'human_review'].includes(item.status)).map((item) => ({ type: 'Mission', title: item.title, status: item.status, href: `/flashcards-os/intelligence/research/${item.id}` })),
    ...data.opportunities.filter((item) => ['candidate', 'qualified', 'shortlisted'].includes(item.status)).map((item) => ({ type: 'Opportunité', title: item.title, status: item.status, href: `/flashcards-os/intelligence/opportunities/${item.id}` })),
    ...data.designs.filter((item) => ['review', 'rework'].includes(item.status)).map((item) => ({ type: 'Design', title: item.title, status: item.status, href: `/flashcards-os/intelligence/product-design/${item.id}` })),
  ].slice(0, 8)

  return (
    <div className={styles.intelCommandPage}>
      <section className={styles.intelCommandHero}>
        <div className={styles.intelHeroCopy}>
          <div className={styles.intelKicker}><BrainCircuit size={16} /> INTELLIGENCE SOVEREIGNTY · ULTRA MEGA ZIP 2</div>
          <h1>Le cerveau de recherche et de Product Design d’AngelCare.</h1>
          <p>Tavily acquiert les preuves externes. OpenRouter raisonne sur des contextes gouvernés. Les humains arbitrent chaque source, opportunité et décision produit.</p>
          <div className={styles.intelHeroActions}>
            <Link className={styles.intelPrimaryAction} href="/flashcards-os/intelligence/research/new"><FileSearch size={16} /> Ouvrir une mission</Link>
            <Link className={styles.intelSecondaryAction} href="/flashcards-os/intelligence/opportunities"><Radar size={16} /> Examiner le radar</Link>
            <SourceModeBadge mode={data.sourceMode} />
          </div>
        </div>
        <div className={styles.intelSovereigntySeal}>
          <span>CONTROLLED FLOW</span>
          <strong>TAVILY</strong>
          <i>Evidence</i>
          <strong>OPENROUTER</strong>
          <small>Human authority remains final</small>
        </div>
      </section>

      <section className={styles.intelMetricBand}>
        <MetricDial label="Missions actives" value={data.metrics.activeMissions} detail="Recherche et synthèse en cours" />
        <MetricDial label="Preuves à arbitrer" value={data.metrics.pendingEvidence} detail="Sources et claims non décidés" />
        <MetricDial label="Contradictions" value={data.metrics.contradictions} detail="Divergences conservées visibles" />
        <MetricDial label="Opportunités qualifiées" value={data.metrics.qualifiedOpportunities} detail="Candidats à valeur stratégique" />
        <MetricDial label="Designs en décision" value={data.metrics.designsAwaitingDecision} detail="War Rooms nécessitant autorité" />
        <MetricDial label="Runs bloqués" value={data.metrics.blockedRuns} detail="Protection coût, confidentialité ou provider" />
      </section>

      <section className={styles.intelCommandGrid}>
        <article className={styles.missionFlightDeck}>
          <header><div><span className={styles.sectionEyebrow}>MISSION FLIGHT DECK</span><h2>Recherche en mouvement</h2></div><Link href="/flashcards-os/intelligence/research">Tout ouvrir <ArrowRight size={15} /></Link></header>
          <div className={styles.missionFlightList}>
            {data.missions.slice(0, 6).map((mission) => (
              <Link href={`/flashcards-os/intelligence/research/${mission.id}`} className={styles.missionFlightRow} key={mission.id}>
                <div className={styles.missionCode}>{mission.code}</div>
                <div><strong>{mission.title}</strong><span>{mission.purpose.replaceAll('_', ' ')} · {mission.sourceCount} sources</span></div>
                <div className={styles.missionProgress}><span style={{ width: `${Math.min(100, Math.max(6, mission.sourceLimit ? mission.sourceCount / mission.sourceLimit * 100 : 0))}%` }} /></div>
                <StatusPill value={mission.status} />
              </Link>
            ))}
            {!data.missions.length ? <EmptyIntelligenceState title="Aucune mission lancée" detail="Le système n’invente aucune preuve externe. Ouvrez une mission gouvernée pour commencer." href="/flashcards-os/intelligence/research/new" action="Créer la première mission" /> : null}
          </div>
        </article>

        <aside className={styles.intelDecisionQueue}>
          <header><div><span className={styles.sectionEyebrow}>AUTHORITY QUEUE</span><h2>Décisions attendues</h2></div><ShieldAlert size={20} /></header>
          <div>
            {decisionQueue.map((item) => (
              <Link href={item.href} key={`${item.type}-${item.href}`} className={styles.decisionQueueRow}>
                <span>{item.type}</span><strong>{item.title}</strong><StatusPill value={item.status} />
              </Link>
            ))}
            {!decisionQueue.length ? <p className={styles.quietNotice}>Aucune décision critique en attente.</p> : null}
          </div>
        </aside>
      </section>

      <section className={styles.intelSignalRunway}>
        <header><div><span className={styles.sectionEyebrow}>PRODUCT SIGNAL RUNWAY</span><h2>Signaux internes et externes à transformer</h2></div><Sparkles size={20} /></header>
        <div className={styles.signalRunwayTrack}>
          {data.signals.slice(0, 8).map((signal) => (
            <article key={signal.id}>
              <div><span>{signal.sourceType}</span><strong>{signal.strength}/100</strong></div>
              <h3>{signal.title}</h3><p>{signal.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.intelControlStrip}>
        <article><Activity size={18} /><div><strong>Providers</strong>{data.providerHealth.map((item) => <span key={item.provider}><ProviderBadge provider={item.provider} configured={item.configured} status={item.status} /></span>)}</div></article>
        <article><CircleDollarSign size={18} /><div><strong>Intelligence spend</strong><span>{formatMoney(data.usage.monthlySpendUsd)} / {formatMoney(data.usage.monthlyBudgetUsd)} USD ce mois</span></div></article>
        <article><BrainCircuit size={18} /><div><strong>OpenRouter ledger</strong><span>{data.usage.openrouterRequests} runs · {data.usage.totalTokens.toLocaleString('fr-FR')} tokens</span></div></article>
        <article><FileSearch size={18} /><div><strong>Tavily acquisition</strong><span>{data.usage.tavilyRequests} requêtes · {data.usage.tavilyCredits} crédits</span></div></article>
      </section>
    </div>
  )
}
