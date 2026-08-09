import styles from "./core.module.css";

export function MetricTile({ label, value, detail, tone = "blue" }: { label: string; value: string; detail: string; tone?: "blue" | "green" | "amber" | "red" | "violet" }) {
  return <article className={`${styles.metricTile} ${styles[`metric_${tone}`]}`}><span>{label}</span><strong>{value}</strong><p>{detail}</p></article>;
}
