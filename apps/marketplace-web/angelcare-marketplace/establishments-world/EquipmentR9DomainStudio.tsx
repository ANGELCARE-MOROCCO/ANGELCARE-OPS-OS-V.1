"use client";
import {useEffect,useState,type ReactNode} from "react";
import {
 ArrowRight,ArrowLeft,Check,CheckCircle2,ChevronRight,Compass,BookOpen,
 Camera,GraduationCap,Layers3,Palette,MoveHorizontal,MapPin,Eye,PenLine,
 RotateCcw,ClipboardList,Clock3,ShieldCheck,Users,Heart,Package,Tag,
 Sun,CalendarDays,FileCheck2,Boxes,Settings2,Info,Star,Search,Plus,
 Minus,BookMarked,Building2,HandHeart,Send
} from "lucide-react";
import {ManagedImage} from "../marketplace-imagery/ManagedImage";
import {EQUIPMENT_DOMAINS,type EquipmentDomain} from "./equipment-r8-data";
import {R9_PROGRAMS,type R9Program,type R9Preference,R9_AGE_BANDS} from "./equipment-r9-programs";
import c from "./EquipmentR9DomainStudio.module.css";

const lookup=(id:string)=>EQUIPMENT_DOMAINS.find(d=>d.id===id);
function Art({domain,kind="feature",position="center"}:{domain:EquipmentDomain;kind?:string;position?:string}){
 return <ManagedImage slot={`equipment-r9.${domain.id}.${kind}`} src={`/angelcare-marketplace/establishments-r2/${domain.art}.png`} width={1050} height={750} loading="lazy" decoding="async" alt={`Illustration photographique : ${domain.name}`}/>;
}
function SceneArt({domain,kind="media",position="center"}:{domain:EquipmentDomain;kind?:string;position?:string}){
 return <div className={c.sceneArt}><Art domain={domain} kind={kind} position={position}/><span className={c.editorialNote}>Mise en situation indicative · catégories du catalogue</span></div>;
}
function SmallArt({domain,id}:{domain:EquipmentDomain;id:string}){
 return <div className={c.smallArt}><Art domain={domain} kind={id}/></div>;
}
function SelectionButtons({program,pref,onChoose}:{program:R9Program;pref:R9Preference;onChoose:(choice:number)=>void}){
 return <div className={c.choiceRail} role="group" aria-label="Explorer les options">{program.choices.map((choice,i)=><button type="button" key={choice} aria-pressed={pref.choice===i} className={pref.choice===i?c.choiceActive:""} onClick={()=>onChoose(i)}><span>{String(i+1).padStart(2,"0")}</span>{choice}</button>)}</div>;
}
function StageRibbon({program,pref}:{program:R9Program;pref:R9Preference}){
 return <div className={c.stageRibbon}><span><CheckCircle2 size={16}/> Situation professionnelle</span><strong>{program.choices[pref.choice]}</strong><small>{program.value}</small></div>;
}
function SegmentPanels({program,pref,labels}:{program:R9Program;pref:R9Preference;labels?:string[]}){
 return <div className={c.segmentPanels}>{program.choices.map((choice,i)=><div key={choice} data-on={i===pref.choice}><span>0{i+1}</span><strong>{labels?.[i]||choice}</strong><p>{program.criteria[i]}</p></div>)}</div>;
}
function ChapterScaffold({program,children,caption}:{program:R9Program;children:ReactNode;caption?:string}){
 return <div className={c.chapterScaffold}><span className={c.chapterEyebrow}>{caption||program.eyebrow}</span>{children}</div>;
}
function UniqueScene({program,domain,pref,choose,flip,setFlip,checks,toggleCheck}:{program:R9Program;domain:EquipmentDomain;pref:R9Preference;choose:(n:number)=>void;flip:boolean;setFlip:(v:boolean)=>void;checks:boolean[];toggleCheck:(n:number)=>void}){
 const related=program.recommendations.map(id=>lookup(id)).filter((d):d is EquipmentDomain=>!!d);
 const chosen=program.choices[pref.choice];
 const option=(i:number)=>choose(i);
 switch(program.layout){
 case "field-guide":return <ChapterScaffold program={program}><div className={c.guideBook}><div className={c.bookCover}><SceneArt domain={domain} kind="guide-cover"/><div><BookOpen size={32}/><h3>Guide de vos équipements</h3><p>Comprendre · choisir · préparer</p></div></div><div className={c.bookPages}><h3>Sommaire interactif</h3>{program.choices.map((item,i)=><button key={item} aria-pressed={pref.choice===i} onClick={()=>option(i)}><span>0{i+1}</span><strong>{item}</strong><ChevronRight size={18}/></button>)}<p><CheckCircle2 size={16}/> {chosen} — {domain.solution}</p></div></div></ChapterScaffold>;
 case "photo-booth":return <ChapterScaffold program={program}><div className={c.boothGrid}><div className={c.boothStage}><SceneArt domain={domain} kind="booth"/><div className={c.boothFrame}><Camera size={28}/><span>{chosen}</span><small>Corner souvenir · prévisualisation d'ambiance</small></div></div><div className={c.boothSidebar}><h3>Imaginez le moment</h3><SelectionButtons program={program} pref={pref} onChoose={choose}/><div className={c.previewStrip}>{related.slice(0,2).map((d,i)=><SmallArt key={d.id} domain={d} id={`booth-${i}`}/>)}</div><p>Décor, cadrage et supports à préciser pour l’établissement.</p></div></div></ChapterScaffold>;
 case "facade":return <ChapterScaffold program={program}><div className={c.facadeView}><SceneArt domain={domain} kind="facade"/><div className={c.facadeOverlay} style={{left:[8,32,52][pref.choice]+"%"}}><MapPin size={17}/><b>{chosen}</b><span>Zone indicative</span></div></div><div className={c.facadeOptions}><b>01 · Emplacement</b><SelectionButtons program={program} pref={pref} onChoose={choose}/><p><MoveHorizontal size={18}/> Préparez des dimensions à confirmer en relevé réel, sans simulation de prix.</p></div></ChapterScaffold>;
 case "event-board":return <ChapterScaffold program={program}><div className={c.moodGrid}><div className={c.moodHero}><SceneArt domain={domain} kind="mood-main"/><strong>{chosen}</strong></div>{related.slice(0,2).map((d,i)=><div className={c.moodSecondary} key={d.id}><SmallArt domain={d} id={`mood-${i}`}/><span>{d.name}</span></div>)}<div className={c.moodControl}><Palette size={25}/><h3>Direction artistique</h3><SelectionButtons program={program} pref={pref} onChoose={choose}/><p>Une même ligne de création pour vos supports.</p></div></div></ChapterScaffold>;
 case "learning-wall":return <ChapterScaffold program={program}><div className={c.wallStage}><SceneArt domain={domain} kind="wall"/>{program.choices.map((choice,i)=><button key={choice} aria-pressed={pref.choice===i} className={`${c.wallHotspot} ${i===pref.choice?c.wallOn:""}`} style={{left:[18,53,79][i]+"%",top:[26,55,35][i]+"%"}} onClick={()=>option(i)}><Plus size={17}/><span>{choice}</span></button>)}</div><div className={c.wallFooter}><span>ZONE ACTIVE</span><b>{chosen}</b><p>{program.promise}</p></div></ChapterScaffold>;
 case "printable-lab":return <ChapterScaffold program={program}><div className={c.printableDesk}><div className={c.worksheet}><span>ACTIVITÉ · EXEMPLE</span><h3>{chosen}</h3><div className={c.worksheetMarks}>{Array.from({length:5},(_,i)=><div key={i}><span>{["a","b","c","d","e"][i]}</span><i/><i/><i/></div>)}</div><small>Illustration pédagogique non téléchargeable, aucun fichier vendu ici</small></div><div className={c.printableControls}><PenLine size={26}/><h3>Choisir l'objectif</h3><SelectionButtons program={program} pref={pref} onChoose={choose}/><p>{domain.solution}</p></div><SceneArt domain={domain} kind="printable-table"/></div></ChapterScaffold>;
 case "flashcard-deck":return <ChapterScaffold program={program}><div className={c.flashcardBoard}><div className={c.flashcardStage}><button type="button" className={c.flashcard} onClick={()=>setFlip(!flip)} aria-pressed={flip}><span>ANGELCARE · FLASHCARDS</span><strong>{flip?["Langages","Quantités","Émotions"][pref.choice]:["Aa","1 2 3","♡"][pref.choice]}</strong><small>{flip?"Sujet de collection":"Retourner la carte pour explorer"}</small><RotateCcw size={22}/></button><div className={c.deckBack} aria-hidden="true"/></div><div className={c.deckOptions}><h3>Explorez une collection</h3><SelectionButtons program={program} pref={pref} onChoose={i=>{choose(i);setFlip(false)}}/><p>Les véritables packages restent sous l'autorité du catalogue et de leurs supports publiés.</p><SmallArt domain={domain} id="flash-edu"/></div></div></ChapterScaffold>;
 case "parent-journey":return <ChapterScaffold program={program}><div className={c.parentTimeline}>{program.choices.map((choice,i)=><button key={choice} className={pref.choice===i?c.timelineActive:""} onClick={()=>option(i)} aria-pressed={pref.choice===i}><span className={c.timelineNum}>0{i+1}</span><strong>{choice}</strong><small>{["Accueillir","Informer","Valoriser"][i]}</small></button>)}</div><div className={c.parentContent}><SceneArt domain={domain} kind="parent-scene"/><div className={c.parentMessage}><Heart size={25}/><span>COMMUNICATION · EXEMPLE</span><h3>{chosen}</h3><p>{domain.solution}</p><div><CheckCircle2 size={16}/> Message clair et cohérent</div><div><CheckCircle2 size={16}/> Information adaptée aux familles</div></div></div></ChapterScaffold>;
 case "reception-map":return <ChapterScaffold program={program}><div className={c.receptionRoom}><SceneArt domain={domain} kind="reception-room"/><div className={c.mapRoute}>{program.choices.map((choice,i)=><button key={choice} onClick={()=>option(i)} className={pref.choice===i?c.routeActive:""}><span>{i+1}</span><strong>{choice}</strong></button>)}</div></div><div className={c.roomLegend}><MapPin size={18}/><strong>Point d'attention : {chosen}</strong><span>{program.value}</span></div></ChapterScaffold>;
 case "staff-command":return <ChapterScaffold program={program}><div className={c.staffBoard}><div className={c.staffHeading}><ClipboardList size={24}/><div><h3>Planning de la semaine</h3><span>Équipe pédagogique · exemple d’organisation</span></div><span>5 jours</span></div><div className={c.staffDays}>{["Lun","Mar","Mer","Jeu","Ven"].map((day,i)=><button type="button" key={day} onClick={()=>option(i%3)}><b>{day}</b><span>{program.choices[(i+pref.choice)%3]}</span></button>)}</div><div className={c.staffChecklist}>{program.choices.map((task,i)=><button key={task} onClick={()=>toggleCheck(i)} aria-pressed={checks[i]}><span>{checks[i]?<Check size={15}/>:null}</span>{task}</button>)}</div></div><div className={c.staffFoot}><CheckCircle2 size={18}/> Les cases sont une démonstration locale, pas un registre opérationnel.</div></ChapterScaffold>;
 case "child-identity":return <ChapterScaffold program={program}><div className={c.identityStage}><div className={c.identityCards}><div className={c.identityCard}><Heart size={30}/><span>ANGELCARE ÉCOLE</span><strong>{["Mon casier","Mon badge","Mes progrès"][pref.choice]}</strong><small>Prévisualisation pédagogique</small></div><div className={c.identityLabel}><Tag size={22}/><b>{chosen}</b></div></div><div className={c.identityControls}><h3>Des repères qui rassurent</h3><SelectionButtons program={program} pref={pref} onChoose={choose}/><SmallArt domain={domain} id="identity-samples"/></div></div></ChapterScaffold>;
 case "graduation-stage":return <ChapterScaffold program={program}><div className={c.graduationStage}><SceneArt domain={domain} kind="graduation-scene"/><div className={c.stageLabel}><AwardIcon/><span>GRADUATION · ÉCOLE</span><strong>{chosen}</strong></div></div><div className={c.graduationControls}>{program.choices.map((choice,i)=><button type="button" key={choice} aria-pressed={pref.choice===i} className={pref.choice===i?c.graduationOn:""} onClick={()=>option(i)}><span>0{i+1}</span>{choice}<ArrowRight size={16}/></button>)}</div></ChapterScaffold>;
 case "season-gallery":return <ChapterScaffold program={program}><div className={c.seasonStage}>{program.choices.map((season,i)=><button type="button" key={season} className={`${c.seasonTile} ${pref.choice===i?c.seasonOn:""}`} onClick={()=>option(i)}><SmallArt domain={related[i]||domain} id={`season-${i}`}/><span>{season}</span>{pref.choice===i?<CheckCircle2 size={18}/>:null}</button>)}</div><div className={c.seasonFoot}><Sun size={21}/><strong>{chosen}</strong><span>{program.promise}</span></div></ChapterScaffold>;
 case "safety-walk":return <ChapterScaffold program={program}><div className={c.safetyStage}><SceneArt domain={domain} kind="safety-walk"/><div className={c.safetyChecklist}><ShieldCheck size={24}/><h3>Repères à examiner</h3>{program.choices.map((item,i)=><button type="button" key={item} aria-pressed={checks[i]} onClick={()=>{toggleCheck(i);option(i)}}><span>{checks[i]?<Check size={16}/>:<Plus size={16}/>}</span>{item}</button>)}<small>Vérification illustrée ; ne remplace aucune procédure réglementaire ou inspection.</small></div></div></ChapterScaffold>;
 case "sensory-lab":return <ChapterScaffold program={program}><div className={c.sensoryLab}><SceneArt domain={domain} kind="sensory"/><div className={c.sensoryStations}>{program.choices.map((item,i)=><button key={item} onClick={()=>option(i)} aria-pressed={pref.choice===i}><span>{["01","02","03"][i]}</span><strong>{item}</strong><small>{program.criteria[i]}</small><ArrowRight size={15}/></button>)}</div></div><div className={c.sensoryFoot}>Station explorée : <b>{chosen}</b> · Matériel à adapter à l'âge et aux consignes de sécurité.</div></ChapterScaffold>;
 case "storage-system":return <ChapterScaffold program={program}><div className={c.storageDisplay}><div className={c.storageShelves}>{Array.from({length:9},(_,i)=><button type="button" key={i} onClick={()=>option(i%3)} data-active={pref.choice===i%3}><Boxes size={27}/><span>{program.choices[i%3]}</span></button>)}</div><div className={c.storageAside}><SceneArt domain={domain} kind="storage"/><h3>Un espace identifiable</h3><p>{program.promise}</p><SelectionButtons program={program} pref={pref} onChoose={choose}/></div></div></ChapterScaffold>;
 case "admissions-pipeline":return <ChapterScaffold program={program}><div className={c.admissionsPipeline}>{program.choices.map((choice,i)=><button type="button" key={choice} className={pref.choice===i?c.admissionsActive:""} onClick={()=>option(i)}><span>{["01","02","03"][i]}</span><strong>{choice}</strong><small>{program.criteria[i]}</small><ChevronRight size={18}/></button>)}</div><div className={c.admissionsMedia}><SmallArt domain={domain} id="admissions"/><div><h3>{chosen}</h3><p>{domain.solution}</p><span>Parcours commercial illustratif, sans conversion ni inscription simulée.</span></div></div></ChapterScaffold>;
 case "awards-gallery":return <ChapterScaffold program={program}><div className={c.awardsGallery}>{program.choices.map((choice,i)=><button type="button" key={choice} data-active={pref.choice===i} onClick={()=>option(i)}><Star size={28}/><span>ANGELCARE SCHOOL</span><strong>{choice}</strong><small>Reconnaissance · modèle d'ambiance</small></button>)}</div><div className={c.awardsFooter}><SmallArt domain={domain} id="awards"/><p>Choix : <b>{chosen}</b>. Les noms, identités et documents restent à valider sur demande.</p></div></ChapterScaffold>;
 case "activity-unboxing":return <ChapterScaffold program={program}><div className={c.unboxing}><div className={c.unboxingCase}><div className={c.caseLid}>ANGELCARE<br/>KIT D'ACTIVITÉ</div><div className={c.caseGrid}>{program.choices.map((item,i)=><button type="button" key={item} className={pref.choice===i?c.caseActive:""} onClick={()=>option(i)}><Package size={27}/><span>{item}</span></button>)}</div></div><div className={c.unboxingInfo}><SceneArt domain={domain} kind="kit-scene"/><strong>{chosen}</strong><p>{domain.solution}</p></div></div></ChapterScaffold>;
 case "brand-atlas":return <ChapterScaffold program={program}><div className={c.brandAtlas}><div className={c.brandVisual}><SceneArt domain={domain} kind="brand-main"/><span>School identity · concept only</span></div><div className={c.brandSwatches}>{["#102c5f","#e90d62","#d4a03a"].map((color,i)=><button key={color} style={{background:color}} className={pref.choice===i?c.brandSwatchActive:""} onClick={()=>option(i)} aria-label={program.choices[i]} aria-pressed={pref.choice===i}/>)}</div><div className={c.brandApplications}>{program.choices.map((choice,i)=><button type="button" key={choice} onClick={()=>option(i)} data-active={pref.choice===i}><Palette size={22}/><span>{choice}</span></button>)}</div></div></ChapterScaffold>;
 case "production-configurator":return <ChapterScaffold program={program}><div className={c.productionStage}><div className={c.productionPhoto}><SceneArt domain={domain} kind="production"/><span><Settings2 size={17}/> Production à confirmer</span></div><div className={c.productionSteps}>{program.choices.map((choice,i)=><button type="button" key={choice} onClick={()=>option(i)} aria-pressed={pref.choice===i}><span>{String(i+1).padStart(2,"0")}</span><strong>{choice}</strong><ChevronRight size={17}/></button>)}<p>Aucune variante, disponibilité, estimation ou commande n'est engagée par cet outil.</p></div></div></ChapterScaffold>;
 case "technical-library":return <ChapterScaffold program={program}><div className={c.technicalLibrary}><div className={c.technicalNav}><Search size={22}/><h3>Référentiel visuel</h3>{program.choices.map((choice,i)=><button type="button" key={choice} onClick={()=>option(i)} className={pref.choice===i?c.technicalActive:""}><BookMarked size={16}/>{choice}<ChevronRight size={16}/></button>)}</div><div className={c.technicalPage}><div className={c.technicalImage}><SceneArt domain={domain} kind="technical"/></div><span>SUJET 0{pref.choice+1}</span><h3>{chosen}</h3><p>{domain.solution}</p><div><Info size={16}/> Les valeurs techniques et exigences contractuelles sont confirmées par fiche ou devis.</div></div></div></ChapterScaffold>;
 default:return null;
 }
}
function AwardIcon(){return <GraduationCap size={26}/>}
export function EquipmentR9DomainStudio({
 domain,program,pref,selected,onPref,onSelect,onChooseRelated,onExplore,onContact,locale
}:{
 domain:EquipmentDomain;program:R9Program;pref:R9Preference;selected:boolean;
 onPref:(patch:Partial<R9Preference>)=>void;onSelect:()=>void;
 onChooseRelated:(id:string)=>void;onExplore:()=>void;onContact:()=>void;
 locale:"fr"|"en"|"ar";
}){
 const [flip,setFlip]=useState(false);
 const [checks,setChecks]=useState([false,false,false]);
 useEffect(()=>{setFlip(false);setChecks([false,false,false])},[domain.id]);
 const choose=(choice:number)=>onPref({choice});
 const toggleCheck=(i:number)=>setChecks(prev=>prev.map((v,j)=>i===j?!v:v));
 const recs=program.recommendations.map(id=>lookup(id)).filter((d):d is EquipmentDomain=>Boolean(d));
 return <article className={c.root} data-layout={program.layout} data-domain={domain.id} lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
  <div className={c.topline}><span>DOMAINE {String(domain.number).padStart(2,"0")} / 22</span><span>{program.eyebrow}</span><span>APPLICATIONS · ENVIRONNEMENT PROFESSIONNEL</span></div>
  <div className={c.intro}>
   <div><h2>{program.headline}</h2><p>{program.promise}</p></div>
   <div className={c.introAside}><b><Compass size={18}/> CE QUE NOUS RÉSOLVONS</b><p>{program.scenario}</p></div>
  </div>
  <div className={c.immersiveScene}>
   <UniqueScene program={program} domain={domain} pref={pref} choose={choose} flip={flip} setFlip={setFlip} checks={checks} toggleCheck={toggleCheck}/>
  </div>
  <div className={c.editorialColumns}>
   <section><span>LA DIFFICULTÉ QUOTIDIENNE</span><h3>Ce que l'équipe vit</h3><p>{domain.pain}</p></section>
   <section><span>LA SOLUTION ANGELCARE</span><h3>Ce que votre établissement gagne</h3><p>{domain.solution}</p></section>
   <section><span>APPLICATIONS CONCRÈTES</span><h3>Où commencer ?</h3><ul>{domain.examples.map(x=><li key={x}><CheckCircle2 size={16}/>{x}</li>)}</ul></section>
  </div>
  <section className={c.configPanel}>
   <div className={c.configIntro}><span>PRÉPARATION COMMERCIALE</span><h3>Personnalisez le besoin — sans engagement.</h3><p>{program.interaction}. Ces informations précisent uniquement votre brief commercial.</p></div>
   <div className={c.configInputs}>
    <label><span>{program.criteria[0]}</span><select value={pref.choice} onChange={e=>choose(Number(e.target.value))}>{program.choices.map((value,i)=><option key={value} value={i}>{value}</option>)}</select></label>
    <label><span>{program.criteria[1]}</span><select value={pref.age} onChange={e=>onPref({age:e.target.value})}><option value="">À préciser</option>{R9_AGE_BANDS.map(x=><option key={x}>{x}</option>)}</select></label>
    <label><span>{program.criteria[2]}</span><input value={pref.format} onChange={e=>onPref({format:e.target.value.slice(0,75)})} placeholder="Format, lieu, style ou besoin"/></label>
    <label><span>Quantité indicative</span><input inputMode="numeric" value={pref.quantity} onChange={e=>onPref({quantity:e.target.value.replace(/[^0-9]/g,"").slice(0,5)})} placeholder="À préciser"/></label>
    <label className={c.notesField}><span>Précision complémentaire (facultatif)</span><input value={pref.note} onChange={e=>onPref({note:e.target.value.slice(0,180)})} placeholder="Contexte utile à la préparation de la proposition"/></label>
   </div>
  </section>
  <div className={c.actionBar}>
   <div><span>DOMAINES INTÉGRÉS AU PROJET</span><strong>{selected?"Domaine sélectionné":"Une sélection utile pour avancer"}</strong><small>Offres, tarifs et délais restent soumis au catalogue et à validation.</small></div>
   <button type="button" className={selected?c.selectedButton:c.primaryButton} onClick={onSelect}>{selected?<><Check size={17}/> Retirer du projet</>:<><Plus size={18}/> {program.cta}</>}</button>
   <button type="button" className={c.lightButton} onClick={onExplore}><Eye size={17}/> Voir les offres réelles</button>
   <button type="button" className={c.textButton} onClick={onContact}>Demander conseil <ArrowRight size={17}/></button>
  </div>
  <section className={c.nextPaths}><div><span>POURSUIVRE VOTRE PROJET</span><h3>Ces domaines peuvent se compléter.</h3><p>Suggestions éditoriales expliquées, jamais des lots automatiquement commercialisés.</p></div><div className={c.relatedGrid}>{recs.map(d=><button type="button" key={d.id} onClick={()=>onChooseRelated(d.id)}><SmallArt domain={d} id={`related-${domain.id}`}/><strong>{d.name}</strong><ChevronRight size={18}/></button>)}</div></section>
 </article>;
}
