import type { ReactNode } from 'react'
import type { StudioBlockProps, StudioPickerData } from '../types'
import { isStudioSourceReference } from '@/angelcare-marketplace/studio-picker/reference'
import type { StudioVisualExperienceDefinition } from '../visual-catalogue'
import type { StudioResolvedAction } from '@/angelcare-marketplace/studio-action-registry/types'
import { StudioActionLink } from '@/angelcare-marketplace/studio-action-registry/components/StudioActionLink'
import { StudioWorkflowForm } from '@/angelcare-marketplace/studio-workflows/components/StudioWorkflowForm'
import styles from './studio-visual-catalogue.module.css'

const text=(value:unknown)=>value==null?'':String(value).trim()
const list=(value:unknown)=>Array.isArray(value)?value.filter((row):row is Record<string,unknown>=>Boolean(row)&&typeof row==='object'&&!Array.isArray(row)):[]
const safeHref=(value:unknown)=>{const href=text(value);if(!href)return '';if(/^(?:javascript|data|vbscript):/i.test(href))return '';return href}
const itemTitle=(row:Record<string,unknown>,index:number)=>text(row.title)||text(row.label)||`Étape ${index+1}`
const itemBody=(row:Record<string,unknown>)=>text(row.body)||text(row.description)||text(row.value)

function mediaSource(props:StudioBlockProps,pickers:StudioPickerData){
  const mediaAssetKey=props.mediaAssetKey
  if(mediaAssetKey){const match=isStudioSourceReference(mediaAssetKey)?pickers.media.find(row=>row.id===mediaAssetKey.entityId):pickers.media.find(row=>row.assetKey===mediaAssetKey);if(match?.publicUrl)return match.publicUrl}
  return safeHref(props.mediaUrl)
}

function Actions({props}:{props:StudioBlockProps}){
  const primary=props.primaryCtaLabel?(props.primaryAction?<StudioActionLink className={styles.primary} action={props.__studioResolvedPrimaryAction} attribution={props.__studioAttribution} interactionId="primary">{text(props.primaryCtaLabel)}</StudioActionLink>:safeHref(props.primaryCtaHref)?<a className={styles.primary} href={safeHref(props.primaryCtaHref)}>{text(props.primaryCtaLabel)}</a>:null):null
  const secondary=props.secondaryCtaLabel?(props.secondaryAction?<StudioActionLink className={styles.secondary} action={props.__studioResolvedSecondaryAction} attribution={props.__studioAttribution} interactionId="secondary">{text(props.secondaryCtaLabel)}</StudioActionLink>:safeHref(props.secondaryCtaHref)?<a className={styles.secondary} href={safeHref(props.secondaryCtaHref)}>{text(props.secondaryCtaLabel)}</a>:null):null
  return primary||secondary?<div className={styles.actions}>{primary}{secondary}</div>:null
}

function EmptyPreview({kind}:{kind:'cards'|'timeline'|'media'|'form'}){
  if(kind==='media')return <div className={styles.emptyMedia} aria-hidden="true"><span/><span/><b>MEDIA VAULT</b></div>
  if(kind==='form')return <div className={styles.emptyForm} aria-hidden="true"><span/><span/><span/><button type="button" tabIndex={-1}>Workflow AngelCare</button></div>
  const count=kind==='timeline'?4:3
  return <div className={kind==='timeline'?styles.emptyTimeline:styles.emptyCards} aria-hidden="true">{Array.from({length:count},(_,index)=><i key={index}><b>{String(index+1).padStart(2,'0')}</b><span/><span/></i>)}</div>
}

function Heading({definition,props}:{definition:StudioVisualExperienceDefinition;props:StudioBlockProps}){
  return <div className={styles.heading}>
    <span className={styles.eyebrow}>{text(props.eyebrow)||definition.categoryTitle}</span>
    {props.title?<h2>{text(props.title)}</h2>:null}
    {props.lead?<p>{text(props.lead)}</p>:null}
  </div>
}

