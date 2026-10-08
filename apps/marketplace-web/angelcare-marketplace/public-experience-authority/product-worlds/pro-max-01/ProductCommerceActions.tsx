'use client'

import {useEffect,useMemo,useState} from 'react'
import {ArrowRight,Heart,LoaderCircle,Minus,Plus,ShoppingCart,Zap} from 'lucide-react'
import styles from './product-pro-max-world01.module.css'

type VariantGroup={key:string;label:string;values:string[]}
type BasketEnvelope<T>={data?:T;error?:{message?:string}}
type Basket={id:string}

function visitorReference(){
 const name='ac_marketplace_visitor'
 const current=document.cookie.split('; ').find(entry=>entry.startsWith(`${name}=`))?.split('=')[1]
 if(current)return decodeURIComponent(current)
 const value=crypto.randomUUID()
 document.cookie=`${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
 return value
}

async function api<T>(url:string,init?:RequestInit):Promise<T>{
 const headers=new Headers(init?.headers);if(!headers.has('content-type'))headers.set('content-type','application/json');const response=await fetch(url,{...init,headers})
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


export function ProductMediaGalleryClient({name,media,promotion,badge}:{name:string;media:Array<{id:string;url:string;alt:string}>;promotion:boolean;badge:string}){
 const[selected,setSelected]=useState(0)
 const active=media[selected]||media[0]||null
 return <section className={styles.mediaGallery} data-ac-product-world-section="P04">
  <div className={styles.thumbnailRail}>{media.slice(0,5).map((item,index)=><button type="button" key={item.id||index} aria-label={`Afficher le média ${index+1}`} aria-pressed={selected===index} data-selected={selected===index} onClick={()=>setSelected(index)}><img src={item.url} alt={item.alt||`${name} ${index+1}`} loading={index?'lazy':'eager'}/></button>)}{media.length>5?<span>+{media.length-5}</span>:null}</div>
  <div className={styles.primaryMediaWrap}>{active?<img className={styles.primaryMedia} src={active.url} alt={active.alt||name} loading="eager" fetchPriority="high"/>:<div className={styles.mediaPlaceholder}><ShoppingCart/><span>{name}</span></div>}{promotion?<span className={styles.promoBadge}>OFFRE</span>:null}{badge?<span className={styles.bestBadge}>{badge}</span>:null}{media.length?<span className={styles.mediaCounter}>{Math.min(selected+1,media.length)}/{media.length}</span>:null}</div>
 </section>
}

export function ShareButton(){
 const[message,setMessage]=useState('')
 async function share(){
  try{if(navigator.share)await navigator.share({title:document.title,url:window.location.href});else{await navigator.clipboard.writeText(window.location.href);setMessage('Lien copié.')}}catch(error){if(error instanceof Error&&error.name!=='AbortError')setMessage('Partage indisponible.')}
 }
 return <div className={styles.shareWrap}><button type="button" className={styles.shareButton} onClick={()=>void share()}>Partager</button>{message?<small role="status">{message}</small>:null}</div>
}

export function ProductCommerceActions({locale,itemSlug,variantGroups,maxQuantity,available=true}:{locale:string;itemSlug:string;variantGroups:VariantGroup[];maxQuantity:number|null;available?:boolean}){
 const defaults=useMemo(()=>Object.fromEntries(variantGroups.map(group=>[group.key,group.values[0]||''])),[variantGroups])
 const[configuration,setConfiguration]=useState<Record<string,string>>(defaults)
 const[quantity,setQuantity]=useState(1)
 const[busy,setBusy]=useState<'basket'|'checkout'|null>(null)
 const[message,setMessage]=useState('')
 const upper=Math.max(1,Math.min(maxQuantity&&maxQuantity>0?maxQuantity:99,99))
 async function act(mode:'basket'|'checkout'){
  if(!available||busy)return
  setBusy(mode);setMessage('')
  try{
   const visitor=visitorReference(),basket=await ensureBasket(locale,visitor)
   await addSlug({basketId:basket.id,visitor,locale,slug:itemSlug,quantity,configuration})
   window.location.assign(mode==='checkout'?`/angelcare-marketplace/${locale}/checkout?basket=${encodeURIComponent(basket.id)}&kind=transactional`:`/angelcare-marketplace/${locale}/basket`)
  }catch(error){setMessage(error instanceof Error?error.message:'Action impossible.');setBusy(null)}
 }
 return <div className={styles.purchaseControls}>
  {variantGroups.length?<div className={styles.variantGroups}>{variantGroups.map(group=><div className={styles.variantGroup} key={group.key}><span>{group.label}</span><div>{group.values.map(option=><button type="button" key={option} aria-pressed={configuration[group.key]===option} data-selected={configuration[group.key]===option} onClick={()=>setConfiguration(current=>({...current,[group.key]:option}))}>{option.replaceAll('_',' ')}</button>)}</div></div>)}</div>:null}
  <div className={styles.quantityLine}><span>Quantité :</span><div className={styles.quantityStepper}><button type="button" aria-label="Réduire la quantité" onClick={()=>setQuantity(value=>Math.max(1,value-1))} disabled={quantity<=1}><Minus/></button><strong>{quantity}</strong><button type="button" aria-label="Augmenter la quantité" onClick={()=>setQuantity(value=>Math.min(upper,value+1))} disabled={quantity>=upper}><Plus/></button></div></div>
  <button className={styles.addCart} type="button" disabled={!available||Boolean(busy)} onClick={()=>void act('basket')}>{busy==='basket'?<LoaderCircle className={styles.spin}/>:<ShoppingCart/>} Ajouter au panier</button>
  <button className={styles.buyNow} type="button" disabled={!available||Boolean(busy)} onClick={()=>void act('checkout')}>{busy==='checkout'?<LoaderCircle className={styles.spin}/>:<Zap/>} Acheter maintenant</button>
  {message?<div className={styles.actionError} role="status">{message}</div>:null}
 </div>
}

export function QuickBasketButton({locale,slugs,label='Ajouter',className}:{locale:string;slugs:string[];label?:string;className?:string}){
 const[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function add(){
  if(busy||!slugs.length)return
  setBusy(true);setMessage('')
  try{
   const visitor=visitorReference(),basket=await ensureBasket(locale,visitor)
   for(const slug of [...new Set(slugs.filter(Boolean))])await addSlug({basketId:basket.id,visitor,locale,slug,quantity:1,configuration:{}})
   window.location.assign(`/angelcare-marketplace/${locale}/basket`)
  }catch(error){setMessage(error instanceof Error?error.message:'Action panier impossible.');setBusy(false)}
 }
 return <div className={styles.quickBasketWrap}><button type="button" className={className||styles.quickBasket} onClick={()=>void add()} disabled={busy||!slugs.length}>{busy?<LoaderCircle className={styles.spin}/>:<ShoppingCart/>}{label}</button>{message?<small role="status">{message}</small>:null}</div>
}

export function FavoriteButton({locale,itemId,itemSlug}:{locale:string;itemId:string;itemSlug:string}){
 const[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[message,setMessage]=useState('')
 useEffect(()=>{let live=true;fetch('/api/angelcare-marketplace/homepage/engagement').then(response=>response.json()).then((payload:BasketEnvelope<Array<{catalog_item_id?:string;selection_type?:string}>>)=>{if(!live)return;const rows=Array.isArray(payload.data)?payload.data:[];setSaved(rows.some(row=>row.catalog_item_id===itemId&&row.selection_type==='saved'))}).catch(()=>{});return()=>{live=false}},[itemId])
 async function toggle(){
  if(busy)return
  setBusy(true);setMessage('')
  try{
   const next=!saved
   const response=await fetch('/api/angelcare-marketplace/homepage/engagement',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:next?'product.saved':'product.unsaved',locale,catalog_item_id:itemId,selection_type:'saved',active:next,route:window.location.pathname,event_data:{itemSlug}})})
   const payload=await response.json().catch(()=>({})) as BasketEnvelope<{recorded?:boolean}>
   if(!response.ok||payload.error)throw new Error(payload.error?.message||'Impossible de mettre à jour vos favoris.')
   setSaved(next);setMessage(next?'Ajouté aux favoris.':'Retiré des favoris.')
  }catch(error){setMessage(error instanceof Error?error.message:'Action favoris impossible.')}finally{setBusy(false)}
 }
 return <div className={styles.favoriteWrap}><button className={styles.favoriteButton} type="button" onClick={()=>void toggle()} disabled={busy} aria-pressed={saved}>{busy?<LoaderCircle className={styles.spin}/>:<Heart fill={saved?'currentColor':'none'}/>} {saved?'Dans mes favoris':'Ajouter aux favoris'}</button>{message?<small role="status">{message}</small>:null}</div>
}
export function AdviceLink({locale,itemSlug}:{locale:string;itemSlug:string}){return <a className={styles.adviceButton} href={`/angelcare-marketplace/${locale}/account/support?item=${encodeURIComponent(itemSlug)}`}>Demander conseil <ArrowRight/></a>}
