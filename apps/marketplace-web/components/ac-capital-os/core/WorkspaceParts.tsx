import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, ShieldAlert, Sparkles } from "lucide-react";
import styles from "./workspace-parts.module.css";

export function SectionHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: React.ReactNode }) {
  return <div className={styles.sectionHeading}><div className={styles.sectionTitleBlock}><div className={styles.sectionEyebrow}><Sparkles size={13} /><span>{eyebrow}</span></div><h2>{title}</h2>{copy ? <p>{copy}</p> : null}</div>{action ? <div className={styles.sectionAction}>{action}</div> : null}</div>;
}

export function PrimaryButton({ children, onClick, disabled = false, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={styles.primaryButton}>{children}<ArrowRight size={15} /></button>;
}

export function SecondaryButton({ children, onClick, disabled = false, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={styles.secondaryButton}>{children}</button>;
}

export function TruthChip({ kind, children }: { kind: "proof" | "approval" | "time" | "safe"; children: React.ReactNode }) {
  const icon = kind === "proof" ? <CheckCircle2 size={14} /> : kind === "approval" ? <LockKeyhole size={14} /> : kind === "time" ? <Clock3 size={14} /> : <ShieldAlert size={14} />;
  return <span className={`${styles.truthChip} ${styles[`truth_${kind}`]}`}>{icon}{children}</span>;
}

export function FactGrid({ facts }: { facts: Array<{ label: string; value: React.ReactNode }> }) {
  return <div className={styles.factGrid}>{facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>;
}

export function AuditTimeline({ items }: { items: Array<{ title: string; meta?: string; note?: string }> }) {
  return <div className={styles.timeline}>{items.length ? items.map((item, index) => <article key={`${item.title}-${index}`}><i /><div><strong>{item.title}</strong>{item.meta ? <span>{item.meta}</span> : null}{item.note ? <p>{item.note}</p> : null}</div></article>) : <p className={styles.noTimeline}>No audit events returned by the API.</p>}</div>;
}
