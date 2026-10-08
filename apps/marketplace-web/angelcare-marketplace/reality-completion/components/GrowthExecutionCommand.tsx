'use client'
import {useRouter} from 'next/navigation'
import {useState} from 'react'
import type {SpecialistWorkspaceProps} from './client-types'
import {GovernedCommandDialog,realityPatch,realityPost,type CommandField} from './GovernedCommandDialog'
import styles from '../reality.module.css'

const t=(v:unknown)=>typeof v==='string'?v:''
const num=(v:unknown)=>typeof v==='number'?v:Number(v||0)
const nextActions:Record<string,string[]>= {hypothesis:['plan'],plan:['request_approval'],approval:['activate'],activation:['monitor'],monitoring:['analyze'],analysis:['decide'],decision:['scale','stop'],scale:['close'],stop:['close']}
const labels:Record<string,string>={plan:'Planifier',request_approval:'Demander approbation',activate:'Activer',monitor:'Enregistrer mesure',analyze:'Analyser',decide:'Décider',scale:'Scaler',stop:'Arrêter',close:'Clore'}
const createFields:CommandField[]=[
 {key:'hypothesis',label:'Hypothèse',type:'textarea',required:true},{key:'objective',label:'Objectif commercial',type:'textarea',required:true},
 {key:'audienceKey',label:'Audience / segment'},{key:'channel',label:'Canal'},{key:'metricKey',label:'Métrique primaire',required:true},
 {key:'baselineValue',label:'Baseline',type:'number'},{key:'targetValue',label:'Cible',type:'number'},{key:'budgetDh',label:'Budget Dh',type:'number'}
]
function actionFields(action:string,record:Record<string,unknown>):CommandField[]{
 if(action==='monitor')return[{key:'actualValue',label:'Valeur observée',type:'number',required:true},{key:'incrementalRevenueDh',label:'Revenu incrémental Dh',type:'number'},{key:'evidence',label:'Preuve / note',type:'textarea'}]
 if(action==='analyze')return[{key:'actualValue',label:'Valeur consolidée',type:'number',defaultValue:num(record.actual_value)},{key:'incrementalRevenueDh',label:'Revenu incrémental Dh',type:'number',defaultValue:num(record.incremental_revenue_dh)},{key:'evidence',label:'Analyse / preuve',type:'textarea',required:true}]
 if(['decide','scale','stop','close'].includes(action))return[{key:'decision',label:'Décision',type:'textarea',required:true},{key:'nextAction',label:'Action suivante'}]
 return[]
}
export function GrowthExecutionCommand(props:SpecialistWorkspaceProps){
 const router=useRouter();const[msg,setMsg]=useState('')
 async function create(values:Record<string,unknown>,reason:string,source?:{id:string;title:string}){await realityPost('growth',{workspaceKey:props.workspaceKey,sourceId:source?.id,title:source?.title||`Initiative Growth — ${String(values.metricKey||'impact')}`,values});setMsg(`Créé · ${reason}`);router.refresh()}
 async function command(id:string,action:string,values:Record<string,unknown>,reason:string){await realityPatch('growth',id,{workspaceKey:props.workspaceKey,action,values,reason});setMsg(`${labels[action]||action} enregistré.`);router.refresh()}
 const active=props.records.filter(r=>!['closed','stop'].includes(r.status)).length
 const scaled=props.records.filter(r=>r.status==='scale').length
 const revenue=props.records.reduce((s,r)=>s+num(r.incremental_revenue_dh),0)
 return <main className={styles.shell}>
  <section className={styles.hero}><div><span>GROWTH EXECUTION · HYPOTHESIS → REVENUE → SCALE/STOP</span><h1>{props.title}</h1><p>{props.mission}</p><div className={styles.actions}><GovernedCommandDialog title="Nouvelle initiative Growth" triggerLabel="Créer initiative Growth" fields={createFields} onSubmit={(v,r)=>create(v,r)}/></div></div><aside><span>AUTORITÉ ACTIVE</span><strong>{props.actorName}</strong><b>{active} initiatives actives · {scaled} scale decisions</b><b>{revenue.toLocaleString('fr-FR')} Dh impact déclaré</b></aside></section>
  <section className={styles.metrics}><article className={styles.metric}><strong>{props.records.length}</strong><span>initiatives gouvernées</span></article><article className={styles.metric}><strong>{active}</strong><span>actives</span></article><article className={styles.metric}><strong>{props.records.filter(r=>r.status==='analysis').length}</strong><span>en analyse</span></article><article className={styles.metric}><strong>{scaled}</strong><span>scale</span></article><article className={styles.metric}><strong>{props.sources.length}</strong><span>sources observées</span></article></section>
  <section className={styles.panel}><div className={styles.panelHeader}><div><span className={styles.kicker}>LIFECYCLE</span><h2>Hypothèse → plan → activation → mesure → décision</h2></div></div><div className={styles.panelBody}><div className={styles.rail}>{props.lifecycle.map(x=><span key={x}>{x.replaceAll('_',' ')}</span>)}</div></div></section>
  <div className={styles.grid}><div className={styles.stack}>
   <section className={styles.panel}><div className={styles.panelHeader}><div><span className={styles.kicker}>GROWTH CASES</span><h2>Portefeuille d’initiatives réellement exécutables</h2></div></div><div className={styles.panelBody}><div className={styles.records}>{props.records.map(r=><article className={styles.record} key={r.id}><div className={styles.recordHead}><div><strong>{r.public_reference} · {r.title}</strong><small>{t(r.hypothesis)}</small></div><span className={styles.status}>{r.status}</span></div><div className={styles.recordMeta}><div><b>Métrique</b><span>{t(r.metric_key)}</span></div><div><b>Baseline → cible → réel</b><span>{String(r.baseline_value??'—')} → {String(r.target_value??'—')} → {String(r.actual_value??'—')}</span></div><div><b>Budget / impact</b><span>{num(r.budget_dh).toLocaleString('fr-FR')} / {num(r.incremental_revenue_dh).toLocaleString('fr-FR')} Dh</span></div><div><b>Audience</b><span>{t(r.audience_key)||'—'}</span></div><div><b>Canal</b><span>{t(r.channel)||'—'}</span></div><div><b>Décision</b><span>{t(r.decision)||'—'}</span></div></div><div className={styles.actions}>{(nextActions[r.status]||[]).map(action=><GovernedCommandDialog key={action} title={`${labels[action]} · ${r.public_reference}`} triggerLabel={labels[action]} danger={action==='stop'} fields={actionFields(action,r)} onSubmit={(v,reason)=>command(r.id,action,v,reason)}/>)}</div></article>)}{!props.records.length?<div className={styles.empty}>Aucune initiative spécialiste. Créez la première hypothèse réelle.</div>:null}</div></div></section>
   <section className={styles.panel}><div className={styles.panelHeader}><div><span className={styles.kicker}>SOURCE INTAKE</span><h2>Transformer une source existante en initiative Growth</h2></div></div><div className={styles.panelBody}>{props.sources.slice(0,60).map(s=><div className={styles.sourceRow} key={s.id}><div><strong>{s.title}</strong><small>{s.meta||s.status}</small></div><GovernedCommandDialog title={`Qualifier ${s.title}`} triggerLabel="Créer initiative" fields={createFields} onSubmit={(v,r)=>create(v,r,{id:s.id,title:s.title})}/></div>)}{!props.sources.length?<div className={styles.empty}>Aucune source disponible.</div>:null}</div></section>
  </div><aside className={styles.stack}><section className={styles.panel}><div className={styles.panelHeader}><h2>Journal de décisions</h2></div><div className={styles.panelBody}>{props.events.slice(0,40).map(e=><div className={styles.event} key={e.id}><i/><div><strong>{e.action}</strong><small>{e.previous_status||'—'} → {e.next_status||'—'}{e.reason?` · ${e.reason}`:''}</small></div><time>{new Date(e.created_at).toLocaleString('fr-FR')}</time></div>)}{!props.events.length?<div className={styles.empty}>Aucune commande spécialiste.</div>:null}</div></section>{msg?<div className={`${styles.message} ${styles.success}`}>{msg}</div>:null}</aside></div>
 </main>
}
