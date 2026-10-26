import {notFound} from 'next/navigation';
import Link from 'next/link';
import {isLocale} from '@/angelcare-marketplace/jobkix/contracts';
import {publicExternal} from '@/angelcare-marketplace/jobkix/supply/server';
import css from '@/angelcare-marketplace/jobkix/supply/external.module.css';
export const dynamic='force-dynamic';
export const metadata={title:'External Opportunities · JOBKIX',robots:{index:true,follow:true}};
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();const items=await publicExternal(null,60);return <main className={css.section}><div className={css.wrap}><header className={css.heading}><div><span className={css.eyebrow}>JOBKIX · GLOBAL CAREERS</span><h1>External job opportunities</h1><p>Explore jobs published by external sources. Applications are made on the original website.</p></div><Link href={`/jobkix/${locale}/jobs`}>JOBKIX search</Link></header><div className={css.grid}>{items.map(v=><Link className={css.card} href={`/jobkix/${locale}/discovered-jobs/${v.id}`} key={v.id}><span className={css.type}>EXTERNAL SOURCE</span><strong>{v.title}</strong><small>{v.company||v.source_name}</small><span>{[v.city,v.country].filter(Boolean).join(' · ')}</span><span className={css.action}>View details ↗</span></Link>)}</div>{!items.length?<p>No external opportunities have been published yet.</p>:null}</div></main>}
