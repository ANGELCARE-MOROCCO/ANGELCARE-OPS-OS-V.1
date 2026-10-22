import { JobkixFault } from './contracts';
import { countryCode,integer,text,choice } from './validation';
export function talentQuery(search:Record<string,string|string[]|undefined>){
 const filters:Record<string,string>={};for(const key of ['q','country','occupation','skill','language','experience']){const value=search[key];if(Array.isArray(value))throw new JobkixFault('INVALID_INPUT');if(value){const checked=key==='country'?countryCode(value):key==='experience'?choice(value,['recorded','none'],'experience'):text(value,key,1,300);if(checked===null)throw new JobkixFault('INVALID_INPUT');filters[key]=checked;}}
 if(Array.isArray(search.page)||search.page&&!/^\d{1,5}$/.test(search.page))throw new JobkixFault('INVALID_INPUT');return {filters,page:integer(Number(search.page||1),'page',1,10000)};
}
