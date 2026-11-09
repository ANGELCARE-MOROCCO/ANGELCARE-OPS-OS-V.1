'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState, type ReactNode } from 'react'
import type { FlightDeckOrder, FlightDeckSnapshot } from '../transaction-flight-deck/types'
import type { MissionDossierData } from '../operations-execution/types'
import type { FulfillmentDossier as FulfillmentData } from '../operations-reconciliation/types'
import type { OrderMegaDossier } from '../enterprise-command/types'
import { base, request, type Permissions } from './model'
import type { DetailData } from './OrderDetail'
import { Button, Empty, ErrorBox, Modal } from './ui'
import { capabilities } from './capabilities'
import css from './orders360.module.css'
const OrderMegaCommand=dynamic(()=>import('../enterprise-command/components/OrderMegaCommand').then(m=>m.OrderMegaCommand))
const OrderInlineOperations=dynamic(()=>import('../enterprise-command/components/OrderInlineOperations').then(m=>m.OrderInlineOperations))
const MissionDossier=dynamic(()=>import('../operations-execution/components/MissionDossier').then(m=>m.MissionDossier))
const FulfillmentDossier=dynamic(()=>import('../operations-reconciliation/components/FulfillmentDossier').then(m=>m.FulfillmentDossier))
const OperationsMax=dynamic(()=>import('../supplier-ops-max/OperationsMax').then(m=>m.OperationsMax))
const FlightDeckDrawer=dynamic(()=>import('../transaction-flight-deck/components/FlightDeckDrawer').then(m=>m.FlightDeckDrawer))
export type DialogMode='dossier'|'operate'|'mission'|'proof'|'schedule'|'provider'|'exception'|'communication'|'supplier'|'capabilities'
export function Dialogs({mode,order,snapshot,permissions,onClose,refresh,initialTab}:{initialTab?:string;mode:DialogMode;order?:FlightDeckOrder;snapshot:FlightDeckSnapshot|null;permissions:Permissions;onClose:()=>void;refresh:()=>Promise<void>}) {
 const [filter,setFilter]=useState('')
 if(mode==='capabilities')return <Modal wide title="Tous les contrôles & autorités liés aux commandes" onClose={onClose}><p className={css.bodyText}>Les neuf espaces regroupent le travail courant. Les contrôles détaillés restent accessibles ici et dans le dossier contextuel ; chaque autorité conserve ses permissions serveur.</p><label className={css.field}>Rechercher une capacité<input placeholder="Facture, retour, preuve, disponibilité…" value={filter} onChange={e=>setFilter(e.target.value)}/></label><div className={css.capabilityGrid}>{capabilities.filter(c=>c.join(' ').toLowerCase().includes(filter.toLowerCase())).map(([area,title,path,detail])=><a key={`${area}-${title}`} href={`${base}${path}${order?`?order=${order.id}`:''}`}><small>{area}</small><b>{title}</b><p>{detail}</p></a>)}</div></Modal>
 if(mode==='supplier')return <Modal wide title="Contrôles fournisseur avancés" onClose={onClose}><div className={css.native}>{permissions.supplier?<OperationsMax embedded initialSpace="purchases"/>:<Empty title="Autorisation Supplier Command requise"/>}</div></Modal>
 if(!order)return <Modal title="Sélectionnez une commande" onClose={onClose}><Empty detail="Sélectionnez un dossier dans le registre avant d’ouvrir ses contrôles contextuels."/></Modal>
 if(mode==='schedule')return <ScheduleDialog order={order} canManage={permissions.manageOrder} onClose={onClose} refresh={refresh}/>
 if(mode==='provider'||mode==='exception'||mode==='communication') {
  const exception=snapshot?.exceptions.find(e=>e.orderId===order.id)
  if(mode==='exception'&&!exception)return <Modal title={`Exceptions · ${order.reference}`} onClose={onClose}><Empty title="Aucune exception liée dans le snapshot" detail="Le dossier 360 et la file d’exceptions restent disponibles."/><a className={css.button} href={`${base}/operations/exceptions?order=${order.id}`}>Examiner la file complète</a></Modal>
  if(mode==='provider')return <Modal title={`Affectation · ${order.reference}`} onClose={onClose}><p className={css.bodyText}>Les propositions éligibles se calculent et se comparent dans Planning. Le dossier sélectionné est conservé.</p><a className={css.primary} href={`${base}/orders?area=planning&order=${order.id}`}>Comparer et affecter dans Planning</a></Modal>
  if(!snapshot)return null
  return <div className={css.native}><FlightDeckDrawer descriptor={{kind:mode,id:order.id,title:`${mode==='communication'?'Communication':'Exception'} · ${order.reference}`,orderId:order.id,exceptionId:exception?.id,full:true}} snapshot={snapshot} onClose={onClose} onMinimize={onClose} onRefresh={refresh}/></div>
 }
 return <Modal title={`${mode==='operate'?'Actions opérationnelles':mode==='mission'?'Mission':mode==='proof'?'Obligations & preuves':'Dossier 360'} · ${order.reference}`} wide onClose={onClose}><div className={css.native}>
  {mode==='dossier'&&<OrderMegaCommand orderId={order.id} permissions={permissions} complete initialTab={initialTab}/>}
  {mode==='operate'&&<Resource<DetailData> url={`/api/angelcare-marketplace/admin/orders/${order.id}/workspace`} render={(data,reload)=><OrderInlineOperations data={data.dossier} permissions={permissions} onReload={async()=>{await reload();await refresh()}}/>}/>}
  {mode==='mission'&&(order.missionId?<Resource<MissionDossierData> url={`/api/angelcare-marketplace/operations/missions/${order.missionId}`} render={data=><MissionDossier data={data} canManage={permissions.manageOrder}/>}/>:<Empty title="Aucune mission reliée"/>)}
  {mode==='proof'&&(order.fulfillmentCaseId?<Resource<FulfillmentData> url={`/api/angelcare-marketplace/operations/fulfillment/${order.fulfillmentCaseId}`} render={data=><FulfillmentDossier data={data}/>}/>:<><Empty title="Aucun dossier de fulfillment relié" detail="Les preuves de mission, checklists et rapports restent accessibles dans leurs registres."/><div className={css.actions}>{[['Preuves','proof'],['Checklists','checklists'],['Rapports','reports'],['Validation','validation']].map(([label,path])=><a key={path} className={css.button} href={`${base}/operations/${path}?order=${order.id}`}>{label}</a>)}</div></>)}
 </div></Modal>
}
function localInput(value:string|null){if(!value)return '';const d=new Date(value);if(!Number.isFinite(d.valueOf()))return '';const z=(v:number)=>String(v).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`}
function ScheduleDialog({order,canManage,onClose,refresh}:{order:FlightDeckOrder;canManage:boolean;onClose:()=>void;refresh:()=>Promise<void>}) {
 const [start,setStart]=useState(()=>localInput(order.scheduledStart)),[end,setEnd]=useState(()=>localInput(order.scheduledEnd)),[reason,setReason]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false)
 async function save(){if(!start||!end||!reason.trim())return;if(new Date(end).valueOf()<=new Date(start).valueOf()){setError('La fin doit être postérieure au début.');return}setBusy(true);setError('');try{await request(`/api/angelcare-marketplace/admin/enterprise-command/orders/${order.id}/operate`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({scheduledStartAt:new Date(start).toISOString(),scheduledEndAt:new Date(end).toISOString(),expectedUpdatedAt:order.updatedAt,reason:reason.trim(),nextActionLabel:'Vérifier la disponibilité et les propositions de mission'})});setSaved(true);await refresh()}catch(e){setError(e instanceof Error?e.message:'Planning impossible.')}finally{setBusy(false)}}
 return <Modal title={`Planifier · ${order.reference}`} onClose={onClose} busy={busy}><p className={css.bodyText}>Les heures saisies utilisent le fuseau de votre navigateur : <b>{Intl.DateTimeFormat().resolvedOptions().timeZone}</b>. Le calendrier affiche Africa/Casablanca. L’enregistrement du créneau ne confirme ni disponibilité ni affectation.</p><div className={css.formGrid}><label className={css.field}>Début<input type="datetime-local" value={start} onChange={e=>{setStart(e.target.value);setSaved(false)}} disabled={!canManage||busy}/></label><label className={css.field}>Fin<input type="datetime-local" value={end} onChange={e=>{setEnd(e.target.value);setSaved(false)}} disabled={!canManage||busy}/></label></div><label className={css.field}>Motif de modification<textarea value={reason} onChange={e=>setReason(e.target.value)} disabled={!canManage||busy}/></label>{error&&<ErrorBox message={error}/>} {saved&&<div className={css.success} role="status">Créneau enregistré. Examinez les propositions et conflits dans Planning avant de confirmer l’affectation.</div>}<Button primary disabled={!canManage||busy||!start||!end||reason.trim().length<5} onClick={()=>void save()}>{busy?'Enregistrement…':'Enregistrer le créneau'}</Button></Modal>
}
function Resource<T>({url,render}:{url:string;render:(data:T,reload:()=>Promise<void>)=>ReactNode}) {
 const [data,setData]=useState<T|null>(null),[error,setError]=useState('')
 async function load(){try{setData(await request<T>(url));setError('')}catch(e){setError(e instanceof Error?e.message:'Lecture impossible.')}}
 useEffect(()=>{const abort=new AbortController();request<T>(url,{signal:abort.signal}).then(d=>{setData(d);setError('')}).catch(e=>{if(!abort.signal.aborted)setError(e.message)});return()=>abort.abort()},[url])
 return <>{error&&<ErrorBox message={error} retry={()=>void load()}/>} {data?render(data,load):!error?<div className={css.loading}>Chargement des contrôles canoniques…</div>:null}</>
}
