import { JobkixFault,type Locale } from './contracts';
import { COUNTRY_CODES } from './countries';
import { countryRegion,DISCOVERY_REGIONS } from './country-regions';
import { countryName } from './country-format';
import { countryCode } from './validation';
import type { SearchFilters } from './discovery';
export const selectableCountries=COUNTRY_CODES.filter(code=>{try{return countryCode(code)===code;}catch{return false;}});
export function nativeCountry(value:string){const code=value.toUpperCase();if(!selectableCountries.some(country=>country===code))throw new JobkixFault('NOT_FOUND');return code;}
export function destinationFilters(filters:SearchFilters,country:string,city?:string):SearchFilters{
 return {...filters,destination:country,...(city?{city}:{}),reach:filters.reach==='domestic'&&filters.origin===country?'domestic':filters.reach==='abroad'&&filters.origin&&filters.origin!==country?'abroad':'worldwide'};
}
export function countryDirectory(locale:Locale,counts:{code:string;count:number}[]|null,term:string,region:string,page:number){
 if(region&&!DISCOVERY_REGIONS.some(value=>value===region))throw new JobkixFault('INVALID_INPUT');
 const rows=selectableCountries.map(code=>({code,name:countryName(code,locale),region:countryRegion(code),count:counts?counts.find(row=>row.code===code)?.count||0:null})).filter(row=>(!region||row.region===region)&&(!term||(row.name+' '+row.code).toLocaleLowerCase(locale).includes(term.toLocaleLowerCase(locale)))).sort((a,b)=>a.name.localeCompare(b.name,locale));
 return {items:rows.slice((page-1)*24,page*24),total:rows.length,page,pageSize:24};
}
