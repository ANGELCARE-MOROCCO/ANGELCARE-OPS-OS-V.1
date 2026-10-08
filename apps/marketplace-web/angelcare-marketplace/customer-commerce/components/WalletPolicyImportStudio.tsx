'use client'

import { useMemo, useState } from 'react'
import { CircleDollarSign, Download, FileCheck2, ShieldAlert, UploadCloud } from 'lucide-react'
import { CSV_FILE_ACCEPT, MarketplaceFilePicker } from '../../components/MarketplaceFilePicker'
import { useGovernedAction } from '../../shells/GovernedActionProvider'
import styles from '../customer-commerce.module.css'

type ImportRow={row:number;status:string;action?:'create'|'update'|'unchanged'|'blocked';error?:string;policy_key?:string;customer_email?:string}
type ImportResult={mode:'validate'|'upsert';total:number;valid:number;invalid:number;creates:number;updates:number;unchanged:number;preflightToken:string;rows:ImportRow[]}
type Envelope<T>={data?:T;error?:{message?:string}}
const template='policy_key,customer_email,starts_at,ends_at,status\nwallet_member,client@example.com,,,active\n'
async function submit(csvText:string,mode:'validate'|'upsert',reason?:string,preflightToken?:string){const response=await fetch('/api/angelcare-marketplace/admin/wallet/imports',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({csvText,mode,reason,preflightToken})});const payload=await response.json().catch(()=>({})) as Envelope<ImportResult>;if(!response.ok||!payload.data)throw new Error(payload.error?.message||'Import Wallet impossible.');return payload.data}

export function WalletPolicyImportStudio(){
 const requestAction=useGovernedAction(),[csvText,setCsvText]=useState(''),[selectedFiles,setSelectedFiles]=useState<File[]>([]),[result,setResult]=useState<ImportResult|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null)
 const executable=Boolean(result&&result.mode==='validate'&&result.invalid===0&&result.preflightToken)
 const blockers=useMemo(()=>result?.rows.filter(row=>row.status==='invalid')||[],[result])
 async function run(mode:'validate'|'upsert'){
  if(!csvText.trim())return;let reason=''
  if(mode==='upsert'){
   if(!executable||!result)return
   const confirmed=await requestAction({title:'Exécuter l’import des affectations Wallet',objectLabel:`${result.creates} création(s) · ${result.updates} mise(s) à jour · ${result.unchanged} inchangée(s)`,currentState:'préflight exact validé',nextState:'assignments upserted',consequence:'Les politiques Wallet sont affectées uniquement aux clients et politiques résolus. La source est liée au jeton de préflight.',permission:'marketplace.finance.price_books.manage',danger:true})
   if(!confirmed)return;reason=confirmed
  }
  setBusy(true);setError(null)
  try{setResult(await submit(csvText,mode,reason||undefined,mode==='upsert'?result?.preflightToken:undefined))}catch(value){setError(value instanceof Error?value.message:'Import impossible.')}finally{setBusy(false)}
 }
 function downloadTemplate(){const url=URL.createObjectURL(new Blob([template],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='ac-wallet-policy-assignments.csv';anchor.click();URL.revokeObjectURL(url)}
 async function chooseCsv(files:File[]){setSelectedFiles(files);setResult(null);setError(null);const file=files[0];if(!file){setCsvText('');return}try{const text=await file.text();if(!text.trim())throw new Error('Le fichier est vide.');setCsvText(text)}catch(value){setSelectedFiles([]);setCsvText('');setError(value instanceof Error?value.message:'Impossible de lire le fichier.')}}
 function pasteCsv(value:string){setSelectedFiles([]);setResult(null);setError(null);setCsvText(value)}
 return <section className={styles.walletImportPro}>
  <header className={styles.walletImportHeader}><div><span>FINANCIAL INGESTION · WALLET</span><h2>Affectations massives avec impact avant écriture.</h2><p>Le préflight résout chaque policy_key et customer_email, détecte doublons et périodes invalides, puis verrouille la source exacte avant upsert.</p></div><button className={styles.secondaryButton} type="button" onClick={downloadTemplate}><Download size={15}/>Template CSV</button></header>
  <div className={styles.walletImportGrid}>
   <section className={styles.walletSourceCard}><CircleDollarSign size={21}/><h3>01 · Source</h3><MarketplaceFilePicker accept={CSV_FILE_ACCEPT} files={selectedFiles} onFilesChange={(files)=>void chooseCsv(files)} label="Importer le fichier CSV" description="5 000 lignes max · dry-run obligatoire · aucune écriture au chargement"/><label><span>Coller le CSV</span><textarea rows={9} value={csvText} onChange={event=>pasteCsv(event.target.value)} placeholder="policy_key,customer_email,starts_at,ends_at,status"/></label><button className={styles.secondaryButton} disabled={busy||!csvText.trim()} onClick={()=>void run('validate')}><FileCheck2 size={15}/>Valider / dry-run</button>{error?<div className={styles.error} role="alert">{error}</div>:null}</section>
   <section className={styles.walletImpactCard}><ShieldAlert size={21}/><h3>02 · Impact financier</h3>{result?<><div className={styles.walletImpactMetrics}><article><strong>{result.creates}</strong><span>CREATE</span></article><article><strong>{result.updates}</strong><span>UPDATE</span></article><article><strong>{result.unchanged}</strong><span>UNCHANGED</span></article><article data-risk={result.invalid>0}><strong>{result.invalid}</strong><span>BLOCKED</span></article></div><div className={styles.walletRowPreview}>{result.rows.slice(0,120).map(row=><article key={row.row} data-state={row.status}><span>#{row.row}</span><strong>{row.action||row.status}</strong><small>{row.customer_email||row.error||'validated'}</small></article>)}</div></>:<div className={styles.walletEmpty}><strong>Aucun préflight</strong><p>L’exécution financière reste verrouillée.</p></div>}</section>
  </div>
  {result?<footer className={styles.walletExecutionGate} data-ready={executable}><div><strong>{executable?'READY FOR GOVERNED UPSERT':'BLOCKED'}</strong><span>{result.valid}/{result.total} lignes valides · jeton de préflight {result.preflightToken?'présent':'absent'}</span></div><button className={styles.primaryButton} disabled={busy||!executable} onClick={()=>void run('upsert')}><UploadCloud size={15}/>Exécuter le lot validé</button></footer>:null}
  {blockers.length?<p className={styles.error}>{blockers.length} ligne(s) doivent être corrigées avant exécution.</p>:null}
 </section>
}
