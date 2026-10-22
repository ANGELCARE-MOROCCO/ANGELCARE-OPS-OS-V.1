import { JobkixFault } from './contracts';
import { text,countryCode,uuid,choice } from './validation';
export function reputationFilters(search:Record<string,string|string[]|undefined>){
 const filters:Record<string,string>={};for(const key of ['country','profession','organizationId','rating','currency','unit']){const value=search[key];if(Array.isArray(value))throw new JobkixFault('INVALID_INPUT');if(!value)continue;
 if(key==='country'){const code=countryCode(value);if(code)filters[key]=code;}else if(key==='organizationId')filters[key]=uuid(value);else if(key==='rating')filters[key]=choice(value,['1','2','3','4','5'],'rating');else if(key==='unit')filters[key]=choice(value,['hour','day','week','month','year'],'unit');else if(key==='currency'){if(!Intl.supportedValuesOf('currency').includes(value))throw new JobkixFault('INVALID_INPUT');filters[key]=value;}else filters[key]=text(value,key,1,100);
 }
 const query=search.term||search.q;if(Array.isArray(query))throw new JobkixFault('INVALID_INPUT');if(query)filters.q=text(query,'q',1,240);return filters;
}
