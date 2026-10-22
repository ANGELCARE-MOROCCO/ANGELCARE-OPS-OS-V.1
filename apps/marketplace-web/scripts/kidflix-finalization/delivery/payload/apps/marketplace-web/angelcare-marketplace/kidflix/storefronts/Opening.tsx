import {Gallery}from "../Gallery";
import Link from 'next/link';
import {world,path,tr,type Locale}from '../catalogue';
import {I}from '../Icons';
import {theme}from './themes';
import {L,type Edition}from './model';
import s from './storefronts.module.css';
export function Opening({family,locale,edition,onGuide}:{family:string;locale:Locale;edition:Edition;onGuide:()=>void}){
 const w=world(family)!,t=theme(family);
 return <section className={`${s.opening} ${s[t.layout]}`} data-family-opening={family}>
  <Link className={s.breadcrumb} href={path(locale)}><I name="ArrowLeft" size={15}/>KidFlix</Link>
  <div className={s.heroGrid}><div className={s.heroCopy}><span className={s.eyebrow}><I name={w.icon} size={18}/>{edition.eyebrow}</span><h1>{edition.headline}</h1><p>{edition.description}</p><div className={s.actions}><a href="#discover" className={s.primary}>{L('browse',locale)}<I name="ArrowRight" size={18}/></a><button className={s.secondary} onClick={onGuide}><I name="Compass" size={19}/>{L('guide',locale)}</button></div><div className={s.heroPromise}><I name="Heart" size={16}/>{tr(['Free to explore. Made for curious minds.','À explorer librement. Pour les esprits curieux.','اكتشف بحرية. للعقول الفضولية.'],locale)}</div></div><div className={s.internationalArtwork}><Gallery scenes={edition.gallery} locale={locale} label={edition.headline}/><span className={s.internationalCaption}><I name={w.icon} size={19}/>{tr(t.tag,locale)}</span></div></div>
 </section>;
}
