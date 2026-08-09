import * as React from 'react'
import { AlertTriangle, CheckCircle2, LoaderCircle, RefreshCw, ShieldAlert } from 'lucide-react'
import styles from './bulk9-governance.module.css'
export function LoadingAuthority(){return <div className={styles.loadingAuthority}><LoaderCircle/><strong>Inspection des dépendances et autorités…</strong></div>}
export function ErrorAuthority({message,retry}:{message:string;retry:()=>void}){return <div className={styles.errorAuthority}><ShieldAlert/><div><strong>Autorité indisponible</strong><p>{message}</p></div><button onClick={retry}><RefreshCw/>Réessayer</button></div>}
export function EmptyAuthority({title,detail}:{title:string;detail:string}){return <div className={styles.emptyAuthority}><AlertTriangle/><strong>{title}</strong><p>{detail}</p></div>}
export function HonestBoundary({title,detail,tone='info'}:{title:string;detail:string;tone?:'info'|'danger'|'warning'|'success'}){const Icon=tone==='success'?CheckCircle2:AlertTriangle;return <div className={`${styles.boundary} ${styles[`boundary_${tone}`]}`}><Icon/><div><strong>{title}</strong><p>{detail}</p></div></div>}
