'use client';
import s from '@/angelcare-marketplace/jobkix/jobkix.module.css';
import { useJobkixLocale } from '@/angelcare-marketplace/jobkix/client/useLocale';
import { t } from '@/angelcare-marketplace/jobkix/i18n';
export default function Loading(){const locale=useJobkixLocale();return <div className={s.container} style={{paddingBlock:70}} aria-busy="true"><div className={s.panel}><strong>JOBKIX</strong><p>{t(locale,'loading')}</p><progress aria-label={t(locale,'loading')} style={{display:'block',width:'min(100%,360px)',marginBlockStart:25}}/></div></div>;}
