'use client'

import { useEffect,useMemo,useRef,useState } from 'react'
import { CheckCircle2,Download,FileSpreadsheet,PauseCircle,PlayCircle,RefreshCcw,RotateCcw,TableProperties,UploadCloud,Wand2 } from 'lucide-react'
import { PRODUCT_DOCTRINES } from '../product-doctrine'
import type { ProductImportPreview } from '../types'
import styles from '../enterprise-command.module.css'

type Row=Record<string,string>
type Envelope<T>={data:T;error?:{message?:string}}
type JobRow={id:string;row_number:number;status:string;action:string;object_id?:string|null;errors?:unknown[];warnings?:unknown[];normalized_payload?:Record<string,unknown>}
type ImportJob={id:string;public_reference?:string;status:string;total_rows:number;valid_rows:number;rejected_rows:number;processed_rows?:number;failed_rows?:number;progress_percent?:number;result?:Record<string,unknown>;created_at?:string;completed_at?:string|null}
type JobSnapshot={job:ImportJob;rows:JobRow[];rowCount:number;page:number;pageSize:number}

function parseCsv(text:string){
  const lines=text.trim().split(/\r?\n/).filter(Boolean)
  const parse=(line:string)=>{const out:string[]=[];let v='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){v+='"';i++}else q=!q}else if(c===','&&!q){out.push(v);v=''}else v+=c}out.push(v);return out}
  if(!lines.length)return{headers:[] as string[],rows:[] as Row[]}
  const headers=parse(lines[0]).map(v=>v.trim())
  return{headers,rows:lines.slice(1).map(line=>Object.fromEntries(parse(line).map((v,i)=>[headers[i]||`column_${i+1}`,v])))}
}
function csvDownload(name:string,headers:string[],data:Array<Record<string,unknown>>){
  const quote=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`
  const lines=[headers.map(quote).join(','),...data.map(row=>headers.map(h=>quote(row[h])).join(','))]
  const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)
}

export function ProductImportStudio(){
  const[doctrine,setDoctrine]=useState('one_time_service')
  const[source,setSource]=useState('')
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
  const parsed=useMemo(()=>parseCsv(source),[source])
  const d=PRODUCT_DOCTRINES[doctrine as keyof typeof PRODUCT_DOCTRINES]
  const targets=useMemo(()=>[...d.requiredColumns,...d.optionalColumns,...d.fields.map(f=>f.key)].filter((v,i,a)=>a.indexOf(v)===i),[d])
  const editPages=Math.max(1,Math.ceil(editable.length/pageSize))
  const editStart=(editPage-1)*pageSize

  useEffect(()=>{
    const auto=Object.fromEntries(parsed.headers.map(h=>[h,targets.includes(h)?h:'']))
    setMapping(auto);setEditable(parsed.rows.map(r=>({...r})));setPreview(null);setEditPage(1);setJob(null);setAutoRun(false)
  },[source,doctrine])

  const mappedRows=useMemo(()=>editable.map(row=>{const out:Row={};for(const[sourceKey,target]of Object.entries(mapping))if(target)out[target]=row[sourceKey]??'';return out}),[editable,mapping])

  function autoMap(){const normalized=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]/g,'');const next:Record<string,string>={};for(const h of parsed.headers){next[h]=targets.find(t=>normalized(t)===normalized(h))||targets.find(t=>normalized(t).includes(normalized(h))||normalized(h).includes(normalized(t)))||''}setMapping(next);setPreview(null)}
  async function dry(){setBusy(true);setNotice('');try{const r=await fetch('/api/angelcare-marketplace/admin/enterprise-command/product-import/preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({doctrineKey:doctrine,rows:mappedRows})});const p=await r.json() as Envelope<ProductImportPreview>;if(r.ok&&p.data)setPreview(p.data);else setNotice(p.error?.message||'Validation impossible.')}finally{setBusy(false)}}

  async function createJob(){
    if(!preview||!preview.valid)return
    setBusy(true);setNotice('')
    try{
      const idempotencyKey=`product-import:${doctrine}:${crypto.randomUUID()}`
      const r=await fetch('/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({doctrineKey:doctrine,rows:mappedRows,idempotencyKey})})
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
    if(['completed','completed_with_errors'].includes(status)){setAutoRun(false);return}
    const timer=window.setTimeout(()=>void runBatch(),250)
    return()=>window.clearTimeout(timer)
  },[autoRun,job?.job.status,job?.job.processed_rows])

  useEffect(()=>{
    const jobId=new URLSearchParams(window.location.search).get('job')
    if(jobId)void loadJob(jobId).catch(error=>setNotice(error instanceof Error?error.message:String(error)))
  },[])

  async function retryFailures(){if(!job)return;setBusy(true);try{const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${job.job.id}/retry`,{method:'POST'});const p=await r.json() as Envelope<JobSnapshot>;if(!r.ok||!p.data)throw new Error(p.error?.message||'Retry impossible.');setJob(p.data);setAutoRun(true);setNotice('Les lignes échouées ont été remises en file.')}catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}

  async function exportJobFailures(){if(!job)return;setBusy(true);try{const all:JobRow[]=[];let page=1;while(true){const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${job.job.id}?failedOnly=1&page=${page}&pageSize=500`,{cache:'no-store'});const p=await r.json() as Envelope<JobSnapshot>;if(!r.ok||!p.data)throw new Error(p.error?.message||'Export impossible.');all.push(...p.data.rows);if(all.length>=p.data.rowCount)break;page++}csvDownload(`${job.job.public_reference||'ANGELCARE_IMPORT'}_FAILURES.csv`,['row_number','status','action','item_key','errors','warnings'],all.map(r=>({row_number:r.row_number,status:r.status,action:r.action,item_key:String(r.normalized_payload?.item_key||''),errors:(r.errors||[]).join(' | '),warnings:(r.warnings||[]).join(' | ')})))}catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}

  function template(){csvDownload(`ANGELCARE_${doctrine}_IMPORT.csv`,targets,[Object.fromEntries(targets.map(t=>[t,'']))])}
  function updateCell(index:number,key:string,value:string){setEditable(rows=>rows.map((row,i)=>i===index?{...row,[key]:value}:row));setPreview(null);setJob(null)}
  function rejected(){if(!preview)return;csvDownload('ANGELCARE_IMPORT_REJECTED.csv',['row','key','name','errors'],preview.rows.filter(r=>!r.valid).map(r=>({row:r.row,key:r.key,name:r.name,errors:r.errors.join(' | ')})))}

  return <div className={styles.command}>
    <section className={styles.hero}><div className={styles.eyebrow}>Industrial Product / Service PIM Import</div><h1 className={styles.title}>Doctrine Import Studio · mapping · full preflight · resumable jobs</h1><p className={styles.lead}>Chaque ligne est validée par doctrine, persistée dans un job reprenable, traitée par lots et traçable jusqu’au résultat canonique. Un échec de ligne ne détruit pas l’import complet.</p></section>
    <div className={styles.grid2}>
      <section className={styles.panel}><F label="Doctrine"><select className={styles.select} value={doctrine} onChange={e=>setDoctrine(e.target.value)}>{Object.values(PRODUCT_DOCTRINES).map(x=><option value={x.key} key={x.key}>{x.label}</option>)}</select></F><F label="CSV"><textarea className={styles.textarea} style={{minHeight:260}} value={source} onChange={e=>setSource(e.target.value)} placeholder="Collez un CSV ou importez un fichier…"/></F><div className={styles.toolbar}><label className={styles.buttonSecondary}><UploadCloud size={14}/>Importer CSV<input hidden type="file" accept=".csv,text/csv" onChange={async e=>setSource(await e.target.files?.[0]?.text()||'')}/></label><button className={styles.buttonSecondary} onClick={template}><Download size={14}/>Template doctrine</button><button className={styles.buttonSecondary} disabled={!parsed.headers.length} onClick={autoMap}><Wand2 size={14}/>Auto-map</button><button className={styles.button} disabled={busy||!mappedRows.length} onClick={()=>void dry()}><FileSpreadsheet size={14}/>Dry-run {mappedRows.length}</button></div></section>
      <section className={styles.panel}><div className={styles.panelTitle}><h3>{d.label}</h3><span className={styles.chip}>{parsed.headers.length} colonnes · {editable.length} lignes</span></div><p className={styles.muted}>{d.description}</p><h4>Champs requis</h4><div className={styles.toolbar}>{d.requiredColumns.map(x=><span className={styles.chip} key={x}>{x}</span>)}</div>{notice?<div className={styles.notice} style={{marginTop:14}}>{notice}</div>:null}</section>
    </div>

    {parsed.headers.length?<section className={styles.panel}><div className={styles.panelTitle}><h3><TableProperties size={16}/> Mapping de colonnes</h3><span className={styles.chip}>{Object.values(mapping).filter(Boolean).length}/{parsed.headers.length} mappées</span></div><div className={styles.mappingGrid}>{parsed.headers.map(h=><div className={styles.mappingRow} key={h}><strong>{h}</strong><span>→</span><select className={styles.select} value={mapping[h]||''} onChange={e=>{setMapping(m=>({...m,[h]:e.target.value}));setPreview(null);setJob(null)}}><option value="">Ignorer</option>{targets.map(t=><option value={t} key={t}>{t}</option>)}</select></div>)}</div></section>:null}

    {parsed.headers.length&&editable.length?<section className={styles.panel}><div className={styles.panelTitle}><div><h3>Preflight éditable complet</h3><p className={styles.muted}>Toutes les lignes et toutes les colonnes sont accessibles. Pagination = confort opérateur, pas limitation de données.</p></div><div className={styles.toolbar}><button className={styles.buttonSecondary} disabled={editPage<=1} onClick={()=>setEditPage(p=>Math.max(1,p-1))}>←</button><span className={styles.chip}>Page {editPage}/{editPages}</span><button className={styles.buttonSecondary} disabled={editPage>=editPages} onClick={()=>setEditPage(p=>Math.min(editPages,p+1))}>→</button></div></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>#</th>{parsed.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{editable.slice(editStart,editStart+pageSize).map((row,local)=><tr key={editStart+local}><td>{editStart+local+1}</td>{parsed.headers.map(h=><td key={h}><input className={styles.tableInput} value={row[h]||''} onChange={e=>updateCell(editStart+local,h,e.target.value)}/></td>)}</tr>)}</tbody></table></div></section>:null}

    {preview?<section className={styles.panel}><div className={styles.panelTitle}><h3>Dry-run vérifié</h3><div className={styles.toolbar}><span className={styles.chip}>{preview.valid} valides</span><span className={styles.chip}>{preview.creates} créations</span><span className={styles.chip}>{preview.updates} mises à jour</span><span className={styles.chip}>{preview.rejected} rejetées</span>{preview.rejected?<button className={styles.buttonSecondary} onClick={rejected}><Download size={13}/>Rejets CSV</button>:null}<button className={styles.button} disabled={busy||!preview.valid||Boolean(job)} onClick={()=>void createJob()}><CheckCircle2 size={14}/>Créer job persistant</button></div></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>#</th><th>Action</th><th>Key</th><th>Nom</th><th>Validation</th></tr></thead><tbody>{preview.rows.slice(0,300).map(r=><tr key={r.row}><td>{r.row}</td><td><span className={styles.chip}>{r.action}</span></td><td>{r.key}</td><td>{r.name}</td><td>{r.errors.length?<span className={styles.dangerText}>{r.errors.join(' · ')}</span>:r.warnings.length?<span>{r.warnings.join(' · ')}</span>:<span className={styles.successText}>READY</span>}</td></tr>)}</tbody></table></div>{preview.rows.length>300?<p className={styles.muted}>Aperçu limité visuellement à 300 résultats ; les {preview.rows.length} lignes sont incluses dans le job.</p>:null}</section>:null}

    {job?<section className={styles.panel}><div className={styles.panelTitle}><div><div className={styles.eyebrow}>Persistent Bulk Job</div><h3>{job.job.public_reference||job.job.id}</h3><p className={styles.muted}>{job.job.processed_rows||0}/{job.job.total_rows} traitées · {job.job.failed_rows||0} échecs · {job.job.rejected_rows||0} rejetées</p></div><div className={styles.toolbar}><span className={styles.chip}>{job.job.status}</span><button className={styles.buttonSecondary} onClick={()=>void loadJob(job.job.id)}><RefreshCcw size={14}/>Actualiser</button>{['completed','completed_with_errors'].includes(job.job.status)?<a className={styles.buttonSecondary} href={`/api/angelcare-marketplace/admin/enterprise-command/product-import/jobs/${job.job.id}/result`}><Download size={14}/>Résultat CSV</a>:null}{autoRun?<button className={styles.buttonSecondary} onClick={()=>setAutoRun(false)}><PauseCircle size={14}/>Pause</button>:!['completed','completed_with_errors'].includes(job.job.status)?<button className={styles.button} onClick={()=>setAutoRun(true)}><PlayCircle size={14}/>Reprendre</button>:null}{Number(job.job.failed_rows||0)>0?<><button className={styles.buttonSecondary} onClick={()=>void exportJobFailures()}><Download size={14}/>Échecs CSV</button><button className={styles.button} disabled={busy} onClick={()=>void retryFailures()}><RotateCcw size={14}/>Retry échecs</button></>:null}</div></div><div className={styles.bulkProgressTrack}><div className={styles.bulkProgressFill} style={{width:`${Math.max(0,Math.min(100,Number(job.job.progress_percent||0)))}%`}}/></div><div className={styles.metricGrid}><Metric label="Progression" value={`${Number(job.job.progress_percent||0).toFixed(1)}%`}/><Metric label="Valides" value={String(job.job.valid_rows||0)}/><Metric label="Échecs" value={String(job.job.failed_rows||0)}/><Metric label="Rejets doctrine" value={String(job.job.rejected_rows||0)}/></div>{job.rows.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Ligne</th><th>Statut</th><th>Action</th><th>Key</th><th>Résultat</th></tr></thead><tbody>{job.rows.slice(0,100).map(r=><tr key={r.id}><td>{r.row_number}</td><td><span className={styles.chip}>{r.status}</span></td><td>{r.action}</td><td>{String(r.normalized_payload?.item_key||'—')}</td><td>{r.errors?.length?<span className={styles.dangerText}>{r.errors.join(' · ')}</span>:r.object_id?<span className={styles.successText}>{r.object_id}</span>:'—'}</td></tr>)}</tbody></table></div>:null}</section>:null}
  </div>
}

function F({label,children}:{label:string;children:React.ReactNode}){return <div className={styles.field} style={{marginTop:8}}><label>{label}</label>{children}</div>}
function Metric({label,value}:{label:string;value:string}){return <div className={styles.metricCard}><span>{label}</span><strong>{value}</strong></div>}
