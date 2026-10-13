'use client'
import {useEffect,useRef,useState} from 'react'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {ArrowRight,ChevronLeft,ChevronRight,LoaderCircle,ShoppingBag} from 'lucide-react'
import {formatPrice,publicUrl,type Related,type Locale} from './model'
import {t} from './copy'
import {productRequest} from './transport'
import s from './product-commerce.module.css'
const EMPTY:Related[]=[]
export function ProductRecommendations({slug,locale,initial=EMPTY,previewOnly=false,title}:{slug:string;locale:Locale;initial?:Related[];previewOnly?:boolean;title:string}){
 const [items,setItems]=useState(initial),[state,setState]=useState<'loading'|'ready'|'error'>(previewOnly?'ready':'loading'),[retry,setRetry]=useState(0),rail=useRef<HTMLDivElement>(null),section=useRef<HTMLElement>(null)
 useEffect(()=>{setItems(initial);if(previewOnly){setState('ready');return}let cancelled=false,started=false;const controller=new AbortController();let observer:IntersectionObserver|undefined
  async function load(){if(started)return;started=true;setState('loading');try{const response=await productRequest<{items:Related[]}>('/api/angelcare-marketplace/public/products/'+encodeURIComponent(slug)+'/recommendations?locale='+locale,{signal:controller.signal});if(!Array.isArray(response.items))throw Error('INVALID_RESPONSE');if(!cancelled){const safe=response.items.filter(r=>r&&typeof r.id==='string'&&typeof r.slug==='string'&&!!r.slug&&typeof r.name==='string'&&!!r.name).map(r=>({...r,image:publicUrl(r.image)}));setItems([...new Map(safe.map(r=>[r.id,r])).values()].slice(0,8));setState('ready')}}catch{if(!cancelled)setState('error')}}
  if(typeof IntersectionObserver!=='undefined'&&section.current){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){void load();observer?.disconnect()}},{rootMargin:'650px'});observer.observe(section.current)}else void load()
  return()=>{cancelled=true;controller.abort();observer?.disconnect()}
 },[slug,locale,retry,previewOnly])
 function move(direction:number){rail.current?.scrollBy({left:direction*(locale==='ar'?-1:1)*(rail.current.clientWidth*.75),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
 const browse='/angelcare-marketplace/'+locale+'/marketplace/search?kind=product'
 return <section ref={section} className={s.recommendations} data-product-role="recommended" data-recommend-state={state} aria-busy={state==='loading'} aria-label={title}><header><div><small>ANGELCARE · {t(locale,'productUniverse')}</small><h2>{title}</h2></div><div className={s.recommendActions}><Link href={browse}>{t(locale,'browseProducts')}</Link>{items.length>2?<><button type="button" onClick={()=>move(-1)} aria-label={t(locale,'previousProducts')}><ChevronLeft/></button><button type="button" onClick={()=>move(1)} aria-label={t(locale,'nextProducts')}><ChevronRight/></button></>:null}</div></header>
  {items.length?<div className={s.recommendGrid} ref={rail}>{items.map(r=>{const href='/angelcare-marketplace/'+locale+'/marketplace/item/'+encodeURIComponent(r.slug);return <article key={r.id} className={s.recommendCard}><Link href={href}><div className={s.recommendMedia}>{r.image?<img src={r.image} alt={r.name} loading="lazy"/>:<ShoppingBag aria-hidden="true"/>}</div><h3>{r.name}</h3></Link><strong>{formatPrice({price:r.price,currency:r.currency,locale,priceMode:r.priceMode||'fixed',priceLabel:''})}</strong><Link className={s.outline} href={href}>{t(locale,'configure')}<ArrowRight size={15}/></Link></article>})}</div>:<div className={s.recommendState} role="status"><div>{state==='loading'?<LoaderCircle className={s.spin}/>:<ShoppingBag/>}<span>{t(locale,state==='loading'?'recommendLoading':state==='error'?'recommendError':'recommendEmpty')}</span></div>{state==='error'?<button className={s.outline} type="button" onClick={()=>setRetry(n=>n+1)}>{t(locale,'retry')}</button>:<Link className={s.outline} href={browse}>{t(locale,'browseProducts')}</Link>}</div>}
  {state==='error'&&items.length?<div className={s.recommendRefresh} role="status"><span>{t(locale,'recommendError')}</span><button type="button" onClick={()=>setRetry(n=>n+1)}>{t(locale,'retry')}</button></div>:null}
 </section>
}
