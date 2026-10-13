'use client'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {careOrbitLocation} from '@/angelcare-marketplace/navigation-care-orbit/client-controller'
import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import {ArrowRight,BadgeCheck,Check,CheckCircle2,ChevronDown,Heart,Headphones,LoaderCircle,Minus,Plus,Share2,ShoppingBag,ShoppingCart,Sparkles,Star,Zap,Search,ArrowUpRight,SlidersHorizontal,Eye,CheckCheck} from 'lucide-react'
import {formatPrice,printable,validSelection,visibleSection,type Fact,type ProductSection,type ProductView,type Related} from './model'
import {heading,t} from './copy'
import {ProductMedia} from './ProductMedia'
import {ProductRecommendations} from './ProductRecommendations'
import {ProductAdvice} from './ProductAdvice'
import {ProductIllustration,ProductIndicators} from './ProductIndicators'
import {indicatorKind} from './indicator-model'
import {productRequest,receiveBasket} from './transport'
import s from './product-commerce.module.css'

const NAV_ROLES:ProductSection[]=['description','specifications','contents','usage','fulfillment','conditions','reviews','faq','alternatives']
const SECTION_ICON:Partial<Record<ProductSection,string>>={description:'01',specifications:'02',contents:'03',usage:'04',fulfillment:'05',conditions:'06',reviews:'07',faq:'08',bundle:'09',accessories:'10',alternatives:'11'}
const COLOURS:Record<string,string>={black:'#17243a',noir:'#17243a',white:'#fff',blanc:'#fff',pink:'#f4569c',rose:'#f4569c',blue:'#2a9cdd',bleu:'#2a9cdd',green:'#30b58c',vert:'#30b58c',red:'#ef545c',rouge:'#ef545c',yellow:'#ffd054',jaune:'#ffd054',beige:'#d7c2a4',brown:'#927456',marron:'#927456',purple:'#9b73e1',violet:'#9b73e1',grey:'#acb5c1',gray:'#acb5c1',gris:'#acb5c1'}
function colourValue(key:string,value:string){if(!/^(?:colou?r|couleur)(?:_|$)/i.test(key))return null;return COLOURS[value.toLowerCase().trim()]||(/^#[0-9a-f]{6}$/i.test(value)?value:null)}
function FactText({value}:{value:string}){const parts=value.split(/\s+·\s+/).filter(Boolean);return parts.length>2&&parts.length<25?<><p>{parts[0]}</p><div className={s.contentChips}>{parts.slice(1).map((part,i)=><span key={i}><Check size={13}/>{part}</span>)}</div></>:<p>{value}</p>}
function PriceLabel({view}:{view:ProductView}){return <span className={s.priceLabel}>{view.priceMode==='starting_from'&&view.price!==null?<><small>{t(view.locale,'from')}</small><b>{formatPrice({...view,priceMode:'fixed'})}</b></>:<b>{formatPrice(view)}</b>}</span>}
function ContentList({rows}:{rows:Fact[]}){return <ul className={s.contentList}>{rows.map((f,i)=><li key={f.key+'-'+i}><span className={s.contentNumber}>{String(i+1).padStart(2,'0')}</span><div>{f.label&&f.label!==f.value?<strong>{f.label}</strong>:null}<FactText value={f.value}/></div></li>)}</ul>}
function FactList({rows}:{rows:Fact[]}){return <dl className={s.factList}>{rows.map((f,i)=><div key={f.key+'-'+i}><dt><ProductIllustration kind={indicatorKind(f.key)}/><span>{f.label}</span></dt><dd>{f.value}</dd></div>)}</dl>}
function SectionBadge({role}:{role:ProductSection}){return <span className={s.sectionBadge} aria-hidden="true">{SECTION_ICON[role]||'AC'}</span>}

export function ProductCommerceExperience({view,previewOnly=false}:{view:ProductView;previewOnly?:boolean}) {
  const l=view.locale,uid=useId().replaceAll(':',''),prefix='pc-'+uid
  const lock=useRef(false),saveLock=useRef(false),saveRevision=useRef(0),root=useRef<HTMLElement>(null)
  const [selection,setSelection]=useState<Record<string,string>>({}),[quantity,setQuantity]=useState(1)
  const [busy,setBusy]=useState<'basket'|'checkout'|null>(null),[message,setMessage]=useState(''),[basketId,setBasketId]=useState('')
  const [saved,setSaved]=useState(false),[saveBusy,setSaveBusy]=useState(false),[saveMessage,setSaveMessage]=useState('')
  const [advice,setAdvice]=useState(false),[query,setQuery]=useState(''),[footerVisible,setFooterVisible]=useState(false),[activeSection,setActiveSection]=useState<ProductSection>('description')
  const roles=view.sections.filter(role=>visibleSection(view,role)),nav=NAV_ROLES.filter(role=>roles.includes(role))
  const selectedValid=validSelection(view,selection),max=view.capacity===null?99:Math.min(99,Math.max(0,Math.floor(view.capacity))),price=formatPrice(view)
  const signature=view.groups.map(g=>g.key+':'+g.values.join(',')).join('|'),sectionSignature=roles.join('|')
  const selectedText=Object.entries(selection).filter(([,v])=>v).map(([key,value])=>(view.groups.find(g=>g.key===key)?.label||key)+': '+printable(value,l)).join(' · ')

  useEffect(()=>{
    const sole=Object.fromEntries(view.groups.filter(g=>g.values.length===1).map(g=>[g.key,g.values[0]]))
    setSelection(sole);setQuantity(1);setBasketId('');setMessage('');setAdvice(false);setSaved(false);setQuery('');setSaveMessage('');setActiveSection('description')
    if(previewOnly)return
    try{const stored=JSON.parse(sessionStorage.getItem('ac-product-draft:'+l+':'+view.slug)||'{}') as {selection?:Record<string,string>;quantity?:number}
      const next=Object.fromEntries(view.groups.flatMap(g=>typeof stored.selection?.[g.key]==='string'&&g.values.includes(stored.selection[g.key])?[[g.key,stored.selection[g.key]]]:[]))
      setSelection({...sole,...next});if(Number.isFinite(stored.quantity)&&Number(stored.quantity)>0)setQuantity(Math.min(Math.max(1,max),Math.floor(Number(stored.quantity))))
    }catch{}
  },[view.id,l,previewOnly,signature])
  useEffect(()=>{
    if(previewOnly)return
    const controller=new AbortController(),revision=saveRevision.current
    fetch('/api/angelcare-marketplace/homepage/engagement',{signal:controller.signal}).then(r=>r.ok?r.json():null).then(p=>{if(!controller.signal.aborted&&revision===saveRevision.current&&Array.isArray(p?.data))setSaved(p.data.some((r:{catalog_item_id?:string;selection_type?:string})=>r.catalog_item_id===view.id&&r.selection_type==='saved'))}).catch(()=>{})
    return()=>controller.abort()
  },[view.id,previewOnly])
  useEffect(()=>{
    const footer=document.querySelector('footer[data-marketplace]')||Array.from(document.querySelectorAll('footer')).find(f=>!f.closest('[data-ac-product-commerce]'))
    if(!footer||typeof IntersectionObserver==='undefined')return
    const o=new IntersectionObserver(entries=>setFooterVisible(entries.some(e=>e.isIntersecting)));o.observe(footer);return()=>o.disconnect()
  },[view.id])
  useEffect(()=>{
    if(typeof IntersectionObserver==='undefined'||!root.current)return
    const parts=root.current.querySelectorAll<HTMLElement>('section[data-product-role][id]')
    const seen=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){(e.target as HTMLElement).dataset.entered='true';seen.unobserve(e.target)}}),{threshold:.08})
    const anchors=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible.length)setActiveSection((visible[0].target as HTMLElement).dataset.productRole as ProductSection)},{rootMargin:'-180px 0px -55% 0px',threshold:0})
    parts.forEach(p=>{seen.observe(p);anchors.observe(p)})
    const hero=root.current.querySelector<HTMLElement>('[data-product-role="opening"]')
    const motion=new IntersectionObserver(entries=>entries.forEach(e=>{(e.target as HTMLElement).dataset.motion=e.isIntersecting?'on':'off'}))
    if(hero)motion.observe(hero)
    return()=>{seen.disconnect();anchors.disconnect();motion.disconnect()}
  },[view.id,sectionSignature])

  function store(next:Record<string,string>,q:number){if(!previewOnly)try{sessionStorage.setItem('ac-product-draft:'+l+':'+view.slug,JSON.stringify({selection:next,quantity:q}))}catch{}}
  function change(key:string,value:string){if(busy)return;const next={...selection,[key]:value};setSelection(next);setBasketId('');setMessage('');store(next,quantity)}
  function changeQuantity(n:number){if(busy)return;const q=Math.min(Math.max(1,max),Math.max(1,n));setQuantity(q);setBasketId('');setMessage('');store(selection,q)}
  async function purchase(mode:'basket'|'checkout'){
    if(lock.current||!view.canBuy)return
    if(previewOnly){setMessage(t(l,'previewAction'));return}
    if(!selectedValid){setMessage(t(l,'required'));return}
    lock.current=true;setBusy(mode);setMessage('')
    try{const id=await receiveBasket({slug:view.slug,locale:l,quantity,configuration:selection});setBasketId(id);if(mode==='checkout')careOrbitLocation.assign(`/angelcare-marketplace/${l}/checkout?basket=${encodeURIComponent(id)}&kind=transactional`)}
    catch{setMessage(t(l,'error'))}finally{lock.current=false;setBusy(null)}
  }
  async function toggleSaved(){
    if(saveLock.current||previewOnly)return
    saveLock.current=true;saveRevision.current++;setSaveBusy(true);setSaveMessage('')
    try{const receipt=await productRequest<{recorded:boolean}>('/api/angelcare-marketplace/homepage/engagement',{method:'POST',body:JSON.stringify({event_name:saved?'product.unsaved':'product.saved',locale:l,catalog_item_id:view.id,selection_type:'saved',active:!saved,route:window.location.pathname,event_data:{itemSlug:view.slug}})});if(receipt.recorded!==true)throw Error('NO_RECEIPT');setSaved(!saved)}
    catch{setSaveMessage(t(l,'error'))}finally{saveLock.current=false;setSaveBusy(false)}
  }
  async function share(){try{if(navigator.share)await navigator.share({title:view.name,url:window.location.href});else{await navigator.clipboard.writeText(window.location.href);setSaveMessage(t(l,'copied'))}}catch(e){if(e instanceof Error&&e.name!=='AbortError')setSaveMessage(t(l,'error'))}}
  function jump(){const element=document.getElementById(prefix+'-purchase');element?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});element?.focus({preventScroll:true})}
  const title=(role:ProductSection)=>view.titles[role]||heading(l,role)
  const primaryMedia=view.media.find(m=>m.type==='image'||m.type.startsWith('image/'))

  function body(role:ProductSection):ReactNode {
    if(role==='opening')return <>
      <nav className={s.breadcrumb} aria-label={t(l,'marketplace')}><Link href={`/angelcare-marketplace/${l}/marketplace`}>{t(l,'marketplace')}</Link><span>/</span><span>{view.name}</span></nav>
      <div className={s.hero}>
        <div className={s.heroAura} aria-hidden="true"><i/><i/><i/></div>
        <ProductMedia media={view.media} name={view.name} locale={l}/>
        <div className={s.identity}>
          <div className={s.identityTop}><span className={s.eyebrow}>ANGELCARE · {t(l,'productUniverse')}</span>{view.reference?<small>{view.reference}</small>:null}</div>
          <h1>{view.name}</h1>{view.promise?<h2>{view.promise}</h2>:null}{view.lead?<p className={s.lead}>{view.lead}</p>:null}
          {view.rating!==null&&view.reviewCount?<a className={s.ratingInline} href={'#'+prefix+'-reviews'}><Star fill="currentColor" size={18}/>{view.rating.toFixed(1)} <span>({view.reviewCount} {t(l,'reviewsCount')})</span></a>:null}
          {view.benefits.length?<ul className={s.benefits}>{view.benefits.slice(0,4).map((b,i)=><li key={i}><CheckCircle2 size={19}/><span>{b}</span></li>)}</ul>:null}
          {view.facts.length?<ProductIndicators facts={view.facts}/>:null}
          {roles.includes('description')?<a className={s.heroExplore} href={'#'+prefix+'-description'}><span><Eye size={17}/>{t(l,'exploreDetails')}</span><ArrowRight size={18}/></a>:null}
        </div>
        <aside className={s.purchase} id={prefix+'-purchase'} tabIndex={-1} aria-label={t(l,'yourChoice')} aria-busy={!!busy}>
          <div className={s.purchaseHeading}><span>{t(l,'yourChoice')}</span><ShoppingBag size={20}/></div>
          <strong className={s.price}><PriceLabel view={view}/></strong>
          <span className={s.availability} data-pending={!view.canBuy}>{view.canBuy?<CheckCircle2 size={15}/>:null}{t(l,view.canBuy?'available':view.price===null?'pendingPrice':'unavailable')}</span>
          {view.groups.map((g,i)=><fieldset className={s.variants} key={g.key} disabled={!!busy}><legend><span className={s.optionStep}>{i+1}</span>{g.label}{selection[g.key]?<Check size={14}/>:null}</legend><div>{g.values.map(value=>{const colour=colourValue(g.key,value);return <button key={value} type="button" aria-pressed={selection[g.key]===value} onClick={()=>change(g.key,value)}>{colour?<i className={s.colourSwatch} style={{backgroundColor:colour}} aria-hidden="true"/>:null}<span>{printable(value,l)}</span>{selection[g.key]===value?<Check size={13}/>:null}</button>})}</div></fieldset>)}
          <div className={s.quantity}><span>{t(l,'quantity')}</span><div><button type="button" aria-label={t(l,'quantity')+' −'} disabled={!!busy||quantity<=1} onClick={()=>changeQuantity(quantity-1)}><Minus size={15}/></button><output>{quantity}</output><button type="button" aria-label={t(l,'quantity')+' +'} disabled={!!busy||quantity>=max} onClick={()=>changeQuantity(quantity+1)}><Plus size={15}/></button></div></div>
          {selectedText?<div className={s.selectionSummary}><SlidersHorizontal size={16}/><span>{selectedText}</span>{selectedValid?<CheckCheck size={16}/>:null}</div>:null}
          <button className={s.primary} type="button" disabled={!view.canBuy||!!busy} onClick={()=>void purchase('basket')}>{busy==='basket'?<LoaderCircle className={s.spin}/>:<ShoppingCart size={19}/>}<span>{t(l,'add')}</span><ArrowRight size={17}/></button>
          <button className={s.buyNow} type="button" disabled={!view.canBuy||!!busy} onClick={()=>void purchase('checkout')}><Zap size={18}/>{busy==='checkout'?t(l,'busy'):t(l,'buy')}</button>
          <button className={s.adviceButton} type="button" onClick={()=>setAdvice(true)}><Headphones size={18}/>{t(l,'advice')}<ArrowUpRight size={17}/></button>
          <div className={s.utility}><button type="button" disabled={saveBusy||previewOnly} aria-pressed={saved} onClick={()=>void toggleSaved()}><Heart fill={saved?'currentColor':'none'} size={16}/>{t(l,saved?'saved':'save')}</button><button type="button" onClick={()=>void share()} aria-label={t(l,'share')}><Share2 size={17}/></button></div>
          {message?<p className={s.error} role="alert">{message}</p>:null}{saveMessage?<p className={s.utilityMessage} role="status">{saveMessage}</p>:null}
          {basketId?<div className={s.basketReceipt} role="status"><CheckCircle2 size={17}/><strong>{t(l,'added')}</strong><Link href={`/angelcare-marketplace/${l}/basket`}>{t(l,'viewBasket')}<ArrowRight size={16}/></Link></div>:null}
          <small className={s.priceNote}>{t(l,'priceNote')}</small>
        </aside>
      </div>
    </>
    if(role==='assurance')return <div className={s.assurance}>{(view.proof.length?view.proof:view.benefits.slice(0,4).map((b,i)=>({key:'benefit'+i,label:b,value:b}))).slice(0,5).map((f,i)=><div key={f.key}><span className={s.assuranceMark}>{view.proof.length?<BadgeCheck/>:<CheckCircle2/>}</span><span>{f.value}</span><i aria-hidden="true">{String(i+1).padStart(2,'0')}</i></div>)}</div>
    if(role==='context')return <div className={s.contextBand}><div><small className={s.eyebrow}>ANGELCARE · {t(l,'details')}</small><h2>{view.headline||title(role)}</h2>{view.decisionSupport?<p>{view.decisionSupport}</p>:null}<div className={s.contextBenefits}>{view.benefits.slice(0,3).map((b,i)=><span key={i}><Sparkles size={18}/>{b}</span>)}</div></div><div className={s.contextMedia}><img src={view.slots.context!.url} alt={view.slots.context!.alt} loading="lazy"/></div></div>
    if(role==='description')return <div className={s.descriptionLayout}><div>{view.description.split(/\n\s*\n/).filter(Boolean).map((p,i)=><p key={i} className={s.descriptionText}>{p}</p>)}</div>{view.slots.description?<div className={s.descriptionMedia}><img src={view.slots.description.url} alt={view.slots.description.alt} loading="lazy"/>{view.slots.detail?<img className={s.detailImage} src={view.slots.detail.url} alt={view.slots.detail.alt} loading="lazy"/>:null}</div>:view.slots.detail?<div className={s.descriptionMedia}><img src={view.slots.detail.url} alt={view.slots.detail.alt} loading="lazy"/></div>:null}</div>
    if(role==='specifications'){
      const filtered=view.specs.filter(f=>(f.label+' '+f.value).toLocaleLowerCase(l).includes(query.toLocaleLowerCase(l)))
      return <><label className={s.specSearch}><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t(l,'filter')} aria-label={t(l,'filter')}/><span>{filtered.length}/{view.specs.length}</span></label>{filtered.length?<FactList rows={filtered}/>:<p>{t(l,'noMatch')}</p>}</>
    }
    if(role==='contents')return <><ContentList rows={view.contents}/>{view.slots.contents?<div className={s.contentsImageFrame}><img className={s.contentsImage} src={view.slots.contents.url} alt={view.slots.contents.alt} loading="lazy"/></div>:null}</>
    if(role==='usage')return <ContentList rows={view.usage}/>
    if(role==='fulfillment')return <><div className={s.fulfillment}>{view.fulfillment.map(f=><div key={f.key}><ProductIllustration kind="delivery"/><div><h3>{f.label}</h3><p>{f.value}</p></div></div>)}</div>{view.afterPurchase?<div className={s.afterPurchase}><ProductIllustration kind="contents"/><div><strong>{t(l,'afterPurchase')}</strong><p>{view.afterPurchase}</p></div></div>:null}</>
    if(role==='conditions')return <div className={s.accordions}>{view.conditions.map((f,i)=><details key={f.key+i}><summary><span><CheckCircle2 size={17}/>{f.label}</span><ChevronDown size={17}/></summary><p>{f.value}</p></details>)}{view.proof.map(f=><div className={s.proof} key={f.key}><BadgeCheck/>{f.value}</div>)}</div>
    if(role==='reviews')return view.rating!==null&&view.reviewCount?<div className={s.reviewSummary}><span className={s.ratingHalo} aria-hidden="true"/><strong>{view.rating.toFixed(1)}<small>/5</small></strong><div aria-label={view.rating.toFixed(1)+' / 5'} className={s.stars}>{[1,2,3,4,5].map(n=><Star key={n} fill={n<=Math.round(view.rating!)?'currentColor':'none'} size={25}/>)}</div><p>{view.reviewCount} {t(l,'reviewsCount')}</p></div>:<div className={s.reviewEmpty}><div className={s.emptyReviewArt} aria-hidden="true"><Star/><Star/><Star/></div><strong>{t(l,'emptyReviews')}</strong><p>{t(l,'reviewLead')}</p><button className={s.outline} type="button" onClick={()=>setAdvice(true)}>{t(l,'contact')}<ArrowUpRight size={16}/></button></div>
    if(role==='faq')return <div className={s.accordions}>{view.faq.map((f,i)=><details key={f.key+i} open={i===0}><summary><span><b>{String(i+1).padStart(2,'0')}</b>{f.label}</span><ChevronDown size={17}/></summary><p>{f.value}</p></details>)}</div>
    if(role==='bundle')return <><div className={s.bundle}><div className={s.bundleCurrent}>{primaryMedia?<img src={primaryMedia.url} alt={view.name} loading="lazy"/>:null}<strong>{view.name}</strong><span>{price}</span></div><Plus className={s.bundlePlus}/>{view.bundles.slice(0,2).map(r=><RelatedCard key={r.id} row={r} view={view}/>)}</div><p className={s.subtle}>{t(l,'bundleHint')}</p></>
    if(role==='accessories'||role==='alternatives')return <div className={s.relatedRail}>{(role==='accessories'?view.accessories:view.alternatives).slice(0,6).map(r=><RelatedCard key={r.id} row={r} view={view}/>)}</div>
    if(role==='assistance')return <div className={s.help}><div className={s.helpPortrait}><img src="/angelcare-marketplace/atomic-neutral-r4/help-product.webp" alt="" loading="lazy"/><span className={s.helpPortraitMark} aria-hidden="true"><Headphones/></span></div><div className={s.helpBody}><small className={s.eyebrow}>ANGELCARE · {t(l,'personalAdvice')}</small><h2>{t(l,'helpTitle')}</h2><strong>{t(l,'helpLead')}</strong><p>{t(l,'helpCopy')}</p><button className={s.primary} type="button" onClick={()=>setAdvice(true)}>{t(l,'contact')}<ArrowRight size={18}/></button></div><div className={s.helpFacts}><span><Headphones/>{t(l,'personalAdvice')}</span><span><CheckCircle2/>{t(l,'questions')}</span><span><Heart/>{t(l,'support')}</span><img src="/brand/angelcare-pearl-rim-colour-r1.png" alt="" aria-hidden="true"/></div></div>
    if(role==='recap')return <div className={s.recap}>{primaryMedia?<img src={primaryMedia.url} alt="" loading="lazy"/>:null}<div><small>{t(l,'yourChoice')}</small><strong>{view.name}</strong>{selectedText?<span>{selectedText}</span>:null}</div><div className={s.recapPrice}><PriceLabel view={view}/></div><button type="button" className={s.primary} onClick={jump}>{t(l,'choose')}<ArrowRight size={18}/></button></div>
    return null
  }

  const children:ReactNode[]=[];let navAdded=false
  for(let i=0;i<roles.length;i++){
    const role=roles[i]
    if(role==='recommended'){children.push(<ProductRecommendations key={role} slug={view.slug} locale={l} initial={view.recommended} previewOnly={previewOnly} title={title(role)}/>);continue}
    if(!navAdded&&!['opening','assurance','context'].includes(role)&&nav.length){children.push(<nav key="product-nav" className={s.sectionNav} aria-label={t(l,'details')}>{nav.map(r=><a key={r} href={'#'+prefix+'-'+r} aria-current={activeSection===r?'location':undefined} onClick={()=>setActiveSection(r)}>{title(r)}{activeSection===r?<i aria-hidden="true"/>:null}</a>)}</nav>);navAdded=true}
    if(['opening','assurance','context','assistance','recap'].includes(role)){children.push(<div key={role} data-product-role={role}>{body(role)}</div>);continue}
    const run:ProductSection[]=[role]
    while(i+1<roles.length&&run.length<2){const next=roles[i+1];if(role==='specifications'&&next!=='contents')break;if(role==='usage'&&next!=='fulfillment')break;if(role==='fulfillment'&&next!=='conditions')break;if(role==='reviews'&&next!=='faq')break;if(!['specifications','usage','fulfillment','reviews'].includes(role))break;run.push(next);i++}
    children.push(<div className={run.length>1?s.sectionRow:undefined} data-columns={run.length} key={role}>{run.map(r=><section className={s.section} key={r} id={prefix+'-'+r} data-product-role={r}><header><div><SectionBadge role={r}/><h2>{title(r)}</h2></div>{r==='specifications'?<span className={s.sectionCount}>{view.specs.length}</span>:null}</header>{body(r)}</section>)}</div>)
  }
  return <main ref={root} className={s.experience} lang={l} dir={l==='ar'?'rtl':'ltr'} data-ac-product-commerce="3" data-offer-id={view.id}><div className={s.ambient} aria-hidden="true"/>{previewOnly?<p className={s.previewFlag}>{t(l,'preview')}</p>:null}<div className={s.container}>{children}</div>{!footerVisible&&roles.includes('opening')?<div className={s.mobileDock}><div><strong><PriceLabel view={view}/></strong><small>{selectedText||view.name}</small></div><button className={s.primary} type="button" onClick={jump}>{t(l,'choose')}<ArrowRight size={17}/></button></div>:null}{advice?<ProductAdvice view={view} selection={selection} previewOnly={previewOnly} onClose={()=>setAdvice(false)}/>:null}</main>
}

function RelatedCard({row,view}:{row:Related;view:ProductView}){
  const href=`/angelcare-marketplace/${view.locale}/marketplace/item/${encodeURIComponent(row.slug)}`
  return <article className={s.relatedCard}><Link href={href}><div className={s.relatedStage}>{row.image?<img src={row.image} alt={row.name} loading="lazy"/>:<div className={s.noRelatedMedia}><ShoppingBag/></div>}<span className={s.relatedArrow} aria-hidden="true"><ArrowUpRight size={20}/></span></div><h3>{row.name}</h3></Link>{row.price!==null?<strong>{formatPrice({price:row.price,currency:row.currency,locale:view.locale,priceMode:'fixed',priceLabel:''})}</strong>:null}<Link className={s.outline} href={href}>{t(view.locale,'configure')}<ArrowRight size={16}/></Link></article>
}
