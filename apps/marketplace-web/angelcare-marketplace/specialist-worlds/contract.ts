import type {CatalogLocale,DiscoveryItem} from '../catalog-discovery/types'
import type {Profile} from './content'
export type CatalogueState={items:DiscoveryItem[];status:'ready'|'error';association:'category_or_collection'|'unassigned'|'academy'}
export const href=(locale:CatalogLocale,route:string)=>`/angelcare-marketplace/${locale}/${route}`
export function projectBrief(p:Profile,locale:CatalogLocale,focus:number|null,context:number|null){
 const values=[p.label[locale],focus!==null&&p.chapters[focus]?p.chapters[focus].title[locale]:'',context!==null&&p.choices[context]?p.choices[context][locale]:''].filter(Boolean)
 return values.join(' · ').slice(0,1000)
}
export function requestHref(p:Profile,locale:CatalogLocale,brief:string){
 const route=p.contact==='partner-os'?'partner-os/contact':`${p.contact}/request`
 return href(locale,route)+(brief?'?brief='+encodeURIComponent(brief.slice(0,1000)):'')
}
export const cleanBrief=(value:unknown)=>typeof value==='string'?value.replace(/[\u0000-\u001f]/g,' ').slice(0,1000):''
export function filterOffers(items:readonly DiscoveryItem[],query:string,kind:string,sort:string){
 const q=query.trim().toLocaleLowerCase();const filtered=items.filter(i=>(!q||[i.name,i.short_description,i.category_title].filter(Boolean).join(' ').toLocaleLowerCase().includes(q))&&(!kind||i.kind===kind))
 if(sort==='price')filtered.sort((a,b)=>(a.price_amount??Infinity)-(b.price_amount??Infinity))
 return filtered
}
export function priceLabel(item:DiscoveryItem,locale:CatalogLocale){
 if(item.price_amount===null)return null
 if(!Number.isFinite(item.price_amount)||item.price_amount<0)return null
 return `${new Intl.NumberFormat(locale).format(item.price_amount)} ${item.currency_label}`
}
export const ACADEMY_SCHEMAS=new Set(['academy-course','academy-cohort','certification-pathway','parent-workshop','institutional-training','preschool-admission'])
export function academyEligible(item:DiscoveryItem){return ACADEMY_SCHEMAS.has(String(item.metadata.experience_schema_key||''))||item.kind==='training'}
