"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {
 ArrowRight,ArrowLeft,ChevronRight,ChevronDown,Check,CheckCircle2,
 Search,HeartHandshake,GraduationCap,School,Boxes,ShieldCheck,ClipboardCheck,
 Sparkles,LayoutGrid,BookmarkCheck,Layers3,Palette,Send,Package,
 SlidersHorizontal,X,Plus,Eye,BookOpen,MessageSquareHeart,Truck,Handshake,
 Award,Settings2,PlayCircle,Star,MapPin,Users,CalendarDays,Heart
} from "lucide-react";
import {CampaignImage} from "./CommercialJourney";
import {ManagedImage} from "../marketplace-imagery/ManagedImage";
import {usePartner} from "./partner/Locale";
import {EQUIPMENT_DOMAINS,EQUIPMENT_FAMILIES,equipmentDomainSelection,type EquipmentDomain,type EquipmentFamilyId} from "./equipment-r8-data";
import type {Selection} from "./model";
import c from "./EquipmentExperienceR8.module.css";

const FAMILY_ICONS={welcome:School,learning:Boxes,parents:HeartHandshake,operations:ClipboardCheck,routines:Sparkles,identity:GraduationCap};
const NAV_ITEMS=[
 {id:"r8-families",label:"Nos 6 familles",icon:Layers3},
 {id:"r8-domains",label:"Les 22 domaines",icon:LayoutGrid},
 {id:"ew-native-explorer",label:"Catalogue produits",icon:Package},
 {id:"r8-showroom",label:"Idées d'aménagement",icon:Palette},
 {id:"r8-project",label:"Mon projet",icon:BookmarkCheck},
 {id:"r8-enquiry",label:"Demande de devis",icon:Send}
];
const SHOWROOM=[
 {id:"welcome",title:"L'accueil qui rassure dès les premiers pas",eyebrow:"01 / VISITE VIRTUELLE · ACCUEIL",image:"welcome",intro:"Votre premier espace dit beaucoup : entrée lisible, identité assumée et familles orientées.",pain:"Un visiteur hésitant, des panneaux improvisés et des inscriptions difficiles à trouver.",solution:"Panneaux d'accueil, orientation, grands formats et packs portes ouvertes conçus comme un ensemble.",hotspots:[
  {id:"reception",x:31,y:44,label:"Bienvenue & identité"},
  {id:"large-format",x:67,y:31,label:"Signalétique visible"},
  {id:"open-day",x:76,y:70,label:"Parcours admissions"}]},
 {id:"learning",title:"Une classe pensée pour que l'enfant explore",eyebrow:"02 / EXPLORER LA CLASSE",image:"classroom",intro:"Chaque zone a un rôle : manipuler, découvrir, ranger, nommer et créer avec autonomie.",pain:"Des supports disparates et des espaces qui changent de fonction sans repère.",solution:"Visuels de classe, supports imprimables, flashcards et manipulation coordonnés.",hotspots:[
  {id:"class-visuals",x:22,y:27,label:"Affichage pédagogique"},
  {id:"montessori",x:57,y:68,label:"Manipulation"},
  {id:"printables",x:80,y:43,label:"Atelier imprimables"}]},
 {id:"parents",title:"Les familles comprennent mieux chaque journée",eyebrow:"03 / PARCOURS DE CONFIANCE",image:"parents",intro:"Une relation qui commence à l'inscription et continue avec une information claire.",pain:"Des messages dispersés et des apprentissages difficiles à faire connaître.",solution:"Supports parents, signalétique, badges et reconnaissance des progrès.",hotspots:[
  {id:"parent-communication",x:24,y:44,label:"Mémo parents"},
  {id:"child-identity",x:55,y:22,label:"Identité enfant"},
  {id:"certificates",x:82,y:65,label:"Valorisation"}]},
 {id:"operations",title:"Une équipe qui partage les mêmes repères",eyebrow:"04 / TABLEAU DE BORD ÉQUIPE",image:"administration",intro:"Plannings, consignes, étiquettes et outils de suivi deviennent lisibles sur le terrain.",pain:"Les informations ne circulent qu'à l'oral, et les remplacements deviennent difficiles.",solution:"Checklists, labels, fiches techniques et préparation de commande centralisées.",hotspots:[
  {id:"staff-tools",x:20,y:64,label:"Planning équipe"},
  {id:"labelling",x:53,y:29,label:"Zonage & rangement"},
  {id:"technical",x:79,y:60,label:"Référentiel"}]},
 {id:"routines",title:"Des routines simples, visibles et rassurantes",eyebrow:"05 / VIE QUOTIDIENNE",image:"activities",intro:"Un cadre visuel cohérent pour l'hygiène, les activités et les journées à thème.",pain:"Les gestes importants et les préparatifs des petits événements dépendent de la mémoire de chacun.",solution:"Visuels de sécurité, kits d'activité et repères saisonniers adaptés.",hotspots:[
  {id:"safety",x:28,y:25,label:"Hygiène & sécurité"},
  {id:"activity-boxes",x:62,y:62,label:"Boîtes d'activités"},
  {id:"seasonal",x:83,y:30,label:"Temps forts"}]},
 {id:"identity",title:"Votre signature dans chaque moment important",eyebrow:"06 / ÉCOLE MÉMORABLE",image:"uniforms",intro:"Tenues, cérémonies, décors et souvenirs expriment un même univers.",pain:"Les supports d'image et de cérémonie s'accumulent sans continuité esthétique.",solution:"Branding, graduation, photo booths et supports partenaires préparés ensemble.",hotspots:[
  {id:"graduation",x:33,y:31,label:"Graduation"},
  {id:"event-branding",x:60,y:61,label:"Branding scolaire"},
  {id:"partner-branding",x:83,y:25,label:"Identité partenaire"}]}
] as const;
const TRUST=[
 {icon:Layers3,title:"Une offre complète",text:"Un seul partenaire pour relier vos espaces."},
 {icon:ShieldCheck,title:"Qualité & durabilité",text:"Formats et conditions à confirmer selon l'offre."},
 {icon:Users,title:"Accompagnement expert",text:"Conseil, choix et suivi du projet."},
 {icon:Palette,title:"Personnalisation",text:"À vos couleurs, à votre image."},
 {icon:Truck,title:"Livraison & installation",text:"Selon l'offre et le territoire."},
 {icon:Handshake,title:"Partenariat durable",text:"Un suivi dans le temps de vos besoins."}
];
const STEPS=[
 {title:"Vous nous décrivez le projet",text:"Vos lieux, publics, priorité et situation actuelle."},
 {title:"Nous relions les domaines",text:"Chaque besoin est associé à des applications cohérentes."},
 {title:"Vous examinez les références",text:"Prix, variantes et disponibilités viennent du catalogue publié."},
 {title:"La proposition se précise",text:"Formats, quantités, personnalisation et délais sont confirmés avant engagement."}
];
const getDomain=(id:string)=>EQUIPMENT_DOMAINS.find(d=>d.id===id);
const toOfferBrief=(domains:EquipmentDomain[])=>domains.length?
 `Équipements AngelCare · domaines : ${domains.map(d=>d.name).join(" · ")}. Demande de proposition à préciser.`:
 "Équipements AngelCare · demande de proposition personnalisée";

