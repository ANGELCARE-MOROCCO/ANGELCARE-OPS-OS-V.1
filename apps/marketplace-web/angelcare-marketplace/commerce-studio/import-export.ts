import { createHash } from 'node:crypto'
import { requireMarketplaceApiContext } from '../auth/context'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import type { CommerceResource, CommerceRecord } from './types'
import { commerceResource } from './validation'
import { createCommerceResource, getCommerceResource, listCommerceResource, updateCommerceResource } from './repository'

const IMPORTABLE = new Set<CommerceResource>([
  'catalog-items','catalog-variants','catalog-categories','catalog-item-categories','homepage-collections','homepage-collection-items','homepage-placements','navigation-items','price-rules','catalog-availability','merchandising-rules',
])
const MAX_ROWS=5000
const MAX_SOURCE_BYTES=10*1024*1024
const HIGH_RISK = new Set<CommerceResource>(['catalog-items','price-rules','catalog-availability','navigation-items','homepage-placements','merchandising-rules'])

type ImportPreviewRow={row:number;action:'create'|'update'|'unchanged'|'blocked';id:string|null;changedFields:string[];message:string|null}
type ImportSummary={creates:number;updates:number;unchanged:number;blocked:number;risk:'medium'|'high';resource:CommerceResource}

type ImportPayload={records:Record<string,unknown>[];dryRun:boolean;preflightToken:string|null}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
function toCsv(records: CommerceRecord[]): string {
  const headers = [...new Set(records.flatMap((entry) => Object.keys(entry)))].sort()
  return [headers.join(','),...records.map((entry) => headers.map((header) => csvEscape(entry[header])).join(','))].join('\n')
}
function parseCsv(source: string): Record<string, unknown>[] {
  const rows: string[][]=[];let row:string[]=[],field='',quoted=false
  for(let index=0;index<source.length;index+=1){const character=source[index];if(quoted){if(character==='"'&&source[index+1]==='"'){field+='"';index+=1}else if(character==='"')quoted=false;else field+=character}else if(character==='"')quoted=true;else if(character===','){row.push(field);field=''}else if(character==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}else field+=character}
  if(quoted)throw new MarketplaceError('VALIDATION_ERROR','CSV invalide : guillemet non fermé.')
  if(field||row.length){row.push(field.replace(/\r$/,''));rows.push(row)}
  const headers=rows.shift()?.map((value)=>value.trim())||[]
  if(!headers.length||headers.some((header)=>!header))throw new MarketplaceError('VALIDATION_ERROR','CSV invalide : en-tête absent ou vide.')
  const duplicates=headers.filter((header,index)=>headers.indexOf(header)!==index)
  if(duplicates.length)throw new MarketplaceError('VALIDATION_ERROR',`CSV invalide : colonnes dupliquées (${[...new Set(duplicates)].join(', ')}).`)
  return rows.filter((values)=>values.some((value)=>value.trim())).map((values,rowIndex)=>{
    if(values.length>headers.length)throw new MarketplaceError('VALIDATION_ERROR',`CSV invalide : ligne ${rowIndex+2} contient plus de cellules que l’en-tête.`)
    return Object.fromEntries(headers.map((header,index)=>{const raw=values[index]??'';if(!raw)return[header,''];if(raw==='true')return[header,true];if(raw==='false')return[header,false];if(/^-?\d+(?:\.\d+)?$/.test(raw))return[header,Number(raw)];if((raw.startsWith('{')&&raw.endsWith('}'))||(raw.startsWith('[')&&raw.endsWith(']'))){try{return[header,JSON.parse(raw)]}catch{return[header,raw]}}return[header,raw]}))
  })
}
function stable(value:unknown):string{if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;if(value&&typeof value==='object'){const record=value as Record<string,unknown>;return`{${Object.keys(record).sort().map(key=>`${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`}return JSON.stringify(value)}
function tokenFor(resource:CommerceResource,records:Record<string,unknown>[]):string{return createHash('sha256').update(`${resource}\n${stable(records)}`).digest('hex')}
function changedFields(existing:CommerceRecord,entry:Record<string,unknown>):string[]{return Object.keys(entry).filter((key)=>key!=='id'&&stable(existing[key])!==stable(entry[key]))}
function summaryFor(resource:CommerceResource,rows:ImportPreviewRow[]):ImportSummary{return{creates:rows.filter(r=>r.action==='create').length,updates:rows.filter(r=>r.action==='update').length,unchanged:rows.filter(r=>r.action==='unchanged').length,blocked:rows.filter(r=>r.action==='blocked').length,risk:HIGH_RISK.has(resource)?'high':'medium',resource}}
function assertBounds(records:Record<string,unknown>[]){if(!records.length)throw new MarketplaceError('VALIDATION_ERROR','Aucune ligne à importer.');if(records.length>MAX_ROWS)throw new MarketplaceError('VALIDATION_ERROR',`Import limité à ${MAX_ROWS} lignes par lot expert.`)}
async function importPayload(request:Request):Promise<ImportPayload>{
  const contentType=request.headers.get('content-type')||''
  if(contentType.includes('multipart/form-data')){const form=await request.formData();const file=form.get('file');if(!(file instanceof File))throw new MarketplaceError('VALIDATION_ERROR','Un fichier CSV ou JSON est requis.');if(file.size>MAX_SOURCE_BYTES)throw new MarketplaceError('VALIDATION_ERROR','Fichier expert limité à 10 Mo.');const source=await file.text();const parsed=file.name.toLowerCase().endsWith('.csv')||file.type.includes('csv')?parseCsv(source):JSON.parse(source) as Record<string,unknown>[];const records=Array.isArray(parsed)?parsed:[];assertBounds(records);return{records,dryRun:form.get('dry_run')!=='false',preflightToken:typeof form.get('preflight_token')==='string'?String(form.get('preflight_token')):null}}
  if(contentType.includes('text/csv')){const source=await request.text();if(new TextEncoder().encode(source).byteLength>MAX_SOURCE_BYTES)throw new MarketplaceError('VALIDATION_ERROR','CSV expert limité à 10 Mo.');const records=parseCsv(source);assertBounds(records);return{records,dryRun:new URL(request.url).searchParams.get('dry_run')!=='false',preflightToken:request.headers.get('x-import-preflight-token')}}
  const body=await parseJsonObject(request);const records=Array.isArray(body.records)?body.records.filter((entry):entry is Record<string,unknown>=>Boolean(entry)&&typeof entry==='object'&&!Array.isArray(entry)):[];assertBounds(records);return{records,dryRun:body.dry_run!==false,preflightToken:typeof body.preflight_token==='string'?body.preflight_token:null}
}

export async function handleCommerceExport(request:Request,rawResource:string):Promise<Response>{const rid=requestId(request);try{const resource=commerceResource(rawResource);if(!IMPORTABLE.has(resource))throw new MarketplaceError('VALIDATION_ERROR','Export non pris en charge pour cette ressource.');await requireMarketplaceApiContext('marketplace.commerce.export');const records=await listCommerceResource(resource);const url=new URL(request.url);if(url.searchParams.get('format')==='json')return apiSuccess(records,{requestId:rid});return new Response(toCsv(records),{status:200,headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename=angelcare-${resource}.csv`,'x-request-id':rid}})}catch(error){return apiFailure(error,rid)}}

