'use client'

import type { FormEvent } from 'react'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Inbox, Link2, Mail, MessageCircleReply, Paperclip, Plus, RefreshCcw, Search, Send, ShieldCheck, X } from 'lucide-react'
import OperatorOverlayPortal from '../OperatorOverlayPortal'
import type { EmailCommandSnapshot } from '@/types/angelcare360/operator/email-command'
import styles from './CustomerCorrespondenceCommand.module.css'

type Props = { clientId: string }
type Mode = 'chronology' | 'threads' | 'inbound' | 'outbound' | 'automations' | 'approvals' | 'attachments' | 'commitments' | 'audit'

const MODES: Array<[Mode,string]> = [['chronology','Chronologie'],['threads','Threads'],['inbound','Inbound'],['outbound','Outbound'],['automations','Automations'],['approvals','Approbations'],['attachments','Pièces jointes'],['commitments','Engagements'],['audit','Audit']]

export default function CustomerCorrespondenceCommand({ clientId }: Props) {
  const [snapshot,setSnapshot] = useState<EmailCommandSnapshot | null>(null)
  const [mode,setMode] = useState<Mode>('chronology')
  const [query,setQuery] = useState('')
  const [loading,setLoading] = useState(true)
  const [compose,setCompose] = useState(false)
  const [notice,setNotice] = useState('')

  async function load() {
    setLoading(true)
    try {
      const response = await fetch(`/api/angelcare360/operator/email-command?clientId=${encodeURIComponent(clientId)}&limit=500`,{cache:'no-store'})
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error || 'Correspondance client indisponible.')
      setSnapshot(body.snapshot)
    } catch(error){setNotice(error instanceof Error ? error.message : 'Correspondance client indisponible.')} finally {setLoading(false)}
  }
  useEffect(()=>{load()},[clientId])

  const messages = useMemo(()=>{
    const rows = snapshot?.messages || []
    const term=query.trim().toLowerCase()
    const modeRows = mode==='inbound'?rows.filter((item)=>item.direction==='inbound'):mode==='outbound'?rows.filter((item)=>item.direction==='outbound'):rows
    return term?modeRows.filter((item)=>[item.subject,item.sender_email,item.message_reference,...item.recipient_emails].join(' ').toLowerCase().includes(term)):modeRows
  },[snapshot,query,mode])
  const lastInbound=(snapshot?.messages||[]).find((item)=>item.direction==='inbound')
  const lastOutbound=(snapshot?.messages||[]).find((item)=>item.direction==='outbound')

  if(loading) return <div className={styles.loading}><RefreshCcw size={18}/>Chargement de la correspondance client…</div>
  if(!snapshot) return <div className={styles.error}><AlertTriangle size={18}/>{notice || 'Correspondance indisponible.'}<button type="button" onClick={load}>Réessayer</button></div>

  return <section className={styles.command}>
    <header className={styles.crown}><div><span>Emails & Correspondance</span><h3>Customer Communication Command</h3><p>Tous les messages restent dans Email OS et sont reliés ici au dossier client.</p></div><div><button type="button" onClick={load}><RefreshCcw size={15}/>Actualiser</button><button type="button" data-primary onClick={()=>setCompose(true)}><Plus size={15}/>Composer</button></div></header>
    <div className={styles.truths}>
      <Truth label="Dernier inbound" value={lastInbound?dateTime(lastInbound.received_at||lastInbound.created_at):'Aucun'} detail={lastInbound?.subject||'En attente de capture POP3'}/>
      <Truth label="Dernier outbound" value={lastOutbound?dateTime(lastOutbound.sent_at||lastOutbound.created_at):'Aucun'} detail={lastOutbound?.subject||'Aucune communication'}/>
      <Truth label="Réponse AngelCare" value={snapshot.metrics.awaitingAngelcare} detail="messages requérant une action" tone={snapshot.metrics.awaitingAngelcare?'warning':'good'}/>
      <Truth label="Échecs" value={snapshot.metrics.failed} detail="delivery ou retry" tone={snapshot.metrics.failed?'critical':'good'}/>
      <Truth label="Automations" value={snapshot.metrics.activeRules} detail="règles actives globales"/>
    </div>
    <nav className={styles.localRail}>{MODES.map(([key,label])=><button key={key} type="button" data-active={mode===key} onClick={()=>setMode(key)}>{label}</button>)}</nav>
    <div className={styles.toolbar}><label><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher dans la correspondance client…"/></label><button type="button" onClick={()=>window.location.assign(`/angelcare-360-operator/email-command?view=conversations`)}>Ouvrir Email Command<ArrowRight size={14}/></button></div>
    {notice?<div className={styles.notice}><CheckCircle2 size={15}/>{notice}<button type="button" onClick={()=>setNotice('')}><X size={14}/></button></div>:null}
    <div className={styles.timeline}>{messages.map((item)=><article key={item.id} data-direction={item.direction}><div className={styles.direction}>{item.direction==='inbound'?<Inbox size={16}/>:<Send size={16}/>}</div><div className={styles.message}><header><span>{item.message_reference} · {human(item.classification||'general')}</span><em>{dateTime(item.received_at||item.sent_at||item.created_at)}</em></header><h4>{item.subject}</h4><p>{item.direction==='inbound'?`De ${item.sender_email}`:`Vers ${item.recipient_emails.join(', ')}`}</p><footer><span data-status={item.status}>{human(item.status)}</span>{item.tenant_id?<span><Link2 size={12}/>Tenant lié</span>:null}{item.attachments?.length?<span><Paperclip size={12}/>{item.attachments.length}</span>:null}{item.requires_response&&!item.resolved_at?<span><Clock3 size={12}/>Réponse attendue</span>:null}</footer></div><div className={styles.actions}><button type="button" onClick={()=>setCompose(true)}><MessageCircleReply size={14}/>Répondre</button><button type="button"><ShieldCheck size={14}/>Audit</button></div></article>)}{!messages.length?<div className={styles.empty}><Mail size={21}/><strong>Aucune correspondance dans ce mode</strong><span>Les emails liés au client apparaîtront sans duplication.</span></div>:null}</div>
    {compose?<ComposePortal snapshot={snapshot} clientId={clientId} close={()=>setCompose(false)} after={()=>{setCompose(false);setNotice('Communication créée dans la queue Email OS.');load()}}/>:null}
  </section>
}

