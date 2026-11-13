'use client'
import {useState} from 'react'
import {CheckCircle2,FileArchive,ShieldCheck,UploadCloud,XCircle} from 'lucide-react'
import styles from '../sanila-admin/sanila-admin.module.css'

type Entry={name:string;content:Uint8Array}
type Bundle={format:'sanila-world-package';version:1;pages:Record<string,unknown>[];themes:Record<string,unknown>[];assets?:Array<{path:string}>}
const LIMIT=280*1024*1024
const u16=(v:DataView,i:number)=>v.getUint16(i,true)
const u32=(v:DataView,i:number)=>v.getUint32(i,true)
async function inflate(bytes:Uint8Array){
  if(typeof DecompressionStream==='undefined')throw new Error('Ce navigateur ne supporte pas ce ZIP. Importez un manifeste JSON.')
  const clone=new Uint8Array(bytes.byteLength);clone.set(bytes)
  const stream=new Blob([clone.buffer]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}
async function entries(file:File):Promise<Entry[]>{
  if(!file.name.toLowerCase().endsWith('.zip'))return [{name:'sanila-package.json',content:new Uint8Array(await file.arrayBuffer())}]
  const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer),view=new DataView(buffer)
  if(bytes.byteLength>LIMIT)throw new Error('Archive supérieure à 280 MB.')
  let end=-1
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(u32(view,p)===0x06054b50){end=p;break}
  if(end<0)throw new Error('Structure ZIP invalide.')
  const count=u16(view,end+10);if(count>5000)throw new Error('Trop de fichiers.')
  let cursor=u32(view,end+16),sum=0
  const result:Entry[]=[]
  for(let n=0;n<count;n++){
    if(cursor+46>bytes.length||u32(view,cursor)!==0x02014b50)throw new Error('Répertoire ZIP corrompu.')
    const flags=u16(view,cursor+8),method=u16(view,cursor+10),size=u32(view,cursor+20),rawSize=u32(view,cursor+24)
    const nameLength=u16(view,cursor+28),extra=u16(view,cursor+30),comment=u16(view,cursor+32),offset=u32(view,cursor+42)
    const name=new TextDecoder('utf-8').decode(bytes.slice(cursor+46,cursor+46+nameLength)).replace(/\\/g,'/')
    cursor+=46+nameLength+extra+comment
    if(name.includes('..')||name.startsWith('/')||name.includes('\0'))throw new Error('Chemin ZIP interdit.')
    if(name.endsWith('/'))continue
    if(flags&1||![0,8].includes(method))throw new Error('Format ZIP non pris en charge.')
    sum+=rawSize;if(sum>LIMIT)throw new Error('Archive décompressée supérieure à 280 MB.')
    if(offset+30>bytes.length||u32(view,offset)!==0x04034b50)throw new Error('Entrée ZIP corrompue.')
    const start=offset+30+u16(view,offset+26)+u16(view,offset+28)
    if(start+size>bytes.length)throw new Error('Octets ZIP manquants.')
    const data=method===0?bytes.slice(start,start+size):await inflate(bytes.slice(start,start+size))
    if(data.byteLength!==rawSize)throw new Error('Taille ZIP incohérente.')
    result.push({name,content:data})
  }
  return result
}
const parse=(bytes:Uint8Array)=>JSON.parse(new TextDecoder().decode(bytes)) as Record<string,unknown>
const normalizePath=(s:string)=>s.replace(/^\.\//,'').replace(/\\/g,'/')
function materialize(list:Entry[]):Bundle{
  const manifest=list.find(e=>/(^|\/)(sanila-package|manifest)\.json$/i.test(e.name))
  if(!manifest)throw new Error('sanila-package.json obligatoire.')
  const raw=parse(manifest.content)
  if(raw.format!=='sanila-world-package'||raw.version!==1)throw new Error('Format sanila-world-package v1 requis.')
  const find=(path:string)=>list.find(e=>normalizePath(e.name)===normalizePath(path)||e.name.endsWith('/'+normalizePath(path)))
  const unpack=(entry:unknown)=>{
    const value=entry&&typeof entry==='object'&&!Array.isArray(entry)?entry as Record<string,unknown>:{}
    if(typeof value.path==='string'&&value.data===undefined){const asset=find(value.path);if(!asset)throw new Error('Document manquant : '+value.path);return {...parse(asset.content),...value}}
    return value
  }
  const pages=Array.isArray(raw.pages)?raw.pages.map(unpack):[]
  const themes=Array.isArray(raw.themes)?raw.themes.map(unpack):[]
  if(pages.length>60||themes.length>30)throw new Error('Package trop volumineux.')
  const assets=Array.isArray(raw.assets)?raw.assets.map(a=>({path:String((a as {path?:string}).path||'')})):[]
  for(const a of assets){if(!a.path.endsWith('.png')||!find(a.path))throw new Error('Image PNG manquante ou non supportée : '+a.path)}
  return {format:'sanila-world-package',version:1,pages,themes,assets}
}
export function SanilaWorldImportLab({onBundle}:{onBundle:(bundle:Bundle,name:string,fingerprint:string)=>Promise<unknown>}){
  const [file,setFile]=useState<File|null>(null),[contents,setContents]=useState<Entry[]>([]),[bundle,setBundle]=useState<Bundle|null>(null)
  const [fingerprint,setFingerprint]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function inspect(next:File){
    setFile(next);setBundle(null);setError('');setMessage('');setBusy(true)
    try{
      const bytes=new Uint8Array(await next.arrayBuffer())
      const digest=await crypto.subtle.digest('SHA-256',bytes)
      const hash=[...new Uint8Array(digest)].map(i=>i.toString(16).padStart(2,'0')).join('')
      const all=await entries(next),value=materialize(all)
      setContents(all);setBundle(value);setFingerprint(hash)
      setMessage('Package valide au niveau structurel. Validation des documents et permissions à l’installation.')
    }catch(e){setError(e instanceof Error?e.message:'Fichier invalide.')}
    finally{setBusy(false)}
  }
  async function install(){
    if(!bundle||!file)return
    setBusy(true);setError('');setMessage('Validation des médias et installation…')
    try{
      const updated=structuredClone(bundle)
      if(updated.assets?.length){
        for(const asset of updated.assets){
          const image=contents.find(e=>e.name===asset.path||e.name.endsWith('/'+asset.path))
          if(!image)throw new Error('Image manquante : '+asset.path)
          const b=new Uint8Array(image.content.byteLength);b.set(image.content)
          const form=new FormData();form.append('file',new File([b.buffer],asset.path.split('/').pop()||'sanila.png',{type:'image/png'}))
          form.append('alt_text_fr','SANILA · '+asset.path)
          const response=await fetch('/api/angelcare-marketplace/admin/media/upload',{method:'POST',body:form})
          const result=await response.json()
          if(!response.ok||result.ok===false)throw new Error('Import média natif refusé : '+asset.path+'. '+String(result.error?.message||result.error||'Permissions ou validation.'))
          const native=result.data?.record||result.data||result.record
          const url=String(native?.public_url||native?.url||'')
          if(!url.startsWith('/api/angelcare-marketplace/media/'))throw new Error('Média téléchargé sans URL native reconnue : '+asset.path)
          for(const page of updated.pages){const blocks=(page.data as {content?:Array<{props?:Record<string,unknown>}>}|undefined)?.content||[];for(const block of blocks)if(block.props?.src===asset.path)block.props.src=url}
        }
      }
      await onBundle(updated,file.name,fingerprint)
      setMessage('Demande d’installation envoyée ; vérifier la révision SANILA dans le contrôle public.')
    }catch(e){setError(e instanceof Error?e.message:'Installation impossible.')}finally{setBusy(false)}
  }
  return <section className={styles.panel}>
    <div className={styles.sectionHead}><div><span>PACKAGE IMPORT ENGINE · REAL CONTENT</span><h2>Installer pages, thèmes et médias natifs</h2></div><ShieldCheck size={21}/></div>
    <p>Archive ZIP ou manifeste JSON déclaratif. Aucun JavaScript, HTML exécutable ou dépendance extérieure ne sera installé. PNG : import vers Native Media Vault (permission média nécessaire).</p>
    <label className={styles.dropzone}><UploadCloud size={28}/><strong>Sélectionner un paquet SANILA v1</strong><small>sanila-package.json · pages · thèmes · assets PNG</small><input type="file" accept=".zip,.json,application/zip,application/json" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void inspect(f)}}/></label>
    {bundle?<div className={styles.importReport}><div><FileArchive size={18}/><strong>{file?.name}</strong><small>SHA256 {fingerprint.slice(0,20)}…</small></div><div className={styles.kpiStrip}><article><b>{bundle.pages.length}</b><span>pages</span></article><article><b>{bundle.themes.length}</b><span>thèmes</span></article><article><b>{bundle.assets?.length||0}</b><span>images PNG</span></article></div><button type="button" className={styles.primaryButton} disabled={busy} onClick={()=>void install()}><UploadCloud size={16}/> Installer dans les brouillons SANILA</button></div>:null}
    {message?<p role="status" className={styles.pass}><CheckCircle2 size={16}/>{message}</p>:null}
    {error?<p role="alert" className={styles.blockers}><XCircle size={16}/>{error}</p>:null}
  </section>
}
