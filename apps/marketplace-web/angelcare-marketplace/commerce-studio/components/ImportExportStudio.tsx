'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { AlertTriangle, CheckCircle2, DatabaseZap, Download, FileSpreadsheet, ShieldAlert, Upload } from 'lucide-react'
import { MarketplaceFilePicker } from '../../components/MarketplaceFilePicker'
import styles from '../commerce-studio.module.css'
import { apiRequest, StudioNotice, useStudioMutation } from './StudioClient'

const resources = [
  'catalog-items','catalog-variants','catalog-categories','catalog-item-categories','homepage-collections','homepage-collection-items','homepage-placements','navigation-items','price-rules','catalog-availability','merchandising-rules',
]
const resourceFamily:Record<string,string>={
  'catalog-items':'Catalog','catalog-variants':'Catalog','catalog-categories':'Taxonomy','catalog-item-categories':'Taxonomy','homepage-collections':'Merchandising','homepage-collection-items':'Merchandising','homepage-placements':'Merchandising','navigation-items':'Navigation','price-rules':'Commercial','catalog-availability':'Commercial','merchandising-rules':'Merchandising',
}
const initialSource=JSON.stringify([{name_fr:'Nouvel objet commercial',kind:'product',price_mode:'quote_only'}],null,2)

type PreviewRow={row:number;action:'create'|'update'|'unchanged'|'blocked';id:string|null;changedFields:string[];message:string|null}
type ImportSummary={creates:number;updates:number;unchanged:number;blocked:number;risk:'medium'|'high';resource:string}
interface ImportResult{dryRun:boolean;imported:number;errors:Array<{row:number;message:string}>;previewRows?:PreviewRow[];summary?:ImportSummary;preflightToken?:string}

