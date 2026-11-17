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
 const activeDomain=EQUIPMENT_DOMAINS.find(x=>x.id===activeDomainId)||null;
 const activeProgram=activeDomain?R9_PROGRAMS.find(x=>x.id===activeDomain.id)||null:null;
 const activePref=activeDomain?pref.preferences[activeDomain.id]||defaultPref():defaultPref();
 const savedSet=useMemo(()=>new Set(savedIdeas),[savedIdeas]);
 const brief=useMemo(()=>{
  const base=equipmentR9Brief(selected,pref);
  const inspiration=EQUIPMENT_DOMAINS.filter(d=>savedSet.has(d.id)).map(d=>d.name).join(" · ");
  return [base,inspiration?`Inspirations sauvegardées (non commandées): ${inspiration}`:""].filter(Boolean).join("\n").slice(0,1900);
 },[pref,selected,savedSet]);
 useEffect(()=>{
  try{
   const old=sessionStorage.getItem(`ac.establishments.equipment-r9.preferences.v1:${storageScope}`);
   setPref(restoreR9State(old));
   const saved=localStorage.getItem(ideas(storageScope));
   const array=saved?JSON.parse(saved):[];
   setSavedIdeas(Array.isArray(array)?array.filter((v):v is string=>typeof v==="string"&&EQUIPMENT_DOMAINS.some(d=>d.id===v)).slice(0,22):[]);
  }catch{setPref(restoreR9State(null));setSavedIdeas([])}
  const chosen=new URLSearchParams(window.location.search).get("equipmentDomain");
  if(chosen&&EQUIPMENT_DOMAINS.some(d=>d.id===chosen))setActiveDomainId(chosen);
  setHydrated(true);
 },[storageScope]);
 useEffect(()=>{if(!hydrated)return;try{sessionStorage.setItem(`ac.establishments.equipment-r9.preferences.v1:${storageScope}`,JSON.stringify(pref));localStorage.setItem(ideas(storageScope),JSON.stringify(savedIdeas))}catch{}},[hydrated,pref,savedIdeas,storageScope]);
 useEffect(()=>onBriefChange(brief),[brief,onBriefChange]);
 const scroll=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
 const showDomain=useCallback((id:string)=>{
  if(!EQUIPMENT_DOMAINS.some(d=>d.id===id))return;
  setActiveDomainId(id);setFlipped(false);setDemoChecks([false,false,false]);setShowTechnical(false);
  window.history.replaceState(window.history.state,"",(()=>{const url=new URL(window.location.href);url.searchParams.set("equipmentDomain",id);return url.pathname+url.search+url.hash})());
  requestAnimationFrame(()=>document.getElementById("r10-domain-experience")?.scrollIntoView({block:"start",behavior:"smooth"}));
 },[]);
 useEffect(()=>{
  const onOpen=(event:Event)=>{
   const id=(event as CustomEvent<{id?:string}>).detail?.id;
   if(id&&EQUIPMENT_DOMAINS.some(d=>d.id===id))showDomain(id);
  };
  window.addEventListener("angelcare:equipment-open-domain",onOpen);
  return()=>window.removeEventListener("angelcare:equipment-open-domain",onOpen);
 },[showDomain]);
 const closeDomain=()=>{setActiveDomainId(null);window.history.replaceState(window.history.state,"",(()=>{const url=new URL(window.location.href);url.searchParams.delete("equipmentDomain");return url.pathname+url.search+url.hash})());scroll("r10-universes")};
 const toggleIdea=(id:string)=>setSavedIdeas(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id].slice(0,22));
 const saveRelated=()=>{if(activeDomain)toggleIdea(activeDomain.id)};
 const updatePref=(patch:Partial<R9Preference>)=>{if(!activeDomain)return;setPref(old=>({...old,preferences:{...old.preferences,[activeDomain.id]:{...defaultPref(),...old.preferences[activeDomain.id],...patch}}}))};
 const domainSearch=useMemo(()=>EQUIPMENT_DOMAINS.filter(d=>(atlasFamily==="all"||d.group===atlasFamily)&&(!search.trim()||normalize(d.name+" "+d.short+" "+d.pain+" "+d.examples.join(" ")).includes(normalize(search.trim())))),[search,atlasFamily]);
 const story=R10_STORIES[activeStory];
 const focusedGoal=R10_GOALS.find(g=>g.id===goalFocus)||R10_GOALS[0];
 const hotspot=R10_SCHOOL_HOTSPOTS[activeMap];
 const domainForHotspot=EQUIPMENT_DOMAINS.find(d=>d.id===hotspot.id);
 return <div className={c.root} lang={locale} dir={locale==="ar"?"rtl":"ltr"} data-equipment-experience="R10">
  <nav className={c.jump} aria-label="Navigation équipements"><span><Compass size={17}/> ANGELCARE SCHOOL UNIVERSE</span><div>
   <button onClick={()=>scroll("r10-explore")}>Explorer</button><button onClick={()=>scroll("r10-stories")}>Inspirations</button><button onClick={()=>scroll("r10-map")}>Visiter l'école</button><button onClick={()=>scroll("r10-universes")}>Les univers</button>
   <button onClick={()=>scroll("r10-collection")}><Bookmark size={15}/> Mes idées {savedIdeas.length+selectedDomainIds.size>0?(`(${savedIdeas.length+selectedDomainIds.size})`):""}</button>
  </div></nav>

  <section className={c.intro} id="r10-explore">
   <div className={c.introCopy}><span className={c.eyebrow}><Sparkles size={17}/> L'EXPÉRIENCE ANGELCARE ÉCOLE · NOUVELLE GÉNÉRATION</span>
    <h2>Et si votre établissement devenait <em>votre plus belle vitrine ?</em></h2>
    <p>Découvrez des idées concrètes pour accueillir, inspirer, organiser et faire grandir votre école. Des univers à explorer, des solutions à comprendre, des projets à imaginer.</p>
    <div className={c.heroBadges}><span><CheckCircle2 size={15}/> 6 univers de vie</span><span><Shapes size={15}/> 22 domaines réels</span><span><Heart size={15}/> Des idées à conserver</span></div>
    <button className={c.introAction} onClick={()=>scroll("r10-stories")}>Découvrir les transformations <ArrowRight size={18}/></button>
   </div>
   <div className={c.introMedia}><Photo src="classroom" slot="equipment-r10.intro.classroom" alt="Salle de classe lumineuse et espaces pédagogiques" priority/><div className={c.introMediaInset}><Photo src="os-team" slot="equipment-r10.intro.team" alt="Organisation et préparation de l’équipe pédagogique"/></div><span className={c.introSticker}><Star size={16}/> Imaginez la différence</span></div>
  </section>

  <section className={c.discovery} aria-label="Choisissez votre manière de découvrir">
   <div className={c.sectionHeading}><span>01 / DÉCOUVERTE SUR MESURE</span><h2>Comment souhaitez-vous explorer ?</h2><p>Trois chemins clairs, une seule destination : des solutions adaptées à votre établissement.</p></div>
   <div className={c.discoveryTabs} role="tablist" aria-label="Modes de découverte">
    <button role="tab" aria-selected={entry==="spaces"} onClick={()=>setEntry("spaces")}><MapPinned size={19}/> Par espace <small>J'explore mon école</small></button>
    <button role="tab" aria-selected={entry==="goals"} onClick={()=>setEntry("goals")}><Lightbulb size={19}/> Par objectif <small>Je pars d'un besoin</small></button>
    <button role="tab" aria-selected={entry==="domains"} onClick={()=>setEntry("domains")}><Grid2X2 size={19}/> Par domaine <small>Je connais le sujet</small></button>
   </div>
   <div className={c.discoveryContent} role="tabpanel">
    {entry==="spaces"?<div className={c.spacesGrid}>{THEMES.slice(0,6).map((f,i)=><button key={f.id} onClick={()=>scroll("r10-universes-"+f.id)} className={c.spaceCard} data-space={f.id}>
     <span className={c.spacePhoto}><Photo src={f.art} slot={`equipment-r10.space.${f.id}`} alt={f.label}/></span><span className={c.spaceNumber}>0{i+1}</span>
     <span className={c.spaceCopy}><strong>{f.label}</strong><small>{f.outcome}</small><ChevronRight size={19}/></span></button>)}</div>:
     entry==="goals"?<div className={c.goalsGrid}>{R10_GOALS.map(g=>{const Icon=GOAL_ICONS[g.id];return <button key={g.id} onClick={()=>setGoalFocus(g.id)} aria-pressed={goalFocus===g.id}>
      <span className={c.goalIcon}><Icon size={24}/></span><span><strong>{g.title}</strong><small>{g.subtitle}</small><em>{g.domains.length} pistes à découvrir</em></span><ArrowRight size={20}/></button>})}<div className={c.goalDetail}><div><span>VOTRE PARCOURS RECOMMANDÉ</span><h3>{focusedGoal.title}</h3><p>{focusedGoal.subtitle}. Voici quatre thèmes utiles pour explorer la situation, sans engagement.</p></div><div>{focusedGoal.domains.map(id=>{const d=EQUIPMENT_DOMAINS.find(x=>x.id===id);return d?<button key={id} onClick={()=>showDomain(id)}><Photo src={d.art} slot={`equipment-r10.goal.${focusedGoal.id}.${id}`} alt={d.name}/><strong>{d.name}</strong><ChevronRight size={17}/></button>:null})}</div></div></div>:
    <div className={c.domainDiscovery}><div className={c.searchBar}><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Un besoin, un espace, une activité…" aria-label="Rechercher dans les 22 domaines"/></div>
     <div className={c.miniDomains}>{domainSearch.slice(0,9).map(d=><button onClick={()=>showDomain(d.id)} key={d.id}><span>{String(d.number).padStart(2,"0")}</span>{d.name}<ArrowRight size={16}/></button>)}</div>
     {domainSearch.length>9?<button className={c.moreDomains} onClick={()=>scroll("r10-atlas")}>Voir la bibliothèque complète <ArrowRight size={17}/></button>:null}
     {domainSearch.length===0?<p>Aucun domaine ne correspond à cette recherche.</p>:null}
    </div>}
   </div>
  </section>

  <section className={c.stories} id="r10-stories">
   <div className={c.sectionHeading}><span>02 / CE QUI CHANGE VRAIMENT UNE ÉCOLE</span><h2>De belles idées. <em>De vrais usages.</em></h2><p>Quatre situations que les directions connaissent bien, racontées par leurs solutions et leurs bénéfices concrets.</p></div>
   <div className={c.storyNavigator}>{R10_STORIES.map((s,i)=><button key={s.id} onClick={()=>setActiveStory(i)} aria-pressed={activeStory===i}><span>0{i+1}</span>{["Ouvrir une école","Créer une classe","Organiser l'équipe","Réussir un événement"][i]}</button>)}</div>
   <div className={c.storyHero} data-story={story.id}>
    <div className={c.storyVisual}><Photo src={story.art} slot={`equipment-r10.story.${story.id}`} alt={story.title}/><span className={c.storyBadge}><Sparkles size={15}/>{story.badge}</span></div>
    <div className={c.storyCopy}><span className={c.eyebrow}>{story.eyebrow}</span><h3>{story.title}</h3><p>{story.sub}</p>
     <div className={c.storyOutcome}><CheckCircle2 size={23}/><span><strong>Ce que cela change</strong>{story.benefit}</span></div>
     <strong className={c.minorLabel}>À DÉCOUVRIR DANS CE PARCOURS</strong>
     <div className={c.storyLinks}>{story.domains.map(id=>{const d=EQUIPMENT_DOMAINS.find(x=>x.id===id);return d?<button key={id} onClick={()=>showDomain(id)}>{d.name}<ArrowRight size={16}/></button>:null})}</div>
     <small>{story.caption} · Illustrations d'ambiance, références à vérifier dans le catalogue.</small>
    </div>
   </div>
   <div className={c.storyPagination}><button aria-label="Histoire précédente" onClick={()=>setActiveStory(v=>(v+R10_STORIES.length-1)%R10_STORIES.length)}><ArrowLeft size={17}/></button><span>{String(activeStory+1).padStart(2,"0")} / 04</span><button aria-label="Histoire suivante" onClick={()=>setActiveStory(v=>(v+1)%R10_STORIES.length)}><ArrowRight size={17}/></button></div>
  </section>

  <section className={c.mapSection} id="r10-map"><div className={c.sectionHeading}><span>03 / VISITE VISUELLE</span><h2>Promenez-vous dans <em>l'école idéale.</em></h2><p>Choisissez un espace : découvrez pourquoi il compte et quelles idées peuvent l'améliorer.</p></div>
   <div className={c.mapComposition}><div className={c.mapPhoto}><div className={c.mapTiles}>{R10_SCHOOL_HOTSPOTS.map((h,i)=><button key={h.id} type="button" className={c.mapZone} data-active={activeMap===i} aria-pressed={activeMap===i} onClick={()=>setActiveMap(i)}><Photo src={R10_THEMES[h.family].art} slot={`equipment-r10.school.zone.${h.id}`} alt={h.label}/><span><b>0{i+1}</b>{h.label}<ChevronRight size={17}/></span></button>)}</div><span className={c.mapPhotoLabel}><MousePointer2 size={15}/> 6 espaces à explorer</span></div><div className={c.mapDetails} data-theme={hotspot.family}><span>ESPACE 0{activeMap+1} / 06</span><h3>{hotspot.label}</h3><p>{hotspot.summary}</p><div className={c.mapFeature}><Photo src={R10_THEMES[hotspot.family].art} slot={`equipment-r10.map.detail.${hotspot.family}`} alt={hotspot.label}/></div>
    <strong>{domainForHotspot?.name}</strong><small>{domainForHotspot?.short}</small><button onClick={()=>showDomain(hotspot.id)}>Découvrir les idées de cet espace <ArrowRight size={17}/></button>
   </div></div>
  </section>

  <section className={c.universes} id="r10-universes">
   <div className={c.sectionHeading}><span>04 / SIX UNIVERS QUI ONT CHACUN LEUR PERSONNALITÉ</span><h2>À chaque besoin, <em>un monde à explorer.</em></h2><p>Pas six copies d'une même fiche : six histoires, six ambiances et 22 portes d'entrée vers des solutions concrètes.</p></div>
   <div className={c.universeGrid}>{THEMES.map((f,i)=>{const Icon=ICONS[f.id];const domains=EQUIPMENT_DOMAINS.filter(d=>d.group===f.id);return <article key={f.id} id={`r10-universes-${f.id}`} className={c.universeCard} data-theme={f.id} style={{background:f.color}}>
    <div className={c.universeImage}><Photo src={f.art} slot={`equipment-r10.universe.${f.id}`} alt={f.label}/><span>{f.badge}</span></div>
    <div className={c.universeBody}><div className={c.universeLead}><span style={{color:f.ink}}><Icon size={21}/>{String(i+1).padStart(2,"0")} / 06</span><h3>{f.tagline}</h3><p>{f.story}</p></div>
     <div className={c.universeBenefits}><CheckCircle2 size={17}/>{f.outcome}</div>
     <div className={c.universeTags}>{domains.map(d=><button key={d.id} onClick={()=>showDomain(d.id)}>{d.name}<ChevronRight size={13}/></button>)}</div>
    </div>
   </article>})}</div>
  </section>

  <section className={c.atlas} id="r10-atlas">
   <div className={c.atlasHead}><div><span className={c.eyebrow}><Library size={17}/> BIBLIOTHÈQUE VISUELLE · 22 DOMAINES</span><h2>Une idée en tête ? <em>Retrouvez-la ici.</em></h2><p>Explorez les applications, sauvegardez l'inspiration, puis reliez-la à votre projet.</p></div>
   <button className={c.atlasToggle} onClick={()=>setShowAllDomains(v=>!v)}>{showAllDomains?"Vue compacte":"Afficher tous les domaines"}<Grid2X2 size={18}/></button></div>
   <div className={c.atlasControls}><div className={c.searchBar}><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un thème, un usage ou un besoin…" aria-label="Rechercher les domaines"/></div>
    <select value={atlasFamily} onChange={e=>setAtlasFamily(e.target.value as EquipmentFamilyId|"all")} aria-label="Filtrer les univers"><option value="all">Tous les univers</option>{THEMES.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
   </div>
   <div className={c.atlasGrid}>{(showAllDomains||search.trim()||atlasFamily!=="all"?domainSearch:domainSearch.slice(0,12)).map(d=><article key={d.id} className={c.atlasCard}><button className={c.atlasCardMain} onClick={()=>showDomain(d.id)}><div><Photo src={d.art} slot={`equipment-r10.atlas.${d.id}`} alt={d.name}/></div><span className={c.atlasCardText}><small>DOMAINE {String(d.number).padStart(2,"0")} · {R10_THEMES[d.group].label}</small><strong>{d.name}</strong><em>{R10_DOMAIN_LABELS[d.id]?.application||d.short}</em></span></button><button type="button" aria-label={savedSet.has(d.id)?"Retirer cette idée":"Enregistrer cette idée"} aria-pressed={savedSet.has(d.id)} className={c.saveSmall} onClick={()=>toggleIdea(d.id)}>{savedSet.has(d.id)?<BookmarkCheck size={18}/>:<Bookmark size={18}/>}</button></article>)}</div>
   {domainSearch.length===0?<p className={c.noResults}>Aucun résultat. Essayez un autre mot ou univers.</p>:null}
   {!showAllDomains&&!search.trim()&&atlasFamily==="all"?<button className={c.atlasMore} onClick={()=>setShowAllDomains(true)}>Découvrir les 22 domaines <ArrowRight size={19}/></button>:null}
  </section>

  {activeDomain&&activeProgram?<section className={c.domainFeature} id="r10-domain-experience" data-domain={activeDomain.id}>
   <div className={c.domainFeatureTop}><button className={c.backButton} onClick={closeDomain}><ArrowLeft size={18}/> Retour aux univers</button><span>EXPÉRIENCE  {String(activeDomain.number).padStart(2,"0")} / 22 · {R10_THEMES[activeDomain.group].label}</span>
    <button className={c.saveFeature} onClick={saveRelated}>{savedSet.has(activeDomain.id)?<BookmarkCheck size={17}/>:<Bookmark size={17}/>} {savedSet.has(activeDomain.id)?"Retirer des idées":"Enregistrer l'idée"}</button></div>
   <div className={c.domainFeatureHero} data-theme={activeDomain.group}><div><span>{activeProgram.eyebrow}</span><h2>{R10_DOMAIN_LABELS[activeDomain.id]?.headline||activeProgram.headline}</h2><p>{R10_DOMAIN_LABELS[activeDomain.id]?.reassurance||activeProgram.promise}</p><div className={c.featureChips}>{activeDomain.examples.map(example=><span key={example}><CheckCircle2 size={14}/>{example}</span>)}</div></div><div><Photo src={activeDomain.art} slot={`equipment-r10.feature.${activeDomain.id}`} alt={activeDomain.name}/></div></div>
   <div className={c.domainSceneHeader}><div><span className={c.eyebrow}>EXPLOREZ LE CONCEPT</span><h3>Découvrez-le en situation.</h3><p>{activeProgram.scenario}</p></div><div className={c.domainSceneNote}><Info size={17}/> Concept illustratif : disponibilité, variantes et tarifs restent dans les offres publiées.</div></div>
   <div className={demos.root}><R9InteractiveScene program={activeProgram} domain={activeDomain} pref={activePref}
    choose={choice=>updatePref({choice})} flip={flipped} setFlip={setFlipped} checks={demoChecks} toggleCheck={index=>setDemoChecks(v=>v.map((n,i)=>i===index?!n:n))}/></div>
   <div className={c.domainApplications}><div><span>À QUOI CELA SERT CONCRÈTEMENT ?</span><h3>{activeProgram.value}</h3><p>{activeDomain.solution}</p></div><div><span>IDÉES D'APPLICATION</span>{activeDomain.examples.map(x=><p key={x}><CheckCircle2 size={17}/>{x}</p>)}</div></div>
   <div className={c.domainFollow}><div><strong>Pour aller plus loin</strong><p>D'autres domaines peuvent compléter cette idée, sans créer un lot fictif ni forcer une demande de devis.</p></div>{activeProgram.recommendations.map(id=>{const related=EQUIPMENT_DOMAINS.find(d=>d.id===id);return related?<button key={id} onClick={()=>showDomain(id)}><Photo src={related.art} slot={`equipment-r10.related.${activeDomain.id}.${related.id}`} alt={related.name}/><span>{related.name}</span><ChevronRight size={16}/></button>:null})}</div>
   <div className={c.domainFoot}><button onClick={()=>toggleIdea(activeDomain.id)}>{savedSet.has(activeDomain.id)?<BookmarkCheck size={18}/>:<Bookmark size={18}/>} {savedSet.has(activeDomain.id)?"Retirer des idées":"Garder cette idée"}</button><button onClick={()=>onSelect(equipmentDomainSelection(activeDomain))}>{selectedDomainIds.has(activeDomain.id)?<Check size={17}/>:<Plus size={17}/>} {selectedDomainIds.has(activeDomain.id)?"Retirer du projet":"Ajouter à ma sélection"}</button><button onClick={onExplore}><Package size={18}/> Voir les offres publiées</button><button onClick={()=>setShowTechnical(v=>!v)}><SlidersHorizontal size={17}/>{showTechnical?"Masquer les détails":"Préciser un besoin"}<ChevronDown size={16}/></button></div>
   {showTechnical?<div className={c.technicalFields}><p>Facultatif : précisez un besoin uniquement pour enrichir votre brief, pas pour créer une commande.</p>
    <label>Tranche d'âge<select value={activePref.age} onChange={e=>updatePref({age:e.target.value})}><option value="">À préciser</option>{["1–2 ans","3–4 ans","5–6 ans","Multi-âges"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Format ou contexte<input value={activePref.format} onChange={e=>updatePref({format:e.target.value.slice(0,75)})} placeholder="Lieu, format, thème…"/></label>
    <label>Note utile<input value={activePref.note} onChange={e=>updatePref({note:e.target.value.slice(0,180)})} placeholder="Détail à préciser"/></label>
   </div>:null}
  </section>:null}

  <section className={c.collection} id="r10-collection">
   <div><span className={c.eyebrow}><BookmarkCheck size={17}/> MA COLLECTION D'INSPIRATIONS</span><h2>Votre école prend forme, <em>une idée à la fois.</em></h2><p>Enregistrez les inspirations qui vous intéressent, puis sélectionnez les domaines utiles au projet. Rien n'est commandé automatiquement.</p></div>
   <div className={c.collectionTags}>{savedIdeas.length||selectedDomainIds.size?[...new Set([...savedIdeas,...selectedDomainIds])].map(id=>{const d=EQUIPMENT_DOMAINS.find(x=>x.id===id);return d?<button key={id} onClick={()=>showDomain(id)}><Bookmark size={13}/>{d.name}<ChevronRight size={14}/></button>:null}):<div className={c.emptyCollection}><Images size={27}/><strong>Votre collection commence avec une idée.</strong><span>Visitez un univers, explorez un domaine et enregistrez ce qui vous plaît.</span></div>}</div>
   <div className={c.collectionActions}><button onClick={onReview}><Layers3 size={18}/> Voir ma sélection native ({selected.length})</button><button onClick={onExplore}><Package size={18}/> Revoir les produits</button><button onClick={()=>onContact({subject:"Équipements · Projet d'établissement"})}><Send size={17}/> Préparer mon projet</button></div>
  </section>
  <section className={c.closing}><div><Photo src="welcome" slot="equipment-r10.closing" alt="Établissement préscolaire lumineux et accueillant"/></div><div><span>ANGELCARE · À VOTRE CÔTÉ</span><h2>Des idées pour aujourd'hui. <em>Une école plus forte demain.</em></h2><p>Inspirez-vous, explorez et gardez ce qui vous correspond. Notre équipe vous aide ensuite à transformer vos besoins en une demande concrète.</p><button onClick={()=>onContact({subject:"Équipements · Projet d'établissement"})}>Parler de mon projet <ArrowRight size={19}/></button></div></section>
 </div>;
}