function ComposePortal({snapshot,clientId,close,after}:{snapshot:EmailCommandSnapshot;clientId:string;close:()=>void;after:()=>void}){
  const client=snapshot.clients.find((item)=>String(item.id)===clientId)
  const contacts=snapshot.contacts.filter((item)=>String(item.client_id)===clientId)
  const [contactId,setContactId]=useState('')
  const [email,setEmail]=useState(String(client?.primary_contact_email||''))
  const [mailbox,setMailbox]=useState('B2B')
  const [subject,setSubject]=useState(`Correspondance AngelCare 360 — ${String(client?.display_name||'Client')}`)
  const [body,setBody]=useState('Bonjour,\n\n')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{const response=await fetch('/api/angelcare360/operator/email-command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({operation:'message.compose',payload:{clientId,contactId,mailboxKey:mailbox,mailboxEmail:snapshot.mailboxes.find((item)=>item.key===mailbox)?.email||null,recipientEmails:[email],subject,bodyText:body,classification:'general_correspondence',requiresResponse:true}})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Création impossible.');after()}catch(err){setError(err instanceof Error?err.message:'Création impossible.')}finally{setBusy(false)}}
  return <OperatorOverlayPortal><div className={styles.portalBackdrop}><form className={styles.portal} onSubmit={submit}><header><div><span>Customer Correspondence</span><h3>Composer dans le dossier client</h3><p>{String(client?.display_name||'Client')}</p></div><button type="button" onClick={close}><X size={18}/></button></header><div className={styles.form}><label><span>Boîte d’envoi</span><select value={mailbox} onChange={(e)=>setMailbox(e.target.value)}>{snapshot.mailboxes.map((item)=><option key={item.key} value={item.key}>{item.label} · {item.email}</option>)}</select></label><label><span>Contact</span><select value={contactId} onChange={(e)=>{setContactId(e.target.value);const contact=contacts.find((item)=>String(item.id)===e.target.value);if(contact?.email)setEmail(String(contact.email))}}><option value="">Contact principal / manuel</option>{contacts.map((item)=><option key={String(item.id)} value={String(item.id)}>{String(item.full_name)} · {String(item.role_type)}</option>)}</select></label><label><span>Email</span><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label><label><span>Objet</span><input value={subject} onChange={(e)=>setSubject(e.target.value)} required/></label><label data-wide><span>Message</span><textarea rows={12} value={body} onChange={(e)=>setBody(e.target.value)} required/></label>{error?<div className={styles.formError}>{error}</div>:null}</div><footer><span>Le message est créé dans la queue; l’envoi est confirmé séparément.</span><button type="button" onClick={close}>Annuler</button><button type="submit" data-primary disabled={busy}><Send size={15}/>{busy?'Création…':'Créer la communication'}</button></footer></form></div></OperatorOverlayPortal>
}

function Truth({label,value,detail,tone='neutral'}:{label:string;value:string|number;detail:string;tone?:string}){return <div className={styles.truth} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>}
function dateTime(value:unknown){if(!value)return'—';const date=new Date(String(value));return Number.isNaN(date.getTime())?String(value):date.toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})}
function human(value:string){return String(value||'').replace(/[._-]/g,' ').replace(/\b\w/g,(l)=>l.toUpperCase())}
