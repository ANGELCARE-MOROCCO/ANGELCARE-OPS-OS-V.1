import Link from 'next/link'
import styles from './TransportCommand.module.css'

const BASE='/angelcare-360-command-center/transport'
const NAV=[
  ['Command',BASE],['Circuits',`${BASE}/circuits`],['Arrêts',`${BASE}/arrets`],['Flotte',`${BASE}/vehicules`],
  ['Chauffeurs',`${BASE}/chauffeurs`],['Affectations',`${BASE}/affectations`],['Courses',`${BASE}/courses`],
  ['Ramassage',`${BASE}/ramassage`],['Dépôt',`${BASE}/depot`],['Sécurité',`${BASE}/securite`],
  ['Incidents',`${BASE}/incidents`],['Notifications',`${BASE}/notifications`],['Audit',`${BASE}/audit`],
] as const

export function TransportCommandShell({schoolName,title,subtitle,children}:{schoolName:string;title:string;subtitle:string;children:React.ReactNode}){
  return <div className={styles.universe}><main className={styles.shell}>
    <header className={styles.masthead}>
      <div><div className={styles.eyebrow}>SANILA · Mobility & Safety Command OS</div><h1 className={styles.title}>{title}</h1><p className={styles.subtitle}>{subtitle}</p></div>
      <div className={styles.schoolMark}><span>ÉTABLISSEMENT</span><strong>{schoolName}</strong><small>Mobilité scolaire · sécurité opérationnelle</small></div>
    </header>
    <nav className={styles.nav} aria-label="Navigation Transport">{NAV.map(([label,href],i)=><Link key={href} href={href} className={`${styles.navLink} ${i===0?styles.navPrimary:''}`}>{label}</Link>)}</nav>
    {children}
  </main></div>
}
export function StatusPill({value,tone='neutral'}:{value:string;tone?:'good'|'warn'|'bad'|'neutral'}){return <span className={styles.status} data-tone={tone}>{value}</span>}
export function EmptyState({title,copy}:{title:string;copy:string}){return <div className={styles.empty}><strong>{title}</strong><p>{copy}</p></div>}
export function formatDate(value?:string|null,withTime=false){if(!value)return'—';const d=new Date(value);if(!Number.isFinite(d.getTime()))return value;return new Intl.DateTimeFormat('fr-MA',withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}).format(d)}
export function formatTime(value?:string|null){if(!value)return'—';if(/^\d{2}:\d{2}/.test(value))return value.slice(0,5);const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('fr-MA',{hour:'2-digit',minute:'2-digit',hour12:false}).format(d):value}
export function formatMoney(value:number){return new Intl.NumberFormat('fr-MA',{maximumFractionDigits:2}).format(value)+' Dh'}
