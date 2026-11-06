"use client";
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, Search, Workflow, ShieldCheck, Image, LayoutDashboard, ChevronRight, ExternalLink } from 'lucide-react';
import type { JobkixAdminEntry, JobkixAdminGroup } from './registry';
import s from './hub.module.css';
const groups:{key:JobkixAdminGroup;title:string;description:string;Icon:typeof Workflow}[]=[
 {key:'operations',title:'Pilotage & opérations',description:'Les sept espaces opérateurs JOBKIX, selon vos accès.',Icon:Workflow},
 {key:'native',title:'Administration native',description:'Les autorités existantes de gestion, de décision et de contrôle.',Icon:ShieldCheck},
 {key:'specialist',title:'Studios & outils spécialisés',description:'Les espaces dédiés désormais réunis dans votre navigation.',Icon:Image},
];
export function JobkixAdminHub({entries}:{entries:JobkixAdminEntry[]}){
 const [query,setQuery]=useState(''),[group,setGroup]=useState<'all'|JobkixAdminGroup>('all');
 const visible=useMemo(()=>{const terms=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().split(/\s+/).filter(Boolean);return entries.filter(e=>(group==='all'||e.group===group)&&terms.every(t=>(e.title+' '+e.description+' '+e.links.map(l=>l.title).join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(t)));},[entries,query,group]);
 const main=entries.find(e=>e.group==='native')||entries[0];
 return <div className={s.hub} data-jobkix-admin-revision="JK-NAV-R1">
  <header className={s.hero}><div><span className={s.kicker}><BriefcaseBusiness size={15}/> JOBKIX · ADMINISTRATION</span><h1>Un seul accès. Tous vos espaces JOBKIX.</h1><p>Pilotez les opérations, ouvrez l’administration native et retrouvez vos studios spécialisés depuis ce point d’entrée unique.</p><div className={s.facts}><span><LayoutDashboard size={15}/>{entries.length} espaces accessibles</span><span><ShieldCheck size={15}/>Accès natifs appliqués</span><span><Workflow size={15}/>Navigation centralisée</span></div></div>{main?<Link className={s.primary} href={main.href}>Ouvrir JOBKIX Admin<ArrowUpRight size={18}/></Link>:null}</header>
  <section className={s.finder} aria-label="Rechercher un espace JOBKIX"><label><Search size={19}/><input type="search" aria-label="Rechercher un espace JOBKIX" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Un espace, une source, un import, une publication…" maxLength={120}/></label><div role="group" aria-label="Type d’espace"><button type="button" aria-pressed={group==='all'} onClick={()=>setGroup('all')}>Tous les espaces</button>{groups.map(g=><button key={g.key} type="button" aria-pressed={group===g.key} onClick={()=>setGroup(g.key)}>{g.title}</button>)}</div><p role="status">{visible.length} espace{visible.length===1?'':'s'} correspondant{visible.length===1?'':'s'}</p></section>
  {groups.map(g=>{const rows=visible.filter(e=>e.group===g.key);return rows.length?<section className={s.section} key={g.key}><div className={s.heading}><g.Icon size={22}/><div><h2>{g.title}</h2><p>{g.description}</p></div><span>{rows.length}</span></div><div className={s.grid}>{rows.map(entry=><article key={entry.id} className={s.card} data-jobkix-workspace={entry.id}><span className={s.badge}>{entry.group==='native'?'NATIVE ADMIN':entry.group==='operations'?'OPERATOR WORKSPACE':'SPECIALIST STUDIO'}</span><h3><Link href={entry.href}>{entry.title}<ArrowUpRight size={18}/></Link></h3><p>{entry.description}</p><Link className={s.open} href={entry.href}>Ouvrir l’espace<ChevronRight size={16}/></Link>{entry.links.length?<details><summary>{entry.links.length} raccourcis directs</summary><nav aria-label={'Raccourcis '+entry.title}>{entry.links.map(link=><Link key={link.href} href={link.href}>{link.title}<ExternalLink size={12}/></Link>)}</nav></details>:null}</article>)}</div></section>:null;})}
  {!visible.length?<section className={s.empty}><Search size={28}/><h2>{entries.length?'Aucun espace ne correspond à votre recherche.':'Aucun accès JOBKIX disponible pour ce compte.'}</h2><p>{entries.length?'Modifiez votre recherche ou affichez tous les espaces.':'Les droits existants restent nécessaires pour ouvrir les espaces JOBKIX.'}</p>{entries.length?<button type="button" onClick={()=>{setQuery('');setGroup('all')}}>Réinitialiser la recherche</button>:null}</section>:null}
 </div>;
}
