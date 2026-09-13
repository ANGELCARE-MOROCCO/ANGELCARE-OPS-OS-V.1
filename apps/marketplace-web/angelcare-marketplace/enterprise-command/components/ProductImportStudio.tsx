'use client'

import { useEffect,useMemo,useRef,useState } from 'react'
import { CheckCircle2,Download,FileSpreadsheet,PauseCircle,PlayCircle,RefreshCcw,RotateCcw,TableProperties,Wand2 } from 'lucide-react'
import { PRODUCT_DOCTRINES } from '../product-doctrine'
import { PRODUCT_360_IMPORT_FIELDS, canonicalProductImportKey, productImportColumns, product360ContractSummary, type ProductImportMode } from '../product-360-contract'
import type { ProductImportPreview } from '../types'
import { MarketplaceFilePicker } from '../../components/MarketplaceFilePicker'
import styles from '../enterprise-command.module.css'

type Row=Record<string,string>
const PRODUCT_IMPORT_ACCEPT='.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
type Envelope<T>={data:T;error?:{message?:string}}
type JobRow={id:string;row_number:number;status:string;action:string;object_id?:string|null;errors?:unknown[];warnings?:unknown[];normalized_payload?:Record<string,unknown>;result?:Record<string,unknown>}
type ImportJob={id:string;public_reference?:string;status:string;total_rows:number;valid_rows:number;rejected_rows:number;processed_rows?:number;failed_rows?:number;progress_percent?:number;result?:Record<string,unknown>;created_at?:string;completed_at?:string|null}
type JobSnapshot={job:ImportJob;rows:JobRow[];rowCount:number;page:number;pageSize:number}

function detectCsvDelimiter(source:string):','|';'|'\t'{
  const counts={',':0,';':0,'\t':0};let quoted=false
  for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){i++;continue}quoted=!quoted;continue}if(!quoted&&(c==='\n'||c==='\r'))break;if(!quoted&&(c===','||c===';'||c==='\t'))counts[c]++}
  const ranked=(Object.entries(counts) as Array<[','|';'|'\t',number]>).sort((a,b)=>b[1]-a[1]);return ranked[0][1]>0?ranked[0][0]:','
}

function parseCsv(source:string){
  const text=source.replace(/^\uFEFF/,'')
  if(!text.trim())return{headers:[] as string[],rows:[] as Row[]}
  const delimiter=detectCsvDelimiter(text)
  const records:string[][]=[];let record:string[]=[],value='',quoted=false
  for(let i=0;i<text.length;i++){
    const c=text[i]
    if(c==='"'){
      if(quoted&&text[i+1]==='"'){value+='"';i++}
      else quoted=!quoted
      continue
    }
    if(c===delimiter&&!quoted){record.push(value);value='';continue}
    if((c==='\n'||c==='\r')&&!quoted){
      if(c==='\r'&&text[i+1]==='\n')i++
      record.push(value);value=''
      if(record.some(cell=>cell.trim()!==''))records.push(record)
      record=[];continue
    }
    value+=c
  }
  record.push(value);if(record.some(cell=>cell.trim()!==''))records.push(record)
  if(quoted)throw new Error('CSV invalide : guillemet non fermé.')
  if(!records.length)return{headers:[] as string[],rows:[] as Row[]}
  const headers=records[0].map(v=>v.trim())
  const normalizedHeaders=headers.map(canonicalProductImportKey)
  const duplicates=normalizedHeaders.filter((h,i)=>h&&normalizedHeaders.indexOf(h)!==i)
  if(duplicates.length)throw new Error(`CSV invalide : colonnes dupliquées après normalisation (${[...new Set(duplicates)].join(', ')}).`)
  if(headers.some(h=>!h))throw new Error('CSV invalide : une colonne possède un en-tête vide.')
  for(const [index,cells] of records.slice(1).entries())if(cells.length>headers.length)throw new Error(`CSV invalide : ligne ${index+2} contient ${cells.length} cellules pour ${headers.length} en-têtes.`)
  const rows=records.slice(1).map(cells=>Object.fromEntries(headers.map((header,index)=>[header,cells[index]??''])))
  return{headers,rows,delimiter}
}


