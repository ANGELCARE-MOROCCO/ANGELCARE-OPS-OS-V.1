export type WorldIngestionMode='file'|'folder'|'zip'|'package'
export type WorldSourceFormat='package'|'html'
export type IngestedWorldFile={file:File;path:string}
export type WorldIngestionEvidence={key:string;label:string;path:string}
export interface WorldIngestionResult{
 source:string
 css:string
 sourceFormat:WorldSourceFormat
 sourceLabel:string
 files:number
 bytes:number
 packagePath:string|null
 machineContractPath:string|null
 desktopReference:File|null
 mobileReference:File|null
 evidence:WorldIngestionEvidence[]
 inventory:string[]
}

const MAX_FILES=1500
const MAX_TOTAL_BYTES=80*1024*1024
const MAX_ENTRY_BYTES=24*1024*1024

const textExtensions=new Set(['.html','.htm','.css','.json','.md','.txt','.csv'])
const mime=(name:string)=>{
 const lower=name.toLowerCase()
 if(lower.endsWith('.json'))return'application/json'
 if(lower.endsWith('.html')||lower.endsWith('.htm'))return'text/html'
 if(lower.endsWith('.css'))return'text/css'
 if(lower.endsWith('.png'))return'image/png'
 if(lower.endsWith('.jpg')||lower.endsWith('.jpeg'))return'image/jpeg'
 if(lower.endsWith('.webp'))return'image/webp'
 if(lower.endsWith('.md'))return'text/markdown'
 if(lower.endsWith('.csv'))return'text/csv'
 return'application/octet-stream'
}
const cleanPath=(value:string)=>value.replace(/\\/g,'/').replace(/^\/+/, '').split('/').filter(part=>part&&part!=='.'&&part!=='..').join('/')
const ext=(value:string)=>{const index=value.lastIndexOf('.');return index>=0?value.slice(index).toLowerCase():''}
const portablePackage=(value:unknown)=>Boolean(value&&typeof value==='object'&&(value as Record<string,unknown>).format==='angelcare-world-package-v1')
const jsonObject=async(file:File)=>{try{return JSON.parse(await file.text()) as Record<string,unknown>}catch{return null}}

export function inputFiles(files:FileList|File[]):IngestedWorldFile[]{
 return Array.from(files).map(file=>({file,path:cleanPath((file as File&{webkitRelativePath?:string}).webkitRelativePath||file.name)}))
}

async function readEntries(reader:any):Promise<any[]>{
 const all:any[]=[]
 for(;;){const batch:any[]=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));if(!batch.length)return all;all.push(...batch)}
}
async function walkEntry(entry:any,prefix=''):Promise<IngestedWorldFile[]>{
 const path=cleanPath(prefix?`${prefix}/${entry.name}`:entry.name)
 if(entry.isFile){const file:File=await new Promise((resolve,reject)=>entry.file(resolve,reject));return[{file,path}]}
 if(!entry.isDirectory)return[]
 const children=await readEntries(entry.createReader())
 const nested=await Promise.all(children.map(child=>walkEntry(child,path)))
 return nested.flat()
}
export async function droppedFiles(transfer:DataTransfer):Promise<IngestedWorldFile[]>{
 const items=Array.from(transfer.items||[])
 const entryItems=items.map(item=>(item as any).webkitGetAsEntry?.()).filter(Boolean)
 if(entryItems.length){const nested=await Promise.all(entryItems.map(entry=>walkEntry(entry)));return nested.flat()}
 return inputFiles(transfer.files)
}

