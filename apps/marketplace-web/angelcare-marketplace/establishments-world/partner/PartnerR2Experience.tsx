"use client";
import {useMemo,useState,type ReactNode} from "react";
import {
 ArrowDown,ArrowRight,ArrowUpRight,BookOpen,Building2,CalendarDays,Check,
 CheckCircle2,ChevronRight,Compass,FileCheck2,HeartHandshake,Layers3,
 Map,MessageCircle,Monitor,Network,Plus,Search,ShieldCheck,Sparkles,
 Users,Wallet,X, type LucideIcon
} from "lucide-react";
import {ManagedImage} from "../../marketplace-imagery/ManagedImage";
import {campaignAsset,campaignSet} from "../media";
import {useSessionValue} from "../useJourneyState";
import {CHAPTERS,MODULES,moduleByKey,recommended,type ChapterKey,type ModuleKey,type PartnerRequest} from "./content";
import {usePartner,type PartnerLocale} from "./Locale";
import s from "./PartnerR2Experience.module.css";

type P=[string,string,string];
const say=(locale:PartnerLocale,value:P)=>value[locale==="fr"?0:locale==="en"?1:2];
const txt=(locale:PartnerLocale,fr:string,en:string,ar:string)=>say(locale,[fr,en,ar]);
const MODULE_ICONS:Record<ModuleKey,LucideIcon>={
 direction:Monitor,sites:Network,reporting:Layers3,admissions:FileCheck2,crm:HeartHandshake,
 parents:Users,communication:MessageCircle,planning:CalendarDays,operations:CheckCircle2,
 rh:Users,formation:BookOpen,qualite:ShieldCheck,roles:ShieldCheck,plans:FileCheck2,
 services:Layers3,facturation:Wallet,paiements:Wallet,marketplace:Layers3,documents:FileCheck2,support:HeartHandshake
};
const WORLD_ICONS:Record<ChapterKey,LucideIcon>={
 direction:Building2,familles:HeartHandshake,quotidien:CalendarDays,
 equipes:Users,revenus:Wallet,ecosysteme:Network
};
type VisualKind="command"|"families"|"day"|"people"|"revenue"|"network";
type World={
 id:ChapterKey; label:P; eyebrow:P; headline:P; lead:P; result:P; visual:VisualKind;
 photo:string;second:string;third:string; accent:string;
 tags:[P,P,P];cases:{name:P;problem:P;change:P;module:ModuleKey}[];
};
const WORLDS:Record<ChapterKey,World>={
 direction:{
  id:"direction",label:["Direction","Leadership","الإدارة"],eyebrow:["VISION · ORGANISATION · DÉCISIONS","OVERVIEW · ORGANIZATION · DECISIONS","الرؤية · التنظيم · القرارات"],
  headline:["La bonne information. Au bon moment. Pour toute l'école.","The right information, at the right moment, for the whole school.","المعلومة المناسبة في الوقت المناسب لكل المؤسسة."],
  lead:["Passez d’informations dispersées à une lecture claire des sites, des priorités et de l’activité.","Turn scattered information into a clear view of sites, priorities and school activity.","حوّلوا المعلومات المتفرقة إلى رؤية واضحة للمواقع والأولويات والنشاط."],
  result:["Une direction mieux préparée à décider.","A management team better prepared to decide.","إدارة أكثر استعداداً لاتخاذ القرار."],
  visual:"command",photo:"partner-hero",second:"consulting-hero",third:"administration",accent:"blue",
  tags:[["Vue d'ensemble","Overview","نظرة شاملة"],["Réseau multi-sites","Multi-site network","شبكة متعددة المواقع"],["Indicateurs utiles","Useful indicators","مؤشرات مفيدة"]],
  cases:[
   {name:["Un seul établissement","One school","مؤسسة واحدة"],problem:["Les informations sont réparties entre plusieurs supports.","Information is scattered across different places.","المعلومات موزعة على أدوات متعددة."],change:["Un point de lecture pour préparer les réunions et décisions.","One shared overview to prepare meetings and decisions.","نظرة موحدة لتحضير الاجتماعات والقرارات."],module:"direction"},
   {name:["Plusieurs sites","Multiple sites","عدة مواقع"],problem:["Difficile de comparer les besoins entre établissements.","Difficult to understand needs across different schools.","يصعب فهم الاحتياجات بين المؤسسات."],change:["Retrouver les spécificités de chaque site et le contexte commun.","Compare each site's situation alongside the overall picture.","مقارنة كل موقع مع الحفاظ على الصورة العامة."],module:"sites"},
   {name:["Suivi des priorités","Priority reviews","متابعة الأولويات"],problem:["Les points à suivre restent souvent dispersés.","Follow-ups remain scattered across teams.","تبقى المتابعات مشتتة بين الفرق."],change:["Rassembler les indicateurs pertinents avant chaque revue.","Bring useful indicators together before each review.","تجميع المؤشرات المفيدة قبل كل مراجعة."],module:"reporting"}
  ]
 },
 familles:{
  id:"familles",label:["Familles","Families","الأسر"],eyebrow:["PREMIER CONTACT · CONFIANCE · CONTINUITÉ","FIRST CONTACT · TRUST · CONTINUITY","التواصل الأول · الثقة · الاستمرارية"],
  headline:["De la première question à une relation qui dure.","From the first question to a relationship that lasts.","من السؤال الأول إلى علاقة تدوم."],
  lead:["Une expérience lisible pour les familles, de la demande de renseignements aux nouvelles du quotidien.","Make the family journey clearer, from initial questions to everyday school updates.","اجعلوا تجربة الأسر أوضح، من الاستفسارات الأولى إلى أخبار الحياة اليومية."],
  result:["Des échanges mieux reliés, des familles mieux informées.","More connected conversations, better informed families.","تواصل أكثر ترابطاً وأسر أكثر اطلاعاً."],
  visual:"families",photo:"os-admissions",second:"welcome",third:"parents",accent:"rose",
  tags:[["Demande","Enquiry","استفسار"],["Visite","Visit","زيارة"],["Suivi","Follow-up","متابعة"]],
  cases:[
   {name:["Premier contact","First contact","التواصل الأول"],problem:["Une demande peut arriver sans contexte de suivi.","An enquiry can arrive without a clear follow-up.","قد يصل الاستفسار دون متابعة واضحة."],change:["Préparer la prochaine étape et retrouver l'historique utile.","Keep the useful context and prepare what comes next.","الاحتفاظ بالسياق وتحضير الخطوة التالية."],module:"crm"},
   {name:["Visite & inscription","Visit & enrolment","الزيارة والتسجيل"],problem:["Les étapes et les documents restent fragmentés.","Steps and documents may be fragmented.","قد تتفرق الخطوات والوثائق."],change:["Relier accueil, informations et préparation du dossier.","Connect the welcome, information and enrolment steps.","ربط الاستقبال والمعلومات وخطوات التسجيل."],module:"admissions"},
   {name:["Vie de l'école","School life","الحياة المدرسية"],problem:["Les familles ne disposent pas toujours des mêmes repères.","Families do not always receive consistent updates.","لا تتوصل الأسر دائماً بمعلومات متناسقة."],change:["Organiser messages, informations et continuité de la relation.","Organize communications and maintain continuity.","تنظيم الرسائل والمعلومات واستمرارية العلاقة."],module:"communication"}
  ]
 },
 quotidien:{
  id:"quotidien",label:["Vie de l'école","School life","الحياة المدرسية"],eyebrow:["PLANIFIER · COORDONNER · SUIVRE","PLAN · COORDINATE · FOLLOW UP","التخطيط · التنسيق · المتابعة"],
  headline:["Une journée fluide commence bien avant l'accueil.","A smoother school day starts before the doors open.","يبدأ اليوم المدرسي المنظم قبل فتح الأبواب."],
  lead:["Des activités, des ressources et des responsabilités enfin reliées dans le déroulement d'une journée.","Connect activities, resources and responsibilities across the school day.","اربطوا الأنشطة والموارد والمسؤوليات على مدار اليوم المدرسي."],
  result:["Moins d'improvisation. Plus de continuité.","Less improvisation. Better continuity.","ارتجال أقل واستمرارية أكبر."],
  visual:"day",photo:"os-activities",second:"classroom",third:"os-people-followup",accent:"teal",
  tags:[["Activités","Activities","الأنشطة"],["Équipe","Team","الفريق"],["Transmission","Handovers","تسليم المهام"]],
  cases:[
   {name:["Avant l'ouverture","Before opening","قبل الافتتاح"],problem:["Les ressources et activités sont préparées séparément.","Resources and activities are prepared separately.","تحضر الموارد والأنشطة بشكل منفصل."],change:["Planifier ensemble les moments, groupes et ressources utiles.","Coordinate moments, groups and materials in advance.","تنسيق الفترات والمجموعات والمواد مسبقاً."],module:"planning"},
   {name:["Pendant la journée","During the day","خلال اليوم"],problem:["La coordination dépend parfois de rappels informels.","Coordination may rely on informal reminders.","قد يعتمد التنسيق على تذكيرات شفهية."],change:["Clarifier les responsabilités et les actions à transmettre.","Make responsibilities and handovers clearer.","توضيح المسؤوليات وتسليم المهام."],module:"operations"},
   {name:["Après les activités","After activities","بعد الأنشطة"],problem:["Les suites à donner peuvent se perdre.","Next steps can be forgotten.","قد تضيع الخطوات التالية."],change:["Préparer la continuité et les ajustements à examiner.","Capture follow-ups and prepare adjustments.","تجميع المتابعات والتحضير للتعديلات."],module:"operations"}
  ]
 },
 equipes:{
  id:"equipes",label:["Équipes","People & teams","الفرق"],eyebrow:["RECRUTER · TRANSMETTRE · PROGRESSER","HIRE · TRAIN · DEVELOP","التوظيف · التدريب · التطوير"],
  headline:["L'excellence se construit en équipe, chaque jour.","Excellence is a team practice, built every day.","تُبنى الجودة داخل الفريق كل يوم."],
  lead:["Recrutement, intégration, formation, SOP et responsabilités : un cadre plus lisible pour les professionnels.","Connect hiring, onboarding, training, SOPs and responsibilities into a clearer team practice.","اربطوا التوظيف والإدماج والتكوين والإجراءات والمسؤوليات ضمن إطار واضح."],
  result:["Des pratiques partagées et des responsabilités plus claires.","Shared practices and clearer responsibilities.","ممارسات مشتركة ومسؤوليات أوضح."],
  visual:"people",photo:"os-team",second:"uniforms",third:"os-people-followup",accent:"violet",
  tags:[["Recrutement","Hiring","التوظيف"],["Formation","Training","التكوين"],["Qualité","Quality","الجودة"]],
  cases:[
   {name:["Intégrer un collaborateur","Onboard a colleague","إدماج موظف"],problem:["Les consignes et documents sont difficiles à retrouver.","Instructions and documents are hard to locate.","تصعب مراجعة التعليمات والوثائق."],change:["Préparer un parcours d'intégration et ses ressources.","Prepare a structured onboarding path.","تحضير مسار إدماج وموارده."],module:"rh"},
   {name:["Former l'équipe","Develop the team","تكوين الفريق"],problem:["La transmission des pratiques varie selon les personnes.","Practice-sharing depends on individuals.","يختلف نقل الممارسات بين الأفراد."],change:["Relier formation, compétences et supports utiles.","Connect development, skills and training materials.","ربط التكوين والمهارات والموارد."],module:"formation"},
   {name:["Standardiser les pratiques","Standardize practice","توحيد الإجراءات"],problem:["Les routines qualité ne sont pas suffisamment partagées.","Quality routines are not consistently shared.","لا تكون إجراءات الجودة موحدة دائماً."],change:["Partager des SOP, préparer les revues et définir les accès.","Share SOPs, prepare reviews and clarify permissions.","مشاركة الإجراءات وتحضير المراجعات وتحديد الصلاحيات."],module:"qualite"}
  ]
 },
 revenus:{
  id:"revenus",label:["Revenus","Revenue","الإيرادات"],eyebrow:["OFFRE · CONTRAT · FACTURE · SUIVI","OFFER · AGREEMENT · INVOICE · FOLLOW-UP","العرض · الاتفاق · الفاتورة · المتابعة"],
  headline:["De votre proposition au règlement, gardez le fil.","From your offer to payment, keep the whole story connected.","من العرض إلى الأداء، حافظوا على ترابط المعاملات."],
  lead:["Aidez la direction à relier offres, services, accords, facturation et suivi des paiements.","Help school management connect offers, services, agreements, invoicing and payment follow-up.","ساعدوا الإدارة على ربط العروض والخدمات والاتفاقات والفوترة ومتابعة الأداءات."],
  result:["Un parcours commercial compréhensible, sans chiffres fictifs.","A clear commercial flow, without fictional figures.","مسار تجاري واضح دون أرقام افتراضية."],
  visual:"revenue",photo:"os-quotes",second:"os-services",third:"administration",accent:"amber",
  tags:[["Offres","Offers","العروض"],["Factures","Invoices","الفواتير"],["Suivi","Follow-up","المتابعة"]],
  cases:[
   {name:["Préparer une offre","Prepare an offer","تحضير عرض"],problem:["Le périmètre commercial n'est pas toujours explicite.","The commercial scope is not always explicit.","لا يكون نطاق العرض واضحاً دائماً."],change:["Structurer plans, services et conditions à examiner.","Clarify plans, services and conditions before agreement.","توضيح الخطط والخدمات والشروط قبل الاتفاق."],module:"plans"},
   {name:["Organiser la facturation","Organize invoices","تنظيم الفوترة"],problem:["Les informations sont réparties entre différents suivis.","Information lives in different records.","تنتشر المعلومات بين سجلات مختلفة."],change:["Relier accord, échéances et pièces pertinentes.","Connect agreements, dates and relevant documents.","ربط الاتفاقات والمواعيد والوثائق."],module:"facturation"},
   {name:["Suivre les règlements","Follow payments","متابعة الأداءات"],problem:["Les relances manquent parfois de contexte.","Reminders may lack the right context.","قد تفتقر التذكيرات إلى السياق."],change:["Préparer une lecture cohérente des paiements et relances.","Give payment tracking and reminders a clear context.","توفير سياق واضح لمتابعة الأداء والتذكيرات."],module:"paiements"}
  ]
 },
 ecosysteme:{
  id:"ecosysteme",label:["Écosystème","Connected ecosystem","المنظومة"],eyebrow:["SERVICES · DOCUMENTS · ASSISTANCE","SERVICES · DOCUMENTS · SUPPORT","الخدمات · الوثائق · المساعدة"],
  headline:["Votre établissement évolue. Votre environnement aussi.","Your school evolves. Your environment should too.","تتطور مؤسستكم، وتتطور معها منظومتكم."],
  lead:["Connectez les besoins complémentaires, les documents et l'accompagnement au reste de vos pratiques.","Relate complementary services, documents and support to the way your school operates.","اربطوا الخدمات المكملة والوثائق والمساعدة بباقي أنشطة مؤسستكم."],
  result:["Un écosystème à votre rythme, selon votre périmètre.","An ecosystem shaped around your needs.","منظومة تتكيف مع احتياجاتكم."],
  visual:"network",photo:"os-overview",second:"os-people-commerce",third:"os-people-team",accent:"green",
  tags:[["Documents","Documents","الوثائق"],["Assistance","Support","الدعم"],["Extensions","Add-ons","الإضافات"]],
  cases:[
   {name:["Relier mes dossiers","Connect documents","ربط الوثائق"],problem:["Les pièces utiles sont dispersées entre plusieurs étapes.","Important files are spread across different steps.","الملفات المهمة موزعة بين خطوات مختلفة."],change:["Rapprocher les documents de leurs usages et responsables.","Connect files to the people and processes that need them.","ربط الملفات بالأشخاص والعمليات المعنية."],module:"documents"},
   {name:["Préparer l'assistance","Prepare support","تحضير الدعم"],problem:["Les demandes d'aide manquent parfois de suivi.","Requests for help may lack follow-up.","قد تفتقر طلبات المساعدة إلى متابعة."],change:["Clarifier la demande, son contexte et sa prochaine étape.","Clarify the request, its context and the next step.","توضيح الطلب وسياقه والخطوة التالية."],module:"support"},
   {name:["Élargir mes usages","Extend my setup","توسيع الاستخدام"],problem:["Les besoins évoluent au fil de l'activité.","New needs emerge as school operations evolve.","تظهر حاجات جديدة مع تطور المؤسسة."],change:["Explorer les extensions adaptées sans engagement automatique.","Explore relevant add-ons without automatic commitments.","استكشاف الإضافات المناسبة دون أي التزام تلقائي."],module:"marketplace"}
  ]
 }
};
const chapterOrder:ChapterKey[]=["direction","familles","quotidien","equipes","revenus","ecosysteme"];
function Photo({name,slot,alt,priority=false}:{name:string;slot:string;alt:string;priority?:boolean}){
 return <ManagedImage slot={"journey-partner.r2."+slot} src={campaignAsset(name)} srcSet={campaignSet(name)}
  sizes={priority?"(min-width:1400px) 790px, (min-width:760px) 56vw, 100vw":"(min-width:1400px) 480px, (min-width:760px) 38vw, 85vw"}
  width={1536} height={1024} alt={alt} loading={priority?"eager":"lazy"}
  fetchPriority={priority?"high":undefined} decoding="async"/>;
}
export function PartnerR2Hero({onContact,onExplore}:{onContact:()=>void;onExplore:()=>void}){
 const {locale,t}=usePartner();
 const [focus,setFocus]=useState(0);
 const focusCases=[
  {label:["Je dirige","I lead a school","أدير مؤسسة"] as P,icon:Building2,key:"direction" as ModuleKey,
   description:["Vue d'ensemble, multi-sites et décisions à préparer.","Overview, multiple sites and decisions to prepare.","نظرة شاملة ومواقع متعددة وقرارات للتحضير."] as P},
  {label:["Je coordonne","I coordinate teams","أنسق الفرق"] as P,icon:Users,key:"planning" as ModuleKey,
   description:["Activités, équipe et continuité du quotidien.","Activities, teams and continuity through the day.","الأنشطة والفرق واستمرارية العمل اليومي."] as P},
  {label:["Je développe","I grow my school","أطور مؤسستي"] as P,icon:Sparkles,key:"admissions" as ModuleKey,
   description:["Admissions, communication et relation familles.","Admissions, communication and family relationships.","التسجيل والتواصل والعلاقات مع الأسر."] as P}
 ];
 const active=focusCases[focus];
 const Icon=active.icon;
 return <section className={s.signatureHero} data-partner-r2="hero" dir={locale==="ar"?"rtl":"ltr"}>
  <div className={s.signatureTop}>
   <div className={s.heroCopy}>
    <span className={s.sectionKicker}><span className={s.liveDot}/>{txt(locale,"ANGELCARE · PARTNER OS · ÉDITION PROFESSIONNELLE","ANGELCARE · PARTNER OS · PROFESSIONAL EDITION","أنجل كير · بارتنر أو إس · النسخة المهنية")}</span>
    <h1>{txt(locale,"Votre établissement mérite","Your school deserves","تستحق مؤسستكم")} <em>{txt(locale,"plus qu'un logiciel.","more than software.","أكثر من برنامج.")}</em></h1>
    <p className={s.heroIntro}>{txt(locale,"Direction, familles, équipes, quotidien et revenus : découvrez un environnement qui relie vos priorités et donne de l'élan à votre école.","Leadership, families, people, daily operations and revenue: discover an environment designed to connect priorities and move your school forward.","الإدارة والأسر والفرق والعمليات والإيرادات: اكتشفوا بيئة تربط الأولويات وتدعم تطور مؤسستكم.")}</p>
    <div className={s.heroActions}>
     <button className={s.hotButton} onClick={onExplore}>{txt(locale,"Explorer les 20 domaines","Explore 20 capabilities","استكشفوا ٢٠ مجالاً")}<ArrowDown size={18}/></button>
     <button className={s.lightButton} onClick={onContact}>{txt(locale,"Construire mon projet","Build my project","إعداد مشروعي")}<ArrowRight size={17}/></button>
    </div>
    <div className={s.focusSelector} role="group" aria-label={txt(locale,"Choisissez votre situation","Choose your situation","اختاروا وضعيتكم")}>
     {focusCases.map((c,i)=>{const I=c.icon;return <button type="button" key={c.key} aria-pressed={focus===i} onClick={()=>setFocus(i)}><I size={17}/><span>{say(locale,c.label)}</span></button>})}
    </div>
    <div className={s.focusResult} aria-live="polite"><Icon size={19}/><span>{say(locale,active.description)}</span><ChevronRight size={16}/></div>
   </div>
   <div className={s.heroComposition}>
    <div className={s.heroImage}><Photo name="partner-hero" slot="hero.main" alt={txt(locale,"Équipe de direction dans un établissement","School leadership team","فريق إدارة المؤسسة")} priority/></div>
    <div className={s.heroPhotoSecondary}><Photo name="os-admissions" slot="hero.family" alt={txt(locale,"Rencontre avec une famille","Conversation with a family","لقاء مع أسرة")}/></div>
    <div className={s.heroPhotoTertiary}><Photo name="os-team" slot="hero.team" alt={txt(locale,"Équipe éducative en préparation","Teaching staff preparing together","فريق تربوي أثناء التحضير")}/></div>
    <div className={s.heroFloatingSystem}>
     <div className={s.floatingHead}><span className={s.liveDot}/><strong>PARTNER OS</strong><span>{txt(locale,"Vue conceptuelle","Illustrative view","عرض توضيحي")}</span></div>
     <div className={s.floatingLines}>
      {chapterOrder.slice(0,4).map((id,i)=>{const I=WORLD_ICONS[id];return <span key={id}><I size={16}/><b>{say(locale,WORLDS[id].label)}</b><i style={{width:(60+(i*11))+"%"}}/></span>})}
     </div>
     <small>{txt(locale,"Démonstration éditoriale · pas de données d'exploitation","Editorial demonstration · no live operating data","عرض تحريري توضيحي · دون بيانات تشغيل فعلية")}</small>
    </div>
    <div className={s.heroVisualNote}><Sparkles size={15}/>{txt(locale,"Un environnement, plusieurs façons d'avancer","One environment, many ways to move forward","بيئة واحدة وطرق متعددة للتطور")}</div>
   </div>
  </div>
  <div className={s.heroScopeRibbon}>
   <div><strong>06</strong><span>{txt(locale,"univers professionnels","professional worlds","مجالات مهنية")}</span></div>
   <div><strong>20</strong><span>{txt(locale,"domaines connectés","connected capabilities","مجالاً مترابطاً")}</span></div>
   <div><strong>FR · EN · AR</strong><span>{txt(locale,"même expérience","same experience","التجربة نفسها")}</span></div>
   <div><ShieldCheck size={22}/><span>{txt(locale,"Périmètre ajusté à votre établissement","Scope adapted to your school","نطاق يناسب مؤسستكم")}</span></div>
  </div>
 </section>;
}
export function PartnerR2WorldLead({chapter,onOpen,onAdd,selected,storageScope}:{chapter:ChapterKey;onOpen:(key:ModuleKey)=>void;onAdd:(key:ModuleKey)=>void;selected:readonly ModuleKey[];storageScope:string}){
 const {locale,t}=usePartner();const world=WORLDS[chapter];const [active,setActive]=useSessionValue<number>("ac.partner.r2.case.v1:"+storageScope+":"+chapter,0,v=>typeof v==="number"&&Number.isInteger(v)&&v>=0&&v<3?v:0);const choice=world.cases[active];const ChapterIcon=WORLD_ICONS[chapter];const ChoiceIcon=MODULE_ICONS[choice.module];
 const processes:Record<VisualKind,P[]>={
  command:[["Sites","Sites","المواقع"],["Pilotage","Overview","القيادة"],["Décisions","Decisions","القرارات"]],
  families:[["Premier contact","First contact","التواصل الأول"],["Visite","Visit","الزيارة"],["Inscription","Enrolment","التسجيل"],["Relation","Relationship","العلاقة"]],
  day:[["Accueillir","Welcome","الاستقبال"],["Activités","Activities","الأنشطة"],["Coordonner","Coordinate","التنسيق"],["Suivre","Follow up","المتابعة"]],
  people:[["Recruter","Hire","التوظيف"],["Intégrer","Onboard","الإدماج"],["Former","Train","التكوين"],["Évaluer","Review","التقييم"]],
  revenue:[["Offre","Offer","العرض"],["Accord","Agreement","الاتفاق"],["Facture","Invoice","الفاتورة"],["Règlement","Payment","الأداء"]],
  network:[["Documents","Documents","الوثائق"],["Support","Support","الدعم"],["Services","Services","الخدمات"],["Partenaires","Partners","الشركاء"]]
 };
 return <div className={s.worldExperience} data-world={chapter} dir={locale==="ar"?"rtl":"ltr"}>
  <div className={s.worldMain}>
   <div className={s.worldNarrative}>
    <span className={s.worldEyebrow}><ChapterIcon size={17}/>{say(locale,world.eyebrow)}</span>
    <h3>{say(locale,world.headline)}</h3>
    <p>{say(locale,world.lead)}</p>
    <div className={s.worldTags}>{world.tags.map((tag,i)=><span key={i}><Check size={12}/>{say(locale,tag)}</span>)}</div>
    <div className={s.worldResult}><CheckCircle2 size={18}/><span>{say(locale,world.result)}</span></div>
   </div>
   <div className={s.worldPhotoLayout}>
    <figure className={s.worldMainPhoto}><Photo name={world.photo} slot={chapter+".main"} alt={say(locale,world.label)}/></figure>
    <figure className={s.worldMiniA}><Photo name={world.second} slot={chapter+".secondary"} alt={say(locale,world.tags[0])}/></figure>
    <figure className={s.worldMiniB}><Photo name={world.third} slot={chapter+".tertiary"} alt={say(locale,world.tags[1])}/></figure>
    <span className={s.photoEditorial}><Sparkles size={14}/>{txt(locale,"Applications professionnelles · exemple illustratif","Professional applications · illustrative example","تطبيقات مهنية · مثال توضيحي")}</span>
   </div>
  </div>
  <div className={s.visualProcess} data-process={world.visual} aria-label={txt(locale,"Étapes du parcours","Journey steps","مراحل المسار")}>
   {processes[world.visual].map((label,i)=><div key={i}><span>{String(i+1).padStart(2,"0")}</span><strong>{say(locale,label)}</strong>{i<processes[world.visual].length-1?<ArrowRight size={14}/>:null}</div>)}
  </div>
  <div className={s.worldCases}>
   <div className={s.caseIntro}><span>{txt(locale,"Mise en situation","Professional scenario","حالة مهنية")}</span><strong>{txt(locale,"Choisissez un problème réel à résoudre","Choose an everyday challenge","اختاروا تحدياً يومياً")}</strong></div>
   <div className={s.caseTabs} role="group" aria-label={txt(locale,"Explorer les situations","Explore situations","استكشاف الحالات")}>
    {world.cases.map((c,i)=><button type="button" key={i} aria-pressed={active===i} onClick={()=>setActive(i)}>{say(locale,c.name)}<ChevronRight size={13}/></button>)}
   </div>
   <div className={s.caseAnswer} aria-live="polite">
    <div><small>{txt(locale,"Le problème","The challenge","التحدي")}</small><p>{say(locale,choice.problem)}</p></div>
    <ArrowRight className={s.answerConnector} size={23}/>
    <div><small>{txt(locale,"Ce que Partner OS aide à organiser","What Partner OS helps organize","ما يساعد بارتنر أو إس على تنظيمه")}</small><p>{say(locale,choice.change)}</p></div>
    <div className={s.answerActions}>
     <button type="button" onClick={()=>onOpen(choice.module)}><ChoiceIcon size={16}/>{t(moduleByKey(choice.module).label)}<ArrowUpRight size={15}/></button>
     <button type="button" aria-pressed={selected.includes(choice.module)} onClick={()=>onAdd(choice.module)}>{selected.includes(choice.module)?<Check size={15}/>:<Plus size={15}/>}
      {selected.includes(choice.module)?txt(locale,"Dans mon projet","In my project","ضمن مشروعي"):txt(locale,"Retenir cette piste","Save this option","حفظ هذا الخيار")}</button>
    </div>
   </div>
  </div>
 </div>;
}
export function PartnerR2ModuleSwitcher({chapter,items,render}:{chapter:ChapterKey;items:readonly ModuleKey[];render:(key:ModuleKey)=>ReactNode}){
 const {locale,t}=usePartner();const [key,setKey]=useState<ModuleKey>(items[0]);
 const chosen=items.includes(key)?key:items[0];const world=WORLDS[chapter];
 return <div className={s.moduleWorkbench} data-chapter={chapter}>
  <div className={s.moduleWorkbenchHeader}>
   <div><span><Layers3 size={16}/>{txt(locale,"MODULES DE CET UNIVERS","CAPABILITIES IN THIS WORLD","مجالات هذا القسم")}</span><h3>{txt(locale,"Explorez les domaines, un par un.","Explore each capability in context.","استكشفوا كل مجال في سياقه.")}</h3></div>
   <span className={s.countLabel}>{items.length} {txt(locale,"domaines","capabilities","مجالات")}</span>
  </div>
  <div className={s.moduleWorkbenchBody}>
   <nav className={s.moduleRail} aria-label={txt(locale,"Choisir un domaine","Choose a capability","اختيار مجال")}>
    {items.map((id,i)=>{const I=MODULE_ICONS[id];return <button type="button" key={id} aria-current={chosen===id?"true":undefined} onClick={()=>setKey(id)}><span>{String(i+1).padStart(2,"0")}</span><I size={19}/><strong>{t(moduleByKey(id).label)}</strong><ChevronRight size={15}/></button>})}
    <small>{txt(locale,"Données métier issues des 20 domaines de Partner OS.","Business content from the 20 Partner OS capabilities.","محتوى مهني مستند إلى مجالات بارتنر أو إس العشرين.")}</small>
   </nav>
   <div className={s.moduleFeature} key={chosen}>
    <div className={s.moduleFeatureBar}><span><CheckCircle2 size={14}/>{say(locale,world.label)}</span><span>{t(moduleByKey(chosen).tag)}</span></div>
    {render(chosen)}
   </div>
  </div>
 </div>;
}
export function PartnerR2Atlas({onOpen,onAdd,selected}:{onOpen:(key:ModuleKey)=>void;onAdd:(key:ModuleKey)=>void;selected:readonly ModuleKey[]}){
 const {locale,t}=usePartner();const [query,setQuery]=useState("");const [family,setFamily]=useState<ChapterKey|"all">("all");
 const items=useMemo(()=>MODULES.filter(m=>{
  const belongs=family==="all"||CHAPTERS.find(ch=>ch.key===family)?.modules.some(key=>key===m.key);
  const q=query.trim().toLocaleLowerCase();
  return belongs&&(!q||[m.key,t(m.label),t(m.tag),t(m.summary),...m.uses.map(t),...m.benefits.map(t)].join(" ").toLocaleLowerCase().includes(q));
 }),[query,family,t]);
 return <section className={s.atlas} id="pos-atlas" data-partner-r2="atlas" dir={locale==="ar"?"rtl":"ltr"}>
  <div className={s.atlasHeader}><div><span className={s.sectionKicker}><Map size={16}/>{txt(locale,"ATLAS INTERACTIF · 20 DOMAINES","INTERACTIVE ATLAS · 20 CAPABILITIES","دليل تفاعلي · ٢٠ مجالاً")}</span><h2>{txt(locale,"Une seule organisation.","One connected organization.","مؤسسة واحدة مترابطة.")} <em>{txt(locale,"Toutes vos possibilités.","Every capability in context.","كل الإمكانيات في سياقها.")}</em></h2><p>{txt(locale,"Explorez les domaines selon votre sujet. Comprenez les usages, les bénéfices et les liens avant de retenir vos priorités.","Explore by theme. Understand each capability, its uses, benefits and connections before deciding what matters to your school.","استكشفوا المجالات حسب الموضوع وافهموا الاستخدامات والفوائد والروابط قبل تحديد الأولويات.")}</p></div><div className={s.atlasCounter}><strong>{items.length.toString().padStart(2,"0")}</strong><span>{txt(locale,"sur 20 domaines","of 20 capabilities","من أصل ٢٠ مجالاً")}</span></div></div>
  <div className={s.atlasControls}>
   <label className={s.atlasSearch}><Search size={20}/><span className={s.srOnly}>{txt(locale,"Rechercher un domaine","Search capabilities","البحث عن مجال")}</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={txt(locale,"Un défi, un besoin, un mot-clé…","A challenge, a need, a keyword…","تحدٍّ أو حاجة أو كلمة مفتاحية…")}/>{query?<button type="button" onClick={()=>setQuery("")} aria-label={txt(locale,"Effacer la recherche","Clear search","مسح البحث")}><X size={16}/></button>:null}</label>
   <div className={s.atlasFamilies} role="group" aria-label={txt(locale,"Filtrer par univers","Filter by world","تصفية حسب المجال")}>
    <button type="button" aria-pressed={family==="all"} onClick={()=>setFamily("all")}>{txt(locale,"Tout voir","All","الكل")}</button>
    {chapterOrder.map(id=><button key={id} type="button" aria-pressed={family===id} onClick={()=>setFamily(id)}>{say(locale,WORLDS[id].label)}</button>)}
   </div>
  </div>
  <div className={s.atlasGrid}>
   {items.map((m,i)=>{const I=MODULE_ICONS[m.key];const active=selected.includes(m.key);const world=CHAPTERS.find(c=>c.modules.some(key=>key===m.key))!.key;
    return <article key={m.key} className={s.atlasItem} data-world={world} data-selected={active}>
     <div className={s.atlasItemTop}><span className={s.atlasIcon}><I size={23}/></span><span className={s.atlasTag}>{t(m.tag)}</span><button type="button" onClick={()=>onAdd(m.key)} aria-pressed={active} aria-label={t(active?"Retirer du brief":"Ajouter au brief")+" · "+t(m.label)}>{active?<Check size={16}/>:<Plus size={16}/>}</button></div>
     <h3>{t(m.label)}</h3><p>{t(m.summary)}</p>
     <div className={s.atlasUses}>{m.uses.slice(0,2).map(v=><span key={v}>{t(v)}</span>)}</div>
     <button type="button" className={s.atlasOpen} onClick={()=>onOpen(m.key)}>{txt(locale,"Explorer le cas d'usage","Explore the use case","استكشفوا الاستخدام")}<ArrowUpRight size={16}/></button>
    </article>
   })}
   {!items.length?<div className={s.noResults}><Search size={28}/><strong>{txt(locale,"Aucun domaine correspondant","No matching capability","لا يوجد مجال مطابق")}</strong><button type="button" onClick={()=>{setQuery("");setFamily("all")}}>{txt(locale,"Voir tous les domaines","Show every capability","عرض جميع المجالات")}</button></div>:null}
  </div>
  <div className={s.atlasFoot}><Compass size={20}/><p>{txt(locale,"Les modules sont des domaines à étudier. Leur activation, leurs conditions et leur disponibilité restent à confirmer avec l'équipe.","These capabilities are subjects to explore. Activation, availability and terms require confirmation with our team.","هذه المجالات للاستكشاف. التفعيل والتوافر والشروط تخضع للتأكيد مع الفريق.")}</p></div>
 </section>;
}
export function PartnerR2ProjectMap({request,onAdd,onOpen,onContact}:{request:PartnerRequest;onAdd:(key:ModuleKey)=>void;onOpen:(key:ModuleKey)=>void;onContact:()=>void}){
 const {locale,t}=usePartner();const selected=request.modules;const suggested=recommended(request).filter(k=>!selected.includes(k));
 return <div className={s.projectMap} data-partner-r2="project-map" dir={locale==="ar"?"rtl":"ltr"}>
  <div className={s.projectMapHead}><div><span className={s.sectionKicker}><Layers3 size={16}/>{txt(locale,"STUDIO MON PARTNER OS","MY PARTNER OS STUDIO","استوديو بارتنر أو إس")}</span><h3>{txt(locale,"Composez un environnement qui vous ressemble.","Shape an environment around your school.","كوّنوا بيئة تناسب مؤسستكم.")}</h3><p>{txt(locale,"La sélection ci-dessous est enregistrée dans votre brief. Elle n'active aucun service et ne constitue pas une commande.","Selections are saved in your project brief. They do not activate services or place an order.","تُحفظ الاختيارات ضمن ملخص المشروع ولا تفعّل خدمات أو تنشئ طلب شراء.")}</p></div><div className={s.projectMapCount}><strong>{selected.length.toString().padStart(2,"0")}<span>/20</span></strong><small>{txt(locale,"domaines retenus","selected capabilities","مجالات مختارة")}</small></div></div>
  <div className={s.projectWorlds}>
   {chapterOrder.map(id=>{const world=WORLDS[id],Icon=WORLD_ICONS[id],ch=CHAPTERS.find(c=>c.key===id)!,chosen=ch.modules.filter(k=>selected.includes(k));return <div className={s.projectWorld} data-world={id} key={id}>
    <div className={s.projectWorldTitle}><Icon size={18}/><strong>{say(locale,world.label)}</strong><b>{chosen.length}/{ch.modules.length}</b></div>
    <div className={s.projectWorldLinks}>{ch.modules.map(k=><button type="button" key={k} aria-pressed={selected.includes(k)} onClick={()=>onAdd(k)} title={t(moduleByKey(k).label)}>{selected.includes(k)?<Check size={12}/>:<Plus size={12}/>}<span>{t(moduleByKey(k).label)}</span></button>)}</div>
   </div>})}
  </div>
  <div className={s.projectMapFooter}><div><small>{txt(locale,"Votre situation","Your situation","وضعيتكم")}</small><strong>{t(request.situation)}</strong><small>{t(request.sites)} · {t(request.horizon)}</small></div>
   <div><small>{txt(locale,"À examiner ensuite","Suggested next steps","الخطوات المقترحة")}</small><div className={s.projectSuggestions}>{suggested.slice(0,3).map(k=><button key={k} type="button" onClick={()=>onOpen(k)}><Plus size={12}/>{t(moduleByKey(k).label)}</button>)}{!suggested.length?<span>{txt(locale,"Vos priorités sont prêtes à être discutées.","Your priorities are ready to discuss.","أولوياتكم جاهزة للنقاش.")}</span>:null}</div></div>
   <button className={s.hotButton} type="button" onClick={onContact}>{txt(locale,"Préparer mon échange","Prepare my discussion","التحضير للنقاش")}<ArrowRight size={17}/></button>
  </div>
 </div>;
}
export function PartnerR2MobileNav({selected,onExplore,onWorlds,onAtlas,onProject}:{selected:number;onExplore:()=>void;onWorlds:()=>void;onAtlas:()=>void;onProject:()=>void}){
 const {locale}=usePartner();const actions=[
  {name:["Offres","Offers","العروض"] as P,Icon:Search,onClick:onExplore},
  {name:["Univers","Worlds","المجالات"] as P,Icon:Compass,onClick:onWorlds},
  {name:["Domaines","Atlas","الدليل"] as P,Icon:Layers3,onClick:onAtlas},
  {name:["Mon projet","My project","مشروعي"] as P,Icon:Building2,onClick:onProject}
 ];return <nav className={s.mobileNav} aria-label={txt(locale,"Navigation Partner OS sur mobile","Partner OS mobile navigation","تنقل بارتنر أو إس على الهاتف")} dir={locale==="ar"?"rtl":"ltr"}>{actions.map((a,i)=><button type="button" key={i} onClick={a.onClick}><a.Icon size={20}/><span>{say(locale,a.name)}</span>{i===3&&selected>0?<b>{selected}</b>:null}</button>)}</nav>;
}
