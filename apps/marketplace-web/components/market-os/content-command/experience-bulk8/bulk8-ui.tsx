import * as React from 'react'
import { AlertTriangle, CheckCircle2, CircleAlert, LoaderCircle, LockKeyhole, RefreshCw } from 'lucide-react'
import styles from './bulk8-ai.module.css'
import { statusLabels, toneFor, type Tone } from './bulk8-ai-model'

export function StateBadge({value,tone}:{value:string;tone?:Tone}){return <span className={`${styles.badge} ${styles[`badge_${tone||toneFor(value)}`]}`}>{statusLabels[value]||value}</span>}
export function LoadingState({label='Chargement institutionnel…'}:{label?:string}){return <div className={styles.loadingState} role="status" aria-live="polite"><LoaderCircle/><strong>{label}</strong></div>}
export function ErrorState({error,onRetry}:{error:string;onRetry:()=>void}){return <div className={styles.errorState} role="alert"><CircleAlert/><div><strong>Surface indisponible</strong><p>{error}</p></div><button type="button" onClick={onRetry}><RefreshCw/>Réessayer</button></div>}
export function EmptyState({title,detail}:{title:string;detail:string}){return <div className={styles.emptyState} role="status"><AlertTriangle/><strong>{title}</strong><p>{detail}</p></div>}
export function Boundary({kind='authority',title,detail}:{kind?:'authority'|'external'|'truth';title:string;detail:string}){const Icon=kind==='external'?LockKeyhole:kind==='truth'?CheckCircle2:AlertTriangle;return <div role="note" className={`${styles.boundary} ${styles[`boundary_${kind}`]}`}><Icon/><div><strong>{title}</strong><p>{detail}</p></div></div>}
