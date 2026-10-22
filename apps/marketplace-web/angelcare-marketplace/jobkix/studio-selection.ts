import { JobkixFault } from './contracts';
import { choice,integer,object,text,uuid } from './validation';
export const STUDIO_SELECTION_KINDS=['organizations','sites','vacancies','pools'] as const;
export type StudioSelectionKind=typeof STUDIO_SELECTION_KINDS[number];
export interface StudioSelectionRequest {kind:StudioSelectionKind;organization:string|null;purpose:'vacancy'|'team'|null;page:number;q:string;selected:string[]}
export interface StudioSelectionRecord {id:string;label:string;available:boolean}
export interface StudioSelectionResult {items:StudioSelectionRecord[];selected:StudioSelectionRecord[];total:number;page:number;pageSize:number}
export function studioSelectionParams(kind:StudioSelectionKind,organization?:string,purpose?:'vacancy'|'team',selected:string[]=[]):URLSearchParams{
 const params=new URLSearchParams({kind});if(organization)params.set('organization',organization);if(purpose)params.set('purpose',purpose);for(const id of selected)params.append('selected',id);return params;
}
export function studioSelectionRequest(params:URLSearchParams):StudioSelectionRequest{
 for(const key of params.keys())if(!['kind','organization','purpose','page','q','selected'].includes(key)||key!=='selected'&&params.getAll(key).length!==1)throw new JobkixFault('INVALID_INPUT');
 const kind=choice(params.get('kind'),STUDIO_SELECTION_KINDS,'kind'),organization=kind==='organizations'?null:uuid(params.get('organization'),'organization');
 if(kind==='organizations'&&params.has('organization')||kind!=='sites'&&params.has('purpose'))throw new JobkixFault('INVALID_INPUT');
 const purpose=kind==='sites'?choice(params.get('purpose')||'vacancy',['vacancy','team'],'purpose'):null,page=params.get('page')||'1',selected=params.getAll('selected').map(value=>uuid(value,'selected'));
 if(!/^[1-9]\d{0,4}$/.test(page)||selected.length>100||new Set(selected).size!==selected.length)throw new JobkixFault('INVALID_INPUT');
 return {kind,organization,purpose,page:integer(Number(page),'page',1,10000),q:text(params.get('q')||'','q',0,180),selected};
}
export function studioRecord(value:unknown):StudioSelectionRecord{
 const row=object(value);if(typeof row.available!=='boolean')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 return {id:uuid(row.id),label:text(row.label,'label',1,500),available:row.available};
}
export function studioSelectionResult(value:unknown):StudioSelectionResult{
 try{const row=object(value);if(!Array.isArray(row.items)||row.items.length>24||!Array.isArray(row.selected)||row.selected.length>100||row.pageSize!==24)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  const items=row.items.map(studioRecord),selected=row.selected.map(studioRecord),total=integer(row.total,'total',0,1000000000);
  if(total<items.length||items.some(row=>!row.available)||new Set(items.map(row=>row.id)).size!==items.length||new Set(selected.map(row=>row.id)).size!==selected.length)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  return {items,selected,total,page:integer(row.page,'page',1,10000),pageSize:24};
 }catch{throw new JobkixFault('DEPENDENCY_UNAVAILABLE');}
}
/** Retain malformed draft choices in the editor, but never use them in queries. */
export function validSelectionIds(value:unknown):string[]{
 if(!Array.isArray(value))return [];const ids:string[]=[];
 for(const item of value){try{const id=uuid(item);if(!ids.includes(id))ids.push(id);}catch{/* The editor must let the author remove an unavailable choice. */}}
 return ids.slice(0,100);
}
