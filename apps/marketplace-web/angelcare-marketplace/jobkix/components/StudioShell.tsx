import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '../contracts';
import { SCREENS,href } from '../routes';
import { screenName } from '../screen-copy';
import { t } from '../i18n';
import { st } from '../studio-copy';
import s from '../jobkix.module.css';
import { CandidateShell } from './CandidateShell';
import { EmployerShell } from './EmployerShell';
export function StudioShell({locale,mode,screenId,title,children,context,organizationId}:{locale:Locale;mode:'candidate'|'hirer';screenId:string;title:string;children:ReactNode;context?:ReactNode;organizationId?:string}){
 const navParams=mode==='hirer'&&organizationId?new URLSearchParams({organization:organizationId}):undefined;
 if(mode==='candidate')return <CandidateShell locale={locale} screenId={screenId} title={title}>{children}</CandidateShell>;
 if(mode==='hirer')return <EmployerShell locale={locale} screenId={screenId} title={title} context={context} organizationId={organizationId}>{children}</EmployerShell>;
 return <div className={s.studio}><aside className={s.studioNav}><h2>{t(locale,mode==='candidate'?'careerStudio':'hiringStudio')}</h2>{SCREENS.filter(screen=>screen.audience===mode&&!screen.path.includes(':')).map(screen=><Link href={href(locale,screen.path,navParams)} key={screen.id} aria-current={screen.id===screenId?'page':screenId==='C05'&&screen.id==='C04'||screenId==='H04'&&screen.id==='H02'?'location':undefined}>{screenName(screen.id,locale)}</Link>)}</aside><div className={s.studioMain}><header className={s.studioHeading}><div><span className={s.eyebrow}>{st(locale,mode==='candidate'?'candidateContext':'hirerContext')}</span><h1>{title}</h1></div>{context}</header>{children}</div></div>;
}
