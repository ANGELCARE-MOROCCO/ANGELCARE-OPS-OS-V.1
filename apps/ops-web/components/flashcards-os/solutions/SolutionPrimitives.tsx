import Link from 'next/link'
import { ArrowRight, Database, ShieldCheck } from 'lucide-react'
import type { CommercialCalculation, SolutionsSourceMode } from '@/lib/flashcards-os/solutions/types'
import styles from './solutions-os.module.css'

export function SourceModeBadge({mode}:{mode:SolutionsSourceMode}){return <span className={styles.sourceBadge}><Database size={13}/>{mode==='database'?'Live governed database':'Controlled bootstrap view'}</span>}
export function StatusPill({value}:{value:string}){const normalized=value.toLowerCase();const tone=['published','eligible','approved','selected','active'].some((item)=>normalized.includes(item))?styles.statusPublished:['rejected','ineligible','blocked','cancelled'].some((item)=>normalized.includes(item))?styles.statusBlocked:['generated','review','decision','validation','conditional'].some((item)=>normalized.includes(item))?styles.statusWarning:'';return <span className={`${styles.status} ${tone}`}>{value.replaceAll('_',' ')}</span>}
export function Metric({label,value,detail}:{label:string;value:string|number;detail:string}){return <article className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>}
export function EmptyState({title,detail,href,action}:{title:string;detail:string;href?:string;action?:string}){return <div className={styles.empty}><ShieldCheck size={22}/><h3>{title}</h3><p>{detail}</p>{href&&action?<Link className={styles.secondary} href={href}>{action}<ArrowRight size={14}/></Link>:null}</div>}
export function money(value:number){return `${Number(value||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} Dh`}
export function CalculationWarnings({calculation}:{calculation:CommercialCalculation}){return calculation.warnings.length?<div className={styles.notice}>{calculation.warnings.join(' · ')}</div>:null}
