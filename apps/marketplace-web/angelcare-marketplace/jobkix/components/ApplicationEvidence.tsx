import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { str } from './Public';
import { VacancyTerms } from './VacancyContent';
import { st } from '../studio-copy';
import { e } from '../experience-copy';
import s from '../jobkix.module.css';
export function applicationTitle(application:DataRow){const snap=object(application.snapshot),vacancy=snap.vacancy?object(snap.vacancy):{};return str(vacancy,'title');}
export function applicationCandidate(application:DataRow){const snap=object(application.snapshot),profile=snap.profile?object(snap.profile):{};return str(profile,'displayName');}
/** Submitted evidence only. Never joins the candidate's current private profile. */
export function ApplicationEvidence({locale,application}:{locale:Locale;application:DataRow}){
 const snap=object(application.snapshot),profile=object(snap.profile),vacancy=snap.vacancy?object(snap.vacancy):{},answers=object(snap.answers);
 return <section className={s.panel}><h2>{st(locale,'snapshot')}</h2><p className={s.notice}>{e(locale,'snapshotNotice')}</p><h3 className={s.authoredText}>{str(profile,'displayName')}</h3><p className={s.authoredText}>{str(profile,'headline')}</p><p className={s.authoredText}>{str(profile,'summary')}</p>
 {(['skills','occupations','languages'] as const).map(key=>Array.isArray(profile[key])&&profile[key].length?<p key={key}>{profile[key].filter((value):value is string=>typeof value==='string').join(' · ')}</p>:null)}
 {(['experience','education'] as const).map(key=>Array.isArray(profile[key])&&profile[key].length?<section key={key}><h3>{st(locale,key)}</h3>{profile[key].map((entry,index)=>{const row=object(entry);return <div key={str(row,'id')||index}><strong className={s.authoredText}>{str(row,'title')} · {str(row,'organization')}</strong><p>{str(row,'start')} – {str(row,'end')}</p><p className={s.authoredText}>{str(row,'description')}</p></div>;})}</section>:null)}
 {Array.isArray(vacancy.questions)&&vacancy.questions.length?<dl className={s.answerList}>{vacancy.questions.map(value=>{const question=object(value);return <div key={str(question,'id')}><dt className={s.authoredText}>{str(question,'label')}</dt><dd className={s.authoredText}>{str(answers,str(question,'id'))}</dd></div>;})}</dl>:null}
 {snap.file?<a className={s.textLink} download href={'/api/jobkix/files/'+str(object(snap.file),'id')}>{st(locale,'download')} · {e(locale,'document')}</a>:null}
 <details><summary>{e(locale,'terms')}</summary><VacancyTerms job={vacancy} locale={locale}/><p className={s.authoredText} lang={str(vacancy,'originalLocale')}>{str(vacancy,'description')}</p>{(['duties','requirements','benefits'] as const).map(key=>Array.isArray(vacancy[key])&&vacancy[key].length?<section key={key}><h3>{e(locale,key==='duties'?'responsibilities':key)}</h3><ul>{vacancy[key].filter((value):value is string=>typeof value==='string').map((value,index)=><li className={s.authoredText} key={index}>{value}</li>)}</ul></section>:null)}</details></section>;
}
