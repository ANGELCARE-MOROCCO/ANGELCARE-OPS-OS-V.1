import { JobkixFault } from '../contracts';
import { isAdminAction } from '../admin-contract';
import * as v from '../validation';
import { editorialMedia } from '../editorial-media';
export function editorialSections(value:unknown){
 if(!Array.isArray(value)||value.length>100)throw new JobkixFault('INVALID_INPUT',{sections:'list'});
 const result=value.map(value=>{const section=v.object(value),id=v.text(section.id,'section.id',1,100);if(!/^[a-z0-9][a-z0-9-]*$/.test(id))throw new JobkixFault('INVALID_INPUT');
  return {id,title:v.text(section.title,'section.title',1,240),body:v.text(section.body??'','section.body',0,40000),paragraphs:section.paragraphs===undefined?[]:v.strings(section.paragraphs,'paragraphs',100,10000),items:section.items===undefined?[]:v.strings(section.items,'items',100,2000),media:editorialMedia(section.media)};
 });if(new Set(result.map(section=>section.id)).size!==result.length)throw new JobkixFault('INVALID_INPUT',{sections:'duplicate_ids'});return result;
}
export function adminInput(input:Record<string,unknown>){
 const action=v.text(input.action,'action',1,100);if(!isAdminAction(action))throw new JobkixFault('INVALID_INPUT');
 const p=v.object(input.payload),note=v.text(p.note,'note',20,4000),version=v.integer(input.expectedVersion??0,'expectedVersion',0,1000000),key=v.text(input.idempotencyKey,'idempotencyKey',16,180);
 let payload:Record<string,unknown>;
 if(action==='editorial.create'||action==='editorial.save'||action==='editorial.translate'){
  const base={locale:v.locale(p.locale),title:v.text(p.title,'title',1,240),summary:v.text(p.summary??'','summary',0,4000),sections:editorialSections(p.sections),author:v.text(p.author,'author',1,180),provenance:v.text(p.provenance,'provenance',1,1000),sourceHash:p.sourceHash?v.text(p.sourceHash,'sourceHash',64,64):null};
  if(action==='editorial.create'){const slug=v.text(p.slug,'slug',2,180);if(!/^[a-z0-9][a-z0-9/-]*$/.test(slug))throw new JobkixFault('INVALID_INPUT');payload={...base,slug,kind:v.choice(p.kind,['front','guide','help','legal','sector','profession','country','city','trust'],'kind')};}
  else payload={...base,id:v.uuid(p.id)};
 }else if(action==='taxonomy.save'){
  const names=v.object(p.localizedNames),localizedNames=Object.fromEntries(Object.entries(names).map(([locale,name])=>[v.locale(locale),v.text(name,'localizedName',1,240)]));
  payload={kind:v.choice(p.kind,['setting','occupation','skill','age_cohort','collection'],'kind'),key:v.text(p.key,'key',2,100),sourceName:v.text(p.sourceName,'sourceName',1,240),localizedNames,synonyms:v.strings(p.synonyms,'synonyms',100,240),status:v.choice(p.status,['draft','published','archived'],'status'),sortOrder:v.integer(p.sortOrder??0,'sortOrder',0,100000)};
  if(!/^[a-z0-9][a-z0-9-]{1,100}$/.test(String(payload.key)))throw new JobkixFault('INVALID_INPUT');
 }else{
  payload={id:v.uuid(p.id)};
  if(action==='organization.media_review'||action==='organization.media_revoke')payload={...payload,mediaId:v.uuid(p.mediaId),...(action==='organization.media_review'?{evidenceId:v.uuid(p.evidenceId)}:{})};
  if(action==='organization.review')payload={...payload,caseId:p.caseId?v.uuid(p.caseId):null,caseVersion:p.caseId?v.integer(p.caseVersion,'caseVersion',1,1000000):null,validUntil:v.instant(p.validUntil,'validUntil'),reference:v.text(p.reference,'reference',3,240),evidenceIds:v.strings(p.evidenceIds,'evidenceIds',30,36).map(id=>v.uuid(id))};
  if(action==='case.advance')payload={...payload,state:v.choice(p.state,['triaged','under_review','needs_information','action','no_action','resolved'],'state'),visibility:v.choice(p.visibility,['internal','reporter'],'visibility')};
  if(action==='reputation.review')payload={...payload,state:v.choice(p.state,['under_review','published','rejected','withdrawn'],'state'),methodologyRevision:v.text(p.methodologyRevision??'','methodologyRevision',0,100)};
  if(action==='editorial.review'||action==='editorial.publish'||action==='editorial.rollback')payload={...payload,contentHash:v.text(p.contentHash,'contentHash',64,64)};
 }
 return {action,payload:{...payload,note},version,key};
}
