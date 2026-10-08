import type { CatalogLocale, DiscoveryItem } from '../catalog-discovery/types'
import { familyWords, familyPrice, familyAvailability, familyAvailable, familyDetailHref, familyRequestHref, type FamilyWords } from '../families-storefront/experience'
export { familyWords as serviceWords, familyPrice as servicePrice, familyAvailability as serviceAvailability, familyAvailable as serviceAvailable, familyDetailHref as serviceDetailHref, familyRequestHref as serviceRequestHref }
export type ServiceGroup = 'care' | 'baby' | 'activities' | 'support' | 'events' | 'other'
export type ServiceFilters = { q: string; group: 'all' | ServiceGroup; duration: string; availableOnly: boolean; maxPrice: number | null; sort: 'recommended' | 'price-low' | 'price-high' | 'name'; view: 'grid' | 'list'; page: number }
export const SERVICE_GROUPS: readonly { key: ServiceGroup; label: FamilyWords; title: FamilyWords; lead: FamilyWords; image: string; tone: string }[] = [
 { key:'care',label:['Garde & relais','Childcare & support','رعاية الأطفال'],title:['Du temps pour vous. Un relais pour eux.','Time for you. Support for them.','وقت لكم ورعاية لهم.'],lead:['Une sortie, une journée chargée, un moment pour souffler : découvrez les services de garde adaptés à votre quotidien.','An outing, a busy day, a moment to breathe: explore childcare services for everyday family life.','خروج أو يوم مزدحم أو لحظة راحة: اكتشفوا خدمات الرعاية لحياتكم العائلية.'],image:'/angelcare-marketplace/families-world-r2/care.jpg',tone:'pink'},
 { key:'baby',label:['Post-partum & bébé','Postpartum & baby','ما بعد الولادة والرضيع'],title:['Les premiers jours, mieux entourés.','Support for those precious first days.','دعم في الأيام الأولى الثمينة.'],lead:['Un soutien non médical à domicile pour retrouver votre rythme avec bébé et préparer un relais selon votre besoin.','Non-medical support at home to find your rhythm with your baby and plan the help you need.','دعم غير طبي في المنزل لتنظيم حياتكم مع رضيعكم واختيار المرافقة المناسبة.'],image:'/angelcare-marketplace/families-world-r2/family.jpg',tone:'peach'},
 { key:'activities',label:['Éveil & activités','Discovery & activities','اكتشاف وأنشطة'],title:['Leur curiosité a rendez-vous à la maison.','Bring their curiosity to life at home.','فضولهم يزدهر في المنزل.'],lead:['Éveil, jeux, apprentissage et activités : comparez les formats et choisissez une expérience pour votre enfant.','Discovery, play, learning and activities: compare formats and choose an experience for your child.','اكتشاف ولعب وتعلم وأنشطة: قارنوا الصيغ واختاروا تجربة لطفلكم.'],image:'/angelcare-marketplace/families-world-r2/montessori.jpg',tone:'blue'},
 { key:'support',label:['Accompagnement adapté','Personalised support','مرافقة مناسبة'],title:['Chaque enfant. Son rythme. Son attention.','Every child. Their rhythm. Their care.','لكل طفل إيقاعه ورعايته.'],lead:['Explorez les accompagnements non médicaux et leurs conditions de préqualification pour préparer un soutien adapté.','Explore non-medical support and its qualification conditions to plan suitable care.','استكشفوا المرافقة غير الطبية وشروط التحقق من الملاءمة لإعداد دعم مناسب.'],image:'/angelcare-marketplace/families-world-r2/support.jpg',tone:'mint'},
 { key:'events',label:['Événements & fêtes','Events & celebrations','مناسبات واحتفالات'],title:['Vos grands moments. Leur petit univers.','Your big moments. Their own little world.','لحظاتكم الكبيرة وعالمهم الصغير.'],lead:['Anniversaires, réceptions et événements privés : préparez la garde et les activités des enfants pour votre occasion.','Birthdays, celebrations and private events: plan childcare and activities for your occasion.','أعياد ميلاد واحتفالات ومناسبات خاصة: خططوا لرعاية الأطفال وأنشطتهم.'],image:'/angelcare-marketplace/families-world-r2/holidays.jpg',tone:'violet'},
 { key:'other',label:['Autres services','More services','خدمات أخرى'],title:['Encore plus de possibilités pour votre quotidien.','More possibilities for your everyday life.','مزيد من الخيارات لحياتكم اليومية.'],lead:['Découvrez les autres services publiés et leurs conditions.','Explore other published services and their conditions.','اكتشفوا الخدمات الأخرى المنشورة وشروطها.'],image:'/angelcare-marketplace/families-world-r2/hero.jpg',tone:'amber'},
]
const capabilities: Record<string,ServiceGroup> = {'advanced-childcare':'care','home-care-postpartum':'baby','advanced-awakening-home':'activities','special-needs-home-support':'support','event-childcare':'events'}
const atomicGroups: Record<string,ServiceGroup> = {'home-childcare-one-time':'care','home-childcare-recurring':'care','school-pickup-care':'care','overnight-extended-care':'care','emergency-last-minute-care':'care','hotel-travel-childcare':'care','holiday-excursion-programme':'events','events-group-childcare':'events','montessori-home-service':'activities','learning-homework-support':'activities','non-medical-support-service':'support'}
export function serviceGroup(item:DiscoveryItem):ServiceGroup { return atomicGroups[String(item.metadata.experience_schema_key||'')] || capabilities[String(item.metadata.home_service_capability||'')] || 'other' }
export function isHomeServiceOffer(item:DiscoveryItem) { if(item.kind!=='service'||item.metadata.home_service_assignment!==true)return false;const schema=String(item.metadata.experience_schema_key||'');return schema?!!atomicGroups[schema]:['one_time_service','recurring_service'].includes(String(item.metadata.home_service_sellable_type||'')) }
export function serviceGroupLabel(key:ServiceGroup,locale:CatalogLocale){return familyWords(SERVICE_GROUPS.find(group=>group.key===key)!.label,locale)}
export function serviceDetails(item:DiscoveryItem):Record<string,string>{const value=item.metadata.home_service_details;return value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).filter((entry):entry is [string,string]=>typeof entry[1]==='string'&&entry[1].length>0)):{}}
export const serviceTokens=(value:string|undefined)=>[...new Set((value||'').split('|').map(part=>part.trim()).filter(Boolean))]
export const serviceDisplayValue=(value:string|undefined)=>serviceTokens(value).join(' · ')
export function readServiceFilters(query:Record<string,string>={}):ServiceFilters {
 const group=SERVICE_GROUPS.some(group=>group.key===query.group)?query.group as ServiceGroup:'all'
 const max=query.max?Number(query.max):null
 return {q:(query.q||'').trim().slice(0,120),group,duration:(query.duration||'').slice(0,80),availableOnly:query.available==='1',maxPrice:max!==null&&Number.isFinite(max)&&max>=0?Math.min(max,1000000):null,sort:['price-low','price-high','name'].includes(query.sort)?query.sort as ServiceFilters['sort']:'recommended',view:query.view==='list'?'list':'grid',page:Math.max(1,Math.min(100000,Math.floor(Number(query.page)||1)))}
}
const searchText=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
export function selectHomeServices(items:readonly DiscoveryItem[],filters:ServiceFilters,locale:CatalogLocale){
 const terms=searchText(filters.q).split(/\s+/).filter(Boolean)
 return items.filter(item=>{
  if(!isHomeServiceOffer(item)||(filters.group!=='all'&&serviceGroup(item)!==filters.group)||(filters.availableOnly&&!familyAvailable(item)))return false
  const details=serviceDetails(item)
  if(filters.duration&&!serviceTokens(details.duration).includes(filters.duration))return false
  if(filters.maxPrice!==null&&(item.price_mode==='quote_only'||item.price_amount===null||!Number.isFinite(item.price_amount)||item.price_amount>filters.maxPrice))return false
  const text=searchText(item.name+' '+(item.short_description||'')+' '+serviceGroupLabel(serviceGroup(item),locale)+' '+Object.values(details).join(' '))
  return terms.every(term=>text.includes(term))
 }).sort((a,b)=>{
  if(filters.sort==='price-low'||filters.sort==='price-high'){
   const price=(item:DiscoveryItem)=>item.price_mode!=='quote_only'&&item.price_amount!==null&&Number.isFinite(item.price_amount)?item.price_amount:null
   const ap=price(a),bp=price(b);if(ap===null&&bp!==null)return 1;if(bp===null&&ap!==null)return -1;if(ap!==null&&bp!==null&&ap!==bp)return (ap-bp)*(filters.sort==='price-high'?-1:1)
  }
  if(filters.sort==='recommended'){const order=Number(b.featured)-Number(a.featured)||Number(familyAvailable(b))-Number(familyAvailable(a));if(order)return order}
  return a.name.localeCompare(b.name,locale)||a.id.localeCompare(b.id)
 })
}
export function serviceFilterQuery(filters:ServiceFilters){const params=new URLSearchParams();if(filters.q)params.set('q',filters.q);if(filters.group!=='all')params.set('group',filters.group);if(filters.duration)params.set('duration',filters.duration);if(filters.availableOnly)params.set('available','1');if(filters.maxPrice!==null)params.set('max',String(filters.maxPrice));if(filters.sort!=='recommended')params.set('sort',filters.sort);if(filters.view!=='grid')params.set('view',filters.view);if(filters.page>1)params.set('page',String(filters.page));return params}
