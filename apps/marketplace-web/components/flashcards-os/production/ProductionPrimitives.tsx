import styles from './production-os.module.css'
export function StatusPill({value}:{value:string}){const good=/approved|released|completed|accepted|online|valid/.test(value);const bad=/failed|rejected|blocker|critical|offline|quarantined/.test(value);return <span className={`${styles.pill} ${good?styles.pillGood:bad?styles.pillBad:styles.pillWarn}`}>{value.replaceAll('_',' ')}</span>}
export function Metric({label,value,detail}:{label:string;value:string|number;detail:string}){return <article className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>}
export function bytes(value:number){if(!value)return '0 B';const units=['B','KB','MB','GB','TB'];const i=Math.min(units.length-1,Math.floor(Math.log(value)/Math.log(1024)));return `${(value/Math.pow(1024,i)).toFixed(i?1:0)} ${units[i]}`}
export function money(value:number){return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(value)+' Dh'}
