import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { PageHero,str } from '../components/Public';
import { PrintDocument } from '../client/PrintDocument';
import { href } from '../routes';
import { t,formatDate } from '../i18n';
import { e } from '../experience-copy';
import s from '../jobkix.module.css';
export async function LegalPage({locale,slug,preview}:{locale:Locale;slug?:string;preview?:DataRow}){
 if(slug&&!/^[a-z0-9][a-z0-9-]{1,100}$/.test(slug))notFound();
 // Public attribution is explicitly approved copy. Saved editorial data is only
 // rendered when supplied by the existing permission-gated private preview route.
 if(!preview)return <section className={s.pageHero}><div className={s.container}><h1>{t(locale,'operatorAttribution')}</h1></div></section>;
 const selected=preview,sections:DataRow[]=Array.isArray(selected.sections)?selected.sections.map(object):[];
 return <><p className={s.notice} role="status">{e(locale,'privatePreview')}</p><PageHero locale={locale} title={str(selected,'title')} description={str(selected,'summary')}/>
  <section className={s.section}><div className={s.container}>
   <div className={`${s.detailsLayout} ${s.legalReader}`}><article className={`${s.article} ${s.panel}`}><h2>{str(selected,'title')}</h2><p className={s.metadataLine}>{e(locale,'revision')}: {String(selected.translationRevision)} · {str(selected,'author')}{str(selected,'publishedAt')?' · '+formatDate(str(selected,'publishedAt'),locale,undefined,true):''}</p><p>{str(selected,'summary')}</p>{sections.map((section,index)=><section id={'section-'+index} key={index}><h2>{str(section,'title')}</h2>{typeof section.body==='string'?<p className={s.authoredText}>{section.body}</p>:null}{Array.isArray(section.paragraphs)?section.paragraphs.filter((value):value is string=>typeof value==='string').map((paragraph,index)=><p key={index} className={s.authoredText}>{paragraph}</p>):null}{Array.isArray(section.items)?<ul>{section.items.filter((value):value is string=>typeof value==='string').map((item,index)=><li key={index}>{item}</li>)}</ul>:null}</section>)}</article><aside className={`${s.panel} ${s.sticky}`}><h2>{e(locale,'onThisPage')}</h2><ol>{sections.map((section,index)=><li key={index}><a className={s.textLink} href={'#section-'+index}>{str(section,'title')}</a></li>)}</ol><PrintDocument locale={locale}/><Link className={s.textLink} href={href(locale,'contact')}>{t(locale,'support')}</Link></aside></div>
  </div></section>
 </>;
}
