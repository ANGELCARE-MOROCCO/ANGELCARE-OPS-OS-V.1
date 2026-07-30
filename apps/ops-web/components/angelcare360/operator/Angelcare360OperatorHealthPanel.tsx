import type { CSSProperties } from 'react'
import type { Angelcare360OperatorHealthDashboard } from '@/types/angelcare360/operator'
import Angelcare360OperatorStatusBadge from './Angelcare360OperatorStatusBadge'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = { health: Angelcare360OperatorHealthDashboard }
type HealthStyle = CSSProperties & { '--health-angle': string }

export default function Angelcare360OperatorHealthPanel({ health }: Props) {
  const score = health.scoreValue === null ? 0 : Math.max(0, Math.min(100, health.scoreValue))
  const ringStyle: HealthStyle = { '--health-angle': `${score * 3.6}deg` }
  return (
    <section className={styles.intelligencePanel}>
      <div>
        <div className={styles.panelEyebrow}>Santé expliquée</div>
        <h2 className={styles.panelTitle}>{health.scoreLabel}</h2>
      </div>
      <div className={styles.healthScore}>
        <div className={styles.healthRing} style={ringStyle}><div className={styles.healthRingInner}>{health.scoreValue === null ? '—' : health.scoreValue}</div></div>
        <div className={styles.healthSummary}>{health.summary}</div>
      </div>
      <div className={styles.healthFactors}>
        {health.factors.map((factor) => (
          <article key={factor.label} className={styles.healthFactor}>
            <div>
              <div className={styles.healthFactorLabel}>{factor.label}</div>
              {factor.detail ? <div className={styles.healthFactorDetail}>{factor.detail}</div> : null}
            </div>
            <div><Angelcare360OperatorStatusBadge status={factor.status} />{factor.value !== undefined && factor.value !== null ? <span className={styles.rowCount}>{String(factor.value)}</span> : null}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
