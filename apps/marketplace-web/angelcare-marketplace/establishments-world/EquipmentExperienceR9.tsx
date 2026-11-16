"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {ArrowRight,BookOpen,Check,CheckCircle2,ChevronRight,Compass,Layers3,Lightbulb,MapPinned,Package,School,Search,SlidersHorizontal,Sparkles,Users,BookmarkCheck,Send,RotateCcw,MousePointer2,CalendarClock,Palette,Building2,Eye,HeartHandshake} from "lucide-react";
import {ManagedImage} from "../marketplace-imagery/ManagedImage";
// R8 remains in the repository for rollback; R9 owns the commercial body exclusively.
import {EquipmentR9DomainStudio} from "./EquipmentR9DomainStudio";
import {EQUIPMENT_DOMAINS,EQUIPMENT_FAMILIES,equipmentDomainSelection,type EquipmentDomain,type EquipmentFamilyId} from "./equipment-r8-data";
import {R9_PROGRAMS,R9_SITUATIONS,R9_SPACES,R9_AGE_BANDS,emptyR9State,restoreR9State,equipmentR9Brief,type R9Preference,type R9State,type R9ProjectNeeds} from "./equipment-r9-programs";
import type {Selection} from "./model";
import c from "./EquipmentExperienceR9.module.css";
const textLocale={fr:{
 badge:"L'EXPÉRIENCE ÉQUIPEMENTS R9",title:"Imaginez l'école de demain. Construisez le projet d'aujourd'hui.",sub:"Six univers professionnels, vingt-deux parcours conçus pour les vrais besoins des équipes, une seule sélection qui devient votre projet.",
 diagnosis:"Décrivez votre établissement",description:"Trois décisions simples pour adapter votre exploration. Vous pouvez tout changer ensuite.",
 journey:"Des expériences qui répondent aux situations réelles",journeySub:"Six grandes transformations, vingt-deux domaines aux présentations et aux interactions différentes.",
 expert:"EXPLORATION MÉTIER · 22 DOMAINES",selected:"domaines sélectionnés",reference:"Découvrir les produits publiés",review:"Mon projet",contact:"Préparer la demande",privacy:"Exploration indicative : pas de prix, stock, délai ou réservation fictifs."
},en:{
 badge:"EQUIPMENT EXPERIENCE R9",title:"Imagine tomorrow's school. Plan today's improvements.",sub:"Six professional worlds, twenty-two distinct journeys and a single, persistent project selection.",
 diagnosis:"Describe your establishment",description:"Three simple choices to guide your exploration. You can change them anytime.",
 journey:"Experiences built around real school needs",journeySub:"Six transformations, twenty-two domains with genuinely different layouts and interactions.",
 expert:"PROFESSIONAL EXPLORATION · 22 DOMAINS",selected:"selected domains",reference:"See published products",review:"My project",contact:"Prepare an enquiry",privacy:"Illustrative exploration: no invented price, stock, delivery promise or booking."
},ar:{
 badge:"تجربة تجهيز المؤسسات R9",title:"تخيل مدرسة الغد. حضّر مشروع اليوم.",sub:"ستة عوالم مهنية واثنان وعشرون مساراً مختلفاً ومشروع واحد مترابط.",
 diagnosis:"صف مؤسستك",description:"ثلاثة اختيارات بسيطة لتوجيه التجربة ويمكن تغييرها لاحقاً.",
 journey:"تجارب مرتبطة باحتياجات المؤسسات الحقيقية",journeySub:"ستة مجالات كبرى واثنان وعشرون مساراً تفاعلياً مختلفاً.",
 expert:"استكشاف مهني · ٢٢ مجالاً",selected:"مجالات مختارة",reference:"العروض المنشورة",review:"مشروعي",contact:"تحضير الطلب",privacy:"عرض توضيحي دون اختلاق أسعار أو توافر أو مواعيد أو حجوزات."
}} as const;
const familyLead:Record<EquipmentFamilyId,{headline:string;message:string;caption:string;icon:typeof School}>={
 welcome:{headline:"L'accueil commence bien avant la porte de classe.",message:"Identité visible, orientation claire et première impression professionnelle.",caption:"STUDIO D'ACCUEIL & D'ADMISSIONS",icon:Building2},
 learning:{headline:"La classe devient une expérience qui guide et fait grandir.",message:"Des zones, activités et outils adaptés aux intentions pédagogiques.",caption:"LABORATOIRE D'APPRENTISSAGE",icon:BookOpen},
 parents:{headline:"Une relation qui rassure les familles à chaque étape.",message:"Admissons, communication, identité enfant et valorisation.",caption:"PARCOURS CONFIANCE FAMILLES",icon:HeartHandshake},
 operations:{headline:"Une organisation visible change la journée de l'équipe.",message:"Plannings, suivi, classement, personnalisation et références techniques.",caption:"COMMAND CENTER ÉDUCATEURS",icon:Layers3},
 routines:{headline:"Les petits gestes méritent de vrais repères.",message:"Hygiène, manipulation des routines et préparation d'activités.",caption:"PARCOURS VIE QUOTIDIENNE",icon:Sparkles},
 identity:{headline:"Une identité d'école qui marque les moments importants.",message:"Événements, photos, branding, graduation et souvenirs.",caption:"ATELIER ÉCOLE MÉMORABLE",icon:Palette}
};
const familyMedia:Record<EquipmentFamilyId,string>={welcome:"welcome",learning:"classroom",parents:"parents",operations:"administration",routines:"activities",identity:"uniforms"};
const storageKey=(scope:string)=>`ac.establishments.equipment-r9.preferences.v1:${scope}`;
const blankPreference=():R9Preference=>({choice:0,age:"",format:"",quantity:"",note:""});
export function EquipmentExperienceR9({
 locale,selected,onSelect,onReview,onContact,onExplore,onBriefChange,storageScope
}:{
 locale:"fr"|"en"|"ar";selected:string[];
 onSelect:(item:Selection)=>void;onReview:()=>void;
 onContact:(intent:{subject:string;email?:string})=>void;onExplore:()=>void;
 onBriefChange:(brief:string)=>void;storageScope:string;
}){
 const words=textLocale[locale];
 const [state,setState]=useState<R9State>(()=>emptyR9State());
 const [restored,setRestored]=useState(false);
 const [active,setActive]=useState<Record<EquipmentFamilyId,string>>({welcome:"welcome-guide",learning:"class-visuals",parents:"parent-communication",operations:"staff-tools",routines:"safety",identity:"photo-booth"});
 const [fullAtlas,setFullAtlas]=useState(false);
 const [atlasFilter,setAtlasFilter]=useState<EquipmentFamilyId|"all">("all");
 const [atlasSearch,setAtlasSearch]=useState("");
 const [diagnosticOpen,setDiagnosticOpen]=useState(true);
 const selectedKeys=useMemo(()=>new Set(selected),[selected]);
 const selectedDomains=useMemo(()=>EQUIPMENT_DOMAINS.filter(d=>selectedKeys.has(`intent:equipment-domain:${d.id}`)),[selectedKeys]);
 const selectedBrief=useMemo(()=>equipmentR9Brief(selected,state),[selected,state]);
 useEffect(()=>{try{setState(restoreR9State(sessionStorage.getItem(storageKey(storageScope))))}catch{setState(emptyR9State())}setRestored(true)},[storageScope]);
 useEffect(()=>{if(!restored)return;try{sessionStorage.setItem(storageKey(storageScope),JSON.stringify(state))}catch{}},[state,storageScope,restored]);
 useEffect(()=>onBriefChange(selectedBrief),[selectedBrief,onBriefChange]);
 const updateNeeds=(patch:Partial<R9ProjectNeeds>)=>setState(previous=>({...previous,needs:{...previous.needs,...patch}}));
 const updatePreference=(id:string,patch:Partial<R9Preference>)=>setState(previous=>({...previous,preferences:{...previous.preferences,[id]:{...blankPreference(),...previous.preferences[id],...patch}}}));
 const chooseDomain=useCallback((domain:EquipmentDomain)=>{
  setActive(previous=>({...previous,[domain.group]:domain.id}));
  const target=`r9-family-${domain.group}`;
  requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({block:"start",behavior:"smooth"}));
 },[]);
 const familyCount=(id:EquipmentFamilyId)=>selectedDomains.filter(d=>d.group===id).length;
 const request=(name?:string)=>onContact({subject:(name?`Équipements · ${name}`:"Équipements · Projet personnalisé").slice(0,220)});
 const allAtlas=useMemo(()=>EQUIPMENT_DOMAINS.filter(d=>(atlasFilter==="all"||atlasFilter===d.group)&&(`${d.name} ${d.short} ${d.pain}`.toLowerCase().includes(atlasSearch.toLowerCase()))),[atlasFilter,atlasSearch]);
 const filteredAtlas=fullAtlas?allAtlas:allAtlas.slice(0,12);
 const customDomainExperience=<div className={c.r9Section} data-equipment-experience="R9" id="r9-experience" lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
  <section className={c.r9Masthead}>
   <div><span className={c.miniOverline}><Sparkles size={16}/>{words.badge}</span><h2>{words.title}</h2><p>{words.sub}</p>
    <div className={c.mastheadMetrics}><span><strong>06</strong> Univers métiers</span><span><strong>22</strong> Parcours uniques</span><span><strong>{selectedDomains.length}</strong> {words.selected}</span></div>
   </div>
   <div className={c.mastheadImages}><ManagedImage slot="equipment-r9.masthead.classroom" src="/angelcare-marketplace/establishments-r2/classroom.png" width={620} height={440} alt="Classe éducative et espaces d'apprentissage" loading="lazy"/><ManagedImage slot="equipment-r9.masthead.staff" src="/angelcare-marketplace/establishments-r2/os-team.png" width={460} height={420} alt="Équipe scolaire organisée" loading="lazy"/></div>
  </section>

  <section className={c.diagnostic}>
   <div className={c.diagnosticHead}><div><span className={c.eyebrow}><Compass size={16}/> DISCOVERY STUDIO · SITUATION</span><h3>{words.diagnosis}</h3><p>{words.description}</p></div><button type="button" aria-expanded={diagnosticOpen} onClick={()=>setDiagnosticOpen(v=>!v)}><SlidersHorizontal size={17}/>{diagnosticOpen?"Réduire":"Personnaliser"}</button></div>
   {diagnosticOpen?<div className={c.diagnosticFields}>
    <label>Votre situation<select value={state.needs.situation} onChange={e=>updateNeeds({situation:e.target.value})}>{R9_SITUATIONS.map(v=><option key={v}>{v}</option>)}</select></label>
    <label>L'espace à équiper<select value={state.needs.space} onChange={e=>updateNeeds({space:e.target.value})}>{R9_SPACES.map(v=><option key={v}>{v}</option>)}</select></label>
    <label>Public / âge<select value={state.needs.age} onChange={e=>updateNeeds({age:e.target.value})}>{R9_AGE_BANDS.map(v=><option key={v}>{v}</option>)}</select></label>
    <label>Priorité commerciale<input value={state.needs.priority} onChange={e=>updateNeeds({priority:e.target.value.slice(0,100)})} placeholder="Ex. harmoniser trois salles"/></label>
    <label>Échéance souhaitée<input value={state.needs.deadline} onChange={e=>updateNeeds({deadline:e.target.value.slice(0,100)})} placeholder="Ex. avant la rentrée"/></label>
    <label>Ambiance<select value={state.needs.style} onChange={e=>updateNeeds({style:e.target.value})}>{["Clair & chaleureux","Coloré & ludique","Naturel & Montessori","Premium & institutionnel"].map(v=><option key={v}>{v}</option>)}</select></label>
   </div>:null}
   <div className={c.diagnosticBottom}><span><CheckCircle2 size={17}/> Votre sélection reste sous votre contrôle, sans réservation ni prix simulé.</span><button type="button" onClick={()=>document.getElementById("r9-family-learning")?.scrollIntoView({block:"start",behavior:"smooth"})}>Explorer les parcours <ArrowRight size={17}/></button></div>
  </section>

  <section id="r8-domains" className={c.r9Navigation} aria-label="Navigation dans les univers professionnels">
   <div><span className={c.eyebrow}>{words.expert}</span><h3>{words.journey}</h3><p>{words.journeySub}</p></div>
   <div className={c.familyJump}>{EQUIPMENT_FAMILIES.map(f=>{const Icon=familyLead[f.id].icon;return <button key={f.id} type="button" onClick={()=>document.getElementById(`r9-family-${f.id}`)?.scrollIntoView({block:"start",behavior:"smooth"})}><Icon size={19}/><span>{f.title}</span><small>{EQUIPMENT_DOMAINS.filter(d=>d.group===f.id).length} domaines</small></button>})}</div>
  </section>

  {EQUIPMENT_FAMILIES.map((f,index)=>{
   const groupDomains=EQUIPMENT_DOMAINS.filter(d=>d.group===f.id);
   const selectedDomain=groupDomains.find(d=>d.id===active[f.id])||groupDomains[0];
   const program=R9_PROGRAMS.find(p=>p.id===selectedDomain.id)!;
   const IntroIcon=familyLead[f.id].icon;
   return <section key={f.id} className={c.familyChapter} id={`r9-family-${f.id}`} data-family-layout={f.id}>
    <header className={c.familyChapterHeader}>
     <div className={c.familyChapterLabel}><span>UNIVERS {String(index+1).padStart(2,"0")} / 06</span><IntroIcon size={23}/></div>
     <div><h2>{familyLead[f.id].headline}</h2><p>{familyLead[f.id].message}</p><small>{familyLead[f.id].caption}</small></div>
     <div className={c.familyChapterImage}><ManagedImage slot={`equipment-r9.family.${f.id}`} src={`/angelcare-marketplace/establishments-r2/${familyMedia[f.id]}.png`} width={680} height={450} loading="lazy" alt={f.title}/></div>
    </header>
    <nav className={c.domainTabs} aria-label={`Explorer les domaines : ${f.title}`}>
     {groupDomains.map(d=><button type="button" key={d.id} data-selected={d.id===selectedDomain.id} onClick={()=>setActive(prev=>({...prev,[f.id]:d.id}))}>
      <span>{String(d.number).padStart(2,"0")}</span>{d.name}{selectedKeys.has(`intent:equipment-domain:${d.id}`)?<CheckCircle2 size={15}/>:null}
     </button>)}
    </nav>
    <EquipmentR9DomainStudio
     key={selectedDomain.id} domain={selectedDomain} program={program}
     pref={state.preferences[selectedDomain.id]||blankPreference()}
     selected={selectedKeys.has(`intent:equipment-domain:${selectedDomain.id}`)}
     onPref={patch=>updatePreference(selectedDomain.id,patch)}
     onSelect={()=>onSelect(equipmentDomainSelection(selectedDomain))}
     onChooseRelated={id=>{const d=EQUIPMENT_DOMAINS.find(d=>d.id===id);if(d)chooseDomain(d)}}
     onExplore={onExplore}
     onContact={()=>request(selectedDomain.name)}
     locale={locale}
    />
    <div className={c.chapterFooter}><span>{familyCount(f.id)} domaines de cet univers dans le projet</span><button type="button" onClick={()=>onReview()}><BookmarkCheck size={17}/> Revoir mon projet</button><button type="button" onClick={()=>request(selectedDomain.name)}>Préparer une proposition <ArrowRight size={17}/></button></div>
   </section>
  })}
  <section className={c.atlas} id="r9-atlas"><div className={c.atlasIntro}><div><span className={c.eyebrow}>BIBLIOTHÈQUE DES UNIVERS · 22/22</span><h2>Tout l'équipement, toutes les problématiques.</h2><p>Retrouvez chaque domaine pour poursuivre le scénario professionnel de votre choix.</p></div><button type="button" onClick={()=>setFullAtlas(v=>!v)}><Layers3 size={17}/>{fullAtlas?"Vue courte":"Afficher les 22 domaines"}</button></div>
   <div className={c.atlasFilters}><label><Search size={16}/><input value={atlasSearch} onChange={e=>setAtlasSearch(e.target.value)} placeholder="Chercher un domaine, un usage…"/></label><select value={atlasFilter} onChange={e=>setAtlasFilter(e.target.value as EquipmentFamilyId|"all")}><option value="all">Tous les univers</option>{EQUIPMENT_FAMILIES.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select></div>
   <div className={c.atlasGrid}>{filteredAtlas.map(d=><button type="button" key={d.id} onClick={()=>chooseDomain(d)}><ManagedImage slot={`equipment-r9.atlas.${d.id}`} src={`/angelcare-marketplace/establishments-r2/${d.art}.png`} alt={d.name} width={300} height={190} loading="lazy"/><span><small>{String(d.number).padStart(2,"0")} / 22</small><strong>{d.name}</strong><ChevronRight size={16}/></span></button>)}</div>
   {filteredAtlas.length===0?<p className={c.noResults}>Aucun résultat dans cette sélection.</p>:null}
  </section>
  <section className={c.r9Project} id="r9-project">
   <div><span className={c.eyebrow}><BookmarkCheck size={16}/> PROJET 360</span><h2>Vos choix composent une seule demande cohérente.</h2><p>{state.needs.situation} · {state.needs.space} · {state.needs.age}. Les préférences, domaines et références natives restent distincts.</p></div>
   <div className={c.r9ProjectTags}>{selectedDomains.length?selectedDomains.map(d=><button type="button" key={d.id} onClick={()=>onSelect(equipmentDomainSelection(d))}>{d.name}<Check size={14}/></button>):<span>Explorez un domaine pour ajouter vos besoins.</span>}</div>
   <div className={c.r9ProjectActions}><button type="button" onClick={onReview}><Layers3 size={17}/> {words.review}</button><button type="button" onClick={onExplore}><Eye size={17}/> {words.reference}</button><button type="button" onClick={()=>request()}><Send size={17}/> {words.contact}</button></div><small>{words.privacy}</small>
  </section>
 </div>;
 return customDomainExperience;
}
