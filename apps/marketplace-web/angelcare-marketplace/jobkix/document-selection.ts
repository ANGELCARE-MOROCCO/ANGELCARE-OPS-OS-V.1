import { JobkixFault } from './contracts';
import { integer,object,text,uuid } from './validation';

export const DOCUMENT_SELECTION_PAGE_SIZE=24;
export interface SelectableDocument {id:string;filename:string;revision:number;archived:boolean}
export interface DocumentSelectionQuery {page:number;q:string;selected:string|null}
export interface DocumentSelectionResult {items:SelectableDocument[];selected:SelectableDocument|null;total:number;page:number;pageSize:number}
export interface CaseDocumentQuery extends DocumentSelectionQuery {context:'case'|'verification';organization:string|null}
export function caseDocumentQuery(params:URLSearchParams):CaseDocumentQuery{
 for(const key of params.keys())if(!['context','organization','page','q','selected'].includes(key)||params.getAll(key).length!==1)throw new JobkixFault('INVALID_INPUT');
 const context=params.get('context');if(context!=='case'&&context!=='verification')throw new JobkixFault('INVALID_INPUT');
 if(context==='case'&&params.has('organization'))throw new JobkixFault('INVALID_INPUT');
 const reduced=new URLSearchParams(params);reduced.delete('context');reduced.delete('organization');
 return {...documentSelectionQuery(reduced),context,organization:context==='verification'?uuid(params.get('organization')):null};
}
export function documentSelectionQuery(params:URLSearchParams):DocumentSelectionQuery{
 for(const key of params.keys())if(!['page','q','selected'].includes(key)||params.getAll(key).length!==1)throw new JobkixFault('INVALID_INPUT');
 const page=params.get('page')||'1';if(!/^[1-9]\d{0,4}$/.test(page))throw new JobkixFault('INVALID_INPUT');
 return {page:integer(Number(page),'page',1,10000),q:text(params.get('q')||'','q',0,180),selected:params.get('selected')?uuid(params.get('selected'),'selected'):null};
}
/** Project private rows before they reach client props or the JSON response. */
export function selectableDocumentRow(value:unknown):SelectableDocument{
 const row=object(value);if(row.state!=='ready'||row.purpose!=='cv')throw new JobkixFault('DOCUMENT_NOT_READY');
 return {id:uuid(row.id),filename:text(row.filename,'filename',1,500),revision:integer(row.revision,'revision',1,1000000000),archived:row.library_archived_at!==null&&row.library_archived_at!==undefined};
}
export function selectableEvidenceRow(value:unknown):SelectableDocument{
 const row=object(value);if(row.state!=='ready'||!['cv','credential','portfolio','verification','report','message'].includes(String(row.purpose)))throw new JobkixFault('DOCUMENT_NOT_READY');
 return {id:uuid(row.id),filename:text(row.filename,'filename',1,500),revision:integer(row.revision,'revision',1,1000000000),archived:row.library_archived_at!==null&&row.library_archived_at!==undefined};
}
function responseDocument(value:unknown):SelectableDocument{
 const row=object(value);if(typeof row.archived!=='boolean')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 return {id:uuid(row.id),filename:text(row.filename,'filename',1,500),revision:integer(row.revision,'revision',1,1000000000),archived:row.archived};
}
export function documentSelectionResult(value:unknown):DocumentSelectionResult{
 try{
  const row=object(value);if(!Array.isArray(row.items)||row.items.length>DOCUMENT_SELECTION_PAGE_SIZE||row.pageSize!==DOCUMENT_SELECTION_PAGE_SIZE)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  const items=row.items.map(responseDocument),total=integer(row.total,'total',0,1000000000);
  if(items.some(item=>item.archived)||new Set(items.map(item=>item.id)).size!==items.length||total<items.length)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  return {items,selected:row.selected===null?null:responseDocument(row.selected),total,page:integer(row.page,'page',1,10000),pageSize:DOCUMENT_SELECTION_PAGE_SIZE};
 }catch{throw new JobkixFault('DEPENDENCY_UNAVAILABLE');}
}
