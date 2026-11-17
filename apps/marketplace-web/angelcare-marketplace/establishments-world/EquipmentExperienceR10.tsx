"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {
 ArrowRight,ArrowLeft,Bookmark,BookmarkCheck,Check,ChevronDown,ChevronLeft,ChevronRight,
 Compass,Grid2X2,GraduationCap,Heart,HeartHandshake,Layers3,MapPinned,MousePointer2,
 Package,Palette,Search,School,Send,Shapes,Sparkles,Star,Users,Workflow,BookOpen,
 Building2,ClipboardCheck,PartyPopper,Paintbrush,Eye,Plus,X,RotateCcw,SlidersHorizontal,
 Lightbulb,Info,Images,ShieldCheck,CheckCircle2,Sun,ClipboardList,Library
} from "lucide-react";
import {ManagedImage} from "../marketplace-imagery/ManagedImage";
import {EQUIPMENT_DOMAINS,EQUIPMENT_FAMILIES,equipmentDomainSelection,type EquipmentDomain,type EquipmentFamilyId} from "./equipment-r8-data";
import {R9InteractiveScene} from "./EquipmentR9DomainStudio";
import {R9_PROGRAMS,restoreR9State,equipmentR9Brief,type R9Preference,type R9State} from "./equipment-r9-programs";
import {R10_THEMES,R10_STORIES,R10_GOALS,R10_SCHOOL_HOTSPOTS,R10_DOMAIN_LABELS,type ExperienceEntry} from "./equipment-r10-editorial";
import {localDomain,localTheme,localStory,localGoal,localHotspot,localDomainLabel,localProgram,equipmentR111Brief} from "./equipment-r111-content";
import {equipmentUi} from "./equipment-r111-ui";
import type {Selection} from "./model";
import c from "./EquipmentExperienceR10.module.css";
import demos from "./EquipmentR9DomainStudio.module.css";

