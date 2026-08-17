import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './PayrollCommand.module.css'
const BASE='/angelcare-360-command-center/paie'
const NAV=[
 ['Command',BASE],['Périodes',`${BASE}/periodes`],['Dossiers',`${BASE}/dossiers`],['Éléments',`${BASE}/elements`],['Primes',`${BASE}/primes`],['Retenues',`${BASE}/retenues`],['Avances',`${BASE}/avances`],['Ajustements',`${BASE}/ajustements`],['Remboursements',`${BASE}/remboursements`],['Validation',`${BASE}/validation`],['Paiements',`${BASE}/paiements`],['Réconciliation',`${BASE}/reconciliation`],['Exécutions',`${BASE}/executions`],['Gouvernance',`${BASE}/gouvernance`],['Historique',`${BASE}/historique-personnel`],['Conformité',`${BASE}/conformite`],['Bulletins',`${BASE}/bulletins`],['Audit',`${BASE}/audit`]
] as const
export function PayrollCommandShell({schoolName,title,subtitle,children}:{schoolName:string;title:string;subtitle:string;children:ReactNode}){
 return <div className={styles.universe}><main className={styles.shell}>
  <header className={styles.masthead}><div><div className={styles.eyebrow}>SANILA · Payroll Sovereign Control OS</div><h1 className={styles.title}>{title}</h1><p className={styles.subtitle}>{subtitle}</p></div><div className={styles.schoolMark}><span>ÉTABLISSEMENT</span><strong>{schoolName}</strong><small>Paie confidentielle · gouvernance contrôlée</small></div></header>
  <nav className={styles.nav} aria-label="Navigation Paie">{NAV.map(([label,href],i)=><Link key={href} href={href} className={`${styles.navLink} ${i===0?styles.navPrimary:''}`}>{label}</Link>)}</nav>
  {children}
 </main></div>
}
export function StatusPill({value,tone='neutral'}:{value:string;tone?:'good'|'warn'|'bad'|'neutral'|'ink'}){return <span className={styles.status} data-tone={tone}>{value}</span>}
export function EmptyState({title,copy}:{title:string;copy:string}){return <div className={styles.empty}><strong>{title}</strong><p>{copy}</p></div>}
export function formatMoneyMinor(v:number){return new Intl.NumberFormat('fr-MA',{minimumFractionDigits:2,maximumFractionDigits:2}).format((Number(v)||0)/100)+' MAD'}
export function formatMoney(v:number){return new Intl.NumberFormat('fr-MA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0)+' MAD'}
export function formatDate(v?:string|null,withTime=false){if(!v)return'—';const d=new Date(v);if(!Number.isFinite(d.getTime()))return v;return new Intl.DateTimeFormat('fr-MA',withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}).format(d)}
export function toneFor(status:string){const s=status.toLowerCase();if(['paid','reconciled','closed','approved','validated','finalized','published','active','passed'].includes(s))return'good' as const;if(['failed','cancelled','rejected','blocked'].includes(s))return'bad' as const;if(['review','pending','submitted','calculating','payment_processing','warning','requested'].includes(s))return'warn' as const;return'neutral' as const}
