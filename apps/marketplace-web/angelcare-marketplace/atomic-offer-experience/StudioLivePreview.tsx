'use client'
import { useEffect, useRef, useState } from 'react'
import type { ComponentData } from '@puckeditor/core'
import type { PublicExperience360 } from '../public-experience-authority/types'
import {ServiceCommerceExperience} from '../service-commerce-experience/ServiceCommerceExperience'
import {buildServiceView,isServiceCommerceRoot} from '../service-commerce-experience/model'
import {AcademyCommerceExperience} from '../academy-commerce-experience/AcademyCommerceExperience'
import {buildAcademyView,isAcademyCommerceRoot} from '../academy-commerce-experience/model'
import {B2BCommerceExperience} from '../b2b-commerce-experience/B2BCommerceExperience'
import {buildB2BView,isB2BCommerceRoot} from '../b2b-commerce-experience/model'
import {ProductCommerceExperience} from '../product-commerce-experience/ProductCommerceExperience'
import {buildProductView} from '../product-commerce-experience/model'
import type {PublicExperienceTruthReport} from '../public-experience-authority/types'
import { AtomicDocumentPreview } from './AtomicExperience'
import { ATOMIC_ROOTS, sectionVisibility, sectionsFrom, localeText, record, type AtomicLocale } from './model'
import styles from './atomic.module.css'

/** Admin-only read endpoint; preview cannot write baskets, favourites or transactions. */
export function AtomicStudioLivePreview({component,locale,children}:{component:ComponentData;locale:AtomicLocale;children:React.ReactNode}){
  const [slug,setSlug]=useState(''),[data,setData]=useState<PublicExperience360|null>(null),[truth,setTruth]=useState<PublicExperienceTruthReport|undefined>(undefined),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const request=useRef<AbortController|null>(null),generation=useRef(0)
  useEffect(()=>{generation.current++;request.current?.abort();setBusy(false);setData(null);setTruth(undefined);setError('');return()=>{generation.current++;request.current?.abort()}},[locale,component.type])
  async function load(event:React.FormEvent){
    event.preventDefault();if(busy||!slug.trim())return;setBusy(true);setError('');const controller=new AbortController(),at=generation.current;request.current?.abort();request.current=controller;const timer=setTimeout(()=>controller.abort('timeout'),45000)
    try{
      const response=await fetch(`/api/angelcare-marketplace/admin/public-experience-authority/resolve/${encodeURIComponent(slug.trim())}?locale=${locale}`,{signal:controller.signal,cache:'no-store'})
      const payload=await response.json(),source=payload?.data?.trace?.experience360 as PublicExperience360|undefined
      if(!response.ok||!source?.identity?.id)throw Error('Impossible de charger cette offre publiée. Vérifiez le slug et votre accès administrateur.')
      if(source.classification.masterDomain!==ATOMIC_ROOTS[component.type])throw Error('Cette offre appartient à un autre domaine atomique. Choisissez une offre compatible avec ce thème.')
      if(at!==generation.current||controller.signal.aborted)return
      setData(source);setTruth(payload?.data?.trace?.truth)
    }catch(e){if(at===generation.current&&(!controller.signal.aborted||controller.signal.reason==='timeout'))setError(controller.signal.reason==='timeout'?'Lecture trop longue. Réessayez ; votre composition est conservée.':e instanceof Error?e.message:'Chargement impossible. La composition reste intacte.')}
    finally{clearTimeout(timer);if(at===generation.current)setBusy(false)}
  }
  const sections=sectionsFrom(record(component.props).content)
  return <div><form className={styles.editorNotice} onSubmit={e=>void load(e)}><label>Prévisualisation avec une offre publiée · slug <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="slug-de-votre-offre"/></label><button type="submit" disabled={busy||!slug.trim()}>{busy?'Chargement…':'Afficher les données réelles'}</button><p>Aucun achat, favori ou demande n’est envoyé depuis cet aperçu.</p>{error?<p role="alert">{error}</p>:null}</form>{data?<><details className={styles.editorNotice}><summary>Inspecteur des composants · présence et conditions</summary><table><thead><tr><th>Composant</th><th>Source</th><th>État</th><th>Raison</th></tr></thead><tbody>{sections.map(s=>{const v=sectionVisibility(data,s);return <tr key={s.id}><td>{localeText(s.title,locale)||s.role}</td><td>{s.bindingKey||s.fieldKeys||s.fieldSections||s.role}</td><td>{v.visible?'Visible':'Masqué'}</td><td>{v.reason}</td></tr>})}</tbody></table></details>{component.type==='ac_product_world'&&(component.props.productCommerceRevision===1||component.props.id==='neutral-product-world-r4'&&component.props.neutralExperienceRevision===4&&component.props.productCommerceRevision!==0)?<ProductCommerceExperience view={buildProductView(data,truth,component.props)} previewOnly/>:component.type==='ac_service_world'&&isServiceCommerceRoot(component.props)?<ServiceCommerceExperience view={buildServiceView(data,truth,component.props)} previewOnly/>:component.type==='ac_academy_world'&&isAcademyCommerceRoot(component.props)?<AcademyCommerceExperience view={buildAcademyView(data,truth,component.props)} previewOnly/>:component.type==='ac_b2b_world'&&isB2BCommerceRoot(component.props)?<B2BCommerceExperience view={buildB2BView(data,truth,component.props)} previewOnly/>:<AtomicDocumentPreview component={component} data={data} locale={locale} previewOnly/>}</>:children}</div>
}
