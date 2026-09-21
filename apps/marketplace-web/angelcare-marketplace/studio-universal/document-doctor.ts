import type {ComponentData,Data} from '@puckeditor/core'
import {validateStudioPageJson} from './page-json'

export type StudioDoctorSeverity='info'|'warning'|'repairable'|'blocker'
export interface StudioDoctorIssue{id:string;ruleId:string;severity:StudioDoctorSeverity;blockId:string|null;blockType:string|null;path:string;title:string;message:string;repair:string|null}
export interface StudioDoctorReport{ready:boolean;repairable:number;blockers:number;warnings:number;issues:StudioDoctorIssue[];componentCount:number}
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T
const clean=(v:unknown)=>typeof v==='string'?v.trim():''
const safe=(type:string)=>type.replace(/[^a-z0-9_-]/gi,'-').replace(/^-+|-+$/g,'').slice(0,36)||'block'

export function diagnoseStudioDocument(input:Data):StudioDoctorReport{
 const issues:StudioDoctorIssue[]=[];let componentCount=0
 try{validateStudioPageJson(input)}catch(error){issues.push({id:'document-json',ruleId:'DOCUMENT_JSON',severity:'blocker',blockId:null,blockType:null,path:'document',title:'Document Puck invalide',message:error instanceof Error?error.message:'Le document Puck est invalide.',repair:null})}
 const seen=new Map<string,string>()
 const walk=(components:ComponentData[],path='content')=>components.forEach((component,index)=>{componentCount+=1;const props=(component.props||{}) as Record<string,unknown>,type=String(component.type||''),id=clean(props.id),here=`${path}[${index}]`
  if(!id)issues.push({id:`missing-id:${here}`,ruleId:'STABLE_ID_MISSING',severity:'repairable',blockId:null,blockType:type,path:here,title:'Identifiant stable manquant',message:`${type||'Bloc'} n’a pas d’identifiant stable.`,repair:'Générer un identifiant déterministe.'})
  else if(seen.has(id))issues.push({id:`duplicate-id:${here}`,ruleId:'STABLE_ID_DUPLICATE',severity:'repairable',blockId:id,blockType:type,path:here,title:'Identifiant dupliqué',message:`${id} est déjà utilisé par ${seen.get(id)}.`,repair:'Réindexer uniquement le doublon.'})
  else seen.set(id,here)
  const source=props.__studioDynamicSource
  if(source&&typeof source==='object'&&!Array.isArray(source)){const row=source as Record<string,unknown>;if(!clean(row.sourceId)||!clean(row.strategy))issues.push({id:`source:${id||here}`,ruleId:'DYNAMIC_SOURCE_INCOMPLETE',severity:'blocker',blockId:id||null,blockType:type,path:`${here}.props.__studioDynamicSource`,title:'Source dynamique incomplète',message:'La source ou la stratégie dynamique est manquante.',repair:null})}
  if(props.primaryCtaHref==='#'||props.secondaryCtaHref==='#')issues.push({id:`placeholder-cta:${id||here}`,ruleId:'CTA_PLACEHOLDER',severity:'warning',blockId:id||null,blockType:type,path:here,title:'CTA sans destination',message:'Un libellé CTA existe encore avec une destination placeholder (#).',repair:'Relier une action canonique ou retirer le CTA avant publication.'})
  const nested=Array.isArray(props.content)?props.content as ComponentData[]:[];walk(nested,`${here}.props.content`)
 })
 walk(Array.isArray(input.content)?input.content:[])
 const blockers=issues.filter(row=>row.severity==='blocker').length,repairable=issues.filter(row=>row.severity==='repairable').length,warnings=issues.filter(row=>row.severity==='warning').length
 return{ready:blockers===0&&repairable===0,repairable,blockers,warnings,issues,componentCount}
}

export function repairStudioDocument(input:Data):{data:Data;repairs:StudioDoctorIssue[]}{const data=clone(input),report=diagnoseStudioDocument(data),repairs=report.issues.filter(row=>row.severity==='repairable'),seen=new Set<string>();let serial=0
 const walk=(components:ComponentData[])=>components.forEach(component=>{serial+=1;const props=(component.props as unknown as Record<string,unknown>),type=String(component.type||'block');let id=clean(props.id);if(!id)id=`${safe(type)}-doctor-${String(serial).padStart(3,'0')}`;if(seen.has(id)){let suffix=2,next=`${id}-repair-${suffix}`;while(seen.has(next))next=`${id}-repair-${++suffix}`;id=next}props.id=id;seen.add(id);const nested=Array.isArray(props.content)?props.content as ComponentData[]:[];walk(nested)})
 walk(Array.isArray(data.content)?data.content:[]);return{data,repairs}}
