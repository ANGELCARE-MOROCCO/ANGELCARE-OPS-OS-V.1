'use client';
import Link from 'next/link';
import { useJobkixLocale } from '@/angelcare-marketplace/jobkix/client/useLocale';
import { errorText,t } from '@/angelcare-marketplace/jobkix/i18n';
import { href } from '@/angelcare-marketplace/jobkix/routes';
import s from '@/angelcare-marketplace/jobkix/jobkix.module.css';
export default function JobkixNotFound(){const locale=useJobkixLocale();return <div className={`${s.container} ${s.section}`}><section className={s.panel}><h1>{errorText(locale,'NOT_FOUND')}</h1><Link className={s.button} href={href(locale,'jobs')}>{t(locale,'findJobs')}</Link></section></div>;}
