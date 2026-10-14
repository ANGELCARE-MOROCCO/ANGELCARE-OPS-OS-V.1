import rawPacks from './packs.json'
import type {PublicExperience360} from '../public-experience-authority/types'
import type {DossierDomain} from '../atomic-dossier/contract'

export type EditorialLocale='fr'|'en'|'ar'
export type LocalizedCopy=Partial<Record<EditorialLocale,string>>
export const EDITORIAL_ROLES=['desire','understand','guidance'] as const
export type EditorialRole=typeof EDITORIAL_ROLES[number]
export const EDITORIAL_ACTIONS=['description','specifications','contents','usage','fulfillment','conditions','included','plans','planning','preparation','coverage','providers','outcomes','curriculum','cohorts','organisation','pathway','assessment','fit','deployment','commercial','evidence','advice','discovery'] as const
export type EditorialAction=typeof EDITORIAL_ACTIONS[number]
export type EditorialStory={role:EditorialRole;heading:LocalizedCopy;body:LocalizedCopy;image:string;action:EditorialAction;focus:string;hidden?:boolean}
export type EditorialPack={key:string;domain:DossierDomain;treatment:string;labels:LocalizedCopy;stories:EditorialStory[]}
export type EditorialPlacement={hidden?:boolean;image?:string|null;heading?:LocalizedCopy;body?:LocalizedCopy;action?:EditorialAction;focus?:string}
export type EditorialConfig={version:1;enabled?:boolean;pack?:string;placements?:Partial<Record<EditorialRole,EditorialPlacement>>}
export type EditorialView={packKey:string;schemaKey:string;domain:DossierDomain;treatment:string;label:string;enabled:boolean;stories:EditorialStory[];source:'offer'|'studio'|'schema'|'fallback'}
export const EDITORIAL_PACKS=rawPacks as EditorialPack[]
const domainByMaster:Record<string,DossierDomain>={b2c_product_digital:'product',b2c_service_family:'service',academy_admission:'academy',b2b_institutional:'b2b'}
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const own=(v:object,k:string)=>Object.prototype.hasOwnProperty.call(v,k)
export function editorialText(v:unknown,max=240):string{return typeof v==='string'?v.replace(/<[^>]*>/g,'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,max):''}
export function editorialImage(v:unknown):string|null{if(typeof v!=='string'||!v.trim()||/[\u0000-\u001f\\]/.test(v))return null;const s=v.trim();if(s.startsWith('/')&&!s.startsWith('//')&&!s.split(/[?#]/)[0].split('/').some(p=>p==='..'))return s;try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
export function localCopy(v:LocalizedCopy|undefined,l:EditorialLocale){return v?.[l]||v?.fr||v?.en||v?.ar||''}
function copy(v:unknown,max:number):LocalizedCopy|undefined{const r=object(v),c:LocalizedCopy={};for(const l of ['fr','en','ar'] as const){const text=editorialText(r[l],max);if(text)c[l]=text}return Object.keys(c).length?c:undefined}
export function validFocus(v:unknown){if(typeof v!=='string'||!/^\d{1,3}(?:\.\d+)?% \d{1,3}(?:\.\d+)?%$/.test(v))return false;return v.split(' ').every(n=>parseFloat(n)>=0&&parseFloat(n)<=100)}
/** Public configuration allowlist. Unknown keys, private values and arbitrary destinations are discarded. */
export function normalizeEditorial(value:unknown,domain?:DossierDomain):EditorialConfig{
 const r=object(value),out:EditorialConfig={version:1};if(typeof r.enabled==='boolean')out.enabled=r.enabled
 if(typeof r.pack==='string'&&EDITORIAL_PACKS.some(p=>p.key===r.pack&&(!domain||p.domain===domain)))out.pack=r.pack
 const input=object(r.placements),placements:EditorialConfig['placements']={}
 for(const role of EDITORIAL_ROLES){const source=object(input[role]);if(!Object.keys(source).length)continue;const row:EditorialPlacement={};if(typeof source.hidden==='boolean')row.hidden=source.hidden;if(own(source,'image')){if(source.image===null||source.image==='')row.image=null;else{const url=editorialImage(source.image);if(url)row.image=url}}const heading=copy(source.heading,180),body=copy(source.body,650);if(heading)row.heading=heading;if(body)row.body=body;if(EDITORIAL_ACTIONS.includes(source.action as EditorialAction))row.action=source.action as EditorialAction;if(validFocus(source.focus))row.focus=source.focus as string;if(Object.keys(row).length)placements[role]=row}
 if(Object.keys(placements).length)out.placements=placements
 return out
}
export function editorialValidation(value:unknown,domain:DossierDomain):string[]{const r=object(value),errors:string[]=[];if(r.pack&&(!EDITORIAL_PACKS.some(p=>p.key===r.pack&&p.domain===domain)))errors.push('Le pack ne correspond pas au monde atomique de cette offre.');if(r.enabled!==undefined&&typeof r.enabled!=='boolean')errors.push('L’activation doit être un booléen.');const placements=object(r.placements);for(const key of Object.keys(placements))if(!EDITORIAL_ROLES.includes(key as EditorialRole))errors.push('Placement inconnu : '+key);for(const role of EDITORIAL_ROLES){const p=object(placements[role]);if(p.image!==undefined&&p.image!==null&&p.image!==''&&!editorialImage(p.image))errors.push('Image publique invalide pour '+role);if(p.action!==undefined&&!EDITORIAL_ACTIONS.includes(p.action as EditorialAction))errors.push('Action éditoriale inconnue pour '+role);if(p.focus!==undefined&&!validFocus(p.focus))errors.push('Point focal invalide pour '+role);for(const field of ['heading','body'])for(const [language,text]of Object.entries(object(p[field]))){if(!['fr','en','ar'].includes(language))errors.push('Langue inconnue.');if(typeof text!=='string'||text.length>(field==='heading'?180:650))errors.push('Texte invalide ou trop long pour '+role)}}return [...new Set(errors)]}

function fallback(domain:DossierDomain):EditorialPack{
 const headings={product:['Découvrez ce qui convient à votre usage.','Discover what fits your use.','اكتشف ما يناسب استخدامك.'],service:['Préparez l’accompagnement dont vous avez besoin.','Prepare the support you need.','حضر المرافقة التي تحتاجها.'],academy:['Explorez votre prochaine étape d’apprentissage.','Explore your next learning step.','اكتشف خطوة تعلمك القادمة.'],b2b:['Préparez un projet adapté à votre organisation.','Prepare a project for your organisation.','حضر مشروعاً يناسب مؤسستك.']} as const
 const translate=(values:readonly string[])=>Object.fromEntries(['fr','en','ar'].map((l,i)=>[l,values[i]]))
 return{key:'fallback-'+domain,domain,treatment:'neutral',labels:translate(headings[domain]),stories:EDITORIAL_ROLES.map(role=>({role,heading:translate(headings[domain]),body:{fr:'Explorez le dossier et préparez vos questions à partir des informations disponibles.',en:'Explore the dossier and prepare questions around the available information.',ar:'استكشف الملف وحضر أسئلتك انطلاقاً من المعلومات المتاحة.'},image:'/angelcare-marketplace/atomic-neutral-r4/help-'+domain+'.webp',action:role==='guidance'?'advice':'description',focus:'50% 50%'}))}
}
export function resolveEditorial(data:PublicExperience360,studio:Record<string,unknown>={}):EditorialView{
 const domain=domainByMaster[data.classification.masterDomain||'']||'product',l=data.classification.locale==='ar'?'ar':data.classification.locale==='en'?'en':'fr',offer=normalizeEditorial(object(data.domainExtension.experience).editorial,domain),world=normalizeEditorial(studio.editorial,domain),native=EDITORIAL_PACKS.find(p=>p.key===data.classification.schemaKey&&p.domain===domain),chosen=EDITORIAL_PACKS.find(p=>p.key===(offer.pack||world.pack)&&p.domain===domain),pack=chosen||native||fallback(domain)
 const enabled=offer.enabled??world.enabled??true
 const stories=pack.stories.map(base=>{const w=world.placements?.[base.role]||{},o=offer.placements?.[base.role]||{},changes={...w,...o},media=data.media.find(m=>(m.key==='editorial-'+base.role||(base.role==='guidance'&&m.key==='help'))&&m.type.startsWith('image')),configuredImage=own(changes,'image')?(changes.image||base.image):(editorialImage(media?.url)||base.image);return{...base,...changes,image:configuredImage,heading:{...base.heading,...w.heading,...o.heading},body:{...base.body,...w.body,...o.body},hidden:changes.hidden??false}})
 return{packKey:pack.key,schemaKey:data.classification.schemaKey,domain,treatment:pack.treatment,label:localCopy(pack.labels,l),enabled,stories,source:offer.pack?'offer':world.pack?'studio':native?'schema':'fallback'}
}
export function isEditorialMedia(key:string){return key.startsWith('editorial-')}
export function isPresentationMedia(key:string){return isEditorialMedia(key)||['context','description','contents','included','detail','help'].includes(key)}
