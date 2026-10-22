import Link from 'next/link';
import type { Locale } from '../contracts';
import { restrictedCases,caseReceipt,type DataRow } from '../server/repository';
import { dependencyError } from '../server/http';
import { directoryQuery } from '../directory';
import { caseIntent } from '../case-draft';
import { object,uuid } from '../validation';
import { CaseCreate,CaseResponse } from '../client/CaseForms';
import { StudioPagination } from '../components/StudioPagination';
import { Empty,str } from '../components/Public';
import { ac,caseLabel } from '../account-copy';
import { t,errorText,formatDate } from '../i18n';
import { href } from '../routes';
import s from '../jobkix.module.css';
type Params=Record<string,string|string[]|undefined>;
async function recovery(draft:DataRow|null){const intent=draft?.body?caseIntent(object(draft.body).intent):null;return intent?caseReceipt(intent.action,intent.key):null;}
/** Verified identity, own cases only. No Career/Hiring/file authority is granted. */
export async function RestrictedCases({locale,path,search,restricted}:{locale:Locale;path:'contact'|'report';search:Params;restricted:boolean}){
 let result;try{const query=directoryQuery(search);if(Array.isArray(search.case))throw Error('INVALID_INPUT');result=await restrictedCases(search.case?uuid(search.case):null,query.page);}catch(error){return <Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}/>;}
 const row=result.case,draft=result.draft,receipt=await recovery(draft);
 if(row){const canReply=['reported','triaged','under_review','needs_information','appealed'].includes(str(row,'state')),appeal=['action','no_action','resolved'].includes(str(row,'state'));
  return <div className={s.stack}><Link href={href(locale,path)} className={s.textLink}>{t(locale,'back')}</Link><section className={s.panel}><span className={s.chip}>{caseLabel(locale,str(row,'state'))}</span><h2><bdi>{str(row,'public_reference')}</bdi></h2><p>{caseLabel(locale,str(row,'kind'))} · {formatDate(str(row,'created_at'),locale,'UTC')} · UTC</p><p className={s.authoredText} lang={str(row,'original_locale')} dir={row.original_locale==='ar'?'rtl':'auto'}>{str(row,'description')}</p></section><section className={s.panel}><h2>{ac(locale,'caseHistory')}</h2><ol className={s.timeline}>{result.items.map(event=><li key={str(event,'id')}><time dateTime={str(event,'created_at')}>{formatDate(str(event,'created_at'),locale,'UTC')} · UTC</time><p className={s.authoredText} lang={str(event,'original_locale')} dir={event.original_locale==='ar'?'rtl':'auto'}>{str(event,'detail')}</p></li>)}</ol><StudioPagination locale={locale} path={path} search={search} result={result}/></section>{canReply||appeal?<CaseResponse locale={locale} row={row} appeal={appeal} draft={draft} receipt={receipt}/>:null}</div>;
 }
 return <div className={s.stack}><section className={s.panel}><h2>{ac(locale,'supportTitle')}</h2>{restricted?<p>{errorText(locale,'ACCOUNT_RESTRICTED')}</p>:null}<p>{ac(locale,'supportHelp')}</p></section><CaseCreate locale={locale} initialKind={search.kind==='report'?'report':'support'} initialCategory={typeof search.category==='string'?search.category:'general'} casePath={path} draft={draft} receipt={receipt} documents={null} allowAttachments={false}/><section className={s.panel}><h2>{ac(locale,'caseHistory')}</h2><div className={s.stack}>{result.items.map(row=><article className={s.blockedOrganization} key={str(row,'id')}><div><span className={s.chip}>{caseLabel(locale,str(row,'state'))}</span><h3><Link href={href(locale,path,new URLSearchParams({case:str(row,'id')}))}><bdi>{str(row,'public_reference')}</bdi></Link></h3><p>{caseLabel(locale,str(row,'kind'))} · {formatDate(str(row,'updated_at'),locale,'UTC')}</p></div><Link className={`${s.button} ${s.secondary}`} href={href(locale,path,new URLSearchParams({case:str(row,'id')}))}>{t(locale,'continue')}</Link></article>)}</div>{!result.items.length?<p>{t(locale,'noPublishedContent')}</p>:null}<StudioPagination locale={locale} path={path} search={search} result={result}/></section></div>;
}