export function ImportExportStudio(){
  const[resource,setResource]=useState('catalog-items'),[source,setSource]=useState(initialSource),[sourceFormat,setSourceFormat]=useState<'json'|'csv'>('json')
  const[result,setResult]=useState<ImportResult|null>(null),[importFiles,setImportFiles]=useState<File[]>([]),[fileError,setFileError]=useState(''),[acknowledged,setAcknowledged]=useState(false)
  const mutation=useStudioMutation();const importFile=importFiles[0]||null
  const preflightReady=Boolean(result?.dryRun&&result.preflightToken&&result.summary&&result.summary.blocked===0&&!result.errors.length)
  const risk=result?.summary?.risk||(['catalog-items','price-rules','catalog-availability','navigation-items','homepage-placements','merchandising-rules'].includes(resource)?'high':'medium')
  const grouped=useMemo(()=>resources.reduce<Record<string,string[]>>((acc,key)=>{const family=resourceFamily[key]||'Other';(acc[family]??=[]).push(key);return acc},{}),[])

  function invalidate(){setResult(null);setAcknowledged(false)}
  async function chooseImportFile(files:File[]){setImportFiles(files);setFileError('');invalidate();const file=files[0];if(!file){setSource('');return}try{const text=await file.text();if(!text.trim())throw new Error('Le fichier est vide.');setSource(text);setSourceFormat(file.name.toLowerCase().endsWith('.csv')||file.type.includes('csv')?'csv':'json')}catch(error){setImportFiles([]);setFileError(error instanceof Error?error.message:'Impossible de lire le fichier.')}}
  function editSource(value:string){setImportFiles([]);setFileError('');invalidate();setSource(value)}

  async function run(dryRun:boolean){
    if(!dryRun&&(!preflightReady||!acknowledged)){return}
    const token=dryRun?null:result?.preflightToken||null
    let response:ImportResult|null=null
    if(importFile){const form=new FormData();form.set('file',importFile);form.set('dry_run',String(dryRun));if(token)form.set('preflight_token',token);response=await mutation.run(()=>apiRequest<ImportResult>(`/api/angelcare-marketplace/admin/commerce/import/${resource}`,{method:'POST',body:form}),dryRun?'Préflight expert terminé.':'Import expert exécuté.')}
    else if(sourceFormat==='csv'){
      if(!source.trim()){setFileError('Le contenu CSV est vide.');return}
      response=await mutation.run(()=>apiRequest<ImportResult>(`/api/angelcare-marketplace/admin/commerce/import/${resource}?dry_run=${String(dryRun)}`,{method:'POST',headers:{'content-type':'text/csv',...(token?{'x-import-preflight-token':token}:{})},body:source}),dryRun?'Préflight CSV terminé.':'CSV expert exécuté.')
    }else{
      let records:unknown;try{records=JSON.parse(source)}catch{setFileError('JSON invalide.');return}
      response=await mutation.run(()=>apiRequest<ImportResult>(`/api/angelcare-marketplace/admin/commerce/import/${resource}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({records,dry_run:dryRun,preflight_token:token})}),dryRun?'Préflight JSON terminé.':'Import expert exécuté.')
    }
    if(response){setResult(response);if(dryRun)setAcknowledged(false)}
  }

  return <main className={styles.shell}>
    <section className={styles.expertImportHero} data-risk={risk}>
      <div><span>ADVANCED · DIRECT REGISTRY OPERATIONS</span><h1>Commerce Expert — diff obligatoire avant mutation.</h1><p>Cette surface agit directement sur les registres Commerce. Pour l’onboarding normal d’un produit, service ou cours, utilisez Product 360 ou Category-Native.</p></div>
      <aside><ShieldAlert size={24}/><strong>{risk==='high'?'HIGH BLAST RADIUS':'CONTROLLED BLAST RADIUS'}</strong><small>Pas d’exécution sans dry-run valide sur la source exacte.</small></aside>
    </section>

    <section className={styles.expertImportLayout}>
      <aside className={styles.expertResourceRail}>
        <div className={styles.expertRailHeading}><DatabaseZap size={18}/><div><strong>Registre cible</strong><small>11 autorités structurées</small></div></div>
        {Object.entries(grouped).map(([family,items])=><section key={family}><span>{family}</span>{items.map(entry=><button key={entry} type="button" data-active={resource===entry} onClick={()=>{setResource(entry);invalidate()}}>{entry}</button>)}</section>)}
        <div className={styles.expertExportLinks}><a href={`/api/angelcare-marketplace/admin/commerce/export/${resource}`}><Download size={14}/>CSV</a><a href={`/api/angelcare-marketplace/admin/commerce/export/${resource}?format=json`}><Download size={14}/>JSON</a></div>
      </aside>

      <section className={styles.expertSourcePanel}>
        <header><div><span>01 · SOURCE</span><h2>{resource}</h2></div><em>{resourceFamily[resource]}</em></header>
        <MarketplaceFilePicker accept=".csv,.json,text/csv,application/json" files={importFiles} onFilesChange={(files)=>void chooseImportFile(files)} label="Choisir CSV ou JSON" description="10 Mo · 5 000 lignes maximum · aucun write au chargement"/>
        {fileError?<p className={styles.errorNotice} role="alert">{fileError}</p>:null}
        <label className={styles.field}><span>Format du contenu collé</span><select value={sourceFormat} onChange={event=>{setImportFiles([]);setSourceFormat(event.target.value as 'json'|'csv');setSource(event.target.value==='csv'?'':initialSource);invalidate()}}><option value="json">JSON</option><option value="csv">CSV</option></select></label>
        <label className={styles.field}><span>{sourceFormat==='csv'?'Coller le CSV':'Coller le JSON'}</span><textarea className={styles.codeEditor} value={source} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>editSource(event.target.value)} rows={18}/></label>
        <button type="button" className={styles.primaryAction} disabled={mutation.saving||!source.trim()} onClick={()=>void run(true)}><FileSpreadsheet size={16}/>Lancer le préflight obligatoire</button>
        <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
      </section>

      <section className={styles.expertImpactPanel}>
        <header><div><span>02 · BLAST RADIUS</span><h2>Impact calculé</h2></div>{result?.dryRun?<CheckCircle2 size={20}/>:<AlertTriangle size={20}/>}</header>
        {result?.summary?<>
          <div className={styles.expertMetricGrid}><article><strong>{result.summary.creates}</strong><span>CREATE</span></article><article><strong>{result.summary.updates}</strong><span>UPDATE</span></article><article><strong>{result.summary.unchanged}</strong><span>UNCHANGED</span></article><article data-risk={result.summary.blocked>0}><strong>{result.summary.blocked}</strong><span>BLOCKED</span></article></div>
          <div className={styles.expertDiffList}>{(result.previewRows||[]).slice(0,150).map(row=><article key={row.row} data-action={row.action}><span>#{row.row}</span><strong>{row.action.toUpperCase()}</strong><small>{row.id||'nouvel objet'}</small><em>{row.message||`${row.changedFields.length} champ(s) modifié(s)`}</em></article>)}</div>
          {(result.previewRows||[]).length>150?<p className={styles.expertNote}>Aperçu limité à 150 lignes; le jeton couvre l’intégralité de la source.</p>:null}
        </>:<div className={styles.expertEmpty}><FileSpreadsheet size={28}/><strong>Aucun préflight</strong><p>La mutation reste verrouillée jusqu’à un diff serveur valide.</p></div>}
      </section>
    </section>

    {result?.dryRun?<section className={styles.expertExecutionGate} data-ready={preflightReady}>
      <div><span>03 · EXECUTION GATE</span><h2>{preflightReady?'Source prête pour écriture':'Source bloquée'}</h2><p>{preflightReady?'Le jeton de préflight est lié au registre et au contenu exact. Toute modification de source invalide ce passage.':`${result.summary?.blocked||0} blocage(s) · ${result.errors.length} erreur(s). Corrigez et relancez le dry-run.`}</p></div>
      <label><input type="checkbox" checked={acknowledged} disabled={!preflightReady} onChange={event=>setAcknowledged(event.target.checked)}/><span>J’ai examiné le diff et le blast radius de <strong>{resource}</strong>.</span></label>
      <button className={styles.dangerAction} type="button" disabled={!preflightReady||!acknowledged||mutation.saving} onClick={()=>void run(false)}><Upload size={16}/>Exécuter le lot expert</button>
    </section>:null}
  </main>
}