/** R8 follows the approved visual reference: six illustrated families, 22 real domains,
 * one immersive explorable showroom, a persistent native project and canonical enquiry.
 * No synthetic products, inventory or prices are ever created here.
 */
export function EquipmentExperienceR8({
 selected,onSelect,onReview,onContact,onExplore,locale
}:{
 selected:string[];
 onSelect:(item:Selection)=>void;
 onReview:()=>void;
 onContact:(intent:{subject:string;email?:string})=>void;
 onExplore:()=>void;
 locale:"fr"|"en"|"ar";
}){
 const {t}=usePartner();
 const [family,setFamily]=useState<EquipmentFamilyId|"all">("all");
 const [search,setSearch]=useState("");
 const [allDomains,setAllDomains]=useState(false);
 const [activeDomain,setActiveDomain]=useState<EquipmentDomain|null>(null);
 const [slide,setSlide]=useState(0);
 const [hotspot,setHotspot]=useState(0);
 const [scenario,setScenario]=useState(0);
 const [faq,setFaq]=useState<number|null>(null);
 const closeRef=useRef<HTMLButtonElement|null>(null);
 const returnFocus=useRef<HTMLElement|null>(null);
 const selectedDomainIds=useMemo(()=>new Set(selected.filter(x=>x.startsWith("intent:equipment-domain:")).map(x=>x.replace("intent:equipment-domain:",""))),[selected]);
 const selectedDomains=useMemo(()=>EQUIPMENT_DOMAINS.filter(x=>selectedDomainIds.has(x.id)),[selectedDomainIds]);
 const filtered=useMemo(()=>EQUIPMENT_DOMAINS.filter(x=>(family==="all"||x.group===family)&&(!search.trim()||(`${x.name} ${x.short} ${x.pain} ${x.solution}`).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()))),[family,search]);
 const visible=family!=="all"||allDomains||search.trim()?filtered:filtered.slice(0,12);
 const current=SHOWROOM[slide],activeHotspot=current.hotspots[hotspot]||current.hotspots[0],highlight=getDomain(activeHotspot.id);
 const move=(direction:number)=>{setSlide(v=>(v+direction+SHOWROOM.length)%SHOWROOM.length);setHotspot(0)};
 const scroll=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
 const chooseFamily=(id:EquipmentFamilyId|"all")=>{
  setFamily(id);setAllDomains(id==="all");requestAnimationFrame(()=>scroll("r8-domains"));
 };
 const openDomain=(domain:EquipmentDomain)=>{returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setActiveDomain(domain)};
 const closeDomain=useCallback(()=>{setActiveDomain(null);requestAnimationFrame(()=>returnFocus.current?.focus())},[]);
 useEffect(()=>{if(!activeDomain)return;closeRef.current?.focus();const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")closeDomain()};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[activeDomain,closeDomain]);
 const toggle=(domain:EquipmentDomain)=>onSelect(equipmentDomainSelection(domain));
 const request=(domain?:EquipmentDomain)=>onContact({subject:toOfferBrief(domain?[domain]:selectedDomains)});
 return <div className={c.root} lang={locale} dir={locale==="ar"?"rtl":"ltr"} data-equipment-experience="R8" data-visual-authority="approved-2026-11-16" id="r8-start">
   <nav className={c.quickNav} aria-label={t("Accès rapide aux solutions")}>
    <strong>Accès rapide :</strong>
    {NAV_ITEMS.map(({id,label,icon:Icon})=><button type="button" key={id} onClick={()=>id==="ew-native-explorer"?onExplore():id==="r8-enquiry"?request():id==="r8-project"?onReview():scroll(id)}>
     <Icon size={17}/>{t(label)}
    </button>)}
   </nav>

   <section id="r8-families" className={c.families}>
    <div className={c.sectionTitle}><p className={c.eyebrow}>L’UNIVERS ANGELCARE ÉCOLE · SOLUTIONS CONNECTÉES</p><h2><em>6 familles</em> de solutions pour un établissement complet</h2><p>Une approche globale et connectée pour répondre aux besoins réels de votre établissement.</p></div>
    <div className={c.familyGrid}>
     {EQUIPMENT_FAMILIES.map(item=>{const Icon=FAMILY_ICONS[item.id];return <button type="button" className={c.familyCard} key={item.id} onClick={()=>chooseFamily(item.id)} aria-label={`Explorer ${item.title}`}>
       <div className={c.familyPhoto}><CampaignImage name={item.image} alt={`Illustration d’ambiance · ${item.title}`}/></div>
       <span className={c.familyIcon}><Icon size={22}/></span>
       <h3>{t(item.title)}</h3><p>{t(item.subtitle)}</p><span className={c.roundArrow}><ArrowRight size={19}/></span>
      </button>})}
    </div>
   </section>

   <section id="r8-domains" className={c.domains}>
    <div className={c.sectionTitle}><p className={c.eyebrow}>PAR DOMAINE · CATÉGORIES RÉELLES DU CATALOGUE</p>
     <h2>Le parcours par domaines — <em>22 solutions</em> pour concrétiser vos projets</h2>
     <p>Choisissez un sujet, ouvrez ses applications et reliez-le au brief. Les références publiées restent dans le catalogue natif.</p>
    </div>
    <div className={c.domainTools}>
     <div className={c.filters} role="group" aria-label="Filtrer les domaines">
      <button type="button" aria-pressed={family==="all"} className={family==="all"?c.active:""} onClick={()=>{setFamily("all");setAllDomains(true)}}>Tous les domaines (22)</button>
      {EQUIPMENT_FAMILIES.map(group=>{const Icon=FAMILY_ICONS[group.id];return <button type="button" key={group.id} aria-pressed={family===group.id} className={family===group.id?c.active:""} onClick={()=>{setFamily(group.id);setAllDomains(true)}}><Icon size={15}/>{t(group.title)} ({EQUIPMENT_DOMAINS.filter(d=>d.group===group.id).length})</button>})}
     </div>
     <label className={c.domainSearch}><Search size={16}/><span className={c.srOnly}>Rechercher dans les domaines</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un besoin, une solution…" /></label>
    </div>
    <div className={c.domainGrid} aria-live="polite">
     {visible.map(domain=><button type="button" key={domain.id} className={c.domainCard} onClick={()=>openDomain(domain)}>
       <span className={c.domainPhoto}><ManagedImage slot={`journey-r8.domain.${domain.id}`} src={`/angelcare-marketplace/establishments-r2/${domain.art}.png`} width={640} height={420} loading="lazy" decoding="async" alt={`Application illustrative : ${domain.name}`}/></span>
       <span className={c.domainBottom}><span className={c.domainMark}><BookOpen size={17}/></span><span><strong>{t(domain.name)}</strong><small>{t(domain.short)}</small></span>{selectedDomainIds.has(domain.id)?<CheckCircle2 className={c.selectedCheck} size={17}/>:<ChevronRight size={16}/>}</span>
      </button>)}
    </div>
    {filtered.length===0?<p className={c.empty}>Aucun domaine trouvé. Effacez la recherche ou choisissez une autre famille.</p>:null}
    {family==="all"&&!search&&!allDomains?<button className={c.allButton} onClick={()=>setAllDomains(true)}>Voir les 22 domaines complets <ArrowRight size={17}/></button>:null}
    {family!=="all"?<button className={c.allButton} onClick={()=>{setFamily("all");setAllDomains(true)}}>Revenir aux 22 domaines <ArrowRight size={17}/></button>:null}
   </section>

   <section id="r8-showroom" className={c.showroom} aria-label="Showroom immersif des équipements">
    <div className={c.showroomIntro}>
     <span className={c.pinkPill}>Showroom immersif</span>
     <h2>Découvrez nos univers <em>en situation réelle</em></h2>
     <p>Des espaces aménagés, interactifs et inspirants pour visualiser concrètement vos projets.</p>
     <ul><li><CheckCircle2 size={16}/> Se projeter dans vos espaces</li><li><CheckCircle2 size={16}/> Explorer les aménagements possibles</li><li><CheckCircle2 size={16}/> Découvrir des combinaisons d’équipements</li><li><CheckCircle2 size={16}/> Identifier des solutions adaptées à votre établissement</li></ul>
     <button className={c.primary} onClick={()=>openDomain(highlight||EQUIPMENT_DOMAINS[0])}>Explorer le showroom <ArrowRight size={17}/></button>
     <span className={c.sceneIndex}>VISITE {String(slide+1).padStart(2,"0")} / 06 · {current.eyebrow}</span>
    </div>
    <div className={c.showroomGallery}>
     <div className={c.galleryPhoto} key={current.id}>
      <CampaignImage name={current.image} alt={`Showroom pédagogique : ${current.title}`}/>
      {current.hotspots.map((point,i)=><button type="button" key={point.id} className={c.hotspot} data-active={hotspot===i} style={{left:point.x+"%",top:point.y+"%"}} onClick={()=>setHotspot(i)} aria-label={`Explorer ${point.label}`}><span><Plus size={18}/></span><strong>{point.label}</strong></button>)}
      <button type="button" className={c.galleryPrev} onClick={()=>move(-1)} aria-label="Showroom précédent"><ArrowLeft size={21}/></button>
      <button type="button" className={c.galleryNext} onClick={()=>move(1)} aria-label="Showroom suivant"><ArrowRight size={21}/></button>
     </div>
     <div className={c.galleryDetails} role="status">
      <div><span>{current.eyebrow}</span><h3>{current.title}</h3><p>{current.intro}</p></div>
      <div className={c.galleryProblem}><b>Le problème à résoudre</b><p>{current.pain}</p></div>
      <div className={c.gallerySolution}><b>Notre réponse coordonnée</b><p>{current.solution}</p></div>
      {highlight?<button type="button" onClick={()=>openDomain(highlight)}><Eye size={16}/> Voir {highlight.name} <ArrowRight size={16}/></button>:null}
     </div>
     <div className={c.galleryDots} aria-label="Choisir un univers du showroom">{SHOWROOM.map((item,i)=><button key={item.id} aria-label={item.eyebrow} aria-current={i===slide?"true":undefined} onClick={()=>{setSlide(i);setHotspot(0)}} className={i===slide?c.currentDot:""}/>)}</div>
    </div>
   </section>

   <section className={c.trust}>
    <div className={c.sectionTitle}><h2>Pourquoi les établissements choisissent AngelCare ?</h2><p>Un projet cohérent, du premier repère jusqu’à sa mise en place.</p></div>
    <div className={c.trustGrid}>{TRUST.map(({icon:Icon,title,text})=><div key={title}><Icon size={28}/><h3>{t(title)}</h3><p>{t(text)}</p></div>)}</div>
   </section>

   <section className={c.ctaTwin} aria-label="Démarrer un projet ou demander un devis">
    <div className={c.consultingCta}>
     <div className={c.ctaPhoto}><CampaignImage name="academy" alt="Professionnelle petite enfance et équipe de direction"/></div>
     <div><span className={c.miniEyebrow}>PROJET D’ÉTABLISSEMENT</span><h2>Un projet d’aménagement ou d’équipement ?</h2><p>Reliez vos domaines à votre contexte avant de choisir les références et les formats.</p><button onClick={()=>request()}>Démarrer mon projet <ArrowRight size={16}/></button></div>
    </div>
    <div className={c.quoteCta}>
     <FileTextIcon/><div><span className={c.miniEyebrow}>PROPOSITION PERSONNALISÉE</span><h2>Demande de devis rapide</h2><p>Décrivez votre besoin. Votre demande sera transmise aux équipes via le formulaire existant.</p><button onClick={()=>request()}>Demander un devis <ArrowRight size={16}/></button></div>
     <div className={c.ctaSidePhoto}><CampaignImage name="products-hero" alt="Supports scolaires et matériel pédagogique"/></div>
    </div>
   </section>

   <section id="r8-project" className={c.project}>
    <div><span className={c.eyebrow}>MON PROJET · UNE SEULE SÉLECTION</span><h2>Votre projet prend forme, domaine après domaine.</h2><p>{selectedDomains.length? `${selectedDomains.length} domaines d’intérêt ajoutés. Votre sélection des offres réelles reste conservée.`:"Explorez les domaines, associez les besoins et préparez un brief utile pour la direction."}</p></div>
    <div className={c.projectSelection}>{selectedDomains.length?selectedDomains.map(d=><button type="button" key={d.id} onClick={()=>toggle(d)} title="Retirer du projet">{d.name} <X size={14}/></button>):<span>Aucun domaine ajouté pour l’instant.</span>}</div>
    <div className={c.projectActions}><button type="button" className={c.secondary} onClick={onReview}><Layers3 size={17}/> Ma sélection ({selected.length})</button><button type="button" className={c.primary} onClick={()=>request()}><Send size={16}/> Préparer mon brief</button></div>
   </section>

   <section className={c.process}>
    <div className={c.sectionTitle}><p className={c.eyebrow}>ACCOMPAGNEMENT ÉQUIPEMENTS</p><h2>De l’inspiration à une proposition cohérente.</h2></div>
    <div className={c.processGrid}>{STEPS.map((item,index)=><button key={item.title} className={scenario===index?c.processActive:""} onClick={()=>setScenario(index)} aria-pressed={scenario===index}><strong>0{index+1}</strong><h3>{item.title}</h3><p>{item.text}</p></button>)}</div>
    <div className={c.processNote}><CheckCircle2 size={18}/><span>{STEPS[scenario].text} Aucune commande, réservation ou disponibilité n’est confirmée par cette présentation.</span><button onClick={()=>request()}>Préparer la suite <ArrowRight size={15}/></button></div>
   </section>

   <section id="r8-enquiry" className={c.closing}>
    <div className={c.closingImage}><CampaignImage name="classroom" alt="Salle d'apprentissage lumineuse et équipée"/></div><div><span className={c.eyebrow}>VOTRE PROJET MÉRITE DES REPÈRES CLAIRS</span><h2>Construisons un établissement qui vous ressemble.</h2><p>22 domaines réels. Des applications complémentaires. Une demande reliée à votre sélection, avec des conditions à confirmer.</p><div className={c.closingActions}><button className={c.primary} onClick={()=>request()}>Parler de mon projet <ArrowRight size={16}/></button><button className={c.secondary} onClick={onExplore}>Voir les offres publiées <ArrowRight size={16}/></button></div></div>
   </section>

   <section className={c.faq}>
    <h2>Décidez avec des informations claires.</h2>
    {[["Les 22 domaines sont-ils tous des produits en stock ?","Non. Ce sont les univers du catalogue et des applications proposées. Seules les fiches réellement publiées dans l’explorateur indiquent une offre, un prix et une disponibilité."],["Puis-je faire personnaliser les supports ?","Les personnalisations, quantités, formats, BAT et délais sont à vérifier selon la référence et la demande."],["Est-ce que ma sélection engage une commande ?","Non. Elle prépare un brief de projet. Une commande, un devis ou une réservation exige une validation distincte."],["Puis-je combiner plusieurs domaines ?","Oui. Choisissez vos domaines d’intérêt, puis ouvrez le brief natif pour retrouver les éléments retenus."]].map(([q,a],i)=><div key={q} className={c.faqItem}><button aria-expanded={faq===i} onClick={()=>setFaq(faq===i?null:i)}>{q}<ChevronDown size={18}/></button>{faq===i?<p>{a}</p>:null}</div>)}
   </section>

   {activeDomain?<div className={c.dialogBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)closeDomain()}}>
    <section className={c.domainDialog} role="dialog" aria-modal="true" aria-labelledby="r8-domain-title">
     <div className={c.dialogImage}><CampaignImage name={activeDomain.image} alt={`Présentation visuelle · ${activeDomain.name}`}/><span>DOMAINE {String(activeDomain.number).padStart(2,"0")} / 22</span></div>
     <div className={c.dialogContent}>
      <button type="button" className={c.dialogClose} ref={closeRef} onClick={closeDomain} aria-label="Fermer la fiche domaine"><X size={23}/></button>
      <span className={c.eyebrow}>ANGELCARE SCHOOL ASSETS · UNIVERS CATALOGUE</span><h2 id="r8-domain-title">{activeDomain.name}</h2><p className={c.dialogLead}>{activeDomain.short}</p>
      <div className={c.dialogPain}><strong>Le problème du professionnel</strong><p>{activeDomain.pain}</p></div>
      <div className={c.dialogSolution}><strong>Notre réponse tout-en-un</strong><p>{activeDomain.solution}</p></div>
      <strong className={c.appTitle}>Applications à explorer</strong><div className={c.applicationList}>{activeDomain.examples.map(value=><span key={value}><CheckCircle2 size={15}/>{value}</span>)}</div>
      <p className={c.disclaimer}>Illustrations d’ambiance. Les offres, prix, options de personnalisation et délais doivent être confirmés à partir des références publiées.</p>
      <div className={c.dialogActions}><button className={c.primary} onClick={()=>toggle(activeDomain)}>{selectedDomainIds.has(activeDomain.id)?<Check size={16}/>:<Plus size={16}/>} {selectedDomainIds.has(activeDomain.id)?"Retirer du projet":"Ajouter à mon projet"}</button><button className={c.secondary} onClick={()=>{closeDomain();onExplore()}}>Voir le catalogue <ArrowRight size={16}/></button><button className={c.textLink} onClick={()=>{closeDomain();request(activeDomain)}}>Demander conseil ↗</button></div>
     </div>
    </section>
   </div>:null}
  </div>;
}

function FileTextIcon(){return <span className={c.quoteIcon}><BookmarkCheck size={38} strokeWidth={1.7}/></span>}
