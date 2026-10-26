"use client";
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {isLocale,path,tr} from '@/angelcare-marketplace/kidflix/catalogue';
import s from '@/angelcare-marketplace/kidflix/world/discovery.module.css';
export default function KidFlixNotFound(){const value=usePathname().split('/')[2],locale=isLocale(value)?value:'en';return <article className={s.explorer}><section className={s.empty}><h1>{tr(['This KidFlix page is unavailable','Cette page KidFlix est indisponible','صفحة كيدفليكس هذه غير متاحة'],locale)}</h1><p>{tr(['Continue exploring published resources or return to your personal space.','Continuez à explorer les ressources publiées ou retrouvez votre espace personnel.','تابع استكشاف الموارد المنشورة أو عد إلى مساحتك الشخصية.'],locale)}</p><Link href={path(locale,'/explore')}>{tr(['Explore resources','Explorer les ressources','استكشف الموارد'],locale)}</Link><Link href={path(locale,'/my')}>{tr(['My KidFlix','Mon KidFlix','كيدفليكس الخاص بي'],locale)}</Link></section></article>;}
