import { Box, CheckCircle2, Languages, Ruler, Shapes, Sparkles } from 'lucide-react'
import type { CategoryNativeFieldValue } from '../types'
import styles from '../experience.module.css'
const icons=[Sparkles,Ruler,Languages,Box,Shapes,CheckCircle2]
export function ExperienceFieldMatrix({values,limit=12}:{values:CategoryNativeFieldValue[];limit?:number}){const visible=values.filter((entry)=>entry.formatted!=='—').slice(0,limit);return <div className={styles.specGrid}>{visible.map((entry,index)=>{const Icon=icons[index%icons.length];return <article className={styles.specCard} key={entry.field.field_key}><Icon size={21}/><span>{entry.field.label_fr}</span><strong>{entry.formatted}</strong></article>})}</div>}