type R10Icon=typeof School;
const ICONS:Record<EquipmentFamilyId,R10Icon>={welcome:Building2,learning:Shapes,parents:HeartHandshake,operations:ClipboardList,routines:Sun,identity:PartyPopper};
const GOAL_ICONS:Record<string,R10Icon>={opening:School,modernize:Paintbrush,team:ClipboardCheck,enrolment:Users,event:PartyPopper};
const editorialRoot="/angelcare-marketplace/establishments-r2/";
const key=(territory:string)=>`ac.establishments.equipment-r10.v1:${territory}`;
const ideas=(territory:string)=>`ac.establishments.equipment-r10.ideas.v1:${territory}`;
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const defaultPref=():R9Preference=>({choice:0,age:"",format:"",quantity:"",note:""});
function Photo({src,alt,slot,priority=false}:{src:string;alt:string;slot:string;priority?:boolean}){
 return <ManagedImage slot={slot} src={editorialRoot+src+".png"} width={1280} height={850} alt={alt} loading={priority?"eager":"lazy"} decoding="async"/>;
}
const THEMES=EQUIPMENT_FAMILIES.map(f=>({...f,...R10_THEMES[f.id]}));
const nativeSelected=(values:string[])=>new Set(values.filter(x=>x.startsWith("intent:equipment-domain:")).map(x=>x.replace("intent:equipment-domain:","")));
export function EquipmentExperienceR10({
 locale,selected,onSelect,onReview,onContact,onExplore,onBriefChange,storageScope
}:{
 locale:"fr"|"en"|"ar";selected:string[];onSelect:(item:Selection)=>void;
 onReview:()=>void;onContact:(intent:{subject:string;email?:string})=>void;
 onExplore:()=>void;onBriefChange:(brief:string)=>void;storageScope:string;
}){
 const localizedDomains=useMemo(()=>EQUIPMENT_DOMAINS.map(d=>localDomain(d,locale)),[locale]);
 const localizedThemes=useMemo(()=>THEMES.map(x=>localTheme(x,locale)),[locale]);
 const localizedStories=useMemo(()=>R10_STORIES.map(x=>localStory(x,locale)),[locale]);
 const localizedGoals=useMemo(()=>R10_GOALS.map(x=>localGoal(x,locale)),[locale]);
 const localizedHotspots=useMemo(()=>R10_SCHOOL_HOTSPOTS.map(x=>localHotspot(x,locale)),[locale]);
 const [entry,setEntry]=useState<ExperienceEntry>("spaces");
 const [search,setSearch]=useState("");
 const [atlasFamily,setAtlasFamily]=useState<EquipmentFamilyId|"all">("all");
 const [activeDomainId,setActiveDomainId]=useState<string|null>(null);
 const [activeMap,setActiveMap]=useState(0);
 const [activeStory,setActiveStory]=useState(0);
 const [goalFocus,setGoalFocus]=useState<string>("opening");
 const [showAllDomains,setShowAllDomains]=useState(false);
 const [pref,setPref]=useState<R9State>(()=>restoreR9State(null));
 const [savedIdeas,setSavedIdeas]=useState<string[]>([]);
 const [hydrated,setHydrated]=useState(false);
 const [flipped,setFlipped]=useState(false);
 const [demoChecks,setDemoChecks]=useState<boolean[]>([false,false,false]);
 const [showTechnical,setShowTechnical]=useState(false);
 const [showHow,setShowHow]=useState(false);
 const selectedDomainIds=useMemo(()=>nativeSelected(selected),[selected]);
 const activeDomain=localizedDomains.find(x=>x.id===activeDomainId)||null;
 const activeProgram=activeDomain?localProgram(R9_PROGRAMS.find(x=>x.id===activeDomain.id)!,locale):null;
 const activePref=activeDomain?pref.preferences[activeDomain.id]||defaultPref():defaultPref();
 const savedSet=useMemo(()=>new Set(savedIdeas),[savedIdeas]);
 const brief=useMemo(()=>{
  const base=equipmentR111Brief(selected,pref,locale);
  const inspiration=localizedDomains.filter(d=>savedSet.has(d.id)).map(d=>d.name).join(" · ");
  return [base,inspiration?`${locale==="en"?"Saved inspirations (not ordered)":locale==="ar"?"الأفكار المحفوظة (غير مطلوبة)":"Inspirations sauvegardées (non commandées)"}: ${inspiration}`:""].filter(Boolean).join("\n").slice(0,1900);
 },[pref,selected,savedSet,localizedDomains,locale]);
 useEffect(()=>{
  try{
   const old=sessionStorage.getItem(`ac.establishments.equipment-r9.preferences.v1:${storageScope}`);
   setPref(restoreR9State(old));
   const saved=localStorage.getItem(ideas(storageScope));
   const array=saved?JSON.parse(saved):[];
   setSavedIdeas(Array.isArray(array)?array.filter((v):v is string=>typeof v==="string"&&localizedDomains.some(d=>d.id===v)).slice(0,22):[]);
  }catch{setPref(restoreR9State(null));setSavedIdeas([])}
  const chosen=new URLSearchParams(window.location.search).get("equipmentDomain");
  if(chosen&&localizedDomains.some(d=>d.id===chosen))setActiveDomainId(chosen);
  setHydrated(true);
 },[storageScope]);
 useEffect(()=>{if(!hydrated)return;try{sessionStorage.setItem(`ac.establishments.equipment-r9.preferences.v1:${storageScope}`,JSON.stringify(pref));localStorage.setItem(ideas(storageScope),JSON.stringify(savedIdeas))}catch{}},[hydrated,pref,savedIdeas,storageScope]);
 useEffect(()=>onBriefChange(brief),[brief,onBriefChange]);
 const scroll=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
 const showDomain=useCallback((id:string)=>{
  if(!localizedDomains.some(d=>d.id===id))return;
  setActiveDomainId(id);setFlipped(false);setDemoChecks([false,false,false]);setShowTechnical(false);
  window.history.replaceState(window.history.state,"",(()=>{const url=new URL(window.location.href);url.searchParams.set("equipmentDomain",id);return url.pathname+url.search+url.hash})());
  requestAnimationFrame(()=>document.getElementById("r10-domain-experience")?.scrollIntoView({block:"start",behavior:"smooth"}));
 },[]);
 useEffect(()=>{
  const onOpen=(event:Event)=>{
   const id=(event as CustomEvent<{id?:string}>).detail?.id;
   if(id&&localizedDomains.some(d=>d.id===id))showDomain(id);
  };
  window.addEventListener("angelcare:equipment-open-domain",onOpen);
  return()=>window.removeEventListener("angelcare:equipment-open-domain",onOpen);
 },[showDomain]);
 const closeDomain=()=>{setActiveDomainId(null);window.history.replaceState(window.history.state,"",(()=>{const url=new URL(window.location.href);url.searchParams.delete("equipmentDomain");return url.pathname+url.search+url.hash})());scroll("r10-universes")};
 const toggleIdea=(id:string)=>setSavedIdeas(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id].slice(0,22));
 const saveRelated=()=>{if(activeDomain)toggleIdea(activeDomain.id)};
 const updatePref=(patch:Partial<R9Preference>)=>{if(!activeDomain)return;setPref(old=>({...old,preferences:{...old.preferences,[activeDomain.id]:{...defaultPref(),...old.preferences[activeDomain.id],...patch}}}))};
 const domainSearch=useMemo(()=>localizedDomains.filter(d=>(atlasFamily==="all"||d.group===atlasFamily)&&(!search.trim()||normalize(d.name+" "+d.short+" "+d.pain+" "+d.examples.join(" ")).includes(normalize(search.trim())))),[search,atlasFamily]);
 const story=localizedStories[activeStory];
 const focusedGoal=localizedGoals.find(g=>g.id===goalFocus)||localizedGoals[0];
 const hotspot=localizedHotspots[activeMap];
 const domainForHotspot=localizedDomains.find(d=>d.id===hotspot.id);
 return <div className={c.root} lang={locale} dir={locale==="ar"?"rtl":"ltr"} data-equipment-experience="R10">
  <nav className={c.jump} aria-label={equipmentUi(locale,"Navigation équipements")}><span><Compass size={17}/> ANGELCARE SCHOOL UNIVERSE</span><div>
   <button onClick={()=>scroll("r10-explore")}>{equipmentUi(locale,"Explorer")}</button><button onClick={()=>scroll("r10-stories")}>{equipmentUi(locale,"Inspirations")}</button><button onClick={()=>scroll("r10-map")}>{equipmentUi(locale,"Visiter l'école")}</button><button onClick={()=>scroll("r10-universes")}>{equipmentUi(locale,"Les univers")}</button>
   <button onClick={()=>scroll("r10-collection")}><Bookmark size={15}/> Mes idées {savedIdeas.length+selectedDomainIds.size>0?(`(${savedIdeas.length+selectedDomainIds.size})`):""}</button>
  </div></nav>

  <section className={c.intro} id="r10-explore">
   <div className={c.introCopy}><span className={c.eyebrow}><Sparkles size={17}/> {equipmentUi(locale,"L'EXPÉRIENCE ANGELCARE ÉCOLE · NOUVELLE GÉNÉRATION")}</span>
    <h2>{equipmentUi(locale,"Et si votre établissement devenait")} <em>{equipmentUi(locale,"votre plus belle vitrine ?")}</em></h2>
    <p>{equipmentUi(locale,"Découvrez des idées concrètes pour accueillir, inspirer, organiser et faire grandir votre école. Des univers à explorer, des solutions à comprendre, des projets à imaginer.")}</p>
    <div className={c.heroBadges}><span><CheckCircle2 size={15}/> {equipmentUi(locale,"6 univers de vie")}</span><span><Shapes size={15}/> {equipmentUi(locale,"22 domaines réels")}</span><span><Heart size={15}/> {equipmentUi(locale,"Des idées à conserver")}</span></div>
    <button className={c.introAction} onClick={()=>scroll("r10-stories")}>{equipmentUi(locale,"Découvrir les transformations")} <ArrowRight size={18}/></button>
   </div>
   <div className={c.introMedia}><Photo src="classroom" slot="equipment-r10.intro.classroom" alt={equipmentUi(locale,"Salle de classe lumineuse et espaces pédagogiques")} priority/><div className={c.introMediaInset}><Photo src="os-team" slot="equipment-r10.intro.team" alt={equipmentUi(locale,"Organisation et préparation de l’équipe pédagogique")}/></div><span className={c.introSticker}><Star size={16}/> {equipmentUi(locale,"Imaginez la différence")}</span></div>
  </section>

  <section className={c.discovery} aria-label={equipmentUi(locale,"Choisissez votre manière de découvrir")}>
   <div className={c.sectionHeading}><span>{equipmentUi(locale,"01 / DÉCOUVERTE SUR MESURE")}</span><h2>{equipmentUi(locale,"Comment souhaitez-vous explorer ?")}</h2><p>{equipmentUi(locale,"Trois chemins clairs, une seule destination : des solutions adaptées à votre établissement.")}</p></div>
   <div className={c.discoveryTabs} role="tablist" aria-label={equipmentUi(locale,"Modes de découverte")}>
    <button role="tab" aria-selected={entry==="spaces"} onClick={()=>setEntry("spaces")}><MapPinned size={19}/> {equipmentUi(locale,"Par espace")} <small>{equipmentUi(locale,"J'explore mon école")}</small></button>
    <button role="tab" aria-selected={entry==="goals"} onClick={()=>setEntry("goals")}><Lightbulb size={19}/> {equipmentUi(locale,"Par objectif")} <small>{equipmentUi(locale,"Je pars d'un besoin")}</small></button>
    <button role="tab" aria-selected={entry==="domains"} onClick={()=>setEntry("domains")}><Grid2X2 size={19}/> {equipmentUi(locale,"Par domaine")} <small>{equipmentUi(locale,"Je connais le sujet")}</small></button>
   </div>
   <div className={c.discoveryContent} role="tabpanel">
    {entry==="spaces"?<div className={c.spacesGrid}>{localizedThemes.slice(0,6).map((f,i)=><button key={f.id} onClick={()=>scroll("r10-universes-"+f.id)} className={c.spaceCard} data-space={f.id}>
     <span className={c.spacePhoto}><Photo src={f.art} slot={`equipment-r10.space.${f.id}`} alt={f.label}/></span><span className={c.spaceNumber}>0{i+1}</span>
     <span className={c.spaceCopy}><strong>{f.label}</strong><small>{f.outcome}</small><ChevronRight size={19}/></span></button>)}</div>:
     entry==="goals"?<div className={c.goalsGrid}>{localizedGoals.map(g=>{const Icon=GOAL_ICONS[g.id];return <button key={g.id} onClick={()=>setGoalFocus(g.id)} aria-pressed={goalFocus===g.id}>
      <span className={c.goalIcon}><Icon size={24}/></span><span><strong>{g.title}</strong><small>{g.subtitle}</small><em>{g.domains.length} {equipmentUi(locale,"pistes à découvrir")}</em></span><ArrowRight size={20}/></button>})}<div className={c.goalDetail}><div><span>{equipmentUi(locale,"VOTRE PARCOURS RECOMMANDÉ")}</span><h3>{focusedGoal.title}</h3><p>{focusedGoal.subtitle}. {equipmentUi(locale,"Voici quatre thèmes utiles pour explorer la situation, sans engagement.")}</p></div><div>{focusedGoal.domains.map(id=>{const d=localizedDomains.find(x=>x.id===id);return d?<button key={id} onClick={()=>showDomain(id)}><Photo src={d.art} slot={`equipment-r10.goal.${focusedGoal.id}.${id}`} alt={d.name}/><strong>{d.name}</strong><ChevronRight size={17}/></button>:null})}</div></div></div>:
    <div className={c.domainDiscovery}><div className={c.searchBar}><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={equipmentUi(locale,"Un besoin, un espace, une activité…")} aria-label={equipmentUi(locale,"Rechercher dans les 22 domaines")}/></div>
     <div className={c.miniDomains}>{domainSearch.slice(0,9).map(d=><button onClick={()=>showDomain(d.id)} key={d.id}><span>{String(d.number).padStart(2,"0")}</span>{d.name}<ArrowRight size={16}/></button>)}</div>
     {domainSearch.length>9?<button className={c.moreDomains} onClick={()=>scroll("r10-atlas")}>{equipmentUi(locale,"Voir la bibliothèque complète")} <ArrowRight size={17}/></button>:null}
     {domainSearch.length===0?<p>{equipmentUi(locale,"Aucun domaine ne correspond à cette recherche.")}</p>:null}
    </div>}
   </div>
  </section>

  <section className={c.stories} id="r10-stories">
   <div className={c.sectionHeading}><span>{equipmentUi(locale,"02 / CE QUI CHANGE VRAIMENT UNE ÉCOLE")}</span><h2>{equipmentUi(locale,"De belles idées.")} <em>{equipmentUi(locale,"De vrais usages.")}</em></h2><p>{equipmentUi(locale,"Quatre situations que les directions connaissent bien, racontées par leurs solutions et leurs bénéfices concrets.")}</p></div>
   <div className={c.storyNavigator}>{localizedStories.map((s,i)=><button key={s.id} onClick={()=>setActiveStory(i)} aria-pressed={activeStory===i}><span>0{i+1}</span>{[equipmentUi(locale,"Ouvrir une école"),equipmentUi(locale,"Créer une classe"),equipmentUi(locale,"Organiser l'équipe"),equipmentUi(locale,"Réussir un événement")][i]}</button>)}</div>
   <div className={c.storyHero} data-story={story.id}>
    <div className={c.storyVisual}><Photo src={story.art} slot={`equipment-r10.story.${story.id}`} alt={story.title}/><span className={c.storyBadge}><Sparkles size={15}/>{story.badge}</span></div>
    <div className={c.storyCopy}><span className={c.eyebrow}>{story.eyebrow}</span><h3>{story.title}</h3><p>{story.sub}</p>
     <div className={c.storyOutcome}><CheckCircle2 size={23}/><span><strong>{equipmentUi(locale,"Ce que cela change")}</strong>{story.benefit}</span></div>
     <strong className={c.minorLabel}>{equipmentUi(locale,"À DÉCOUVRIR DANS CE PARCOURS")}</strong>
     <div className={c.storyLinks}>{story.domains.map(id=>{const d=localizedDomains.find(x=>x.id===id);return d?<button key={id} onClick={()=>showDomain(id)}>{d.name}<ArrowRight size={16}/></button>:null})}</div>
     <small>{story.caption} · {equipmentUi(locale,"Illustrations d'ambiance, références à vérifier dans le catalogue.")}</small>
    </div>
   </div>
   <div className={c.storyPagination}><button aria-label={equipmentUi(locale,"Histoire précédente")} onClick={()=>setActiveStory(v=>(v+localizedStories.length-1)%localizedStories.length)}><ArrowLeft size={17}/></button><span>{String(activeStory+1).padStart(2,"0")} / 04</span><button aria-label={equipmentUi(locale,"Histoire suivante")} onClick={()=>setActiveStory(v=>(v+1)%localizedStories.length)}><ArrowRight size={17}/></button></div>
  </section>

  <section className={c.mapSection} id="r10-map"><div className={c.sectionHeading}><span>{equipmentUi(locale,"03 / VISITE VISUELLE")}</span><h2>{equipmentUi(locale,"Promenez-vous dans")} <em>{equipmentUi(locale,"l'école idéale.")}</em></h2><p>{equipmentUi(locale,"Choisissez un espace : découvrez pourquoi il compte et quelles idées peuvent l'améliorer.")}</p></div>
   <div className={c.mapComposition}><div className={c.mapPhoto}><div className={c.mapTiles}>{localizedHotspots.map((h,i)=><button key={h.id} type="button" className={c.mapZone} data-active={activeMap===i} aria-pressed={activeMap===i} onClick={()=>setActiveMap(i)}><Photo src={R10_THEMES[h.family].art} slot={`equipment-r10.school.zone.${h.id}`} alt={h.label}/><span><b>0{i+1}</b>{h.label}<ChevronRight size={17}/></span></button>)}</div><span className={c.mapPhotoLabel}><MousePointer2 size={15}/> {equipmentUi(locale,"6 espaces à explorer")}</span></div><div className={c.mapDetails} data-theme={hotspot.family}><span>{equipmentUi(locale,"ESPACE")} 0{activeMap+1} / 06</span><h3>{hotspot.label}</h3><p>{hotspot.summary}</p><div className={c.mapFeature}><Photo src={R10_THEMES[hotspot.family].art} slot={`equipment-r10.map.detail.${hotspot.family}`} alt={hotspot.label}/></div>
    <strong>{domainForHotspot?.name}</strong><small>{domainForHotspot?.short}</small><button onClick={()=>showDomain(hotspot.id)}>{equipmentUi(locale,"Découvrir les idées de cet espace")} <ArrowRight size={17}/></button>
   </div></div>
  </section>

  <section className={c.universes} id="r10-universes">
   <div className={c.sectionHeading}><span>{equipmentUi(locale,"04 / SIX UNIVERS QUI ONT CHACUN LEUR PERSONNALITÉ")}</span><h2>{equipmentUi(locale,"À chaque besoin,")} <em>{equipmentUi(locale,"un monde à explorer.")}</em></h2><p>{equipmentUi(locale,"Pas six copies d'une même fiche : six histoires, six ambiances et 22 portes d'entrée vers des solutions concrètes.")}</p></div>
   <div className={c.universeGrid}>{localizedThemes.map((f,i)=>{const Icon=ICONS[f.id];const domains=localizedDomains.filter(d=>d.group===f.id);return <article key={f.id} id={`r10-universes-${f.id}`} className={c.universeCard} data-theme={f.id} style={{background:f.color}}>
    <div className={c.universeImage}><Photo src={f.art} slot={`equipment-r10.universe.${f.id}`} alt={f.label}/><span>{f.badge}</span></div>
    <div className={c.universeBody}><div className={c.universeLead}><span style={{color:f.ink}}><Icon size={21}/>{String(i+1).padStart(2,"0")} / 06</span><h3>{f.tagline}</h3><p>{f.story}</p></div>
     <div className={c.universeBenefits}><CheckCircle2 size={17}/>{f.outcome}</div>
     <div className={c.universeTags}>{domains.map(d=><button key={d.id} onClick={()=>showDomain(d.id)}>{d.name}<ChevronRight size={13}/></button>)}</div>
    </div>
   </article>})}</div>
  </section>

  <section className={c.atlas} id="r10-atlas">
   <div className={c.atlasHead}><div><span className={c.eyebrow}><Library size={17}/> {equipmentUi(locale,"BIBLIOTHÈQUE VISUELLE · 22 DOMAINES")}</span><h2>{equipmentUi(locale,"Une idée en tête ?")} <em>{equipmentUi(locale,"Retrouvez-la ici.")}</em></h2><p>{equipmentUi(locale,"Explorez les applications, sauvegardez l'inspiration, puis reliez-la à votre projet.")}</p></div>
   <button className={c.atlasToggle} onClick={()=>setShowAllDomains(v=>!v)}>{showAllDomains?equipmentUi(locale,"Vue compacte"):equipmentUi(locale,"Afficher tous les domaines")}<Grid2X2 size={18}/></button></div>
   <div className={c.atlasControls}><div className={c.searchBar}><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={equipmentUi(locale,"Rechercher un thème, un usage ou un besoin…")} aria-label={equipmentUi(locale,"Rechercher les domaines")}/></div>
    <select value={atlasFamily} onChange={e=>setAtlasFamily(e.target.value as EquipmentFamilyId|"all")} aria-label={equipmentUi(locale,"Filtrer les univers")}><option value="all">{equipmentUi(locale,"Tous les univers")}</option>{localizedThemes.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
   </div>
   <div className={c.atlasGrid}>{(showAllDomains||search.trim()||atlasFamily!=="all"?domainSearch:domainSearch.slice(0,12)).map(d=><article key={d.id} className={c.atlasCard}><button className={c.atlasCardMain} onClick={()=>showDomain(d.id)}><div><Photo src={d.art} slot={`equipment-r10.atlas.${d.id}`} alt={d.name}/></div><span className={c.atlasCardText}><small>{equipmentUi(locale,"DOMAINE")} {String(d.number).padStart(2,"0")} · {localizedThemes.find(x=>x.id===d.group)?.label}</small><strong>{d.name}</strong><em>{(R10_DOMAIN_LABELS[d.id]?localDomainLabel(d.id,R10_DOMAIN_LABELS[d.id],locale).application:undefined)||d.short}</em></span></button><button type="button" aria-label={savedSet.has(d.id)?equipmentUi(locale,"Retirer cette idée"):equipmentUi(locale,"Enregistrer cette idée")} aria-pressed={savedSet.has(d.id)} className={c.saveSmall} onClick={()=>toggleIdea(d.id)}>{savedSet.has(d.id)?<BookmarkCheck size={18}/>:<Bookmark size={18}/>}</button></article>)}</div>
   {domainSearch.length===0?<p className={c.noResults}>{equipmentUi(locale,"Aucun résultat. Essayez un autre mot ou univers.")}</p>:null}
   {!showAllDomains&&!search.trim()&&atlasFamily==="all"?<button className={c.atlasMore} onClick={()=>setShowAllDomains(true)}>{equipmentUi(locale,"Découvrir les 22 domaines")} <ArrowRight size={19}/></button>:null}
  </section>

  {activeDomain&&activeProgram?<section className={c.domainFeature} id="r10-domain-experience" data-domain={activeDomain.id}>
   <div className={c.domainFeatureTop}><button className={c.backButton} onClick={closeDomain}><ArrowLeft size={18}/> {equipmentUi(locale,"Retour aux univers")}</button><span>{equipmentUi(locale,"EXPÉRIENCE")} {String(activeDomain.number).padStart(2,"0")} / 22 · {localizedThemes.find(x=>x.id===activeDomain.group)?.label}</span>
    <button className={c.saveFeature} onClick={saveRelated}>{savedSet.has(activeDomain.id)?<BookmarkCheck size={17}/>:<Bookmark size={17}/>} {savedSet.has(activeDomain.id)?equipmentUi(locale,"Retirer des idées"):equipmentUi(locale,"Enregistrer l'idée")}</button></div>
   <div className={c.domainFeatureHero} data-theme={activeDomain.group}><div><span>{activeProgram.eyebrow}</span><h2>{(R10_DOMAIN_LABELS[activeDomain.id]?localDomainLabel(activeDomain.id,R10_DOMAIN_LABELS[activeDomain.id],locale).headline:undefined)||activeProgram.headline}</h2><p>{(R10_DOMAIN_LABELS[activeDomain.id]?localDomainLabel(activeDomain.id,R10_DOMAIN_LABELS[activeDomain.id],locale).reassurance:undefined)||activeProgram.promise}</p><div className={c.featureChips}>{activeDomain.examples.map(example=><span key={example}><CheckCircle2 size={14}/>{example}</span>)}</div></div><div><Photo src={activeDomain.art} slot={`equipment-r10.feature.${activeDomain.id}`} alt={activeDomain.name}/></div></div>
   <div className={c.domainSceneHeader}><div><span className={c.eyebrow}>{equipmentUi(locale,"EXPLOREZ LE CONCEPT")}</span><h3>{equipmentUi(locale,"Découvrez-le en situation.")}</h3><p>{activeProgram.scenario}</p></div><div className={c.domainSceneNote}><Info size={17}/> {equipmentUi(locale,"Concept illustratif : disponibilité, variantes et tarifs restent dans les offres publiées.")}</div></div>
   <div className={demos.root}><R9InteractiveScene program={activeProgram} domain={activeDomain} pref={activePref}
    choose={choice=>updatePref({choice})} flip={flipped} setFlip={setFlipped} checks={demoChecks} toggleCheck={index=>setDemoChecks(v=>v.map((n,i)=>i===index?!n:n))}/></div>
   <div className={c.domainApplications}><div><span>{equipmentUi(locale,"À QUOI CELA SERT CONCRÈTEMENT ?")}</span><h3>{activeProgram.value}</h3><p>{activeDomain.solution}</p></div><div><span>{equipmentUi(locale,"IDÉES D'APPLICATION")}</span>{activeDomain.examples.map(x=><p key={x}><CheckCircle2 size={17}/>{x}</p>)}</div></div>
   <div className={c.domainFollow}><div><strong>{equipmentUi(locale,"Pour aller plus loin")}</strong><p>{equipmentUi(locale,"D'autres domaines peuvent compléter cette idée, sans créer un lot fictif ni forcer une demande de devis.")}</p></div>{activeProgram.recommendations.map(id=>{const related=localizedDomains.find(d=>d.id===id);return related?<button key={id} onClick={()=>showDomain(id)}><Photo src={related.art} slot={`equipment-r10.related.${activeDomain.id}.${related.id}`} alt={related.name}/><span>{related.name}</span><ChevronRight size={16}/></button>:null})}</div>
   <div className={c.domainFoot}><button onClick={()=>toggleIdea(activeDomain.id)}>{savedSet.has(activeDomain.id)?<BookmarkCheck size={18}/>:<Bookmark size={18}/>} {savedSet.has(activeDomain.id)?equipmentUi(locale,"Retirer des idées"):equipmentUi(locale,"Garder cette idée")}</button><button onClick={()=>onSelect(equipmentDomainSelection(activeDomain))}>{selectedDomainIds.has(activeDomain.id)?<Check size={17}/>:<Plus size={17}/>} {selectedDomainIds.has(activeDomain.id)?equipmentUi(locale,"Retirer du projet"):equipmentUi(locale,"Ajouter à ma sélection")}</button><button onClick={onExplore}><Package size={18}/> {equipmentUi(locale,"Voir les offres publiées")}</button><button onClick={()=>setShowTechnical(v=>!v)}><SlidersHorizontal size={17}/>{showTechnical?equipmentUi(locale,"Masquer les détails"):equipmentUi(locale,"Préciser un besoin")}<ChevronDown size={16}/></button></div>
   {showTechnical?<div className={c.technicalFields}><p>{equipmentUi(locale,"Facultatif : précisez un besoin uniquement pour enrichir votre brief, pas pour créer une commande.")}</p>
    <label>{equipmentUi(locale,"Tranche d'âge")}<select value={activePref.age} onChange={e=>updatePref({age:e.target.value})}><option value="">{equipmentUi(locale,"À préciser")}</option>{["1–2 ans","3–4 ans","5–6 ans",equipmentUi(locale,"Multi-âges")].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>{equipmentUi(locale,"Format ou contexte")}<input value={activePref.format} onChange={e=>updatePref({format:e.target.value.slice(0,75)})} placeholder={equipmentUi(locale,"Lieu, format, thème…")}/></label>
    <label>{equipmentUi(locale,"Note utile")}<input value={activePref.note} onChange={e=>updatePref({note:e.target.value.slice(0,180)})} placeholder={equipmentUi(locale,"Détail à préciser")}/></label>
   </div>:null}
  </section>:null}

  <section className={c.collection} id="r10-collection">
   <div><span className={c.eyebrow}><BookmarkCheck size={17}/> {equipmentUi(locale,"MA COLLECTION D'INSPIRATIONS")}</span><h2>{equipmentUi(locale,"Votre école prend forme,")} <em>{equipmentUi(locale,"une idée à la fois.")}</em></h2><p>{equipmentUi(locale,"Enregistrez les inspirations qui vous intéressent, puis sélectionnez les domaines utiles au projet. Rien n'est commandé automatiquement.")}</p></div>
   <div className={c.collectionTags}>{savedIdeas.length||selectedDomainIds.size?[...new Set([...savedIdeas,...selectedDomainIds])].map(id=>{const d=localizedDomains.find(x=>x.id===id);return d?<button key={id} onClick={()=>showDomain(id)}><Bookmark size={13}/>{d.name}<ChevronRight size={14}/></button>:null}):<div className={c.emptyCollection}><Images size={27}/><strong>{equipmentUi(locale,"Votre collection commence avec une idée.")}</strong><span>{equipmentUi(locale,"Visitez un univers, explorez un domaine et enregistrez ce qui vous plaît.")}</span></div>}</div>
   <div className={c.collectionActions}><button onClick={onReview}><Layers3 size={18}/>{equipmentUi(locale,"Voir ma sélection native (")}{selected.length})</button><button onClick={onExplore}><Package size={18}/> {equipmentUi(locale,"Revoir les produits")}</button><button onClick={()=>onContact({subject:equipmentUi(locale,"Équipements · Projet d'établissement")})}><Send size={17}/> {equipmentUi(locale,"Préparer mon projet")}</button></div>
  </section>
  <section className={c.closing}><div><Photo src="welcome" slot="equipment-r10.closing" alt={equipmentUi(locale,"Établissement préscolaire lumineux et accueillant")}/></div><div><span>{equipmentUi(locale,"ANGELCARE · À VOTRE CÔTÉ")}</span><h2>{equipmentUi(locale,"Des idées pour aujourd'hui.")} <em>{equipmentUi(locale,"Une école plus forte demain.")}</em></h2><p>{equipmentUi(locale,"Inspirez-vous, explorez et gardez ce qui vous correspond. Notre équipe vous aide ensuite à transformer vos besoins en une demande concrète.")}</p><button onClick={()=>onContact({subject:equipmentUi(locale,"Équipements · Projet d'établissement")})}>{equipmentUi(locale,"Parler de mon projet")} <ArrowRight size={19}/></button></div></section>
 </div>;
}
