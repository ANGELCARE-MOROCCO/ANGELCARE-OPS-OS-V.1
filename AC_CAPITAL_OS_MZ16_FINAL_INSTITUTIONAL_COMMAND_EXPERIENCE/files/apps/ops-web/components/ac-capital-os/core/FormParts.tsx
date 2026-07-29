import styles from "./core.module.css";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className={styles.field}><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>;
}

export function ActionFeedback({ phase, message }: { phase: string; message: string }) {
  if (!message) return null;
  return <div className={`${styles.feedback} ${styles[`feedback_${phase.replace("-", "_")}`] || ""}`} role="status"><strong>{phase.replace("-", " ")}</strong><span>{message}</span></div>;
}
