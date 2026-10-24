'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {art,say,UI,type PublisherLocale} from './publisher-content';
import s from './publisher.module.css';

export type PublisherScene={id:string;desktop:string;mobile:string;descriptions:Record<PublisherLocale,string>;focal:{x:number;y:number};mobileFocal:{x:number;y:number}};
const PAUSE_KEY='kidflix.publisher.pause.v1';

/** A storefront-only gallery. Resource previews and the homepage are independent. */
export function PublisherGallery({family,locale,scenes}:{family:string;locale:PublisherLocale;scenes:PublisherScene[]}){
 const host=useRef<HTMLElement>(null),cache=useRef(new Map<string,Promise<boolean>>());
 const [active,setActive]=useState(0),[previous,setPrevious]=useState<PublisherScene|null>(null),[paused,setPaused]=useState(true),[ready,setReady]=useState(false),[over,setOver]=useState(false),[focused,setFocused]=useState(false),[visible,setVisible]=useState(true),[inView,setInView]=useState(false),[reduced,setReduced]=useState(true),[mobile,setMobile]=useState(false),[failed,setFailed]=useState(false);
 const [unavailable,setUnavailable]=useState(false);
 const signature=JSON.stringify(scenes),deck=scenes.length?scenes:[];
 const scene=deck[active]||deck[0],source=(v:PublisherScene)=>mobile&&v.mobile?v.mobile:v.desktop;
 useEffect(()=>{
  const mq=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width: 767px)');
  const sync=()=>{setReduced(mq.matches||document.documentElement.dataset.kidflixMotion==='no');setMobile(small.matches);};
  const hidden=()=>setVisible(!document.hidden);
  const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-kidflix-motion']});
  const intersection=new IntersectionObserver(entries=>setInView(entries[0]?.isIntersecting===true),{threshold:.08});if(host.current)intersection.observe(host.current);
  const storage=(event:StorageEvent)=>{if(event.key===PAUSE_KEY)setPaused(event.newValue==='1');};
  try{setPaused(localStorage.getItem(PAUSE_KEY)==='1');}catch{setPaused(false);}
  sync();hidden();setReady(true);mq.addEventListener('change',sync);small.addEventListener('change',sync);document.addEventListener('visibilitychange',hidden);window.addEventListener('storage',storage);
  return()=>{observer.disconnect();intersection.disconnect();mq.removeEventListener('change',sync);small.removeEventListener('change',sync);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('storage',storage);};
 },[]);
 useEffect(()=>{setActive(0);setPrevious(null);setFailed(false);cache.current.clear();},[signature]);
 useEffect(()=>{setFailed(false);setUnavailable(false);},[active,signature,mobile]);
 useEffect(()=>{if(!previous)return;const timer=setTimeout(()=>setPrevious(null),850);return()=>clearTimeout(timer);},[previous]);
 useEffect(()=>{
  if(!ready||paused||over||focused||!visible||!inView||reduced||deck.length<2)return;
  let cancelled=false,timer:ReturnType<typeof setTimeout>|undefined;
  const current=cache.current;
  function load(url:string){
   const existing=current.get(url);if(existing)return existing;
   // Bound both the cache and each request. A failed image never blocks the deck forever.
   while(current.size>=3)current.delete(current.keys().next().value!);
   const promise=new Promise<boolean>(resolve=>{
    const img=new Image();let done=false;
    const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timeout);img.onload=null;img.onerror=null;if(!ok)img.src='';resolve(ok);};
    const timeout=setTimeout(()=>finish(false),6500);
    img.onload=()=>{if(img.decode)img.decode().then(()=>finish(true),()=>finish(img.naturalWidth>0));else finish(true);};img.onerror=()=>finish(false);img.src=url;
   });current.set(url,promise);return promise;
  }
  async function advance(){
   for(let offset=1;offset<deck.length;offset++){
    const index=(active+offset)%deck.length,url=source(deck[index]);
    if(await load(url)){if(!cancelled){setPrevious(unavailable||failed?null:deck[active]||null);setFailed(false);setUnavailable(false);setActive(index);}return;}
    if(cancelled)return;
   }
   // Leave the current image visible, then retry later; no busy loop and no blank frame.
   if(!cancelled){current.clear();timer=setTimeout(advance,15000);}
  }
  const next=deck[(active+1)%deck.length];void load(source(next));timer=setTimeout(advance,3000);
  return()=>{cancelled=true;if(timer)clearTimeout(timer);};
 },[active,signature,ready,paused,over,focused,visible,inView,reduced,mobile,failed,unavailable]);
 function toggle(){setPaused(value=>{const next=!value;try{localStorage.setItem(PAUSE_KEY,next?'1':'0');}catch{}return next;});}
 const fallback=art(family,'hero-01',mobile),position=scene?(mobile?scene.mobileFocal:scene.focal):{x:50,y:50};
 return <figure ref={host} className={s.gallery} onMouseEnter={()=>setOver(true)} onMouseLeave={()=>setOver(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(false);}} aria-label={say(UI.editorial,locale)} data-gallery-paused={paused||reduced}>
  {previous?<picture className={s.galleryPrevious} aria-hidden="true" style={{objectPosition:`${(mobile?previous.mobileFocal:previous.focal).x}% ${(mobile?previous.mobileFocal:previous.focal).y}%`}}>{previous.mobile?<source media="(max-width:767px)" srcSet={previous.mobile}/>:null}<img src={previous.desktop} alt="" width={1536} height={1024}/></picture>:null}
  {scene&&!unavailable?<picture key={source(scene)} className={s.galleryPicture} style={{'--focal':`${position.x}% ${position.y}%`,'--mobile-focal':`${scene.mobileFocal.x}% ${scene.mobileFocal.y}%`} as CSSProperties}>
   {!failed&&scene.mobile?<source media="(max-width:767px)" srcSet={scene.mobile}/>:null}
   <img src={failed?fallback:scene.desktop} alt={scene.descriptions[locale]} width={1536} height={1024} fetchPriority="high" decoding="async" onError={event=>{if(failed||event.currentTarget.currentSrc===new URL(fallback,document.baseURI).href)setUnavailable(true);else setFailed(true);}}/>
  </picture>:<span role="status" className={s.imagePlaceholder}>{say(UI.imageUnavailable,locale)}</span>}
  {deck.length>1?<button type="button" className={s.motionButton} onClick={toggle} disabled={reduced} aria-label={say(reduced?UI.motionOff:paused?UI.resume:UI.pause,locale)} title={say(reduced?UI.motionOff:paused?UI.resume:UI.pause,locale)} aria-pressed={paused||reduced}>{paused||reduced?<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 7 5-7 5Z" fill="currentColor"/></svg>:<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor"/></svg>}</button>:null}
 </figure>;
}
