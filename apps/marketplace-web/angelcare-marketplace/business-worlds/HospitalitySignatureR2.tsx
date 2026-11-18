"use client";
import {useEffect,useMemo,useState,type ReactNode} from "react";
import Link from "next/link";
import {ArrowRight,ArrowUpRight,Check,CheckCircle2,ChevronRight,Compass,HeartHandshake,ShieldCheck,Sparkles,UsersRound,BriefcaseBusiness,CalendarDays,Lightbulb,SlidersHorizontal,Star,Layers3} from "lucide-react";
import {ManagedImage} from "../marketplace-imagery/ManagedImage";
import {storefrontPhoto} from "../storefront-immersive/editorial-media";
import {CommerceCatalogue,CommercialOpening,CommerceCollections,ProjectSummary} from "./Commerce";
import {Published,useWorld} from "./Shared";
import {Enquiry} from "./Enquiry";
import {H,h,ht,type HLocale,type HWord} from "./hospitality-r2-content";
import s from "./hospitality-r2.module.css";

const image=(key:string)=>storefrontPhoto("hospitality",key);
function Art({name,slot,priority=false}:{name:string;slot:string;priority?:boolean}){
 return <div className={s.art} data-hospitality-image={slot}>
   <ManagedImage slot={`hospitality-r2.${slot}`} src={image(name)} alt="" loading={priority?"eager":"lazy"} decoding="async"/>
 </div>;
}
function Action({href,children,light=false}:{href:string;children:ReactNode;light?:boolean}){return <a className={light?s.actionLight:s.action} href={href}>{children}<ArrowUpRight size={16}/></a>;}
function Head({eyebrow,title,lead}:{eyebrow?:HWord;title:HWord;lead?:HWord}){const {locale}=useWorld();return <header className={s.sectionHead}>{eyebrow?<span className={s.eyebrow}><Sparkles size={14}/>{ht(eyebrow,locale)}</span>:null}<h2>{ht(title,locale)}</h2>{lead?<p>{ht(lead,locale)}</p>:null}</header>;}
function NumberMark({value}:{value:number}){return <span className={s.count}>{String(value).padStart(2,"0")}</span>;}
const navIds=["hotel-value","hotel-signatures","hotel-operations","world-offers","world-enquiry"];
export function HospitalitySignatureR2({mode="native"}:{mode?:"native"|"published"}){
 const {locale,experience,context,setContext,selected,select,brief,project}=useWorld();
 const [property,setProperty]=useState(1),[age,setAge]=useState(0),[moment,setMoment]=useState(0),[concepts,setConcepts]=useState<string[]>([]),[days,setDays]=useState(12),[families,setFamilies]=useState(8);
 const [selectedProgrammes,setSelectedProgrammes]=useState<string[]>([]);
 const tr=(v:HWord)=>ht(v,locale);
 const currentProperty=H.properties[property],currentMoment=H.moments[moment];
 const selectedConcepts=H.concepts.filter(x=>concepts.includes(x.id));
 useEffect(()=>{
  // Only the existing Imagery Studio iframe may deep-link an otherwise conditional shot.
  const params=new URLSearchParams(window.location.search);
  if(params.get("imageryPreview")!=="1")return;
  const slot=params.get("imageryPlacement")||"";
  let match=slot.match(/^hospitality\.hospitality-r2\.property\.(city|resort|season)$/);
  if(match){const index=H.properties.findIndex(v=>v.id===match![1]);if(index>=0)setProperty(index);}
  match=slot.match(/^hospitality\.hospitality-r2\.age\.(3-6|7-12|13-16)$/);
  if(match){const index=H.ages.findIndex(v=>v.id===match![1]);if(index>=0)setAge(index);}
  match=slot.match(/^hospitality\.hospitality-r2\.day\.(arrival|discover|create|parents|departure)$/);
  if(match){const index=H.moments.findIndex(v=>v.id===match![1]);if(index>=0)setMoment(index);}
 },[]);

 const summary=useMemo(()=>[
  "ANGELCARE HOSPITALITY SIGNATURE R2",
  "Property: "+tr(currentProperty.name),
  "Age focus: "+tr(H.ages[age].title),
  "Experience concepts: "+(selectedConcepts.map(x=>tr(x.title)).join(", ")||"To be discussed"),
  "Preferred programmes: "+(H.worldCollection.filter(x=>selectedProgrammes.includes(x.key)).map(x=>tr(x.title)).join(", ")||"To be discussed"),
  "Illustrative programme days: "+days,
  "Illustrative family contacts per day: "+families,
  "Operating model: subject to property assessment and written terms",
  "Published native catalogue offer IDs: "+(project.map(x=>x.id).join(", ")||"None selected"),
  "Existing world brief: "+brief
 ].join("\n"),[currentProperty,age,concepts,selectedConcepts,selectedProgrammes,days,families,project,brief,locale]);
 const changeProgram=(key:string)=>{const next=selectedProgrammes.includes(key)?selectedProgrammes.filter(x=>x!==key):[...selectedProgrammes,key];setSelectedProgrammes(next);setContext("hospitality-programmes",H.worldCollection.filter(x=>next.includes(x.key)).map(x=>tr(x.title)).join(", ")||"None selected");};
 const changeConcept=(key:string)=>{const next=concepts.includes(key)?concepts.filter(x=>x!==key):[...concepts,key];setConcepts(next);setContext("hospitality-experiences",H.concepts.filter(x=>next.includes(x.id)).map(x=>tr(x.title)).join(", ")||"None selected");};
 const nav=H.nav;
 return <div className={s.world} data-hospitality-signature="R2" data-hospitality-mode={mode} dir={locale==="ar"?"rtl":"ltr"}>
   <section className={s.hero} id="hospitality-opening" data-hospitality-chapter="01">
    <Art name="hospitality" slot="hero.main" priority/>
    <div className={s.heroOverlay}/>
    <div className={s.heroContent}>
     <span className={s.heroEyebrow}><Sparkles size={16}/>{tr(H.eyebrow)}</span>
     <h1>{tr(H.heroTitle)}</h1><p>{tr(H.heroLead)}</p>
     <div className={s.heroActions}><Action href="#world-enquiry">{tr(H.cta)}</Action><Action href="#world-discover" light>{tr(H.explore)}</Action></div>
     <div className={s.heroTrust}>{H.assurance.map((v,i)=><span key={i}><CheckCircle2 size={16}/>{tr(v)}</span>)}</div>
    </div>
    <div className={s.heroScenes}><div><Art name="games" slot="hero.inset.kids"/><strong>Kids Club</strong></div><div><Art name="family" slot="hero.inset.family"/><strong>Family Stay</strong></div></div>
    <div className={s.heroBand}>ANGELCARE <span>HOTELS & RESORTS</span> <span>{tr(H.presentation)}</span></div>
   </section>
   <nav className={s.nav} aria-label={locale==="fr"?"Navigation de l'expérience hôtelière":locale==="ar"?"التنقل في تجربة الفندق":"Hospitality experience navigation"}>{nav.map((v,i)=><a href={`#${navIds[i]}`} key={navIds[i]}>{tr(v)}</a>)}</nav>
   <aside className={s.projectPulse} aria-live="polite" aria-label={locale==="fr"?"Votre projet hôtelier":locale==="ar"?"مشروع الفندق":"Your hotel project"}>
    <span className={s.projectPulseIcon}><Sparkles size={17}/></span>
    <div><strong>{tr(H.propertyTitle)}</strong><span>{tr(currentProperty.name)} · {tr(H.ages[age].title)}</span></div>
    <span className={s.pulseCount}>{selectedProgrammes.length+concepts.length+project.length}</span>
    <a href="#hotel-partnership-brief">{tr(H.briefAction)} <ArrowUpRight size={15}/></a>
   </aside>

   <section className={s.compare} id="hotel-value" data-hospitality-chapter="02">
    <Head title={H.comparisonTitle} lead={H.comparisonLead}/>
    <div className={s.compareGrid}>
     <article className={s.ordinary}><Art name="hospitality" slot="comparison.standard"/><div><NumberMark value={1}/><h3>{tr(H.ordinary)}</h3><p>{tr(H.ordinaryText)}</p></div></article>
     <article className={s.elevated}><Art name="games" slot="comparison.signature"/><div><NumberMark value={2}/><h3>{tr(H.elevated)}</h3><p>{tr(H.elevatedText)}</p></div></article>
    </div>
   </section>
   <section className={s.benefits} data-hospitality-chapter="03">
    <Head eyebrow={H.benefitEyebrow} title={H.benefitTitle} lead={H.benefitLead}/>
    <div className={s.benefitGrid}>{H.benefitCollection.map((v,i)=><article key={i} data-tone={i}><NumberMark value={i+1}/>{i===0?<HeartHandshake/>:i===1?<ShieldCheck/>:i===2?<Star/>:<BriefcaseBusiness/>}<h3>{tr(v.title)}</h3><p>{tr(v.body)}</p></article>)}</div>
   </section>
   <section className={s.signatures} id="hotel-signatures" data-hospitality-chapter="04">
    <Head eyebrow={H.signatureEyebrow} title={H.signatureTitle} lead={H.signatureLead}/>
    <div className={s.signatureGrid}>{H.worldCollection.map((v,i)=><article key={v.key} data-tone={v.tone}><div className={s.signatureVisual}><Art name={v.image} slot={`world.${v.key}`}/><span>{String(i+1).padStart(2,"0")}</span></div><div className={s.signatureCopy}><h3>{tr(v.title)}</h3><p>{tr(v.body)}</p><div className={s.signatureActions}><Link href={`/angelcare-marketplace/${locale}/hospitality/${v.href}`}>{tr(H.seeDetails)} <ChevronRight size={15}/></Link><button type="button" aria-pressed={selectedProgrammes.includes(v.key)} onClick={()=>changeProgram(v.key)}>{selectedProgrammes.includes(v.key)?<Check size={15}/>:<span>+</span>}{tr(selectedProgrammes.includes(v.key)?H.inBrief:H.addBrief)}</button></div></div></article>)}</div>
   </section>

   <section className={s.liveGateway} data-hospitality-chapter="05">
    <Head eyebrow={H.liveEyebrow} title={H.liveTitle} lead={H.liveLead}/>
    {mode==="native"?<CommercialOpening/>:<div className={s.publishedGateway}><p>{tr(H.liveLead)}</p><Action href="#world-offers">{tr(H.explore)}</Action></div>}
   </section>

   <section className={s.properties} data-hospitality-chapter="06">
    <Head eyebrow={H.propertyEyebrow} title={H.propertyTitle} lead={H.propertyLead}/>
    <div className={s.propertyControls} role="group" aria-label={tr(H.propertyEyebrow)}>{H.properties.map((v,i)=><button key={v.id} type="button" aria-pressed={property===i} onClick={()=>{setProperty(i);setContext("property-type",tr(v.name));}}>{i+1} · {tr(v.name)}</button>)}</div>
    <div className={s.propertyFrame}><div className={s.propertyPhoto}><Art name={currentProperty.image} slot={`property.${currentProperty.id}`}/></div><div className={s.propertyCopy}><span className={s.eyebrow}>ANGELCARE PROPERTY STUDIO</span><h3>{tr(currentProperty.title)}</h3><p>{tr(currentProperty.body)}</p><div className={s.tagRow}>{currentProperty.tags.map((tag,i)=><span key={i}><Check size={14}/>{tr(tag)}</span>)}</div><Action href="#world-enquiry">{tr(H.propertyCTA)}</Action></div></div>
   </section>
   <section className={s.ages} data-hospitality-chapter="07">
    <Head title={H.ageTitle} lead={H.ageLead}/>
    <div className={s.ageRail}>{H.ages.map((v,i)=><article key={v.id} className={s.ageCard} data-active={age===i}><Art name={v.image} slot={`age.${v.id}`}/><button type="button" aria-pressed={age===i} onClick={()=>{setAge(i);setContext("ages",v.id);}}><strong>{tr(v.title)}</strong><small>{tr(v.body)}</small></button></article>)}</div>
   </section>
   <section className={s.atlas} data-hospitality-chapter="08">
    <Head title={H.atlasTitle} lead={H.atlasLead}/>
    <div className={s.atlasGrid}>{H.concepts.map((v,i)=><article key={v.id} data-selected={concepts.includes(v.id)} className={s.atlasCard}><Art name={v.image} slot={`atlas.${v.id}`}/><button type="button" onClick={()=>changeConcept(v.id)} aria-label={tr(v.title)} aria-pressed={concepts.includes(v.id)}><span>{String(i+1).padStart(2,"0")}</span><strong>{tr(v.title)}</strong><i>{concepts.includes(v.id)?"✓":"+"}</i></button></article>)}</div>
    <p className={s.caption}>{tr(H.noClaim)}</p>
   </section>
   <section className={s.day} data-hospitality-chapter="09">
    <Head title={H.dayTitle}/>
    <div className={s.dayControls}>{H.moments.map((v,i)=><button type="button" key={v.id} aria-pressed={moment===i} onClick={()=>{setMoment(i);setContext("hospitality-guest-journey",tr(v.title));}}><span>{String(i+1).padStart(2,"0")}</span>{tr(v.title)}</button>)}</div>
    <div className={s.dayStage}><Art name={currentMoment.image} slot={`day.${currentMoment.id}`}/><div><span>FAMILY EXPERIENCE / 0{moment+1}</span><h3>{tr(currentMoment.title)}</h3><p>{tr(currentMoment.body)}</p><button type="button" onClick={()=>changeConcept(H.concepts[moment].id)}>{tr(H.dailyCTA)} <ArrowRight size={16}/></button></div></div>
   </section>
   <section className={s.operations} id="hotel-operations" data-hospitality-chapter="10">
    <Head title={H.operationsTitle} lead={H.operationsLead}/>
    <div className={s.operationGrid}><div className={s.operationPhoto}><Art name="care" slot="operations.main"/><span>ANGELCARE / OPERATIONAL DELIVERY</span></div><ol>{H.operations.map((v,i)=><li key={i}><NumberMark value={i+1}/><div><h3>{tr(v.title)}</h3><p>{tr(v.body)}</p></div><CheckCircle2 size={20}/></li>)}</ol></div>
   </section>
   <section className={s.economics} data-hospitality-chapter="11">
    <Head title={H.economicsTitle} lead={H.economicsLead}/>
    <div className={s.economicsGrid}><div className={s.economicsControl}><label>{tr(H.days)}<input type="range" min={1} max={90} step={1} value={days} onChange={e=>{const value=Number(e.target.value);setDays(value);setContext("hospitality-planning",`${value} days × ${families} families/day, illustrative only`);}}/><strong>{days}</strong></label><label>{tr(H.volume)}<input type="range" min={1} max={60} step={1} value={families} onChange={e=>{const value=Number(e.target.value);setFamilies(value);setContext("hospitality-planning",`${days} days × ${value} families/day, illustrative only`);}}/><strong>{families}</strong></label><p>{tr(H.estimateWarning)}</p></div><div className={s.economicsResult}><span>{tr(H.exposure)}</span><strong>{new Intl.NumberFormat(locale==="fr"?"fr-FR":locale==="ar"?"ar-MA":"en-GB").format(days*families)}</strong><p>{tr(H.noClaim)}</p></div></div>
   </section>
   <section className={s.trust} data-hospitality-chapter="12">
    <Head title={H.trustTitle} lead={H.trustLead}/>
    <div className={s.trustVisual}><Art name="family" slot="trust.family"/><div>{H.assurance.map((item,i)=><div key={i}><CheckCircle2/><strong>{tr(item)}</strong></div>)}<p>{tr(H.noClaim)}</p></div></div>
   </section>
   <section className={s.steps} data-hospitality-chapter="13">
    <Head title={H.pathTitle} lead={H.pathLead}/>
    <div className={s.stepsGrid}>{H.steps.map((step,i)=><article key={i}><NumberMark value={i+1}/><h3>{tr(step.title)}</h3><p>{tr(step.body)}</p></article>)}</div>
   </section>
   <section className={s.catalogue} data-hospitality-chapter="14">
    <Head title={H.fullTitle} lead={H.fullLead}/>
    {mode==="native"?<><CommerceCollections/><Published/><CommerceCatalogue/><ProjectSummary/></>:<Action href="#world-offers">{tr(H.explore)}</Action>}
   </section>
   {mode==="native"?<section className={s.conversion} id="hotel-partnership-brief"><Head title={H.briefTitle} lead={H.briefLead}/><div className={s.brief}><div><strong>ANGELCARE HOTEL PARTNERSHIP</strong><p>{tr(currentProperty.name)} · {tr(H.ages[age].title)}</p><p>{selectedConcepts.map(x=>tr(x.title)).join(" · ")||tr(H.propertyCTA)}</p><span>{project.length} {locale==="fr"?"offres sélectionnées":locale==="ar"?"عروض محددة":"selected native offers"}</span></div><Action href="#world-enquiry">{tr(H.briefAction)}</Action></div><Enquiry world="hospitality" locale={locale} brief={summary.slice(0,1900)} sourceRoute={`/angelcare-marketplace/${locale}/hospitality${experience.territoryCode?`?territory=${encodeURIComponent(experience.territoryCode)}`:""}`}/></section>:null}
 </div>;
}
