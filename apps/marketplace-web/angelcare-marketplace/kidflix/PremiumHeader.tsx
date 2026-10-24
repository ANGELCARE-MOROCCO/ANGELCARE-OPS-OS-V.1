"use client";
import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import {useEffect,useId,useRef,useState,type CSSProperties,type ReactNode,type MouseEvent} from "react";
import {INTENTS,WORLDS,path,tr,type Locale} from "./catalogue";
import {copy} from "./copy";
import {I} from "./Icons";
import {useGuest} from "./continuity";
import {EditionLanguage} from "./journey/Discovery";
import {j} from "./journey/copy";
import h from "./premium-header.module.css";

const palette=[
  ["#2356a2","#edf4ff"],["#9c3764","#fff0f5"],["#6545a4","#f2edff"],
  ["#176783","#eaf8ff"],["#9c4b20","#fff2e7"],["#236b51","#ebf8f0"],
  ["#285fa4","#eef5ff"],["#795018","#fff6df"],["#35496c","#eef2f8"]
];
const colorStyle=(index:number)=>({"--nav-ink":palette[index][0],"--nav-tint":palette[index][1]}) as CSSProperties;
export function PremiumHeader({locale,search}:{locale:Locale;search:ReactNode}) {
  const pathname=usePathname(),query=useSearchParams(),route=pathname+"?"+query.toString(),guest=useGuest();
  const root=useRef<HTMLElement>(null),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null);
  const track=useRef<HTMLElement>(null);
  const [edges,setEdges]=useState({start:false,end:false});
  const [open,setOpen]=useState(false),[filter,setFilter]=useState("");
  const dialogId=useId(),titleId=useId(),filterId=useId();
  const currentWorld=WORLDS.find(w=>pathname===path(locale,"/explore/"+w.key));
  const results=WORLDS.filter(w=>tr(w.title,locale).toLocaleLowerCase(locale).includes(filter.trim().toLocaleLowerCase(locale))||tr(w.short,locale).toLocaleLowerCase(locale).includes(filter.trim().toLocaleLowerCase(locale)));
  useEffect(()=>{setOpen(false);setFilter("");},[route]);
  useEffect(()=>{
    const element=dialog.current;if(!element)return;
    if(!open){if(element.open)element.close();return;}
    if(!element.open)element.showModal();
    element.querySelector<HTMLInputElement>('input[type="search"]')?.focus({preventScroll:true});
    const previous=document.body.style.overflow;document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous;if(element.open)element.close();};
  },[open]);
  useEffect(()=>{
    const element=track.current;if(!element)return;
    const update=()=>{
      const bounds=element.getBoundingClientRect(),first=element.firstElementChild?.getBoundingClientRect(),last=element.lastElementChild?.getBoundingClientRect();
      if(!first||!last)return;
      const next=locale==="ar"?{start:first.right>bounds.right+2,end:last.left<bounds.left-2}:{start:first.left<bounds.left-2,end:last.right>bounds.right+2};
      setEdges(old=>old.start===next.start&&old.end===next.end?old:next);
    };
    const observer=new ResizeObserver(update);observer.observe(element);for(const child of Array.from(element.children))observer.observe(child);
    element.addEventListener("scroll",update,{passive:true});update();
    return()=>{observer.disconnect();element.removeEventListener("scroll",update);};
  },[locale]);
  useEffect(()=>{
    function shortcut(event:KeyboardEvent){
      const target=event.target instanceof HTMLElement?event.target:null;
      const editing=target?.isContentEditable||Boolean(target?.closest("input,textarea,select,[role=textbox]"));
      if(event.defaultPrevented||event.isComposing||dialog.current?.open)return;
      if(((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k")||(!editing&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&event.key==="/")){
        const input=root.current?.querySelector<HTMLInputElement>('input[name="q"]');
        if(input){event.preventDefault();input.focus();}
      }
    }
    document.addEventListener("keydown",shortcut);return()=>document.removeEventListener("keydown",shortcut);
  },[]);
  function show(target:HTMLButtonElement){opener.current=target;setFilter("");setOpen(true);}
  function close(){setOpen(false);}
  function restoreFocus(){setOpen(false);if(opener.current?.isConnected)opener.current.focus({preventScroll:true});}
  function scrollRail(direction:number){
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches||document.documentElement.dataset.kidflixMotion==="no";
    track.current?.scrollBy({left:direction*(locale==="ar"?-1:1)*Math.max(220,track.current.clientWidth*.65),behavior:reduced?"auto":"smooth"});
  }
  function backDrop(event:MouseEvent<HTMLDialogElement>){
    if(event.target!==event.currentTarget)return;
    const box=event.currentTarget.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();
  }
  return <header ref={root} className={h.header} data-kidflix-premium-header="r3" dir={locale==="ar"?"rtl":"ltr"}>
    <div className={h.utility}><div className={h.utilityInner}>
      <Link href={`/angelcare-marketplace/${locale}`} className={h.back}><span className={h.backIcon}><I name="ArrowLeft" size={13}/></span>{tr(["AngelCare Marketplace","Marketplace AngelCare","سوق أنجل كير"],locale)}</Link>
      <span className={h.utilityMessage}>{tr(["Resources for curious minds. Tools for everyday practice.","Des ressources pour découvrir. Des outils pour pratiquer.","موارد للعقول الفضولية. وأدوات للممارسة اليومية."],locale)}</span>
      <span className={h.utilityPurpose}><I name="Leaf" size={13}/>{tr(["Learn · Practise · Prepare","Apprendre · Pratiquer · Préparer","تعلّم · تدرّب · حضّر"],locale)}</span>
    </div></div>
    <div className={h.main}>
      <div className={h.brand}>
        <Link className={h.logo} href={path(locale)} aria-label={`KidFlix · ${copy("home",locale)}`}><img src="/kidflix/kidflix-official-optimized.webp" width={174} height={70} alt="KidFlix" fetchPriority="high"/></Link>
        <div className={h.brandNote}><strong>{tr(["Learning, made practical.","Apprendre, concrètement.","تعلّم بالممارسة."],locale)}</strong><span>{tr(["For families & educators","Pour familles et éducateurs","للعائلات والمربين"],locale)}</span></div>
      </div>
      <div className={h.search}>{search}<kbd className={h.shortcut} aria-hidden="true">/</kbd></div>
      <div className={h.actions}>
        <Link className={h.saved} href={path(locale,"/my")} aria-current={pathname===path(locale,"/my")?"page":undefined} aria-label={j("my",locale)+(guest.ready&&guest.saved.length?" · "+guest.saved.length+" "+copy("savedShort",locale):"")}>
          <span className={h.savedIcon}><I name="Bookmark" size={20}/>{guest.ready&&guest.saved.length>0?<span className={h.count} aria-hidden="true">{guest.saved.length>99?"99+":guest.saved.length}</span>:null}</span><span className={h.savedLabel}>{copy("savedShort",locale)}</span>
        </Link>
        <div className={h.language}><I name="Globe" size={17}/><EditionLanguage locale={locale}/></div>
        <Link href={path(locale,"/explore")} className={h.explore}>{copy("explore",locale)}<I name="ArrowRight" size={17}/></Link>
        <button className={h.menuButton} type="button" aria-label={copy("worlds",locale)} aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId} onClick={event=>show(event.currentTarget)}><I name="Menu" size={22}/></button>
      </div>
    </div>
    <div className={h.navBand}><nav className={h.nav} aria-label={tr(["Main navigation","Navigation principale","التنقل الرئيسي"],locale)}>
      <Link href={path(locale)} style={colorStyle(0)} aria-current={pathname===path(locale)?"page":undefined}><span className={h.navIcon}><I name="Sun" size={20}/></span><span>{copy("home",locale)}</span></Link>
      {INTENTS.map(([key,icon,label],index)=><Link key={key} href={path(locale,"/explore?intent="+key)} style={colorStyle(index+1)} aria-current={pathname===path(locale,"/explore")&&query.get("intent")===key?"page":undefined}><span className={h.navIcon}><I name={icon} size={20}/></span><span>{tr(label,locale)}</span></Link>)}
      <button className={h.worldsButton} type="button" style={colorStyle(8)} aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId} onClick={event=>show(event.currentTarget)}><span className={h.navIcon}><I name="Compass" size={20}/></span><span>{copy("worlds",locale)}</span><I name="ChevronDown" size={14}/></button>
    </nav></div>
    <div className={h.rail}>
      <button className={h.railLead} type="button" aria-haspopup="dialog" aria-controls={dialogId} aria-expanded={open} onClick={event=>show(event.currentTarget)}><span className={h.railMark}/>{tr(["Resource library","Bibliothèque de ressources","مكتبة الموارد"],locale)}<I name="ChevronRight" size={14}/></button>
      <nav ref={track} className={h.worldTrack} data-header-world-track aria-label={copy("worlds",locale)}>{WORLDS.map(w=><Link key={w.key} href={path(locale,"/explore/"+w.key)} style={{"--world-ink":w.color,"--world-tint":w.tint} as CSSProperties} aria-current={currentWorld?.key===w.key?"page":undefined}><I name={w.icon} size={15}/><span>{tr(w.title,locale)}</span></Link>)}</nav>
      <div className={h.railControls}><button type="button" disabled={!edges.start} onClick={()=>scrollRail(-1)} aria-label={tr(["Previous categories","Catégories précédentes","الفئات السابقة"],locale)}><I name="ChevronLeft" size={16}/></button><button type="button" disabled={!edges.end} onClick={()=>scrollRail(1)} aria-label={tr(["More categories","Catégories suivantes","المزيد من الفئات"],locale)}><I name="ChevronRight" size={16}/></button></div>
    </div>
    <dialog ref={dialog} id={dialogId} className={h.dialog} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();close();}} onClose={restoreFocus} onClick={backDrop}>
      <div className={h.dialogHeading}><div><span className={h.eyebrow}>KIDFLIX · {tr(["RESOURCE LIBRARY","BIBLIOTHÈQUE DE RESSOURCES","مكتبة الموارد"],locale)}</span><h2 id={titleId}>{tr(["Find the right material.","Trouvez le bon support.","اعثر على المادة المناسبة."],locale)}</h2></div><button type="button" className={h.close} onClick={close} aria-label={tr(["Close resource library","Fermer la bibliothèque","إغلاق مكتبة الموارد"],locale)}><I name="X" size={21}/></button></div>
      <div className={h.dialogToolbar}><label className={h.filter} htmlFor={filterId}><I name="Search" size={18}/><span className={h.sr}>{tr(["Filter resource categories","Filtrer les catégories de ressources","تصفية فئات الموارد"],locale)}</span><input id={filterId} type="search" value={filter} onChange={event=>setFilter(event.target.value)} maxLength={80} placeholder={tr(["Find a category…","Rechercher une catégorie…","ابحث عن فئة…"],locale)}/></label><Link className={h.browseAll} href={path(locale,"/explore")} onClick={close}>{tr(["Browse all resources","Voir toutes les ressources","تصفح جميع الموارد"],locale)}<I name="ArrowRight" size={16}/></Link></div>
      <nav className={h.worldGrid} aria-label={copy("worlds",locale)}>{results.map(w=><Link key={w.key} href={path(locale,"/explore/"+w.key)} onClick={close} aria-current={currentWorld?.key===w.key?"page":undefined} style={{"--world-ink":w.color,"--world-tint":w.tint} as CSSProperties}><span className={h.worldIcon}><I name={w.icon} size={22}/></span><span className={h.worldText}><strong>{tr(w.title,locale)}</strong><small>{tr(w.description,locale)}</small></span><span className={h.worldArrow}><I name="ArrowRight" size={16}/></span></Link>)}</nav>
      {!results.length?<p className={h.empty} role="status">{tr(["No matching category. Try another word.","Aucune catégorie correspondante. Essayez un autre mot.","لا توجد فئة مطابقة. جرّب كلمة أخرى."],locale)}</p>:null}
      <div className={h.dialogFoot}><span><I name="Bookmark" size={16}/>{tr(["Keep useful discoveries close.","Gardez vos découvertes utiles à portée de main.","احتفظ بالموارد المفيدة بالقرب منك."],locale)}</span><Link href={path(locale,"/my")} onClick={close}>{j("my",locale)}<I name="ChevronRight" size={15}/></Link></div>
    </dialog>
  </header>;
}
