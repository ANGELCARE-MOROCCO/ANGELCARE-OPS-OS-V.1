'use client'
import { useState } from 'react'
import type { ComponentData } from '@puckeditor/core'
import type { PublicExperience360 } from '../public-experience-authority/types'
import { AtomicDocumentPreview } from './AtomicExperience'
import { ATOMIC_ROOTS, sectionVisibility, sectionsFrom, localeText, record, type AtomicLocale } from './model'
import styles from './atomic.module.css'

/** Admin-only read endpoint; preview cannot write baskets, favourites or transactions. */
export function AtomicStudioLivePreview({component,locale,children}:{component:ComponentData;locale:AtomicLocale;children:React.ReactNode}){
  const [slug,setSlug]=useState(''),[data,setData]=useState<PublicExperience360|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
  async function load(event:React.FormEvent){
    event.preventDefault();if(busy||!slug.trim())return;setBusy(true);setError('')
    try{
      const response=await fetch(`/api/angelcare-marketplace/admin/public-experience-authority/resolve/${encodeURIComponent(slug.trim())}?locale=${locale}`)
      const payload=await response.json(),source=payload?.data?.trace?.experience360 as PublicExperience360|undefined
      if(!response.ok||!source?.identity?.id)throw Error('Impossible de charger cette offre publiée. Vérifiez le slug et votre accès administrateur.')
      if(source.classification.masterDomain!==ATOMIC_ROOTS[component.type])throw Error('Cette offre appartient à un autre domaine atomique. Choisissez une offre compatible avec ce thème.')
      setData(source)
    }catch(e){setError(e instanceof Error?e.message:'Chargement impossible. La composition reste intacte.')}
    finally{setBusy(false)}
  }
  const sections=sectionsFrom(record(component.props).content)
  return <div><form className={styles.editorNotice} onSubmit={e=>void load(e)}><label>Prévisualisation avec une offre publiée · slug <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="slug-de-votre-offre"/></label><button type="submit" disabled={busy||!slug.trim()}>{busy?'Chargement…':'Afficher les données réelles'}</button><p>Aucun achat, favori ou demande n’est envoyé depuis cet aperçu.</p>{error?<p role="alert">{error}</p>:null}</form>{data?<><details className={styles.editorNotice}><summary>Inspecteur des composants · présence et conditions</summary><table><thead><tr><th>Composant</th><th>Source</th><th>État</th><th>Raison</th></tr></thead><tbody>{sections.map(s=>{const v=sectionVisibility(data,s);return <tr key={s.id}><td>{localeText(s.title,locale)||s.role}</td><td>{s.bindingKey||s.fieldKeys||s.fieldSections||s.role}</td><td>{v.visible?'Visible':'Masqué'}</td><td>{v.reason}</td></tr>})}</tbody></table></details><AtomicDocumentPreview component={component} data={data} locale={locale} previewOnly/></>:children}</div>
}
