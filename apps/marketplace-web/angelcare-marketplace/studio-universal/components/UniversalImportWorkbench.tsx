'use client'

import type { Data } from '@puckeditor/core'
import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Globe2, Import, ShieldCheck, X } from 'lucide-react'
import { compileUniversalExperience } from '../import-compiler'
import { fingerprintsInData, rekeyComponent } from '../puck-bridge'
import type { StudioImportCandidate, StudioImportMode, StudioPickerData } from '../types'
import { StudioCandidatePreview } from './StudioCandidatePreview'
import styles from './studio-workspace.module.css'

type Props={open:boolean;currentData:Data;pickers:StudioPickerData;onClose:()=>void;onApply:(data:Data,summary:string)=>Promise<void>}
async function json<T>(response:Response):Promise<T>{const body=await response.json();if(!response.ok)throw new Error(body?.error?.message||body?.error||'Import impossible');return (body?.data??body) as T}

export function UniversalImportWorkbench({open,currentData,pickers,onClose,onApply}:Props){
  const [mode,setMode]=useState<'url'|'html'|'file'>('url')
  const [source,setSource]=useState('')
  const [css,setCss]=useState('')
  const [label,setLabel]=useState('')
  const [candidate,setCandidate]=useState<StudioImportCandidate|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [applyMode,setApplyMode]=useState<StudioImportMode>('append')
  const [reviewAccepted,setReviewAccepted]=useState(false)
  const [previewOpen,setPreviewOpen]=useState(true)
  const existing=useMemo(()=>fingerprintsInData(currentData),[currentData])
  if(!open)return null

  async function analyze(){
    setBusy(true);setError('')
    try{
      let html=source,sourceLabel=label||'Import manuel',sourceType:'html'|'url'|'file'=mode==='url'?'url':mode==='file'?'file':'html',capturedCss=css
      if(mode==='url'){
        const data=await json<{html:string;css:string;finalUrl:string}>(await fetch('/api/angelcare-marketplace/cms/studio/capture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:source})}))
        html=data.html;capturedCss=[data.css,css].filter(Boolean).join('\n');sourceLabel=data.finalUrl
      }else if(mode==='file'&&!source.trim()) throw new Error('Chargez le contenu du fichier avant analyse.')
      const next=compileUniversalExperience({html,css:capturedCss,sourceType,sourceLabel})
      setCandidate(next);setReviewAccepted(false);setPreviewOpen(true)
      setApplyMode(next.strategy==='full-page'?'replace':existing.has(next.sourceFingerprint)?'update':'append')
    }catch(e){setError(e instanceof Error?e.message:'Analyse impossible')}
    finally{setBusy(false)}
  }

  function merged():Data{
    if(!candidate)return currentData
    const incoming=[...(candidate.data.content||[])],current=[...(currentData.content||[])]
    if(applyMode==='replace')return {...candidate.data,root:{...(candidate.data.root||{}),props:{...((candidate.data.root as any)?.props||{}),__studioImportMode:'replace'}}} as Data
    if(applyMode==='variant')return {...currentData,content:[...current,...incoming.map(row=>rekeyComponent(row,Date.now().toString(36)))]}
    if(applyMode==='update'){
      const filtered=current.filter(row=>String((row.props as any)?.__studioSourceFingerprint||'')!==candidate.sourceFingerprint)
      return {...currentData,content:[...filtered,...incoming]}
    }
    return {...currentData,content:[...current,...incoming]}
  }

  async function apply(){
    if(!candidate||!candidate.safeToApply||(candidate.reviewCodes.length>0&&!reviewAccepted))return
    setBusy(true);setError('')
    try{await onApply(merged(),`Import ${candidate.sourceLabel} · ${applyMode} · fidélité ${candidate.fidelity.overall}%`);onClose()}
    catch(e){setError(e instanceof Error?e.message:'Application impossible')}
    finally{setBusy(false)}
  }

  return <div className={styles.modalBackdrop}><section className={styles.importModal} role="dialog" aria-modal="true" aria-label="Universal Import"><header><div><span>UNIVERSAL IMPORT</span><h2>Reconstruire sans exécuter le code source</h2></div><button onClick={onClose} aria-label="Fermer"><X size={18}/></button></header><div className={styles.importBody}>
    <nav className={styles.importTabs}>{(['url','html','file'] as const).map(key=><button key={key} data-active={mode===key} onClick={()=>setMode(key)}>{key==='url'?<Globe2 size={14}/>:<Import size={14}/>} {key.toUpperCase()}</button>)}</nav>
    {mode==='url'?<label><span>URL publique</span><input value={source} onChange={e=>setSource(e.target.value)} placeholder="https://…"/></label>:<label><span>{mode==='file'?'Fichier HTML / CSS':'HTML source'}</span>{mode==='file'?<><input type="file" accept=".html,.htm,.css,text/html,text/css" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const content=await file.text();setLabel(file.name);if(file.name.toLowerCase().endsWith('.css')){setCss(content);setSource('<main><section><h1>Import CSS</h1><p>Associez ce style à une source HTML pour reconstruire la page.</p></section></main>')}else setSource(content)}}/><textarea rows={6} value={source} onChange={e=>setSource(e.target.value)} placeholder="Le contenu du fichier apparaît ici pour revue avant analyse."/></>:<textarea rows={9} value={source} onChange={e=>setSource(e.target.value)}/>}</label>}
    <label><span>CSS complémentaire · optionnel</span><textarea rows={5} value={css} onChange={e=>setCss(e.target.value)}/></label>
    <button className={styles.primary} disabled={busy||!source.trim()} onClick={analyze}>{busy?'Analyse…':'Analyser la source'}</button>
    {error?<div className={styles.error}><AlertTriangle size={15}/>{error}</div>:null}

    {candidate?<div className={styles.candidate}>
      <div className={styles.candidateHead}><div><span>CANDIDATE</span><strong>{candidate.strategy==='full-page'?'Page complète':'Fragment'} · {candidate.fidelity.overall}%</strong></div>{candidate.safeToApply?<CheckCircle2 size={24}/>:<AlertTriangle size={24}/>}</div>
      <div className={styles.scoreGrid}>{Object.entries(candidate.fidelity).map(([key,value])=><div key={key}><span>{key}</span><b>{value}%</b></div>)}</div>
      <dl className={styles.lossGrid}><div><dt>Nœuds source</dt><dd>{candidate.lossBudget.sourceMeaningfulNodes}</dd></div><div><dt>Non possédés</dt><dd>{candidate.lossBudget.unownedMeaningfulNodes}</dd></div><div><dt>Double consommation</dt><dd>{candidate.lossBudget.doubleConsumedNodes}</dd></div><div><dt>CSS déclarations</dt><dd>{candidate.lossBudget.css.declarationsTotal}</dd></div><div><dt>CSS review</dt><dd>{candidate.lossBudget.css.reviewDeclarations}</dd></div><div><dt>Assets manquants</dt><dd>{candidate.lossBudget.missingAssets}</dd></div></dl>

      <div className={styles.auditCards}>
        <article><span>ACCESSIBILITÉ</span><strong>{candidate.accessibility.score}%</strong><small>{candidate.accessibility.critical} critique · {candidate.accessibility.warnings} avertissement(s)</small></article>
        <article><span>SEO</span><strong>H1 × {candidate.seo.h1Count}</strong><small>{candidate.seo.title||'Titre source absent'}</small></article>
        <article><span>SHELL</span><strong>{candidate.shell.detected?'Détecté':'Aucun'}</strong><small>{candidate.shell.detected?'Shell global AngelCare protégé par défaut.':'Aucune contamination shell.'}</small></article>
        <article><span>INTERACTIONS</span><strong>{candidate.interactions.length}</strong><small>{candidate.interactions.map(row=>row.kind).join(' · ')||'Aucune interaction spéciale'}</small></article>
      </div>

      {candidate.accessibility.issues.length?<div className={styles.review}><ShieldCheck size={16}/><div><strong>Audit accessibilité</strong><p>{candidate.accessibility.issues.map(issue=>`${issue.code} ×${issue.count}`).join(' · ')}</p></div></div>:null}
      {candidate.shell.detected?<div className={styles.review}><ShieldCheck size={16}/><div><strong>Protection du shell global</strong><p>Header/navigation/footer source ne remplacent jamais automatiquement les autorités AngelCare. Politique: {candidate.shell.defaultPolicy}.</p></div></div>:null}

      <button className={styles.secondary} onClick={()=>setPreviewOpen(v=>!v)}>{previewOpen?'Masquer':'Afficher'} le candidat rendu</button>
      {previewOpen?<StudioCandidatePreview data={candidate.data} pickers={pickers}/>:null}

      {candidate.reviewCodes.length?<div className={styles.review}><ShieldCheck size={16}/><div><strong>Revue requise</strong><p>{candidate.reviewCodes.join(' · ')}</p><label><input type="checkbox" checked={reviewAccepted} onChange={e=>setReviewAccepted(e.target.checked)}/> J’ai examiné les pertes, capacités avancées, accessibilité, shell et avertissements de ce candidat.</label></div></div>:null}
      {candidate.blockingCodes.length?<div className={styles.error}><AlertTriangle size={15}/>{candidate.blockingCodes.join(' · ')}</div>:null}
      {existing.has(candidate.sourceFingerprint)?<div className={styles.review}><strong>Source déjà présente.</strong><span> Update remplace uniquement les blocs issus de cette empreinte; Variant re-clé les blocs; Append exige un choix explicite.</span></div>:null}
      <label><span>Mode d’application</span><select value={applyMode} onChange={e=>setApplyMode(e.target.value as StudioImportMode)}><option value="replace">Remplacer la composition</option><option value="append">Ajouter à la page</option><option value="update">Mettre à jour cette source</option><option value="variant">Créer une variante</option></select></label>
      <button className={styles.primary} disabled={busy||!candidate.safeToApply||(candidate.reviewCodes.length>0&&!reviewAccepted)} onClick={apply}>Appliquer le candidat</button>
    </div>:null}
  </div></section></div>
}
