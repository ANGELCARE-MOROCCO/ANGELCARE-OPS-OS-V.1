"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowRight,ArrowUpRight,Check,CheckCircle2,ChevronRight,Compass,HeartHandshake,ShieldCheck,Sparkles,UsersRound,BriefcaseBusiness,CalendarDays,Star,Layers3,Building2,Clock3,ClipboardCheck,MessageCircle,Handshake,SlidersHorizontal} from "lucide-react";
import {ManagedImage} from "../marketplace-imagery/ManagedImage";
import {storefrontPhoto} from "../storefront-immersive/editorial-media";
import {CommerceCatalogue,BusinessOfferCard,ProjectSummary} from "./Commerce";
import {useWorld} from "./Shared";
import {Enquiry} from "./Enquiry";
import {COMMERCIAL_PROFILES,localized,segmentItems} from "./merchandising";
import {H,ht,type HWord} from "./hospitality-r2-content";
import s from "./hospitality-executive-r3.module.css";

const messages={
 value:["L'avantage d'une expérience famille bien pensée","A family experience designed to make a difference","قيمة تجربة عائلية مدروسة"],
 valueLead:["Offrez aux familles un séjour plus mémorable, tout en construisant une organisation claire pour vos équipes.","Give families a more memorable stay while giving your team an operating model it can understand.","قدّموا إقامة عائلية أغنى ونموذج تشغيل واضحاً لفرقكم."],
 world:["Quatre façons de valoriser chaque séjour","Four ways to enrich every stay","أربعة مسارات لإثراء كل إقامة"],
 worldLead:["Découvrez les expériences, les conditions d'organisation et les solutions adaptées à votre établissement.","Explore experiences, operational considerations and services relevant to your property.","اكتشفوا التجارب ومتطلبات التشغيل والحلول الملائمة لمنشأتكم."],
 journey:["Une expérience qui se vit, du premier accueil au départ","An experience from arrival to departure","تجربة تبدأ بالترحيب وتستمر حتى المغادرة"],
 property:["Une solution conçue autour de votre hôtel","Designed around your property","حل يناسب طبيعة منشأتكم"],
 ages:["Chaque âge mérite son propre univers","A world of discovery for every age","عالم من الاكتشاف لكل فئة عمرية"],
 atlas:["Des activités qui donnent vie à votre destination","Activities that bring your destination to life","أنشطة تمنح وجهتكم طابعاً خاصاً"],
 delivery:["Un fonctionnement clair pour votre direction et vos équipes","A clear operating model for management and teams","نموذج تشغيل واضح للإدارة والفرق"],
 deliveryLead:["Un projet réussi commence par un périmètre précis : espaces, capacités, équipe, réservation, sécurité et suivi.","Successful delivery begins with clarity on spaces, capacity, teams, bookings, safety and follow-through.","يبدأ التنفيذ الناجح بتحديد المساحات والسعة والفرق والحجوزات والسلامة والمتابعة."],
 solutions:["Choisissez les solutions adaptées à votre établissement","Choose what fits your property","اختاروا الحلول التي تناسب منشأتكم"],
 solutionsLead:["Consultez les services disponibles, leurs caractéristiques et leurs modalités, puis préparez votre sélection.","Explore available services, their real features and conditions, then build your shortlist.","استكشفوا الخدمات وخصائصها وشروطها، ثم كوّنوا قائمتكم المختارة."],
 models:["La bonne formule, au bon rythme","The right arrangement for your operation","النموذج المناسب لإيقاع عملكم"],
 modelsLead:["Un programme régulier, un dispositif saisonnier ou un projet sur mesure : le périmètre sera confirmé avec votre équipe.","Explore recurring, seasonal or tailored arrangements; exact delivery is agreed with your team.","برامج مستمرة أو موسمية أو حسب الطلب، ويُحدد التنفيذ بالتنسيق مع فريقكم."],
 plan:["Construisons un projet réaliste pour votre hôtel","Let's shape a realistic plan for your property","لنصمم خطة واقعية لمنشأتكم"],
 planLead:["Rassemblez des hypothèses d'exploitation, pas des promesses de revenus. Ces paramètres guideront notre échange.","Collect planning assumptions, not revenue promises. They help shape a meaningful conversation.","اجمعوا افتراضات التشغيل لا وعود الإيرادات، لتوجيه الحوار."],
 trust:["Des engagements qui se vérifient sur le terrain","The confidence of a clearly defined partnership","الثقة تنطلق من التزامات واضحة"],
 trustLead:["Chaque collaboration précise les responsabilités, les conditions d'accueil, les règles de sécurité et le suivi à mettre en place.","Each partnership defines responsibilities, guest arrangements, safety rules and operational follow-through.","تحدد كل شراكة المسؤوليات والاستقبال والسلامة وآليات المتابعة."],
 finish:["Parlons de l'expérience famille de votre établissement","Let's design your property's family experience","لنصمم تجربة العائلات في منشأتكم"],
 finishLead:["Décrivez votre hôtel et vos priorités. Nous étudierons ensemble les programmes et les modalités adaptés.","Tell us about your property and priorities. We'll review the right programmes and operating terms together.","أخبرونا عن منشأتكم وأولوياتكم لنبحث البرامج والشروط المناسبة معاً."],
 begin:["Découvrir les solutions","Explore solutions","استكشاف الحلول"],
 consult:["Discuter de notre projet","Discuss our project","مناقشة مشروعنا"],
 add:["Ajouter au projet","Add to project","أضف للمشروع"],
 added:["Dans notre projet","In our project","ضمن المشروع"],
 detail:["Voir cette solution","Explore this solution","عرض هذا الحل"],
 all:["Toutes les solutions","All solutions","جميع الحلول"],
 days:["Jours envisagés","Planned programme days","أيام البرنامج المتوقعة"],
 family:["Familles estimées par jour","Estimated families per day","العائلات المتوقعة يومياً"],
 theoretical:["Interactions possibles sur la période","Illustrative family interactions","التفاعلات المحتملة خلال الفترة"],
 disclaimer:["Estimation d'activité uniquement. La faisabilité, les coûts et les conditions sont définis après étude.","Activity estimate only. Feasibility, costs and terms follow an assessment.","تقدير للنشاط فقط، وتُحدد الإمكانية والتكلفة والشروط بعد الدراسة."],
 noOffer:["Aucune solution ne correspond à cette sélection. Décrivez-nous votre besoin pour une étude personnalisée.","No matching solutions here. Tell us about your requirements for a tailored assessment.","لا توجد حلول مطابقة لهذا الاختيار، شاركونا احتياجاتكم لدراستها."],
 project:["Votre projet hôtelier","Your hotel project","مشروعكم الفندقي"],
 agesNote:["Le programme et les modalités d'encadrement sont définis selon les âges, les lieux et les besoins.","Programme eligibility and supervision depend on age, environment and agreed care requirements.","تُحدد الأنشطة والإشراف بحسب العمر والمكان والاحتياجات."],
 compare:["Un établissement, une expérience unique","One property, its own family signature","لكل منشأة بصمتها العائلية"],
 select:["Choisir cet univers","Select this experience","اختيار هذه التجربة"],
 steps:["De l'idée à une expérience bien organisée","From an idea to a well-run experience","من الفكرة إلى تجربة منظمة"],
 saved:["Vos choix sont associés à votre demande","Your selections stay with your enquiry","تظل اختياراتكم مرفقة بطلبكم"],
 booking:["L'accueil, les réservations et les transmissions sont définis avec l'établissement.","Guest reception, bookings and handovers are planned with your property.","تُنسق ترتيبات الاستقبال والحجز والتسليم مع المنشأة."]
} as const;
type Msg=keyof typeof messages;
function useT(){const {locale}=useWorld();return (key:Msg)=>messages[key][locale==="fr"?0:locale==="en"?1:2];}
function Scene({name,slot}:{name:string;slot:string}){return <div className={s.scene}><ManagedImage slot={"hospitality-r2."+slot} src={storefrontPhoto("hospitality",name)} alt="" loading="lazy" decoding="async"/></div>;}
function Head({label,title,desc}:{label:string;title:string;desc?:string}){return <header className={s.head}><span>{label}</span><h2>{title}</h2>{desc?<p>{desc}</p>:null}</header>;}
function Jump({href,children}:{href:string;children:React.ReactNode}){return <a className={s.jump} href={href}>{children}<ArrowUpRight size={16}/></a>;}
export function HospitalityExecutiveR3({mode}:{mode:"native"|"published"}){
 const {locale,experience,project,brief,setContext}=useWorld();
 const t=useT();
 const tr=(value:HWord)=>ht(value,locale);
 const [world,setWorld]=useState(0),[property,setProperty]=useState(1),[age,setAge]=useState(0),[moment,setMoment]=useState(0),[concepts,setConcepts]=useState<string[]>([]),[days,setDays]=useState(12),[families,setFamilies]=useState(8),[programmeIds,setProgrammeIds]=useState<string[]>([]),[segment,setSegment]=useState("all");
 const selectedWorld=H.worldCollection[world],selectedProperty=H.properties[property],selectedMoment=H.moments[moment],profile=COMMERCIAL_PROFILES.hospitality;
 const featured=useMemo(()=>segmentItems(experience.items,profile.segments.find(x=>x.key===segment)).slice(0,3),[experience.items,profile,segment]);
 const toggleWorld=(key:string)=>{const next=programmeIds.includes(key)?programmeIds.filter(x=>x!==key):[...programmeIds,key];setProgrammeIds(next);setContext("hospitality-programmes",H.worldCollection.filter(x=>next.includes(x.key)).map(x=>tr(x.title)).join(", ")||"To discuss");};
 const toggleConcept=(key:string)=>{const next=concepts.includes(key)?concepts.filter(x=>x!==key):[...concepts,key];setConcepts(next);setContext("hospitality-experiences",H.concepts.filter(x=>next.includes(x.id)).map(x=>tr(x.title)).join(", ")||"To discuss");};
 useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.get("imageryPreview")!=="1")return;const slot=params.get("imageryPlacement")||"";let m=slot.match(/^hospitality\.hospitality-r2\.property\.(city|resort|season)$/);if(m){const i=H.properties.findIndex(x=>x.id===m![1]);if(i>=0)setProperty(i);}m=slot.match(/^hospitality\.hospitality-r2\.age\.(3-6|7-12|13-16)$/);if(m){const i=H.ages.findIndex(x=>x.id===m![1]);if(i>=0)setAge(i);}m=slot.match(/^hospitality\.hospitality-r2\.day\.(arrival|discover|create|parents|departure)$/);if(m){const i=H.moments.findIndex(x=>x.id===m![1]);if(i>=0)setMoment(i);}},[]);
 const detail=H.concepts.filter(x=>concepts.includes(x.id)).map(x=>tr(x.title));
 const summary=["Hotel: "+tr(selectedProperty.name),"Age focus: "+tr(H.ages[age].title),"Programmes: "+H.worldCollection.filter(x=>programmeIds.includes(x.key)).map(x=>tr(x.title)).join(", "),"Activity interests: "+detail.join(", "),"Illustrative scope: "+days+" days and "+families+" families/day","Actual selected offers: "+project.map(x=>x.name+" ["+x.id+"]").join(", "),brief].join("\n");
 const sections=[["executive-value",t("value")],["hotel-experiences",t("world")],["hotel-property",t("property")],["world-discover",t("solutions")],["world-enquiry",t("finish")]];
 return <div className={s.root} data-hospitality-executive="r3" dir={locale==="ar"?"rtl":"ltr"}>
  <nav className={s.localNav} aria-label={t("project")}>{sections.map(([id,label])=><a key={id} href={"#"+id}>{label}</a>)}</nav>
  <aside className={s.pulse}><span><Sparkles size={17}/></span><div><strong>{t("project")}</strong><small>{tr(selectedProperty.name)} · {tr(H.ages[age].title)}</small></div><b>{programmeIds.length+concepts.length+project.length}</b><Jump href="#world-enquiry">{t("consult")}</Jump></aside>
  <section className={s.value} id="executive-value">
   <div className={s.valuePhoto}><Scene name="family" slot="comparison.signature"/><div className={s.photoLine}>ANGELCARE <span>FAMILY HOSPITALITY</span></div></div>
   <div className={s.valueText}><Head label="01 / HOSPITALITY" title={t("value")} desc={t("valueLead")}/><div className={s.valueList}>{H.benefitCollection.map((v,i)=><div key={i}><span>{i===0?<HeartHandshake/>:i===1?<ShieldCheck/>:i===2?<Star/>:<BriefcaseBusiness/>}</span><div><strong>{tr(v.title)}</strong><p>{tr(v.body)}</p></div></div>)}</div><Jump href="#hotel-experiences">{t("begin")}</Jump></div>
  </section>
  <section className={s.worlds} id="hotel-experiences">
   <Head label="02 / EXPERIENCES" title={t("world")} desc={t("worldLead")}/>
   <div className={s.worldLayout}><div className={s.worldVisual}><Scene name={selectedWorld.image} slot={"world."+selectedWorld.key}/><span>0{world+1} / 04</span></div><div className={s.worldPanel}><div className={s.worldTabs}>{H.worldCollection.map((v,i)=><button type="button" key={v.key} aria-pressed={world===i} onClick={()=>setWorld(i)}>{String(i+1).padStart(2,"0")} <span>{tr(v.title)}</span></button>)}</div><div className={s.worldDetail}><span>ANGELCARE HOSPITALITY</span><h3>{tr(selectedWorld.title)}</h3><p>{tr(selectedWorld.body)}</p><p>{t("booking")}</p><div className={s.buttons}><Link href={"/angelcare-marketplace/"+locale+"/hospitality/"+selectedWorld.href}>{t("detail")} <ArrowUpRight size={15}/></Link><button type="button" aria-pressed={programmeIds.includes(selectedWorld.key)} onClick={()=>toggleWorld(selectedWorld.key)}>{programmeIds.includes(selectedWorld.key)?<Check size={16}/>:<Layers3 size={16}/>} {programmeIds.includes(selectedWorld.key)?t("added"):t("add")}</button></div></div></div></div>
  </section>
  <section className={s.journey}>
   <Head label="03 / GUEST JOURNEY" title={t("journey")} desc={t("booking")}/>
   <div className={s.moments}>{H.moments.map((v,i)=><button key={v.id} type="button" aria-pressed={moment===i} onClick={()=>{setMoment(i);setContext("hospitality-guest-journey",tr(v.title));}}><span>{String(i+1).padStart(2,"0")}</span><strong>{tr(v.title)}</strong></button>)}</div>
   <div className={s.journeyStage}><Scene name={selectedMoment.image} slot={"day."+selectedMoment.id}/><div><span>THE GUEST EXPERIENCE / 0{moment+1}</span><h3>{tr(selectedMoment.title)}</h3><p>{tr(selectedMoment.body)}</p><Jump href="#world-enquiry">{t("consult")}</Jump></div></div>
  </section>
  <section className={s.property} id="hotel-property"><Head label="04 / PROPERTY DESIGN" title={t("property")} desc={tr(H.propertyLead)}/><div className={s.propertyTabs}>{H.properties.map((v,i)=><button key={v.id} type="button" aria-pressed={property===i} onClick={()=>{setProperty(i);setContext("property-type",tr(v.name));}}><Building2 size={16}/>{tr(v.name)}</button>)}</div><div className={s.propertyStage}><Scene name={selectedProperty.image} slot={"property."+selectedProperty.id}/><div><span>YOUR HOTEL / YOUR SIGNATURE</span><h3>{tr(selectedProperty.title)}</h3><p>{tr(selectedProperty.body)}</p><div className={s.tags}>{selectedProperty.tags.map((tag,i)=><span key={i}><Check size={13}/>{tr(tag)}</span>)}</div><Jump href="#world-enquiry">{t("consult")}</Jump></div></div></section>
  <section className={s.programmes}><Head label="05 / PROGRAMMES" title={t("ages")} desc={t("agesNote")}/><div className={s.programmeLayout}>{H.ages.map((v,i)=><article key={v.id} data-active={age===i}><div><Scene name={v.image} slot={"age."+v.id}/></div><button type="button" aria-pressed={age===i} onClick={()=>{setAge(i);setContext("ages",v.id);}}><span>0{i+1}</span><h3>{tr(v.title)}</h3><p>{tr(v.body)}</p><strong>{t("select")} <ChevronRight size={15}/></strong></button></article>)}</div></section>
  <section className={s.atlas}><Head label="06 / ACTIVITIES" title={t("atlas")} desc={tr(H.atlasLead)}/><div className={s.atlasGrid}>{H.concepts.map((v,i)=><article key={v.id} data-picked={concepts.includes(v.id)}><Scene name={v.image} slot={"atlas."+v.id}/><button type="button" aria-pressed={concepts.includes(v.id)} onClick={()=>toggleConcept(v.id)}><small>{String(i+1).padStart(2,"0")}</small><strong>{tr(v.title)}</strong><span>{concepts.includes(v.id)?<Check size={17}/>:<ArrowUpRight size={16}/>}</span></button></article>)}</div><p className={s.finePrint}>{t("agesNote")}</p></section>
  <section className={s.operations} id="hotel-operations"><Head label="07 / OPERATIONS" title={t("delivery")} desc={t("deliveryLead")}/><div className={s.opsLayout}><div className={s.opsPhoto}><Scene name="care" slot="operations.main"/><span>ANGELCARE / HOTEL PARTNERSHIP</span></div><div className={s.opsRows}>{H.operations.map((v,i)=><div key={i}><b>{String(i+1).padStart(2,"0")}</b><div><h3>{tr(v.title)}</h3><p>{tr(v.body)}</p></div><CheckCircle2 size={20}/></div>)}</div></div></section>
  <section className={s.showroom} id="world-discover"><Head label="08 / YOUR SOLUTIONS" title={t("solutions")} desc={t("solutionsLead")}/><div className={s.showroomShell}><div className={s.showroomTabs}><button type="button" aria-pressed={segment==="all"} onClick={()=>setSegment("all")}>{t("all")} <b>{experience.items.length}</b></button>{profile.segments.map(v=>{const count=segmentItems(experience.items,v).length;return count?<button type="button" key={v.key} aria-pressed={segment===v.key} onClick={()=>setSegment(v.key)}>{localized(v.label,locale)} <b>{count}</b></button>:null})}</div>{featured.length?<div className={s.showroomGrid}>{featured.map(item=><BusinessOfferCard key={item.id} item={item} compact/>)}</div>:<p className={s.finePrint}>{t("noOffer")}</p>}<Jump href="#world-offers">{t("all")} <ArrowRight size={15}/></Jump></div></section>
  <section className={s.models}><Head label="09 / COLLABORATION" title={t("models")} desc={t("modelsLead")}/><div className={s.modelGrid}>{H.properties.map((v,i)=><article key={v.id}><span>0{i+1}</span><Scene name={v.image} slot={"property."+v.id}/><div><h3>{tr(v.name)}</h3><p>{tr(v.body)}</p><button type="button" onClick={()=>{setProperty(i);setContext("property-type",tr(v.name));}}>{t("select")} <ChevronRight size={15}/></button></div></article>)}</div><div className={s.stepRail}><h3>{t("steps")}</h3><div>{H.steps.map((v,i)=><article key={i}><b>{String(i+1).padStart(2,"0")}</b><strong>{tr(v.title)}</strong><p>{tr(v.body)}</p></article>)}</div></div></section>
  <section className={s.planner}><Head label="10 / PLANNING" title={t("plan")} desc={t("planLead")}/><div className={s.plannerGrid}><div><label>{t("days")} <strong>{days}</strong><input type="range" min={1} max={90} value={days} onChange={e=>{const v=Number(e.target.value);setDays(v);setContext("hospitality-planning",v+" days × "+families+" families/day (estimate)");}}/></label><label>{t("family")} <strong>{families}</strong><input type="range" min={1} max={60} value={families} onChange={e=>{const v=Number(e.target.value);setFamilies(v);setContext("hospitality-planning",days+" days × "+v+" families/day (estimate)");}}/></label><p>{t("disclaimer")}</p></div><aside><span>{t("theoretical")}</span><strong>{new Intl.NumberFormat(locale==="ar"?"ar-MA":locale==="fr"?"fr-FR":"en-GB").format(days*families)}</strong><p>{t("disclaimer")}</p></aside></div></section>
  <section className={s.trust}><div className={s.trustImage}><Scene name="family" slot="trust.family"/></div><div><Head label="11 / CONFIDENCE" title={t("trust")} desc={t("trustLead")}/>{H.assurance.map((v,i)=><p className={s.trustLine} key={i}><ShieldCheck size={18}/>{tr(v)}</p>)}<Jump href="#world-enquiry">{t("consult")}</Jump></div></section>
  <section className={s.explorer} id="hospitality-solutions"><Head label="12 / DISCOVER" title={t("solutions")} desc={t("solutionsLead")}/><CommerceCatalogue/><ProjectSummary/></section>
  <section className={s.conversion} id="hotel-partnership-brief"><Head label="YOUR PARTNERSHIP" title={t("finish")} desc={t("finishLead")}/><div className={s.brief}><strong>{t("project")}</strong><p>{tr(selectedProperty.name)} · {tr(H.ages[age].title)} · {project.length} {locale==="fr"?"solutions sélectionnées":locale==="en"?"selected solutions":"حلول مختارة"}</p><small>{t("saved")}</small></div>{mode==="native"?<Enquiry world="hospitality" locale={locale} brief={summary.slice(0,1900)} sourceRoute={"/angelcare-marketplace/"+locale+"/hospitality"+(experience.territoryCode?"?territory="+encodeURIComponent(experience.territoryCode):"")}/>:null}</section>
 </div>;
}
