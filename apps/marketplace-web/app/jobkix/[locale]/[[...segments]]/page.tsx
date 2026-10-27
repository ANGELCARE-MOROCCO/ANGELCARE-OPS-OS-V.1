import { seoMetadata, SeoEnhancements, noindex } from '@/angelcare-marketplace/seo-power/public';
import { notFound } from 'next/navigation';
import { isLocale } from '@/angelcare-marketplace/jobkix/contracts';
import { resolveScreen } from '@/angelcare-marketplace/jobkix/routes';
import { Home } from '@/angelcare-marketplace/jobkix/pages/Home';
import { SearchPage } from '@/angelcare-marketplace/jobkix/pages/Search';
import { JobDetail } from '@/angelcare-marketplace/jobkix/pages/JobDetail';
import { readFilters } from '@/angelcare-marketplace/jobkix/discovery';
import { Empty } from '@/angelcare-marketplace/jobkix/components/Public';
import { errorText,t } from '@/angelcare-marketplace/jobkix/i18n';
import { href } from '@/angelcare-marketplace/jobkix/routes';
import Link from 'next/link';
import { AuthPage } from '@/angelcare-marketplace/jobkix/pages/Auth';
import { LegalPage } from '@/angelcare-marketplace/jobkix/pages/Legal';
import { CandidatePage } from '@/angelcare-marketplace/jobkix/pages/Candidate';
import { pageMetadata } from '@/angelcare-marketplace/jobkix/server/page-metadata';
import { Directories } from '@/angelcare-marketplace/jobkix/pages/Directories';
import { ProfessionalWorld } from '@/angelcare-marketplace/jobkix/pages/ProfessionalWorld';
import { Resources } from '@/angelcare-marketplace/jobkix/pages/Resources';
import { Guide } from '@/angelcare-marketplace/jobkix/pages/Guide';
import { Reputation } from '@/angelcare-marketplace/jobkix/pages/Reputation';
import { Employers,EmployerProfile } from '@/angelcare-marketplace/jobkix/pages/Employers';
import { Countries,GeographicWorld,Abroad } from '@/angelcare-marketplace/jobkix/pages/Geography';
import { PublicSupport } from '@/angelcare-marketplace/jobkix/pages/PublicSupport';
import { Journeys } from '@/angelcare-marketplace/jobkix/pages/Journeys';
import { HirerPage } from '@/angelcare-marketplace/jobkix/pages/Hirer';
async function nativeMetadata({params,searchParams}:{params:Promise<{locale:string;segments?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {locale,segments=[]}=await params;if(!isLocale(locale))return {robots:{index:false,follow:false}};return pageMetadata(locale,segments,await searchParams);}
async function NativePage({params,searchParams}:{params:Promise<{locale:string;segments?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale,segments=[]}=await params;if(!isLocale(locale))notFound();
 const route=resolveScreen(segments);if(!route)notFound();
 if(route.screen.id==='P00')return <Home locale={locale}/>;
 const search=await searchParams;
 if(route.screen.id==='P01'){
  const query=new URLSearchParams();for(const [key,value] of Object.entries(search)){if(Array.isArray(value))for(const item of value)query.append(key,item);else if(value!==undefined)query.set(key,value);}
  let filters;try{filters=readFilters(query);}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}><Link href={href(locale,'jobs')}>{t(locale,'clearFilters')}</Link></Empty>;}
  return <SearchPage locale={locale} filters={filters}/>;
 }
 if(route.screen.id==='P02')return <JobDetail locale={locale} id={segments[1]} apply={search.apply==='1'} returnTo={typeof search.returnTo==='string'?search.returnTo:undefined}/>;
 if(route.screen.id==='P03'||route.screen.id==='P05')return <Directories locale={locale} kind={route.screen.id==='P03'?'setting':'occupation'} search={search}/>;
 if(route.screen.id==='P04'||route.screen.id==='P06')return <ProfessionalWorld locale={locale} kind={route.screen.id==='P04'?'setting':'occupation'} slug={segments[1]} search={search}/>;
 if(route.screen.id==='P07')return <Countries locale={locale} search={search}/>;
 if(route.screen.id==='P08'||route.screen.id==='P09')return <GeographicWorld locale={locale} country={segments[1]} cityKey={segments[2]} search={search}/>;
 if(route.screen.id==='P10')return <Abroad locale={locale} search={search}/>;
 if(route.screen.id==='P11')return <Employers locale={locale} search={search}/>;
 if(route.screen.id==='P12')return <EmployerProfile locale={locale} id={segments[1]} search={search}/>;
 if(route.screen.id==='P13'||route.screen.id==='P14')return <Reputation locale={locale} screen={route.screen.id} search={search}/>;
 if(route.screen.id==='P15')return <Resources locale={locale} search={search}/>;
 if(route.screen.id==='P16')return <Guide locale={locale} slug={segments[1]} search={search}/>;
 if(route.screen.id==='P17'||route.screen.id==='P18'||route.screen.id==='P19')return <Journeys locale={locale} screen={route.screen.id} search={search}/>;
 if(route.screen.id==='P22')return <Guide locale={locale} kind="help" slug={segments[1]} search={search}/>;
 if(route.screen.id==='P20'||route.screen.id==='P21'||route.screen.id==='P23'||route.screen.id==='P24'||route.screen.id==='P25')return <PublicSupport locale={locale} screen={route.screen.id} search={search}/>;
 if(route.screen.id==='P26')return <LegalPage locale={locale} slug={segments[1]}/>;
 if(route.screen.audience==='auth')return <AuthPage locale={locale} screen={route.screen.id} search={search}/>;
 if(route.screen.audience==='candidate')return <CandidatePage locale={locale} screen={route.screen.id} id={segments[2]} search={search}/>;
 if(route.screen.audience==='hirer')return <HirerPage locale={locale} screen={route.screen.id} id={segments[2]} search={search}/>;
 // Unimplemented units remain a 404 until their actual screen and workflow are connected.
 notFound();
}

type SeoPageProps={params:Promise<{locale:string;segments?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata(props:SeoPageProps){const p=await props.params;const base=await nativeMetadata(props);return seoMetadata('jobkix',`/jobkix/${p.locale}${p.segments?.length?"/"+p.segments.join("/"):""}`,base);}
export default async function Page(props:SeoPageProps){const p=await props.params;const [body,base]=await Promise.all([NativePage(props),nativeMetadata(props)]);return <>{body}{!noindex(base)?<SeoEnhancements world="jobkix" path={`/jobkix/${p.locale}${p.segments?.length?"/"+p.segments.join("/"):""}`} base={base}/>:null}</>;}
