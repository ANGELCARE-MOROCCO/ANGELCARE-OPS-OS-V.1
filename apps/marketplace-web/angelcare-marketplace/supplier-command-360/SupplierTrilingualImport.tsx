'use client'
import Link from 'next/link'
import {useEffect,useMemo,useState} from 'react'
import {ArrowLeft,ArrowRight,CheckCircle2,Download,FileSpreadsheet,Globe2,Languages,Link2,PackageCheck,Search,ShieldCheck,UploadCloud,AlertTriangle,RefreshCcw} from 'lucide-react'
import {ProductImportStudio} from '../enterprise-command/components/ProductImportStudio'
import {PRODUCT_DOCTRINES} from '../enterprise-command/product-doctrine'
import {canonicalProductImportKey,productImportColumns} from '../enterprise-command/product-360-contract'
import css from './trilingual-import.module.css'

type Row=Record<string,string>
type Supplier={id:string;supplier_code:string;display_name:string;status:string;quality_status:string}
type Receipt={item_key:string;catalogId?:string;offerId?:string;status:'linked'|'failed';message:string}
const root='/api/angelcare-marketplace/admin/supplier-command-360/trilingual-import'
const supplierKeys=['supplier_id','supplier_sku','supplier_unit_cost','supplier_currency','supplier_moq'] as const
const localized=['name','short_description','description','seo_title','seo_description'] as const
const essential=['item_key','name_fr','name_en','name_ar','short_description_fr','short_description_en','short_description_ar','description_fr','description_en','description_ar','seo_title_fr','seo_title_en','seo_title_ar','seo_description_fr','seo_description_en','seo_description_ar','supplier_sku','supplier_unit_cost','supplier_currency','supplier_moq'] as const
const template=[
 'item_key','slug','sku','name_fr','name_en','name_ar','short_description_fr','short_description_en','short_description_ar','description_fr','description_en','description_ar',
 'primary_category_key','category_keys','primary_image_reference','gallery_references','price_mode','price_amount','currency_label','availability_status',
 'seo_title_fr','seo_title_en','seo_title_ar','seo_description_fr','seo_description_en','seo_description_ar',
 'fulfillment_mode','fulfillment_lead_time','fulfillment_delivery_method','fulfillment_capacity_model','fulfillment_customer_handover',
 'trust_headline','trust_certifications','trust_guarantees','trust_safety_information','trust_provider_requirements',
 'inventory_mode','delivery_mode',...supplierKeys.filter(k=>k!=='supplier_id'),
]
function csvRows(text:string):{headers:string[];rows:Row[]}{
 const raw=text.replace(/^\uFEFF/,'')
 if(!raw.trim())return{headers:[],rows:[]}
 const delimiters=[',',';','\t'] as const;let sep:','|';'|'\t'=','
 let best=-1
 for(const char of delimiters){let count=0,quoted=false;for(let i=0;i<raw.length;i++){const c=raw[i];if(c==='"'){if(quoted&&raw[i+1]==='"')i++;else quoted=!quoted}else if((c==='\n'||c==='\r')&&!quoted)break;else if(c===char&&!quoted)count++}if(count>best){best=count;sep=char}}
 const records:string[][]=[];let row:string[]=[],cell='',quoted=false
 for(let i=0;i<raw.length;i++){const c=raw[i];if(c==='"'){if(quoted&&raw[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===sep&&!quoted){row.push(cell);cell=''}else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&raw[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))records.push(row);row=[];cell=''}else cell+=c}
 if(quoted)throw Error('CSV : guillemet non fermé')
 row.push(cell);if(row.some(x=>x.trim()))records.push(row)
 if(!records.length)return{headers:[],rows:[]}
 const headers=records.shift()!.map(x=>x.trim());if(headers.some(x=>!x))throw Error('CSV : en-tête vide')
 const canonical=headers.map(h=>supplierKeys.includes(h as typeof supplierKeys[number])?h:canonicalProductImportKey(h))
 const duplicates=canonical.filter((v,i)=>canonical.indexOf(v)!==i)
 if(duplicates.length)throw Error('Colonnes doublonnées après mapping : '+[...new Set(duplicates)].join(', '))
 const rows=records.map((cells,i)=>{
  if(cells.length>headers.length)throw Error(`Ligne ${i+2} : trop de colonnes`)
  return Object.fromEntries(headers.map((h,j)=>[canonical[j],cells[j]??'']))
 })
 return{headers:canonical,rows}
}
function encodeCSV(headers:string[],rows:Row[]):string{
 const quote=(v:string)=>'"'+String(v??'').replaceAll('"','""')+'"'
 return '\uFEFF'+[headers,...rows.map(row=>headers.map(h=>row[h]||''))].map(c=>c.map(quote).join(',')).join('\r\n')
}
function save(name:string,content:string){const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}
async function api(body?:unknown):Promise<any>{const r=await fetch(root,{method:body?'POST':'GET',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined,credentials:'same-origin',cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok||j.error)throw Error(j.error?.message||'API fournisseur indisponible');return j.data}
export function SupplierTrilingualImport(){
 const [suppliers,setSuppliers]=useState<Supplier[]>([]),[supplierId,setSupplierId]=useState(''),[doctrine,setDoctrine]=useState<'physical_product'|'kit'>('physical_product')
 const [text,setText]=useState(''),[fileName,setFileName]=useState(''),[stage,setStage]=useState<'review'|'import'|'link'|'publish'>('review'),[version,setVersion]=useState(0)
 const [filter,setFilter]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[receipts,setReceipts]=useState<Receipt[]>([])
 useEffect(()=>{api().then(x=>setSuppliers(x.suppliers||[])).catch(e=>setError(e.message))},[])
 const parsed=useMemo(()=>{try{return {...csvRows(text),error:''}}catch(e){return {headers:[] as string[],rows:[] as Row[],error:e instanceof Error?e.message:String(e)}}},[text])
 const allowed=useMemo(()=>new Set(productImportColumns(PRODUCT_DOCTRINES[doctrine])),[doctrine])
 const unknown=parsed.headers.filter(x=>!allowed.has(x)&&!(supplierKeys as readonly string[]).includes(x))
 const validated=useMemo(()=>parsed.rows.map((row,i)=>{
  const issues:string[]=[]
  for(const key of essential)if(!String(row[key]||'').trim())issues.push(key)
  if(!/^\d+(\.\d{1,8})?$/.test(row.supplier_unit_cost||'')||Number(row.supplier_unit_cost)<=0)issues.push('coût positif')
  if(!/^\d+(\.\d{1,8})?$/.test(row.supplier_moq||'')||Number(row.supplier_moq)<=0)issues.push('MOQ positif')
  if(!/^[A-Z]{3}$/.test(row.supplier_currency||''))issues.push('devise ISO')
  if(!row.supplier_id&&!supplierId)issues.push('fournisseur sélectionné')
  if(row.supplier_id&&!suppliers.some(x=>x.id===row.supplier_id))issues.push('supplier_id inconnu')
  if(row.price_mode&&row.price_mode!=='quote_only')issues.push('price_mode doit être quote_only (ONE WORLD paiement non activé)')
  if(row.price_amount)issues.push('price_amount doit être vide (conversion publique non activée)')
  return {index:i+2,row,issues:[...new Set(issues)]}
 }),[parsed.rows,supplierId,suppliers])
 const valid=parsed.rows.length>0&&!parsed.error&&unknown.length===0&&validated.every(x=>x.issues.length===0)&&new Set(parsed.rows.map(x=>x.item_key)).size===parsed.rows.length
 const canonical=useMemo(()=>{
  const headers=parsed.headers.filter(x=>allowed.has(x)&&!supplierKeys.includes(x as typeof supplierKeys[number]))
  if(!headers.includes('price_mode'))headers.push('price_mode')
  if(!headers.includes('currency_label'))headers.push('currency_label')
  return encodeCSV(headers,parsed.rows.map(x=>({...x,price_mode:'quote_only',price_amount:'',currency_label:'Dh'})))
 },[parsed,allowed])
 const filtered=validated.filter(x=>[x.row.item_key,x.row.name_fr,x.row.name_en,x.row.name_ar,x.row.supplier_sku].join(' ').toLowerCase().includes(filter.toLowerCase()))
 const candidates=receipts.filter(x=>x.status==='linked'&&x.catalogId)
 function downloadTemplate(){save(`ANGELCARE_SC360_${doctrine}_FR_EN_AR_UPSERT.csv`,encodeCSV(template,[{price_mode:'quote_only',currency_label:'Dh',supplier_currency:'USD',supplier_moq:'1',availability_status:'configuration_required'}]))}
 async function link(){setBusy(true);setError('');setNotice('');const out:Receipt[]=[];try{
  for(let i=0;i<parsed.rows.length;i+=100){const batch=parsed.rows.slice(i,i+100).map(x=>({item_key:x.item_key,supplier_id:x.supplier_id||supplierId,supplier_sku:x.supplier_sku,supplier_unit_cost:x.supplier_unit_cost,supplier_currency:x.supplier_currency,supplier_moq:x.supplier_moq}));const result=await api({rows:batch});out.push(...result.rows);setReceipts([...out]);setNotice(`Liaison ${out.length}/${parsed.rows.length} · ${out.filter(x=>x.status==='linked').length} réussies`)}
  setStage('publish')
 }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 async function publish(item:Receipt){if(!item.catalogId)return;setBusy(true);setError('');try{const r=await fetch('/api/angelcare-marketplace/admin/supplier-command-360/product-launch',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({action:'publish',catalogId:item.catalogId})});const data=await r.json();if(!r.ok||data.error)throw Error(data.error?.message||'Publication bloquée');setNotice(`${item.item_key} : publication canonique confirmée`)}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 return <div className={css.shell}>
  <div className={css.breadcrumb}><Link href="/angelcare-marketplace/admin/supplier-command-360"><ArrowLeft size={15}/> Supplier Command 360</Link> <span>/</span> Import multilingue</div>
  <header className={css.hero}><div><div className={css.eyebrow}><Languages size={15}/> ANGELCARE · SUPPLIER SOURCE → PRODUCT 360 → PUBLICATION</div><h1>Import produits fournisseurs <em>FR · EN · AR</em></h1><p>Un seul CSV fournisseur. Le véritable moteur d'import atomic Product 360. Liaison fournisseur et publication contrôlée, sans catalogue parallèle.</p></div><div className={css.mode}><ShieldCheck size={16}/> PRIX CLIENT SUR DEVIS · SHADOW</div></header>
  <div className={css.metrics}><article><span>LIGNES FOURNISSEUR</span><b>{parsed.rows.length}</b></article><article><span>VALIDATION TRI-LANGUE</span><b>{validated.filter(x=>!x.issues.length).length}</b></article><article><span>ERREURS AVANT IMPORT</span><b>{validated.filter(x=>x.issues.length).length+unknown.length}</b></article><article><span>OFFRES LIÉES</span><b>{candidates.length}</b></article></div>
  {error&&<div role="alert" className={css.error}><AlertTriangle size={17}/>{error}<button onClick={()=>setError('')}>Fermer</button></div>}{notice&&<div className={css.good}><CheckCircle2 size={17}/>{notice}</div>}
  <nav className={css.steps}>{([['review','01 · Préparer le CSV'],['import','02 · Import atomic Product 360'],['link','03 · Lier les offres'],['publish','04 · Publier les produits']] as const).map(([s,label])=><button type="button" key={s} className={stage===s?css.selected:css.step} onClick={()=>setStage(s)}>{label}</button>)}</nav>
  {stage==='review'&&<div className={css.cards}><section className={css.card}><h2><FileSpreadsheet size={18}/> Fichier source & fournisseur</h2><p>Choisissez un fournisseur qualifié. Les colonnes vendeur restent privées; toutes les autres utilisent les noms canoniques du moteur atomic Product 360.</p><div className={css.two}><label>Doctrine produit<select value={doctrine} onChange={e=>{setDoctrine(e.target.value as 'physical_product'|'kit');setReceipts([])}}><option value="physical_product">Produit physique</option><option value="kit">Kit éducatif & matériel</option></select></label><label>Fournisseur<select value={supplierId} onChange={e=>setSupplierId(e.target.value)}><option value="">Sélectionner…</option>{suppliers.filter(x=>['active','approved'].includes(x.status)&&['approved','conditional'].includes(x.quality_status)).map(x=><option key={x.id} value={x.id}>{x.display_name} · {x.supplier_code}</option>)}</select></label></div><div className={css.buttons}><button onClick={downloadTemplate}><Download size={16}/> Télécharger le modèle FR/EN/AR</button><label className={css.file}><UploadCloud size={16}/>{fileName||'Ouvrir CSV UTF-8'}<input type="file" accept=".csv,text/csv" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;setText(await f.text());setFileName(f.name);setReceipts([]);setNotice('')}}/></label></div><p className={css.tip}>Acceptation : noms, résumés et descriptions en trois langues; SKU fabricant, coût, MOQ et devise. Les textes et certificats sont fournis par votre équipe, jamais inventés par le système.</p></section>
  <section className={css.card}><h2><Globe2 size={18}/> Contrôle éditorial et publication</h2><div className={css.rule}><b>FR · EN · AR</b><span>15 champs de contenu et SEO obligatoires par ligne.</span></div><div className={css.rule}><b>Product 360 natif</b><span>Mapping, preview, jobs, retry, rollback et readiness existants.</span></div><div className={css.rule}><b>Prix et conformité</b><span>Devis uniquement jusqu’à intégration ONE WORLD / PayPal. Médias publics distincts des preuves privées fournisseur.</span></div></section></div>}
  {stage==='review'&&<section className={css.card}><div className={css.bar}><h2><Search size={18}/> Vérification des lignes <span className={css.count}>{parsed.rows.length}</span></h2><input placeholder="Filtrer SKU ou produit…" value={filter} onChange={e=>setFilter(e.target.value)}/></div>{parsed.error&&<p className={css.error}>{parsed.error}</p>}{unknown.length>0&&<p className={css.error}>Colonnes sans destination Product 360 : {unknown.join(', ')}</p>}{!parsed.rows.length?<p className={css.empty}>Importez un CSV pour voir la validation détaillée.</p>:<div className={css.scroller}><table><thead><tr><th>Ligne</th><th>Clé</th><th>Français</th><th>English</th><th>العربية</th><th>SKU source</th><th>Résultat</th></tr></thead><tbody>{filtered.slice(0,200).map(x=><tr key={x.index}><td>{x.index}</td><td>{x.row.item_key}</td><td>{x.row.name_fr}</td><td>{x.row.name_en}</td><td dir="rtl">{x.row.name_ar}</td><td>{x.row.supplier_sku}</td><td>{x.issues.length?<span className={css.fail}>{x.issues.join(' · ')}</span>:<span className={css.pass}>Pré-validé</span>}</td></tr>)}</tbody></table></div>}{valid&&<div className={css.good}><CheckCircle2 size={16}/> Pré-validation fournisseur et langues réussie. Le moteur Product 360 effectue ensuite toutes ses validations métier.</div>}<div className={css.actions}><button disabled={!valid} className={css.primary} onClick={()=>{setStage('import');setVersion(v=>v+1)}}>Continuer vers le vrai import atomic <ArrowRight size={17}/></button></div></section>}
  {stage==='import'&&<section className={css.card}><div className={css.bar}><h2><PackageCheck size={18}/> Import canonical Product 360</h2><button onClick={()=>setStage('review')}>Modifier le CSV</button></div>{!valid?<p className={css.error}>Le CSV fournisseur doit être valide avant import.</p>:<><p className={css.tip}>Importez via le composant officiel ci-dessous : aperçu des lignes, mapping, création du job, exécution résumable, erreurs, retry et rollback. **N'effectuez la liaison que lorsque le job est terminé.**</p><ProductImportStudio key={`${version}-${doctrine}`} initialSource={canonical} initialDoctrine={doctrine}/><div className={css.actions}><button onClick={()=>setStage('link')} className={css.primary}>Mon job Product 360 est terminé <ArrowRight size={17}/></button></div></>}</section>}
  {stage==='link'&&<section className={css.card}><h2><Link2 size={18}/> Synchroniser les offres fournisseurs</h2><p>Recherchez chaque <code>item_key</code> réellement créé par le job Product 360. La liaison est faite par le serveur et n'invente jamais de produit. Les offres restent en brouillon et nécessitent leur propre approbation.</p><div className={css.actions}><button className={css.primary} disabled={!valid||busy} onClick={()=>void link()}>{busy?<RefreshCcw size={15}/>:<Link2 size={16}/>} Vérifier et lier {parsed.rows.length} produit(s)</button></div>{receipts.length>0&&<div className={css.scroller}><table><thead><tr><th>Produit</th><th>Résultat</th><th>Canonical ID</th><th>Détail</th></tr></thead><tbody>{receipts.map(x=><tr key={x.item_key}><td>{x.item_key}</td><td>{x.status}</td><td>{x.catalogId||'—'}</td><td>{x.message}</td></tr>)}</tbody></table></div>}</section>}
  {stage==='publish'&&<section className={css.card}><h2><ShieldCheck size={18}/> Dossiers produits, revue & publication</h2><p>Pour chaque produit, terminez la fiche Product 360, approuvez l'offre fournisseur, puis utilisez le contrôle de publication. Le serveur bloque un produit incomplet et toute publication de prix encaissable en USD.</p>{!receipts.length?<div className={css.empty}>Aucune liaison validée. Ouvrez l'étape 03 pour synchroniser avec les produits réellement importés.</div>:<div className={css.scroller}><table><thead><tr><th>Produit</th><th>Offre</th><th>Fiche canonique</th><th>Publication</th></tr></thead><tbody>{receipts.map(x=><tr key={x.item_key}><td><b>{x.item_key}</b><small>{x.message}</small></td><td>{x.offerId||'—'}</td><td>{x.catalogId?<Link href={`/angelcare-marketplace/admin/catalog/items/${x.catalogId}/overview`}><PackageCheck size={14}/> Product 360</Link>:'Échec liaison'}</td><td>{x.catalogId?<><Link href={`/angelcare-marketplace/admin/catalog/items/${x.catalogId}/publication`}>Voir les contrôles</Link><button disabled={busy} className={css.publish} onClick={()=>void publish(x)}>Publier si prêt</button></>:'—'}</td></tr>)}</tbody></table></div>}</section>}
  <footer className={css.foot}>Fournisseurs privés · Produit canonique unique · FR / EN / AR · Publication contrôlée · Aucune modification de checkout, PayPal ou ONE WORLD</footer>
 </div>
}
