'use client'
import {useMemo,useState} from 'react'
import Link from 'next/link'
import {CheckCircle2,Copy,ExternalLink,FilePlus2,FileX2,History,Palette,RefreshCcw,Save,ShieldCheck,Trash2,Undo2,UploadCloud} from 'lucide-react'
import type {SanilaWorldState,SanilaWorldPageState,SanilaWorldTheme} from '../sanila-admin/types'
import {SANILA_DEFAULT_THEME_KEY,SANILA_LOCKED_ROUTES} from './world-engine'
import {SanilaWorldImportLab} from './SanilaWorldImportLab'
import styles from '../sanila-admin/sanila-admin.module.css'

type Props={section:string;initialWorld:SanilaWorldState;onChange?:(state:SanilaWorldState)=>void}
const root='/angelcare-marketplace/fr/sanila'
const visible=(p:SanilaWorldPageState)=>Boolean(p.publishedData)&&!p.deletedAt
const trim=(x:string)=>x.trim()
export function SanilaWorldOperator({section,initialWorld,onChange}:Props){
 const [world,setWorld]=useState(initialWorld),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [slug,setSlug]=useState(''),[title,setTitle]=useState(''),[selected,setSelected]=useState('accueil')
 const [themeKey,setThemeKey]=useState(''),[themeName,setThemeName]=useState('')
 const [color,setColor]=useState('#9b7133'),[paper,setPaper]=useState('#ffffff'),[ink,setInk]=useState('#10243f'),[soft,setSoft]=useState('#edf3fb'),[layout,setLayout]=useState<SanilaWorldTheme['layout']>('editorial')
 const [navSlug,setNavSlug]=useState(''),[navLabel,setNavLabel]=useState('')
 const [seoTitle,setSeoTitle]=useState(''),[seoDescription,setSeoDescription]=useState(''),[noindex,setNoindex]=useState(false)
 const pages=useMemo(()=>Object.values(world.pages).sort((a,b)=>a.slug.localeCompare(b.slug)),[world])
 const themes=Object.values(world.themes||{})
 const target=world.pages[selected]
 const active=world.themeKey||SANILA_DEFAULT_THEME_KEY
 async function action(action:string,payload:Record<string,unknown>={}){
  setBusy(true);setError('');setNotice('')
  try{
   const response=await fetch('/api/angelcare-marketplace/admin/sanila/world',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,payload,expectedRevision:world.revision})})
   const body=await response.json()
   if(!response.ok||!body.ok)throw new Error(body.error||'Opération impossible.')
   const next=body.state as SanilaWorldState
   setWorld(next);onChange?.(next);setNotice('Enregistré · Révision '+next.revision)
   return next
  }catch(e){setError(e instanceof Error?e.message:'Échec de l’opération.');return null}
  finally{setBusy(false)}
 }
 async function refresh(){
  setBusy(true)
  try{const r=await fetch('/api/angelcare-marketplace/admin/sanila/world',{cache:'no-store'});const b=await r.json();if(!r.ok||!b.ok)throw new Error(b.error||'Erreur chargement');setWorld(b.state);onChange?.(b.state);setNotice('Données rechargées')}catch(e){setError(String(e))}finally{setBusy(false)}
 }
 const act=(a:string,p:Record<string,unknown>={})=>void action(a,p)
 const select=(key:string)=>{setSelected(key);const p=world.pages[key];setSeoTitle(p?.seo?.title||p?.title||'');setSeoDescription(p?.seo?.description||'');setNoindex(Boolean(p?.seo?.noindex))}
 const themeFields=(t:SanilaWorldTheme)=>({key:themeKey||t.key,name:themeName||t.name,layout,colors:{paper,ink,accent:color,soft}})
 return <div className={styles.root}>
  <section className={styles.panel}>
   <div className={styles.sectionHead}><div><span>SANILA PUBLIC WORLD · CONTROL PLANE</span><h2>{section==='pages'?'Pages & routes':section==='themes'?'Bibliothèque des thèmes':section==='navigation'?'Navigation dynamique':section==='seo'?'Référencement':section==='publication'?'Publication & restauration':section==='shell'?'Shell & visibilité':'Import de pages et de thèmes'}</h2></div><button className={styles.primaryButton} disabled={busy} type="button" onClick={()=>void refresh()}><RefreshCcw size={16}/> Actualiser</button></div>
   <p>Révision {world.revision} · {pages.filter(p=>p.isCustom).length} pages personnalisées · {themes.length} thèmes. Brouillons isolés du public jusqu'à publication explicite.</p>
   {error?<p role="alert" style={{color:'#a22b37',padding:14,background:'#fff1f2'}}>{error}</p>:null}
   {notice?<p role="status" style={{color:'#17654e',padding:14,background:'#eaf8f0'}}><CheckCircle2 size={16}/> {notice}</p>:null}
  </section>
  {section==='public-world'?<SanilaWorldImportLab onBundle={async(bundle,name,fingerprint)=>{const result=await action('import_bundle',{bundle,packageName:name,fingerprint});if(!result)throw new Error('Enregistrement du package SANILA refusé.')}}/>:null}
  {section==='pages'||section==='public-world'?<>
   <section className={styles.panel}>
    <div className={styles.sectionHead}><div><span>PAGE FACTORY</span><h2>Créer une vraie route publique</h2></div><FilePlus2/></div>
    <div className={styles.actions}><input aria-label="Slug de page" placeholder="nouvelle-page" value={slug} onChange={e=>setSlug(e.target.value)}/><input aria-label="Titre" placeholder="Titre de la page" value={title} onChange={e=>setTitle(e.target.value)}/><button type="button" className={styles.primaryButton} disabled={busy||!slug||!title} onClick={()=>void action('create_page',{slug:trim(slug),title:trim(title)}).then(result=>{if(result){select(trim(slug));setSlug('');setTitle('')}})}>Créer la page</button></div>
   </section>
   <section className={styles.panel}><div className={styles.sectionHead}><div><span>PAGE REGISTRY</span><h2>Pages SANILA et opérations</h2></div></div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Page / slug</th><th>État</th><th>Protection</th><th>Opérations</th></tr></thead><tbody>{pages.map(p=><tr key={p.slug}><td><strong>{p.title}</strong><div><code>{p.slug}</code></div></td><td>{p.deletedAt?'Corbeille':p.status}</td><td>{!p.isCustom||SANILA_LOCKED_ROUTES.has(p.slug)?'Système':'Personnalisable'}</td><td><div className={styles.actions}><Link href={'/angelcare-marketplace/admin/sanila/studio?route='+encodeURIComponent(p.slug)}>Éditer</Link>{visible(p)?<Link target="_blank" href={root+(p.slug==='accueil'?'':'/'+p.slug)}><ExternalLink size={14}/> Public</Link>:null}<button disabled={busy} type="button" onClick={()=>{const name=window.prompt('Slug pour la copie de '+p.slug);if(name)act('duplicate_page',{sourceSlug:p.slug,slug:name,title:p.title+' — copie'})}}><Copy size={14}/> Dupliquer</button>{p.deletedAt?<button disabled={busy} type="button" onClick={()=>act('restore_page',{slug:p.slug})}><Undo2 size={14}/> Restaurer</button>:p.isCustom&&!SANILA_LOCKED_ROUTES.has(p.slug)?<button disabled={busy} type="button" onClick={()=>{if(window.confirm('Déplacer '+p.slug+' vers la corbeille ?'))act('trash_page',{slug:p.slug})}}><Trash2 size={14}/> Supprimer</button>:null}</div></td></tr>)}</tbody></table></div>
   </section>
  </>:null}
  {section==='themes'?<>
   <section className={styles.panel}><div className={styles.sectionHead}><div><span>THÈME GLOBAL</span><h2>Architecture active en brouillon</h2></div><Palette/></div><div className={styles.actions}><select value={active} onChange={e=>act('set_theme',{key:e.target.value})} disabled={busy} aria-label="Thème par défaut">{themes.filter(t=>!t.archivedAt).map(t=><option key={t.key} value={t.key}>{t.name} · {t.layout}</option>)}</select></div></section>
   <section className={styles.panel}><div className={styles.sectionHead}><div><span>THEME FACTORY</span><h2>Dupliquer, éditer et activer</h2></div></div><div className={styles.actions}><input value={themeKey} placeholder="theme-personnalise" aria-label="Identifiant thème" onChange={e=>setThemeKey(e.target.value)}/><input value={themeName} placeholder="Nom du thème" aria-label="Nom thème" onChange={e=>setThemeName(e.target.value)}/><select value={layout} aria-label="Composition" onChange={e=>setLayout(e.target.value as SanilaWorldTheme['layout'])}>{['editorial','bento','institutional','panorama','minimal','kinetic'].map(v=><option value={v} key={v}>{v}</option>)}</select><label>Papier <input type="color" aria-label="Couleur fond" value={paper} onChange={e=>setPaper(e.target.value)}/></label>
     <label>Texte <input type="color" aria-label="Couleur texte" value={ink} onChange={e=>setInk(e.target.value)}/></label>
     <label>Accent <input type="color" aria-label="Couleur accent" value={color} onChange={e=>setColor(e.target.value)}/></label>
     <label>Surface <input type="color" aria-label="Couleur secondaire" value={soft} onChange={e=>setSoft(e.target.value)}/></label><button disabled={busy||!themeKey||!themeName} type="button" className={styles.primaryButton} onClick={()=>act('upsert_theme',{theme:themeFields(world.themes?.[active]||themes[0])})}>Créer / enregistrer</button></div>
    <div className={styles.grid3}>{themes.map(t=><article className={styles.card} key={t.key} style={{background:t.colors.paper,color:t.colors.ink,borderTop:'5px solid '+t.colors.accent,opacity:t.archivedAt?0.6:1}}><span>{t.system?'SYSTÈME':'PERSONNALISÉ'} · {t.layout}</span><strong>{t.name}</strong><small>{t.key}</small><div className={styles.actions}><button disabled={busy||Boolean(t.archivedAt)} type="button" onClick={()=>act('set_theme',{key:t.key})}>Sélectionner</button><button disabled={busy} type="button" onClick={()=>{setThemeKey(t.system?'':t.key);setThemeName(t.name);setLayout(t.layout);setColor(t.colors.accent);setPaper(t.colors.paper);setInk(t.colors.ink);setSoft(t.colors.soft)}}>Modifier</button><button disabled={busy} type="button" onClick={()=>{const k=window.prompt('Nouvel identifiant du thème');if(k)act('duplicate_theme',{sourceKey:t.key,key:k,name:t.name+' — copie'})}}>Dupliquer</button>{!t.system?<button disabled={busy} type="button" onClick={()=>act(t.archivedAt?'restore_theme':'trash_theme',{key:t.key})}>{t.archivedAt?'Restaurer':'Archiver'}</button>:null}</div></article>)}</div>
   </section>
  </>:null}
  {section==='navigation'?<section className={styles.panel}><div className={styles.sectionHead}><div><span>NAVIGATION</span><h2>Liens supplémentaires du header public</h2></div></div><div className={styles.actions}><select aria-label="Page à ajouter" value={navSlug} onChange={e=>setNavSlug(e.target.value)}><option value="">Choisir une page</option>{pages.filter(p=>!p.deletedAt).map(p=><option key={p.slug} value={p.slug}>{p.title}</option>)}</select><input value={navLabel} aria-label="Texte du lien" placeholder="Libellé du lien" onChange={e=>setNavLabel(e.target.value)}/><button disabled={busy||!navSlug} className={styles.primaryButton} type="button" onClick={()=>act('set_navigation',{navigation:[...(world.navigation||[]).filter(n=>n.slug!==navSlug),{slug:navSlug,label:navLabel||world.pages[navSlug]?.nav||navSlug}]})}>Ajouter / actualiser</button></div>{(world.navigation||[]).map(n=><div className={styles.healthItem} key={n.slug}><strong>{n.label}</strong><span>{n.slug}</span><button disabled={busy} onClick={()=>act('set_navigation',{navigation:(world.navigation||[]).filter(x=>x.slug!==n.slug)})}>Retirer</button></div>)}</section>:null}
  {section==='seo'?<section className={styles.panel}><div className={styles.sectionHead}><div><span>SEO PAR PAGE</span><h2>Indexation et métadonnées</h2></div></div><div className={styles.actions}><select aria-label="Page SEO" value={selected} onChange={e=>select(e.target.value)}>{pages.filter(p=>!p.deletedAt).map(p=><option key={p.slug} value={p.slug}>{p.nav}</option>)}</select></div><div style={{display:'grid',gap:12,maxWidth:740,marginTop:15}}><input aria-label="Titre SEO" value={seoTitle} placeholder="Titre SEO" onChange={e=>setSeoTitle(e.target.value)}/><textarea aria-label="Description SEO" value={seoDescription} placeholder="Description SEO" onChange={e=>setSeoDescription(e.target.value)}/><label><input type="checkbox" checked={noindex} onChange={e=>setNoindex(e.target.checked)}/> Exclure des moteurs de recherche</label><button disabled={busy||!target} className={styles.primaryButton} type="button" onClick={()=>act('edit_page',{slug:selected,seo:{title:seoTitle,description:seoDescription,noindex}})}><Save size={14}/> Enregistrer les métadonnées</button></div></section>:null}
  {section==='shell'?<section className={styles.panel}><div className={styles.sectionHead}><div><span>SHELL PARTAGÉ</span><h2>Visibilité du header, footer et navigation</h2></div><ShieldCheck/></div>{(['header','footer','navigation'] as const).map(k=><label className={styles.healthItem} key={k}><strong>{k}</strong><input type="checkbox" checked={world.shell[k]} disabled={busy} onChange={e=>act('set_shell',{shell:{...world.shell,[k]:e.target.checked}})}/></label>)}<p>Les formulaires métier et l’authentification SANILA restent sous leur autorité d’origine.</p></section>:null}
  {section==='publication'?<section className={styles.panel}><div className={styles.sectionHead}><div><span>PUBLICATION · ATOMIQUE</span><h2>Brouillons, historique et rollback</h2></div><History/></div><p>Dernière publication : {world.publishedAt||'Aucune'} · révision {world.revision}</p><p>Les nouveaux documents ne deviennent visibles qu'après une publication explicite. Les 29 pages source restent disponibles comme fallback.</p><div className={styles.actions}><button type="button" className={styles.primaryButton} disabled={busy} onClick={()=>{if(window.confirm('Publier toutes les pages SANILA validées ?'))act('publish')}}><UploadCloud size={16}/> Publier les changements</button></div><h3>Révisions disponibles</h3>{(world.releases||[]).map(release=><div className={styles.healthItem} key={release.revision}><strong>Révision {release.revision}</strong><span>{release.publishedAt}</span><button disabled={busy} onClick={()=>{if(window.confirm('Restaurer la révision '+release.revision+' ?'))act('rollback',{revision:release.revision})}}><Undo2 size={15}/> Rollback</button></div>)}</section>:null}
 </div>
}
