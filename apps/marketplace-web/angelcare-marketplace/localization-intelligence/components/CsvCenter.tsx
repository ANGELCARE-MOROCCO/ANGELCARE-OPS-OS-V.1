'use client'

import { useMemo, useState } from 'react'
import styles from '../localization.module.css'

type TargetLocale='en'|'ar'
type InventoryRow=Record<string,unknown>
type ParsedRow=Record<string,string>

const REQUIRED_HEADERS=['candidate_id','source_text_fr','source_hash','target_locale','proposed_translation'] as const

function csvCell(value:unknown){const text=String(value??'');return /[",\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text}
function parseCsv(text:string){
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false
  for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')quoted=false;else cell+=ch}else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=ch}
  if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}
  if(!rows.length)return []
  const header=rows[0].map((value)=>value.replace(/^\uFEFF/,'').trim())
  return rows.slice(1).filter((values)=>values.some(Boolean)).map((values)=>Object.fromEntries(header.map((key,index)=>[key,values[index]??''])) as ParsedRow)
}
function download(name:string,content:string){const blob=new Blob([`\uFEFF${content}`],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}

export function CsvCenter(){
  const [fileName,setFileName]=useState('Aucun fichier sélectionné.')
  const [parsed,setParsed]=useState<ParsedRow[]>([])
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const [valid,setValid]=useState(false)
  const summary=useMemo(()=>parsed.length?`${parsed.length} ligne(s) chargée(s).`:'Aucun import en mémoire.',[parsed.length])

  async function exportLocale(locale:TargetLocale){
    setBusy(true);setMessage('')
    try{
      const response=await fetch('/api/angelcare-marketplace/localization/inventory?page=1&pageSize=250')
      const payload=await response.json() as {data?:InventoryRow[];error?:{message?:string}}
      if(!response.ok||payload.error)throw new Error(payload.error?.message||'Export impossible.')
      const rows=(payload.data||[]).filter((row)=>String(row[`translation_${locale}`]??row.target_locale??'')!==locale||!String(row[`translation_${locale}`]??'').trim())
      const header=['candidate_id','translation_key','domain','route','source_text_fr','source_hash','target_locale','proposed_translation','reviewer_note']
      const lines=[header,...rows.map((row)=>[row.candidate_id??row.id??'',row.translation_key??'',row.domain??'',row.route??'',row.source_text_fr??'',row.source_hash??'',locale,'',''])].map((row)=>row.map(csvCell).join(','))
      download(`angelcare-localization-${locale}-${new Date().toISOString().slice(0,10)}.csv`,lines.join('\n'))
      setMessage(`Export ${locale.toUpperCase()} préparé depuis l’inventaire courant (${rows.length} ligne(s)).`)
    }catch(error){setMessage(error instanceof Error?error.message:'Export impossible.')}finally{setBusy(false)}
  }

  async function chooseFile(file:File|null){
    setValid(false);setParsed([]);setMessage('')
    if(!file){setFileName('Aucun fichier sélectionné.');return}
    setFileName(file.name)
    try{const rows=parseCsv(await file.text());setParsed(rows);setMessage(`${rows.length} ligne(s) prêtes pour dry-run.`)}catch{setMessage('CSV illisible ou invalide.')}
  }

  function dryRun(){
    if(!parsed.length){setValid(false);setMessage('Chargez un CSV avant le dry-run.');return}
    const errors:string[]=[]
    parsed.forEach((row,index)=>{for(const key of REQUIRED_HEADERS)if(!row[key]?.trim())errors.push(`L${index+2}: ${key} manquant`);if(row.target_locale&&!['en','ar'].includes(row.target_locale))errors.push(`L${index+2}: target_locale doit être en ou ar`)})
    setValid(errors.length===0);setMessage(errors.length?`Dry-run refusé: ${errors.slice(0,8).join(' · ')}${errors.length>8?' …':''}`:`Dry-run PASS: ${parsed.length} ligne(s), en-têtes et champs obligatoires valides.`)
  }

  async function applyImport(){
    if(!valid||!parsed.length)return
    setBusy(true);setMessage('')
    try{
      let applied=0
      for(const row of parsed){
        const response=await fetch('/api/angelcare-marketplace/localization/final?mode=translations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({command:'translation.save',candidateId:row.candidate_id,targetLocale:row.target_locale,translationText:row.proposed_translation})})
        const payload=await response.json() as {error?:{message?:string}}
        if(!response.ok||payload.error)throw new Error(`Ligne ${applied+2}: ${payload.error?.message||'échec import'}`)
        applied++
      }
      setMessage(`Import appliqué avec audit: ${applied}/${parsed.length} traduction(s) enregistrée(s) en brouillon.`);setValid(false)
    }catch(error){setMessage(error instanceof Error?error.message:'Import impossible.')}finally{setBusy(false)}
  }

  return <div className={styles.page}><section className={styles.hero}><div className={styles.eyebrow}>CSV FULFILLMENT BRIDGE</div><h1>Exporter, contrôler en dry-run, puis injecter sous autorité.</h1><p>L’export provient de l’inventaire courant. L’import vérifie les en-têtes et champs obligatoires puis utilise l’API Localization gouvernée; chaque traduction importée reste en brouillon avant revue et publication.</p></section><section className={styles.cards}><article className={styles.command}><h3>Exporter EN</h3><p className={styles.muted}>Inventaire courant, source française, hash et cible EN.</p><button type="button" className={styles.button} onClick={()=>void exportLocale('en')} disabled={busy}>Préparer l’export EN</button></article><article className={styles.command}><h3>Exporter AR</h3><p className={styles.muted}>Inventaire courant, UTF‑8 et cible AR.</p><button type="button" className={styles.button} onClick={()=>void exportLocale('ar')} disabled={busy}>Préparer l’export AR</button></article><article className={styles.command}><h3>Importer un CSV</h3><input type="file" accept=".csv,text/csv" onChange={e=>void chooseFile(e.target.files?.[0]||null)}/><p className={styles.muted}>{fileName} · {summary}</p><div className={styles.toolbar}><button type="button" className={styles.button} onClick={dryRun} disabled={busy||!parsed.length}>Valider en dry-run</button><button type="button" className={`${styles.button} ${styles.secondary}`} onClick={()=>void applyImport()} disabled={busy||!valid}>Appliquer l’import validé</button></div>{message?<p className={styles.muted}>{message}</p>:null}</article></section></div>
}
