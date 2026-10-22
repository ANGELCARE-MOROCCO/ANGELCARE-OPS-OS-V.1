import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '../contracts';
import { talentQuery } from '../talent-query';
import { talentIntent } from '../talent-draft';
import { object,uuid } from '../validation';
import { talentPage,talentReceipt,studioSelection,studioSelectionLabels,workspaceDrafts,type DataRow } from '../server/repository';
import { studioSelectionParams,validSelectionIds } from '../studio-selection';
import { StudioFormSelection } from '../client/StudioRecordPicker';
import { hiringCapability } from '../server/hiring-context';
import { w } from '../workforce-copy';
import { st } from '../studio-copy';
import { t,errorText,formatDate } from '../i18n';
import { countryName } from '../country-format';
import { CountryOptions } from '../Country';
import { href } from '../routes';
import { str,number,Empty } from '../components/Public';
import { StudioPagination } from '../components/StudioPagination';
import { TaxonomyFilter } from '../client/TaxonomySelect';
import { TalentPoolCreate,TalentPoolControl } from '../client/TalentForms';
import s from '../jobkix.module.css';
type Params=Record<string,string|string[]|undefined>;
export async function HiringTalent({locale,organizationId,screen,search,timezone}:{locale:Locale;organizationId:string;screen:'H07'|'H08';search:Params;timezone:string}){
 if(!await hiringCapability(organizationId,'talent.search'))return <Empty locale={locale} problem title={errorText(locale,'FORBIDDEN')}/>;
 let query;try{query=talentQuery(search);}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>;}
 const selected=typeof search.pool==='string'?search.pool:'';if(selected){try{uuid(selected);}catch{notFound();}}
 const poolParams=studioSelectionParams('pools',organizationId,undefined,selected?[selected]:[]),pools=await studioSelection(poolParams),poolId=screen==='H08'?(selected||pools.items[0]?.id||null):null;
 if(poolId&&![...pools.items,...pools.selected].some(pool=>pool.id===poolId))notFound();
 const result=screen==='H08'&&!poolId?{items:[],page:1,pageSize:24,total:0}:await talentPage(organizationId,query.filters,query.page,poolId),keys=['new-pool:'+organizationId,...result.items.map(row=>'candidate:'+organizationId+':'+str(row,'userId'))],drafts=await workspaceDrafts('talent',keys);
 const savedPoolIds=validSelectionIds(drafts.map(draft=>{const body=draft.body?object(draft.body):{},fields=body.fields?object(body.fields):{};return fields.poolId;}));
 const [labels,recovered]=await Promise.all([studioSelectionLabels(poolParams,savedPoolIds),Promise.all(drafts.map(async draft=>{const intent=draft.body?talentIntent(object(draft.body).intent):null;return {key:str(draft,'draft_key'),receipt:intent?await talentReceipt(intent.action,intent.key):null};}))]);
 const poolChoices={...pools,selected:[...pools.selected,...labels.filter(row=>!pools.selected.some(selected=>selected.id===row.id))]};
 const draftFor=(key:string)=>drafts.find(draft=>draft.draft_key===key)||null,receiptFor=(key:string)=>recovered.find(row=>row.key===key)?.receipt||null,path=screen==='H07'?'hiring/talent':'hiring/pools',context=new URLSearchParams({organization:organizationId}),createKey='new-pool:'+organizationId;
 return <div className={s.stack}><section className={s.panel}><h2>{w(locale,screen==='H07'?'talentOverview':'poolOverview')}</h2><p>{w(locale,screen==='H07'?'talentHelp':'poolHelp')}</p><Link className={s.textLink} href={href(locale,screen==='H07'?'hiring/pools':'hiring/talent',context)}>{w(locale,screen==='H07'?'pool':'talentOverview')}</Link></section>{screen==='H08'?<TalentPoolCreate key={organizationId} locale={locale} organizationId={organizationId} draft={draftFor(createKey)} receipt={receiptFor(createKey)}/>:null}
 <form className={s.panel} method="get" action={href(locale,path)}><input type="hidden" name="organization" value={organizationId}/><div className={s.formGrid}>{screen==='H08'?<StudioFormSelection key={organizationId+':'+poolId} locale={locale} kind="pools" organization={organizationId} label={w(locale,'pool')} initial={poolChoices} value={poolId||''} name="pool"/>:null}<label className={s.field}>{t(locale,'keyword')}<input name="q" defaultValue={query.filters.q||''} maxLength={300}/></label><label className={s.field}>{t(locale,'country')}<select name="country" defaultValue={query.filters.country||''}><option value="">{t(locale,'any')}</option><CountryOptions locale={locale}/></select></label><TaxonomyFilter locale={locale} kind="occupation" name="occupation" label={t(locale,'professions')} initialValue={query.filters.occupation||''}/><label className={s.field}>{w(locale,'skills')}<input name="skill" defaultValue={query.filters.skill||''} maxLength={300}/></label><label className={s.field}>{t(locale,'language')}<input name="language" defaultValue={query.filters.language||''} maxLength={6} pattern="[a-z]{2,3}(-[A-Z]{2})?"/></label><label className={s.field}>{w(locale,'experience')}<select name="experience" defaultValue={query.filters.experience||''}><option value="">{t(locale,'any')}</option>{(['recorded','none'] as const).map(value=><option key={value} value={value}>{w(locale,value)}</option>)}</select></label></div><div className={s.inlineActions}><button className={s.button} type="submit">{w(locale,'searchTalent')}</button><Link className={s.textLink} href={href(locale,path,new URLSearchParams({...Object.fromEntries(context),...(poolId?{pool:poolId}:{})}))}>{t(locale,'clearFilters')}</Link></div></form>
 <div className={s.stack}>{result.items.map(row=>{const key='candidate:'+organizationId+':'+str(row,'userId');return <article key={str(row,'id')} className={s.panel}><div className={s.sectionHeading}><div><h2>{str(row,'displayName')}</h2><p>{str(row,'headline')}</p><small>{str(row,'country')?countryName(str(row,'country'),locale):t(locale,'countryUnknown')}</small></div>{row.poolExpiresAt?<p>{w(locale,'retainedUntil')} · {formatDate(str(row,'poolExpiresAt'),locale,timezone,true)}</p>:null}</div><p className={s.authoredText}>{str(row,'summary')}</p>{(['skills','occupations','languages'] as const).map(key=>Array.isArray(row[key])?<p className={s.chips} key={key}>{row[key].filter((value):value is string=>typeof value==='string').map(value=><span className={s.chip} key={value}>{value}</span>)}</p>:null)}<details><summary>{w(locale,'experience')}</summary>{(['experience','education'] as const).map(key=>Array.isArray(row[key])?<section key={key}><h3>{st(locale,key)}</h3>{row[key].map((value,index)=>{const entry=object(value);return <div key={index}><strong>{str(entry,'title')} · {str(entry,'organization')}</strong><p>{str(entry,'start')} – {str(entry,'end')}</p><p className={s.authoredText}>{str(entry,'description')}</p></div>;})}</section>:null)}</details><TalentPoolControl key={organizationId+':'+str(row,'userId')+':'+(poolId||'discovery')} locale={locale} organizationId={organizationId} candidateId={str(row,'userId')} pools={poolChoices} poolId={poolId||undefined} version={number(row,'poolMemberVersion')||0} draft={draftFor(key)} receipt={receiptFor(key)}/></article>;})}</div>{!result.items.length?<Empty locale={locale} title={w(locale,'noTalent')} description={w(locale,'talentHelp')}/>:null}<StudioPagination locale={locale} path={path} search={{...search,organization:organizationId,...(poolId?{pool:poolId}:{})}} result={result}/></div>;
}
