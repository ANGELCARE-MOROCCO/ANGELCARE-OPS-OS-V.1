'use client'
import type { ReactNode } from 'react'
import styles from './catalogue-composer.module.css'
export { money, sourceLabel } from '@/lib/flashcards-os/catalogue-composer/presentation'
export function Chip({active,onClick,children,disabled=false}:{active:boolean;onClick:()=>void;children:ReactNode;disabled?:boolean;key?:string}){
  return <button type="button" className={`${styles.chip} ${active?styles.chipActive:''}`} onClick={onClick} disabled={disabled}>{children}</button>
}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <label className={styles.field}><span>{label}</span>{children}{hint?<small>{hint}</small>:null}</label>}
