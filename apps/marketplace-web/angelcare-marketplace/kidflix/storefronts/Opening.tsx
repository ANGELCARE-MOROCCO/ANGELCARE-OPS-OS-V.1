import Link from 'next/link';
import {world,path,tr,type Locale}from '../catalogue';
import {I}from '../Icons';
import {theme}from './themes';
import {L,type Edition}from './model';
import s from './storefronts.module.css';
export function Opening({family,locale,edition,onGuide}:{family:string;locale:Locale;edition:Edition;onGuide:()=>void}){
 const w=world(family)!,t=theme(family),art=<img src={edition.hero} alt={edition.heroAlt} width={1000} height={700} fetchPriority="high"/>;
 const emblem=<span className={s.emblem}><I name={w.icon} size={32}/><span>{tr(w.short,locale)}</span></span>;
 const tip=(n:number)=><span className={s.artNote}><I name={['Sparkles','Heart','Sun'][n]} size={18}/>{tr(t.tips[n],locale)}</span>;
 function artwork(){switch(family){
  case 'documents':return <div className={s.journalArt}><div className={s.cover}>{art}<span className={s.coverLabel}>KidFlix<small>{tr(t.tag,locale)}</small></span></div><div className={s.marginNotes}>{emblem}{tip(0)}{tip(2)}</div></div>;
  case 'printables':return <div className={s.paperArt}><span className={s.sheetBack}/><span className={s.sheetMiddle}/><div className={s.sheet}>{art}<div className={s.paperFoot}><I name="Printer"/>{tr(w.short,locale)}<I name="Sparkles"/></div></div>{tip(2)}</div>;
  case 'stories':return <div className={s.gardenArt}><span className={s.gardenSun}/><div className={s.arch}>{art}</div><span className={s.storyRibbon}>{emblem}</span>{tip(1)}</div>;
  case 'learning':return <div className={s.campusArt}><div className={s.campusPhoto}>{art}</div><div className={s.stairs}>{t.tips.map((v,i)=><span key={i}><b>{String(i+1).padStart(2,'0')}</b>{tr(v,locale)}</span>)}</div></div>;
  case 'video':return <div className={s.screenArt}><div className={s.screenPhoto}>{art}<span className={s.playEmblem} aria-hidden="true"><I name="Play" size={42}/></span></div><div className={s.filmStrip}>{t.tips.map((v,i)=><span key={i}><I name={['Eye','Play','MessagesSquare'][i]} size={18}/>{tr(v,locale)}</span>)}</div></div>;
  case 'audio':return <div className={s.audioArt}><span className={s.orbit}/><span className={s.orbitInner}/><div className={s.recordPhoto}>{art}</div><div className={s.equaliser} aria-hidden="true">{Array.from({length:19},(_,i)=><i key={i} style={{height:12+(i*17%55)}}/>)}</div>{emblem}{tip(2)}</div>;
  case 'visual-cards':return <div className={s.cardArt}><span className={s.fanOne}><I name="Sparkles" size={60}/></span><span className={s.fanTwo}><I name="Lightbulb" size={60}/></span><div className={s.fanPhoto}>{art}<span>{tr(w.invitation,locale)}</span></div>{emblem}</div>;
  case 'presentations':return <div className={s.stageArt}><div className={s.stagePhoto}>{art}</div><div className={s.stageBar}><span/><span/><span/>{emblem}</div><span className={s.stageStand}/>{tip(0)}</div>;
  case 'assessments':return <div className={s.challengeArt}><div className={s.challengePhoto}>{art}</div><div className={s.challengeSteps}>{t.tips.map((v,i)=><span key={i}><b>{['?','✓','★'][i]}</b>{tr(v,locale)}</span>)}</div>{emblem}</div>;
  case 'activities':return <div className={s.playgroundArt}><div className={s.playgroundPhoto}>{art}</div><span className={s.playShape}><I name="Puzzle" size={55}/></span><span className={s.playShapeTwo}><I name="Sun" size={45}/></span>{tip(2)}</div>;
  case 'tools':return <div className={s.labArt}><div className={s.labPhoto}>{art}</div><div className={s.labConsole}><span><I name="WandSparkles" size={27}/></span><div><i/><i/><i/></div><strong>{tr(w.invitation,locale)}</strong></div></div>;
  case 'planners':return <div className={s.folioArt}><div className={s.folioRings}>{Array.from({length:7},(_,i)=><i key={i}/>)}</div><div className={s.folioPhoto}>{art}</div><div className={s.folioNotes}>{t.tips.map((v,i)=><span key={i}><I name="CircleCheck" size={18}/>{tr(v,locale)}</span>)}</div></div>;
  case 'forms':return <div className={s.reflectionArt}><div className={s.reflectionPhoto}>{art}</div><div className={s.reflectionNote}><I name="Heart" size={34}/><strong>{tr(w.invitation,locale)}</strong><span className={s.rule}/><span className={s.rule}/></div></div>;
  case 'community':return <div className={s.insightsArt}><div className={s.insightsPhoto}>{art}</div><blockquote><span>“</span>{tr(w.invitation,locale)}<I name="MessagesSquare" size={30}/></blockquote>{tip(2)}</div>;
  case 'commerce':return <div className={s.boutiqueArt}><div className={s.boutiquePhoto}>{art}</div><div className={s.boutiqueLabel}><I name="Gift" size={32}/><strong>{tr(w.invitation,locale)}</strong></div>{tip(0)}</div>;
  default:return <div className={s.journeyArt}><div className={s.journeyPhoto}>{art}</div><div className={s.journeyLine}>{t.tips.map((v,i)=><span key={i}><b>{i+1}</b>{tr(v,locale)}</span>)}</div></div>;
 }}
 return <section className={`${s.opening} ${s[t.layout]}`} data-family-opening={family}>
  <Link className={s.breadcrumb} href={path(locale)}><I name="ArrowLeft" size={15}/>KidFlix</Link>
  <div className={s.heroGrid}><div className={s.heroCopy}><span className={s.eyebrow}><I name={w.icon} size={18}/>{edition.eyebrow}</span><h1>{edition.headline}</h1><p>{edition.description}</p><div className={s.actions}><a href="#discover" className={s.primary}>{L('browse',locale)}<I name="ArrowRight" size={18}/></a><button className={s.secondary} onClick={onGuide}><I name="Compass" size={19}/>{L('guide',locale)}</button></div><div className={s.heroPromise}><I name="Heart" size={16}/>{tr(['Free to explore. Made for curious minds.','À explorer librement. Pour les esprits curieux.','اكتشف بحرية. للعقول الفضولية.'],locale)}</div></div><div className={s.artwork} aria-hidden={!edition.heroAlt}>{artwork()}</div></div>
 </section>;
}
