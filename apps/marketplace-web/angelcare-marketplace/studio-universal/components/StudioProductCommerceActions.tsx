'use client'

import {useEffect,useMemo,useState} from 'react'
import {ArrowRight,Heart,LoaderCircle,MessageCircle,Minus,Plus,Share2,ShoppingCart,Zap} from 'lucide-react'
import styles from './studio-product-world-runtime.module.css'

type VariantGroup={key:string;label:string;values:string[]}
type BasketEnvelope<T>={data?:T;error?:{message?:string}}
type Basket={id:string}

type Locale='fr'|'en'|'ar'
const localeOf=(value:string):Locale=>value==='ar'?'ar':value==='en'?'en':'fr'
const copy={
 fr:{promo:'OFFRE',add:'Ajouter au panier',buy:'Acheter maintenant',qty:'Quantité',advice:'Demander conseil',favorite:'Ajouter aux favoris',saved:'Dans mes favoris',share:'Partager',copied:'Lien copié.',shareFail:'Partage indisponible.',actionFail:'Action impossible.',basketFail:'Action panier impossible.',removeQty:'Réduire la quantité',addQty:'Augmenter la quantité',media:'Afficher le média'},
 en:{promo:'OFFER',add:'Add to basket',buy:'Buy now',qty:'Quantity',advice:'Ask for advice',favorite:'Add to favourites',saved:'Saved',share:'Share',copied:'Link copied.',shareFail:'Sharing unavailable.',actionFail:'Action unavailable.',basketFail:'Basket action unavailable.',removeQty:'Reduce quantity',addQty:'Increase quantity',media:'Show media'},
 ar:{promo:'عرض',add:'أضف إلى السلة',buy:'اشتر الآن',qty:'الكمية',advice:'اطلب نصيحة',favorite:'أضف إلى المفضلة',saved:'في المفضلة',share:'مشاركة',copied:'تم نسخ الرابط.',shareFail:'المشاركة غير متاحة.',actionFail:'الإجراء غير متاح.',basketFail:'تعذر تنفيذ إجراء السلة.',removeQty:'تقليل الكمية',addQty:'زيادة الكمية',media:'عرض الوسائط'},
} as const

const languageValue=(value:string,locale:Locale)=>{
 const raw=value.trim().toLowerCase().replaceAll('_',' ')
 const maps:Record<Locale,Record<string,string>>={
  fr:{fr:'Français',en:'English',ar:'العربية','fr ar':'Français + Arabe','fr en':'Français + Anglais','en ar':'Anglais + Arabe','fr en ar':'Pack trilingue',trilingual:'Pack trilingue',bilingual:'Pack bilingue'},
  en:{fr:'French',en:'English',ar:'Arabic','fr ar':'French + Arabic','fr en':'French + English','en ar':'English + Arabic','fr en ar':'Trilingual pack',trilingual:'Trilingual pack',bilingual:'Bilingual pack'},
  ar:{fr:'الفرنسية',en:'الإنجليزية',ar:'العربية','fr ar':'الفرنسية + العربية','fr en':'الفرنسية + الإنجليزية','en ar':'الإنجليزية + العربية','fr en ar':'حزمة ثلاثية اللغات',trilingual:'حزمة ثلاثية اللغات',bilingual:'حزمة ثنائية اللغة'},
 }
 return maps[locale][raw]||value.replaceAll('_',' ')
}

