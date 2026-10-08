'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { Boxes,FileSpreadsheet,PackageSearch,RefreshCcw,UploadCloud } from 'lucide-react'
import styles from '../enterprise-command.module.css'
type Row=Record<string,unknown>;type Envelope<T>={data:T}
function num(v:unknown){return Number(v||0)}
export function BulkOperationsCenter(){
  const[jobs,setJobs]=useState<Row[]>([])
  const load=()=>fetch('/api/angelcare-marketplace/admin/enterprise-command/bulk-operations',{cache:'no-store'}).then(r=>r.json()).then((p:Envelope<Row[]>)=>setJobs(p.data||[])).catch(()=>{})
  useEffect(()=>{void load()},[])
  return <div className={styles.command}>
    <section className={styles.hero}><div className={styles.eyebrow}>Industrial Bulk Operations Center</div><h1 className={styles.title}>Jobs massifs persistants · dry-run · progression · reprise · résultat</h1><p className={styles.lead}>Le Bulk Center fédère les moteurs spécialisés, et le Doctrine Import fonctionne désormais comme un job durable : chaque ligne est traçable, un échec est isolé, et le traitement peut être repris sans recommencer le fichier entier.</p></section>
    <div className={styles.commandCards}>
      <Link className={styles.commandCard} href="/angelcare-marketplace/admin/catalog/import"><PackageSearch/><strong>Doctrine Product Import</strong><span>Mapping, préflight complet, jobs reprenables, progression, échecs exportables et retry.</span></Link>
      <Link className={styles.commandCard} href="/angelcare-marketplace/admin/commerce-studio/import-export"><FileSpreadsheet/><strong>Structured Commerce Import / Export</strong><span>Catalog, variants, categories, collections, placements, navigation, pricing, availability et merchandising.</span></Link>
      <Link className={styles.commandCard} href="/angelcare-marketplace/admin/localization/imports"><UploadCloud/><strong>Localization Imports</strong><span>Import de contenu et localisation dans son moteur spécialisé.</span></Link>
      <Link className={styles.commandCard} href="/angelcare-marketplace/admin/category-native/imports"><Boxes/><strong>Category-Native Imports</strong><span>Imports spécialisés liés aux expériences verticales et catégories.</span></Link>
    </div>
    <div className={styles.panel}>
      <div className={styles.panelTitle}><div><h3>Journal des jobs Enterprise Command</h3><p className={styles.muted}>Le job reste en base même si l’opérateur ferme la page. Les imports doctrine peuvent être repris depuis ce registre.</p></div><button className={styles.buttonSecondary} onClick={load}><RefreshCcw size={14}/>Actualiser</button></div>
      {jobs.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Job</th><th>Ressource</th><th>Statut</th><th>Progression</th><th>Qualité</th><th>Commande</th></tr></thead><tbody>{jobs.map((j,i)=>{const progress=Math.max(0,Math.min(100,num(j.progress_percent)));const isProduct=String(j.operation_type)==='product_doctrine_import';return <tr key={String(j.id||i)}><td><strong>{String(j.public_reference||j.operation_type||'Bulk')}</strong><br/><span className={styles.muted}>{j.created_at?new Date(String(j.created_at)).toLocaleString('fr-FR'):''}</span></td><td>{String(j.resource_type||'—')}<br/><span className={styles.muted}>{String(j.doctrine_key||'—')}</span></td><td><span className={styles.chip}>{String(j.status||'—')}</span></td><td style={{minWidth:170}}><div className={styles.bulkProgressTrack} style={{margin:'0 0 6px'}}><div className={styles.bulkProgressFill} style={{width:`${progress}%`}}/></div><span className={styles.muted}>{progress.toFixed(1)}% · {num(j.processed_rows)}/{num(j.total_rows)}</span></td><td>{num(j.valid_rows)} valides<br/><span className={num(j.failed_rows)?styles.dangerText:styles.muted}>{num(j.failed_rows)} échecs · {num(j.rejected_rows)} rejets</span></td><td>{isProduct?<Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/catalog/import?job=${String(j.id)}`}>Ouvrir / reprendre</Link>:<span className={styles.muted}>Moteur spécialisé</span>}</td></tr>})}</tbody></table></div>:<p className={styles.muted}>Aucun job Enterprise Command enregistré.</p>}
    </div>
  </div>
}