export async function handleCommerceImport(request:Request,rawResource:string):Promise<Response>{
  const rid=requestId(request)
  try{
    const resource=commerceResource(rawResource)
    if(!IMPORTABLE.has(resource))throw new MarketplaceError('VALIDATION_ERROR','Import non pris en charge pour cette ressource.')
    const context=await requireMarketplaceApiContext('marketplace.commerce.import')
    const {records,dryRun,preflightToken}=await importPayload(request)
    const expectedToken=tokenFor(resource,records)
    const previewRows:ImportPreviewRow[]=[]
    for(const [index,entry] of records.entries()){
      const identifier=typeof entry.id==='string'&&entry.id?entry.id:null
      if(!identifier){previewRows.push({row:index+1,action:'create',id:null,changedFields:Object.keys(entry),message:null});continue}
      const existing=await getCommerceResource(resource,identifier)
      if(!existing){previewRows.push({row:index+1,action:'blocked',id:identifier,changedFields:[],message:'ID introuvable : cette ligne demanderait une mise à jour impossible.'});continue}
      const changes=changedFields(existing,entry)
      previewRows.push({row:index+1,action:changes.length?'update':'unchanged',id:identifier,changedFields:changes,message:null})
    }
    const summary=summaryFor(resource,previewRows)
    if(dryRun){await writeMarketplaceAudit({context,requestId:rid,action:'marketplace.commerce.import.previewed',objectType:resource,objectId:'bulk-import',afterValue:{count:records.length,summary},source:'complete-commerce-administration',request});return apiSuccess({dryRun:true,imported:0,errors:previewRows.filter(row=>row.action==='blocked').map(row=>({row:row.row,message:row.message||'blocked'})),records,previewRows,summary,preflightToken:expectedToken},{requestId:rid})}
    if(!preflightToken||preflightToken!==expectedToken)throw new MarketplaceError('VALIDATION_ERROR','Préflight obligatoire ou périmé. Relancez le dry-run sur exactement cette source avant exécution.')
    if(summary.blocked)throw new MarketplaceError('DEPENDENCY_BLOCKED',`${summary.blocked} ligne(s) bloquée(s) par le préflight. Corrigez avant exécution.`)
    const errors:Array<{row:number;message:string}>=[];const results:CommerceRecord[]=[]
    for(const [index,entry] of records.entries()){
      try{const identifier=typeof entry.id==='string'&&entry.id?entry.id:null;if(identifier){const diff=previewRows[index];if(diff.action==='unchanged'){const current=await getCommerceResource(resource,identifier);if(current)results.push(current);continue}const result=await updateCommerceResource({resource,id:identifier,payload:entry,context});results.push(result.record)}else{const result=await createCommerceResource({resource,payload:entry,context});results.push(result.record)}}catch(error){errors.push({row:index+1,message:error instanceof Error?error.message:'Erreur inconnue'})}
    }
    await writeMarketplaceAudit({context,requestId:rid,action:'marketplace.commerce.import.executed',objectType:resource,objectId:'bulk-import',afterValue:{count:results.length,errors,summary},source:'complete-commerce-administration',request})
    return apiSuccess({dryRun:false,imported:results.length,errors,records:results,previewRows,summary,preflightToken:expectedToken},{requestId:rid})
  }catch(error){return apiFailure(error,rid)}
}
