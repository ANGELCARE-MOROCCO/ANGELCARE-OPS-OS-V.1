import { JobkixFault, type Locale } from './contracts';
import { countryCode, integer, choice, text, uuid } from './validation';
import { SETTINGS, OCCUPATIONS } from './taxonomy';
import { href } from './routes';
export const FILTER_KEYS=['q','origin','destination','reach','city','setting','occupation','organizationId','workSchedule','contractType','workLocation','language','ageCohort','sponsorship','relocation','salaryMinimum','currency','salaryUnit','sort','page'] as const;
export type FilterKey=typeof FILTER_KEYS[number];
export type SearchFilters=Partial<Record<FilterKey,string>>;
export function readFilters(params:URLSearchParams):SearchFilters {
 const result:SearchFilters={};
 for(const key of FILTER_KEYS){const value=params.get(key);if(value!==null && value!==''){
  if(params.getAll(key).length!==1)throw new JobkixFault('INVALID_INPUT',{[key]:'duplicate'});
  result[key]=text(value,key,1,300);
 }}
 if(result.origin)countryCode(result.origin);if(result.destination)countryCode(result.destination);
 if(result.reach)choice(result.reach,['domestic','abroad','worldwide'],'reach');
 if(result.sort)choice(result.sort,['newest','relevance'],'sort');
 if(result.page)integer(Number(result.page),'page',1,10000);
 if(result.setting)choice(result.setting,SETTINGS.map(([id])=>id),'setting');
 // Published occupation membership is checked by the canonical search command, including
 // occupations added through native administration. This boundary validates its key shape.
 if(result.occupation&&!/^[a-z0-9][a-z0-9-]{1,100}$/.test(result.occupation))throw new JobkixFault('INVALID_INPUT',{occupation:'key'});
 if(result.organizationId)uuid(result.organizationId,'organizationId');
 if(result.workSchedule)choice(result.workSchedule,['full_time','part_time','flexible'],'workSchedule');
 if(result.contractType)choice(result.contractType,['permanent','fixed_term','temporary','seasonal','internship','other'],'contractType');
 if(result.workLocation)choice(result.workLocation,['on_site','remote','hybrid'],'workLocation');
 for(const key of ['sponsorship','relocation'] as const)if(result[key])choice(result[key],['yes','no','unknown'],key);
 if(result.language&&!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(result.language))throw new JobkixFault('INVALID_INPUT',{language:'language_code'});
 if(result.salaryMinimum){
  if(!/^\d{1,10}(?:\.\d{1,2})?$/.test(result.salaryMinimum)||Number(result.salaryMinimum)>1e9)throw new JobkixFault('INVALID_INPUT',{salaryMinimum:'amount'});
  if(!result.currency||!Intl.supportedValuesOf('currency').includes(result.currency))throw new JobkixFault('INVALID_INPUT',{currency:'required'});
  choice(result.salaryUnit,['hour','day','week','month','year'],'salaryUnit');
 }
 return result;
}
export function filtersParams(filters:SearchFilters):URLSearchParams {
 const params=new URLSearchParams();for(const key of FILTER_KEYS){const value=filters[key];if(value)params.set(key,value);}return params;
}
export function searchHref(locale:Locale,filters:SearchFilters,changes:Partial<Record<FilterKey,string|null>>={},path:'jobs'|'career/discovery'='jobs'):string {
 const params=new URLSearchParams();
 for(const key of FILTER_KEYS){const value=changes[key]===undefined?filters[key]:changes[key];if(value)params.set(key,value);}
 return href(locale,path,params);
}
export function pageFilters(filters:SearchFilters,page:number):SearchFilters{return {...filters,page:String(page)};}
