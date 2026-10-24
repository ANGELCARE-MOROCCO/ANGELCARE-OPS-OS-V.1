"use client";
import {useState}from "react";
import {usePathname}from "next/navigation";
import {path,tr,type Locale}from "./catalogue";
import {worldTile}from "./editorial";
import {navigateKidFlix}from "./navigation-events";
import {I}from "./Icons";
import {HomeArtwork}from "./HomeArtwork";
import type {Tri}from "./catalogue";
import s from "./kidflix.module.css";
const choices=[
  {key:"print",family:"printables",icon:"Printer",label:["Make something","Créer quelque chose","اصنع شيئاً"]},
  {key:"listen",family:"audio",icon:"Headphones",label:["Find a quiet moment","Un moment au calme","لحظة هادئة"]},
  {key:"classroom",family:"presentations",icon:"Presentation",label:["Inspire my classroom","Inspirer ma classe","ألهم فصلي"]},
  {key:"play",family:"activities",icon:"Puzzle",label:["Play and discover","Jouer et découvrir","العب واكتشف"]},
  {key:"read",family:"stories",icon:"BookOpen",label:["Get lost in a story","S’évader dans une histoire","انطلق في حكاية"]},
  {key:"learn",family:"learning",icon:"GraduationCap",label:["Grow a new skill","Cultiver une compétence","نمّ مهارة جديدة"]},
]as const;
const homeLabels:Record<string,Tri>={print:["Print and practise","Imprimer et s’exercer","اطبع وتدرّب"],listen:["Listen and learn","Écouter et apprendre","استمع وتعلّم"],classroom:["Prepare a lesson","Préparer une séance","حضّر درسًا"],play:["Sort and solve","Trier et résoudre","صنّف وحلّ"],read:["Read and understand","Lire et comprendre","اقرأ وافهم"],learn:["Build a skill","Développer une compétence","طوّر مهارة"]};
export function Launcher({locale,homeImages}:{locale:Locale;homeImages?:Record<string,string>}){
 const pathname=usePathname(),[purpose,setPurpose]=useState(homeImages ? "print" : "read"),[minutes,setMinutes]=useState("");
 if(/\/(experience|my|saved|privacy|about|accessibility)(\/|$)/.test(pathname))return null;
 return <section className={s.launcher} aria-labelledby="kidflix-discovery-heading">
  <div className={s.launcherHeading}><span className={s.eyebrow}>KIDFLIX · {tr(homeImages?["PRACTICAL LEARNING RESOURCES","DES SUPPORTS POUR APPRENDRE","موارد للتعلم والممارسة"]:["YOUR NEXT LITTLE ADVENTURE","VOTRE PROCHAINE PETITE AVENTURE","مغامرتك الصغيرة القادمة"],locale)}</span><h2 id="kidflix-discovery-heading">{tr(homeImages?["Choose what you want to practise.","Choisissez ce que vous voulez travailler.","اختر ما تريد التدرّب عليه."]:["Follow a little spark of curiosity.","Suivez une étincelle de curiosité.","اتبع شرارة صغيرة من الفضول."],locale)}</h2><p>{tr(homeImages?["Worksheets, picture cards, reading and professional planning tools. Start with your purpose.","Fiches, cartes illustrées, lecture et outils de préparation. Commencez par votre objectif.","أوراق عمل وبطاقات مصورة وقراءة وأدوات للتخطيط. ابدأ بهدفك."]:["A story, a new skill, a moment together. Where shall we begin?","Une histoire, un savoir, un moment ensemble. Par où commencer ?","حكاية أو مهارة جديدة أو لحظة معاً. من أين نبدأ؟"],locale)}</p></div>
  <form action={path(locale,"/explore")} onSubmit={e=>{e.preventDefault();const q=new URLSearchParams(location.search);for(const key of ["intent","audience","page","family","notFamily","keys"])q.delete(key);if(purpose==="classroom")q.set("audience","educator");else q.set("intent",purpose);if(minutes)q.set("duration",minutes);else q.delete("duration");navigateKidFlix(path(locale,"/explore")+"?"+q.toString());}}>
   <div className={s.launcherChoices} role="group" aria-label={tr(["Choose a discovery","Choisissez une découverte","اختر اكتشافاً"],locale)}>{choices.map(choice=><button type="button" key={choice.key} aria-pressed={purpose===choice.key} onClick={()=>setPurpose(choice.key)}>{homeImages?<HomeArtwork src={homeImages[choice.family]} alt="" width={800} height={533} loading="lazy"/>:<img src={worldTile(choice.family)} alt="" width={320} height={220} loading="lazy"/>}<span><I name={choice.icon} size={18}/>{tr(homeImages?homeLabels[choice.key]:choice.label,locale)}</span></button>)}</div>
   <div className={s.launcherActions}><label>{tr(["Time to explore","Temps disponible","الوقت المتاح"],locale)} <select aria-label={tr(["Minutes available","Minutes disponibles","الدقائق المتاحة"],locale)} value={minutes} onChange={e=>setMinutes(e.target.value)}><option value="">{tr(["At my own pace","À mon rythme","على مهلي"],locale)}</option>{[5,10,15,30,60].map(n=><option key={n} value={n}>{n} {tr(["min","min","د"],locale)}</option>)}</select></label><button className={s.primary} type="submit">{tr(["Find my next discovery","Trouver ma découverte","ابحث عن اكتشافي"],locale)}<I name="ArrowRight" size={18}/></button></div>
  </form>
 </section>;
}
