'use client'
import type {Data} from '@puckeditor/core'
import {AlertTriangle,CheckCircle2,RefreshCcw,ShieldCheck,X} from 'lucide-react'
import type {StudioDoctorReport} from '../document-doctor'
import styles from './studio-workspace.module.css'

export interface StudioServerPreflight{ready:boolean;local:StudioDoctorReport;repairs:Array<{id:string;title:string;message:string;blockId:string|null}>;data:Data;policy:any;issues:Array<{field:string;message:string}>;message?:string;code?:string}
export function StudioDocumentDoctorPanel({report,server,onClose,onRepair,onRecheck,busy}:{report:StudioDoctorReport;server:StudioServerPreflight|null;onClose:()=>void;onRepair:()=>void;onRecheck:()=>void;busy:boolean}){
 const issues=[...report.issues,...(server?.issues||[]).map((row,index)=>({id:`server-${index}`,ruleId:'EXPERIENCE_CORE',severity:'blocker' as const,blockId:null,blockType:null,path:row.field,title:'Validation Experience Core',message:row.message,repair:null}))]
 return <div className={styles.doctorBackdrop} onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><section className={styles.doctorPanel} role="dialog" aria-modal="true" aria-label="Document Doctor"><header><div><span>ANGELCARE STUDIO · DOCUMENT DOCTOR</span><h2>Diagnostic & réparation sûre</h2><p>Préflight Puck + Experience Core + P11 avant toute persistance.</p></div><button onClick={onClose} aria-label="Fermer"><X size={18}/></button></header><div className={styles.doctorBody}>
  <div className={styles.doctorStatus} data-ready={server?.ready||(!server&&report.ready)||undefined}>{server?.ready||(!server&&report.ready)?<CheckCircle2 size={20}/>:<AlertTriangle size={20}/>}<div><strong>{server?.ready?'Prêt à enregistrer':server?.message||(!report.ready?'Le document requiert une intervention':'Préflight serveur requis')}</strong><span>{report.componentCount} blocs inspectés · {report.repairable} réparable(s) · {report.blockers} blocker(s) · {report.warnings} avertissement(s)</span></div></div>
  <div className={styles.doctorActions}><button onClick={onRecheck} disabled={busy}><RefreshCcw size={14}/> Préflight complet</button><button data-primary="true" onClick={onRepair} disabled={busy||report.repairable===0}><ShieldCheck size={14}/> Réparer {report.repairable||''}</button></div>
  {issues.length?<div className={styles.doctorIssues}>{issues.map(issue=><article key={issue.id} data-severity={issue.severity}><div><span>{issue.ruleId}</span><strong>{issue.title}</strong>{issue.blockId?<code>{issue.blockId}</code>:null}</div><p>{issue.message}</p>{issue.repair?<small>Réparation sûre : {issue.repair}</small>:null}</article>)}</div>:<div className={styles.doctorEmpty}><CheckCircle2 size={24}/><strong>Aucune anomalie structurelle détectée</strong><span>Le Document Doctor local est vert. Lancez le préflight complet pour Experience Core + P11.</span></div>}
 </div></section></div>
}
