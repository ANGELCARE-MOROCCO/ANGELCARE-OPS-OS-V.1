import { JobkixFault } from './contracts';
import { object,integer,text } from './validation';
export type SiteAction='site.create'|'site.save';
export function siteIntent(value:unknown){if(value===undefined||value===null)return null;const row=object(value),action:SiteAction=row.action==='site.create'?'site.create':row.action==='site.save'?'site.save':(()=>{throw new JobkixFault('INVALID_INPUT');})();return {action,payload:object(row.payload),version:integer(row.version,'version',0,1000000),key:text(row.key,'key',16,180)};}
