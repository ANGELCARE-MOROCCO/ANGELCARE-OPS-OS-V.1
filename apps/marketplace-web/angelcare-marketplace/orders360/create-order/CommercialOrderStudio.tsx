
"use client";

import {useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {
  AlertCircle,ArrowLeft,ArrowRight,BadgeCheck,BriefcaseBusiness,CalendarClock,Check,
  CheckCircle2,ChevronDown,ChevronRight,ClipboardCheck,Clock3,Copy,CreditCard,
  FileCheck2,FileText,FolderOpen,HeartHandshake,History,Info,Layers3,LockKeyhole,
  Mail,MapPin,Minus,MoreHorizontal,Package,Plus,RefreshCw,Save,Search,
  Settings2,ShieldCheck,ShoppingCart,Trash2,UserRound,Users,Wallet,X
} from "lucide-react";
import type {AssistedOrderOptions} from "../../total-commerce-control/types";
import s from "./commercial-order-studio.module.css";

type Mode="quick"|"expert"|"quote"|"subscription"|"b2b"|"renewal";
type Tab="customer"|"basket"|"configuration"|"planning"|"pricing"|"payment"|"contracts"|"validation";
type Line={id:string;itemId:string;quantity:number;unitPrice:number|null;discountAmount:number;configuration:{sessions:number;children:number;minutes:number;frequency:string;options:string[];note:string}};
type Draft={mode:Mode;customerAccountId:string;guestName:string;guestEmail:string;guestPhone:string;territoryId:string;city:string;address:string;scheduledStartAt:string;scheduledEndAt:string;paymentMode:string;paymentStatus:"pending"|"invoice_later";notes:string;familyRequestId:string|null;inquiryId:string|null;sourceOrderId:string|null;lines:Line[];contractNote:string;depositPercent:number};
type QuoteLine={itemId:string;title:string;quantity:number;unitPrice:number;discount:number;subtotal:number;net:number;currency:string;requiresApproval:boolean};
type Quote={lines:QuoteLine[];subtotal:number;discount:number;net:number;total:number;currency:string;requiresApproval:boolean;taxStatus:string;warnings?:string[]};
type Receipt={id?:string;public_reference?:string;orderId?:string;status?:string};
type PriorOrder={id:string;public_reference:string;created_at:string;title:string;journey_type:string};
type PriorLine={catalog_item_id:string;quantity:number;unit_price:number;discount_amount:number;configuration:unknown};
type Envelope<T>={data?:T;error?:{message?:string;code?:string};requestId?:string};
type CustomerDetails={orderCount:number;value:number;lastOrderAt:string|null;recentOrders:Array<{id:string;public_reference:string;title:string;created_at:string}>;addresses:Array<{id:string;city:string;address_line:string;label:string}>};
type SavedDraft={id:string;version:number;status:string;mode:Mode;payload:Draft;approval_state:string;created_at:string;updated_at:string;submitted_order_id?:string|null};

const API="/api/angelcare-marketplace/admin/orders/commercial-studio";
const modes:{id:Mode;label:string;icon:typeof ShoppingCart}[]=[
 {id:"quick",label:"Vente rapide",icon:Wallet},{id:"expert",label:"Commande experte",icon:Layers3},
 {id:"quote",label:"Devis",icon:FileText},{id:"subscription",label:"Abonnement",icon:CalendarClock},
 {id:"b2b",label:"B2B",icon:BriefcaseBusiness},{id:"renewal",label:"Renouvellement",icon:RefreshCw}
];
const tabs:{id:Tab;label:string;icon:typeof ShoppingCart}[]=[
 {id:"customer",label:"Client 360",icon:UserRound},{id:"basket",label:"Panier",icon:ShoppingCart},
 {id:"configuration",label:"Configuration",icon:Settings2},{id:"planning",label:"Planning",icon:CalendarClock},
 {id:"pricing",label:"Prix & marge",icon:Layers3},{id:"payment",label:"Paiement",icon:CreditCard},
 {id:"contracts",label:"Contrats",icon:FileText},{id:"validation",label:"Validation",icon:CheckCircle2}
];
const itemLabel=(v:AssistedOrderOptions["items"][number])=>v.name_fr||v.public_reference||"Article";
const money=(v:number,currency="MAD")=>Number(v||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" "+(currency==="Dh"?"MAD":currency);
const dt=(v:string|null|undefined)=>v?new Date(v).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"}):"—";
const newLine=(itemId:string):Line=>({id:crypto.randomUUID(),itemId,quantity:1,unitPrice:null,discountAmount:0,configuration:{sessions:1,children:1,minutes:60,frequency:"unique",options:[],note:""}});
const createDraft=(q?:Record<string,string|undefined>):Draft=>({mode:q?.mode==="quote"?"quote":"expert",customerAccountId:q?.customer||"",guestName:q?.guestName||"",guestEmail:q?.guestEmail||"",guestPhone:q?.guestPhone||"",territoryId:"",city:q?.city||"",address:"",scheduledStartAt:"",scheduledEndAt:"",paymentMode:"none",paymentStatus:"pending",notes:"",familyRequestId:q?.familyRequest||null,inquiryId:q?.inquiry||null,sourceOrderId:null,lines:[],contractNote:"",depositPercent:0});
const asObj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const parseResponse=async<T,>(response:Response):Promise<T>=>{
 const body=await response.json() as Envelope<T>;
 if(!response.ok||body.error||body.data===undefined)throw new Error(body.error?.message||"Action non confirmée par le serveur.");
 return body.data;
};
function Section({title,icon:Icon,children,extra}:{title:string;icon:typeof ShoppingCart;children:ReactNode;extra?:ReactNode}){
 return <section className={s.section}><div className={s.sectionHead}><h3><Icon size={17}/>{title}</h3>{extra}</div>{children}</section>;
}
function Field({title,children}:{title:string;children:ReactNode}){return <label className={s.field}><span>{title}</span>{children}</label>}
function Status({ok,label}:{ok:boolean;label:string}){return <span className={ok?s.statusOk:s.statusPending}>{ok?<CheckCircle2 size={13}/>:<Clock3 size={13}/>} {label}</span>}
function Tally({label,value,muted=false}:{label:string;value:string;muted?:boolean}){return <div className={muted?s.tallyMuted:s.tally}><span>{label}</span><strong>{value}</strong></div>}

export function CommercialOrderStudio({options,onClose,onCreated,initialQuery}:{options:AssistedOrderOptions;onClose:()=>void;onCreated?:()=>void;initialQuery?:Record<string,string|undefined>}){
 const [draft,setDraft]=useState<Draft>(()=>createDraft(initialQuery));
 const [draftId,setDraftId]=useState("");
 const [revision,setRevision]=useState(0);
 const [tab,setTab]=useState<Tab>("customer");
 const [selectedLine,setSelectedLine]=useState("");
 const [customerQuery,setCustomerQuery]=useState("");
 const [itemQuery,setItemQuery]=useState("");
 const [itemSearchOpen,setItemSearchOpen]=useState(false);
 const [showDrafts,setShowDrafts]=useState(false);
 const [showTemplates,setShowTemplates]=useState(false);
 const [showOrderImport,setShowOrderImport]=useState(false);
 const [priorOrders,setPriorOrders]=useState<PriorOrder[]>([]);
 const [importBusy,setImportBusy]=useState(false);
 const [drafts,setDrafts]=useState<SavedDraft[]>([]);
 const [quote,setQuote]=useState<Quote|null>(null);
 const [customerDetails,setCustomerDetails]=useState<CustomerDetails|null>(null);
 const [mediaById,setMediaById]=useState<Record<string,string>>({});
 const fetchedMedia=useRef(new Set<string>());
 const [saveState,setSaveState]=useState<"idle"|"saving"|"saved"|"error">("idle");
 const [busy,setBusy]=useState(false);
 const [priceBusy,setPriceBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [approval,setApproval]=useState("none");
 const [approvalInbox,setApprovalInbox]=useState<Array<SavedDraft&{actor_id:string}>>([]);
 const [showApprovals,setShowApprovals]=useState(false);
 const [created,setCreated]=useState<Receipt|null>(null);
 const [searchLimit,setSearchLimit]=useState(12);
 const saveBusy=useRef(false);
 const lastSaved=useRef("");
 const latestDraft=useRef(draft);
 const lastQuote=useRef(0);
 const revisionRef=useRef(0);
 const focused=useRef<HTMLButtonElement|null>(null);
 const dialog=useRef<HTMLDivElement|null>(null);
 const idRef=useRef("");
 const submissionKey=useRef("");
 const startSaveKey=useRef("");
 const startSavePayload=useRef("");
 const [ready,setReady]=useState(false);
 useEffect(()=>{
   idRef.current=crypto.randomUUID();setDraftId(idRef.current);setReady(true);
   const prior=document.activeElement as HTMLElement|null;
   focused.current?.focus();
   const handle=(event:KeyboardEvent)=>{
     if(event.key==="Escape"){event.preventDefault();close();}
     if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="s"){event.preventDefault();void save();}
     if(event.key==="Tab"&&dialog.current){
       const list=Array.from(dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]"));
       if(!list.length)return;
       const first=list[0],last=list[list.length-1];
       if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
       else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
     }
   };
   document.addEventListener("keydown",handle);
   return ()=>{document.removeEventListener("keydown",handle);prior?.focus()};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{latestDraft.current=draft;setNotice("")},[draft]);
 const customers=useMemo(()=>options.customers.filter(x=>(x.display_name+" "+x.public_reference+" "+(x.email||"")+" "+(x.phone||"")).toLowerCase().includes(customerQuery.toLowerCase())).slice(0,18),[options.customers,customerQuery]);
 const items=useMemo(()=>options.items.filter(x=>(x.name_fr+" "+x.public_reference+" "+(x.category_key||"")).toLowerCase().includes(itemQuery.toLowerCase())).slice(0,Math.min(searchLimit,80)),[options.items,itemQuery,searchLimit]);
 const mediaCandidates=useMemo(()=>[...new Set([
  ...draft.lines.map(l=>l.itemId),...(itemSearchOpen?items.slice(0,40).map(i=>i.id):[])
 ])],[draft.lines,itemSearchOpen,items]);
 useEffect(()=>{
  const remaining=mediaCandidates.filter(id=>!fetchedMedia.current.has(id)).slice(0,40);
  if(!remaining.length)return;
  remaining.forEach(id=>fetchedMedia.current.add(id));
  let active=true;
  void fetch(API+"?mediaFor="+encodeURIComponent(remaining.join(",")),{credentials:"same-origin",cache:"no-store"})
   .then(r=>parseResponse<Record<string,string>>(r))
   .then(images=>{if(active)setMediaById(v=>({...v,...images}))})
   .catch(()=>{remaining.forEach(id=>fetchedMedia.current.delete(id))});
  return()=>{active=false};
 },[mediaCandidates]);
 const customer=options.customers.find(x=>x.id===draft.customerAccountId);
 const chosen= draft.lines.find(x=>x.id===selectedLine)||draft.lines[0];
 const chosenCatalog=options.items.find(x=>x.id===chosen?.itemId);
 const payloadKey=JSON.stringify(draft);
 const isDirty=payloadKey!==lastSaved.current;
 const approvalRequired=Boolean(quote?.requiresApproval);
 const customerReady=Boolean(customer||draft.guestName.trim().length>=3&&(draft.guestEmail.trim()||draft.guestPhone.trim()));
 const basketReady=draft.lines.length>0&&Boolean(quote);
 const pricingReady=Boolean(quote)&&!priceBusy;
 const paymentReady=draft.mode==="quote"||Boolean(draft.paymentMode&&draft.paymentMode!=="none");
 const contractReady=draft.mode!=="b2b"&&draft.mode!=="subscription"||Boolean(draft.contractNote.trim());
 const approvalReady=!approvalRequired||approval==="approved";
 const renewalReady=draft.mode!=="renewal"||Boolean(draft.sourceOrderId);
 const recurringReady=draft.mode!=="subscription"||Boolean(draft.scheduledStartAt&&draft.lines.some(l=>l.configuration.sessions>1&&l.configuration.frequency!=="unique"));
 const modeReady=renewalReady&&recurringReady;
 const valid=customerReady&&basketReady&&pricingReady&&paymentReady&&contractReady&&approvalReady&&modeReady&&!isDirty&&saveState==="saved";
 const amount=quote?.total??0;
 const currency=quote?.currency||"MAD";
 const selectedPrice=quote?.lines.find(x=>x.itemId===chosen?.itemId);
 function update(patch:Partial<Draft>){submissionKey.current="";setDraft(d=>({...d,...patch}))}
 function linePatch(id:string,patch:Partial<Line>){update({lines:draft.lines.map(x=>x.id===id?{...x,...patch}:x)})}
 function configPatch(patch:Partial<Line["configuration"]>){if(!chosen)return;linePatch(chosen.id,{configuration:{...chosen.configuration,...patch}})}
 function addItem(id:string){setDraft(d=>({...d,lines:[...d.lines,newLine(id)]}));setItemSearchOpen(false);setItemQuery("");setTab("basket");setSelectedLine("")}
 function close(){
  if(created||!isDirty||window.confirm("Des modifications ne sont pas encore enregistrées. Fermer et abandonner ces changements ?"))onClose();
 }
 const request=async<T,>(action:string,input:Record<string,unknown>={},key?:string):Promise<T>=>{
  const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({action,input,requestKey:key||crypto.randomUUID()})});
  return parseResponse<T>(r);
 };
 async function save(){
  if(!ready||!idRef.current||saveBusy.current||created)return;
  const current=latestDraft.current,signature=JSON.stringify(current);
  if(signature===lastSaved.current){setSaveState("saved");return}
  saveBusy.current=true;setSaveState("saving");
  if(startSavePayload.current!==signature){startSavePayload.current=signature;startSaveKey.current="";}
  const usedKey=startSaveKey.current||(startSaveKey.current=crypto.randomUUID());
  try{
   const result=await request<SavedDraft>("save",{id:idRef.current,expectedVersion:revisionRef.current,payload:current},usedKey);
   revisionRef.current=Number(result.version||0);setRevision(revisionRef.current);
   lastSaved.current=signature;startSaveKey.current="";startSavePayload.current="";
   setDrafts(before=>[result,...before.filter(d=>d.id!==result.id)].slice(0,60));
   setSaveState(JSON.stringify(latestDraft.current)===signature?"saved":"idle");setApproval(result.approval_state||"none");setError("");
  }catch(e){setSaveState("error");setError(e instanceof Error?e.message:"Enregistrement indisponible.")}
  finally{saveBusy.current=false}
 }
 useEffect(()=>{
  if(!ready||created||!isDirty)return;
  const timer=setInterval(()=>{if(!saveBusy.current)void save()},4600);
  return ()=>clearInterval(timer);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[ready,created,isDirty]);
 useEffect(()=>{
  if(!ready||!draft.lines.length){setQuote(null);return}
  const q=++lastQuote.current;setPriceBusy(true);
  const timer=setTimeout(()=>{
    void request<Quote>("quote",{payload:draft}).then(result=>{
      if(lastQuote.current!==q)return;setQuote(result);setPriceBusy(false);
    }).catch(e=>{
      if(lastQuote.current!==q)return;setQuote(null);setPriceBusy(false);
      setError(e instanceof Error?e.message:"Le chiffrage est indisponible.");
    });
  },450);
  return ()=>clearTimeout(timer);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[payloadKey,ready]);
 useEffect(()=>{
  if(!draft.customerAccountId){setCustomerDetails(null);return}
  let active=true;
  void fetch(API+"?customerId="+encodeURIComponent(draft.customerAccountId),{credentials:"same-origin",cache:"no-store"})
   .then(r=>parseResponse<CustomerDetails>(r)).then(x=>{if(active)setCustomerDetails(x)}).catch(()=>{if(active)setCustomerDetails(null)});
  return ()=>{active=false};
 },[draft.customerAccountId]);
 useEffect(()=>{
  if(!showOrderImport||!draft.customerAccountId){setPriorOrders([]);return}
  let active=true;
  void fetch(API+"?customerOrders="+encodeURIComponent(draft.customerAccountId),{credentials:"same-origin",cache:"no-store"})
   .then(r=>parseResponse<PriorOrder[]>(r))
   .then(v=>{if(active)setPriorOrders(v)})
   .catch(e=>{if(active)setError(e instanceof Error?e.message:"Historique indisponible.")});
  return()=>{active=false};
 },[showOrderImport,draft.customerAccountId]);
 useEffect(()=>{if(!ready)return;
  void fetch(API+"?drafts=1",{credentials:"same-origin",cache:"no-store"}).then(r=>parseResponse<SavedDraft[]>(r)).then(setDrafts).catch(()=>{});
  void fetch(API+"?approvals=1",{credentials:"same-origin",cache:"no-store"}).then(r=>parseResponse<Array<SavedDraft&{actor_id:string}>>(r)).then(setApprovalInbox).catch(()=>{});
 },[ready]);
 async function restore(record:SavedDraft){
  if(isDirty&&!window.confirm("Remplacer les modifications non enregistrées par ce brouillon ?"))return;
  if(record.status!=="draft")return;
  idRef.current=record.id;setDraftId(record.id);
  revisionRef.current=record.version;setRevision(record.version);
  setDraft(record.payload);lastSaved.current=JSON.stringify(record.payload);
  setApproval(record.approval_state||"none");setShowDrafts(false);setNotice("Brouillon restauré.");
  setTab("basket");
 }
 function applyTemplate(template:SavedDraft){
  const lines=template.payload.lines.map(line=>({...line,id:crypto.randomUUID()}));
  if(!lines.length){setError("Ce brouillon ne contient aucune prestation.");return}
  update({lines:[...draft.lines,...lines]});setShowTemplates(false);setTab("basket");
  setNotice(lines.length+" lignes reprises du brouillon précédent.");
 }
 async function importPriorOrder(order:PriorOrder){
  setImportBusy(true);setError("");
  try{
   const res=await fetch(API+"?orderLines="+encodeURIComponent(order.id),{credentials:"same-origin",cache:"no-store"});
   const prev=await parseResponse<PriorLine[]>(res);
   const lines:Line[]=prev.filter(x=>options.items.some(i=>i.id===x.catalog_item_id))
    .map(x=>({id:crypto.randomUUID(),itemId:x.catalog_item_id,quantity:Math.max(1,Number(x.quantity)||1),
      unitPrice:Number(x.unit_price)||0,discountAmount:Math.max(0,Number(x.discount_amount)||0),
      configuration:{...newLine(x.catalog_item_id).configuration,...asObj(x.configuration)}}));
   if(!lines.length)throw new Error("Aucune ligne catalogue réutilisable. Les articles archivés sont exclus.");
   update({lines:[...draft.lines,...lines],sourceOrderId:draft.mode==="renewal"?order.id:draft.sourceOrderId});setShowOrderImport(false);setTab("basket");
   setNotice(lines.length+" lignes ajoutées depuis la commande "+order.public_reference+".");
  }catch(e){setError(e instanceof Error?e.message:"Import de panier impossible.")}
  finally{setImportBusy(false)}
 }
 async function requestApproval(){
  if(isDirty){setError("Enregistrez le brouillon avant une décision.");return}
  setBusy(true);setError("");
  try{
   const result=await request<SavedDraft>("request-approval",{id:draftId,expectedVersion:revision},crypto.randomUUID());
   revisionRef.current=result.version;setRevision(result.version);setApproval(result.approval_state);
   setNotice("Demande d'approbation transmise. Un autre opérateur habilité doit la traiter.");
  }catch(e){setError(e instanceof Error?e.message:"Décision non enregistrée.")}
  finally{setBusy(false)}
 }
 async function approveOther(record:SavedDraft&{actor_id:string}){
  if(!window.confirm("Approuver le brouillon "+record.id.slice(0,8)+" après votre contrôle commercial ?"))return;
  setBusy(true);setError("");
  try{
   await request<SavedDraft>("approve",{id:record.id,expectedVersion:record.version},crypto.randomUUID());
   setApprovalInbox(xs=>xs.filter(x=>x.id!==record.id));setNotice("Approbation enregistrée et auditée.");
  }catch(e){setError(e instanceof Error?e.message:"Approbation non confirmée.")}
  finally{setBusy(false)}
 }
 async function submit(){
  if(busy||!draftId||created)return;
  if(!valid){setTab("validation");setError("La commande n'est pas prête. Examinez les contrôles de validation et sauvegardez les modifications avant de soumettre.");return;}
  setBusy(true);setError("");
  const key=submissionKey.current||(submissionKey.current=crypto.randomUUID());
  try{
   const result=await request<Receipt>("submit",{id:draftId,expectedVersion:revision},key);
   if(!result.id&&!result.orderId)throw new Error("Référence canonique absente du reçu.");
   setCreated(result);setNotice("Commande canonique créée et confirmée.");onCreated?.();
  }catch(e){setError(e instanceof Error?e.message:"Création non confirmée.")}
  finally{setBusy(false)}
 }
 const readonlyPayment=["none","card","bank_transfer","invoice","ac_wallet","cash_on_delivery","manual_verified"];
 return <div className={s.overlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
  <div className={s.modal} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="commercial-studio-title">
   <div className={s.header}>
    <span className={s.brandIcon}><ShoppingCart size={24}/></span>
    <div className={s.brandText}><div className={s.overline}>ANGELCARE MARKETPLACE <em>/ ORDERS 360 / COMMERCIAL AUTHORITY</em></div>
      <h2 id="commercial-studio-title">Commercial Order Studio <span>360</span></h2>
      <p>Vente assistée · Devis · Réservation · Contrats B2B</p>
    </div>
    <div className={s.headerActions}><span className={s.reference}><FileText size={16}/> Réf. brouillon : {draftId?draftId.slice(0,8).toUpperCase():"—"} <b>{created?"CRÉÉE":"BROUILLON"}</b></span>
    <button onClick={()=>void save()} disabled={busy||saveBusy.current||created!==null} className={s.outline}><Save size={17}/> Enregistrer brouillon</button>
    <button ref={focused} className={s.close} onClick={close} title="Fermer" aria-label="Fermer le studio"><X size={21}/></button></div>
   </div>
   <nav className={s.modes} aria-label="Modes commerciaux">{modes.map(m=><button key={m.id} disabled={created!==null} data-active={draft.mode===m.id} onClick={()=>{update({mode:m.id,paymentStatus:m.id==="quote"?"invoice_later":"pending"});setTab("customer")}}><m.icon size={18}/>{m.label}</button>)}</nav>
   <nav className={s.tabs} aria-label="Sections de la commande">{tabs.map(t=><button key={t.id} data-active={tab===t.id} onClick={()=>setTab(t.id)}><t.icon size={16}/>{t.label}</button>)}</nav>
   {error?<div className={s.error} role="alert"><AlertCircle size={17}/><span>{error}</span><button onClick={()=>setError("")} aria-label="Fermer erreur"><X size={14}/></button></div>:null}
   {notice?<div className={s.notice} role="status"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")} aria-label="Fermer notification"><X size={14}/></button></div>:null}
   {created?<div className={s.successScreen}><CheckCircle2 size={50}/><h3>Commande canonique créée</h3><p>Le dossier reste dans le portefeuille Orders 360 et conserve son identité native.</p><strong>{created.public_reference||created.id||created.orderId}</strong><div><button onClick={onClose}>Retour au portefeuille</button><a href={"/angelcare-marketplace/admin/orders?area=commandes&order="+encodeURIComponent(String(created.id||created.orderId))}>Ouvrir le dossier <ArrowRight size={16}/></a></div></div>:
   <div className={s.workArea}>
     <aside className={s.customerCol}>
      <Section title="CLIENT 360 — PROFIL COMMERCIAL" icon={Users}>
       <label className={s.search}><Search size={15}/><input aria-label="Rechercher un client" placeholder="Rechercher nom, téléphone, email, ID…" value={customerQuery} onChange={e=>setCustomerQuery(e.target.value)}/></label>
       {customerQuery?<div className={s.results}>{customers.map(c=><button key={c.id} onClick={()=>{update({customerAccountId:c.id,guestName:"",guestEmail:"",guestPhone:"",sourceOrderId:null});setCustomerQuery("")}}><b>{c.display_name}</b><small>{c.public_reference} · {c.email||c.phone||"Contact à compléter"}</small></button>)}</div>:null}
       {customer?<div className={s.clientProfile}><div className={s.clientTop}><span className={s.avatar}><Users size={24}/></span><div><h3>{customer.display_name}</h3><small>{customer.public_reference}</small><span className={s.greenChip}><BadgeCheck size={12}/> Client sélectionné</span></div><button className={s.iconOnly} onClick={()=>update({customerAccountId:""})} title="Changer le client"><X size={14}/></button></div>
        <div className={s.contacts}>{customer.email?<span><Mail size={14}/>{customer.email}</span>:null}{customer.phone?<span><UserRound size={14}/>{customer.phone}</span>:null}</div>
        <div className={s.creamBox}><b>Profil client</b><small>Référence canonique · Gestion par le dossier CRM</small></div>
        <div className={s.clientStats}><div><ShoppingCart size={15}/><b>{customerDetails?.orderCount??"—"}</b><small>Commandes</small></div><div><Layers3 size={15}/><b>{customerDetails?money(customerDetails.value):"—"}</b><small>Valeur historique</small></div></div>
        <div className={s.infoRows}><div><span>Dernière commande</span><b>{dt(customerDetails?.lastOrderAt)}</b></div><div><span>Référence</span><b>{customer.public_reference}</b></div><div><span>Statut financier</span><b>Voir Finance 360</b></div></div>
        <details><summary><MapPin size={14}/> Adresses enregistrées ({customerDetails?.addresses.length??0})</summary>{customerDetails?.addresses.map(a=><button key={a.id} className={s.addressButton} onClick={()=>update({address:a.address_line,city:a.city})}>{a.label||a.city}: {a.address_line}</button>)}</details>
        <details><summary><History size={14}/> Notes et historique ({customerDetails?.recentOrders.length??0})</summary>
       {customerDetails?.recentOrders?.length?customerDetails.recentOrders.map(o=><div className={s.historicalOrder} key={o.id}><b>{o.public_reference||o.id.slice(0,8)}</b><span>{o.title||"Commande"}</span><small>{dt(o.created_at)}</small></div>):<p className={s.help}>Aucun historique commercial disponible pour ce client.</p>}</details>
       </div>:<div className={s.guestForm}><span className={s.eyebrow}>NOUVEAU CLIENT / INVITÉ</span><Field title="Nom complet"><input value={draft.guestName} onChange={e=>update({guestName:e.target.value})} placeholder="Nom et prénom"/></Field><Field title="Email"><input type="email" value={draft.guestEmail} onChange={e=>update({guestEmail:e.target.value})}/></Field><Field title="Téléphone"><input value={draft.guestPhone} onChange={e=>update({guestPhone:e.target.value})}/></Field><p className={s.help}>Choisissez un client existant ou renseignez un invité avec un contact valide.</p></div>}
      </Section>
      <button className={s.secondaryWide} onClick={()=>setShowDrafts(v=>!v)}><FolderOpen size={15}/> Mes brouillons ({drafts.length}) <ChevronDown size={14}/></button>
      {approvalInbox.length>0?<><button className={s.secondaryWide} onClick={()=>setShowApprovals(v=>!v)}><ShieldCheck size={15}/> Approbations à traiter ({approvalInbox.length}) <ChevronDown size={14}/></button>
      {showApprovals?<div className={s.savedList}>{approvalInbox.map(d=><button key={d.id} disabled={busy} onClick={()=>void approveOther(d)}><b>{d.mode} · {d.id.slice(0,8)} · v{d.version}</b><small>Créé par {d.actor_id.slice(0,8)} · Approuver après vérification</small><Check size={15}/></button>)}</div>:null}</>:null}
      {showDrafts?<div className={s.savedList}>{drafts.map(d=><button key={d.id} disabled={d.status!=="draft"} onClick={()=>void restore(d)}><b>{d.mode} · {d.id.slice(0,8)}</b><small>{dt(d.updated_at)} · v{d.version}</small><ChevronRight size={13}/></button>)}</div>:null}
     </aside>
     <main className={s.centerCol}>
      <div className={s.centerHead}><div><h3><ShoppingCart size={18}/> {tab==="basket"||tab==="customer"?"PANIER DE LA COMMANDE":tabs.find(t=>t.id===tab)?.label.toUpperCase()} <small>{draft.lines.length} prestation(s)</small></h3></div><div className={s.centerActions}><button onClick={()=>{setShowTemplates(v=>!v);setShowOrderImport(false);setTab("basket")}}><Layers3 size={14}/> Modèles</button><button onClick={()=>{setShowOrderImport(v=>!v);setShowTemplates(false);setTab("basket")}} disabled={!draft.customerAccountId}><FolderOpen size={14}/> Importer panier</button><button className={s.danger} onClick={()=>{if(window.confirm("Vider les lignes de ce brouillon ?"))update({lines:[]})}} disabled={!draft.lines.length}><Trash2 size={14}/> Vider</button></div></div>
      {showTemplates?<div className={s.importPanel}><div><b>COMPOSITIONS ENREGISTRÉES</b><button onClick={()=>setShowTemplates(false)} aria-label="Fermer"><X size={14}/></button></div>
       <p>Reprendre les lignes d'un brouillon existant sans écraser le client ou le contexte de la commande actuelle.</p>
       {drafts.filter(d=>d.status==="draft"&&d.payload.lines.length>0).length?drafts.filter(d=>d.status==="draft"&&d.payload.lines.length>0).map(d=><button className={s.savedChoice} key={d.id} onClick={()=>applyTemplate(d)}><Layers3 size={16}/><span>{d.mode} · {d.payload.lines.length} ligne(s) · {dt(d.updated_at)}</span><Plus size={14}/></button>):<p>Aucun modèle issu de brouillon disponible.</p>}
      </div>:null}
      {showOrderImport?<div className={s.importPanel}><div><b>PANIERS HISTORIQUES · CLIENT SÉLECTIONNÉ</b><button onClick={()=>setShowOrderImport(false)} aria-label="Fermer"><X size={14}/></button></div>
       <p>Récupérer uniquement les lignes catalogue encore disponibles d'une commande réellement enregistrée.</p>
       {priorOrders.length?priorOrders.map(o=><button className={s.savedChoice} disabled={importBusy} key={o.id} onClick={()=>void importPriorOrder(o)}><History size={16}/><span>{o.public_reference} · {o.title} · {dt(o.created_at)}</span><Copy size={14}/></button>):<p>Pas de commande historique réutilisable pour ce client.</p>}
      </div>:null}
      {(tab==="customer"||tab==="basket")?<div className={s.basketView}>
       <div className={s.tableScroll}><table className={s.basket}><thead><tr><th>Prestation / Produit</th><th>Configuration</th><th>Qté</th><th>Prix unitaire</th><th>Remise</th><th>Total</th><th/></tr></thead><tbody>
       {draft.lines.map(line=>{const item=options.items.find(i=>i.id===line.itemId),priced=quote?.lines.find(q=>q.itemId===line.itemId);return <tr key={line.id} data-selected={chosen?.id===line.id} onClick={()=>setSelectedLine(line.id)}>
        <td><div className={s.productCell}><span className={s.productThumb}>{mediaById[line.itemId]?<img src={mediaById[line.itemId]} alt="" loading="lazy"/>:<Package size={23}/>}</span><div><strong>{item?.name_fr||"Article du catalogue"}</strong><small>{item?.public_reference}</small><span className={s.greenChip}>{item?.kind||"Article"}</span></div></div></td>
        <td><div className={s.configMini}><span><CalendarClock size={12}/>{line.configuration.sessions} séance(s)</span><span><Users size={12}/>{line.configuration.children} participant(s)</span><span><Clock3 size={12}/>{line.configuration.minutes} min</span></div></td>
        <td><span className={s.qty}><button aria-label="Diminuer quantité" onClick={e=>{e.stopPropagation();linePatch(line.id,{quantity:Math.max(1,line.quantity-1)})}}><Minus size={12}/></button>{line.quantity}<button aria-label="Augmenter quantité" onClick={e=>{e.stopPropagation();linePatch(line.id,{quantity:Math.min(1000,line.quantity+1)})}}><Plus size={12}/></button></span></td>
        <td><b>{priced?money(priced.unitPrice,priced.currency):item?.price_mode==="quote_only"?"Sur devis":"À calculer"}</b></td>
        <td><span className={s.discountBadge}>{line.discountAmount?money(line.discountAmount):"—"}</span></td>
        <td><strong className={s.money}>{priced?money(priced.net,priced.currency):"À confirmer"}</strong></td>
        <td><button className={s.trash} onClick={e=>{e.stopPropagation();update({lines:draft.lines.filter(x=>x.id!==line.id)})}} title="Retirer la ligne"><Trash2 size={15}/></button></td>
       </tr>})}
       {!draft.lines.length?<tr><td colSpan={7}><div className={s.emptyBasket}><ShoppingCart size={26}/><strong>Composez votre panier commercial</strong><p>Ajoutez des prestations et produits réels depuis le catalogue AngelCare.</p></div></td></tr>:null}
       </tbody></table></div>
       <div className={s.addBar}><label className={s.search}><Search size={16}/><input aria-label="Rechercher une prestation" placeholder="Ajouter une prestation / produit (nom, catégorie, référence…)" value={itemQuery} onFocus={()=>setItemSearchOpen(true)} onChange={e=>{setItemQuery(e.target.value);setSearchLimit(12);setItemSearchOpen(true)}}/></label><button className={s.outlineGreen} onClick={()=>setItemSearchOpen(v=>!v)}><Plus size={15}/> Ajouter une prestation / produit</button></div>
       {itemSearchOpen?<div className={s.itemResults}><div className={s.resultsHead}>CATALOGUE AUTORISÉ · {items.length} résultats visibles <button onClick={()=>setItemSearchOpen(false)}><X size={14}/></button></div>{items.map(i=><button key={i.id} onClick={()=>addItem(i.id)}><span className={s.productThumb}>{mediaById[i.id]?<img src={mediaById[i.id]} alt="" loading="lazy"/>:<Package size={19}/>}</span><span><b>{itemLabel(i)}</b><small>{i.public_reference} · {i.kind} · {i.availability_status}</small></span><strong>{i.price_mode==="quote_only"?"Sur devis":money(Number(i.price_amount||0),i.currency_label)}</strong><Plus size={16}/></button>)}{items.length>=searchLimit&&searchLimit<80?<button onClick={()=>setSearchLimit(v=>Math.min(80,v+20))}>Afficher plus de résultats</button>:null}</div>:null}
       {chosen?<div className={s.lineConfig}><div className={s.configHeading}><h4><Settings2 size={16}/> Configuration de la ligne sélectionnée</h4><span>{chosenCatalog?.name_fr||"Offre sélectionnée"}</span></div>
       <div className={s.configFields}><Field title="Nombre de séances"><input type="number" min={1} max={365} value={chosen.configuration.sessions} onChange={e=>configPatch({sessions:Math.max(1,Number(e.target.value))})}/></Field>
       <Field title="Nombre d'enfants / participants"><input type="number" min={1} max={100} value={chosen.configuration.children} onChange={e=>configPatch({children:Math.max(1,Number(e.target.value))})}/></Field>
       <Field title="Durée par séance (minutes)"><input type="number" min={15} max={1440} value={chosen.configuration.minutes} onChange={e=>configPatch({minutes:Math.max(15,Number(e.target.value))})}/></Field>
       <Field title="Fréquence"><select value={chosen.configuration.frequency} onChange={e=>configPatch({frequency:e.target.value})}><option value="unique">Unique</option><option value="daily">Quotidienne</option><option value="weekly">Hebdomadaire</option><option value="twice_weekly">2 séances / semaine</option><option value="monthly">Mensuelle</option></select></Field></div>
       <div className={s.optionsRow}><span>Options & compléments</span>{["Matériel inclus","Suivi parental","Rapport de progression","Évaluation pédagogique"].map(x=><button key={x} data-active={chosen.configuration.options.includes(x)} onClick={()=>configPatch({options:chosen.configuration.options.includes(x)?chosen.configuration.options.filter(y=>y!==x):[...chosen.configuration.options,x]})}><Plus size={12}/>{x}</button>)}</div>
       </div>:null}
      </div>:null}
      {tab==="configuration"?<div className={s.contentPanel}><Section title="CONFIGURATION AVANCÉE DES PRESTATIONS" icon={Settings2}>{draft.lines.length?<><div className={s.lineTabs}>{draft.lines.map(l=><button key={l.id} data-active={chosen?.id===l.id} onClick={()=>setSelectedLine(l.id)}>{options.items.find(i=>i.id===l.itemId)?.name_fr||"Prestation"} <ChevronRight size={12}/></button>)}</div>
       {chosen?<div className={s.formGrid}><Field title="Sessions"><input type="number" min={1} value={chosen.configuration.sessions} onChange={e=>configPatch({sessions:Number(e.target.value)})}/></Field><Field title="Participants"><input type="number" min={1} value={chosen.configuration.children} onChange={e=>configPatch({children:Number(e.target.value)})}/></Field><Field title="Durée / séance (min)"><input type="number" min={15} value={chosen.configuration.minutes} onChange={e=>configPatch({minutes:Number(e.target.value)})}/></Field><Field title="Fréquence"><select value={chosen.configuration.frequency} onChange={e=>configPatch({frequency:e.target.value})}><option value="unique">Unique</option><option value="weekly">Hebdomadaire</option><option value="twice_weekly">2× semaine</option><option value="monthly">Mensuelle</option></select></Field><Field title="Tarif unitaire proposé"><input type="number" min={0} step=".01" placeholder="Prix catalogue" value={chosen.unitPrice??""} onChange={e=>linePatch(chosen.id,{unitPrice:e.target.value===""?null:Number(e.target.value)})}/></Field><Field title="Remise par ligne (montant)"><input type="number" min={0} step=".01" value={chosen.discountAmount} onChange={e=>linePatch(chosen.id,{discountAmount:Number(e.target.value)})}/></Field><label className={s.wideField}><span>Instructions spécifiques</span><textarea value={chosen.configuration.note} onChange={e=>configPatch({note:e.target.value})}/></label></div>:null}
      </>:<p className={s.help}>Sélectionnez au moins une offre depuis le panier pour configurer ses options.</p>}</Section></div>:null}
      {tab==="planning"?<div className={s.contentPanel}><Section title="PLANIFICATION & COUVERTURE OPÉRATIONNELLE" icon={CalendarClock}><div className={s.formGrid}><Field title="Territoire"><select value={draft.territoryId} onChange={e=>update({territoryId:e.target.value})}><option value="">Territoire à confirmer</option>{options.territories.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></Field><Field title="Ville"><input value={draft.city} onChange={e=>update({city:e.target.value})}/></Field><Field title="Début souhaité"><input type="datetime-local" value={draft.scheduledStartAt} onChange={e=>update({scheduledStartAt:e.target.value})}/></Field><Field title="Fin souhaitée"><input type="datetime-local" value={draft.scheduledEndAt} onChange={e=>update({scheduledEndAt:e.target.value})}/></Field><label className={s.wideField}><span>Adresse / lieu de service</span><input value={draft.address} onChange={e=>update({address:e.target.value})}/></label><label className={s.wideField}><span>Instructions opérationnelles</span><textarea value={draft.notes} onChange={e=>update({notes:e.target.value})}/></label></div><div className={s.warning}><AlertCircle size={17}/> Les créneaux constituent des demandes. Aucune disponibilité ni affectation de personnel n'est déclarée confirmée.</div></Section></div>:null}
      {tab==="pricing"?<div className={s.contentPanel}><Section title="PRIX, REMISES & AUTORITÉ FINANCIÈRE" icon={Layers3}>{quote?<><div className={s.quoteTable}>{quote.lines.map((l,i)=><div key={i}><b>{l.title}</b><span>{l.quantity} × {money(l.unitPrice,l.currency)}</span><strong>{money(l.net,l.currency)}</strong></div>)}</div><div className={s.reviewBreakdown}><Tally label="Sous-total" value={money(quote.subtotal,currency)}/><Tally label="Remises" value={"− "+money(quote.discount,currency)}/><Tally label="Net (hors taxes vérifiées)" value={money(quote.total,currency)}/></div>{quote.requiresApproval?<div className={s.warning}><AlertCircle size={16}/> Prix négocié ou remise détecté : approbation indépendante requise avant création.</div>:null}</>:<p className={s.help}>Ajoutez une offre pour obtenir un chiffrage serveur.</p>}<p className={s.help}>Les taxes, coûts réels et marges non confirmés ne sont pas inventés. Le reçu final reflète les montants validés.</p></Section></div>:null}
      {tab==="payment"?<div className={s.contentPanel}><Section title="PAIEMENT & PRÉPARATION FINANCE" icon={CreditCard}><div className={s.formGrid}><Field title="Méthode de paiement proposée"><select value={draft.paymentMode} onChange={e=>update({paymentMode:e.target.value})}>{readonlyPayment.map(x=><option value={x} key={x}>{({none:"À qualifier",card:"Carte / lien de paiement",bank_transfer:"Virement",invoice:"Facture",ac_wallet:"AC Wallet",cash_on_delivery:"Sur place",manual_verified:"Paiement manuel à rapprocher"} as Record<string,string>)[x]}</option>)}</select></Field><Field title="Échéance"><select value={draft.paymentStatus} onChange={e=>update({paymentStatus:e.target.value as Draft["paymentStatus"]})}><option value="pending">En attente</option><option value="invoice_later">Facturer plus tard</option></select></Field><Field title="Acompte proposé (%)"><input type="number" min={0} max={100} value={draft.depositPercent} onChange={e=>update({depositPercent:Math.min(100,Math.max(0,Number(e.target.value)))})}/></Field></div><div className={s.warning}><ShieldCheck size={16}/> Cette étape prépare les conditions de règlement. Elle ne capture, n'autorise ni ne confirme aucun paiement.</div></Section></div>:null}
      {tab==="contracts"?<div className={s.contentPanel}><Section title="CONTRATS, CONDITIONS & PREUVES" icon={FileCheck2}><label className={s.wideField}><span>Conditions et références contractuelles</span><textarea rows={5} value={draft.contractNote} onChange={e=>update({contractNote:e.target.value})} placeholder="Identifiant de contrat, conditions B2B, référence de devis, document à produire…"/></label><p className={s.help}>Le document officiel sera produit par l'autorité Documents après confirmation. Aucun contrat n'est réputé signé par cette saisie.</p></Section></div>:null}
      {tab==="validation"?<div className={s.contentPanel}><Section title="DOSSIER DE VALIDATION" icon={ClipboardCheck}><div className={s.validationList}>{[
        ["Client identifié et joignable",customerReady],["Panier canonique et prix serveur",basketReady&&pricingReady],
        ["Mode de règlement choisi",paymentReady],["Conditions contractuelles applicables",contractReady],
        ["Approbation requise",approvalReady],["Renouvellement / récurrence",modeReady],["Brouillon persisté",!isDirty&&saveState==="saved"]
       ].map(([label,ok],i)=><div key={i}><span>{ok?<CheckCircle2 size={18}/>:<AlertCircle size={18}/>}</span><b>{label}</b><Status ok={Boolean(ok)} label={ok?"Vérifié":"À finaliser"}/></div>)}</div><p className={s.help}>Toutes les étapes sont vérifiées une dernière fois côté serveur. Les prestations nécessitant une capacité réelle restent à confirmer par les équipes Planning.</p></Section></div>:null}
     </main>
     <aside className={s.rightCol}>
       <Section title="RÉCAPITULATIF COMMERCIAL" icon={Layers3}>
        <div className={s.summaryBody}><Tally label={"Sous-total ("+draft.lines.length+" ligne(s))"} value={quote?money(quote.subtotal,currency):"À calculer"}/>
        <Tally label="Remise commerciale" value={quote?"− "+money(quote.discount,currency):"—"}/>
        <Tally label="Sous-total net" value={quote?money(quote.net,currency):"—"}/>
        <Tally label="TVA" value="Non calculée" muted/><Tally label="Frais de service" value="Selon politique" muted/>
        <div className={s.grandTotal}><span>Total à confirmer</span><strong>{quote?money(amount,currency):"—"}</strong></div>
        <div className={s.splitAmounts}><div><CreditCard size={17}/><span>Acompte proposé</span><b>{quote?money(amount*draft.depositPercent/100,currency):"—"}</b></div><div><Layers3 size={17}/><span>Solde prévisionnel</span><b>{quote?money(amount*(100-draft.depositPercent)/100,currency):"—"}</b></div></div>
        <div className={s.marginNotice}><Info size={16}/><span>Marge estimée</span><strong>Non disponible</strong></div>
        </div>
       </Section>
       <Section title="CHECKLIST PRÊT POUR VALIDATION" icon={CheckCircle2}>
        <div className={s.rightChecks}>{[
         ["Informations client complètes",customerReady,"customer"],
         ["Panier et prix recalculés",basketReady&&pricingReady,"basket"],
         ["Conditions de paiement définies",paymentReady,"payment"],
         ["Contrat / conditions vérifiés",contractReady,"contracts"],
         ["Approbation commerciale",approvalReady,"validation"],
         ["Mode commercial configuré",modeReady,draft.mode==="subscription"?"planning":"basket"],
         ["Brouillon sauvegardé",!isDirty&&saveState==="saved","validation"]
        ].map(([label,ok,to],i)=><button key={i} onClick={()=>setTab(to as Tab)}><span className={s.checkSymbol}>{ok?<Check size={14}/>:<Clock3 size={14}/>}</span><span>{label}</span><Status ok={Boolean(ok)} label={ok?"OK":"À finaliser"}/><ChevronRight size={14}/></button>)}</div>
       </Section>
       {approvalRequired?<div className={s.approvalBox}><strong><LockKeyhole size={15}/> Contrôle commercial</strong><p>Les remises et prix négociés exigent l'autorisation d'un autre opérateur habilité.</p><Status ok={approval==="approved"} label={approval==="approved"?"Approbation obtenue":approval==="requested"?"En attente d'approbation":"Non demandée"}/></div>:null}
     </aside>
   </div>}
   <footer className={s.footer}>
    <div className={s.saveIndicator}>{saveState==="saving"?<RefreshCw size={14}/>:saveState==="error"?<AlertCircle size={14}/>:<CheckCircle2 size={14}/>}
    {created?"Commande créée":saveState==="saving"?"Enregistrement…":saveState==="saved"?"Brouillon enregistré · version "+revision:saveState==="error"?"Échec de sauvegarde":"Modifications non enregistrées"}</div>
    <div className={s.footerActions}><button onClick={close}>Annuler</button><button onClick={()=>void save()} disabled={busy||created!==null}><Save size={16}/> Enregistrer</button>
     {approvalRequired&&approval!=="approved"?<button className={s.approvalBtn} onClick={()=>void requestApproval()} disabled={busy||isDirty||!draft.lines.length||approval==="requested"}><Users size={16}/>{approval==="requested"?"En attente d'approbation":"Demander validation"}</button>:null}
     <button className={s.primary} disabled={busy||created!==null||!draft.lines.length} onClick={()=>tab==="validation"?void submit():setTab("validation")}>{busy?"Traitement…":tab==="validation"?"Créer la commande":"Continuer vers validation"} <ArrowRight size={16}/></button>
    </div>
   </footer>
  </div>
 </div>;
}
