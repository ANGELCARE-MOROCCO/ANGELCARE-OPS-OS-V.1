import type { Locale } from './contracts';
import type { ResolvedEditorialMedia } from './editorial-media';
import { g } from './geography-copy';
export function geographicTitle(locale:Locale,name:string){return g(locale,'careersIn').replace('{place}',()=>name);}
/** Location-specific editorial choices only; never a geography or eligibility authority. */
export function geographicScene(country:string,city:string|null,locale:Locale):ResolvedEditorialMedia|null{
 const name=city?.normalize('NFC').trim().toLowerCase();
 const destination=country==='CA'&&(!name||name==='toronto')?'toronto':country==='GB'&&(!name||name==='london')?'london':null;
 if(!destination)return null;
 const id='destination-'+destination;
 return {source:'editorial',id,url:'/jobkix/editorial/'+id+'.webp',mobileUrl:'/jobkix/editorial/'+id+'-mobile.webp',width:1536,height:1024,alt:g(locale,destination==='toronto'?'torontoDescription':'londonDescription'),desktopFocal:destination==='toronto'?{x:52,y:65}:{x:60,y:53},mobileFocal:{x:50,y:60}};
}
export function geographicOpeningImage(selected:ResolvedEditorialMedia|null,country:string,city:string|null,locale:Locale){return selected||geographicScene(country,city,locale);}
