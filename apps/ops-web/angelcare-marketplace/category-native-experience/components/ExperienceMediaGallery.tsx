'use client'
import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import type { CategoryNativeMedia } from '../types'
import styles from '../experience.module.css'

export function ExperienceMediaGallery({ media, name, reference }: { media: CategoryNativeMedia[]; name: string; reference: string }) {
  const [active, setActive] = useState(0)
  const selected = media[active]
  return <div className={styles.heroVisual}>
    <div className={styles.mediaProof}><span>{reference}</span><span>ANGELCARE EXPERIENCE</span></div>
    {selected ? <img src={selected.url} alt={selected.alt} /> : <div className={styles.mediaFallback}><ImageIcon size={58}/><span>VISUAL AUTHORITY</span><strong>{name}</strong></div>}
    {media.length > 1 ? <div className={styles.mediaRail}>{media.map((entry,index)=><button type="button" key={entry.id} data-active={index===active} onClick={()=>setActive(index)} aria-label={`Afficher ${entry.alt}`}><img src={entry.url} alt=""/></button>)}</div>:null}
  </div>
}
