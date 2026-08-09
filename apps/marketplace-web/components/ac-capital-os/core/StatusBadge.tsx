import styles from "./core.module.css";

export function StatusBadge({ value, children }: { value?: string; children?: React.ReactNode }) {
  const source = String(value || children || "");
  const key = source.toLowerCase();
  const tone = key.includes("live") || key.includes("ready") || key.includes("approved")
    ? styles.good
    : key.includes("blocked") || key.includes("critical") || key.includes("rejected") || key.includes("disabled")
      ? styles.danger
      : key.includes("approval") || key.includes("proof") || key.includes("missing") || key.includes("fallback") || key.includes("pending")
        ? styles.warning
        : key.includes("ai") || key.includes("provider")
          ? styles.ai
          : styles.info;
  return <span className={`${styles.statusBadge} ${tone}`}>{children || value}</span>;
}
