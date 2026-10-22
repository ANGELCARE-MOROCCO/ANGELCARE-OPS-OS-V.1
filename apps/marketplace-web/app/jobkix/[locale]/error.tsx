'use client';
import { useEffect,useRef } from 'react';
import Link from 'next/link';
import { useJobkixLocale } from '@/angelcare-marketplace/jobkix/client/useLocale';
import { t } from '@/angelcare-marketplace/jobkix/i18n';
import { href } from '@/angelcare-marketplace/jobkix/routes';
import s from '@/angelcare-marketplace/jobkix/jobkix.module.css';
export default function JobkixError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 const locale=useJobkixLocale(),title=useRef<HTMLHeadingElement>(null);useEffect(()=>{title.current?.focus();},[]);
 return <div className={`${s.container} ${s.section}`} role="alert"><section className={s.panel}><span className={s.eyebrow}>JOBKIX</span><h1 ref={title} tabIndex={-1}>{t(locale,'unavailable')}</h1><div className={s.inlineActions}><button className={s.button} onClick={reset}>{t(locale,'retry')}</button><Link className={`${s.button} ${s.secondary}`} href={href(locale)}>{t(locale,'back')}</Link></div></section></div>;
}
