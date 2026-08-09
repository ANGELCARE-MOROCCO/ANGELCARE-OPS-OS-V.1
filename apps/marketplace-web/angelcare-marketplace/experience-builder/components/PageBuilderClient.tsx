'use client'

import { useMemo, useState } from 'react'
import type { ApiSuccess } from '../../domain/types'
import { CMS_BLOCK_REGISTRY } from '../block-registry'
import type { CmsBlock, CmsPage } from '../types'
import styles from '../experience.module.css'

interface EditableBlock { id?: string; blockKey: string; blockType: CmsBlock['block_type']; sortOrder: number; content: Record<string, unknown>; settings: Record<string, unknown>; status: string }

export function PageBuilderClient({ page, initialBlocks }: { page: CmsPage; initialBlocks: CmsBlock[] }) {
  const [blocks,setBlocks]=useState<EditableBlock[]>(initialBlocks.map(block=>({id:block.id,blockKey:block.block_key,blockType:block.block_type,sortOrder:block.sort_order,content:block.content,settings:block.settings,status:block.status})))
  const [selected,setSelected]=useState(0)
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')
  const active=blocks[selected]
  const contentText=useMemo(()=>active?JSON.stringify(active.content,null,2):'', [active])
  function add(type:CmsBlock['block_type']){const definition=CMS_BLOCK_REGISTRY.find(item=>item.type===type);setBlocks(items=>[...items,{blockKey:`${type}-${crypto.randomUUID().slice(0,8)}`,blockType:type,sortOrder:items.length,content:{title:definition?.name||type},settings:{},status:'active'}]);setSelected(blocks.length)}
  function move(index:number,direction:-1|1){const target=index+direction;if(target<0||target>=blocks.length)return;setBlocks(items=>{const copy=[...items];[copy[index],copy[target]]=[copy[target],copy[index]];return copy.map((item,sortOrder)=>({...item,sortOrder}))});setSelected(target)}
  function remove(index:number){setBlocks(items=>items.filter((_,position)=>position!==index).map((item,sortOrder)=>({...item,sortOrder})));setSelected(Math.max(0,index-1))}
  function updateContent(raw:string){try{const parsed=JSON.parse(raw) as Record<string,unknown>;setBlocks(items=>items.map((item,index)=>index===selected?{...item,content:parsed}:item));setMessage('')}catch{setMessage('Le contenu JSON du bloc est invalide.')}}
  async function save(){setSaving(true);setMessage('');try{const response=await fetch(`/api/angelcare-marketplace/cms/pages/${page.id}/blocks`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({blocks})});const payload=await response.json() as ApiSuccess<CmsBlock[]>|{error?:{message?:string}};if(!response.ok||!('data'in payload))throw new Error('error'in payload?payload.error?.message:'Enregistrement impossible.');setMessage(`${payload.data.length} bloc(s) enregistrés et persistants.`)}catch(error){setMessage(error instanceof Error?error.message:'Enregistrement impossible.')}finally{setSaving(false)}}
  return <div className={styles.builder}>
    <aside className={styles.palette}><header className={styles.paneHeader}><strong>Bibliothèque contractuelle</strong><span>Blocs gouvernés et localisables</span></header><div className={styles.paletteList}>{CMS_BLOCK_REGISTRY.map(def=><button type="button" className={styles.paletteItem} onClick={()=>add(def.type)} key={def.type}><strong>{def.name}</strong><span>{def.purpose}</span></button>)}</div></aside>
    <section className={styles.canvas}><div className={styles.canvasToolbar}><div><strong>{page.title}</strong> · {page.locale.toUpperCase()} · v{page.current_version}</div><button className={styles.primary} disabled={saving} onClick={()=>void save()}>{saving?'Enregistrement…':'Enregistrer les blocs'}</button></div><div className={styles.pageFrame}>{blocks.length?blocks.map((block,index)=><article className={styles.block} data-selected={selected===index} key={block.id||block.blockKey} onClick={()=>setSelected(index)}><div className={styles.blockControl}><button className={styles.iconButton} onClick={(event)=>{event.stopPropagation();move(index,-1)}} aria-label="Monter">↑</button><button className={styles.iconButton} onClick={(event)=>{event.stopPropagation();move(index,1)}} aria-label="Descendre">↓</button><button className={styles.iconButton} onClick={(event)=>{event.stopPropagation();remove(index)}} aria-label="Retirer">×</button></div><small>{block.blockType} · {block.blockKey}</small><h3>{String(block.content.title||block.content.eyebrow||'Bloc à éditer')}</h3><p>{String(block.content.lead||block.content.body||'Sélectionnez ce bloc pour modifier sa configuration structurée.')}</p></article>):<div className={styles.empty}>Ajoutez un bloc depuis la bibliothèque.</div>}</div></section>
    <aside className={styles.inspector}><header className={styles.paneHeader}><strong>Inspecteur de contenu</strong><span>Structure, contexte et paramètres</span></header><div className={styles.inspectorBody}>{active?<><div className={styles.field}><label>Clé stable</label><input className={styles.input} value={active.blockKey} onChange={event=>setBlocks(items=>items.map((item,index)=>index===selected?{...item,blockKey:event.target.value}:item))}/></div><div className={styles.field}><label>Contenu JSON structuré</label><textarea className={styles.textarea} value={contentText} onChange={event=>updateContent(event.target.value)}/></div><div className={styles.field}><label>Statut</label><select className={styles.select} value={active.status} onChange={event=>setBlocks(items=>items.map((item,index)=>index===selected?{...item,status:event.target.value}:item))}><option value="active">Actif</option><option value="hidden">Masqué</option></select></div></>:<div className={styles.empty}>Sélectionnez un bloc.</div>}{message?<p>{message}</p>:null}</div></aside>
  </div>
}
