'use client'
import type { ReactNode } from 'react'
import styles from './catalogue-composer.module.css'

export function Chip({active,onClick,children,disabled=false}:{active:boolean;onClick:()=>void;children:ReactNode;disabled?:boolean;key?:string}){
  return <button type="button" className={`${styles.chip} ${active?styles.chipActive:''}`} onClick={onClick} disabled={disabled}>{children}</button>
}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <label className={styles.field}><span>{label}</span>{children}{hint?<small>{hint}</small>:null}</label>}
export function money(value:number|null|undefined){return value==null?'Non configuré':`${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(value)} Dh`}
export function sourceLabel(mode:'database'|'catalogue_seed'){return mode==='database'?'Catalogue local en base':'Référentiel catalogue embarqué'}
