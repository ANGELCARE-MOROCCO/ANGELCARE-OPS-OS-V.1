import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight,UserRound,ChevronDown } from 'lucide-react';
import { headers } from 'next/headers';
import type { Locale } from './contracts';
import { href } from './routes';
import { t,direction } from './i18n';
import { LanguageControl } from './client/LanguageControl';
import { NativeMenu } from './client/NativeMenu';
import { GlobalHeader } from './client/GlobalHeader';
import { headerText } from './header-copy';
import { SignOut } from './client/SignOut';
import { getJobkixSession } from './server/identity';
import { jobkixPresentation } from './presentation-context';
import s from './jobkix.module.css';

export function Brand({locale,tone='color'}:{locale:Locale;tone?:'color'|'white'}){return <Link href={href(locale)} className={s.brand} aria-label="JOBKIX · GLOBAL CAREERS PLATFORM"><img src={`/jobkix/brand/jobkix-logo-${tone}.png`} width={tone==='white'?1347:1349} height={tone==='white'?515:518} alt="JOBKIX · GLOBAL CAREERS PLATFORM"/></Link>;}
export async function Shell({locale,children}:{locale:Locale;children:ReactNode}){
 const session=await getJobkixSession().catch(()=>null),presentation=jobkixPresentation(await headers());
 const preferences=session?.state==='active'?{version:session.accountVersion,timezone:session.timezone,emailNotifications:session.emailNotifications}:undefined;
 const career=session?.state==='active'&&session.pathway==='candidate';
 const hiring=session?.state==='active'&&session.pathway==='hirer';
 const audience=career?'candidate':hiring?'hirer':session?.state==='active'||session?.state==='onboarding'||session?.state==='restricted'||session?.state==='pathway_review'?'pending':'guest';
 const account=<NativeMenu className={`${s.accountMenu} ${s.pm5AccountMenu}`} label={t(locale,'myAccount')} summary={<><span className={s.pm5Avatar}><UserRound size={19} aria-hidden="true"/></span><span className={s.pm5AccountName}>{t(locale,session?.state==='anonymous'?'signIn':'myAccount')}<small>{career?t(locale,'candidate'):hiring?t(locale,'hirer'):t(locale,'support')}</small></span><ChevronDown size={15} aria-hidden="true"/></>}>
  {session?.state==='active'?<>{career?<><Link href={href(locale,'career')}>{t(locale,'careerStudio')}</Link><Link href={href(locale,'career/saved')}>{headerText(locale,'savedJobs')}</Link><Link href={href(locale,'career/applications')}>{headerText(locale,'applications')}</Link><Link href={href(locale,'career/inbox')}>{headerText(locale,'messages')}</Link><Link href={href(locale,'career/settings')}>{headerText(locale,'settings')}</Link></>:null}{hiring?<><Link href={href(locale,'hiring')}>{t(locale,'hiringStudio')}</Link><Link href={href(locale,'hiring/vacancies')}>{headerText(locale,'vacancies')}</Link><Link href={href(locale,'hiring/applications')}>{headerText(locale,'applications')}</Link><Link href={href(locale,'hiring/inbox')}>{headerText(locale,'messages')}</Link><Link href={href(locale,'hiring/settings')}>{headerText(locale,'settings')}</Link></>:null}<SignOut locale={locale}/></>:session?.state==='onboarding'?<><Link href={href(locale,'onboarding')}>{t(locale,'continue')}</Link><SignOut locale={locale}/></>:session?.state==='restricted'||session?.state==='pathway_review'?<><p>{t(locale,'error.ACCOUNT_RESTRICTED')}</p><Link href={href(locale,'help')}>{t(locale,'support')}</Link><SignOut locale={locale}/></>:<><Link href={href(locale,'candidate/sign-in')}>{t(locale,'candidate')} · {t(locale,'signIn')}</Link><Link href={href(locale,'hirer/sign-in')}>{t(locale,'hirer')} · {t(locale,'signIn')}</Link><Link href={href(locale,'candidate/sign-up')}>{t(locale,'signUp')}</Link></>}
 </NativeMenu>;
 return <div className={s.root} lang={locale} dir={direction(locale)} data-jobkix-world>
  <a className={s.skip} href="#jobkix-main">{t(locale,'skip')}</a>
  <GlobalHeader locale={locale} audience={audience} activePath={presentation?.path||''} brand={<Brand locale={locale}/>} language={<LanguageControl locale={locale} preferences={preferences}/>} account={account}/>
  <main id="jobkix-main">{children}</main>
  <Footer locale={locale} preferences={preferences}/>
 </div>;
}
function Footer({locale,preferences}:{locale:Locale;preferences?:{version:number;timezone:string;emailNotifications:boolean}}){
 const groups=[
  {title:'candidate',links:[['jobs','findJobs'],['candidate/sign-up','signUp'],['career','careerStudio'],['resources','resources']]},
  {title:'employers',links:[['for-employers','hireTalent'],['hirer/sign-up','postJob'],['hiring','hiringStudio'],['employers','employers']]},
  {title:'countries',links:[['countries','countries'],['sectors','sectors'],['professions','professions'],['abroad','abroad']]},
  {title:'support',links:[['help','support'],['trust','trust'],['report','report'],['legal','legal']]},
 ] as const;
 return <footer className={s.footer}><div className={s.container}><div className={s.footerGrid}><div><Brand locale={locale} tone="white"/><p>{t(locale,'heroDescription')}</p><Link className={s.textLink} href={href(locale,'about')}>{t(locale,'about')}<ArrowUpRight size={16} aria-hidden="true"/></Link></div>
  {groups.map(group=><div key={group.title}><h3>{t(locale,group.title)}</h3><ul>{group.links.map(([path,label])=><li key={path}><Link href={href(locale,path)}>{t(locale,label)}</Link></li>)}</ul></div>)}
  </div><div className={s.footerBottom}><span>© {new Date().getUTCFullYear()} JOBKIX</span><span><Link href={href(locale,'legal/privacy')}>{t(locale,'legal')}</Link> · <a href="https://db-ip.com" target="_blank" rel="noopener noreferrer">IP Geolocation by DB-IP</a></span><LanguageControl locale={locale} preferences={preferences}/></div></div></footer>;
}
