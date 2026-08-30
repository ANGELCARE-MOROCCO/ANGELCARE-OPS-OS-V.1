'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- this studio is also embedded by legacy contextual routes; the canonical href remains explicit. */

import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ExternalLink, FileImage, FolderPlus, ImagePlus, Search, UploadCloud } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { MediaAsset } from '../types'
import type {MediaUsageReference} from '../../total-commerce-control/types'
import { GovernedCommandDialog } from '../../reality-completion/components/GovernedCommandDialog'
import { apiRequest, Field, SelectField, StudioForm, StudioNotice, useStudioMutation } from './StudioClient'

type UploadSession = { assetId:string;uploadUrl:string;completionUrl:string;expiresAt:string;publicUrl:string }

function putFile(url:string,file:File,onProgress:(value:number)=>void){
  return new Promise<void>((resolve,reject)=>{const request=new XMLHttpRequest();request.open('PUT',url);request.setRequestHeader('content-type',file.type);request.upload.onprogress=(event)=>{if(event.lengthComputable)onProgress(Math.round(event.loaded/event.total*100))};request.onerror=()=>reject(new Error('Le stockage Windows Marketplace est injoignable.'));request.onload=()=>request.status>=200&&request.status<300?resolve():reject(new Error(`Le stockage a refusé le fichier (HTTP ${request.status}).`));request.send(file)})
}

