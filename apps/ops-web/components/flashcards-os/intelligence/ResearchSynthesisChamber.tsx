import Link from 'next/link'
import { ArrowLeft, BrainCircuit, CircleAlert, FileCheck2, Lightbulb, Scale, ShieldCheck } from 'lucide-react'
import type { EvidenceClaim, ResearchMission, ResearchSynthesis } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { StatusPill } from './IntelligencePrimitives'

export default function ResearchSynthesisChamber({ mission, synthesis, claims }: { mission: ResearchMission; synthesis: ResearchSynthesis; claims: EvidenceClaim[] }) {
  return (
    <div className={styles.synthesisChamberPage}>
      <header className={styles.synthesisChamberHeader}><div><Link href={`/flashcards-os/intelligence/research/${mission.id}`}><ArrowLeft size={15} /> {mission.code}</Link><span className={styles.intelKicker}><BrainCircuit size={16} /> RESEARCH SYNTHESIS CHAMBER</span><h1>{mission.title}</h1><p>La conclusion OpenRouter reste séparée des faits, inférences, contradictions et décisions humaines.</p></div><div><StatusPill value={synthesis.status} /><span>Version {synthesis.version}</span><small>{synthesis.modelUsed || 'Modèle non exécuté'}</small></div></header>
      <section className={styles.synthesisAnswerStage}><div className={styles.synthesisAnswerMark}><FileCheck2 size={28} /></div><div><span>EXECUTIVE ANSWER</span><h2>{synthesis.executiveAnswer || 'Synthèse en attente d’exécution et de revue.'}</h2></div></section>
      <section className={styles.synthesisEvidenceSplit}>
        <main className={styles.synthesisFindings}><header><span>STRUCTURED FINDINGS</span><strong>{synthesis.findings.length}</strong></header>{synthesis.findings.map((finding, index) => <article key={`${finding.title}-${index}`}><div><i>{String(index + 1).padStart(2,'0')}</i><span>{Math.round(finding.confidence)}% confidence</span></div><h3>{finding.title}</h3><p>{finding.conclusion}</p><footer>{finding.evidenceClaimIds.map((id) => <span key={id}>{id.slice(0,8)}</span>)}</footer></article>)}</main>
        <aside className={styles.synthesisTruthLedger}>
          <section><header><ShieldCheck size={17} /><span>EXTERNAL FACTS</span></header>{claims.filter((claim) => claim.directness === 'direct' && claim.reviewStatus === 'accepted').slice(0,6).map((claim) => <p key={claim.id}>{claim.statement}</p>)}</section>
          <section><header><Lightbulb size={17} /><span>OPENROUTER INFERENCES</span></header>{claims.filter((claim) => claim.directness === 'inferred').slice(0,6).map((claim) => <p key={claim.id}>{claim.statement}</p>)}</section>
          <section><header><Scale size={17} /><span>HUMAN DECISIONS</span></header><p>{synthesis.recommendedNextAction || 'Aucune décision humaine enregistrée.'}</p></section>
        </aside>
      </section>
      <section className={styles.synthesisRiskGrid}>
        <article><header><CircleAlert size={17} /><span>Contradictions</span></header>{synthesis.contradictions.map((item,index) => <div key={index}><strong>{item.issue}</strong><p>{item.decisionNeeded}</p></div>)}</article>
        <article><header><CircleAlert size={17} /><span>Limitations</span></header>{synthesis.limitations.map((item,index) => <p key={index}>{item}</p>)}</article>
        <article><header><CircleAlert size={17} /><span>Risques</span></header>{synthesis.risks.map((item,index) => <p key={index}>{item}</p>)}</article>
        <article><header><CircleAlert size={17} /><span>Gaps restants</span></header>{synthesis.remainingGaps.map((item,index) => <p key={index}>{item}</p>)}</article>
      </section>
      <section className={styles.synthesisProductImplications}><header><span>PRODUCT IMPLICATIONS</span><h2>Ce que cette recherche change pour AngelCare</h2></header><div>{synthesis.productImplications.map((item,index) => <article key={index}><i>{index + 1}</i><p>{item}</p></article>)}</div></section>
    </div>
  )
}
