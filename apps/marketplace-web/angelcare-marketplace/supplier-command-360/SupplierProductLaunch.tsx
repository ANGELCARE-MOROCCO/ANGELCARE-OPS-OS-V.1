'use client'
import Link from 'next/link'
import {useEffect,useState,useCallback} from 'react'
import {ArrowLeft,ArrowRight,CheckCircle2,ClipboardCheck,ExternalLink,Globe2,PackagePlus,RefreshCcw,ShieldAlert,UploadCloud} from 'lucide-react'
import s from './product-launch.module.css'

type Row=Record<string,any>
type Snapshot={suppliers:Row[];categories:Row[];product:Row|null;offers:Row[];readiness:{ready:boolean;checks:Record<string,boolean>;reasons:string[]}|null;publicVisible:boolean;mode:string;publicCurrencyBridge:string}
const root='/api/angelcare-marketplace/admin/supplier-command-360/product-launch'
async function api(action?:Row,productId?:string):Promise<any>{
 const r=await fetch(action?root:root+(productId?'?catalogId='+encodeURIComponent(productId):''),{method:action?'POST':'GET',headers:{'content-type':'application/json'},credentials:'same-origin',cache:'no-store',body:action?JSON.stringify(action):undefined});const j=await r.json().catch(()=>({}));if(!r.ok||j.error)throw Error(j.error?.message||'API indisponible');return j.data
}
async function sc(action:string,payload:Row):Promise<any>{
 const r=await fetch('/api/angelcare-marketplace/admin/supplier-command-360',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({action,payload,idempotencyKey:crypto.randomUUID(),reason:'Lancement produit fournisseur R2'})});const j=await r.json().catch(()=>({}));if(!r.ok||j.error)throw Error(j.error?.message||'Commande source indisponible');return j.data
}
export function SupplierProductLaunch(){
 const [data,setData]=useState<Snapshot|null>(null),[supplierId,setSupplierId]=useState(''),[id,setId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [nameFr,setNameFr]=useState(''),[shortFr,setShortFr]=useState(''),[descriptionFr,setDescriptionFr]=useState(''),[sku,setSku]=useState(''),[unitCost,setUnitCost]=useState(''),[currency,setCurrency]=useState('USD'),[moq,setMoq]=useState('1')
 const refresh=useCallback(async(productId?:string):Promise<Snapshot>=>{
  const snapshot:Snapshot=await api(undefined,productId)
  setData(snapshot)
  return snapshot
 },[])
 useEffect(()=>{const existing=new URLSearchParams(window.location.search).get('catalogId')||'';if(existing)setId(existing);refresh(existing||undefined).then(d=>{const offer=d.offers?.[0];if(offer){setSupplierId(String(offer.supplier_id));setSku(String(offer.supplier_sku||''));}else if(d.product?.commercial_metadata?.supplier_id){setSupplierId(String(d.product.commercial_metadata.supplier_id));setSku(String(d.product.sku||''))}}).catch(e=>setError(e.message))},[refresh])
 const eligible=(data?.suppliers||[]).filter(x=>['approved','active'].includes(x.status)&&['approved','conditional'].includes(x.quality_status));
 async function run(fn:()=>Promise<void>){setBusy(true);setError('');setSuccess('');try{await fn()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 async function create(){await run(async()=>{if(!supplierId)throw Error('Sélectionner un fournisseur approuvé');const result=await api({action:'createDraft',supplierId,nameFr,shortFr,descriptionFr,sku});setId(result.catalogId);window.history.replaceState(null,'','?catalogId='+encodeURIComponent(result.catalogId));setSuccess('Produit canonique créé en brouillon. Il faut désormais lier une offre fournisseur.');await refresh(result.catalogId)})}
 async function linkOffer(){await run(async()=>{if(!id)throw Error('Dossier produit requis');if(!supplierId)throw Error('Choisir le fournisseur');if(!/^\d+(\.\d+)?$/.test(unitCost)||!/^\d+(\.\d+)?$/.test(moq)||!unitCost)throw Error('Coût et MOQ numériques requis');await sc('offer.save',{supplierId,catalogId:id,sku,unitCost,moq,currency});setSuccess('Offre fournisseur enregistrée sur le produit canonique en BROUILLON.');await refresh(id)})}
 async function publish(){await run(async()=>{const result=await api({action:'publish',catalogId:id});setSuccess('Publication canonique confirmée : '+result.slug);await refresh(id)})}
 const product=data?.product;const ready=data?.readiness;
 return <div className={s.root}>
  <div className={s.breadcrumb}><Link href="/angelcare-marketplace/admin/supplier-command-360"><ArrowLeft size={15}/> Supplier Command 360</Link><span> / </span><b>Product Launch Bridge</b></div>
  <header className={s.hero}><div><p className={s.kicker}>ANGELCARE · FOURNISSEUR → PRODUCT 360 → BOUTIQUE</p><h1>Lancement produit fournisseur</h1><p>Créer un produit canonique, relier son fournisseur, compléter Product 360 et publier uniquement via l'autorité Marketplace.</p></div><span className={s.pill}><ShieldAlert size={16}/> Publication contrôlée · Prix USD encaissable non activé</span></header>
  {error&&<div className={s.error}>{error}</div>}{success&&<div className={s.good}><CheckCircle2 size={16}/>{success}</div>}
  <div className={s.grid}><section className={s.card}>
   <h2><span>01</span> Fournisseur qualifié</h2><p>Seuls les fournisseurs approuvés avec validation qualité peuvent créer un dossier produit.</p>
   <label>Fournisseur<select value={supplierId} disabled={busy||Boolean(id)} onChange={e=>setSupplierId(e.target.value)}><option value="">Sélectionner…</option>{eligible.map(x=><option key={x.id} value={x.id}>{x.display_name} · {x.supplier_code}</option>)}</select></label>
   {!eligible.length&&<div className={s.notice}>Aucun fournisseur qualifié. Ouvrez Fournisseurs 360 pour créer le fournisseur, ajouter ses preuves et l'approuver.</div>}
   <h2><span>02</span> Nouveau produit canonique</h2>
   <div className={s.fields}><label>Nom français<input value={nameFr} disabled={busy||Boolean(id)} onChange={e=>setNameFr(e.target.value)} placeholder="Kit de cartes Montessori – Animaux"/></label><label>SKU interne<input value={sku} disabled={busy||Boolean(id)} onChange={e=>setSku(e.target.value)} placeholder="AC-KIT-0001"/></label></div>
   <label>Présentation courte<textarea value={shortFr} disabled={busy||Boolean(id)} onChange={e=>setShortFr(e.target.value)} rows={2} placeholder="Résumé produit français…"/></label><label>Description complète<textarea value={descriptionFr} disabled={busy||Boolean(id)} onChange={e=>setDescriptionFr(e.target.value)} rows={4} placeholder="Description détaillée, usages, composition, instructions, précautions…"/></label>
   <button className={s.primary} disabled={busy||Boolean(id)||!supplierId} onClick={create}><PackagePlus size={16}/> Créer le brouillon canonique</button>
   {id&&<div className={s.receipt}><b>Produit créé :</b> <code>{id}</code><Link href={'/angelcare-marketplace/admin/catalog/items/'+id+'/overview'}><ExternalLink size={14}/> Ouvrir sa fiche canonique</Link></div>}
   <h2><span>03</span> Offre fournisseur</h2><p>Le coût reste dans sa devise native. Aucun prix client n'est publié automatiquement.</p>
   <div className={s.fields}><label>Coût fournisseur<input type="text" inputMode="decimal" value={unitCost} onChange={e=>setUnitCost(e.target.value)} placeholder="25.00"/></label><label>Devise fournisseur<input value={currency} maxLength={3} onChange={e=>setCurrency(e.target.value.toUpperCase())}/></label><label>MOQ<input type="text" value={moq} onChange={e=>setMoq(e.target.value)}/></label></div>
   <button disabled={busy||!id||!supplierId} className={s.primary} onClick={linkOffer}>Lier l'offre au produit <ArrowRight size={15}/></button>
   <p className={s.foot}>L'offre entre d'abord en statut « draft » et doit passer la revue qualité/commerciale dans Catalogue & sourcing.</p><Link className={s.secondary} href="/angelcare-marketplace/admin/supplier-command-360">Ouvrir Catalogue & sourcing <ExternalLink size={14}/></Link>
  </section>
  <section className={s.card}>
   <div className={s.row}><h2><span>04</span> Product 360 · readiness</h2><button className={s.secondary} disabled={busy||!id} onClick={()=>void run(async()=>{await refresh(id);setSuccess('Vérification Product 360 rafraîchie')})}><RefreshCcw size={15}/> Recontrôler</button></div>
   {!id?<div className={s.notice}>Créez le brouillon canonique à gauche pour activer la validation.</div>:<>
    <div className={s.identity}><b>{product?.name_fr||nameFr}</b><code>{id}</code><span>{product?.status||'draft'}</span></div>
    {ready?<><div className={s.list}>{Object.entries(ready.checks).map(([k,v])=><div key={k} className={v?s.passed:s.blocked}><span>{v?'✓':'!'}</span><b>{k.replaceAll('_',' ')}</b><small>{v?'Prêt':'À compléter'}</small></div>)}</div><div className={ready.ready?s.good:s.notice}>{ready.ready?'Product 360 satisfait les contrôles canoniques.':'Product 360 incomplet : '+ready.reasons.join(', ')}</div></>:<div className={s.notice}>Contrôles non chargés</div>}
    <h2><span>05</span> Compléter le produit</h2><p>Compléter les catégories publiques, les images publiables (distinctes des pièces privées fournisseur), les attributs, la sécurité, la disponibilité, le SEO, le prix et les informations de livraison.</p>
    <div className={s.links}><Link href={'/angelcare-marketplace/admin/catalog/items/'+id+'/media'}><UploadCloud size={15}/> Médias publics</Link><Link href={'/angelcare-marketplace/admin/catalog/items/'+id+'/categories'}>Catégories</Link><Link href={'/angelcare-marketplace/admin/catalog/items/'+id+'/pricing'}>Prix</Link><Link href={'/angelcare-marketplace/admin/catalog/items/'+id+'/trust'}>Conformité / sécurité</Link><Link href={'/angelcare-marketplace/admin/catalog/items/'+id+'/fulfillment'}>Livraison</Link><Link href={'/angelcare-marketplace/admin/catalog/items/'+id+'/publication'}>Publication</Link></div>
    <h2><span>06</span> Publication gouvernée</h2><p>Ce pont n'autorise que les produits « sur devis » en attendant l'intégration sûre de la tarification USD/ONE WORLD au checkout.</p>
    <button className={s.primary} disabled={busy||!ready?.ready||!data?.offers.some(x=>['approved','active'].includes(x.status))||data?.publicVisible} onClick={publish}><Globe2 size={15}/> Publier par le système canonique</button>
    {data?.publicVisible&&<div className={s.good}><CheckCircle2 size={16}/> Visible par la lecture publique canonique. <Link target="_blank" href={'/angelcare-marketplace/fr/marketplace/'+product?.slug}>Ouvrir la fiche client <ExternalLink size={13}/></Link></div>}
    <div className={s.notice}>Une fiche publiée peut exiger une affectation de catégorie et de merchandising supplémentaire pour apparaître dans les rails de découverte ; le statut seul ne certifie pas tout le parcours d'achat.</div>
   </>}
  </section></div><footer className={s.foot}>No automatic supplier portal · No public currency switch · No PayPal modification · No background supplier purchasing</footer>
 </div>
}