function Cards({items,props}:{items:Array<Record<string,unknown>>;props:StudioBlockProps}){
  return <div className={styles.cards}>{items.map((row,index)=>{const resolved=row.__studioResolvedAction as StudioResolvedAction|undefined;const action=row.action;return <article key={`${itemTitle(row,index)}-${index}`}><span>{String(index+1).padStart(2,'0')}</span><strong>{itemTitle(row,index)}</strong>{itemBody(row)?<p>{itemBody(row)}</p>:null}{action?<StudioActionLink action={resolved} attribution={props.__studioAttribution} interactionId={`item:${index}`}>Découvrir <b aria-hidden="true">→</b></StudioActionLink>:safeHref(row.href)?<a href={safeHref(row.href)}>Découvrir <b aria-hidden="true">→</b></a>:null}</article>})}</div>
}

export function StudioVisualCatalogueRuntime({definition,props,pickers,editorMode=false,children,locale='fr'}:{definition:StudioVisualExperienceDefinition;props:StudioBlockProps;pickers:StudioPickerData;editorMode?:boolean;children?:ReactNode;locale?:'fr'|'en'|'ar'}){
  const items=list(props.items),media=mediaSource(props,pickers),family=definition.family
  const rootProps={className:styles.root,'data-family':family,'data-variant':definition.variant,'data-alias':definition.key}

  if(family==='hero')return <section {...rootProps}>
    <div className={styles.heroGlow}/><div className={styles.heroGrid}>
      <div className={styles.heroCopy}><div className={styles.brandLine}><img src="/brand/angelcare-official.webp" alt="AngelCare"/><span>{definition.categoryTitle}</span></div><Heading definition={definition} props={props}/>{props.body?<p className={styles.body}>{text(props.body)}</p>:null}<Actions props={props}/><div className={styles.heroProof}><span>Familles</span><span>Professionnels</span><span>Institutions</span></div></div>
      <div className={styles.heroVisual}>{media?<img src={media} alt={text(props.mediaAlt)||text(props.title)||'AngelCare'}/>:editorMode?<EmptyPreview kind="media"/>:<div className={styles.brandCanvas}><img src="/brand/angelcare-official.webp" alt="AngelCare"/></div>}<div className={styles.floatingCard}><span>ANGELCARE</span><strong>{definition.label}</strong><small>Service · accompagnement · confiance</small></div></div>
    </div>
  </section>

  if(family==='discovery')return <section {...rootProps}><div className={styles.sectionTop}><Heading definition={definition} props={props}/><span className={styles.indexBadge}>{definition.variant.replace('v','').padStart(2,'0')}</span></div>{items.length?<Cards items={items} props={props}/>:editorMode?<EmptyPreview kind="cards"/>:null}<Actions props={props}/></section>

  if(family==='commerce')return <section {...rootProps}><div className={styles.commerceHead}><Heading definition={definition} props={props}/><div className={styles.commerceTag}>Sélection Marketplace</div></div>{children|| (editorMode?<EmptyPreview kind="cards"/>:null)}<Actions props={props}/></section>

  if(family==='campaign')return <section {...rootProps}><div className={styles.campaignGrid}><div><span className={styles.campaignPill}>MOMENT ANGELCARE</span><Heading definition={definition} props={props}/>{props.body?<p className={styles.body}>{text(props.body)}</p>:null}<Actions props={props}/></div><div className={styles.campaignArt}>{media?<img src={media} alt={text(props.mediaAlt)||text(props.title)}/>:<div className={styles.campaignMonogram}><span>AC</span><small>{definition.variant.toUpperCase()}</small></div>}</div></div></section>

  if(family==='journey')return <section {...rootProps}><Heading definition={definition} props={props}/>{items.length?<div className={styles.timeline}>{items.map((row,index)=><article key={`${itemTitle(row,index)}-${index}`}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{itemTitle(row,index)}</strong>{itemBody(row)?<p>{itemBody(row)}</p>:null}</div></article>)}</div>:editorMode?<EmptyPreview kind="timeline"/>:null}<Actions props={props}/></section>

  if(family==='trust')return <section {...rootProps}><div className={styles.trustTop}><div className={styles.shield} aria-hidden="true">✓</div><Heading definition={definition} props={props}/></div>{items.length?<div className={styles.proofs}>{items.map((row,index)=><article key={`${itemTitle(row,index)}-${index}`}><span>0{index+1}</span><strong>{itemTitle(row,index)}</strong>{itemBody(row)?<p>{itemBody(row)}</p>:null}</article>)}</div>:editorMode?<EmptyPreview kind="cards"/>:null}<Actions props={props}/></section>

  if(family==='editorial')return <section {...rootProps}><div className={styles.editorialGrid}><div><Heading definition={definition} props={props}/>{props.body?<div className={styles.editorialBody}>{text(props.body)}</div>:null}<Actions props={props}/></div><div>{media?<img className={styles.editorialMedia} src={media} alt={text(props.mediaAlt)||text(props.title)}/>:editorMode?<EmptyPreview kind="media"/>:null}{items.length?<Cards items={items} props={props}/>:null}</div></div></section>

  if(family==='ecosystem')return <section {...rootProps}><div className={styles.ecosystemHead}><img src="/brand/angelcare-official.webp" alt="AngelCare"/><Heading definition={definition} props={props}/></div>{items.length?<div className={styles.ecosystemGrid}>{items.map((row,index)=><article key={`${itemTitle(row,index)}-${index}`}><div className={styles.partnerMark}>{text(row.label).slice(0,2).toUpperCase()||'AC'}</div><strong>{itemTitle(row,index)}</strong>{itemBody(row)?<p>{itemBody(row)}</p>:null}</article>)}</div>:editorMode?<EmptyPreview kind="cards"/>:null}<Actions props={props}/></section>

  if(family==='conversion')return <section {...rootProps}><div className={styles.conversionGrid}><div><span className={styles.conversionKicker}>ACTION ANGELCARE</span><Heading definition={definition} props={props}/>{props.body?<p className={styles.body}>{text(props.body)}</p>:null}<Actions props={props}/></div><div className={styles.conversionPanel}>{props.__studioWorkflow&&(definition.canonicalType==='inquiry_form'||definition.canonicalType==='studio_form')?<StudioWorkflowForm reference={props.__studioWorkflow} title={text(props.title)||definition.label} lead={text(props.lead)||definition.description} locale={locale} editorMode={editorMode} attribution={props.__studioAttribution} interactionId="workflow"/>:items.length?<Cards items={items} props={props}/>:editorMode?<EmptyPreview kind="form"/>:<div className={styles.conversionBrand}><img src="/brand/angelcare-official.webp" alt="AngelCare"/></div>}</div></div></section>

  return <section {...rootProps}><div className={styles.navigationShell}><div className={styles.navBrand}><img src="/brand/angelcare-official.webp" alt="AngelCare"/><span>{definition.label}</span></div>{items.length?<nav aria-label={text(props.title)||definition.label}>{items.map((row,index)=>row.action?<StudioActionLink key={index} action={row.__studioResolvedAction as StudioResolvedAction|undefined} attribution={props.__studioAttribution} interactionId={`item:${index}`}>{itemTitle(row,index)}</StudioActionLink>:safeHref(row.href)?<a key={index} href={safeHref(row.href)}>{itemTitle(row,index)}</a>:<span key={index}>{itemTitle(row,index)}</span>)}</nav>:editorMode?<div className={styles.navPreview}><span/><span/><span/><span/></div>:null}<Actions props={props}/></div>{props.lead?<p className={styles.navigationLead}>{text(props.lead)}</p>:null}</section>
}