function visitorReference(){
 const name='ac_marketplace_visitor'
 const current=document.cookie.split('; ').find(entry=>entry.startsWith(`${name}=`))?.split('=')[1]
 if(current)return decodeURIComponent(current)
 const value=crypto.randomUUID()
 document.cookie=`${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
 return value
}

async function api<T>(url:string,init?:RequestInit):Promise<T>{
 const headers=new Headers(init?.headers)
 if(!headers.has('content-type'))headers.set('content-type','application/json')
 const response=await fetch(url,{...init,headers})
 const payload=await response.json().catch(()=>({})) as BasketEnvelope<T>
 if(!response.ok||payload.error||payload.data===undefined)throw new Error(payload.error?.message||'Action panier impossible.')
 return payload.data
}

async function ensureBasket(locale:string,visitor:string){
 return api<Basket>(`/api/angelcare-marketplace/conversion/basket?locale=${encodeURIComponent(locale)}&kind=transactional`,{headers:{'x-marketplace-visitor':visitor}})
}

async function addSlug(input:{basketId:string;visitor:string;locale:string;slug:string;quantity:number;configuration:Record<string,unknown>}){
 return api(`/api/angelcare-marketplace/conversion/basket/${encodeURIComponent(input.basketId)}/items`,{method:'POST',body:JSON.stringify({visitorReference:input.visitor,itemSlug:input.slug,locale:input.locale,quantity:input.quantity,configuration:input.configuration})})
}

export function ProductMediaGalleryClient({name,media,promotion=false,badge='',locale='fr' }:{name:string;media:Array<{id:string;url:string;alt:string}>;promotion?:boolean;badge?:string;locale?:string}){
 const l=localeOf(locale),[selected,setSelected]=useState(0)
 const unique=useMemo(()=>{const seen=new Set<string>();return media.filter(row=>{if(!row.url||seen.has(row.url))return false;seen.add(row.url);return true})},[media])
 const active=unique[selected]||unique[0]||null
 return <section className={styles.mediaGallery} data-ac-product-world-section="media">
  {unique.length>1?<div className={styles.thumbnailRail}>{unique.slice(0,6).map((item,index)=><button type="button" key={item.id||item.url} aria-label={`${copy[l].media} ${index+1}`} aria-pressed={selected===index} data-selected={selected===index} onClick={()=>setSelected(index)}><img src={item.url} alt={item.alt||`${name} ${index+1}`} loading={index?'lazy':'eager'}/></button>)}</div>:null}
  <div className={styles.primaryMediaWrap}>{active?<img className={styles.primaryMedia} src={active.url} alt={active.alt||name} loading="eager" fetchPriority="high"/>:<div className={styles.mediaPlaceholder}><ShoppingCart/><span>{name}</span></div>}{promotion?<span className={styles.promoBadge}>{copy[l].promo}</span>:null}{badge?<span className={styles.bestBadge}>{badge}</span>:null}{unique.length>1?<span className={styles.mediaCounter}>{Math.min(selected+1,unique.length)}/{unique.length}</span>:null}</div>
 </section>
}

export function ShareButton({locale='fr'}:{locale?:string}){
 const l=localeOf(locale),[message,setMessage]=useState('')
 async function share(){try{if(navigator.share)await navigator.share({title:document.title,url:window.location.href});else{await navigator.clipboard.writeText(window.location.href);setMessage(copy[l].copied)}}catch(error){if(error instanceof Error&&error.name!=='AbortError')setMessage(copy[l].shareFail)}}
 return <div className={styles.utilityActionWrap}><button type="button" className={styles.utilityAction} onClick={()=>void share()}><Share2/>{copy[l].share}</button>{message?<small role="status">{message}</small>:null}</div>
}

export function ProductCommerceActions({locale,itemSlug,variantGroups,maxQuantity,available=true,basketEnabled=true,checkoutEnabled=true}:{locale:string;itemSlug:string;variantGroups:VariantGroup[];maxQuantity:number|null;available?:boolean;basketEnabled?:boolean;checkoutEnabled?:boolean}){
 const l=localeOf(locale),defaults=useMemo(()=>Object.fromEntries(variantGroups.map(group=>[group.key,group.values[0]||''])),[variantGroups])
 const[configuration,setConfiguration]=useState<Record<string,string>>(defaults),[quantity,setQuantity]=useState(1),[busy,setBusy]=useState<'basket'|'checkout'|null>(null),[message,setMessage]=useState('')
 const upper=Math.max(1,Math.min(maxQuantity&&maxQuantity>0?maxQuantity:99,99))
 async function act(mode:'basket'|'checkout'){
  if(!available||busy)return
  setBusy(mode);setMessage('')
  try{const visitor=visitorReference(),basket=await ensureBasket(locale,visitor);await addSlug({basketId:basket.id,visitor,locale,slug:itemSlug,quantity,configuration});window.location.assign(mode==='checkout'?`/angelcare-marketplace/${locale}/checkout?basket=${encodeURIComponent(basket.id)}&kind=transactional`:`/angelcare-marketplace/${locale}/basket`)}catch(error){setMessage(error instanceof Error?error.message:copy[l].actionFail);setBusy(null)}
 }
 return <div className={styles.purchaseControls}>
  {variantGroups.length?<div className={styles.variantGroups}>{variantGroups.map(group=><div className={styles.variantGroup} key={group.key}><span>{group.label}</span><div>{group.values.map(option=><button type="button" key={option} aria-pressed={configuration[group.key]===option} data-selected={configuration[group.key]===option} onClick={()=>setConfiguration(current=>({...current,[group.key]:option}))}>{languageValue(option,l)}</button>)}</div></div>)}</div>:null}
  <div className={styles.quantityLine}><span>{copy[l].qty}</span><div className={styles.quantityStepper}><button type="button" aria-label={copy[l].removeQty} onClick={()=>setQuantity(value=>Math.max(1,value-1))} disabled={quantity<=1}><Minus/></button><strong>{quantity}</strong><button type="button" aria-label={copy[l].addQty} onClick={()=>setQuantity(value=>Math.min(upper,value+1))} disabled={quantity>=upper}><Plus/></button></div></div>
  <div className={styles.primaryActions}>{basketEnabled?<button className={styles.addCart} type="button" disabled={!available||Boolean(busy)} onClick={()=>void act('basket')}>{busy==='basket'?<LoaderCircle className={styles.spin}/>:<ShoppingCart/>}{copy[l].add}</button>:null}{checkoutEnabled?<button className={styles.buyNow} type="button" disabled={!available||Boolean(busy)} onClick={()=>void act('checkout')}>{busy==='checkout'?<LoaderCircle className={styles.spin}/>:<Zap/>}{copy[l].buy}</button>:null}</div>
  {message?<div className={styles.actionError} role="status">{message}</div>:null}
 </div>
}

export function QuickBasketButton({locale,slugs,label,className}:{locale:string;slugs:string[];label?:string;className?:string}){
 const l=localeOf(locale),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function add(){if(busy||!slugs.length)return;setBusy(true);setMessage('');try{const visitor=visitorReference(),basket=await ensureBasket(locale,visitor);for(const slug of [...new Set(slugs.filter(Boolean))])await addSlug({basketId:basket.id,visitor,locale,slug,quantity:1,configuration:{}});window.location.assign(`/angelcare-marketplace/${locale}/basket`)}catch(error){setMessage(error instanceof Error?error.message:copy[l].basketFail);setBusy(false)}}
 return <div className={styles.quickBasketWrap}><button type="button" className={className||styles.quickBasket} onClick={()=>void add()} disabled={busy||!slugs.length}>{busy?<LoaderCircle className={styles.spin}/>:<ShoppingCart/>}{label||copy[l].add}</button>{message?<small role="status">{message}</small>:null}</div>
}

export function FavoriteButton({locale,itemId,itemSlug}:{locale:string;itemId:string;itemSlug:string}){
 const l=localeOf(locale),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[message,setMessage]=useState('')
 useEffect(()=>{let live=true;fetch('/api/angelcare-marketplace/homepage/engagement').then(response=>response.json()).then((payload:BasketEnvelope<Array<{catalog_item_id?:string;selection_type?:string}>>)=>{if(!live)return;const rows=Array.isArray(payload.data)?payload.data:[];setSaved(rows.some(row=>row.catalog_item_id===itemId&&row.selection_type==='saved'))}).catch(()=>{});return()=>{live=false}},[itemId])
 async function toggle(){if(busy)return;setBusy(true);setMessage('');try{const next=!saved;const response=await fetch('/api/angelcare-marketplace/homepage/engagement',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:next?'product.saved':'product.unsaved',locale,catalog_item_id:itemId,selection_type:'saved',active:next,route:window.location.pathname,event_data:{itemSlug}})});const payload=await response.json().catch(()=>({})) as BasketEnvelope<{recorded?:boolean}>;if(!response.ok||payload.error)throw new Error(payload.error?.message||copy[l].actionFail);setSaved(next)}catch(error){setMessage(error instanceof Error?error.message:copy[l].actionFail)}finally{setBusy(false)}}
 return <div className={styles.utilityActionWrap}><button className={styles.utilityAction} type="button" onClick={()=>void toggle()} disabled={busy} aria-pressed={saved}>{busy?<LoaderCircle className={styles.spin}/>:<Heart fill={saved?'currentColor':'none'}/>} {saved?copy[l].saved:copy[l].favorite}</button>{message?<small role="status">{message}</small>:null}</div>
}

export function AdviceLink({locale,itemSlug}:{locale:string;itemSlug:string}){const l=localeOf(locale);return <a className={styles.adviceButton} href={`/angelcare-marketplace/${locale}/account/support?item=${encodeURIComponent(itemSlug)}`}><MessageCircle/>{copy[l].advice}<ArrowRight/></a>}
