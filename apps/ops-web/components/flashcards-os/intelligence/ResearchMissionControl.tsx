import Link from 'next/link'
import { ArrowRight, CalendarClock, CheckCircle2, FileSearch, Globe2, ShieldCheck } from 'lucide-react'
import type { ResearchMission } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { EmptyIntelligenceState, StatusPill, formatDate } from './IntelligencePrimitives'

export default function ResearchMissionControl({ missions }: { missions: ResearchMission[] }) {
  const columns = [
    { key: 'authority', label: 'Authority gate', statuses: ['draft', 'submitted', 'approved'] },
    { key: 'acquisition', label: 'Acquisition', statuses: ['queued', 'acquiring'] },
    { key: 'evidence', label: 'Evidence control', statuses: ['evidence_review', 'ready_for_synthesis', 'synthesising'] },
    { key: 'decision', label: 'Human conclusion', statuses: ['human_review', 'completed', 'failed', 'cancelled', 'archived'] },
  ]
  return (
    <div className={styles.researchControlPage}>
      <section className={styles.researchControlHeader}>
        <div><span className={styles.intelKicker}><FileSearch size={16} /> RESEARCH MISSION CONTROL</span><h1>Une mission, un budget, une preuve, une décision.</h1><p>Les recherches externes ne partent jamais d’un simple champ libre : elles sont cadrées, autorisées, plafonnées et traçables.</p></div>
        <Link className={styles.intelPrimaryAction} href="/flashcards-os/intelligence/research/new">Nouvelle mission <ArrowRight size={16} /></Link>
      </section>
      <section className={styles.researchPipeline}>
        {columns.map((column) => {
          const items = missions.filter((mission) => column.statuses.includes(mission.status))
          return (
            <article key={column.key} className={styles.researchPipelineColumn}>
              <header><span>{column.label}</span><strong>{items.length}</strong></header>
              <div>
                {items.map((mission) => (
                  <Link className={styles.researchMissionTicket} href={`/flashcards-os/intelligence/research/${mission.id}`} key={mission.id}>
                    <div className={styles.researchTicketCode}>{mission.code}</div>
                    <h2>{mission.title}</h2>
                    <p>{mission.strategicQuestion}</p>
                    <div className={styles.researchTicketFacts}>
                      <span><Globe2 size={13} /> {mission.geographicScope.join(', ') || 'Global'}</span>
                      <span><CalendarClock size={13} /> {formatDate(mission.deadline)}</span>
                    </div>
                    <div className={styles.researchTicketFooter}><StatusPill value={mission.status} /><span>{mission.usedCredits}/{mission.budgetCredits} crédits</span></div>
                  </Link>
                ))}
                {!items.length ? <div className={styles.researchPipelineEmpty}><ShieldCheck size={18} /><span>Aucun dossier dans cette étape.</span></div> : null}
              </div>
            </article>
          )
        })}
      </section>
      {!missions.length ? <EmptyIntelligenceState title="Le contrôle mission est prêt" detail="Aucune recherche artificielle n’a été préchargée. Créez une mission approuvable et plafonnée." href="/flashcards-os/intelligence/research/new" action="Configurer une mission" /> : null}
      <section className={styles.researchDoctrineStrip}>
        <div><CheckCircle2 size={17} /><strong>Tavily = acquisition externe</strong><span>Aucune donnée client privée n’est envoyée.</span></div>
        <div><CheckCircle2 size={17} /><strong>OpenRouter = raisonnement</strong><span>Schémas structurés, redaction et modèle réellement utilisé.</span></div>
        <div><CheckCircle2 size={17} /><strong>Humain = autorité</strong><span>Sources, synthèses et décisions restent arbitrables.</span></div>
      </section>
    </div>
  )
}
