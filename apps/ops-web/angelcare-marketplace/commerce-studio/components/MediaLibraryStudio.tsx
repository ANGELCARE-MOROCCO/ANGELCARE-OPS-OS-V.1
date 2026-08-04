'use client'

import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { FileImage, FolderPlus, ImagePlus, Search, UploadCloud } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CommerceRecord, MediaAsset } from '../types'
import { apiRequest, Field, SelectField, StudioForm, StudioNotice, useStudioMutation } from './StudioClient'

export function MediaLibraryStudio({ initialMedia, mode = 'library' }: { initialMedia: MediaAsset[]; mode?: string }) {
  const [media,setMedia]=useState(initialMedia)
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState<MediaAsset|null>(null)
  const [showFolder,setShowFolder]=useState(false)
  const uploadRef=useRef<HTMLInputElement|null>(null)
  const replaceRef=useRef<HTMLInputElement|null>(null)
  const mutation=useStudioMutation()
  const filtered=useMemo(()=>media.filter((asset)=>`${asset.file_name} ${asset.asset_key} ${asset.alt_text_fr}`.toLowerCase().includes(query.toLowerCase())),[media,query])

  async function upload(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    const sourceForm = new FormData(event.currentTarget)
    const files = sourceForm.getAll('file').filter((entry): entry is File => entry instanceof File && entry.size > 0)
    if (!files.length) return
    const uploaded: MediaAsset[] = []
    for (const file of files) {
      const form = new FormData()
      form.set('file', file)
      for (const key of ['folder_id','alt_text_fr','alt_text_en','alt_text_ar','rights_status','rights_expires_at']) {
        const value = sourceForm.get(key)
        if (typeof value === 'string') form.set(key, value)
      }
      const result = await mutation.run(
        () => apiRequest<MediaAsset>('/api/angelcare-marketplace/admin/media/upload', { method: 'POST', body: form }),
        `${files.length} média(s) téléversé(s) et disponible(s) dans tous les studios.`,
      )
      if (result) uploaded.push(result)
    }
    if (uploaded.length) {
      setMedia((current) => [...uploaded.reverse(), ...current])
      event.currentTarget.reset()
    }
  }

  async function transformAsset(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!selected)return
    const form=new FormData(event.currentTarget);const payload=Object.fromEntries([...form.entries()].map(([key,value])=>[key,typeof value==='string'?value:'']))
    const result=await mutation.run(()=>apiRequest<MediaAsset>(`/api/angelcare-marketplace/admin/media/${selected.id}/transform`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),'Recadrage, rotation et dérivées responsive appliqués immédiatement.')
    if(result){setSelected(result);setMedia((current)=>current.map((asset)=>asset.id===result.id?result:asset))}
  }

  async function replaceAsset(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(!file||!selected)return
    const form=new FormData();form.set('file',file);form.set('alt_text_fr',selected.alt_text_fr);form.set('replace_asset_id',selected.id)
    const result=await mutation.run(()=>apiRequest<MediaAsset>('/api/angelcare-marketplace/admin/media/upload',{method:'POST',body:form}),'Fichier remplacé; les références existantes sont conservées.')
    if(result){setSelected(result);setMedia((current)=>current.map((asset)=>asset.id===result.id?result:asset))}
    event.target.value=''
  }
  return <main className={styles.shell}>
    <section className={styles.workspaceHero} data-accent="media"><div><span>MEDIA LIBRARY · {mode.toUpperCase()}</span><h1>Images, vidéos et documents commerciaux.</h1><p>Upload réel, recherche, droits, focal point, déclinaisons responsive et remplacement sans casser les références.</p></div><div className={styles.workspaceStats}><strong>{media.length}</strong><span>assets persistants</span></div></section>
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <section className={styles.mediaLayout}>
      <aside className={styles.uploadPanel}><h2><UploadCloud size={20}/> Téléverser</h2><form onSubmit={upload}><button type="button" className={styles.dropZone} onClick={()=>uploadRef.current?.click()}><ImagePlus size={35}/><strong>Choisir un média</strong><span>JPG, PNG, WebP, AVIF, SVG, MP4, WebM ou PDF · 40 Mo max</span></button><input ref={uploadRef} className={styles.hiddenInput} name="file" type="file" multiple required accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm,application/pdf"/><Field name="alt_text_fr" label="Texte alternatif FR" required/><Field name="folder_id" label="Dossier (optionnel)"/><button className={styles.primaryAction} disabled={mutation.saving} type="submit"><UploadCloud size={17}/> Uploader maintenant</button></form><button type="button" className={styles.secondaryAction} onClick={()=>setShowFolder((value)=>!value)}><FolderPlus size={16}/> Nouveau dossier</button>{showFolder?<StudioForm resource="media-folders" onSaved={()=>setShowFolder(false)} submitLabel="Créer le dossier"><Field name="name" label="Nom du dossier" required/><Field name="slug" label="Slug"/><input type="hidden" name="status" value="active"/></StudioForm>:null}</aside>
      <section className={styles.libraryPanel}><div className={styles.libraryToolbar}><label><Search size={17}/><input value={query} onChange={(event:ChangeEvent<HTMLInputElement>)=>setQuery(event.target.value)} placeholder="Rechercher nom, clé, alt text…"/></label><span>{filtered.length} résultats</span></div><div className={styles.mediaGrid}>{filtered.map((asset)=><button type="button" key={asset.id} className={styles.mediaCard} data-selected={selected?.id===asset.id} onClick={()=>setSelected(asset)}>{asset.media_type==='image'?<img src={asset.desktop_url} alt={asset.alt_text_fr}/>:<div className={styles.fileFallback}><FileImage size={30}/><span>{asset.media_type}</span></div>}<div><strong>{asset.file_name}</strong><span>{asset.rights_status} · {asset.usage_count} usages</span></div></button>)}</div></section>
      <aside className={styles.assetInspector} data-open={Boolean(selected)}>{selected?<><div className={styles.inspectorPreview}>{selected.media_type==='image'?<img src={selected.desktop_url} alt={selected.alt_text_fr}/>:<FileImage size={48}/>}</div><span>ASSET INSPECTOR</span><h2>{selected.file_name}</h2><StudioForm resource="media" id={selected.id} onSaved={(record)=>{const next=record as MediaAsset;setSelected(next);setMedia((current)=>current.map((asset)=>asset.id===next.id?next:asset))}} submitLabel="Enregistrer le média"><Field name="alt_text_fr" label="Alt FR" defaultValue={selected.alt_text_fr} required/><div className={styles.formGrid}><Field name="alt_text_en" label="Alt EN" defaultValue={selected.alt_text_en}/><Field name="alt_text_ar" label="Alt AR" defaultValue={selected.alt_text_ar}/></div><div className={styles.formGrid}><SelectField name="rights_status" label="Droits" defaultValue={selected.rights_status} options={['owned','licensed','public_domain','restricted','expired']}/><Field name="rights_expires_at" label="Expiration" type="datetime-local" defaultValue={selected.rights_expires_at}/></div><div className={styles.formGrid}><Field name="focal_x" label="Focal X (%)" type="number" min={0} defaultValue={Number(selected.focal_point.x||50)}/><Field name="focal_y" label="Focal Y (%)" type="number" min={0} defaultValue={Number(selected.focal_point.y||50)}/></div><Field name="tablet_url" label="Variante tablette" defaultValue={selected.tablet_url}/><Field name="mobile_url" label="Variante mobile" defaultValue={selected.mobile_url}/><input type="hidden" name="status" value="active"/></StudioForm><form className={styles.transformPanel} onSubmit={transformAsset}><strong>Recadrer & transformer</strong><div className={styles.formGrid}><Field name="crop_x" label="X px" type="number" min={0}/><Field name="crop_y" label="Y px" type="number" min={0}/></div><div className={styles.formGrid}><Field name="crop_width" label="Largeur px" type="number" min={1}/><Field name="crop_height" label="Hauteur px" type="number" min={1}/></div><div className={styles.formGrid}><SelectField name="rotation" label="Rotation" defaultValue="0" options={[{value:'0',label:'0°'},{value:'90',label:'90°'},{value:'180',label:'180°'},{value:'270',label:'270°'}]}/><Field name="focal_x" label="Focal X %" type="number" min={0} defaultValue={Number(selected.focal_point.x||50)}/></div><Field name="focal_y" label="Focal Y %" type="number" min={0} defaultValue={Number(selected.focal_point.y||50)}/><button type="submit" className={styles.secondaryAction}>Appliquer transformation et régénérer</button></form><button type="button" className={styles.secondaryAction} onClick={()=>replaceRef.current?.click()}>Remplacer le fichier, conserver les références</button><input ref={replaceRef} className={styles.hiddenInput} type="file" onChange={replaceAsset}/></>:<div className={styles.emptyInspector}><ImagePlus size={30}/><p>Sélectionnez un média pour modifier textes, droits, focal point et variantes.</p></div>}</aside>
    </section>
  </main>
}