async function inflateRaw(bytes:Uint8Array):Promise<Uint8Array>{
 if(typeof DecompressionStream==='undefined')throw new Error('Ce navigateur ne peut pas décompresser ce ZIP. Utilisez Chrome/Edge récent ou importez le dossier directement.')
 const blobBuffer=new ArrayBuffer(bytes.byteLength)
 new Uint8Array(blobBuffer).set(bytes)
 const stream=new Blob([blobBuffer]).stream().pipeThrough(new DecompressionStream('deflate-raw' as any))
 return new Uint8Array(await new Response(stream).arrayBuffer())
}
function u16(view:DataView,offset:number){return view.getUint16(offset,true)}
function u32(view:DataView,offset:number){return view.getUint32(offset,true)}
export async function unzipWorld(file:File):Promise<IngestedWorldFile[]>{
 const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer),view=new DataView(buffer)
 if(bytes.byteLength<22)throw new Error('Archive ZIP invalide ou vide.')
 let eocd=-1
 for(let i=Math.max(0,bytes.byteLength-22);i>=Math.max(0,bytes.byteLength-65557);i--){if(u32(view,i)===0x06054b50){eocd=i;break}}
 if(eocd<0)throw new Error('Fin de répertoire ZIP introuvable.')
 const count=u16(view,eocd+10),centralOffset=u32(view,eocd+16)
 if(count>MAX_FILES)throw new Error(`ZIP refusé: ${count} fichiers dépasse la limite ${MAX_FILES}.`)
 let cursor=centralOffset,total=0
 const out:IngestedWorldFile[]=[]
 const decoder=new TextDecoder('utf-8')
 for(let index=0;index<count;index++){
  if(u32(view,cursor)!==0x02014b50)throw new Error('Répertoire central ZIP invalide.')
  const flags=u16(view,cursor+8),method=u16(view,cursor+10),compressedSize=u32(view,cursor+20),uncompressedSize=u32(view,cursor+24),nameLength=u16(view,cursor+28),extraLength=u16(view,cursor+30),commentLength=u16(view,cursor+32),localOffset=u32(view,cursor+42)
  if(flags&1)throw new Error('ZIP chiffré non accepté.')
  const rawName=decoder.decode(bytes.slice(cursor+46,cursor+46+nameLength)),path=cleanPath(rawName)
  cursor+=46+nameLength+extraLength+commentLength
  if(!path||rawName.endsWith('/'))continue
  if(uncompressedSize>MAX_ENTRY_BYTES)throw new Error(`Fichier ZIP trop volumineux: ${path}`)
  total+=uncompressedSize
  if(total>MAX_TOTAL_BYTES)throw new Error('ZIP refusé: volume décompressé supérieur à 80 MB.')
  if(u32(view,localOffset)!==0x04034b50)throw new Error(`Entrée ZIP invalide: ${path}`)
  const localNameLength=u16(view,localOffset+26),localExtraLength=u16(view,localOffset+28),start=localOffset+30+localNameLength+localExtraLength,compressed=bytes.slice(start,start+compressedSize)
  let content:Uint8Array
  if(method===0)content=compressed
  else if(method===8)content=await inflateRaw(compressed)
  else throw new Error(`Compression ZIP non supportée (${method}) pour ${path}.`)
  if(uncompressedSize&&content.byteLength!==uncompressedSize)throw new Error(`Taille ZIP incohérente: ${path}`)
  const fileBuffer=new ArrayBuffer(content.byteLength)
  new Uint8Array(fileBuffer).set(content)
  out.push({file:new File([fileBuffer],path.split('/').pop()||path,{type:mime(path)}),path})
 }
 return out
}

