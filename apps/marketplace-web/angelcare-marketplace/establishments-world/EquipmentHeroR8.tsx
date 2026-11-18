"use client";
import {ArrowRight,ArrowDown,GraduationCap,ShieldCheck,CheckCircle2,Sparkles} from "lucide-react";
import {CampaignImage} from "./CommercialJourney";
import c from "./EquipmentHeroR8.module.css";

const COPY={
 fr:{
  badge:"ÉQUIPEMENTS & SOLUTIONS ANGELCARE ÉCOLE",
  first:"Votre établissement parle avant même que",
  emph:"vous preniez la parole.",
  lead:"Des espaces bien équipés, organisés et inspirants pour accueillir, éduquer, rassurer les familles et valoriser votre identité.",
  project:"Explorer les 22 domaines",catalog:"Découvrir les offres",benefits:["Pédagogie active & épanouissement","Sécurité & repères adaptés","Image professionnelle & confiance des familles"],
  alt:"Univers éducatif AngelCare : ours en peluche et équipements pédagogiques dans une classe préscolaire chaleureuse"
 },
 en:{
  badge:"ANGELCARE SCHOOL EQUIPMENT & SOLUTIONS",
  first:"Your school speaks before you even",
  emph:"say a word.",
  lead:"Thoughtfully equipped, organized and inspiring spaces for welcoming children, supporting learning and building family confidence.",
  project:"Explore 22 areas",catalog:"View published offers",benefits:["Active learning","Safety & clear routines","Professional school identity"],
  alt:"AngelCare educational world with a teddy bear and classroom learning materials"
 },
 ar:{
  badge:"تجهيزات وحلول أنجل كير للمؤسسات",
  first:"مؤسستكم تتحدث عنكم",
  emph:"قبل أن تنطقوا بكلمة.",
  lead:"مساحات تعليمية منظمة وملهمة لاستقبال الأطفال ودعم تعلمهم وتعزيز ثقة الأسر.",
  project:"استكشف ٢٢ مجالاً",catalog:"تصفح العروض المنشورة",benefits:["تعلم نشط","السلامة والروتين الواضح","هوية مدرسية مهنية"],
  alt:"فضاء أنجل كير التعليمي مع دمية دب ووسائل تعليمية في فصل روضة أطفال"
 }
} as const;

export function EquipmentHeroR8({locale,onExploreDomains,onExploreOffers}:{
 locale:"fr"|"en"|"ar";onExploreDomains:()=>void;onExploreOffers:()=>void;
}){
 const copy=COPY[locale];
 return <section className={c.hero} data-establishments-hero data-equipment-hero-version="r8" lang={locale} dir={locale==="ar"?"rtl":"ltr"} aria-label={copy.first+" "+copy.emph}>
  <div className={c.copy}>
   <span className={c.eyebrow}><Sparkles size={16}/>{copy.badge}</span>
   <h1 tabIndex={-1}>{copy.first} <em>{copy.emph}</em></h1>
   <p className={c.lead}>{copy.lead}</p>
   <div className={c.benefits}><span><GraduationCap size={22}/><strong>{copy.benefits[0]}</strong></span><span><ShieldCheck size={22}/><strong>{copy.benefits[1]}</strong></span><span><CheckCircle2 size={22}/><strong>{copy.benefits[2]}</strong></span></div>
   <div className={c.actions}><button className={c.primary} type="button" onClick={onExploreDomains}>{copy.project}<ArrowRight size={17}/></button><button type="button" className={c.secondary} onClick={onExploreOffers}>{copy.catalog}<ArrowDown size={16}/></button></div>
  </div>
  <div className={c.visual}><CampaignImage name="products-hero-r71" alt={copy.alt} hero className={c.photo}/>
   <div className={c.visualBadge}><span>ANGELCARE</span><strong>School Assets</strong></div>
  </div>
 </section>;
}
