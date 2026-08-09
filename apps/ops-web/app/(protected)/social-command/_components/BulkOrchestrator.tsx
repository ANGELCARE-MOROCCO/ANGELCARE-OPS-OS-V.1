"use client"
import { useMemo, useState } from "react"
import { CalendarClock, Check, ChevronDown, ChevronRight, Clock3, FileUp, Images, Layers3, Sparkles, WandSparkles } from "lucide-react"
import SovereignModal from "./SovereignModal"
import styles from "./SocialCommand.module.css"
import type { PulseState } from "./ActionPulse"
import type { SocialCampaign, SocialChannel, SocialFormat, SocialMediaAsset } from "@/lib/social-command/types"

type DraftSlot={slotNo:number;format:SocialFormat;channels:SocialChannel[];scheduledAt:string;caption:string;hashtags:string[];assetIds:string[];title:string;platformVariants:Record<string,{caption?:string;hashtags?:string[]}>;internalTags:string[]}
type Cadence="5day"|"3day"|"2day"|"1day"|"every2"|"every5"
type TimeMode="fixed"|"morning"|"evening"|"split"|"rotate"
const cadenceOptions:{id:Cadence;label:string;sub:string}[]=[
  {id:"5day",label:"AGRESSIF",sub:"5 / jour"},{id:"3day",label:"ACCÉLÉRÉ",sub:"3 / jour"},{id:"2day",label:"ÉQUILIBRÉ",sub:"2 / jour"},
  {id:"1day",label:"RÉGULIER",sub:"1 / jour"},{id:"every2",label:"RESPIRATION",sub:"tous les 2 jours"},{id:"every5",label:"LONGUE PORTÉE",sub:"tous les 5 jours"},
]
const morning=["08:15","09:45","11:00","10:30","08:45"]
const evening=["18:30","20:00","21:30","19:15","20:45"]

