'use client';
import {useEffect,useId,useState,type CSSProperties} from 'react';
import {PublisherGallery,type PublisherScene} from './PublisherGallery';
import {art,publisherProfile,say,UI,type PublisherLocale,type Copy} from './publisher-content';
import s from './publisher.module.css';
import {publisherNotes} from './publisher-notes';

export type PublisherImages={cover:string;coverMobile:string;coverAlt:string;reference:string;referenceMobile:string;referenceAlt:string;detail:string;detailMobile:string;detailAlt:string;guidance:string;guidanceMobile:string;guidanceAlt:string};
type OpeningEdition={eyebrow:string;headline:string;description:string;gallery:PublisherScene[]};
export function PublisherOpening({family,locale,edition,onGuide}:{family:string;locale:PublisherLocale;edition:OpeningEdition;onGuide:()=>void}){
 const p=publisherProfile(family);
 return <header className={s.opening} data-publisher-layout={p.layout}>
  <div className={s.openingCopy}><span className={s.eyebrow}>{edition.eyebrow}</span><h1>{edition.headline}</h1><p>{edition.description}</p><div className={s.actions}><a href="#discover" className={s.primary}>{say(UI.browse,locale)}<Arrow/></a><button type="button" onClick={onGuide} className={s.secondary}>{say(UI.guide,locale)}</button></div><div className={s.topicIndex}>{p.topics.slice(0,3).map(v=><span key={v[0]}>{say(v,locale)}</span>)}</div></div>
  <div className={s.openingMedia}><PublisherGallery family={family} locale={locale} scenes={edition.gallery}/><p className={s.artCaption}>{say(UI.editorial,locale)}</p></div>
  <div className={s.openingFoot}><span>KidFlix</span><p>{say(p.intro,locale)}</p></div>
 </header>;
}
export function PublisherArtwork({family,locale,role,src,mobile,alt,portrait=false}:{family:string;locale:PublisherLocale;role:string;src?:string;mobile?:string;alt:string;portrait?:boolean}){
 const fallback=art(family,role),chosen=src||fallback,defaultSource=chosen===fallback;
 const [failed,setFailed]=useState(false),[unavailable,setUnavailable]=useState(false);
 useEffect(()=>{setFailed(false);setUnavailable(false);},[chosen,mobile]);
 return <figure className={`${s.artwork} ${portrait?s.portrait:''}`}>
  {unavailable?<span role="status" className={s.imagePlaceholder}>{say(UI.imageUnavailable,locale)}</span>:<picture>{!failed&&(mobile||defaultSource)?<source media="(max-width:767px)" srcSet={mobile||art(family,role,true)}/>:null}<img src={failed?fallback:chosen} alt={alt} width={portrait||role==='cover'||role==='detail'?1024:1536} height={portrait?1280:1024} loading="lazy" decoding="async" onError={event=>{if(failed||event.currentTarget.currentSrc===new URL(fallback,document.baseURI).href)setUnavailable(true);else setFailed(true);}}/></picture>}
 </figure>;
}
export function PublisherTopics({family,locale,onSearch}:{family:string;locale:PublisherLocale;onSearch:(query:string)=>void}){
 const p=publisherProfile(family);
 return <section className={s.editorialSection} aria-labelledby={`publisher-topics-${family}`}><div className={s.sectionHeading}><div><span className={s.eyebrow}>{say(UI.editorial,locale)}</span><h2 id={`publisher-topics-${family}`}>{say(UI.topics,locale)}</h2></div><p>{say(UI.editorialNote,locale)}</p></div><div className={s.topicGrid} data-layout={p.layout}>{p.topics.map((topic,i)=><button type="button" className={s.topicCard} key={topic[0]} onClick={()=>onSearch(say(topic,locale))} aria-label={`${say(UI.searchTopic,locale)} ${say(topic,locale)}`}><picture><source media="(max-width:767px)" srcSet={art(family,`hero-0${i+1}`,true)}/><img src={art(family,`hero-0${i+1}`)} alt="" width={768} height={512} loading="lazy" decoding="async"/></picture><span><strong>{say(topic,locale)}</strong><Arrow/></span></button>)}</div></section>;
}
export function PublisherReference({family,locale,images}:{family:string;locale:PublisherLocale;images:PublisherImages}){
 const p=publisherProfile(family);
 return <section className={s.referenceSection} data-reference-layout={p.layout}><div className={s.referenceArt}><PublisherArtwork family={family} locale={locale} role="reference" src={images.reference} mobile={images.referenceMobile} alt={images.referenceAlt} portrait/></div><div className={s.referenceCopy}><span className={s.eyebrow}>{say(UI.editorial,locale)}</span><h2>{say(UI.reference,locale)}</h2><p className={s.lead}>{say(publisherNotes(family).reference,locale)}</p><ol className={s.stepList}>{p.steps.map((step,i)=><li key={step[0]}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div><h3>{say(step,locale)}</h3><p>{say(p.questions[i],locale)}</p></div></li>)}</ol><p className={s.finePrint}>{say(UI.editorialNote,locale)}</p></div></section>;
}
export function PublisherDetail({family,locale,images}:{family:string;locale:PublisherLocale;images:PublisherImages}){
 const p=publisherProfile(family);
 return <section className={s.detailSection} data-detail-layout={p.layout}><div><span className={s.eyebrow}>{say(UI.editorial,locale)}</span><h2>{say(UI.practice,locale)}</h2><p>{say(publisherNotes(family).practice,locale)}</p><PurposeAid family={family} locale={locale}/></div><PublisherArtwork family={family} locale={locale} role="detail" src={images.detail} mobile={images.detailMobile} alt={images.detailAlt}/></section>;
}
function PurposeAid({family,locale}:{family:string;locale:PublisherLocale}){
 const id=useId(),p=publisherProfile(family),[selected,setSelected]=useState(0),[denominator,setDenominator]=useState(4),[answer,setAnswer]=useState<number|null>(null),[checked,setChecked]=useState<number[]>([]);
 if(family==='tools')return <div className={s.purposeAid}><p>{say(['Explore one whole divided into equal parts.','Explorer un tout divisé en parts égales.','استكشف كلاً مقسماً إلى أجزاء متساوية.'],locale)}</p><label htmlFor={id}>{say(['Equal parts','Parts égales','أجزاء متساوية'],locale)}</label><select id={id} value={denominator} onChange={e=>setDenominator(Number(e.target.value))}>{[2,3,4,6].map(n=><option key={n} value={n}>{n}</option>)}</select><div className={s.fraction} role="img" aria-label={say(['One of ','Une part sur ','جزء واحد من '],locale)+denominator}>{Array.from({length:denominator},(_,i)=><span key={i} data-filled={i===0}/>)}</div><p>{say(['The whole stays the same size. Only its partition changes.','Le tout garde la même taille. Seul son partage change.','يبقى حجم الكل ثابتاً ويتغير تقسيمه فقط.'],locale)}</p></div>;
 if(family==='assessments')return <div className={s.purposeAid}><p>{say(['A sample exercise: which shape continues this alternating pattern?','Exemple de pratique : quelle forme prolonge cette alternance ?','تمرين توضيحي: أي شكل يكمل هذا النمط المتناوب؟'],locale)}</p><div className={s.pattern} aria-label={say(['Circle, square, circle, square, circle, unknown','Cercle, carré, cercle, carré, cercle, à compléter','دائرة، مربع، دائرة، مربع، دائرة، شكل مجهول'],locale)}>{['●','■','●','■','●','?'].map((v,i)=><span key={i}>{v}</span>)}</div><div className={s.actions}>{(['Circle','Square'] as const).map((_,i)=><button type="button" key={i} className={s.secondary} onClick={()=>setAnswer(i)} aria-pressed={answer===i}>{say(i===0?['Circle','Cercle','دائرة']:['Square','Carré','مربع'],locale)}</button>)}</div><p role="status">{answer===null?'':say(answer===1?['Yes. The circle and square alternate.','Oui. Le cercle et le carré alternent.','نعم، تتناوب الدائرة والمربع.']:['Look at each circle: which shape follows it?','Observez chaque cercle : quelle forme le suit ?','تأمل كل دائرة: أي شكل يأتي بعدها؟'],locale)}</p></div>;
 if(['printables','activities','planners'].includes(family))return <fieldset className={s.purposeAid}><legend>{say(['Preparation checklist','Repères de préparation','قائمة التحضير'],locale)}</legend>{p.steps.map((v,i)=><label className={s.checkRow} key={v[0]}><input type="checkbox" checked={checked.includes(i)} onChange={e=>setChecked(values=>e.target.checked?[...values,i]:values.filter(n=>n!==i))}/><span>{say(v,locale)}</span></label>)}</fieldset>;
 const heading:Copy=['Consider one question','Considérer une question','تأمل سؤالاً واحداً'];
 return <div className={s.purposeAid}><p>{say(heading,locale)}</p><div className={s.segmented} role="group" aria-label={say(heading,locale)}>{p.questions.map((v,i)=><button type="button" key={v[0]} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{say(p.topics[i],locale)}</button>)}</div><p className={s.questionFocus} aria-live="polite">{say(p.questions[selected],locale)}</p></div>;
}
export function PublisherQuestions({family,locale}:{family:string;locale:PublisherLocale}){
 const p=publisherProfile(family);
 return <section className={s.questionsSection}><div><span className={s.eyebrow}>{say(UI.start,locale)}</span><h2>{say(UI.questions,locale)}</h2></div><div className={s.questions}>{p.questions.map((q,i)=><details key={q[0]}><summary>{say(q,locale)}<span aria-hidden="true">+</span></summary><p>{say(publisherNotes(family).answers[i],locale)}</p></details>)}</div></section>;
}
export function PublisherFrame({family,locale,children,accent,tint}:{family:string;locale:PublisherLocale;children:React.ReactNode;accent:string;tint:string}){
 return <div className={s.publisher} dir={locale==='ar'?'rtl':'ltr'} data-publisher={family} data-layout={publisherProfile(family).layout} style={{'--publisher-accent':accent,'--publisher-tint':tint} as CSSProperties}>{children}</div>;
}
function Arrow(){return <svg className={s.arrow} width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
