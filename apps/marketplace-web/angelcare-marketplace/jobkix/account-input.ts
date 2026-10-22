import { JobkixFault } from './contracts';
import { object,text } from './validation';
import { FILTER_KEYS,readFilters,type SearchFilters } from './discovery';
/** Saved searches use exactly the same native discovery filters as public and Studio search. */
export function savedSearchFilters(value:unknown):SearchFilters{
 const row=object(value),params=new URLSearchParams();
 for(const [key,value] of Object.entries(row)){if(!FILTER_KEYS.some(allowed=>allowed===key)||typeof value!=='string')throw new JobkixFault('INVALID_INPUT',{filters:'native_filters'});if(key!=='page'&&value)params.set(key,text(value,key,1,300));}
 return readFilters(params);
}
export const CASE_KINDS=['support','report','privacy_export','privacy_deletion','verification'] as const;
export const CASE_STATES=['reported','triaged','under_review','needs_information','action','no_action','appealed','resolved'] as const;
