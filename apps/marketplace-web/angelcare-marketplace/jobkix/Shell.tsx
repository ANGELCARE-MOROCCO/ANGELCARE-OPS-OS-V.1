import Link from 'next/link';
import type { ReactNode } from 'react';
import { Menu,ArrowUpRight,UserRound } from 'lucide-react';
import { headers } from 'next/headers';
import { createUserClient } from '@/lib/supabase/server';
import type { Locale } from './contracts';
import { href } from './routes';
import { t,direction } from './i18n';
import { LanguageControl } from './client/LanguageControl';
import { NativeMenu } from './client/NativeMenu';
import { SignOut } from './client/SignOut';
import { getJobkixSession } from './server/identity';
import { jobkixPresentation } from './presentation-context';
import s from './jobkix.module.css';

export function Brand({locale,tone='color'}:{locale:Locale;tone?:'color'|'white'}){return <Link href={href(locale)} className={s.brand} aria-label="JOBKIX · GLOBAL CAREERS PLATFORM"><img src={`/jobkix/brand/jobkix-logo-${tone}.png`} width={tone==='white'?1347:1349} height={tone==='white'?515:518} alt="JOBKIX · GLOBAL CAREERS PLATFORM"/></Link>;}
const nav=[['jobs','findJobs'],['for-employers','hireTalent'],['countries','countries'],['employers','employers'],['resources','resources']] as const;
export async function Shell({locale,children}:{locale:Locale;children:ReactNode}){
 const session=await getJobkixSession().catch(()=>null),presentation=jobkixPresentation(await headers());
 const preferences=session?.state==='active'?{version:session.accountVersion,timezone:session.timezone,emailNotifications:session.emailNotifications}:undefined;
 let career=false,hiring=false,roleError=false;
 if(session?.state==='active'){
  const db=await createUserClient();const [profile,memberships]=await Promise.allSettled([db.from('jobkix_candidates').select('id').eq('user_id',session.userId).limit(1),db.from('jobkix_memberships').select('id').eq('user_id',session.userId).eq('active',true).or('expires_at.is.null,expires_at.gt.'+new Date().toISOString()).limit(1)]);
  career=profile.status==='fulfilled'&&!profile.value.error&&Boolean(profile.value.data?.length);hiring=memberships.status==='fulfilled'&&!memberships.value.error&&Boolean(memberships.value.data?.length);
  roleError=profile.status==='rejected'||memberships.status==='rejected'||(profile.status==='fulfilled'&&Boolean(profile.value.error))||(memberships.status==='fulfilled'&&Boolean(memberships.value.error));
 }
 const current=(path:string)=>presentation?.path===href(locale,path)||Boolean(path&&presentation?.path.startsWith(href(locale,path)+'/'));
 return <div className={s.root} lang={locale} dir={direction(locale)} data-jobkix-world>
  <a className={s.skip} href="#jobkix-main">{t(locale,'skip')}</a>
  <header className={s.header}><div className={`${s.container} ${s.headerInner}`}>
   <Brand locale={locale}/><nav className={s.navigation} aria-label={t(locale,'menu')}>{nav.map(([path,label])=><Link key={path} href={href(locale,path)} aria-current={current(path)?'page':undefined}>{t(locale,label)}</Link>)}<Link href={href(locale,'about')}>{t(locale,'about')}</Link></nav>
   <div className={s.headerActions}><LanguageControl locale={locale} preferences={preferences}/><NativeMenu className={s.accountMenu} label={t(locale,'myAccount')} summary={<><UserRound size={19} aria-hidden="true"/><span className={s.accountLabel}>{t(locale,session?.state==='anonymous'?'signIn':'myAccount')}</span></>}>
    {session?.state==='active'?<>{career?<Link href={href(locale,'career')}>{t(locale,'careerStudio')}</Link>:<Link href={href(locale,'onboarding',new URLSearchParams({intent:'candidate'}))}>{t(locale,'candidate')}</Link>}{hiring?<Link href={href(locale,'hiring')}>{t(locale,'hiringStudio')}</Link>:<Link href={href(locale,'hiring/organization')}>{t(locale,'hirer')}</Link>}{roleError?<p role="status">{t(locale,'unavailable')}</p>:null}<SignOut locale={locale}/></>:session?.state==='onboarding'?<><Link href={href(locale,'onboarding')}>{t(locale,'continue')}</Link><SignOut locale={locale}/></>:session?.state==='restricted'?<><p>{t(locale,'error.ACCOUNT_RESTRICTED')}</p><Link href={href(locale,'help')}>{t(locale,'support')}</Link><SignOut locale={locale}/></>:<><Link href={href(locale,'candidate/sign-in')}>{t(locale,'candidate')} · {t(locale,'signIn')}</Link><Link href={href(locale,'hirer/sign-in')}>{t(locale,'hirer')} · {t(locale,'signIn')}</Link><Link href={href(locale,'candidate/sign-up')}>{t(locale,'signUp')}</Link></>}
   </NativeMenu></div>
   <NativeMenu className={s.mobileMenu} label={t(locale,'menu')} summary={<Menu aria-hidden="true"/>}>{nav.map(([path,label])=><Link key={path} href={href(locale,path)}>{t(locale,label)}</Link>)}<Link href={href(locale,'sectors')}>{t(locale,'sectors')}</Link><Link href={href(locale,'professions')}>{t(locale,'professions')}</Link><Link href={href(locale,'about')}>{t(locale,'about')}</Link></NativeMenu>
  </div></header>
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
