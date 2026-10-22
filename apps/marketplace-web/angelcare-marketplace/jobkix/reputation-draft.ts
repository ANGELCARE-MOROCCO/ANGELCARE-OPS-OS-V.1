import { JobkixFault } from './contracts';
import { object,integer,text } from './validation';
export type ReputationAction='reputation.contribute'|'reputation.withdraw';
export function reputationIntent(value:unknown):{action:ReputationAction;payload:Record<string,unknown>;version:number;key:string}|null{if(value===null||value===undefined)return null;const row=object(value),action=row.action;if(action!=='reputation.contribute'&&action!=='reputation.withdraw')throw new JobkixFault('INVALID_INPUT');return {action,payload:object(row.payload),version:integer(row.version,'version',0,1000000),key:text(row.key,'key',16,180)};}
