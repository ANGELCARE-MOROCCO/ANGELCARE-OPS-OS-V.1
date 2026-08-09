import { AlertTriangle, DatabaseZap, LoaderCircle, RefreshCw } from "lucide-react";
import styles from "./core.module.css";

export function LoadingState({ label = "Loading capital intelligence…" }: { label?: string }) {
  return <div className={styles.stateCard}><LoaderCircle className={styles.spin} size={22} /><div><strong>{label}</strong><span>Reading the controlled API envelope.</span></div></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className={`${styles.stateCard} ${styles.stateError}`}><AlertTriangle size={22} /><div><strong>Workspace request failed</strong><span>{message}</span></div><button onClick={onRetry}><RefreshCw size={15} /> Retry</button></div>;
}

export function EmptyState({
  title,
  copy,
  action,
  onAction,
}: {
  title: string;
  copy: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}><DatabaseZap size={26} /></div>
      <strong>{title}</strong>
      <p>{copy}</p>
      {action && onAction ? <button onClick={onAction}>{action}</button> : null}
      <small>Nothing is represented as live until the API confirms it.</small>
    </div>
  );
}