async function sha256(data:ArrayBuffer|string){const bytes=typeof data==='string'?new TextEncoder().encode(data):data;const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
function rowsToCsv(records:string[][]){const quote=(value:string)=>`"${String(value??'').replaceAll('"','""')}"`;return records.map(record=>record.map(quote).join(',')).join('\n')}
type Product360TemplateManifest={
  contract:string
  doctrineKey:string
  doctrineLabel:string
  importMode:ProductImportMode
  generatedAt:string
}

type Product360TemplateLock={
  doctrineKey:string
  importMode:ProductImportMode
  source:'xlsx-manifest'|'generated-filename'
}

const PRODUCT360_TEMPLATE_CONTRACT='ANGELCARE_PRODUCT360_TEMPLATE_V1'

function templateIdentityFromFilename(name:string){
  const match=name.match(/^ANGELCARE_(.+)_(upsert|create|update)_(?:IMPORT|PRODUCT360_TEMPLATE)\.(?:csv|xlsx)$/i)
  if(!match)return null
  return {
    doctrineKey:match[1],
    importMode:match[2].toLowerCase() as ProductImportMode,
  }
}

async function xlsxToImportPayload(buffer:ArrayBuffer){
  const module:any=await import('exceljs')
  const ExcelJS=module.default||module
  const workbook=new ExcelJS.Workbook()

  await workbook.xlsx.load(buffer)

  const sheet=workbook.worksheets[0]
  if(!sheet)throw new Error('Le classeur XLSX ne contient aucune feuille.')

  const records:string[][]=[]

  sheet.eachRow(
    {includeEmpty:true},
    (row:{cellCount:number;getCell:(column:number)=>{text:string}})=>{
      const values=[] as string[]
      for(
        let column=1;
        column<=Math.max(sheet.columnCount,row.cellCount);
        column++
      ){
        values.push(row.getCell(column).text??'')
      }
      records.push(values)
    },
  )

  while(
    records.length &&
    records[records.length-1].every(value=>!value.trim())
  ){
    records.pop()
  }

  let manifest:Product360TemplateManifest|null=null
  const manifestSheet=workbook.getWorksheet('_ANGELCARE_IMPORT_MANIFEST')

  if(manifestSheet){
    const values:Record<string,string>={}

    manifestSheet.eachRow(
      {includeEmpty:false},
      (row:{getCell:(column:number)=>{text:string}})=>{
        const key=(row.getCell(1).text||'').trim()
        const value=(row.getCell(2).text||'').trim()
        if(key)values[key]=value
      },
    )

    if(
      values.contract ||
      values.doctrine_key ||
      values.import_mode
    ){
      if(values.contract!==PRODUCT360_TEMPLATE_CONTRACT){
        throw new Error(
          `Manifest Produit 360 incompatible: ${values.contract||'absent'}.`,
        )
      }

      if(!values.doctrine_key){
        throw new Error(
          'Manifest Produit 360 invalide: doctrine_key absent.',
        )
      }

      if(
        values.import_mode!=='upsert' &&
        values.import_mode!=='create' &&
        values.import_mode!=='update'
      ){
        throw new Error(
          `Manifest Produit 360 invalide: mode ${values.import_mode||'absent'}.`,
        )
      }

      manifest={
        contract:values.contract,
        doctrineKey:values.doctrine_key,
        doctrineLabel:values.doctrine_label||values.doctrine_key,
        importMode:values.import_mode,
        generatedAt:values.generated_at||'',
      }
    }
  }

  return {
    csv:rowsToCsv(records),
    manifest,
  }
}

function browserDownload(blob:Blob,name:string){
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download=name
  a.rel='noopener'
  a.style.display='none'
  document.body.appendChild(a)
  a.click()
  window.setTimeout(()=>{
    a.remove()
    URL.revokeObjectURL(url)
  },1500)
}

function csvDownload(name:string,headers:string[],data:Array<Record<string,unknown>>){
  const quote=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`
  const lines=[headers.map(quote).join(','),...data.map(row=>headers.map(h=>quote(row[h])).join(','))]
  const blob=new Blob(['\uFEFF',lines.join('\n')],{type:'text/csv;charset=utf-8'})
  browserDownload(blob,name)
}

export function ProductImportStudio(){
  const [templateLock,setTemplateLock]=useState<Product360TemplateLock|null>(null)
  const[doctrine,setDoctrine]=useState('one_time_service')
  const[importMode,setImportMode]=useState<ProductImportMode>('upsert')
  const[source,setSource]=useState('')
  const[selectedFiles,setSelectedFiles]=useState<File[]>([])
  const[fileError,setFileError]=useState('')
  const[sourceHash,setSourceHash]=useState('')
  const[preview,setPreview]=useState<ProductImportPreview|null>(null)
  const[busy,setBusy]=useState(false)
  const[notice,setNotice]=useState('')
  const[mapping,setMapping]=useState<Record<string,string>>({})
  const[editable,setEditable]=useState<Row[]>([])
  const[editPage,setEditPage]=useState(1)
  const[job,setJob]=useState<JobSnapshot|null>(null)
  const[autoRun,setAutoRun]=useState(false)
  const runningRef=useRef(false)
  const pageSize=50
  const parsed=useMemo(()=>{try{return parseCsv(source)}catch(error){return{headers:[] as string[],rows:[] as Row[],parseError:error instanceof Error?error.message:String(error)}}},[source])
  const d=PRODUCT_DOCTRINES[doctrine as keyof typeof PRODUCT_DOCTRINES]
  const targets=useMemo(()=>productImportColumns(d),[d])
  const contract=useMemo(()=>product360ContractSummary(d),[d])
  const editPages=Math.max(1,Math.ceil(editable.length/pageSize))
  const editStart=(editPage-1)*pageSize

  useEffect(()=>{
    const auto=Object.fromEntries(parsed.headers.map(h=>{const canonical=canonicalProductImportKey(h);return[h,targets.includes(canonical)?canonical:'']}))
    setMapping(auto);setEditable(parsed.rows.map(r=>({...r})));setPreview(null);setEditPage(1);setJob(null);setAutoRun(false)
  },[source,doctrine])

  const mappedRows=useMemo(()=>editable.map(row=>{const out:Row={};for(const[sourceKey,target]of Object.entries(mapping))if(target)out[target]=row[sourceKey]??'';return out}),[editable,mapping])
  const unmappedHeaders=useMemo(()=>parsed.headers.filter(header=>!mapping[header]),[parsed.headers,mapping])
  const duplicateTargets=useMemo(()=>{const values=Object.values(mapping).filter(Boolean);return [...new Set(values.filter((value,index)=>values.indexOf(value)!==index))]},[mapping])

  function autoMap(){const next:Record<string,string>={};for(const h of parsed.headers){const canonical=canonicalProductImportKey(h);next[h]=targets.includes(canonical)?canonical:''}setMapping(next);setPreview(null);setJob(null)}
  async function dry(){if(unmappedHeaders.length){setNotice(`Mapping incomplet : ${unmappedHeaders.join(', ')}. Aucune colonne source ne peut être ignorée silencieusement.`);return}if(duplicateTargets.length){setNotice(`Mapping ambigu : plusieurs colonnes ciblent ${duplicateTargets.join(', ')}.`);return}setBusy(true);setNotice('');try{const r=await fetch('/api/angelcare-marketplace/admin/enterprise-command/product-import/preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({doctrineKey:doctrine,rows:mappedRows,mode:importMode})});const p=await r.json() as Envelope<ProductImportPreview>;if(r.ok&&p.data)setPreview(p.data);else setNotice(p.error?.message||'Validation impossible.')}finally{setBusy(false)}}

  async function createJob(){
    if(!preview||!preview.valid)return
    setBusy(true);setNotice('')
    try{
      const r=await fetch('/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({doctrineKey:doctrine,rows:mappedRows,mode:importMode,sourceName:selectedFiles[0]?.name||'clipboard.csv',sourceHash:sourceHash||await sha256(source),sourceHeaders:parsed.headers,mapping})})
      const p=await r.json() as Envelope<JobSnapshot>
      if(!r.ok||!p.data){setNotice(p.error?.message||'Création du job impossible.');return}
      setJob(p.data);setNotice(`${p.data.job.public_reference||'Job'} créé. L’import est persistant et reprenable.`);setAutoRun(true)
    }finally{setBusy(false)}
  }

  async function loadJob(jobId:string,failedOnly=false){
    const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${jobId}?pageSize=100${failedOnly?'&failedOnly=1':''}`,{cache:'no-store'})
    const p=await r.json() as Envelope<JobSnapshot>
    if(r.ok&&p.data){setJob(p.data);return p.data}
    throw new Error(p.error?.message||'Job indisponible.')
  }

  async function runBatch(){
    if(!job||runningRef.current)return
    runningRef.current=true
    try{
      const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${job.job.id}/run`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({batchSize:25})})
      const p=await r.json() as Envelope<JobSnapshot>
      if(!r.ok||!p.data)throw new Error(p.error?.message||'Batch impossible.')
      setJob(p.data)
      const status=String(p.data.job.status)
      if(status==='completed')setNotice(`${p.data.job.public_reference||'Import'} terminé avec succès.`)
      if(status==='completed_with_errors')setNotice(`${p.data.job.public_reference||'Import'} terminé avec ${p.data.job.failed_rows||0} échec(s) reprenables.`)
      return p.data
    }catch(error){setAutoRun(false);setNotice(error instanceof Error?error.message:String(error));return null}
    finally{runningRef.current=false}
  }

  useEffect(()=>{
    if(!autoRun||!job)return
    const status=String(job.job.status)
    if(['completed','completed_with_errors','rolled_back'].includes(status)){setAutoRun(false);return}
    const timer=window.setTimeout(()=>void runBatch(),250)
    return()=>window.clearTimeout(timer)
  },[autoRun,job?.job.status,job?.job.processed_rows])

  useEffect(()=>{
    const jobId=new URLSearchParams(window.location.search).get('job')
    if(jobId)void loadJob(jobId).catch(error=>setNotice(error instanceof Error?error.message:String(error)))
  },[])

  async function retryFailures(){if(!job)return;setBusy(true);try{const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${job.job.id}/retry`,{method:'POST'});const p=await r.json() as Envelope<JobSnapshot>;if(!r.ok||!p.data)throw new Error(p.error?.message||'Retry impossible.');setJob(p.data);setAutoRun(true);setNotice('Les lignes échouées ont été remises en file.')}catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}

  async function rollbackJob(){if(!job||!['completed','completed_with_errors'].includes(job.job.status))return;if(!window.confirm('Restaurer les états précédents de toutes les lignes exécutées par ce job ? Cette action est auditée.'))return;setBusy(true);try{const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${job.job.id}/rollback`,{method:'POST'});const p=await r.json() as Envelope<JobSnapshot>;if(!r.ok||!p.data)throw new Error(p.error?.message||'Rollback impossible.');setJob(p.data);setAutoRun(false);setNotice('Rollback canonique terminé et audité.')}catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}

  async function exportJobFailures(){if(!job)return;setBusy(true);try{const all:JobRow[]=[];let page=1;while(true){const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${job.job.id}?failedOnly=1&page=${page}&pageSize=500`,{cache:'no-store'});const p=await r.json() as Envelope<JobSnapshot>;if(!r.ok||!p.data)throw new Error(p.error?.message||'Export impossible.');all.push(...p.data.rows);if(all.length>=p.data.rowCount)break;page++}csvDownload(`${job.job.public_reference||'ANGELCARE_IMPORT'}_FAILURES.csv`,['row_number','status','action','item_key','errors','warnings'],all.map(r=>({row_number:r.row_number,status:r.status,action:r.action,item_key:String(r.normalized_payload?.item_key||''),errors:(r.errors||[]).join(' | '),warnings:(r.warnings||[]).join(' | ')})))}catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}

  function template(){csvDownload(`ANGELCARE_${doctrine}_${importMode}_IMPORT.csv`,targets,[Object.fromEntries(targets.map(t=>[t,'']))]);setNotice(`Template CSV Produit 360 généré · doctrine ${doctrine} · mode ${importMode}.`)}
  async function professionalTemplate(){
    setBusy(true);setNotice('')
    try{
      const module:any=await import('exceljs');const ExcelJS=module.default||module;const workbook=new ExcelJS.Workbook()
      workbook.creator='AngelCare Marketplace Product 360';workbook.created=new Date()
      const sheet=workbook.addWorksheet('Product 360',{views:[{state:'frozen',ySplit:1}]})
      sheet.addRow(targets)
      sheet.addRow(targets.map(()=>''))
      sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,sheet.rowCount),column:targets.length}}
      sheet.getRow(1).font={bold:true};sheet.getRow(1).alignment={vertical:'middle',wrapText:true};sheet.getRow(1).height=34
      for(let i=1;i<=targets.length;i++)sheet.getColumn(i).width=Math.min(34,Math.max(16,targets[i-1].length+3))
      const dictionary=workbook.addWorksheet('Dictionnaire 360',{views:[{state:'frozen',ySplit:1}]})
      dictionary.addRow(['field','label','group','type','doctrine_required','publication_required','canonical_destination','help'])
      const universal=new Map(PRODUCT_360_IMPORT_FIELDS.map(field=>[field.key,field]))
      const doctrineFields=new Map(d.fields.map(field=>[field.key,field]))
      for(const key of targets){const field=universal.get(key),doctrineField=doctrineFields.get(key);dictionary.addRow([key,field?.label||doctrineField?.label||key,field?.group||doctrineField?.group||'doctrine',field?.kind||doctrineField?.type||'text',contract.doctrineRequired.includes(key)?'YES':'NO',contract.publishRequired.includes(key)?'YES':'NO',contract.destinations[key]||'',field?.help||doctrineField?.description||''])}
      dictionary.getRow(1).font={bold:true};dictionary.columns.forEach((column:any)=>{column.width=24})
      const instructions=workbook.addWorksheet('Instructions')
      instructions.addRows([['ANGELCARE PRODUCT 360 BULK INGESTION'],['Doctrine',d.label],['Doctrine key',d.key],['Colonnes canoniques',targets.length],['Règle','Aucune colonne source ne peut être ignorée silencieusement.'],['Mise à jour','Une colonne absente préserve la valeur canonique existante.'],['Publication','Toujours soumise au Product 360 readiness gate serveur.'],['JSON','Utiliser variants_json / media_json / availability_json / price_rules_json pour les collections structurées.']])
      instructions.getColumn(1).width=30;instructions.getColumn(2).width=90;instructions.getRow(1).font={bold:true,size:16}
      instructions.addRows([
        ['Mode d’exécution',importMode],
        ['Contrat template',PRODUCT360_TEMPLATE_CONTRACT],
        ['Généré le',new Date().toISOString()],
        ['Verrou doctrine','Ce classeur rétablira automatiquement sa doctrine et son mode lors du réimport.'],
      ])

      const manifest=workbook.addWorksheet('_ANGELCARE_IMPORT_MANIFEST')
      manifest.addRows([
        ['contract',PRODUCT360_TEMPLATE_CONTRACT],
        ['doctrine_key',d.key],
        ['doctrine_label',d.label],
        ['import_mode',importMode],
        ['generated_at',new Date().toISOString()],
        ['canonical_field_count',String(targets.length)],
      ])
      manifest.state='veryHidden'

      const buffer=await workbook.xlsx.writeBuffer()
      const blob=new Blob(
        [buffer],
        {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
      )
      browserDownload(
        blob,
        `ANGELCARE_${doctrine}_${importMode}_PRODUCT360_TEMPLATE.xlsx`,
      )
      setNotice(
        `Template XLSX Produit 360 généré · ${d.label} · mode ${importMode} · verrou doctrine actif.`,
      )
    }catch(error){setNotice(error instanceof Error?error.message:String(error))}finally{setBusy(false)}
  }
  async function chooseCsv(files:File[]){
    setSelectedFiles(files)
    setFileError('')
    setPreview(null)
    setJob(null)
    setSourceHash('')
    setTemplateLock(null)

    const file=files[0]

    if(!file){
      setSource('')
      setNotice('')
      return
    }

    try{
      const buffer=await file.arrayBuffer()

      if(!buffer.byteLength){
        throw new Error('Le fichier est vide.')
      }

      const hash=await sha256(buffer)
      const isXlsx=
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.type.includes('spreadsheetml')

      const filenameIdentity=templateIdentityFromFilename(file.name)

      let text=''
      let identity:
        | {doctrineKey:string;importMode:ProductImportMode}
        | null=filenameIdentity

      let lockSource:Product360TemplateLock['source']='generated-filename'

      if(isXlsx){
        const payload=await xlsxToImportPayload(buffer)
        text=payload.csv

        if(payload.manifest){
          const workbookIdentity={
            doctrineKey:payload.manifest.doctrineKey,
            importMode:payload.manifest.importMode,
          }

          if(
            filenameIdentity &&
            (
              filenameIdentity.doctrineKey!==workbookIdentity.doctrineKey ||
              filenameIdentity.importMode!==workbookIdentity.importMode
            )
          ){
            throw new Error(
              'Le nom du fichier et le manifeste XLSX Produit 360 se contredisent. Import bloqué.',
            )
          }

          identity=workbookIdentity
          lockSource='xlsx-manifest'
        }
      }else{
        text=new TextDecoder('utf-8').decode(buffer)
      }

      if(!text.trim()){
        throw new Error(
          'Le fichier ne contient aucune donnée exploitable.',
        )
      }

      if(identity){
        const matchedDoctrine=Object.values(PRODUCT_DOCTRINES)
          .find(candidate=>candidate.key===identity?.doctrineKey)

        if(!matchedDoctrine){
          throw new Error(
            `Doctrine du template inconnue: ${identity.doctrineKey}.`,
          )
        }

        setDoctrine(identity.doctrineKey)
        setImportMode(identity.importMode)
        setTemplateLock({
          doctrineKey:identity.doctrineKey,
          importMode:identity.importMode,
          source:lockSource,
        })

        setNotice(
          `Template reconnu et verrouillé · ${matchedDoctrine.label} · mode ${identity.importMode}.`,
        )
      }else{
        setNotice(
          'Fichier externe sans manifeste Produit 360: doctrine et mode restent sous contrôle opérateur.',
        )
      }

      setSourceHash(hash)
      setSource(text)
    }catch(error){
      setSelectedFiles([])
      setSource('')
      setSourceHash('')
      setTemplateLock(null)
      setFileError(
        error instanceof Error
          ? error.message
          : 'Impossible de lire le fichier.',
      )
    }
  }
  function pasteCsv(value:string){setSelectedFiles([]);setFileError('');setSourceHash('');setSource(value)}
  function updateCell(index:number,key:string,value:string){setEditable(rows=>rows.map((row,i)=>i===index?{...row,[key]:value}:row));setPreview(null);setJob(null)}
  function rejected(){if(!preview)return;csvDownload('ANGELCARE_IMPORT_REJECTED.csv',['row','key','name','errors'],preview.rows.filter(r=>!r.valid).map(r=>({row:r.row,key:r.key,name:r.name,errors:r.errors.join(' | ')})))}

  return <div className={styles.command}>
    <section className={styles.hero}><div className={styles.eyebrow}>Marketplace · Product 360 Bulk Ingestion</div><h1 className={styles.title}>Import Produit 360 · mapping déterministe · dry-run réel · exécution reprenable</h1><p className={styles.lead}>Une seule autorité d’ingestion pour créer ou mettre à jour le dossier Produit 360 canonique. Chaque champ reconnu possède une destination réelle, chaque publication traverse le readiness gate et chaque ligne conserve ses preuves avant/après.</p></section>
    <div className={styles.grid2}>
      <section className={styles.panel}><F label="Doctrine"><select className={styles.select} value={doctrine} disabled={Boolean(templateLock)} onChange={e=>setDoctrine(e.target.value)}>{Object.values(PRODUCT_DOCTRINES).map(x=><option value={x.key} key={x.key}>{x.label}</option>)}</select></F><F label="Mode d’exécution"><select className={styles.select} value={importMode} disabled={Boolean(templateLock)} onChange={e=>{setImportMode(e.target.value as ProductImportMode);setPreview(null);setJob(null)}}><option value="upsert">Upsert contrôlé · créer ou mettre à jour</option><option value="create">Création uniquement · refuser l’existant</option><option value="update">Mise à jour uniquement · refuser l’absent</option></select></F><MarketplaceFilePicker accept={PRODUCT_IMPORT_ACCEPT} files={selectedFiles} onFilesChange={(files)=>void chooseCsv(files)} label="Importer CSV / XLSX" description="CSV ou XLSX · première feuille du classeur · aucune exécution automatique"/>{fileError?<div className={styles.notice} role="alert">{fileError}</div>:null}{'parseError' in parsed&&parsed.parseError?<div className={styles.notice} role="alert">{parsed.parseError}</div>:null}<F label="Coller le CSV"><textarea className={styles.textarea} style={{minHeight:260}} value={source} onChange={e=>{setTemplateLock(null);pasteCsv(e.target.value)}} placeholder="Collez ici le contenu CSV…"/></F><div className={styles.toolbar}><button className={styles.buttonSecondary} type="button" onClick={()=>void professionalTemplate()} disabled={busy}><Download size={14}/>Template XLSX Pro</button><button className={styles.buttonSecondary} type="button" onClick={template}><Download size={14}/>Template CSV</button><button className={styles.buttonSecondary} type="button" disabled={!parsed.headers.length} onClick={autoMap}><Wand2 size={14}/>Auto-map</button><button className={styles.button} type="button" disabled={busy||!mappedRows.length||Boolean(unmappedHeaders.length)||Boolean(duplicateTargets.length)} onClick={()=>void dry()}><FileSpreadsheet size={14}/>Dry-run {mappedRows.length}</button></div></section>
      <section className={styles.panel}><div className={styles.panelTitle}><h3>{d.label}</h3><span className={styles.chip}>{parsed.headers.length} colonnes · {editable.length} lignes</span></div><p className={styles.muted}>{d.description}</p><div className={styles.metricGrid}><Metric label="Colonnes 360 disponibles" value={String(contract.columnCount)}/><Metric label="Requises doctrine" value={String(contract.doctrineRequired.length)}/><Metric label="Requises publication" value={String(contract.publishRequired.length)}/><Metric label="Mode" value={importMode}/></div><h4>Champs doctrine requis</h4><div className={styles.toolbar}>{d.requiredColumns.map(x=><span className={styles.chip} key={x}>{x}</span>)}</div>{notice?<div className={styles.notice} style={{marginTop:14}}>{notice}</div>:null}</section>
    </div>

    {parsed.headers.length?<section className={styles.panel}><div className={styles.panelTitle}><h3><TableProperties size={16}/> Mapping de colonnes</h3><span className={styles.chip}>{Object.values(mapping).filter(Boolean).length}/{parsed.headers.length} mappées · {unmappedHeaders.length} non mappée(s)</span></div><div className={styles.mappingGrid}>{parsed.headers.map(h=><div className={styles.mappingRow} key={h}><strong>{h}</strong><span>→</span><select className={styles.select} value={mapping[h]||''} onChange={e=>{setMapping(m=>({...m,[h]:e.target.value}));setPreview(null);setJob(null)}}><option value="">À mapper — blocage dry-run</option>{targets.map(t=><option value={t} key={t}>{t}</option>)}</select></div>)}</div></section>:null}

    {parsed.headers.length&&editable.length?<section className={styles.panel}><div className={styles.panelTitle}><div><h3>Preflight éditable complet</h3><p className={styles.muted}>Toutes les lignes et toutes les colonnes sont accessibles. Pagination = confort opérateur, pas limitation de données.</p></div><div className={styles.toolbar}><button className={styles.buttonSecondary} disabled={editPage<=1} onClick={()=>setEditPage(p=>Math.max(1,p-1))}>←</button><span className={styles.chip}>Page {editPage}/{editPages}</span><button className={styles.buttonSecondary} disabled={editPage>=editPages} onClick={()=>setEditPage(p=>Math.min(editPages,p+1))}>→</button></div></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>#</th>{parsed.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{editable.slice(editStart,editStart+pageSize).map((row,local)=><tr key={editStart+local}><td>{editStart+local+1}</td>{parsed.headers.map(h=><td key={h}><input className={styles.tableInput} value={row[h]||''} onChange={e=>updateCell(editStart+local,h,e.target.value)}/></td>)}</tr>)}</tbody></table></div></section>:null}

    {preview?<section className={styles.panel}><div className={styles.panelTitle}><h3>Dry-run vérifié</h3><div className={styles.toolbar}><span className={styles.chip}>{preview.valid} valides</span><span className={styles.chip}>{preview.creates} créations</span><span className={styles.chip}>{preview.updates} mises à jour</span><span className={styles.chip}>{preview.rejected} rejetées</span>{preview.rejected?<button className={styles.buttonSecondary} onClick={rejected}><Download size={13}/>Rejets CSV</button>:null}<button className={styles.button} disabled={busy||!preview.valid||Boolean(job)} onClick={()=>void createJob()}><CheckCircle2 size={14}/>Créer job persistant</button></div></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>#</th><th>Action</th><th>Key</th><th>Nom</th><th>Validation</th></tr></thead><tbody>{preview.rows.slice(0,300).map(r=><tr key={r.row}><td>{r.row}</td><td><span className={styles.chip}>{r.action}</span></td><td>{r.key}</td><td>{r.name}</td><td>{r.errors.length?<span className={styles.dangerText}>{r.errors.join(' · ')}</span>:r.warnings.length?<span>{r.warnings.join(' · ')}</span>:<span className={styles.successText}>READY</span>}</td></tr>)}</tbody></table></div>{preview.rows.length>300?<p className={styles.muted}>Aperçu limité visuellement à 300 résultats ; les {preview.rows.length} lignes sont incluses dans le job.</p>:null}</section>:null}

    {job?<section className={styles.panel}><div className={styles.panelTitle}><div><div className={styles.eyebrow}>Persistent Bulk Job</div><h3>{job.job.public_reference||job.job.id}</h3><p className={styles.muted}>{job.job.processed_rows||0}/{job.job.total_rows} traitées · {job.job.failed_rows||0} échecs · {job.job.rejected_rows||0} rejetées</p></div><div className={styles.toolbar}><span className={styles.chip}>{job.job.status}</span><button className={styles.buttonSecondary} onClick={()=>void loadJob(job.job.id)}><RefreshCcw size={14}/>Actualiser</button>{['completed','completed_with_errors'].includes(job.job.status)?<a className={styles.buttonSecondary} href={`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${job.job.id}/result`}><Download size={14}/>Résultat CSV</a>:null}{autoRun?<button className={styles.buttonSecondary} onClick={()=>setAutoRun(false)}><PauseCircle size={14}/>Pause</button>:!['completed','completed_with_errors'].includes(job.job.status)?<button className={styles.button} onClick={()=>setAutoRun(true)}><PlayCircle size={14}/>Reprendre</button>:null}{['completed','completed_with_errors'].includes(job.job.status)?<button className={styles.buttonSecondary} disabled={busy} onClick={()=>void rollbackJob()}><RotateCcw size={14}/>Rollback audité</button>:null}{Number(job.job.failed_rows||0)>0?<><button className={styles.buttonSecondary} onClick={()=>void exportJobFailures()}><Download size={14}/>Échecs CSV</button><button className={styles.button} disabled={busy} onClick={()=>void retryFailures()}><RotateCcw size={14}/>Retry échecs</button></>:null}</div></div><div className={styles.bulkProgressTrack}><div className={styles.bulkProgressFill} style={{width:`${Math.max(0,Math.min(100,Number(job.job.progress_percent||0)))}%`}}/></div><div className={styles.metricGrid}><Metric label="Progression" value={`${Number(job.job.progress_percent||0).toFixed(1)}%`}/><Metric label="Valides" value={String(job.job.valid_rows||0)}/><Metric label="Échecs" value={String(job.job.failed_rows||0)}/><Metric label="Rejets doctrine" value={String(job.job.rejected_rows||0)}/></div>{job.rows.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Ligne</th><th>Statut</th><th>Action</th><th>Key</th><th>Résultat</th></tr></thead><tbody>{job.rows.slice(0,100).map(r=><tr key={r.id}><td>{r.row_number}</td><td><span className={styles.chip}>{r.status}</span></td><td>{r.action}</td><td>{String(r.normalized_payload?.item_key||'—')}</td><td>{r.errors?.length?<span className={styles.dangerText}>{r.errors.join(' · ')}</span>:r.object_id?<span className={styles.successText}>{r.object_id}</span>:'—'}</td></tr>)}</tbody></table></div>:null}</section>:null}
  </div>
}

function F({label,children}:{label:string;children:React.ReactNode}){return <div className={styles.field} style={{marginTop:8}}><label>{label}</label>{children}</div>}
function Metric({label,value}:{label:string;value:string}){return <div className={styles.metricCard}><span>{label}</span><strong>{value}</strong></div>}
