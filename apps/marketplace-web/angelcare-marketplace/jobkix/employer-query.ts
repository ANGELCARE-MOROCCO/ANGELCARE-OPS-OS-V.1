import { JobkixFault } from './contracts';
import { countryCode,text,choice } from './validation';
import { filtersParams,type SearchFilters } from './discovery';
export function employerFilters(search:Record<string,string|string[]|undefined>){
 const filters:Record<string,string>={};for(const key of ['country','city','kind','setting','hiring']){const value=search[key];if(Array.isArray(value))throw new JobkixFault('INVALID_INPUT');if(!value)continue;if(key==='country'){const code=countryCode(value);if(code)filters[key]=code;}else if(key==='kind')filters[key]=choice(value,['household','institution','healthcare','hospitality','ngo','public','multi_site'],'kind');else if(key==='hiring')filters[key]=choice(value,['yes','no'],'hiring');else filters[key]=text(value,key,1,180);}
 const query=search.term||search.q;if(Array.isArray(query))throw new JobkixFault('INVALID_INPUT');if(query)filters.q=text(query,'q',1,300);return filters;
}
/** Keep independent native discovery context while using employer-specific keys. */
export function employerParams(filters:Record<string,string>,context:SearchFilters):URLSearchParams{
 const params=filtersParams(context);params.delete('page');
 for(const key of ['q','country','city','kind','setting','hiring'])if(filters[key])params.set(key==='q'?'term':key,filters[key]);
 return params;
}
