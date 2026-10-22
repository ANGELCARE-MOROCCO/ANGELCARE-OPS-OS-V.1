"use client";
import {useState}from "react";
import {usePathname}from "next/navigation";
import {path,tr,type Locale}from "./catalogue";
import {worldTile}from "./editorial";
import {navigateKidFlix}from "./navigation-events";
import {I}from "./Icons";
import s from "./kidflix.module.css";
const choices=[
  {key:"print",family:"printables",icon:"Printer",label:["Make something","Créer quelque chose","اصنع شيئاً"]},
  {key:"listen",family:"audio",icon:"Headphones",label:["Find a quiet moment","Un moment au calme","لحظة هادئة"]},
  {key:"classroom",family:"presentations",icon:"Presentation",label:["Inspire my classroom","Inspirer ma classe","ألهم فصلي"]},
  {key:"play",family:"activities",icon:"Puzzle",label:["Play and discover","Jouer et découvrir","العب واكتشف"]},
  {key:"read",family:"stories",icon:"BookOpen",label:["Get lost in a story","S’évader dans une histoire","انطلق في حكاية"]},
  {key:"learn",family:"learning",icon:"GraduationCap",label:["Grow a new skill","Cultiver une compétence","نمّ مهارة جديدة"]},
]as const;
export function Launcher({locale}:{locale:Locale}){
 const pathname=usePathname(),[purpose,setPurpose]=useState("read"),[minutes,setMinutes]=useState("");
 if(/\/(experience|my|saved|privacy|about|accessibility)(\/|$)/.test(pathname))return null;
 return <section className={s.launcher} aria-labelledby="kidflix-discovery-heading">
  <div className={s.launcherHeading}><span className={s.eyebrow}>KIDFLIX · {tr(["YOUR NEXT LITTLE ADVENTURE","VOTRE PROCHAINE PETITE AVENTURE","مغامرتك الصغيرة القادمة"],locale)}</span><h2 id="kidflix-discovery-heading">{tr(["Follow a little spark of curiosity.","Suivez une étincelle de curiosité.","اتبع شرارة صغيرة من الفضول."],locale)}</h2><p>{tr(["A story, a new skill, a moment together. Where shall we begin?","Une histoire, un savoir, un moment ensemble. Par où commencer ?","حكاية أو مهارة جديدة أو لحظة معاً. من أين نبدأ؟"],locale)}</p></div>
  <form action={path(locale,"/explore")} onSubmit={e=>{e.preventDefault();const q=new URLSearchParams(location.search);for(const key of ["intent","audience","page","family","notFamily","keys"])q.delete(key);if(purpose==="classroom")q.set("audience","educator");else q.set("intent",purpose);if(minutes)q.set("duration",minutes);else q.delete("duration");navigateKidFlix(path(locale,"/explore")+"?"+q.toString());}}>
   <div className={s.launcherChoices} role="group" aria-label={tr(["Choose a discovery","Choisissez une découverte","اختر اكتشافاً"],locale)}>{choices.map(choice=><button type="button" key={choice.key} aria-pressed={purpose===choice.key} onClick={()=>setPurpose(choice.key)}><img src={worldTile(choice.family)} alt="" width={320} height={220} loading="lazy"/><span><I name={choice.icon} size={18}/>{tr(choice.label,locale)}</span></button>)}</div>
   <div className={s.launcherActions}><label>{tr(["Time to explore","Temps disponible","الوقت المتاح"],locale)} <select aria-label={tr(["Minutes available","Minutes disponibles","الدقائق المتاحة"],locale)} value={minutes} onChange={e=>setMinutes(e.target.value)}><option value="">{tr(["At my own pace","À mon rythme","على مهلي"],locale)}</option>{[5,10,15,30,60].map(n=><option key={n} value={n}>{n} {tr(["min","min","د"],locale)}</option>)}</select></label><button className={s.primary} type="submit">{tr(["Find my next discovery","Trouver ma découverte","ابحث عن اكتشافي"],locale)}<I name="ArrowRight" size={18}/></button></div>
  </form>
 </section>;
}
