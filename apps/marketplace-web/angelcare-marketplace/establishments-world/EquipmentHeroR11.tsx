"use client";
import {useEffect,useState} from "react";
import {ArrowDown,ArrowRight,BookOpen,Building2,CheckCircle2,ChevronLeft,ChevronRight,HeartHandshake,Layers3,MousePointer2,Pause,Play,ShieldCheck,Sparkles,Star} from "lucide-react";
import {CampaignImage} from "./CommercialJourney";
import {ManagedImage} from "../marketplace-imagery/ManagedImage";
import c from "./EquipmentHeroR11.module.css";
const WORDS={
fr:{eyebrow:"ANGELCARE ÉCOLE · SOLUTIONS POUR ÉTABLISSEMENTS",first:"Votre établissement parle avant même que",emph:"vous preniez la parole.",lead:"Transformez vos espaces, vos pratiques et votre identité en une expérience qui inspire les enfants, rassure les familles et valorise le travail des équipes.",explore:"Explorer les univers",offers:"Découvrir les produits",gallery:"Inspirez-vous de vrais usages",world:"Choisissez un univers à explorer",benefits:["Apprentissage & découverte","Organisation & sérénité","Confiance des familles"],scene:["La classe qui inspire","L'accueil qui rassure","L'équipe qui avance","Une identité mémorable"],captions:["Espaces pédagogiques","Première impression","Outils professionnels","Identité d'établissement"],thumbs:"Explorer les ambiances",previous:"Ambiance précédente",next:"Ambiance suivante",image:"Univers préscolaire AngelCare",contexts:["Apprentissage","Accueil","Organisation","Identité"],discover:"Voir l'univers"},
en:{eyebrow:"ANGELCARE SCHOOL · PROFESSIONAL EQUIPMENT",first:"Your school speaks before you even",emph:"say a word.",lead:"Turn spaces, daily practices and school identity into a learning experience that inspires children and builds trust with families.",explore:"Explore the worlds",offers:"Discover products",gallery:"Inspired by real school uses",world:"Choose a world to explore",benefits:["Learning & discovery","Organization & calm","Family confidence"],scene:["A classroom that inspires","A welcoming entrance","An empowered team","A memorable school identity"],captions:["Learning environments","First impressions","Professional tools","School identity"],thumbs:"Explore the scenes",previous:"Previous scene",next:"Next scene",image:"AngelCare preschool environments",contexts:["Learning","Welcome","Operations","Identity"],discover:"Explore this world"},
ar:{eyebrow:"أنجل كير · تجهيز المؤسسات التعليمية",first:"مؤسستكم تتحدث عنكم",emph:"قبل أن تنطقوا بكلمة.",lead:"حوّلوا الفضاءات والممارسات اليومية وهوية مؤسستكم إلى تجربة تعليمية ملهمة للأطفال وتبعث الثقة لدى الأسر.",explore:"استكشفوا المجالات",offers:"تصفحوا المنتجات",gallery:"أفكار مستلهمة من الاستخدامات المدرسية",world:"اختاروا مجالاً لاستكشافه",benefits:["التعلم والاكتشاف","التنظيم والراحة","ثقة الأسر"],scene:["فصل ملهم","استقبال مطمئن","فريق منظم","هوية مدرسية مميزة"],captions:["فضاءات التعلم","الانطباع الأول","أدوات الفريق","هوية المؤسسة"],thumbs:"استكشفوا الأجواء",previous:"المشهد السابق",next:"المشهد التالي",image:"فضاءات تعليمية من أنجل كير",contexts:["التعلم","الاستقبال","التنظيم","الهوية"],discover:"استكشفوا المجال"}
} as const;
const SCENES=[
 {id:"class",src:"",domain:"class-visuals",mode:"main",pos:"52% 50%"},
 {id:"welcome",src:"welcome.png",domain:"reception",mode:"native",pos:"50% 50%"},
 {id:"team",src:"os-team.png",domain:"staff-tools",mode:"native",pos:"50% 50%"},
 {id:"identity",src:"uniforms.png",domain:"partner-branding",mode:"native",pos:"50% 50%"}
] as const;
const WORLDS=[{id:"learning",icon:BookOpen,bg:"#ddf7eb",ink:"#12694c",domain:"class-visuals"},{id:"welcome",icon:Building2,bg:"#ffe4d2",ink:"#97441a",domain:"reception"},{id:"operations",icon:Layers3,bg:"#e0edff",ink:"#1a5b9c",domain:"staff-tools"},{id:"identity",icon:HeartHandshake,bg:"#ffe2ee",ink:"#b22262",domain:"partner-branding"}] as const;
export function EquipmentHeroR11({locale,onExploreDomains,onExploreOffers,onExploreDomain}:{locale:"fr"|"en"|"ar";onExploreDomains:()=>void;onExploreOffers:()=>void;onExploreDomain:(domainId:string)=>void}){
 const t=WORDS[locale];
 const [index,setIndex]=useState(0);
 // In the existing Imagery Studio preview, reveal precisely the selected scene/thumbnail.
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  if(params.get("imageryPreview")!=="1")return;
  const placement=params.get("imageryPlacement")||"";
  const match=placement.match(/^establishments\.equipment-r11\.(?:hero|thumb)\.(class|welcome|team|identity)$/);
  if(match){const n=SCENES.findIndex(scene=>scene.id===match[1]);if(n>=0)setIndex(n);}
 },[]);
 const current=SCENES[index];
 const choose=(n:number)=>setIndex((n+SCENES.length)%SCENES.length);
 return <section className={c.outer} data-establishments-hero data-equipment-hero-version="r11" lang={locale} dir={locale==="ar"?"rtl":"ltr"} aria-label={t.first+" "+t.emph}>
  <div className={c.hero}>
   <div className={c.copy}>
    <div className={c.kicker}><Sparkles size={15}/>{t.eyebrow}<span>R11</span></div>
    <h1 tabIndex={-1}>{t.first} <em>{t.emph}</em></h1>
    <p className={c.lead}>{t.lead}</p>
    <div className={c.benefits}><span><BookOpen size={19}/>{t.benefits[0]}</span><span><ShieldCheck size={19}/>{t.benefits[1]}</span><span><HeartHandshake size={19}/>{t.benefits[2]}</span></div>
    <div className={c.actions}><button className={c.primary} onClick={onExploreDomains}>{t.explore}<ArrowRight size={18}/></button><button className={c.secondary} onClick={onExploreOffers}>{t.offers}<ArrowDown size={17}/></button></div>
    <p className={c.assurance}><CheckCircle2 size={16}/>{t.gallery}</p>
   </div>
   <div className={c.visual}>
    <div className={c.mainScene} key={current.id}>
      {current.mode==="main"?<CampaignImage name="products-hero-r71" alt={t.image} hero className={c.image}/>:<ManagedImage src={`/angelcare-marketplace/establishments-r2/${current.src}`} slot={`equipment-r11.hero.${current.id}`} width={1250} height={950} alt={t.scene[index]} loading="eager" decoding="async"/>}
      <div className={c.sceneCaption}><span><Star size={14}/>{t.captions[index]}</span><strong>{t.scene[index]}</strong></div>
    </div>
    <div className={c.sceneControls}><button onClick={()=>choose(index-1)} aria-label={t.previous}><ChevronLeft size={19}/></button><span>{String(index+1).padStart(2,"0")} / 04</span><button onClick={()=>choose(index+1)} aria-label={t.next}><ChevronRight size={19}/></button></div>
    <button className={c.sceneHotspot} onClick={()=>onExploreDomain(current.domain)}><MousePointer2 size={17}/>{t.discover}<ArrowRight size={15}/></button>
    <div className={c.thumbnails} aria-label={t.thumbs}>{SCENES.map((scene,i)=><button key={scene.id} aria-label={t.scene[i]} aria-pressed={index===i} onClick={()=>setIndex(i)}><img src={i===0?"/angelcare-marketplace/establishments-r4/equipment-hero-r71-campaign.png":`/angelcare-marketplace/establishments-r2/${scene.src}`} alt="" loading="lazy" decoding="async"/><span>{String(i+1).padStart(2,"0")}</span><strong>{t.contexts[i]}</strong></button>)}</div>
   </div>
  </div>
  <div className={c.universeRail}><div><span>{t.world}</span><strong>04 <small>/ 06</small></strong></div>{WORLDS.map((world,i)=>{const Icon=world.icon;return <button key={world.id} onClick={()=>onExploreDomain(world.domain)} style={{backgroundColor:world.bg,color:world.ink}}><Icon size={21}/><span>{t.contexts[i]}</span><ArrowRight size={15}/></button>})}</div>
 </section>;
}
