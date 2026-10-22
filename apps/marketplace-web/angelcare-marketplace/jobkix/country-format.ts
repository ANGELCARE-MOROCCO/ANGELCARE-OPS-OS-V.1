import type { Locale } from './contracts';
import { selectableCountries } from './geography';
export interface CountryLabel {code:string;name:string}
export function countryName(code:string,locale:Locale):string {
 try{return new Intl.DisplayNames([locale],{type:'region'}).of(code)||code;}catch{return code;}
}
/** Serialize this server-generated order once. Node and browsers can have
 * different CLDR names/collation even for the same locale. */
export function countryOptions(locale:Locale):CountryLabel[]{return selectableCountries.map(code=>({code,name:countryName(code,locale)})).sort((a,b)=>a.name.localeCompare(b.name,locale)||a.code.localeCompare(b.code));}
