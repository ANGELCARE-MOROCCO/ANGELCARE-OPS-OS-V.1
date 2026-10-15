import type { FooterLocale, FooterProfile } from './types'
import { getPublicStorefrontNavigation } from '../public-experience-authority/storefront-navigation'

export const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
export function exactText(v:unknown,l:FooterLocale){const x=record(v)[l];return typeof x==='string'?x:''}
export function localText(v:unknown,l:FooterLocale,f=''){if(typeof v==='string')return v;const o=record(v);return String(o[l]||o.fr||o.en||f)}
export const NUMBER_CONTROLS=[
 ['logo_width',140,440,330,'Largeur logo · bureau'],['logo_mobile',120,300,230,'Largeur logo · mobile'],
 ['title_size',24,64,48,'Titre · bureau'],['title_mobile',22,44,31,'Titre · mobile'],['title_weight',400,900,700,'Graisse du titre'],
 ['body_size',12,20,16,'Texte sous le logo'],['body_line_height',1.3,2.1,1.7,'Interligne du texte'],
 ['content_width',960,1800,1540,'Largeur du footer'],['brand_share',24,44,31.2,'Colonne identité (%)'],['column_gap',20,80,56,'Espace identité / répertoire'],
 ['padding_top',24,100,64,'Marge intérieure haute'],['padding_bottom',24,100,46,'Marge intérieure basse'],['section_gap',8,32,13,'Espace entre sections'],
 ['radius',4,36,24,'Arrondi des sections'],['border_width',0,3,1,'Épaisseur des contours'],['card_padding',12,28,18,'Marge des en-têtes'],
 ['link_size',11,17,12,'Taille des liens'],['description_size',11,16,11,'Descriptions des sections'],
] as const
export const COLOUR_CONTROLS=['background','background_alt','surface','surface_alt','text','muted','accent','accent_alt','line','glow','authority'] as const
export const CHOICES={logo_variant:['white','colour','auto'],alignment:['start','center'],surface:['glass','solid','outline'],motion:['subtle','none'],desktop_open:['configured','all','closed'],grid_alignment:['stretch','start'],shadow:['theme','none','soft']} as const
export function colour(v:unknown):string|undefined{if(typeof v!=='string')return;const s=v.trim();if(/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(s)||/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(s))return s}
export function presentation(p:FooterProfile){const raw=record(p.settings.presentation),n:Record<string,number>={},choices:Record<string,string>={},tokens={...p.theme.tokens};for(const [k,min,max] of NUMBER_CONTROLS){const v=raw[k];if(typeof v==='number'&&Number.isFinite(v))n[k]=Math.min(max,Math.max(min,v))}for(const k of COLOUR_CONTROLS){const c=colour(record(raw.colours)[k]);if(c)tokens[k]=c}for(const [k,values] of Object.entries(CHOICES)){const value=raw[k];if(typeof value==='string'&&(values as readonly string[]).includes(value))choices[k]=value}return {tokens,n,choices}}
export type BrandBadge={id:string;icon:string;enabled:boolean;label:Record<string,string>}
export function defaultBadges():BrandBadge[]{return [
 {id:'commerce',icon:'shield',enabled:true,label:{fr:'Commerce gouverné',en:'Governed commerce',ar:'تجارة موثوقة'}},
 {id:'build',icon:'sparkles',enabled:true,label:{fr:'Build 360',en:'Build 360',ar:'Build 360'}},
 {id:'languages',icon:'globe',enabled:true,label:{fr:'FR · EN · AR',en:'FR · EN · AR',ar:'FR · EN · AR'}},
]}
export function badges(brand:Record<string,unknown>):BrandBadge[]{return Array.isArray(brand.trust_signals)?brand.trust_signals.slice(0,6).map((x,i)=>{const b=record(x);return {id:String(b.id||i),icon:String(b.icon||'shield'),enabled:b.enabled!==false,label:record(b.label) as Record<string,string>}}):defaultBadges()}
export function quickDestinations(l:FooterLocale){const labels={fr:['Explorer le Marketplace','Trust & Quality','Support','Professionnels','Mon ANGELCARE'],en:['Explore Marketplace','Trust & Quality','Support','Professionals','My ANGELCARE'],ar:['استكشف السوق','الثقة والجودة','الدعم','المهنيون','حسابي في أنجل كير']}[l];return ['marketplace','trust','support','professionals','account'].map((key,i)=>({key,label:labels[i],href:[`/angelcare-marketplace/${l}/marketplace`,`/angelcare-marketplace/${l}/trust`,`/angelcare-marketplace/${l}/contact`,'/angelcare-marketplace/provider',`/angelcare-marketplace/${l}/account`][i]}))}
export const footerWorlds=getPublicStorefrontNavigation
export function deepMerge(base:unknown,patch:unknown,depth=0):Record<string,unknown>{if(depth>10)throw Error('Personnalisation trop imbriquée.');const result={...record(base)};for(const [k,v] of Object.entries(record(patch))){if(['__proto__','prototype','constructor'].includes(k))throw Error('Clé de personnalisation interdite.');result[k]=v&&typeof v==='object'&&!Array.isArray(v)?deepMerge(result[k],v,depth+1):v}return result}
export const BRAND_TEXT_FIELDS=['eyebrow','title','description','description_secondary','directory_title','directory_eyebrow','quick_title','worlds_title','service_desks_label','service_coverage_label','service_languages_label'] as const
export function validatePersonalization(settings:Record<string,unknown>,brand:Record<string,unknown>){
 if(JSON.stringify({settings,brand}).length>100000)throw Error('Personnalisation trop volumineuse.')
 const p=record(settings.presentation)
 for(const [key,min,max] of NUMBER_CONTROLS){const v=p[key];if(v!=null&&(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max))throw Error(`Valeur hors limites : ${key}.`)}
 for(const [k,values] of Object.entries(CHOICES)){const v=p[k];if(v!=null&&(typeof v!=='string'||!(values as readonly string[]).includes(v)))throw Error(`Choix invalide : ${k}.`)}
 for(const k of COLOUR_CONTROLS)if(record(p.colours)[k]!=null&&!colour(record(p.colours)[k]))throw Error(`Couleur invalide : ${k}.`)
 for(const k of ['desktop_columns','tablet_columns'])if(settings[k]!=null&&(typeof settings[k]!=='number'||!Number.isInteger(settings[k])||Number(settings[k])<1||Number(settings[k])>6))throw Error(`Colonnes invalides : ${k}.`)
 for(const k of BRAND_TEXT_FIELDS){const v=brand[k];if(v==null)continue;if(typeof v==='string'){if(v.length>(k.startsWith('description')?2000:240))throw Error(`Texte trop long : ${k}.`);continue}if(!v||typeof v!=='object'||Array.isArray(v))throw Error(`Texte localisé invalide : ${k}.`);for(const l of ['fr','en','ar']){const s=record(v)[l];if(s!=null&&(typeof s!=='string'||s.length>(k.startsWith('description')?2000:240)))throw Error(`Texte invalide : ${k} / ${l}.`)}}
 if(brand.trust_signals!=null){if(!Array.isArray(brand.trust_signals)||brand.trust_signals.length>6)throw Error('Six repères au maximum.');const seen=new Set<string>();for(const x of brand.trust_signals){const b=record(x);if(typeof b.id!=='string'||seen.has(b.id))throw Error('Identifiant de repère invalide.');seen.add(b.id);if(!['shield','sparkles','globe','heart','award'].includes(String(b.icon)))throw Error('Icône invalide.');if(b.enabled!=null&&typeof b.enabled!=='boolean')throw Error('Visibilité de repère invalide.');for(const v of Object.values(record(b.label)))if(typeof v!=='string'||v.length>100)throw Error('Libellé de repère invalide.')}}
}
export function resolveOfficialLogo(p:FooterProfile){const {choices,tokens}=presentation(p);let variant=choices.logo_variant||'white';if(variant==='auto'){const h=tokens.background;variant=/^#[\da-f]{6}$/i.test(h)&&(.2126*parseInt(h.slice(1,3),16)+.7152*parseInt(h.slice(3,5),16)+.0722*parseInt(h.slice(5,7),16)>160)?'colour':'white'}return `/brand/angelcare-pearl-rim-${variant}-r1.png`}
export function contrast(a:string,b:string){const lum=(h:string)=>{if(!/^#[\da-f]{6}$/i.test(h))return null;const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const x=lum(a),y=lum(b);return x==null||y==null?null:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