function localIso(date:string,time:string){const d=new Date(`${date}T${time}:00`);return d.toISOString()}
function makeSlots(count:number,format:SocialFormat,channels:SocialChannel[],start:string,cadence:Cadence,timeMode:TimeMode,fixedTime:string){
  const slots:DraftSlot[]=[]; const startDate=new Date(`${start}T00:00:00`)
  const perDay=cadence==="5day"?5:cadence==="3day"?3:cadence==="2day"?2:1
  for(let i=0;i<count;i++){
    const dayOffset=cadence==="every2"?i*2:cadence==="every5"?i*5:Math.floor(i/perDay)
    const d=new Date(startDate);d.setDate(d.getDate()+dayOffset);const date=d.toISOString().slice(0,10)
    let time=fixedTime
    if(timeMode==="morning")time=morning[i%morning.length]
    if(timeMode==="evening")time=evening[i%evening.length]
    if(timeMode==="split")time=(i%2===0?morning:evening)[Math.floor(i/2)%5]
    if(timeMode==="rotate")time=[...morning,...evening][i%10]
    slots.push({slotNo:i+1,format,channels:[...channels],scheduledAt:localIso(date,time),caption:"",hashtags:[],assetIds:[],platformVariants:{},internalTags:[],title:`${format==="story"?"Story":format==="reel"?"Reel":format==="carousel"?"Carousel":"Post"} ${String(i+1).padStart(2,"0")}`})
  }return slots
}
function minAssets(format:SocialFormat){return format==="carousel"?2:1}
function maxAssets(format:SocialFormat){return format==="story"||format==="reel"?1:10}
function slotMediaReady(slot:DraftSlot,assets:SocialMediaAsset[]){
  if(slot.assetIds.length<minAssets(slot.format)||slot.assetIds.length>maxAssets(slot.format))return false
  if(slot.format==="reel"){const a=assets.find(x=>x.id===slot.assetIds[0]);return Boolean(a&&/^video\//i.test(a.mime_type))}
  return slot.assetIds.every(id=>assets.some(a=>a.id===id&&a.status==="ready"))
}

export default function BulkOrchestrator({open,onClose,assets,campaigns,capabilities,onUpload,onRefresh,setPulse}:{open:boolean;onClose:()=>void;assets:SocialMediaAsset[];campaigns:SocialCampaign[];capabilities:{facebookPublish:boolean;facebookStory:boolean;instagramPublish:boolean};onUpload:(files:File[])=>Promise<SocialMediaAsset[]>;onRefresh:()=>Promise<void>;setPulse:(p:PulseState|null)=>void}){
  const [count,setCount]=useState(45),[format,setFormat]=useState<SocialFormat>("story"),[channels,setChannels]=useState<SocialChannel[]>(["instagram"])
  const [start,setStart]=useState(()=>new Date(Date.now()+86400000).toISOString().slice(0,10)),[cadence,setCadence]=useState<Cadence>("3day"),[timeMode,setTimeMode]=useState<TimeMode>("split"),[fixedTime,setFixedTime]=useState("19:30")
  const [slots,setSlots]=useState<DraftSlot[]>([]),[expanded,setExpanded]=useState<number|null>(null),[campaignId,setCampaignId]=useState(""),[bulkTags,setBulkTags]=useState("AngelCare"),[bulkInternalTags,setBulkInternalTags]=useState("campaign-social"),[bulkCaption,setBulkCaption]=useState(""),[bulkFbCaption,setBulkFbCaption]=useState(""),[bulkIgCaption,setBulkIgCaption]=useState(""),[assetsPerSlot,setAssetsPerSlot]=useState(1),[mediaQuery,setMediaQuery]=useState(""),[busy,setBusy]=useState(false)
  const readyAssets=assets.filter(a=>a.status==="ready")
  const effectiveAssetsPerSlot=format==="carousel"?Math.max(2,Math.min(10,assetsPerSlot)):format==="post"?Math.max(1,Math.min(10,assetsPerSlot)):1
  const summary=useMemo(()=>({media:slots.filter(s=>slotMediaReady(s,assets)).length,dates:slots.filter(s=>!Number.isNaN(new Date(s.scheduledAt).getTime())).length,facebook:slots.filter(s=>s.channels.includes("facebook")).length,instagram:slots.filter(s=>s.channels.includes("instagram")).length}),[slots,assets])
  const toggleChannel=(c:SocialChannel)=>{if(c==="facebook"&&(!capabilities.facebookPublish||(format==="story"&&!capabilities.facebookStory))){setPulse({id:crypto.randomUUID(),label:"Capability check",status:"failed",progress:100,step:format==="story"?"Facebook Story indisponible":"Publication Facebook non autorisée",detail:format==="story"?"Le connecteur vérifié MZ1 ne revendique pas Facebook Page Story.":"Ajoutez pages_manage_posts à AngelCare Social Connect, reconnectez Meta puis réessayez."});return}if(c==="instagram"&&!capabilities.instagramPublish){setPulse({id:crypto.randomUUID(),label:"Capability check",status:"failed",progress:100,step:"Publication Instagram non autorisée",detail:"Ajoutez instagram_content_publish à AngelCare Social Connect, reconnectez Meta puis réessayez."});return}setChannels(v=>v.includes(c)?v.filter(x=>x!==c):[...v,c])}
  const generate=()=>setSlots(makeSlots(Math.max(1,Math.min(200,count)),format,channels.length?channels:["instagram"],start,cadence,timeMode,fixedTime))
  const reflow=()=>{const fresh=makeSlots(Math.max(1,slots.length||Math.min(200,count)),format,channels.length?channels:["instagram"],start,cadence,timeMode,fixedTime);setSlots(prev=>fresh.map((slot,i)=>({...slot,...(prev[i]||{}),slotNo:slot.slotNo,format,channels:[...(channels.length?channels:(["instagram"] as SocialChannel[]))],scheduledAt:slot.scheduledAt})))}
  const autoMap=(pool=readyAssets)=>{const eligible=format==="reel"?pool.filter(a=>/^video\//i.test(a.mime_type)):pool;setSlots(prev=>prev.map((s,i)=>{const startIndex=i*effectiveAssetsPerSlot;const mapped=eligible.slice(startIndex,startIndex+effectiveAssetsPerSlot).map(a=>a.id);return {...s,assetIds:mapped.length?mapped:s.assetIds}}))}
  const applyContent=()=>{const tags=bulkTags.split(/[\s,]+/).map(v=>v.replace(/^#/,"")).filter(Boolean);const internalTags=bulkInternalTags.split(/[\s,]+/).map(v=>v.replace(/^#/,"")).filter(Boolean);setSlots(prev=>prev.map(s=>({...s,caption:bulkCaption||s.caption,hashtags:tags.length?tags:s.hashtags,internalTags:internalTags.length?internalTags:s.internalTags,platformVariants:{...s.platformVariants,...(bulkFbCaption?{facebook:{...(s.platformVariants.facebook||{}),caption:bulkFbCaption}}:{}),...(bulkIgCaption?{instagram:{...(s.platformVariants.instagram||{}),caption:bulkIgCaption}}:{})}})))}
  const upload=async(list:FileList|null)=>{if(!list?.length)return;const fresh=await onUpload(Array.from(list));const eligible=format==="reel"?fresh.filter(a=>/^video\//i.test(a.mime_type)):fresh;setSlots(prev=>prev.map((s,i)=>{const startIndex=i*effectiveAssetsPerSlot;const mapped=eligible.slice(startIndex,startIndex+effectiveAssetsPerSlot).map(a=>a.id);return {...s,assetIds:mapped.length?mapped:s.assetIds}}))}
  const patchSlot=(i:number,p:Partial<DraftSlot>)=>setSlots(v=>v.map((s,idx)=>idx===i?{...s,...p}:s))
  const patchVariant=(i:number,channel:SocialChannel,caption:string)=>setSlots(v=>v.map((s,idx)=>idx===i?{...s,platformVariants:{...s.platformVariants,[channel]:{...(s.platformVariants[channel]||{}),caption}}}:s))
  const toggleSlotAsset=(i:number,assetId:string)=>setSlots(v=>v.map((s,idx)=>{if(idx!==i)return s;const max=maxAssets(s.format);const exists=s.assetIds.includes(assetId);if(exists)return {...s,assetIds:s.assetIds.filter(id=>id!==assetId)};return {...s,assetIds:max===1?[assetId]:[...s.assetIds,assetId].slice(0,max)}}))
  const submit=async()=>{
    if(!slots.length)return
    const unsupportedFbStory=format==="story"&&slots.some(s=>s.channels.includes("facebook"))
    if(unsupportedFbStory){setPulse({id:crypto.randomUUID(),label:"Validation du plan",status:"failed",progress:100,step:"Canal non disponible",detail:"Le connecteur MZ1 ne revendique pas la publication Facebook Page Story. Retirez Facebook de ces slots; Instagram Story reste disponible."});return}
    if(summary.media!==slots.length){setPulse({id:crypto.randomUUID(),label:"Validation du plan",status:"failed",progress:100,step:"Média manquant",detail:`${slots.length-summary.media} slot(s) sans média.`});return}
    setBusy(true);setPulse({id:crypto.randomUUID(),label:`Planification de ${slots.length} créations`,status:"processing",progress:7,step:"Enregistrement du plan",completed:0,total:slots.length})
    try{
      const create=await fetch("/api/social-command/bulk-plans",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title:`Plan ${format} · ${slots.length}`,format,channels,campaignId:campaignId||null,slots})}).then(r=>r.json())
      if(!create.ok)throw new Error(create.error||"Impossible de créer le plan")
      setPulse({id:crypto.randomUUID(),label:`Planification de ${slots.length} créations`,status:"processing",progress:38,step:"Création des publications",completed:0,total:slots.length})
      const apply=await fetch(`/api/social-command/bulk-plans/${create.data.id}/apply`,{method:"POST",headers:{"content-type":"application/json"},body:"{}"}).then(r=>r.json())
      if(!apply.ok)throw new Error(apply.error||"Application du plan impossible")
      await onRefresh();setPulse({id:crypto.randomUUID(),label:`${apply.data.done} créations planifiées`,status:apply.data.failed?"failed":"completed",progress:100,step:apply.data.failed?"Terminé avec anomalies":"Synchronisé avec Temporal Command",completed:apply.data.done,total:slots.length,failed:apply.data.failed,detail:apply.data.failed?`${apply.data.failed} slot(s) nécessitent une correction`:"Calendrier et file d’exécution mis à jour"})
      if(!apply.data.failed)setTimeout(()=>onClose(),450)
    }catch(e){setPulse({id:crypto.randomUUID(),label:"Planification massive",status:"failed",progress:100,step:"Échec",detail:e instanceof Error?e.message:String(e)})}finally{setBusy(false)}
  }
  return <SovereignModal open={open} onClose={onClose} title="Mass Publishing Orchestrator" kicker="STUDIO · SOVEREIGN WORKSPACE · BULK INTELLIGENCE">
    <div className={styles.bulkCommandHeader}>
      <div><span className={styles.microLabel}>PLAN MASSIF</span><strong>{slots.length||count} créations</strong><p>Construisez, distribuez, mappez les médias et programmez un plan entier sans quitter ce cockpit.</p></div>
      <div className={styles.bulkHealth}><i/><span>Architecture directe</span><b>Windows → Meta</b></div>
    </div>
    <div className={styles.bulkArchitecture}>
      <aside className={styles.bulkPlanner}>
        <section><label>Volume</label><div className={styles.bigCounter}><input type="number" min="1" max="200" value={count} onChange={e=>setCount(Number(e.target.value)||1)}/><span>slots</span></div></section>
        <section><label>Format</label><div className={styles.segmented}>{(["story","post","reel","carousel"] as SocialFormat[]).map(f=><button key={f} className={format===f?styles.active:""} onClick={()=>setFormat(f)}>{f}</button>)}</div>{format==="post"||format==="carousel"?<div className={styles.assetDensity}><span>Médias / publication</span><input type="number" min={format==="carousel"?2:1} max="10" value={effectiveAssetsPerSlot} onChange={e=>setAssetsPerSlot(Math.max(format==="carousel"?2:1,Math.min(10,Number(e.target.value)||1)))}/><small>{format==="carousel"?"2–10 · ordre conservé":"1–10 · multi-média devient carousel IG"}</small></div>:<div className={styles.formatRule}>{format==="reel"?"1 vidéo par Reel":"1 média par Story · les séquences deviennent plusieurs slots"}</div>}</section>
        <section><label>Canaux</label><div className={styles.channelChoice}><button data-capability={capabilities.instagramPublish?"ready":"missing"} className={channels.includes("instagram")?styles.igOn:""} onClick={()=>toggleChannel("instagram")}>Instagram {capabilities.instagramPublish?"●":"○"}</button><button data-capability={capabilities.facebookPublish&&!(format==="story")?"ready":"missing"} className={channels.includes("facebook")?styles.fbOn:""} onClick={()=>toggleChannel("facebook")}>Facebook {capabilities.facebookPublish&&format!=="story"?"●":"○"}</button></div>{format==="story"&&channels.includes("facebook")?<p className={styles.capabilityWarning}>Facebook Page Story n’est pas activé dans l’adaptateur vérifié MZ1. Instagram Story reste disponible.</p>:null}</section>
        <section><label>Départ</label><input className={styles.field} type="date" value={start} onChange={e=>setStart(e.target.value)}/></section>
        <section><label>Cadence</label><div className={styles.cadenceGrid}>{cadenceOptions.map(o=><button key={o.id} className={cadence===o.id?styles.activeCadence:""} onClick={()=>setCadence(o.id)}><strong>{o.label}</strong><span>{o.sub}</span></button>)}</div></section>
        <section><label>Stratégie horaire</label><select className={styles.field} value={timeMode} onChange={e=>setTimeMode(e.target.value as TimeMode)}><option value="fixed">Heure fixe</option><option value="morning">Créneaux matin</option><option value="evening">Créneaux soir</option><option value="split">Matin + soir</option><option value="rotate">Rotation équilibrée</option></select>{timeMode==="fixed"?<input className={styles.field} type="time" value={fixedTime} onChange={e=>setFixedTime(e.target.value)}/>:null}</section>
        <button className={styles.generatePlan} onClick={generate}><WandSparkles size={17}/> Générer l’architecture</button>
      </aside>
      <main className={styles.slotStage}>
        <div className={styles.slotToolbar}>
          <div><b>{slots.length} SLOT{slots.length===1?"":"S"}</b><span>{summary.media} média · {summary.instagram} IG · {summary.facebook} FB</span></div>
          <div className={styles.slotActions}><label className={styles.uploadButton}><FileUp size={15}/> Importer médias<input hidden multiple type="file" accept="image/*,video/*" onChange={e=>upload(e.target.files)}/></label><button onClick={()=>autoMap()}><Images size={15}/> Mapper automatiquement</button></div>
        </div>
        {!slots.length?<div className={styles.bulkEmpty}><div className={styles.orbitIcon}><Layers3 size={30}/></div><h3>Votre matrice attend son architecture</h3><p>Définissez volume, cadence et logique horaire. Les slots seront créés comme une vraie grille d’exécution éditable.</p><button onClick={generate}><Sparkles size={16}/> Générer {count} slots</button></div>:
        <div className={styles.slotMatrix}>{slots.map((slot,i)=>{const asset=assets.find(a=>a.id===slot.assetIds[0]);const d=new Date(slot.scheduledAt);return <article key={slot.slotNo} className={`${styles.slotRow} ${slot.assetIds.length?styles.slotReady:""}`}>
          <button className={styles.slotMain} onClick={()=>setExpanded(expanded===i?null:i)}>
            <span className={styles.slotNumber}>{String(slot.slotNo).padStart(2,"0")}</span>
            <span className={styles.slotThumb}>{asset?.preview_url?<><img src={asset.preview_url} alt=""/>{slot.assetIds.length>1?<em>+{slot.assetIds.length-1}</em>:null}</>:<Images size={18}/>}</span>
            <span className={styles.slotIdentity}><b>{slot.title}</b><small>{slot.format.toUpperCase()} · {slot.channels.map(c=>c==="instagram"?"IG":"FB").join(" + ")}</small></span>
            <span className={styles.slotWhen}><CalendarClock size={14}/><b>{d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</b><small>{d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</small></span>
            <span className={slotMediaReady(slot,assets)?styles.readyMark:styles.missingMark}>{slotMediaReady(slot,assets)?<><Check size={13}/> PRÊT</>:slot.format==="carousel"?`${slot.assetIds.length}/2+`:"MÉDIA"}</span>{expanded===i?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</button>
          {expanded===i?<div className={styles.slotEditor}>
            <div className={styles.slotEditorHeader}><div><span>{slot.format.toUpperCase()} · SLOT {String(slot.slotNo).padStart(2,"0")}</span><strong>{slot.format==="carousel"?"Composition multi-média":slot.format==="reel"?"Vidéo verticale & légende":slot.format==="story"?"Frame Story finalisé":"Publication feed"}</strong></div><div className={styles.slotCapability}>{slot.format==="story"?"Le texte doit être intégré à l’asset si vous voulez un overlay visuel.":slot.format==="reel"?"Une vidéo prête à publier est requise.":slot.format==="carousel"?"2 à 10 médias, ordre de lecture conservé.":"1 à 10 médias; Instagram bascule en carousel au-delà de 1."}</div></div>
            <label>Titre interne<input value={slot.title} onChange={e=>patchSlot(i,{title:e.target.value})}/></label><label>Date / heure<input type="datetime-local" value={new Date(slot.scheduledAt).toISOString().slice(0,16)} onChange={e=>patchSlot(i,{scheduledAt:new Date(e.target.value).toISOString()})}/></label>
            {slot.format!=="story"?<label className={styles.span2}>Légende commune<textarea rows={3} value={slot.caption} onChange={e=>patchSlot(i,{caption:e.target.value})}/></label>:<label className={styles.span2}>Brief interne Story<textarea rows={2} value={slot.caption} onChange={e=>patchSlot(i,{caption:e.target.value})} placeholder="Note créative interne — non incrustée automatiquement dans le média"/></label>}
            {slot.format!=="story"&&slot.channels.includes("instagram")?<label>Copie Instagram<textarea rows={2} value={slot.platformVariants.instagram?.caption||""} onChange={e=>patchVariant(i,"instagram",e.target.value)} placeholder="Override optionnel"/></label>:null}
            {slot.format!=="story"&&slot.channels.includes("facebook")?<label>Copie Facebook<textarea rows={2} value={slot.platformVariants.facebook?.caption||""} onChange={e=>patchVariant(i,"facebook",e.target.value)} placeholder="Override optionnel"/></label>:null}
            <label>Hashtags<input value={slot.hashtags.map(t=>`#${t}`).join(" ")} onChange={e=>patchSlot(i,{hashtags:e.target.value.split(/\s+/).map(t=>t.replace(/^#/,"")).filter(Boolean)})}/></label>
            <label>Tags internes<input value={slot.internalTags.join(" ")} onChange={e=>patchSlot(i,{internalTags:e.target.value.split(/[\s,]+/).map(t=>t.replace(/^#/,"")).filter(Boolean)})}/></label>
            <div className={`${styles.slotMediaPicker} ${styles.span2}`}><div className={styles.slotMediaPickerHead}><div><span>MÉDIAS ASSIGNÉS</span><strong>{slot.assetIds.length} / {maxAssets(slot.format)}</strong></div><input value={mediaQuery} onChange={e=>setMediaQuery(e.target.value)} placeholder="Rechercher dans le Media Vault…"/></div><div className={styles.slotAssetStrip}>{readyAssets.filter(a=>(slot.format!=="reel"||/^video\//i.test(a.mime_type))&&(!mediaQuery||a.original_filename.toLowerCase().includes(mediaQuery.toLowerCase()))).slice(0,80).map(a=><button type="button" key={a.id} className={slot.assetIds.includes(a.id)?styles.slotAssetSelected:""} onClick={()=>toggleSlotAsset(i,a.id)}>{a.preview_url?<img src={a.preview_url} alt=""/>:<Images size={16}/>}<span>{a.original_filename}</span>{slot.assetIds.includes(a.id)?<Check size={13}/>:null}</button>)}</div></div>
          </div>:null}</article>})}</div>}
      </main>
      <aside className={styles.bulkInspector}>
        <div className={styles.inspectorTitle}><Sparkles size={17}/><div><span>COMMANDES DE MASSE</span><strong>Apply-to-All</strong></div></div>
        <label>Campagne<select className={styles.field} value={campaignId} onChange={e=>setCampaignId(e.target.value)}><option value="">Sans campagne</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label>Légende commune<textarea className={styles.field} rows={2} value={bulkCaption} onChange={e=>setBulkCaption(e.target.value)} placeholder="Appliquer à tous les slots"/></label>
        <label>Copie Instagram<textarea className={styles.field} rows={2} value={bulkIgCaption} onChange={e=>setBulkIgCaption(e.target.value)} placeholder="Override IG optionnel"/></label>
        <label>Copie Facebook<textarea className={styles.field} rows={2} value={bulkFbCaption} onChange={e=>setBulkFbCaption(e.target.value)} placeholder="Override FB optionnel"/></label>
        <label>Hashtags communs<input className={styles.field} value={bulkTags} onChange={e=>setBulkTags(e.target.value)}/></label>
        <label>Tags internes<input className={styles.field} value={bulkInternalTags} onChange={e=>setBulkInternalTags(e.target.value)}/></label>
        <button className={styles.applyAll} onClick={applyContent}>Appliquer le contenu aux {slots.length||count}</button><button className={styles.reflowButton} onClick={reflow}>Réappliquer cadence, heures & canaux</button>
        <div className={styles.validationStack}><h4>Validation live</h4><div><Check/> <span>Dates valides</span><b>{summary.dates}/{slots.length}</b></div><div className={summary.media===slots.length?styles.ok:styles.warn}><Check/> <span>Médias assignés</span><b>{summary.media}/{slots.length}</b></div><div><Check/> <span>Instagram</span><b>{summary.instagram}</b></div><div><Check/> <span>Facebook</span><b>{summary.facebook}</b></div></div>
        <div className={styles.bulkTimelineMini}><Clock3 size={15}/><span>Fenêtre du plan</span><b>{slots[0]?new Date(slots[0].scheduledAt).toLocaleDateString("fr-FR"):"—"} → {slots.at(-1)?new Date(slots.at(-1)!.scheduledAt).toLocaleDateString("fr-FR"):"—"}</b></div>
        <button disabled={busy||!slots.length} className={styles.scheduleAll} onClick={submit}>{busy?"Planification…":`PROGRAMMER ${slots.length||count}`}</button>
      </aside>
    </div>
  </SovereignModal>
}
