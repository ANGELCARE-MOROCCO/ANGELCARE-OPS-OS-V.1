'use client'

import {useEffect,useMemo,useState} from 'react'
import {ArrowRight,Heart,LoaderCircle,Minus,Plus,ShoppingCart,Share2,Sparkles,Zap,ZoomIn,X} from 'lucide-react'
import styles from './studio-product-world-runtime.module.css'

type VariantGroup={key:string;label:string;values:string[]}
type VariantItem={id:string;key:string;name:string;configuration:Record<string,unknown>;priceDelta:number|null;status:string;sortOrder:number}
type BasketEnvelope<T>={data?:T;error?:{message?:string}}
type Basket={id:string}
type MediaItem={id:string;url:string;alt:string}

const finite=(value:unknown)=>Number.isFinite(Number(value))?Number(value):null
const normalized=(value:unknown)=>String(value??'').trim().toLowerCase().replaceAll(' ','_').replaceAll('-','_')
const money=(amount:number|null,currency:string,locale:string,label='')=>amount===null?(label||'Sur devis'):`${new Intl.NumberFormat(locale==='ar'?'ar-MA':locale==='en'?'en-MA':'fr-MA',{maximumFractionDigits:2}).format(amount)} ${currency||'MAD'}`

function visitorReference(){
 const name='ac_marketplace_visitor'
 const current=document.cookie.split('; ').find(entry=>entry.startsWith(`${name}=`))?.split('=')[1]
 if(current)return decodeURIComponent(current)
 const value=crypto.randomUUID()
 document.cookie=`${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
 return value
}

async function api<T>(url:string,init?:RequestInit):Promise<T>{
 const headers=new Headers(init?.headers);if(!headers.has('content-type'))headers.set('content-type','application/json')
 const response=await fetch(url,{...init,headers})
 const payload=await response.json().catch(()=>({})) as BasketEnvelope<T>
 if(!response.ok||payload.error||payload.data===undefined)throw new Error(payload.error?.message||'Action panier impossible.')
 return payload.data
}
async function ensureBasket(locale:string,visitor:string){return api<Basket>(`/api/angelcare-marketplace/conversion/basket?locale=${encodeURIComponent(locale)}&kind=transactional`,{headers:{'x-marketplace-visitor':visitor}})}
async function addSlug(input:{basketId:string;visitor:string;locale:string;slug:string;quantity:number;configuration:Record<string,unknown>}){return api(`/api/angelcare-marketplace/conversion/basket/${encodeURIComponent(input.basketId)}/items`,{method:'POST',body:JSON.stringify({visitorReference:input.visitor,itemSlug:input.slug,locale:input.locale,quantity:input.quantity,configuration:input.configuration})})}

export function ProductMediaGalleryClient({name,media,promotion,badge}:{name:string;media:MediaItem[];promotion:boolean;badge:string}){
 const[selected,setSelected]=useState(0),[zoom,setZoom]=useState(false)
 const active=media[selected]||media[0]||null
 useEffect(()=>{if(!zoom)return;const fn=(event:KeyboardEvent)=>{if(event.key==='Escape')setZoom(false)};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[zoom])
 return <section className={styles.mediaGallery} data-ac-product-world-section="P04">
  <div className={styles.thumbnailRail}>{media.slice(0,5).map((item,index)=><button type="button" key={item.id||index} aria-label={`Afficher le média ${index+1}`} aria-pressed={selected===index} data-selected={selected===index} onClick={()=>setSelected(index)}><img src={item.url} alt={item.alt||`${name} ${index+1}`} loading={index?'lazy':'eager'}/></button>)}{media.length>5?<span>+{media.length-5}</span>:null}</div>
  <button type="button" className={styles.primaryMediaWrap} onClick={()=>active&&setZoom(true)} aria-label="Agrandir le média produit">{active?<img className={styles.primaryMedia} src={active.url} alt={active.alt||name} loading="eager" fetchPriority="high"/>:<div className={styles.mediaPlaceholder}><ShoppingCart/><span>{name}</span></div>}{promotion?<span className={styles.promoBadge}>OFFRE</span>:null}{badge?<span className={styles.bestBadge}>{badge}</span>:null}{media.length?<span className={styles.mediaCounter}>{Math.min(selected+1,media.length)}/{media.length}</span>:null}{active?<span className={styles.zoomHint}><ZoomIn/>Zoom</span>:null}</button>
  {zoom&&active?<div className={styles.zoomOverlay} role="dialog" aria-modal="true" aria-label={`Aperçu ${name}`} onClick={()=>setZoom(false)}><button type="button" className={styles.zoomClose} aria-label="Fermer"><X/></button><img src={active.url} alt={active.alt||name}/></div>:null}
 </section>
}

export function ShareButton(){
 const[message,setMessage]=useState('')
 async function share(){try{if(navigator.share)await navigator.share({title:document.title,url:window.location.href});else{await navigator.clipboard.writeText(window.location.href);setMessage('Lien copié.')}}catch(error){if(error instanceof Error&&error.name!=='AbortError')setMessage('Partage indisponible.')}}
 return <div className={styles.shareWrap}><button type="button" className={styles.shareButton} onClick={()=>void share()}><Share2/>Partager</button>{message?<small role="status">{message}</small>:null}</div>
}

export function FavoriteButton({locale,itemId,itemSlug}:{locale:string;itemId:string;itemSlug:string}){
 const[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[message,setMessage]=useState('')
 useEffect(()=>{let live=true;fetch('/api/angelcare-marketplace/homepage/engagement').then(response=>response.json()).then((payload:BasketEnvelope<Array<{catalog_item_id?:string;selection_type?:string}>>)=>{if(!live)return;const rows=Array.isArray(payload.data)?payload.data:[];setSaved(rows.some(row=>row.catalog_item_id===itemId&&row.selection_type==='saved'))}).catch(()=>{});return()=>{live=false}},[itemId])
 async function toggle(){if(busy)return;setBusy(true);setMessage('');try{const next=!saved;const response=await fetch('/api/angelcare-marketplace/homepage/engagement',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:next?'product.saved':'product.unsaved',locale,catalog_item_id:itemId,selection_type:'saved',active:next,route:window.location.pathname,event_data:{itemSlug}})});const payload=await response.json().catch(()=>({})) as BasketEnvelope<{recorded?:boolean}>;if(!response.ok||payload.error)throw new Error(payload.error?.message||'Impossible de mettre à jour vos favoris.');setSaved(next);setMessage(next?'Ajouté aux favoris.':'Retiré des favoris.')}catch(error){setMessage(error instanceof Error?error.message:'Action favoris impossible.')}finally{setBusy(false)}}
 return <div className={styles.favoriteWrap}><button className={styles.favoriteButton} type="button" onClick={()=>void toggle()} disabled={busy} aria-pressed={saved}>{busy?<LoaderCircle className={styles.spin}/>:<Heart fill={saved?'currentColor':'none'}/>} {saved?'Dans mes favoris':'Ajouter aux favoris'}</button>{message?<small role="status">{message}</small>:null}</div>
}

export function AdviceLink({locale,itemSlug}:{locale:string;itemSlug:string}){return <a className={styles.adviceButton} href={`/angelcare-marketplace/${locale}/account/support?item=${encodeURIComponent(itemSlug)}`}>Demander conseil <ArrowRight/></a>}

export function QuickBasketButton({locale,slugs,label='Ajouter',className}:{locale:string;slugs:string[];label?:string;className?:string}){
 const[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function add(){if(busy||!slugs.length)return;setBusy(true);setMessage('');try{const visitor=visitorReference(),basket=await ensureBasket(locale,visitor);for(const slug of [...new Set(slugs.filter(Boolean))])await addSlug({basketId:basket.id,visitor,locale,slug,quantity:1,configuration:{}});window.location.assign(`/angelcare-marketplace/${locale}/basket`)}catch(error){setMessage(error instanceof Error?error.message:'Action panier impossible.');setBusy(false)}}
 return <div className={styles.quickBasketWrap}><button type="button" className={className||styles.quickBasket} onClick={()=>void add()} disabled={busy||!slugs.length}>{busy?<LoaderCircle className={styles.spin}/>:<ShoppingCart/>}{label}</button>{message?<small role="status">{message}</small>:null}</div>
}

export function ProductPurchasePanelClient({locale,itemId,itemSlug,doctrineKey,basePrice,currency,priceLabel,compareAt,variantGroups,variantItems,maxQuantity,available,deliveryLabel,availabilityAuthority}:{locale:string;itemId:string;itemSlug:string;doctrineKey:string;basePrice:number|null;currency:string;priceLabel:string;compareAt:number|null;variantGroups:VariantGroup[];variantItems:VariantItem[];maxQuantity:number|null;available:boolean;deliveryLabel:string;availabilityAuthority:string}){
 const defaults=useMemo(()=>Object.fromEntries(variantGroups.map(group=>[group.key,group.values[0]||''])),[variantGroups])
 const[configuration,setConfiguration]=useState<Record<string,string>>(defaults)
 const[quantity,setQuantity]=useState(1)
 const[busy,setBusy]=useState<'basket'|'checkout'|'subscribe'|null>(null)
 const[message,setMessage]=useState('')
 const isDigital=doctrineKey==='digital-learning-resource'
 const isSubscription=doctrineKey==='activity-subscription-box'
 const selectedVariant=useMemo(()=>variantItems.find(item=>Object.entries(configuration).every(([key,value])=>normalized(item.configuration[key])===normalized(value)))||null,[variantItems,configuration])
 const variantAvailable=selectedVariant?!['unavailable','out_of_stock','archived','inactive','blocked'].includes(normalized(selectedVariant.status)):true
 const unitPrice=basePrice===null?null:basePrice+(finite(selectedVariant?.priceDelta)||0)
 const upper=isDigital?1:Math.max(1,Math.min(maxQuantity&&maxQuantity>0?maxQuantity:99,99))
 const allowed=available&&variantAvailable
 const subtotal=unitPrice===null?null:unitPrice*quantity
 const savings=compareAt!==null&&unitPrice!==null&&compareAt>unitPrice?compareAt-unitPrice:null
 async function transact(mode:'basket'|'checkout'){
  if(!allowed||busy)return;setBusy(mode);setMessage('')
  try{const visitor=visitorReference(),basket=await ensureBasket(locale,visitor);await addSlug({basketId:basket.id,visitor,locale,slug:itemSlug,quantity,configuration});window.location.assign(mode==='checkout'?`/angelcare-marketplace/${locale}/checkout?basket=${encodeURIComponent(basket.id)}&kind=transactional`:`/angelcare-marketplace/${locale}/basket`)}catch(error){setMessage(error instanceof Error?error.message:'Action impossible.');setBusy(null)}
 }
 function subscribe(){if(!allowed||busy)return;setBusy('subscribe');window.location.assign(`/angelcare-marketplace/${locale}/subscription/${encodeURIComponent(itemSlug)}`)}
 return <>
  <aside className={styles.purchaseBox} id="purchase-decision" data-ac-product-world-section="P06">
   <div className={styles.priceHead}>{compareAt!==null&&savings!==null?<del>{money(compareAt,currency,locale)}</del>:null}{savings!==null&&savings>0?<span>Économisez {money(savings,currency,locale)}</span>:null}</div>
   <strong className={styles.currentPrice} key={`${selectedVariant?.id||'base'}:${quantity}`}>{money(unitPrice,currency,locale,priceLabel)}</strong>
   {quantity>1&&subtotal!==null?<div className={styles.subtotalLine}><Sparkles/><span>Total pour {quantity}</span><strong>{money(subtotal,currency,locale)}</strong></div>:null}
   <div className={styles.stockLine} data-available={allowed}><span className={styles.stockPulse}/><span>{allowed?(maxQuantity!==null&&maxQuantity<=10&&!isDigital?`Disponible · ${maxQuantity} restant${maxQuantity>1?'s':''}`:isDigital?'Accès numérique disponible':isSubscription?'Abonnement disponible':'En stock / disponible'):'Indisponible actuellement'}</span></div>
   {!isDigital?<div className={styles.deliveryBox}><span className={styles.deliveryIcon}>↗</span><div><strong>{deliveryLabel}</strong><small>{availabilityAuthority?`Vérifié par ${availabilityAuthority}`:'Disponibilité revérifiée avant commande'}</small></div></div>:<div className={styles.deliveryBox}><span className={styles.deliveryIcon}>⚡</span><div><strong>Accès numérique</strong><small>Les droits d’accès sont revérifiés avant confirmation.</small></div></div>}
   {variantGroups.length?<div className={styles.variantGroups}>{variantGroups.map(group=><div className={styles.variantGroup} key={group.key}><span>{group.label}</span><div>{group.values.map(option=><button type="button" key={option} aria-pressed={configuration[group.key]===option} data-selected={configuration[group.key]===option} onClick={()=>setConfiguration(current=>({...current,[group.key]:option}))}>{String(option).replaceAll('_',' ')}</button>)}</div></div>)}</div>:null}
   {!isSubscription&&!isDigital?<div className={styles.quantityLine}><span>Quantité</span><div className={styles.quantityStepper}><button type="button" aria-label="Réduire la quantité" onClick={()=>setQuantity(value=>Math.max(1,value-1))} disabled={quantity<=1}><Minus/></button><strong>{quantity}</strong><button type="button" aria-label="Augmenter la quantité" onClick={()=>setQuantity(value=>Math.min(upper,value+1))} disabled={quantity>=upper}><Plus/></button></div></div>:null}
   {isSubscription?<button className={styles.addCart} type="button" disabled={!allowed||Boolean(busy)} onClick={subscribe}>{busy==='subscribe'?<LoaderCircle className={styles.spin}/>:<Zap/>} S’abonner</button>:<><button className={styles.addCart} type="button" disabled={!allowed||Boolean(busy)} onClick={()=>void transact('basket')}>{busy==='basket'?<LoaderCircle className={styles.spin}/>:<ShoppingCart/>} {isDigital?'Ajouter la ressource':'Ajouter au panier'}</button><button className={styles.buyNow} type="button" disabled={!allowed||Boolean(busy)} onClick={()=>void transact('checkout')}>{busy==='checkout'?<LoaderCircle className={styles.spin}/>:<Zap/>} {isDigital?'Acheter maintenant':'Acheter maintenant'}</button></>}
   {message?<div className={styles.actionError} role="status">{message}</div>:null}
   <AdviceLink locale={locale} itemSlug={itemSlug}/><div className={styles.secondaryPurchaseActions}><FavoriteButton locale={locale} itemId={itemId} itemSlug={itemSlug}/><ShareButton/></div>
   <div className={styles.purchaseTrust}><span>✓ Paiement sécurisé</span><span>✓ Vérité tarifaire</span><span>✓ Support AngelCare</span></div>
  </aside>
  <div className={styles.mobileStickyPurchase}><strong>{money(unitPrice,currency,locale,priceLabel)}</strong>{isSubscription?<button type="button" disabled={!allowed} onClick={subscribe}><Zap/>S’abonner</button>:<><button type="button" disabled={!allowed} onClick={()=>void transact('basket')}><ShoppingCart/>Ajouter</button><button type="button" disabled={!allowed} onClick={()=>void transact('checkout')}><Zap/>Acheter</button></>}</div>
 </>
}
