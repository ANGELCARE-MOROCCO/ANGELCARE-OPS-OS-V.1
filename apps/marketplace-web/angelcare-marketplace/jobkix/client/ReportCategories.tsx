'use client';
import { FileWarning,UserRoundSearch,BriefcaseBusiness,Building2,MessageSquareWarning,Wrench } from 'lucide-react';
import type { Locale } from '../contracts';
import { REPORT_CATEGORIES,su } from '../support-copy';
import s from '../jobkix.module.css';
const ICONS={content:FileWarning,identity:UserRoundSearch,vacancy:BriefcaseBusiness,employer:Building2,harassment:MessageSquareWarning,technical:Wrench};
export function ReportCategories({locale,selected,onChange,disabled=false}:{locale:Locale;selected:string;onChange:(category:string)=>void;disabled?:boolean}){return <section><h2>{su(locale,'reportCategories')}</h2><div className={s.reportCategories}>{REPORT_CATEGORIES.map(category=>{const Icon=ICONS[category];return <button className={s.reportCategory} type="button" key={category} aria-pressed={selected===category} disabled={disabled} onClick={()=>onChange(category)}><Icon aria-hidden="true"/><strong>{su(locale,category)}</strong></button>;})}</div></section>;}
