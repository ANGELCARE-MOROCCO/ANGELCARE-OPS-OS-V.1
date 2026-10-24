"use client";
import {useEffect,useId,useRef,useState,type CSSProperties} from "react";
import {tr,world,type Locale} from "./catalogue";
import type {Scene} from "./gallery-contract";
import {HomeArtwork} from "./HomeArtwork";
import {HOME_SCENE_INTERVAL,defaultHomeGallery,homeMobileImage,homeSceneCopy,homeWorldImage,insetWorlds,type HomeWorld} from "./home-imagery";
import h from "./home-imagery.module.css";
type Frame={scene:Scene;index:number;serial:number;insets:readonly [HomeWorld,HomeWorld]};
const frameFor=(scene:Scene,index:number,serial:number):Frame=>({scene,index,serial,insets:insetWorlds(index)});
export function HomeHero({scenes,locale,images={}}:{scenes:Scene[];locale:Locale;images?:Record<string,string>}) {
  const deck=scenes.length?scenes:defaultHomeGallery(),signature=JSON.stringify([deck,images]);
  const root=useRef<HTMLDivElement>(null),epoch=useRef(0),cache=useRef(new Map<string,Promise<boolean>>());
  const [frame,setFrame]=useState(()=>({current:frameFor(deck[0],0,0),previous:null as Frame|null}));
  const [visible,setVisible]=useState(false),[foreground,setForeground]=useState(true),[mobile,setMobile]=useState(false);
  const [reduced,setReduced]=useState(true),[hover,setHover]=useState(false),[focus,setFocus]=useState(false),[paused,setPaused]=useState(false),[failed,setFailed]=useState(false);
  const help=useId(),imageFor=(key:HomeWorld)=>images[key]||homeWorldImage(key);
  useEffect(()=>{
    const motion=matchMedia("(prefers-reduced-motion: reduce)"),small=matchMedia("(max-width: 760px)");
    const media=()=>{setReduced(motion.matches||document.documentElement.dataset.kidflixMotion==="no");setMobile(small.matches);};
    const visibility=()=>setForeground(!document.hidden),online=()=>{cache.current.clear();setFailed(false);};
    media();visibility();motion.addEventListener("change",media);small.addEventListener("change",media);
    document.addEventListener("visibilitychange",visibility);window.addEventListener("online",online);
    const preferences=new MutationObserver(media);preferences.observe(document.documentElement,{attributes:true,attributeFilter:["data-kidflix-motion"]});
    const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.1}):null;
    if(observer&&root.current)observer.observe(root.current);else setVisible(true);
    return()=>{motion.removeEventListener("change",media);small.removeEventListener("change",media);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("online",online);preferences.disconnect();observer?.disconnect();};
  },[]);
  useEffect(()=>{++epoch.current;setFailed(false);setFrame({current:frameFor(deck[0],0,0),previous:null});return()=>{++epoch.current;};},[signature]);
  const active=visible&&foreground&&!reduced&&!hover&&!focus&&!paused&&!failed&&deck.length>1;
  useEffect(()=>{
    if(!active)return;
    let cancelled=false;const generation=epoch.current;
    const decode=(src:string):Promise<boolean>=>{
      const known=cache.current.get(src);if(known)return known;
      if(cache.current.size>=64)cache.current.delete(cache.current.keys().next().value!);
      const pending=new Promise<boolean>(resolve=>{
        const image=new Image();let done=false;
        const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timeout);image.onload=null;image.onerror=null;resolve(ok);};
        const timeout=setTimeout(()=>finish(false),4500);
        image.decoding="async";image.onload=()=>finish(image.naturalWidth>0);image.onerror=()=>finish(false);image.src=src;
        if(image.decode)image.decode().then(()=>finish(image.naturalWidth>0),()=>{});
      });
      cache.current.set(src,pending);void pending.then(ok=>{if(!ok&&cache.current.get(src)===pending)cache.current.delete(src);});return pending;
    };
    const ready=async(scene:Scene)=>{const src=mobile&&scene.mobile?scene.mobile:scene.desktop;return await decode(src)||(src!==scene.desktop&&await decode(scene.desktop));};
    const prepare=(index:number)=>({main:ready(deck[index]),insets:Promise.all(insetWorlds(index).map(key=>ready({desktop:imageFor(key),mobile:homeMobileImage(imageFor(key))} as Scene)))});
    const nextIndex=(frame.current.index+1)%deck.length,nextReady=prepare(nextIndex);
    const timer=setTimeout(async()=>{
      for(let step=1;step<deck.length;step++){
        const index=(frame.current.index+step)%deck.length,prepared=index===nextIndex?nextReady:prepare(index);
        const ok=await prepared.main;if(cancelled||generation!==epoch.current)return;if(!ok)continue;
        const insets=await prepared.insets;if(cancelled||generation!==epoch.current)return;
        const next=frameFor(deck[index],index,frame.current.serial+1);
        if(!insets.every(Boolean))next.insets=frame.current.insets;
        setFrame(old=>({current:next,previous:old.current}));return;
      }
      if(!cancelled&&generation===epoch.current)setFailed(true);
    },HOME_SCENE_INTERVAL);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[active,frame.current.serial,signature,mobile]);
  useEffect(()=>{if(!frame.previous)return;const timer=setTimeout(()=>setFrame(old=>({...old,previous:null})),760);return()=>clearTimeout(timer);},[frame.current.serial,Boolean(frame.previous)]);
  function layer(item:Frame,previous=false){
    const lines=homeSceneCopy(item.scene,locale),style={"--home-focal":`${item.scene.focal.x}% ${item.scene.focal.y}%`,"--home-mobile-focal":`${item.scene.mobileFocal.x}% ${item.scene.mobileFocal.y}%`} as CSSProperties;
    return <div key={item.serial} data-hero-layer={previous?"previous":"current"} className={`${h.stage} ${previous?h.previous:item.serial?h.enter:""}`} aria-hidden={previous||undefined} style={style}>
      <div className={h.mainPicture}><HomeArtwork src={item.scene.desktop} mobile={item.scene.mobile||item.scene.desktop} alt={previous?"":item.scene.descriptions[locale]} width={1400} height={933} loading="eager" fetchPriority={item.serial===0?"high":"auto"}/></div>
      {lines.length?<div className={h.artCaption} dir={locale==="ar"?"rtl":"ltr"}>{lines.map((line,i)=><span key={i}>{line}</span>)}</div>:null}
      {item.insets.map((key,i)=><div key={i} className={`${h.inset} ${i?h.insetSecond:h.insetFirst}`} aria-hidden="true"><HomeArtwork src={imageFor(key)} alt="" width={800} height={533} loading="eager"/><span>{tr(world(key)!.short,locale)}</span></div>)}
    </div>;
  }
  return <div ref={root} className={h.heroArtwork} data-home-hero data-motion={active?"playing":"still"} data-scene-id={frame.current.scene.id} dir={locale==="ar"?"rtl":"ltr"} aria-label={tr(["Practical learning materials","Des supports pour apprendre","مواد للتعلم والممارسة"],locale)} aria-describedby={help} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocus(false);}}>
    <div className={h.artBackdrop} aria-hidden="true"/><div className={h.stageViewport} aria-live="off">{frame.previous?layer(frame.previous,true):null}{layer(frame.current)}</div>
    <p id={help} className={h.screenReaderOnly}>{tr(["Images change automatically. Hover or focus to pause. Reduced-motion preferences are respected.","Les images changent automatiquement. Survolez ou placez le focus ici pour arrêter le mouvement. Le réglage de mouvement réduit est respecté.","تتغير الصور تلقائيًا. مرّر المؤشر أو انقل التركيز إلى هنا لإيقاف الحركة. نحترم تفضيل تقليل الحركة."],locale)}</p>
    {!reduced?<button type="button" className={h.motionToggle} onClick={()=>setPaused(value=>!value)}>{tr(paused?["Resume animation","Reprendre l’animation","استئناف الحركة"]:["Keep animation paused","Garder l’animation en pause","إبقاء الحركة متوقفة"],locale)}</button>:null}
  </div>;
}
