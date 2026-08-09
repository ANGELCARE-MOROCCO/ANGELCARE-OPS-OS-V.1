import Link from 'next/link'
import styles from './revenue-os.module.css'
export function RevenuePage({children}:{children:React.ReactNode}){return <div className={styles.page}>{children}</div>}
export function Hero({eyebrow,title,description,value,valueLabel}:{eyebrow:string;title:string;description:string;value:string;valueLabel:string}){return <section className={styles.hero}><div><p className={styles.heroEyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><aside className={styles.heroPanel}><span>{valueLabel}</span><strong>{value}</strong><p>Source gouvernée · décisions humaines · audit intégral</p></aside></section>}
export function Metric({label,value,detail}:{label:string;value:string|number;detail?:string}){return <div className={styles.metric}><span>{label}</span><strong>{value}</strong>{detail?<small>{detail}</small>:null}</div>}
export function Section({title,description,action,children}:{title:string;description?:string;action?:React.ReactNode;children:React.ReactNode}){return <section className={styles.section}><header className={styles.sectionHead}><div><h2>{title}</h2>{description?<p>{description}</p>:null}</div>{action}</header>{children}</section>}
export function Badge({children,tone='neutral'}:{children:React.ReactNode;tone?:'neutral'|'red'|'green'|'amber'|'blue';key?:string}){return <span className={`${styles.badge} ${tone==='red'?styles.badgeRed:tone==='green'?styles.badgeGreen:tone==='amber'?styles.badgeAmber:tone==='blue'?styles.badgeBlue:''}`}>{children}</span>}
export function ActionLink({href,children,secondary=false}:{href:string;children:React.ReactNode;secondary?:boolean}){return <Link className={`${styles.button} ${secondary?styles.buttonSecondary:''}`} href={href}>{children}</Link>}
export function Money({value}:{value:number}){return <span className={styles.money}>{Number(value||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} Dh</span>}
export {styles}
