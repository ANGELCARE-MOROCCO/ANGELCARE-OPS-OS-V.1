import Link from 'next/link';
import type { Locale } from '../contracts';
import type { SearchFilters } from '../discovery';
import { searchHref,filtersParams } from '../discovery';
import { searchVacancies,publicEmployers } from '../server/repository';
import { dependencyError } from '../server/http';
import { SearchCommand } from '../client/SearchCommand';
import { SearchResults } from '../client/SearchResults';
import { CountryLinks,SectionHeading,Empty,str } from '../components/Public';
import { href } from '../routes';
import { t } from '../i18n';
import { e } from '../experience-copy';
import s from '../jobkix.module.css';
export async function SearchPage({locale,filters}:{locale:Locale;filters:SearchFilters}){
 const [jobs,employers]=await Promise.allSettled([searchVacancies(filters),publicEmployers(filters.destination||null)]);
 return <><section className={s.searchLanding}><div className={s.searchBackdrop}><picture><source media="(max-width:767px)" srcSet="/jobkix/editorial/search-hero-mobile.webp"/><img src="/jobkix/editorial/search-hero.webp" width={1536} height={1024} alt="" fetchPriority="high"/></picture><div className={s.container}><div className={s.searchOpeningCopy}><span className={s.eyebrow}>JOBKIX · {t(locale,'findJobs')}</span><h1>{e(locale,'searchTitle')}</h1><p>{e(locale,'searchIntro')}</p></div></div></div><div className={`${s.container} ${s.searchCommandWrap}`}><SearchCommand key={filtersParams(filters).toString()} locale={locale} filters={filters}/></div></section>
  <SearchResults locale={locale} filters={filters} initialResult={jobs.status==='fulfilled'?jobs.value:null} initialError={jobs.status==='rejected'?dependencyError(jobs.reason).code:null}/>
  <section className={`${s.section} ${s.sectionSoft}`}><div className={s.container}><SectionHeading title={e(locale,'relatedJobs')} description={t(locale,'globalReachDescription')}/><CountryLinks locale={locale} codes={['GB','CA','AE','SG','AU','FR']}/><div className={s.inlineActions}><Link className={s.textLink} href={searchHref(locale,filters,{reach:'abroad',page:null})}>{t(locale,'abroad')}</Link><Link className={s.textLink} href={searchHref(locale,filters,{sponsorship:'yes',page:null})}>{t(locale,'sponsorship')}</Link><Link className={s.textLink} href={href(locale,'professions')}>{t(locale,'professions')}</Link></div></div></section>
  <section className={s.section}><div className={s.container}><SectionHeading title={t(locale,'employers')} action={<Link className={s.textLink} href={href(locale,'employers')}>{t(locale,'employers')}</Link>}/>{employers.status==='fulfilled'&&employers.value.length?<div className={s.jobsGrid}>{employers.value.slice(0,6).map(employer=><Link className={s.panel} key={str(employer,'id')} href={href(locale,'employers/'+str(employer,'id'))}><h3>{str(employer,'name')}</h3><p>{str(employer,'city')}</p></Link>)}</div>:<Empty locale={locale} problem={employers.status==='rejected'} title={employers.status==='fulfilled'?t(locale,'noPublishedContent'):undefined}/>}</div></section>
 </>;
}
