"use client"
import { AlertTriangle, Check, ChevronDown, ChevronUp, Loader2, RotateCcw, X } from "lucide-react"
import styles from "./SocialCommand.module.css"

export type PulseState = {
  id: string
  label: string
  status: "preparing" | "processing" | "waiting" | "completed" | "failed"
  progress: number
  step?: string
  detail?: string
  completed?: number
  total?: number
  failed?: number
  items?: { label: string; status: string; progress?: number }[]
  onRetry?: () => void
  onOpen?: () => void
}

export default function ActionPulse({ pulse, expanded, onToggle, onDismiss }: { pulse: PulseState | null; expanded: boolean; onToggle: () => void; onDismiss: () => void }) {
  if (!pulse) return null
  const done = pulse.status === "completed"
  const failed = pulse.status === "failed"
  return <aside className={`${styles.actionPulse} ${styles[`pulse_${pulse.status}`]}`} aria-live="polite">
    <div className={styles.pulseGlow} />
    <div className={styles.pulseTop}>
      <div className={styles.pulseIdentity}>
        <span className={styles.pulseIcon}>{done ? <Check size={17}/> : failed ? <AlertTriangle size={17}/> : <Loader2 size={17} className={styles.spin}/>}</span>
        <div><small>ANGELCARE ACTION PULSE</small><strong>{pulse.label}</strong></div>
      </div>
      <div className={styles.pulseControls}>
        {pulse.items?.length ? <button onClick={onToggle} aria-label="Détails">{expanded?<ChevronDown size={16}/>:<ChevronUp size={16}/>}</button>:null}
        {(failed || done) && <button onClick={onDismiss} aria-label="Fermer"><X size={16}/></button>}
      </div>
    </div>
    <div className={styles.pulseStepRow}><span>{pulse.step || (done ? "Terminé" : "Traitement")}</span><b>{Math.max(0,Math.min(100,Math.round(pulse.progress)))}%</b></div>
    <div className={styles.pulseTrack}><i style={{width:`${Math.max(0,Math.min(100,pulse.progress))}%`}} /></div>
    {(pulse.total || pulse.detail) && <div className={styles.pulseMeta}>
      {pulse.total ? <span><b>{pulse.completed || 0}</b> / {pulse.total} traités {pulse.failed ? `· ${pulse.failed} en échec` : ""}</span>:null}
      {pulse.detail ? <span>{pulse.detail}</span>:null}
    </div>}
    {expanded && pulse.items?.length ? <div className={styles.pulseItems}>{pulse.items.slice(0,18).map((item,i)=><div key={`${item.label}-${i}`}><span>{item.label}</span><em>{item.status}</em></div>)}</div>:null}
    {failed ? <div className={styles.pulseFailureActions}>{pulse.onRetry?<button onClick={pulse.onRetry}><RotateCcw size={14}/> Réessayer</button>:null}{pulse.onOpen?<button onClick={pulse.onOpen}>Ouvrir</button>:null}<button onClick={onDismiss}>Ignorer</button></div>:null}
  </aside>
}