export async function inspectWorldFiles(files:IngestedWorldFile[],label:string):Promise<WorldIngestionResult>{
 const normalized=files.filter(row=>row.path&&!row.path.startsWith('__MACOSX/'))
 if(!normalized.length)throw new Error('Aucun fichier exploitable détecté.')
 if(normalized.length>MAX_FILES)throw new Error(`Import refusé: ${normalized.length} fichiers dépasse la limite ${MAX_FILES}.`)
 const bytes=normalized.reduce((sum,row)=>sum+row.file.size,0)
 if(bytes>MAX_TOTAL_BYTES)throw new Error('Import refusé: volume total supérieur à 80 MB.')
 const lower=(row:IngestedWorldFile)=>row.path.toLowerCase()
 const jsonFiles=normalized.filter(row=>ext(row.path)==='.json')
 let packageRow:IngestedWorldFile|null=null,packageRaw='',machineContractPath:string|null=null
 for(const row of jsonFiles){
  const parsed=await jsonObject(row.file)
  if(parsed&&portablePackage(parsed)){packageRow=row;packageRaw=await row.file.text();break}
  if(parsed&&('rootSections'in parsed)&&('worldId'in parsed)&&lower(row).includes('machine_contract'))machineContractPath=row.path
 }
 const desktop=normalized.find(row=>/approved[_ -]?desktop[_ -]?reference\.(png|jpe?g|webp)$/i.test(row.file.name))?.file||null
 const mobile=normalized.find(row=>/approved[_ -]?mobile[_ -]?reference\.(png|jpe?g|webp)$/i.test(row.file.name))?.file||null
 const htmlRows=normalized.filter(row=>['.html','.htm'].includes(ext(row.path)))
 const cssRows=normalized.filter(row=>ext(row.path)==='.css')
 let source='',css='',sourceFormat:WorldSourceFormat='html',sourceLabel=label
 if(packageRow){source=packageRaw;sourceFormat='package';sourceLabel=`${label} · ${packageRow.path}`}
 else if(htmlRows.length){source=(await Promise.all(htmlRows.map(async row=>`<!-- ${row.path} -->\n${await row.file.text()}`))).join('\n');css=(await Promise.all(cssRows.map(async row=>`/* ${row.path} */\n${await row.file.text()}`))).join('\n');sourceLabel=`${label} · ${htmlRows.length} HTML`}
 else throw new Error(machineContractPath?'Contrat board détecté, mais aucun package World Factory v1 ni HTML exécutable dans ce dossier. Ajoutez le JSON portable généré pour ce world puis réimportez le dossier complet.':'Aucun package World Factory v1 ni fichier HTML détecté.')
 const evidence:WorldIngestionEvidence[]=[]
 if(packageRow)evidence.push({key:'package',label:'World package v1',path:packageRow.path})
 if(machineContractPath)evidence.push({key:'contract',label:'Machine contract',path:machineContractPath})
 if(desktop)evidence.push({key:'desktop',label:'Référence desktop',path:normalized.find(row=>row.file===desktop)?.path||desktop.name})
 if(mobile)evidence.push({key:'mobile',label:'Référence mobile',path:normalized.find(row=>row.file===mobile)?.path||mobile.name})
 const blueprint=normalized.find(row=>/blueprint\.md$/i.test(row.file.name));if(blueprint)evidence.push({key:'blueprint',label:'Blueprint',path:blueprint.path})
 const acceptance=normalized.find(row=>/acceptance[_ -]?matrix\.md$/i.test(row.file.name));if(acceptance)evidence.push({key:'acceptance',label:'Acceptance matrix',path:acceptance.path})
 const hashes=normalized.find(row=>/sha256sums\.txt$|reference_hashes\.txt$/i.test(row.file.name));if(hashes)evidence.push({key:'hashes',label:'Hash manifest',path:hashes.path})
 return{source,css,sourceFormat,sourceLabel,files:normalized.length,bytes,packagePath:packageRow?.path||null,machineContractPath,desktopReference:desktop,mobileReference:mobile,evidence,inventory:normalized.map(row=>row.path).sort()}
}

export function worldFileAccept(mode:WorldIngestionMode){
 if(mode==='zip')return'.zip,application/zip,application/x-zip-compressed'
 if(mode==='package')return'.json,application/json'
 if(mode==='file')return'.html,.htm,.css,text/html,text/css'
 return''
}

export function isTextWorldFile(path:string){return textExtensions.has(ext(path))}
