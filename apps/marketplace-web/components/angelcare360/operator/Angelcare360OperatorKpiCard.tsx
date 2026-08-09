import styles from './Angelcare360OperatorExperience.module.css'

type Props = { label: string; value: string; detail?: string }

export default function Angelcare360OperatorKpiCard({ label, value, detail }: Props) {
  return (
    <article className={styles.kpi}>
      <span className={styles.kpiAccent} aria-hidden="true" />
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {detail ? <p className={styles.kpiDetail}>{detail}</p> : null}
    </article>
  )
}
