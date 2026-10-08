'use client'

import { createUsePuck, useGetPuck, type ComponentData } from '@puckeditor/core'
import { ClipboardPaste, Copy, CopyPlus, MoreHorizontal, Redo2, Trash2, Undo2, ChevronsDown, ChevronsUp } from 'lucide-react'
import { useCallback, useState } from 'react'
import styles from './studio-workspace.module.css'

const useStudioPuck=createUsePuck()
let clipboard:ComponentData|null=null
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T
const id=(type:string)=>`${type.replace(/[^a-z0-9_-]/gi,'-')}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`
function rekey(source:ComponentData){const copy=clone(source) as any;const ids=new Map<string,string>();const collect=(v:any)=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(collect);return}if(v.props&&typeof v.props.id==='string')ids.set(v.props.id,id(String(v.type||'block')));Object.values(v).forEach(collect)};const rewrite=(v:any)=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(rewrite);return}if(v.props&&typeof v.props.id==='string'&&ids.has(v.props.id))v.props.id=ids.get(v.props.id);Object.values(v).forEach(rewrite)};collect(copy);rewrite(copy);return copy as ComponentData}

export function PuckOperatorTools(){
 const getPuck=useGetPuck();const selected=useStudioPuck(api=>api.selectedItem);const hasPast=useStudioPuck(api=>api.history.hasPast);const hasFuture=useStudioPuck(api=>api.history.hasFuture);const [clipboardReady,setClipboardReady]=useState(Boolean(clipboard))
 const location=useCallback(()=>{const sid=selected?.props?.id;return typeof sid==='string'&&sid?getPuck().getSelectorForId(sid):null},[getPuck,selected])
 const duplicate=()=>{if(!selected)return;const loc=location();if(!loc)return;getPuck().dispatch({type:'duplicate',sourceIndex:loc.index,sourceZone:loc.zone,recordHistory:true})}
 const remove=()=>{if(!selected)return;const loc=location();if(!loc)return;getPuck().dispatch({type:'remove',index:loc.index,zone:loc.zone,recordHistory:true})}
 const move=(d:-1|1)=>{if(!selected)return;const loc=location();if(!loc)return;const destination=loc.index+d;if(destination<0)return;getPuck().dispatch({type:'reorder',sourceIndex:loc.index,destinationIndex:destination,destinationZone:loc.zone,recordHistory:true})}
 const copy=()=>{if(selected){clipboard=clone(selected);setClipboardReady(true)}}
 const paste=()=>{if(!clipboard)return;const api=getPuck(),loc=location();const component=rekey(clipboard);const zone=loc?.zone||'root:default-zone',destination=loc?loc.index+1:9999;api.dispatch({type:'insert',componentType:component.type,destinationIndex:destination,destinationZone:zone,id:String(component.props.id),recordHistory:true});api.dispatch({type:'replace',destinationIndex:destination,destinationZone:zone,data:component,recordHistory:false});void api.resolveDataBySelector({zone,index:destination},'insert')}
 return <div className={styles.operatorTools}>
  <button type="button" className={styles.iconButton} title="Annuler" aria-label="Annuler" disabled={!hasPast} onClick={()=>{const api=getPuck();if(api.history.hasPast)api.history.back()}}><Undo2 size={14}/></button>
  <button type="button" className={styles.iconButton} title="Rétablir" aria-label="Rétablir" disabled={!hasFuture} onClick={()=>{const api=getPuck();if(api.history.hasFuture)api.history.forward()}}><Redo2 size={14}/></button>
  {selected?<details className={styles.blockMenu}>
   <summary title="Actions du bloc"><MoreHorizontal size={14}/><span>Bloc</span></summary>
   <div className={styles.blockMenuPopover}>
    <header><span>BLOC SÉLECTIONNÉ</span><strong>{String(selected.type||'Bloc')}</strong></header>
    <button type="button" onClick={copy}><Copy size={14}/><span>Copier</span></button>
    <button type="button" disabled={!clipboardReady} onClick={paste}><ClipboardPaste size={14}/><span>Coller après</span></button>
    <button type="button" onClick={duplicate}><CopyPlus size={14}/><span>Dupliquer</span></button>
    <button type="button" onClick={()=>move(-1)}><ChevronsUp size={14}/><span>Monter</span></button>
    <button type="button" onClick={()=>move(1)}><ChevronsDown size={14}/><span>Descendre</span></button>
    <i/>
    <button type="button" data-danger="true" onClick={remove}><Trash2 size={14}/><span>Supprimer</span></button>
   </div>
  </details>:null}
 </div>
}
