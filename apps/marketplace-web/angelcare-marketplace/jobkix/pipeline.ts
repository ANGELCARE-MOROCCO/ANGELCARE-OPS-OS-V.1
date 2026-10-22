import { JobkixFault,type ApplicationState } from './contracts';
import { object,text,uuid,integer,choice } from './validation';
import { recruiterStages } from './policy';
export const BATCH_STAGES=['acknowledged','under_review','shortlisted','interview','on_hold'] as const;
export interface PipelineSelection {id:string;version:number}
export function pipelineSelection(value:unknown):PipelineSelection[]{
 if(!Array.isArray(value)||value.length>24)throw new JobkixFault('INVALID_INPUT');
 const rows=value.map(value=>{const row=object(value);if(Object.keys(row).some(key=>!['id','version'].includes(key)))throw new JobkixFault('INVALID_INPUT');return {id:uuid(row.id),version:integer(row.version,'version',1,1000000)};});
 if(new Set(rows.map(row=>row.id)).size!==rows.length)throw new JobkixFault('INVALID_INPUT');return rows;
}
export function pipelinePayload(value:unknown){const row=object(value),applications=pipelineSelection(row.applications);if(!applications.length)throw new JobkixFault('INVALID_INPUT');return {organizationId:uuid(row.organizationId),applications,state:choice(row.state,BATCH_STAGES,'state'),reason:text(row.reason,'reason',10,1500)};}
export function pipelineIntent(value:unknown){if(value===undefined||value===null)return null;const row=object(value);if(row.action!=='application.bulk_stage')throw new JobkixFault('INVALID_INPUT');return {action:'application.bulk_stage' as const,payload:pipelinePayload(row.payload),version:integer(row.version,'version',0,0),key:text(row.key,'key',16,180)};}
export function commonPipelineStages(states:ApplicationState[]){return states.length?BATCH_STAGES.filter(target=>states.every(state=>recruiterStages(state).includes(target))):[];}
