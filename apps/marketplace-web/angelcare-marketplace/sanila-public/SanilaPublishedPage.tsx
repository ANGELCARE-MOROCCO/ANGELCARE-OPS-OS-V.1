import Image from 'next/image'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import type { Data } from '@puckeditor/core'
import type { CSSProperties } from 'react'
import type { SanilaWorldTheme } from '../sanila-admin/types'
import { SANILA_DEFAULT_THEMES, SANILA_DEFAULT_THEME_KEY, validateSanilaDocument } from '../sanila-world/world-engine'
import styles from './SanilaPublished.module.css'

type Props={ data:Data; theme?:SanilaWorldTheme|null; eyebrow?:string }
function displayLink(href:unknown):string|null{
  const v=String(href||'')
  return v.startsWith('#')||(
    v.startsWith('/')&&!v.startsWith('//')&&!v.includes('..')&&!/[<>"'\\\r\n]/.test(v)&&
    (v.startsWith('/angelcare-marketplace/')||/^\/angelcare-360-[a-z-]+\//.test(v))
  )?v:null
}
export function SanilaPublishedPage({data,theme,eyebrow}:Props){
  const safe=validateSanilaDocument(data)
  const current=theme&&!theme.archivedAt?theme:SANILA_DEFAULT_THEMES[SANILA_DEFAULT_THEME_KEY]
  const palette={
    '--sanila-page-paper':current.colors.paper,
    '--sanila-page-ink':current.colors.ink,
    '--sanila-page-accent':current.colors.accent,
    '--sanila-page-soft':current.colors.soft,
  } as CSSProperties
  return <div className={styles.published} data-layout={current.layout} data-sanila-published="true" style={palette}>
    <div className={styles.identity}><span>SANILA / PUBLIC WORLD</span><small>{eyebrow||current.name}</small></div>
    {safe.content.map((block,index)=>{
      const p=block.props||{}
      const type=block.type
      const title=String(p.title||'')
      const body=String(p.body||'')
      const tone=String(p.tone||'white')
      const href=displayLink(p.href)
      const items=Array.isArray(p.items)?p.items as Array<{title?:string;body?:string}>:[]
      return <section key={String(p.id||index)} className={styles.section} data-block={type} data-tone={tone}>
        {type==='SanilaImage'?<figure className={styles.photo}>
          <Image src={String(p.src||'/sanila/sanila-operating-system-logo.png')} alt={String(p.alt||'Image SANILA')} fill sizes="(max-width: 780px) 100vw, 1200px" unoptimized/>
          {title?<figcaption>{title}</figcaption>:null}
        </figure>:<div className={styles.inner}>
          {p.eyebrow?<span className={styles.eyebrow}>{String(p.eyebrow)}</span>:null}
          {title?index===0||type==='SanilaHero'?<h1>{title}</h1>:<h2>{title}</h2>:null}
          {body?<p className={styles.body}>{body}</p>:null}
          {type==='SanilaFeatureGrid'?<div className={styles.features}>{items.map((x,i)=><article key={i}><b>{String(i+1).padStart(2,'0')}</b><h3>{x.title}</h3><p>{x.body}</p></article>)}</div>:null}
          {type==='SanilaProcess'?<ol className={styles.process}>{items.map((x,i)=><li key={i}><b>{String(i+1).padStart(2,'0')}</b><div><strong>{x.title}</strong><p>{x.body}</p></div></li>)}</ol>:null}
          {type==='SanilaProof'?<div className={styles.proof}><span>PREUVE / CONTEXTE ÉDITORIAL</span><p>Les affirmations doivent rester reliées à des sources vérifiables.</p></div>:null}
          {type==='SanilaWorkflowBridge'?<div className={styles.workflow}><span>WORKFLOW SANILA PROTÉGÉ</span><Link href={String(p.label)==='sanila.contact'?'/angelcare-marketplace/fr/sanila/contact':String(p.label)==='sanila.onboarding'?'/angelcare-marketplace/fr/sanila/creer-mon-etablissement':'/angelcare-marketplace/fr/sanila/demonstration'}>Accéder au formulaire officiel</Link></div>:null}
          {href&&p.label?<Link className={styles.cta} href={href}>{String(p.label)} <span aria-hidden="true">↗</span></Link>:null}
        </div>}
      </section>
    })}
  </div>
}
