import Link from 'next/link'
import { ArrowRight, CircleDot, Crosshair, Radar, Scale, ShieldAlert } from 'lucide-react'
import type { ProductOpportunity } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { EmptyIntelligenceState, StatusPill } from './IntelligencePrimitives'

function axis(opportunity: ProductOpportunity) {
  const value = opportunity.score.weightedTotal
  const complexity = opportunity.score.productionComplexity + opportunity.score.contentRisk + opportunity.score.rightsRisk
  return { left: Math.min(92, Math.max(8, value)), top: Math.min(88, Math.max(10, 100 - complexity / 3)) }
}

export default function OpportunityRadar({ opportunities }: { opportunities: ProductOpportunity[] }) {
  const ranked = [...opportunities].sort((a,b) => b.score.weightedTotal - a.score.weightedTotal)
  return (
    <div className={styles.opportunityRadarPage}>
      <header className={styles.opportunityRadarHeader}><div><span className={styles.intelKicker}><Radar size={16} /> PRODUCT OPPORTUNITY RADAR</span><h1>Décider où AngelCare doit investir son prochain effort produit.</h1><p>Le score est déterministe. OpenRouter explique les compromis, mais ne remplace jamais l’autorité du portefeuille.</p></div><div className={styles.radarLegend}><span><i className={styles.legendHigh} />Valeur élevée</span><span><i className={styles.legendMedium} />À qualifier</span><span><i className={styles.legendRisk} />Risque/complexité</span></div></header>
      <section className={styles.opportunityRadarStage}>
        <div className={styles.radarAxisY}><span>FAIBLE COMPLEXITÉ</span><span>FORTE COMPLEXITÉ</span></div><div className={styles.radarAxisX}><span>FAIBLE VALEUR</span><span>FORTE VALEUR</span></div><div className={`${styles.radarQuadrant} ${styles.radarQuadrantOne}`}>Quick wins</div><div className={`${styles.radarQuadrant} ${styles.radarQuadrantTwo}`}>Strategic bets</div><div className={`${styles.radarQuadrant} ${styles.radarQuadrantThree}`}>Defer / research</div><div className={`${styles.radarQuadrant} ${styles.radarQuadrantFour}`}>Risk discipline</div>
        {opportunities.map((opportunity) => { const point = axis(opportunity); return <Link href={`/flashcards-os/intelligence/opportunities/${opportunity.id}`} className={styles.radarOpportunityPoint} style={{ left: `${point.left}%`, top: `${point.top}%` }} key={opportunity.id}><span>{Math.round(opportunity.score.weightedTotal)}</span><strong>{opportunity.title}</strong><small>{opportunity.code}</small></Link> })}
        {!opportunities.length ? <div className={styles.radarEmpty}><Crosshair size={30} /><strong>Aucune opportunité active</strong><p>Les signaux internes et synthèses approuvées pourront être promus ici.</p></div> : null}
      </section>
      <section className={styles.opportunityRankedLedger}>
        <header><span>DETERMINISTIC QUALIFICATION LEDGER</span><strong>{ranked.length} opportunités</strong></header>
        <div>{ranked.map((item,index) => <Link href={`/flashcards-os/intelligence/opportunities/${item.id}`} key={item.id}><i>{String(index + 1).padStart(2,'0')}</i><div><strong>{item.title}</strong><span>{item.thesis}</span></div><div className={styles.opportunityScoreBar}><span style={{ width: `${Math.min(100,item.score.weightedTotal)}%` }} /></div><strong>{Math.round(item.score.weightedTotal)}</strong><StatusPill value={item.status} /><ArrowRight size={15} /></Link>)}</div>
        {!ranked.length ? <EmptyIntelligenceState title="Le Radar attend ses preuves" detail="Aucune opportunité n’est inventée. Qualifiez un signal ou transformez une synthèse de recherche." /> : null}
      </section>
      <section className={styles.opportunityDoctrine}><div><Scale size={18} /><strong>Scoring configurable</strong><span>Valeur, gap, différenciation, réutilisation et risques.</span></div><div><ShieldAlert size={18} /><strong>Human override visible</strong><span>Toute exception exige une justification auditée.</span></div><div><CircleDot size={18} /><strong>Evidence linked</strong><span>Chaque promotion conserve sa lignée de claims.</span></div></section>
    </div>
  )
}
