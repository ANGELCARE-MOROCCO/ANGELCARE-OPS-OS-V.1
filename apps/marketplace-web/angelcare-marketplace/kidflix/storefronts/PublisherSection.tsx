'use client';
import type {ReactNode} from 'react';
import {PublisherTopics,PublisherReference,PublisherDetail,PublisherQuestions,PublisherArtwork,type PublisherImages} from './PublisherEditorial';
import {publisherProfile,say,UI,type PublisherLocale} from './publisher-content';
import type {Edition} from './model';
import s from './publisher.module.css';

/** Native section order, visibility and catalogue rendering remain authoritative. */
export function PublisherSection({section,family,locale,edition,onSearch,children}:{section:string;family:string;locale:PublisherLocale;edition:Edition;onSearch:(query:string)=>void;children:ReactNode}){
 const images:PublisherImages=edition,p=publisherProfile(family);
 if(section==='subjects')return <><PublisherTopics family={family} locale={locale} onSearch={onSearch}/>{children}</>;
 if(section==='guide')return <><PublisherReference family={family} locale={locale} images={images}/>{children}<PublisherDetail family={family} locale={locale} images={images}/><PublisherQuestions family={family} locale={locale}/></>;
 if(section==='related')return <>{children}<section className={s.detailSection}><PublisherArtwork family={family} locale={locale} role="cover" src={images.cover} mobile={images.coverMobile} alt={images.coverAlt}/><div><span className={s.eyebrow}>{say(UI.start,locale)}</span><h2>{say(p.title,locale)}</h2><p>{say(p.intro,locale)}</p><div className={s.actions}><a href="#discover" className={s.primary}>{say(UI.browse,locale)}</a></div><p className={s.finePrint}>{say(UI.editorialNote,locale)}</p></div></section></>;
 return <>{children}</>;
}
