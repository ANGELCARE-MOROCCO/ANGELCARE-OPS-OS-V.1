import { isLocale,type Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { str,number } from './Public';
import { t,formatMoney,LANGUAGE_NAMES } from '../i18n';
import { e,employmentLabel } from '../experience-copy';
import { AGE_COHORTS } from '../taxonomy';
import { AGE_NAMES } from '../age-copy';
import { h } from '../hiring-copy';
import s from '../jobkix.module.css';
const list=(job:DataRow,key:string)=>Array.isArray(job[key])?job[key].filter((item):item is string=>typeof item==='string'):[];
export function VacancyTerms({job,locale}:{job:DataRow;locale:Locale}){
 const pay=job.compensation&&typeof job.compensation==='object'&&!Array.isArray(job.compensation)?Object.fromEntries(Object.entries(job.compensation)):null;
 const salary=pay?[number(pay,'minimum'),number(pay,'maximum')].filter((value):value is number=>value!==null).map(value=>formatMoney(value,str(pay,'currency'),locale)).join(' – ')+' · '+employmentLabel(locale,str(pay,'unit')):t(locale,'notDeclared');
 return <dl className={s.definitionGrid}>{[[e(locale,'workSchedule'),employmentLabel(locale,str(job,'workSchedule'))],[e(locale,'contractType'),employmentLabel(locale,str(job,'contractType'))],[e(locale,'workLocation'),employmentLabel(locale,str(job,'workLocation'))],[e(locale,'hours'),number(job,'hoursPerWeek')===null?t(locale,'notDeclared'):new Intl.NumberFormat(locale).format(number(job,'hoursPerWeek')||0)],[e(locale,'liveIn'),t(locale,job.liveIn===true?'yes':'no')],[t(locale,'compensation'),salary]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
function ListSection({title,items,locale,id,language}:{title:string;items:string[];locale:Locale;id:string;language:string}){return <section className={s.panel} id={id}><h2>{title}</h2>{items.length?<ul lang={language}>{items.map((item,index)=><li key={index} className={s.authoredText}>{item}</li>)}</ul>:<p>{t(locale,'notDeclared')}</p>}</section>;}
export function VacancyDescription({job,locale}:{job:DataRow;locale:Locale}){
 const originalLocale=str(job,'originalLocale');return <>
 <nav className={s.detailNavigation} aria-label={e(locale,'description')}>{[['overview',e(locale,'description')],['responsibilities',e(locale,'responsibilities')],['requirements',e(locale,'requirements')],['benefits',e(locale,'benefits')],['international',e(locale,'internationalTerms')]].map(([anchor,label])=><a href={'#'+anchor} key={anchor}>{label}</a>)}</nav>
 <section className={s.panel} id="overview"><h2>{e(locale,'description')}</h2><p className={s.authoredText} lang={originalLocale}>{str(job,'description')}</p><p className={s.metadataLine}>{e(locale,'originalLanguage')}: {isLocale(originalLocale)?LANGUAGE_NAMES[originalLocale]:originalLocale}</p></section>
 <ListSection id="responsibilities" title={e(locale,'responsibilities')} items={list(job,'duties')} locale={locale} language={originalLocale}/><ListSection id="requirements" title={e(locale,'requirements')} items={list(job,'requirements')} locale={locale} language={originalLocale}/>
 <section className={s.panel}><h2>{e(locale,'languages')}</h2>{list(job,'languages').length?<div className={s.chips}>{list(job,'languages').map(language=><span className={s.chip} key={language}>{isLocale(language)?LANGUAGE_NAMES[language]:new Intl.DisplayNames([locale],{type:'language'}).of(language)||language}</span>)}</div>:<p>{t(locale,'notDeclared')}</p>}</section>
 {list(job,'ageCohorts').length?<section className={s.panel}><h2>{h(locale,'ageCohorts')}</h2><div className={s.chips}>{list(job,'ageCohorts').map(value=>{const age=AGE_COHORTS.find(key=>key===value);return <span className={s.chip} key={value}>{age?AGE_NAMES[age][locale]:value}</span>;})}</div></section>:null}
 <ListSection id="benefits" title={e(locale,'benefits')} items={list(job,'benefits')} locale={locale} language={originalLocale}/>
 <section className={s.panel} id="international"><h2>{e(locale,'internationalTerms')}</h2><p>{t(locale,'employerDeclared')}</p><dl className={s.definitionGrid}>{(['overseasApplicants','sponsorship','relocation'] as const).map(key=><div key={key}><dt>{key==='overseasApplicants'?e(locale,key):t(locale,key)}</dt><dd>{t(locale,job[key]==='yes'?'yes':job[key]==='no'?'no':'unknown')}</dd></div>)}</dl><p className={s.notice}>{t(locale,'noVisaGuarantee')}</p></section>
 </>;
}
