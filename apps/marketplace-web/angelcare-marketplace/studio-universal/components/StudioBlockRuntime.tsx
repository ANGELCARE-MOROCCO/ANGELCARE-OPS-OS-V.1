'use client'

import type { StudioBlockProps, StudioPickerData } from '../types'
import { StudioInteractiveRuntime } from './StudioInteractiveRuntime'
import { StudioControlledIsland } from './StudioControlledIsland'
import styles from './studio-runtime.module.css'

const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : value == null ? fallback : String(value)
const rows = (value: unknown) => Array.isArray(value) ? value.filter(row => row && typeof row === 'object') as Array<Record<string, unknown>> : []

function mediaUrl(props: StudioBlockProps, pickers: StudioPickerData) {
  if (props.mediaAssetKey) return pickers.media.find(row => row.assetKey === props.mediaAssetKey)?.publicUrl || text(props.mediaUrl)
  return text(props.mediaUrl)
}

export function StudioBlockRuntime({ type, props, pickers }: { type: string; props: StudioBlockProps; pickers: StudioPickerData }) {
  const title = text(props.title)
  const lead = text(props.lead)
  const body = text(props.body)
  const items = rows(props.items)
  if (type === 'studio_divider') return <div className={styles.divider} />
  if (type === 'studio_spacer') return <div className={styles.spacer} style={{ ['--ac-spacer' as string]: `${Math.max(0, Math.min(300, Number(props.height || 40)))}px` }} />
  if (type === 'studio_island') return <StudioControlledIsland props={props}/>
  if (type === 'studio_image') {
    const src = mediaUrl(props, pickers)
    return src ? <img className={styles.media} src={src} alt={text(props.mediaAlt)} /> : <div className={styles.block}>Sélectionnez un média depuis le Vault.</div>
  }
  if (type === 'studio_button') return <div className={styles.actions}><a href={text(props.primaryCtaHref) || '#'}>{text(props.primaryCtaLabel, 'Action')}</a></div>
  if (['studio_tabs','studio_dialog','studio_carousel','studio_menu','studio_form'].includes(type)) return <StudioInteractiveRuntime type={type} props={props}/>
  if (type === 'studio_accordion' || type === 'faq') return <section className={`${styles.block} ${styles.interactive}`}><span className={styles.eyebrow}>{text(props.eyebrow, 'FAQ')}</span><h2 className={styles.title}>{title}</h2>{items.map((item,index)=><details key={index}><summary>{text(item.title, text(item.label, `Question ${index+1}`))}</summary><p>{text(item.body, text(item.description))}</p></details>)}</section>
  const tone = ['hero','split_hero','video_hero'].includes(type) ? 'hero' : 'default'
  const src = mediaUrl(props, pickers)
  return <section className={styles.block} data-tone={tone}>
    {props.eyebrow ? <span className={styles.eyebrow}>{text(props.eyebrow)}</span> : null}
    {title ? <h2 className={styles.title}>{title}</h2> : null}
    {lead ? <p className={styles.lead}>{lead}</p> : null}
    {body ? <div className={styles.body}>{body}</div> : null}
    {src ? <img className={styles.media} src={src} alt={text(props.mediaAlt, title)} /> : null}
    {items.length ? <div className={styles.items}>{items.map((item,index)=><article className={styles.item} key={index}><strong>{text(item.title,text(item.label,`Élément ${index+1}`))}</strong><p>{text(item.body,text(item.description,text(item.value)))}</p></article>)}</div> : null}
    {props.collectionKey ? <div className={styles.lead}>Collection liée : {text(props.collectionKey)}</div> : null}
    {props.categoryKey ? <div className={styles.lead}>Catégorie liée : {text(props.categoryKey)}</div> : null}
    {(props.primaryCtaLabel || props.secondaryCtaLabel) ? <div className={styles.actions}>{props.primaryCtaLabel ? <a href={text(props.primaryCtaHref) || '#'}>{text(props.primaryCtaLabel)}</a> : null}{props.secondaryCtaLabel ? <a href={text(props.secondaryCtaHref) || '#'}>{text(props.secondaryCtaLabel)}</a> : null}</div> : null}
  </section>
}
