import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '../contracts';
import { accountTerms, publicEdition, type DataRow } from '../server/repository';
import { publicCookieNotice } from '../components/PublicCookieNotice';
import { object } from '../validation';
import { PageHero,str } from '../components/Public';
import { PrintDocument } from '../client/PrintDocument';
import { href } from '../routes';
import { t,formatDate } from '../i18n';
import { e } from '../experience-copy';
import s from '../jobkix.module.css';
export async function LegalPage({locale,slug,preview}:{locale:Locale;slug?:string;preview?:DataRow}){
 if(slug&&!/^[a-z0-9][a-z0-9-]{1,100}$/.test(slug))notFound();
 // Public legal pages load only the already-reviewed account terms or the published editorial RPC.
 // Private preview records still arrive solely through the existing permission-gated caller.
 if(!slug && !preview){
   const known=['privacy','terms','cookies','external-applications','safety','data-rights','employer-terms','candidate-terms'];
   const reviewed=await accountTerms(locale).catch(()=>null);
   const docs=await Promise.all(known.map(async key=>{
     if(key==='cookies')return key;
     if((key==='privacy'||key==='terms')&&reviewed?.[key]&&typeof reviewed[key]==='object')return key;
     const edition=await publicEdition('legal/'+key,locale).catch(()=>null)||await publicEdition(key,locale).catch(()=>null);
     return edition?.kind==='legal'&&Array.isArray(edition.sections)&&edition.sections.length?key:null;
   }));
   return <section className={s.section}><div className={s.container}><h1>{t(locale,'operatorAttribution')}</h1><p>{t(locale,'heroDescription')}</p><nav aria-label='JOBKIX legal documents'><ul>{docs.filter((key):key is string=>Boolean(key)).map(key=><li key={key}><Link className={s.textLink} href={href(locale,'legal/'+key)}>{key.replaceAll('-',' ')}</Link></li>)}</ul></nav></div></section>;
 }
 let selected:DataRow|null=preview||null;
 if(!selected && slug){
   try{
     if(slug==='privacy'||slug==='terms'){
       const reviewed=await accountTerms(locale);
       const document=reviewed?.[slug];
       if(document&&typeof document==='object'&&!Array.isArray(document))selected=object(document);
     }
     if(!selected){const published=await publicEdition('legal/'+slug,locale).catch(()=>null)||await publicEdition(slug,locale).catch(()=>null);if(published?.kind==='legal'&&Array.isArray(published.sections)&&published.sections.length)selected=published;}
     if(!selected&&slug==='cookies')selected=publicCookieNotice(locale);
   }catch{/* No draft or unverified content may leak as public legal documentation. */}
 }
 if(!selected||!Array.isArray(selected.sections)||!selected.sections.length||typeof selected.title!=='string')notFound();
 const sections:DataRow[]=selected.sections.map(object);

 return <>{preview?<p className={s.notice} role="status">{e(locale,'privatePreview')}</p>:null}<PageHero locale={locale} title={str(selected,'title')} description={str(selected,'summary')}/>
  <section className={s.section}><div className={s.container}>
   <div className={`${s.detailsLayout} ${s.legalReader}`}><article className={`${s.article} ${s.panel}`}><h2>{str(selected,'title')}</h2><p className={s.metadataLine}>{e(locale,'revision')}: {String(selected.translationRevision)} · {str(selected,'author')}{str(selected,'publishedAt')?' · '+formatDate(str(selected,'publishedAt'),locale,undefined,true):''}</p><p>{str(selected,'summary')}</p>{sections.map((section,index)=><section id={'section-'+index} key={index}><h2>{str(section,'title')}</h2>{typeof section.body==='string'?<p className={s.authoredText}>{section.body}</p>:null}{Array.isArray(section.paragraphs)?section.paragraphs.filter((value):value is string=>typeof value==='string').map((paragraph,index)=><p key={index} className={s.authoredText}>{paragraph}</p>):null}{Array.isArray(section.items)?<ul>{section.items.filter((value):value is string=>typeof value==='string').map((item,index)=><li key={index}>{item}</li>)}</ul>:null}</section>)}</article><aside className={`${s.panel} ${s.sticky}`}><h2>{e(locale,'onThisPage')}</h2><ol>{sections.map((section,index)=><li key={index}><a className={s.textLink} href={'#section-'+index}>{str(section,'title')}</a></li>)}</ol><PrintDocument locale={locale}/><Link className={s.textLink} href={href(locale,'contact')}>{t(locale,'support')}</Link></aside></div>
  </div></section>
 </>;
}
