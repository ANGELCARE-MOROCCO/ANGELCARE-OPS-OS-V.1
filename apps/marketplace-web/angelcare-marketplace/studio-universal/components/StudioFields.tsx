'use client'

import type { StudioPickerData } from '../types'
import styles from './studio-workspace.module.css'

export function MediaField({pickers,value,onChange}:{pickers:StudioPickerData;value:string;onChange:(value:string)=>void}){
  const selected=pickers.media.find(row=>row.assetKey===value)
  return <div className={styles.pickerField}>{selected?.publicUrl?<img src={selected.publicUrl} alt={selected.fileName}/>:null}<select value={value||''} onChange={event=>onChange(event.target.value)}><option value="">Aucun média</option>{pickers.media.map(asset=><option value={asset.assetKey} key={asset.id}>{asset.fileName} · {asset.width||'?'}×{asset.height||'?'}</option>)}</select></div>
}
export function RecordField({label,rows,value,onChange}:{label:string;rows:StudioPickerData['categories'];value:string;onChange:(value:string)=>void}){return <select aria-label={label} value={value||''} onChange={event=>onChange(event.target.value)}><option value="">Aucune sélection</option>{rows.map(row=><option value={row.key} key={row.id}>{row.label}</option>)}</select>}