export function MediaLibraryStudio({ initialMedia, mode = 'library', canManage = false }: { initialMedia: MediaAsset[]; mode?: string; canManage?: boolean }) {
  const [media,setMedia]=useState(initialMedia)
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState<MediaAsset|null>(null)
  const [showFolder,setShowFolder]=useState(false)
  const [usages,setUsages]=useState<MediaUsageReference[]>([])
  const [usageBusy,setUsageBusy]=useState(false)
  const [progress,setProgress]=useState<Record<string,number>>({})
  const uploadRef=useRef<HTMLInputElement|null>(null)
  const replaceRef=useRef<HTMLInputElement|null>(null)
  const mutation=useStudioMutation()
  const filtered=useMemo(()=>media.filter((asset)=>`${asset.file_name} ${asset.asset_key} ${asset.alt_text_fr}`.toLowerCase().includes(query.toLowerCase())),[media,query])

  async function uploadToMarketplaceStorage(file:File,values:{folderId:string|null;altTextFr:string;replaceAssetId?:string}){
    const session=await apiRequest<UploadSession>('/api/angelcare-marketplace/admin/media/upload-session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fileName:file.name,mimeType:file.type,sizeBytes:file.size,folderId:values.folderId,altTextFr:values.altTextFr,replaceAssetId:values.replaceAssetId||null})})
    try{await putFile(session.uploadUrl,file,(value)=>setProgress(current=>({...current,[file.name]:value})))}catch(error){void fetch(session.completionUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fileName:file.name,mimeType:file.type,sizeBytes:file.size,folderId:values.folderId,altTextFr:values.altTextFr})});throw error}
    return apiRequest<MediaAsset>(session.completionUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fileName:file.name,mimeType:file.type,sizeBytes:file.size,folderId:values.folderId,altTextFr:values.altTextFr})})
  }

  async function upload(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    if (!canManage) return
    const sourceForm = new FormData(event.currentTarget)
    const files = sourceForm.getAll('file').filter((entry): entry is File => entry instanceof File && entry.size > 0)
    if (!files.length) return
    const uploaded: MediaAsset[] = []
    for (const file of files) {
      const result = await mutation.run(
        () => uploadToMarketplaceStorage(file,{folderId:String(sourceForm.get('folder_id')||'').trim()||null,altTextFr:String(sourceForm.get('alt_text_fr')||'').trim()||file.name}),
        `${files.length} média(s) téléversé(s) dans le stockage Windows Marketplace.`,
      )
      if (result) uploaded.push(result)
    }
    if (uploaded.length) {
      setMedia((current) => [...uploaded.reverse(), ...current])
      event.currentTarget.reset()
    }
    setProgress({})
  }

  async function transformAsset(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!canManage||!selected)return
    const form=new FormData(event.currentTarget);const payload=Object.fromEntries([...form.entries()].map(([key,value])=>[key,typeof value==='string'?value:'']))
    const result=await mutation.run(()=>apiRequest<MediaAsset>(`/api/angelcare-marketplace/admin/media/${selected.id}/transform`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),'Recadrage, rotation et dérivées responsive appliqués immédiatement.')
    if(result){setSelected(result);setMedia((current)=>current.map((asset)=>asset.id===result.id?result:asset))}
  }

  async function replaceAsset(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(!canManage||!file||!selected)return
    const result=await mutation.run(()=>uploadToMarketplaceStorage(file,{folderId:selected.folder_id,altTextFr:selected.alt_text_fr,replaceAssetId:selected.id}),'Fichier remplacé dans le stockage Windows; les références existantes sont conservées.')
    if(result){setSelected(result);setMedia((current)=>current.map((asset)=>asset.id===result.id?result:asset))}
    event.target.value='';setProgress({})
  }
  async function deleteAsset(reason:string){if(!selected)return;const result=await apiRequest<{deleted:boolean}>(`/api/angelcare-marketplace/admin/media/${selected.id}/permanent-delete`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmation:'SUPPRIMER DÉFINITIVEMENT',reason})});if(result.deleted){setMedia(current=>current.filter(asset=>asset.id!==selected.id));setSelected(null);setUsages([])}}
  async function selectAsset(asset:MediaAsset){setSelected(asset);setUsageBusy(true);try{const response=await fetch(`/api/angelcare-marketplace/admin/media/${asset.id}/usage`);const payload=await response.json() as {data?:MediaUsageReference[]};setUsages(response.ok&&payload.data?payload.data:[])}finally{setUsageBusy(false)}}
  return <main className={styles.shell} data-readonly={!canManage}>
    <section className={styles.workspaceHero} data-accent="media"><div><span>MEDIA LIBRARY · {mode.toUpperCase()}</span><h1>Images, vidéos et documents commerciaux.</h1><p>Upload réel, recherche, droits, focal point, déclinaisons responsive et remplacement sans casser les références.</p></div><div className={styles.workspaceStats}><strong>{media.length}</strong><span>assets persistants</span></div></section>
    {!canManage?<p className={styles.permissionBanner}>Bibliothèque en lecture seule · permission marketplace.media.manage requise pour téléverser, transformer, remplacer ou modifier un asset.</p>:null}
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <section className={styles.mediaLayout}>
      <aside className={styles.uploadPanel}><h2><UploadCloud size={20}/> Téléverser</h2><form onSubmit={upload}><button type="button" className={styles.dropZone} onClick={()=>uploadRef.current?.click()}><ImagePlus size={35}/><strong>Choisir un média</strong><span>JPG, PNG, WebP, AVIF, SVG, MP4, WebM ou PDF · 40 Mo max · transfert direct chiffré vers le stockage Windows</span></button><input ref={uploadRef} className={styles.hiddenInput} name="file" type="file" multiple required accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm,application/pdf"/><Field name="alt_text_fr" label="Texte alternatif FR" required/><Field name="folder_id" label="Dossier (optionnel)"/>{Object.entries(progress).map(([name,value])=><div className={styles.uploadProgress} key={name}><span>{name}</span><progress max={100} value={value}/><strong>{value}%</strong></div>)}<button className={styles.primaryAction} disabled={mutation.saving} type="submit"><UploadCloud size={17}/> Uploader maintenant</button></form><a className={styles.storageHealthLink} href="/angelcare-marketplace/admin/configuration/storage/media">État du stockage média Marketplace</a><button type="button" className={styles.secondaryAction} onClick={()=>setShowFolder((value)=>!value)}><FolderPlus size={16}/> Nouveau dossier</button>{showFolder?<StudioForm resource="media-folders" onSaved={()=>setShowFolder(false)} submitLabel="Créer le dossier"><Field name="name" label="Nom du dossier" required/><Field name="slug" label="Slug"/><input type="hidden" name="status" value="active"/></StudioForm>:null}</aside>
      <section className={styles.libraryPanel}><div className={styles.libraryToolbar}><label><Search size={17}/><input value={query} onChange={(event:ChangeEvent<HTMLInputElement>)=>setQuery(event.target.value)} placeholder="Rechercher nom, clé, alt text…"/></label><span>{filtered.length} résultats</span></div><div className={styles.mediaGrid}>{filtered.map((asset)=><button type="button" key={asset.id} className={styles.mediaCard} data-selected={selected?.id===asset.id} onClick={()=>void selectAsset(asset)}>{asset.media_type==='image'?<img src={asset.desktop_url} alt={asset.alt_text_fr}/>:<div className={styles.fileFallback}><FileImage size={30}/><span>{asset.media_type}</span></div>}<div><strong>{asset.file_name}</strong><span>{asset.rights_status} · {asset.usage_count} usages</span></div></button>)}</div></section>
      <aside className={styles.assetInspector} data-open={Boolean(selected)}>{selected?<><div className={styles.inspectorPreview}>{selected.media_type==='image'?<img src={selected.desktop_url} alt={selected.alt_text_fr}/>:<FileImage size={48}/>}</div><span>ASSET INSPECTOR</span><h2>{selected.file_name}</h2><StudioForm resource="media" id={selected.id} onSaved={(record)=>{const next=record as MediaAsset;setSelected(next);setMedia((current)=>current.map((asset)=>asset.id===next.id?next:asset))}} submitLabel="Enregistrer le média"><Field name="alt_text_fr" label="Alt FR" defaultValue={selected.alt_text_fr} required/><div className={styles.formGrid}><Field name="alt_text_en" label="Alt EN" defaultValue={selected.alt_text_en}/><Field name="alt_text_ar" label="Alt AR" defaultValue={selected.alt_text_ar}/></div><div className={styles.formGrid}><SelectField name="rights_status" label="Droits" defaultValue={selected.rights_status} options={['owned','licensed','public_domain','restricted','expired']}/><Field name="rights_expires_at" label="Expiration" type="datetime-local" defaultValue={selected.rights_expires_at}/></div><div className={styles.formGrid}><Field name="focal_x" label="Focal X (%)" type="number" min={0} defaultValue={Number(selected.focal_point.x||50)}/><Field name="focal_y" label="Focal Y (%)" type="number" min={0} defaultValue={Number(selected.focal_point.y||50)}/></div><Field name="tablet_url" label="Variante tablette" defaultValue={selected.tablet_url}/><Field name="mobile_url" label="Variante mobile" defaultValue={selected.mobile_url}/><input type="hidden" name="status" value="active"/></StudioForm><div className={styles.assetUtilityActions}><button type="button" onClick={()=>void navigator.clipboard.writeText(selected.public_url)}>Copier l’URL publique</button><a href={selected.public_url} target="_blank" rel="noreferrer">Prévisualiser</a></div><form className={styles.transformPanel} onSubmit={transformAsset}><strong>Recadrer & transformer</strong><div className={styles.formGrid}><Field name="crop_x" label="X px" type="number" min={0}/><Field name="crop_y" label="Y px" type="number" min={0}/></div><div className={styles.formGrid}><Field name="crop_width" label="Largeur px" type="number" min={1}/><Field name="crop_height" label="Hauteur px" type="number" min={1}/></div><div className={styles.formGrid}><SelectField name="rotation" label="Rotation" defaultValue="0" options={[{value:'0',label:'0°'},{value:'90',label:'90°'},{value:'180',label:'180°'},{value:'270',label:'270°'}]}/><Field name="focal_x" label="Focal X %" type="number" min={0} defaultValue={Number(selected.focal_point.x||50)}/></div><Field name="focal_y" label="Focal Y %" type="number" min={0} defaultValue={Number(selected.focal_point.y||50)}/><button type="submit" className={styles.secondaryAction}>Appliquer transformation et régénérer</button></form><button type="button" className={styles.secondaryAction} onClick={()=>replaceRef.current?.click()}>Remplacer le fichier, conserver les références</button><input ref={replaceRef} className={styles.hiddenInput} type="file" onChange={replaceAsset}/><section style={{marginTop:18,borderTop:'1px solid #e1e8ee',paddingTop:14}}><strong>Utilisé actuellement</strong><p style={{fontSize:12,opacity:.7}}>{usageBusy?'Recherche des références…':`${usages.length} référence(s) détectée(s)`}</p><div style={{display:'grid',gap:8}}>{usages.slice(0,30).map((usage)=><div key={`${usage.source}:${usage.object_id}:${usage.slot_key}`} style={{border:'1px solid #e5ebef',borderRadius:10,padding:9}}><b style={{display:'block',fontSize:12}}>{usage.label}</b><small>{usage.object_type} · {usage.slot_key}</small>{usage.route_hint?<a href={usage.route_hint} target="_blank" rel="noreferrer" style={{display:'flex',gap:5,alignItems:'center',marginTop:5}}><ExternalLink size={12}/>Ouvrir</a>:null}</div>)}</div></section><GovernedCommandDialog title={`Supprimer définitivement · ${selected.file_name}`} triggerLabel="Supprimer le fichier et ses métadonnées" danger disabled={!canManage||usageBusy||usages.length>0} fields={[]} reasonLabel="Motif de suppression définitive" onSubmit={async(_values,reason)=>deleteAsset(reason)}/>{usages.length?<p className={styles.destructiveBlocker}>Suppression définitive bloquée: retirez d’abord les {usages.length} usage(s) référencés.</p>:null}</>:<div className={styles.emptyInspector}><ImagePlus size={30}/><p>Sélectionnez un média pour modifier textes, droits, focal point et variantes.</p></div>}</aside>
    </section>
  </main>
}
