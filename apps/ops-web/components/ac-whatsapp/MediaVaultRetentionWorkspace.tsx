"use client"

import { useEffect, useMemo, useState } from "react"
import { Database, FileArchive, FileCheck2, HardDrive, Image as ImageIcon, RefreshCw, ShieldAlert, Trash2, CheckSquare, Square, RotateCcw, PauseCircle, Archive } from "lucide-react"
import { Metric, ModalFrame, NoticeBanner, StatusPill, Surface, SurfaceHeader } from "./ACWhatsAppUI"
import { acApi, friendlyAcError, formatRelative } from "./useAcWhatsApp"

type Notice = ReturnType<typeof friendlyAcError> & { tone?: "success" | "danger" | "warning" | "info" }
const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[10px] font-bold text-slate-950 outline-none focus:border-slate-600"
function bytes(value: number) { if (!value) return "0 o"; const units = ["o","Ko","Mo","Go","To"]; let n=value,i=0; while(n>=1024&&i<units.length-1){n/=1024;i++} return `${n.toFixed(i?1:0)} ${units[i]}` }

export default function MediaVaultRetentionWorkspace({ accounts }: { accounts: any[] }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [purgeScope, setPurgeScope] = useState<any | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filters, setFilters] = useState({ account_id: "", direction: "", media_type: "", older_than_days: "" })

  async function refresh() {
    setLoading(true)
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([,v]) => v).map(([k,v]) => [k,String(v)]))
      setData(await acApi(`/api/ac-whatsapp/media-vault?${params.toString()}`))
      setSelectedIds([])
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [])

  const items = data?.items || []
  const selectable = useMemo(() => items.filter((row:any) => !row.protected_reason).map((row:any) => String(row.id)), [items])
  const allSelected = selectable.length > 0 && selectable.every((id:string) => selectedIds.includes(id))
  const s = data?.summary || {}
  const selectedBytes = items.filter((row:any)=>selectedIds.includes(String(row.id))).reduce((sum:number,row:any)=>sum+Number(row.size_bytes||0),0)

  function toggle(id:string) { setSelectedIds(current => current.includes(id) ? current.filter(value=>value!==id) : [...current,id]) }
  function openSelectedPurge() { if (!selectedIds.length) return; setPurgeScope({ attachment_ids:selectedIds }) }
  function openFilteredPurge() { setPurgeScope({ ...filters, older_than_days: filters.older_than_days ? Number(filters.older_than_days) : null, all: !Object.values(filters).some(Boolean) }) }

  return <div className="space-y-4">
    {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} onClose={() => setNotice(null)} /> : null}
    <div className="acw-apex-kpi-strip">
      <Metric label="Stockage référencé" value={bytes(s.total_bytes || 0)} detail={`${s.total_items || 0} fichiers Windows`} icon={HardDrive} tone="slate" />
      <Metric label="Images" value={s.groups?.images || 0} detail="Pièces jointes image" icon={ImageIcon} tone="blue" />
      <Metric label="Documents/PDF" value={(s.groups?.pdf || 0) + (s.groups?.documents || 0)} detail="Documents référencés" icon={FileArchive} tone="violet" />
      <Metric label="Protégés transport" value={s.protected_items || 0} detail="Jamais purgés en vol" icon={ShieldAlert} tone={s.protected_items ? "amber" : "emerald"} />
    </div>

    <Surface>
      <SurfaceHeader eyebrow="Windows Media Vault" title="Inventaire, rétention & destruction gouvernée" icon={Database} action={<button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[10px] font-black text-slate-700 disabled:opacity-40"><RefreshCw className="mr-1 inline h-3.5 w-3.5" />Actualiser</button>} />
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <select className={input} value={filters.account_id} onChange={e => setFilters({...filters,account_id:e.target.value})}><option value="">Tous les comptes</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select className={input} value={filters.direction} onChange={e => setFilters({...filters,direction:e.target.value})}><option value="">Entrant + sortant</option><option value="inbound">Entrant</option><option value="outbound">Sortant</option></select>
        <select className={input} value={filters.media_type} onChange={e => setFilters({...filters,media_type:e.target.value})}><option value="">Tous les médias</option><option value="image">Images</option><option value="audio">Audio</option><option value="video">Vidéos</option><option value="application/pdf">PDF</option></select>
        <div className="flex gap-2"><input className={input} type="number" min={1} placeholder="Plus vieux que… jours" value={filters.older_than_days} onChange={e => setFilters({...filters,older_than_days:e.target.value})}/><button type="button" onClick={() => void refresh()} className="rounded-xl bg-slate-950 px-3 text-[10px] font-black text-white">Filtrer</button></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <button type="button" onClick={() => setSelectedIds(allSelected ? [] : selectable)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[10px] font-black text-slate-700">{allSelected ? <CheckSquare className="h-3.5 w-3.5"/> : <Square className="h-3.5 w-3.5"/>}{allSelected ? "Tout désélectionner" : "Sélectionner les éligibles"}</button>
        <div className="flex items-center gap-3"><p className="text-[10px] font-bold text-slate-500">{selectedIds.length} sélectionné(s) · {bytes(selectedBytes)}</p><button type="button" disabled={!selectedIds.length} onClick={openSelectedPurge} className="rounded-xl bg-rose-700 px-3 py-2 text-[10px] font-black text-white disabled:opacity-30"><Trash2 className="mr-1 inline h-3.5 w-3.5"/>Supprimer la sélection</button></div>
      </div>

      <div className="mt-4 max-h-[520px] overflow-auto rounded-[16px] border border-slate-200">
        <table className="w-full min-w-[940px] bg-white text-left">
          <thead className="acw-apex-table-head bg-slate-50 text-[10px] font-black uppercase tracking-[.12em] text-slate-500"><tr><th className="p-3">Choix</th><th className="p-3">Fichier</th><th className="p-3">Type</th><th className="p-3">Taille</th><th className="p-3">Direction</th><th className="p-3">État</th><th className="p-3">Action</th></tr></thead>
          <tbody>{items.map((row:any) => { const checked=selectedIds.includes(String(row.id)); return <tr key={row.id} className="acw-apex-row border-t border-slate-100"><td className="p-3"><button type="button" disabled={Boolean(row.protected_reason)} onClick={() => toggle(String(row.id))} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-30">{checked?<CheckSquare className="h-4 w-4 text-slate-950"/>:<Square className="h-4 w-4 text-slate-400"/>}</button></td><td className="p-3"><p className="max-w-xs truncate text-[9px] font-black text-slate-900">{row.file_name || row.id}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{formatRelative(row.created_at)}</p></td><td className="p-3 text-[10px] font-bold text-slate-600">{row.mime_type || "—"}</td><td className="p-3 text-[10px] font-black text-slate-900">{bytes(Number(row.size_bytes || 0))}</td><td className="p-3 text-[10px] font-bold text-slate-600">{row.message?.direction || "—"}</td><td className="p-3">{row.protected_reason ? <StatusPill status="queued" label="Protégé" compact/> : <StatusPill status={row.message?.status || "ready"} label="Éligible" compact/>}</td><td className="p-3"><button type="button" disabled={Boolean(row.protected_reason)} onClick={() => setPurgeScope({attachment_ids:[String(row.id)]})} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[10px] font-black text-rose-800 disabled:opacity-30">Supprimer du serveur</button></td></tr> })}</tbody>
        </table>
      </div>

      <div className="acw-apex-danger-zone mt-4 flex flex-col gap-3 rounded-[16px] p-4 md:flex-row md:items-center md:justify-between"><div><p className="text-[10px] font-black text-rose-900">Zone de destruction physique</p><p className="mt-1 text-[10px] font-semibold leading-5 text-rose-800">Supprime uniquement la copie physique du serveur AngelCare. Les messages restent dans l’historique avec une preuve de purge.</p></div><button type="button" onClick={openFilteredPurge} className="shrink-0 rounded-lg bg-rose-700 px-3.5 py-2.5 text-[10px] font-black text-white"><Trash2 className="mr-1 inline h-3.5 w-3.5"/>Préparer une purge filtrée</button></div>
      {data?.capabilities?.physical_orphan_enumeration === false ? <NoticeBanner tone="info" title="Zéro faux compteur d’orphelins" description={data.capabilities.reason} /> : null}
    </Surface>

    <Surface>
      <SurfaceHeader eyebrow="Retention policy" title="Politiques enregistrées" icon={FileCheck2} />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">{(data?.policies || []).map((policy:any) => <PolicyCard key={policy.id} policy={policy} onChanged={async(message) => { await refresh(); setNotice({tone:"success",title:message,description:"La politique de rétention et son état ont été enregistrés côté serveur."}) }} />)}<PolicyForm onSaved={async()=>{await refresh();setNotice({tone:"success",title:"Politique enregistrée",description:"La politique est conservée comme règle de gouvernance et auditée."})}} /></div>
    </Surface>

    {purgeScope ? <PurgeModal scope={purgeScope} onClose={() => setPurgeScope(null)} onComplete={async()=>{setPurgeScope(null);await refresh();setNotice({tone:"success",title:"Purge vérifiée",description:"Les objets traités ont été supprimés du Media Vault et les métadonnées ont été réconciliées."})}} /> : null}
  </div>
}

function PolicyCard({ policy, onChanged }: { policy:any; onChanged:(message:string)=>void }) {
  const [busy,setBusy]=useState(false)
  async function change(status:string) { setBusy(true); try { await acApi('/api/ac-whatsapp/media-vault',{method:'POST',body:JSON.stringify({action:'save_policy',id:policy.id,name:policy.name,retention_days:policy.retention_days,direction:policy.direction,media_types:policy.media_types,status})}); onChanged(status==='active'?'Politique activée':status==='paused'?'Politique mise en pause':'Politique archivée') } finally { setBusy(false) } }
  return <div className="rounded-xl border border-slate-200 p-3.5"><div className="flex items-center justify-between"><p className="text-[10px] font-black text-slate-900">{policy.name}</p><StatusPill status={policy.status} compact/></div><p className="mt-2 text-[10px] font-semibold text-slate-500">{policy.retention_days} jours · {policy.direction} · historique message conservé</p><div className="mt-3 flex flex-wrap gap-2">{policy.status!=='active'?<button disabled={busy} type="button" onClick={()=>void change('active')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[10px] font-black text-emerald-800"><RotateCcw className="mr-1 inline h-3 w-3"/>Activer</button>:<button disabled={busy} type="button" onClick={()=>void change('paused')} className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] font-black text-amber-800"><PauseCircle className="mr-1 inline h-3 w-3"/>Pause</button>}{policy.status!=='archived'?<button disabled={busy} type="button" onClick={()=>void change('archived')} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-black text-slate-700"><Archive className="mr-1 inline h-3 w-3"/>Archiver</button>:null}</div></div>
}

function PolicyForm({ onSaved }: { onSaved:()=>void }) {
  const [form,setForm]=useState({name:'Rétention standard WhatsApp',retention_days:90,direction:'all',status:'draft'})
  const [busy,setBusy]=useState(false)
  return <div className="rounded-xl border border-dashed border-slate-300 p-3.5"><p className="text-[9px] font-black text-slate-800">Nouvelle politique</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><input className={input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className={input} type="number" min={1} value={form.retention_days} onChange={e=>setForm({...form,retention_days:Number(e.target.value)})}/><select className={input} value={form.direction} onChange={e=>setForm({...form,direction:e.target.value})}><option value="all">Tous flux</option><option value="inbound">Entrant</option><option value="outbound">Sortant</option></select><select className={input} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Brouillon</option><option value="active">Active</option><option value="paused">Pause</option></select></div><button type="button" disabled={busy || !form.name.trim()} onClick={async()=>{setBusy(true);try{await acApi('/api/ac-whatsapp/media-vault',{method:'POST',body:JSON.stringify({action:'save_policy',...form})});onSaved()}finally{setBusy(false)}}} className="mt-3 rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white disabled:opacity-40">Enregistrer</button></div>
}

function PurgeModal({ scope, onClose, onComplete }: { scope:any; onClose:()=>void; onComplete:()=>void }) {
  const [preview,setPreview]=useState<any>(null)
  const [reason,setReason]=useState('Nettoyage administrateur AC WhatsApp')
  const [confirmation,setConfirmation]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)
  useEffect(()=>{ void acApi('/api/ac-whatsapp/media-vault',{method:'POST',body:JSON.stringify({action:'preview',scope})}).then(setPreview).catch(c=>setError(c instanceof Error?c.message:'PREVIEW_FAILED')) },[JSON.stringify(scope)])
  async function execute(){setBusy(true);setError(null);try{const created:any=await acApi('/api/ac-whatsapp/media-vault',{method:'POST',body:JSON.stringify({action:'create_job',scope,confirmation,reason})});let remaining=created.summary?.candidate_items||0;while(remaining>0){const run:any=await acApi('/api/ac-whatsapp/media-vault',{method:'POST',body:JSON.stringify({action:'run_job',job_id:created.job.id})});remaining=Number(run.remaining||0)}onComplete()}catch(cause){setError(cause instanceof Error?cause.message:'PURGE_FAILED')}finally{setBusy(false)}}
  return <ModalFrame wide title="Purge physique Media Vault" eyebrow="Destruction gouvernée" description="Analyse d’impact avant suppression. Les transports en vol sont automatiquement protégés." onClose={onClose} footer={<button type="button" disabled={busy||confirmation!=='PURGER MEDIA WHATSAPP'||!reason.trim()||!preview} onClick={()=>void execute()} className="rounded-xl bg-rose-700 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy?'Suppression & vérification…':'Exécuter la purge'}</button>}>{error?<NoticeBanner tone="danger" title="Purge non exécutée" description={error}/>:null}{preview?<div className="grid gap-3 sm:grid-cols-4"><Box label="Fichiers" value={preview.summary.total_items}/><Box label="À supprimer" value={preview.summary.candidate_items}/><Box label="Protégés" value={preview.summary.protected_items}/><Box label="Volume" value={bytes(preview.summary.candidate_bytes||0)}/></div>:<p className="text-[9px] font-bold text-slate-500">Analyse…</p>}<div className="mt-5 grid gap-4"><label><span className="mb-2 block text-[10px] font-black uppercase tracking-[.12em] text-slate-600">Motif obligatoire</span><textarea className={input} rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></label><label><span className="mb-2 block text-[10px] font-black uppercase tracking-[.12em] text-rose-700">Tapez PURGER MEDIA WHATSAPP</span><input className={input} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><NoticeBanner tone="warning" title="Ce que cette action ne fait pas" description="Elle ne supprime pas le fichier du téléphone du destinataire ni de WhatsApp. Elle détruit uniquement la copie physique conservée par AngelCare."/></div></ModalFrame>
}

function Box({label,value}:{label:string;value:any}) { return <div className="rounded-xl border border-slate-200 p-3"><p className="text-lg font-black text-slate-950">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div> }
