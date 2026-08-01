import styles from './experience-os.module.css'
export function Status({value}:{value:string}){const good=/healthy|passed|approved|active|delivered|closed|resolved|completed|released/.test(value);const bad=/critical|failed|rejected|blocked|exception|overdue|revoked/.test(value);return <span className={`${styles.status} ${good?styles.good:bad?styles.bad:styles.warn}`}>{value.replaceAll('_',' ')}</span>}
export function Metric({label,value,detail}:{label:string;value:string|number;detail:string}){return <article className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>}
export function money(value:number){return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(value)+' Dh'}
export function percent(value:number){return `${Math.round(value)}%`}
