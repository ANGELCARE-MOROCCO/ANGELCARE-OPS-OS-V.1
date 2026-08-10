'use client'

import type { ReactNode } from 'react'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, Ban, BellRing, Bot, Boxes, CalendarClock, CheckCircle2,
  ChevronRight, CircleDollarSign, Clock3, Copy, FileCheck2, Filter, Gauge, Inbox, Link2, Mail, MailCheck,
  MailOpen, MessageCircleReply, Network, Pause, Pencil, Play, Plus, RefreshCcw, RotateCcw, Search, Send,
  ServerCog, Settings2, ShieldCheck, Sparkles, Split, TimerReset, UsersRound, Workflow, X, XCircle,
} from 'lucide-react'
import OperatorOverlayPortal from '../OperatorOverlayPortal'
import { EMAIL_COMMAND_MODES, EMAIL_EVENT_CATALOGUE, emailCommandHref } from './EmailCommandContract'
import type { EmailCommandMode, EmailCommandSnapshot } from '@/types/angelcare360/operator/email-command'
import styles from './EmailCommandOperatingSystem.module.css'

type PortalState =
  | { kind: 'rule'; record?: Record<string, unknown> | null }
  | { kind: 'message'; record?: Record<string, unknown> | null }
  | { kind: 'template'; record?: Record<string, unknown> | null }
  | { kind: 'match'; record: Record<string, unknown> }
  | { kind: 'approval'; record: Record<string, unknown> }
  | null

type Props = { snapshot: EmailCommandSnapshot; initialMode: EmailCommandMode }

export default function EmailCommandOperatingSystem({ snapshot: initialSnapshot, initialMode }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<EmailCommandMode>(initialMode)
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [portal, setPortal] = useState<PortalState>(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function refresh() {
    setBusy(true)
    try {
      const response = await fetch('/api/angelcare360/operator/email-command?limit=500', { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error || 'Actualisation impossible.')
      setSnapshot(body.snapshot)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Actualisation impossible.')
    } finally { setBusy(false) }
  }

  async function execute(operation: string, payload: Record<string, unknown>) {
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch('/api/angelcare360/operator/email-command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation, payload }) })
      const body = await response.json()
      if (!response.ok || body.ok === false) throw new Error(body.error || 'Commande Email OS impossible.')
      setPortal(null)
      setNotice('Commande exécutée et auditée.')
      await refresh()
      return body
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Commande Email OS impossible.')
      return null
    } finally { setBusy(false) }
  }

  function selectMode(next: EmailCommandMode) {
    setMode(next)
    router.replace(emailCommandHref(next), { scroll: false })
  }

  const filteredMessages = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return snapshot.messages
    return snapshot.messages.filter((item) => [item.message_reference, item.subject, item.sender_email, ...(item.recipient_emails || []), item.classification, item.status].join(' ').toLowerCase().includes(term))
  }, [query, snapshot.messages])

  return (
    <div className={styles.os}>
      <header className={styles.commandCrown}>
        <div className={styles.commandIdentity}>
          <div className={styles.commandMark}><Mail size={24}/></div>
          <div><span>AngelCare 360 Operator · Communication Control Tower</span><h1>Email Automation & Customer Correspondence OS</h1><p>Automatiser, superviser, recevoir, identifier, attribuer et conserver chaque correspondance client.</p></div>
        </div>
        <div className={styles.commandActions}>
          <button type="button" onClick={() => setPortal({ kind: 'message' })}><Mail size={16}/>Composer</button>
          <button type="button" onClick={() => setPortal({ kind: 'rule' })}><Workflow size={16}/>Nouvelle règle</button>
          <button type="button" data-primary onClick={refresh} disabled={busy}><RefreshCcw size={16}/>{busy ? 'Synchronisation…' : 'Actualiser'}</button>
        </div>
        <div className={styles.truthStrip}>
          <Truth label="Queue active" value={snapshot.metrics.queued} detail="planifiés, queue & retry" tone="info"/>
          <Truth label="Approbations" value={snapshot.metrics.awaitingApproval} detail="décisions en attente" tone={snapshot.metrics.awaitingApproval ? 'warning' : 'good'}/>
          <Truth label="Inbound non matchés" value={snapshot.metrics.inboundUnmatched} detail="identité client requise" tone={snapshot.metrics.inboundUnmatched ? 'critical' : 'good'}/>
          <Truth label="Réponse AngelCare" value={snapshot.metrics.awaitingAngelcare} detail="conversations à traiter" tone={snapshot.metrics.awaitingAngelcare ? 'warning' : 'good'}/>
          <Truth label="Boîtes prêtes" value={`${snapshot.metrics.mailboxConfigured}/${snapshot.mailboxes.length}`} detail="SMTP/POP3 configurés" tone={snapshot.metrics.mailboxConfigured === snapshot.mailboxes.length ? 'good' : 'warning'}/>
        </div>
      </header>

      <nav className={styles.masterRail} aria-label="Email Command workspaces">
        {EMAIL_COMMAND_MODES.map((item, index) => (
          <button key={item.key} type="button" data-active={mode === item.key} onClick={() => selectMode(item.key)}>
            <span>{String(index + 1).padStart(2,'0')}</span><strong>{item.label}</strong><small>{item.signal}</small>
          </button>
        ))}
      </nav>

      <div className={styles.contextBar}>
        <label className={styles.searchBox}><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher message, client, destinataire, règle…"/></label>
        <div className={styles.contextFilters}><button type="button"><Filter size={15}/>Filtres gouvernés</button><button type="button"><CalendarClock size={15}/>Horizon 30 jours</button><button type="button"><ShieldCheck size={15}/>Accès mailbox</button></div>
      </div>

      {notice ? <div className={styles.notice}><BadgeCheck size={16}/><span>{notice}</span><button type="button" onClick={() => setNotice('')}><X size={15}/></button></div> : null}

      <main className={styles.canvas}>
        {mode === 'command' ? <CommandScene snapshot={snapshot} open={setPortal}/> : null}
        {mode === 'automation' ? <AutomationScene snapshot={snapshot} open={setPortal} execute={execute}/> : null}
        {mode === 'outbound' ? <OutboundScene messages={filteredMessages.filter((item) => item.direction === 'outbound')} open={setPortal} execute={execute}/> : null}
        {mode === 'inbound' ? <InboundScene snapshot={snapshot} messages={filteredMessages.filter((item) => item.direction === 'inbound')} open={setPortal} execute={execute}/> : null}
        {mode === 'conversations' ? <ConversationScene snapshot={snapshot} messages={filteredMessages} open={setPortal}/> : null}
        {mode === 'templates' ? <TemplateScene snapshot={snapshot} open={setPortal}/> : null}
        {mode === 'approvals' ? <ApprovalScene snapshot={snapshot} open={setPortal} execute={execute}/> : null}
        {mode === 'deliverability' ? <DeliverabilityScene snapshot={snapshot}/> : null}
      </main>

      <footer className={styles.commandDock}>
        <div><span>Mode actif</span><strong>{EMAIL_COMMAND_MODES.find((item) => item.key === mode)?.label}</strong><small>{EMAIL_COMMAND_MODES.find((item) => item.key === mode)?.signal}</small></div>
        <div className={styles.dockSignals}><span><Activity size={14}/>Email OS source de vérité</span><span><Network size={14}/>Windows Bridge + Menara</span><span><ShieldCheck size={14}/>Audit & permissions</span></div>
        <button type="button" data-primary onClick={() => setPortal(mode === 'automation' ? { kind: 'rule' } : mode === 'templates' ? { kind: 'template' } : { kind: 'message' })}><Plus size={16}/>Créer dans ce contexte</button>
      </footer>

      {portal ? <CommandPortal portal={portal} snapshot={snapshot} close={() => setPortal(null)} execute={execute} busy={busy}/> : null}
    </div>
  )
}

function CommandScene({ snapshot, open }: { snapshot: EmailCommandSnapshot; open: (value: PortalState) => void }) {
  const critical = snapshot.messages.filter((item) => item.status === 'failed' || (item.direction === 'inbound' && item.requires_response && !item.resolved_at)).slice(0, 8)
  const flow = [
    ['Events', snapshot.executions.length], ['Queued', snapshot.metrics.queued], ['SMTP accepted', snapshot.messages.filter((item) => item.delivery_state === 'smtp_accepted').length],
    ['Replies', snapshot.metrics.replied], ['Resolved', snapshot.messages.filter((item) => item.resolved_at).length],
  ]
  return <div className={styles.commandScene}>
    <section className={styles.flowField}>
      <SectionTitle eyebrow="Communication flow command field" title="Du signal métier à l’issue client" detail="La chaîne entière reste traçable : événement, règle, queue, livraison, réponse et action métier."/>
      <div className={styles.flowTopology}>{flow.map(([label, value], index) => <div key={String(label)}><span>{String(index + 1).padStart(2,'0')}</span><strong>{value}</strong><small>{label}</small>{index < flow.length - 1 ? <ArrowRight size={18}/> : null}</div>)}</div>
      <div className={styles.flowBands}>
        <SignalBand label="Automations actives" value={snapshot.metrics.activeRules} tone="violet"/>
        <SignalBand label="Approbations" value={snapshot.metrics.awaitingApproval} tone="amber"/>
        <SignalBand label="Échecs" value={snapshot.metrics.failed} tone="red"/>
        <SignalBand label="Unmatched inbound" value={snapshot.metrics.inboundUnmatched} tone="blue"/>
      </div>
    </section>
    <section className={styles.decisionQueue}><SectionTitle eyebrow="Executive attention queue" title="Ce qui exige une décision maintenant" detail="Chaque signal ouvre le message, la règle ou le client concerné."/>
      <div className={styles.decisionList}>{critical.length ? critical.map((item) => <button type="button" key={item.id} onClick={() => open(item.direction === 'inbound' && !item.client_id ? { kind: 'match', record: item as unknown as Record<string, unknown> } : { kind: 'message', record: item as unknown as Record<string, unknown> })}><span data-tone={item.status === 'failed' ? 'critical' : 'warning'}>{item.status === 'failed' ? <XCircle size={17}/> : <TimerReset size={17}/>}</span><div><strong>{item.subject}</strong><small>{item.message_reference} · {item.direction === 'inbound' ? item.sender_email : item.recipient_emails.join(', ')}</small></div><em>{human(item.status)}</em><ChevronRight size={16}/></button>) : <Empty title="Aucune urgence communication" detail="Les queues critiques sont actuellement maîtrisées."/>}</div>
    </section>
    <section className={styles.mailboxPulse}><SectionTitle eyebrow="Mailbox infrastructure" title="Santé opérationnelle des boîtes" detail="Configuration provider, SMTP, POP3 et bridge visible sans exposer les secrets."/>
      <div className={styles.mailboxMiniGrid}>{snapshot.mailboxes.map((mailbox) => <div key={mailbox.key} data-ready={mailbox.configured}><span>{mailbox.configured ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}</span><strong>{mailbox.label}</strong><small>{mailbox.email}</small><em>{mailbox.configured ? 'Prête' : 'À configurer'}</em></div>)}</div>
    </section>
  </div>
}

function AutomationScene({ snapshot, open, execute }: { snapshot: EmailCommandSnapshot; open: (value: PortalState) => void; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown> }) {
  return <div className={styles.automationScene}>
    <section className={styles.ruleLibrary}><SectionTitle eyebrow="No-code business automation" title="Règles, conditions, destinataires et gouvernance" detail="Aucun event key ni UUID n’est demandé dans l’expérience normale."/>
      <div className={styles.ruleGrid}>{snapshot.rules.map((rule) => <article key={rule.id} data-status={rule.status}><header><span><Workflow size={17}/>{rule.rule_code}</span><em>{human(rule.status)}</em></header><h3>{rule.name}</h3><p>{rule.description || 'Automation métier gouvernée.'}</p><div className={styles.ruleLogic}><span>WHEN</span><strong>{human(rule.trigger_event)}</strong><i/><span>THEN</span><strong>{human(String((rule.actions || {}).action || 'queue_email'))}</strong></div><footer><small>{Number(rule.execution_count || 0)} exécution(s) · {Number(rule.failure_count || 0)} échec(s)</small><button type="button" onClick={() => open({ kind: 'rule', record: rule as unknown as Record<string, unknown> })}><Pencil size={14}/>Configurer</button><button type="button" data-state onClick={() => execute('rule.status', { id: rule.id, status: rule.status === 'active' ? 'paused' : 'active' })}>{rule.status === 'active' ? <Pause size={14}/> : <Play size={14}/>} {rule.status === 'active' ? 'Pause' : 'Activer'}</button></footer></article>)}<button type="button" className={styles.createRuleCard} onClick={() => open({ kind: 'rule' })}><Plus size={23}/><strong>Nouvelle automation</strong><small>Déclencheur, audience, délai, approbation et suppression</small></button></div>
    </section>
    <aside className={styles.automationIntelligence}><SectionTitle eyebrow="Automation intelligence" title="Contrôles anti-surcommunication" detail="La règle conseille et protège sans masquer l’autorité opérationnelle."/>
      <ControlMetric icon={<TimerReset/>} label="Frequency caps" value="Obligatoires" detail="Volume par destinataire et période"/>
      <ControlMetric icon={<Ban/>} label="Suppressions" value={snapshot.suppressions.filter((item) => item.status === 'active').length} detail="Destinataires exclus"/>
      <ControlMetric icon={<ShieldCheck/>} label="Approval policies" value={snapshot.rules.filter((item) => Boolean(item.approval_policy?.required)).length} detail="Règles sous autorité"/>
      <ControlMetric icon={<Clock3/>} label="Quiet hours" value={snapshot.rules.filter((item) => Object.keys(item.quiet_hours || {}).length).length} detail="Fenêtres protégées"/>
    </aside>
  </div>
}

function OutboundScene({ messages, open, execute }: { messages: EmailCommandSnapshot['messages']; open: (value: PortalState) => void; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown> }) {
  const states = ['awaiting_approval','scheduled','queued','smtp_accepted','failed']
  return <div className={styles.outboundScene}>
    <section className={styles.queueArchitecture}><SectionTitle eyebrow="Outbound execution architecture" title="Queue, décisions, provider et issue" detail="SMTP accepted n’est jamais présenté comme une preuve d’inbox delivery."/>
      <div className={styles.queueLanes}>{states.map((state) => <div key={state} className={styles.queueLane}><header><span>{human(state)}</span><strong>{messages.filter((item) => item.status === state).length}</strong></header>{messages.filter((item) => item.status === state).slice(0, 8).map((item) => <button type="button" key={item.id} onClick={() => open({ kind: 'message', record: item as unknown as Record<string, unknown> })}><strong>{item.subject}</strong><small>{item.message_reference}</small><span>{item.recipient_emails.join(', ')}</span><em>{item.scheduled_at ? dateTime(item.scheduled_at) : item.sent_at ? dateTime(item.sent_at) : 'Maintenant'}</em></button>)}</div>)}</div>
    </section>
    <aside className={styles.outboundControl}><SectionTitle eyebrow="Operator control" title="Actions de queue" detail="Chaque action est persistée et auditée."/>
      {messages.filter((item) => ['queued','approved','failed','retry_scheduled'].includes(item.status)).slice(0, 7).map((item) => <div key={item.id}><span>{item.status === 'failed' ? <AlertTriangle/> : <Send/>}</span><div><strong>{item.subject}</strong><small>{human(item.status)} · {item.recipient_emails[0]}</small></div><button type="button" onClick={() => execute('message.send', { id: item.id, force: true })}>{item.status === 'failed' ? 'Retry' : 'Send now'}</button></div>)}
    </aside>
  </div>
}

function InboundScene({ snapshot, messages, open, execute }: { snapshot: EmailCommandSnapshot; messages: EmailCommandSnapshot['messages']; open: (value: PortalState) => void; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown> }) {
  const [selectedId, setSelectedId] = useState(messages[0]?.id || '')
  const selected = messages.find((item) => item.id === selectedId) || messages[0]
  const client = snapshot.clients.find((item) => String(item.id) === selected?.client_id)
  const contact = snapshot.contacts.find((item) => String(item.id) === selected?.contact_id)
  return <div className={styles.inboundScene}>
    <aside className={styles.inboundQueue}><header><span>Intelligence queues</span><strong>{messages.length}</strong></header><div className={styles.inboundModes}><button type="button" data-active>À traiter <b>{messages.filter((item) => item.requires_response && !item.resolved_at).length}</b></button><button type="button">Non matchés <b>{messages.filter((item) => !item.client_id).length}</b></button><button type="button">Réclamations <b>{messages.filter((item) => item.classification === 'complaint').length}</b></button><button type="button">SLA à risque <b>{messages.filter((item) => item.response_due_at && new Date(item.response_due_at).getTime() < Date.now()).length}</b></button></div><div className={styles.inboundList}>{messages.map((item) => <button key={item.id} type="button" data-active={selected?.id === item.id} onClick={() => setSelectedId(item.id)}><span>{initials(item.sender_name || item.sender_email)}</span><div><strong>{item.sender_name || item.sender_email}</strong><small>{item.subject}</small><em>{human(item.classification || 'unclassified')} · {dateTime(item.received_at || item.created_at)}</em></div>{!item.client_id ? <AlertTriangle size={15}/> : item.requires_response ? <Clock3 size={15}/> : <CheckCircle2 size={15}/>}</button>)}</div></aside>
    <section className={styles.conversationPlane}>{selected ? <><header><div><span>{selected.message_reference} · {human(selected.classification || 'general')}</span><h2>{selected.subject}</h2><p>De {selected.sender_name || selected.sender_email} vers {selected.recipient_emails.join(', ')}</p></div><div><button type="button" onClick={() => open({ kind: 'message', record: { thread_key: selected.thread_key, recipient_emails: [selected.sender_email], subject: `Re: ${selected.subject}`, client_id: selected.client_id, contact_id: selected.contact_id, tenant_id: selected.tenant_id } })}><MessageCircleReply size={15}/>Répondre</button><button type="button" onClick={() => execute('message.update', { id: selected.id, action: 'resolve' })}><CheckCircle2 size={15}/>Résoudre</button></div></header><article className={styles.messageBody}><div className={styles.messageMeta}><span>{selected.sender_email}</span><span>{dateTime(selected.received_at || selected.created_at)}</span><span>{human(selected.confidence || 'unknown')}</span></div><p>{selected.body_text || 'Le contenu texte n’est pas disponible. Ouvrir la preuve HTML ou la pièce jointe.'}</p><div className={styles.attachments}>{(selected.attachments || []).map((item, index) => <button type="button" key={index}><FileCheck2 size={15}/>{String(item.filename || item.name || `Pièce ${index + 1}`)}</button>)}</div></article><div className={styles.threadActions}><button type="button"><Link2 size={15}/>Lier objet métier</button><button type="button"><BellRing size={15}/>Créer engagement</button><button type="button"><Split size={15}/>Créer ticket / plainte</button><button type="button" onClick={() => open({ kind: 'message', record: selected as unknown as Record<string, unknown> })}><Settings2 size={15}/>Inspecter</button></div></> : <Empty title="Aucun inbound sélectionné" detail="Le prochain message POP3 apparaîtra ici après normalisation."/>}</section>
    <aside className={styles.customerIntelligence}>{selected ? <><header><span>Customer intelligence</span><strong>{client ? String(client.display_name) : 'Expéditeur non identifié'}</strong><small>{contact ? `${String(contact.full_name)} · ${String(contact.role_type)}` : selected.sender_email}</small></header><div className={styles.matchEvidence}><span data-confidence={selected.confidence}>{human(selected.confidence || 'unmatched')}</span><p>{Array.isArray(selected.metadata?.match_evidence) ? selected.metadata.match_evidence.map(String).join(' · ') : 'Aucune preuve de matching.'}</p></div>{client ? <><Insight label="Client" value={String(client.display_name)}/><Insight label="Tenant" value={snapshot.tenants.find((item) => String(item.id) === selected.tenant_id)?.tenant_slug ? String(snapshot.tenants.find((item) => String(item.id) === selected.tenant_id)?.tenant_slug) : 'Non lié'}/><Insight label="Réponse due" value={selected.response_due_at ? dateTime(selected.response_due_at) : 'Non requise'}/><button type="button" data-primary onClick={() => window.location.assign(`/angelcare-360-operator/growth?view=portfolio`)}>Ouvrir dossier client<ArrowRight size={15}/></button></> : <button type="button" data-primary onClick={() => open({ kind: 'match', record: selected as unknown as Record<string, unknown> })}><UsersRound size={15}/>Résoudre l’identité</button>}</> : null}</aside>
  </div>
}

function ConversationScene({ snapshot, messages, open }: { snapshot: EmailCommandSnapshot; messages: EmailCommandSnapshot['messages']; open: (value: PortalState) => void }) {
  const threads = useMemo(() => {
    const map = new Map<string, EmailCommandSnapshot['messages']>()
    for (const message of messages) { const key = message.thread_key || message.id; map.set(key, [...(map.get(key) || []), message]) }
    return [...map.entries()].map(([key, rows]) => ({ key, rows: rows.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), latest: rows[rows.length - 1] })).sort((a,b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime())
  }, [messages])
  return <div className={styles.conversationScene}><section className={styles.customerThreads}><SectionTitle eyebrow="Relationship correspondence" title="Conversations consolidées par client" detail="Les treize boîtes sont réunies sans dupliquer les messages."/>{threads.map((thread) => { const client = snapshot.clients.find((item) => String(item.id) === thread.latest.client_id); return <button key={thread.key} type="button" onClick={() => open({ kind: 'message', record: thread.latest as unknown as Record<string, unknown> })}><span className={styles.threadAvatar}>{initials(String(client?.display_name || thread.latest.sender_email))}</span><div><strong>{String(client?.display_name || 'Correspondant non identifié')}</strong><h3>{thread.latest.subject}</h3><p>{thread.rows.length} message(s) · {thread.rows.filter((item) => item.direction === 'inbound').length} inbound · {thread.rows.filter((item) => item.direction === 'outbound').length} outbound</p></div><div className={styles.threadStatus}><span data-wait={thread.latest.direction === 'inbound'}>{thread.latest.direction === 'inbound' ? 'Action AngelCare' : 'Attente client'}</span><small>{dateTime(thread.latest.created_at)}</small></div><ChevronRight size={17}/></button>})}</section><aside className={styles.commitmentRail}><SectionTitle eyebrow="Business commitments" title="Promesses issues des emails" detail="Une conversation devient une action, pas une archive passive."/>{snapshot.commitments.slice(0, 12).map((item) => <div key={String(item.id)}><span>{item.status === 'completed' ? <CheckCircle2/> : <Clock3/>}</span><div><strong>{String(item.title)}</strong><small>{dateTime(item.due_at)}</small></div><em>{human(String(item.status))}</em></div>)}</aside></div>
}

function TemplateScene({ snapshot, open }: { snapshot: EmailCommandSnapshot; open: (value: PortalState) => void }) {
  return <div className={styles.templateScene}><section className={styles.templateLab}><SectionTitle eyebrow="Branded communication laboratory" title="Templates gouvernés, variables validées" detail="Chaque version conserve objet, HTML, fallback texte, approbation et dates d’effet."/><div className={styles.templateGrid}>{snapshot.templates.map((template) => <button type="button" key={template.id} onClick={() => open({ kind: 'template', record: template as unknown as Record<string, unknown> })}><header><span>{template.language.toUpperCase()}</span><em>{human(template.status)}</em></header><MailOpen size={23}/><strong>{template.name}</strong><small>{human(template.purpose)}</small><p>{template.subject_template}</p><footer><span>v{String(template.version_number)}</span><span>{template.approval_required ? 'Approbation' : 'Auto-send éligible'}</span></footer></button>)}<button type="button" data-create onClick={() => open({ kind: 'template' })}><Plus size={23}/><strong>Nouveau template</strong><small>Objet, contenu, variables, CTA et gouvernance</small></button></div></section><aside className={styles.journeyMap}><SectionTitle eyebrow="Journey orchestration" title="Parcours communication" detail="Délais, conditions, suppression et sorties visibles."/><JourneyStep index="01" title="Invitation" detail="Accès tenant créé"/><JourneyStep index="02" title="Reminder" detail="Non ouvert après 24h"/><JourneyStep index="03" title="Activation" detail="Compte sécurisé actif"/><JourneyStep index="04" title="Onboarding" detail="Bienvenue & préparation"/><JourneyStep index="05" title="Training" detail="Administrateur opérationnel"/></aside></div>
}

function ApprovalScene({ snapshot, open, execute }: { snapshot: EmailCommandSnapshot; open: (value: PortalState) => void; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown> }) {
  const pending = snapshot.approvals.filter((item) => ['requested','pending'].includes(item.status))
  return <div className={styles.approvalScene}><section className={styles.approvalArchitecture}><SectionTitle eyebrow="Governed decision chamber" title="Autoriser les communications sensibles" detail="Bulk, stratégique, juridique, prix, suspension et sécurité ne partent pas silencieusement."/><div className={styles.approvalMatrix}>{pending.map((approval) => { const message = snapshot.messages.find((item) => item.id === approval.message_id); return <article key={approval.id}><header><span><ShieldCheck size={16}/>{human(approval.approval_type)}</span><em>{dateTime(approval.requested_at)}</em></header><h3>{message?.subject || 'Communication gouvernée'}</h3><p>{approval.risk_summary || approval.reason || 'Validation de l’autorité requise avant exécution.'}</p><div><Insight label="Destinataires" value={message?.recipient_emails.join(', ') || 'À résoudre'}/><Insight label="Mailbox" value={message?.mailbox_key || 'Politique par défaut'}/><Insight label="Client" value={snapshot.clients.find((item) => String(item.id) === message?.client_id)?.display_name ? String(snapshot.clients.find((item) => String(item.id) === message?.client_id)?.display_name) : 'Non lié'}/></div><footer><button type="button" onClick={() => open({ kind: 'approval', record: approval as unknown as Record<string, unknown> })}>Inspecter</button><button type="button" data-danger onClick={() => execute('approval.decide', { id: approval.id, decision: 'rejected', note: 'Rejet depuis Email Command' })}>Rejeter</button><button type="button" data-primary onClick={() => execute('approval.decide', { id: approval.id, decision: 'approved', note: 'Approuvé depuis Email Command' })}>Approuver</button></footer></article>})}{!pending.length ? <Empty title="Aucune approbation en attente" detail="Les communications gouvernées ont toutes une décision."/> : null}</div></section></div>
}

function DeliverabilityScene({ snapshot }: { snapshot: EmailCommandSnapshot }) {
  return <div className={styles.deliverabilityScene}><section className={styles.infrastructureObservatory}><SectionTitle eyebrow="Email infrastructure observatory" title="Bridge, SMTP, POP3 et preuve de transport" detail="Aucun secret n’est exposé; seuls état, endpoint et horodatage opérationnel sont visibles."/><div className={styles.mailboxGrid}>{snapshot.mailboxes.map((mailbox) => <article key={mailbox.key} data-ready={mailbox.configured}><header><span>{mailbox.configured ? <ServerCog size={18}/> : <AlertTriangle size={18}/>}</span><div><strong>{mailbox.label}</strong><small>{mailbox.email}</small></div><em>{mailbox.configured ? 'Ready' : 'Configuration requise'}</em></header><div className={styles.infrastructurePlanes}><Insight label="Outbound" value={`${mailbox.smtp_host || '—'}:${mailbox.smtp_port || '—'}`}/><Insight label="Inbound" value={`${mailbox.inbound_host || '—'}:${mailbox.inbound_port || '—'}`}/><Insight label="Bridge" value={mailbox.bridge_enabled ? 'Activé' : 'SMTP direct'}/><Insight label="Source" value={mailbox.source || 'env'}/></div><footer><span><Activity size={14}/>Provider evidence</span><span><ShieldCheck size={14}/>Secrets redacted</span></footer></article>)}</div></section><aside className={styles.deliveryLedger}><SectionTitle eyebrow="Delivery event ledger" title="Dernières preuves" detail="Generated, bridge, SMTP, reply et action métier sont distincts."/>{snapshot.deliveryEvents.slice(0, 20).map((event) => <div key={String(event.id)}><span data-event={String(event.event_type)}>{deliveryIcon(String(event.event_type))}</span><div><strong>{human(String(event.event_type))}</strong><small>{String(event.provider || 'email-os')} · {dateTime(event.occurred_at)}</small></div></div>)}</aside></div>
}

function CommandPortal({ portal, snapshot, close, execute, busy }: { portal: NonNullable<PortalState>; snapshot: EmailCommandSnapshot; close: () => void; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown>; busy: boolean }) {
  return <OperatorOverlayPortal><div className={styles.portalBackdrop} role="dialog" aria-modal="true"><section className={styles.portal}><header><div><span>Email Command Mission Portal</span><h2>{portalTitle(portal.kind)}</h2><p>{portalPurpose(portal.kind)}</p></div><button type="button" onClick={close}><X size={18}/></button></header><div className={styles.portalBody}>{portal.kind === 'rule' ? <RuleEditor record={portal.record} snapshot={snapshot} execute={execute} busy={busy}/> : null}{portal.kind === 'message' ? <MessageEditor record={portal.record} snapshot={snapshot} execute={execute} busy={busy}/> : null}{portal.kind === 'template' ? <TemplateEditor record={portal.record} execute={execute} busy={busy}/> : null}{portal.kind === 'match' ? <MatchEditor record={portal.record} snapshot={snapshot} execute={execute} busy={busy}/> : null}{portal.kind === 'approval' ? <ApprovalInspector record={portal.record} snapshot={snapshot} execute={execute} busy={busy}/> : null}</div></section></div></OperatorOverlayPortal>
}

function RuleEditor({ record, snapshot, execute, busy }: { record?: Record<string, unknown> | null; snapshot: EmailCommandSnapshot; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown>; busy: boolean }) {
  const [form, setForm] = useState({ id: text(record?.id), name: text(record?.name), description: text(record?.description), triggerEvent: text(record?.trigger_event) || EMAIL_EVENT_CATALOGUE[0], mailboxKey: text(record?.mailbox_key) || 'B2B', templateId: text(record?.template_id), recipientRole: text((record?.recipient_policy as Record<string,unknown>)?.role_types) || 'tenant_owner', delayMinutes: text((record?.actions as Record<string,unknown>)?.delay_minutes) || '0', approvalRequired: Boolean((record?.approval_policy as Record<string,unknown>)?.required), maxPerWeek: text((record?.frequency_policy as Record<string,unknown>)?.max_per_week) || '2' })
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }))
  return <form className={styles.editorForm} onSubmit={(event) => { event.preventDefault(); execute('rule.upsert', { ...form, conditions: {}, actions: { action: 'queue_email', delay_minutes: Number(form.delayMinutes) }, recipientPolicy: { role_types: [form.recipientRole] }, approvalPolicy: { required: form.approvalRequired }, frequencyPolicy: { max_per_week: Number(form.maxPerWeek) }, suppressionPolicy: { respect_global: true }, quietHours: { start: '19:00', end: '08:00' } }) }}><div className={styles.editorHero}><Workflow size={28}/><div><strong>Rule architecture</strong><p>WHEN → IF → WHO → GOVERNANCE → THEN</p></div></div><div className={styles.formGrid}><Field label="Nom de la règle"><input value={form.name} onChange={(e) => set('name', e.target.value)} required/></Field><Field label="Événement métier"><select value={form.triggerEvent} onChange={(e) => set('triggerEvent', e.target.value)}>{EMAIL_EVENT_CATALOGUE.map((item) => <option key={item} value={item}>{human(item)}</option>)}</select></Field><Field label="Boîte d’envoi"><select value={form.mailboxKey} onChange={(e) => set('mailboxKey', e.target.value)}>{snapshot.mailboxes.map((item) => <option key={item.key} value={item.key}>{item.label} · {item.email}</option>)}</select></Field><Field label="Template"><select value={form.templateId} onChange={(e) => set('templateId', e.target.value)}><option value="">Sélectionner</option>{snapshot.templates.filter((item) => item.status === 'active').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Rôle destinataire"><select value={form.recipientRole} onChange={(e) => set('recipientRole', e.target.value)}><option value="tenant_owner">Tenant Owner</option><option value="director">Direction</option><option value="finance_authority">Finance</option><option value="school_admin">Administrateur école</option><option value="support_contact">Contact support</option><option value="renewal_decision_maker">Décideur renouvellement</option></select></Field><Field label="Délai après événement (min)"><input type="number" min="0" value={form.delayMinutes} onChange={(e) => set('delayMinutes', e.target.value)}/></Field><Field label="Maximum / semaine / destinataire"><input type="number" min="1" max="20" value={form.maxPerWeek} onChange={(e) => set('maxPerWeek', e.target.value)}/></Field><label className={styles.checkField}><input type="checkbox" checked={form.approvalRequired} onChange={(e) => set('approvalRequired', e.target.checked)}/><span>Exiger une approbation avant queue</span></label><Field label="Description"><textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4}/></Field></div><footer className={styles.editorFooter}><button type="button" onClick={() => window.history.back()}>Annuler</button><button type="submit" data-primary disabled={busy}><ShieldCheck size={16}/>{record ? 'Enregistrer nouvelle version' : 'Créer la règle'}</button></footer></form>
}

function MessageEditor({ record, snapshot, execute, busy }: { record?: Record<string, unknown> | null; snapshot: EmailCommandSnapshot; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown>; busy: boolean }) {
  const initialRecipients = Array.isArray(record?.recipient_emails) ? (record?.recipient_emails as unknown[]).map(String).join(', ') : text(record?.sender_email)
  const [form, setForm] = useState({ mailboxKey: text(record?.mailbox_key) || 'B2B', recipientEmails: initialRecipients, subject: text(record?.subject), bodyText: text(record?.body_text), clientId: text(record?.client_id), contactId: text(record?.contact_id), tenantId: text(record?.tenant_id), classification: text(record?.classification) || 'general_correspondence', requiresResponse: Boolean(record?.requires_response), approvalRequired: false, scheduledAt: '' })
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }))
  const selectedClientContacts = snapshot.contacts.filter((item) => !form.clientId || String(item.client_id) === form.clientId)
  return <form className={styles.messageComposer} onSubmit={(event) => { event.preventDefault(); execute('message.compose', { ...form, recipientEmails: form.recipientEmails.split(',').map((item) => item.trim()), mailboxEmail: snapshot.mailboxes.find((item) => item.key === form.mailboxKey)?.email || null }) }}><div className={styles.composerHeader}><MailCheck size={27}/><div><strong>Correspondence composer</strong><p>Contexte client, mailbox, gouvernance et preuve sont compilés avant l’envoi.</p></div></div><div className={styles.composerArchitecture}><section><h3>Distribution</h3><Field label="Boîte d’envoi"><select value={form.mailboxKey} onChange={(e) => set('mailboxKey',e.target.value)}>{snapshot.mailboxes.map((item) => <option key={item.key} value={item.key}>{item.label} · {item.email}</option>)}</select></Field><Field label="Client"><select value={form.clientId} onChange={(e) => set('clientId',e.target.value)}><option value="">Non lié</option>{snapshot.clients.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.display_name)}</option>)}</select></Field><Field label="Contact"><select value={form.contactId} onChange={(e) => { const contact = selectedClientContacts.find((item) => String(item.id) === e.target.value); set('contactId',e.target.value); if (contact?.email) set('recipientEmails',String(contact.email)) }}><option value="">Résolution manuelle</option>{selectedClientContacts.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.full_name)} · {String(item.role_type)}</option>)}</select></Field><Field label="Destinataires"><input value={form.recipientEmails} onChange={(e) => set('recipientEmails',e.target.value)} placeholder="email@client.ma" required/></Field></section><section><h3>Message</h3><Field label="Objet"><input value={form.subject} onChange={(e) => set('subject',e.target.value)} required/></Field><Field label="Classification"><select value={form.classification} onChange={(e) => set('classification',e.target.value)}><option value="general_correspondence">Correspondance générale</option><option value="tenant_access_request">Accès tenant</option><option value="invoice_payment">Finance</option><option value="support_request">Support</option><option value="complaint">Réclamation</option><option value="offer_response">Commercial</option><option value="renewal">Renouvellement</option></select></Field><Field label="Contenu"><textarea value={form.bodyText} onChange={(e) => set('bodyText',e.target.value)} rows={12} required/></Field></section><aside><h3>Gouvernance</h3><Field label="Planifier"><input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt',e.target.value)}/></Field><label className={styles.checkField}><input type="checkbox" checked={form.requiresResponse} onChange={(e) => set('requiresResponse',e.target.checked)}/><span>Réponse client attendue</span></label><label className={styles.checkField}><input type="checkbox" checked={form.approvalRequired} onChange={(e) => set('approvalRequired',e.target.checked)}/><span>Soumettre à approbation</span></label><div className={styles.preflight}><strong>Preflight</strong><span><CheckCircle2/>Mailbox résolue</span><span><CheckCircle2/>Client facultatif</span><span><CheckCircle2/>Suppression contrôlée à l’envoi</span><span><CheckCircle2/>Audit automatique</span></div></aside></div><footer className={styles.editorFooter}><span>Le message sera créé dans la queue Email OS; aucun succès visuel sans confirmation backend.</span><button type="submit" data-primary disabled={busy}><Send size={16}/>Créer la communication</button></footer></form>
}

function TemplateEditor({ record, execute, busy }: { record?: Record<string, unknown> | null; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown>; busy: boolean }) {
  const [form, setForm] = useState({ id: text(record?.id), name: text(record?.name), purpose: text(record?.purpose) || 'general_correspondence', language: text(record?.language) || 'fr', mailboxKey: text(record?.mailbox_key) || 'B2B', subjectTemplate: text(record?.subject_template), textTemplate: text(record?.text_template), htmlTemplate: text(record?.html_template), approvalRequired: Boolean(record?.approval_required) })
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }))
  return <form className={styles.editorForm} onSubmit={(event) => { event.preventDefault(); execute('template.upsert', { ...form, variableSchema: { supported: ['client.display_name','tenant.tenant_slug','event.reference','current.amount'] } }) }}><div className={styles.editorHero}><Sparkles size={28}/><div><strong>Branded template studio</strong><p>Version, langage, variable schema, fallback texte et approbation.</p></div></div><div className={styles.formGrid}><Field label="Nom"><input value={form.name} onChange={(e) => set('name',e.target.value)} required/></Field><Field label="Purpose"><select value={form.purpose} onChange={(e) => set('purpose',e.target.value)}><option value="tenant_access">Accès tenant</option><option value="commercial">Commercial</option><option value="finance">Finance</option><option value="support">Support</option><option value="renewal">Renouvellement</option><option value="general_correspondence">Général</option></select></Field><Field label="Langue"><select value={form.language} onChange={(e) => set('language',e.target.value)}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></Field><Field label="Objet"><input value={form.subjectTemplate} onChange={(e) => set('subjectTemplate',e.target.value)} placeholder="Activation — {{client.display_name}}" required/></Field><Field label="Fallback texte"><textarea value={form.textTemplate} onChange={(e) => set('textTemplate',e.target.value)} rows={10} required/></Field><Field label="HTML gouverné"><textarea value={form.htmlTemplate} onChange={(e) => set('htmlTemplate',e.target.value)} rows={10}/></Field><label className={styles.checkField}><input type="checkbox" checked={form.approvalRequired} onChange={(e) => set('approvalRequired',e.target.checked)}/><span>Approbation obligatoire</span></label></div><footer className={styles.editorFooter}><button type="submit" data-primary disabled={busy}><BadgeCheck size={16}/>{record ? 'Enregistrer nouvelle version' : 'Créer template'}</button></footer></form>
}

function MatchEditor({ record, snapshot, execute, busy }: { record: Record<string, unknown>; snapshot: EmailCommandSnapshot; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown>; busy: boolean }) {
  const [clientId,setClientId] = useState(''); const [contactId,setContactId] = useState(''); const [tenantId,setTenantId] = useState('')
  return <form className={styles.matchEditor} onSubmit={(event) => { event.preventDefault(); execute('inbound.match', { messageId: record.id, clientId, contactId, tenantId, reason: 'Résolution manuelle contrôlée' }) }}><div className={styles.editorHero}><UsersRound size={28}/><div><strong>Golden customer matching</strong><p>La décision devient une preuve de matching pour les prochains inbound.</p></div></div><div className={styles.unmatchedEvidence}><span>Expéditeur</span><strong>{text(record.sender_email)}</strong><small>{text(record.subject)}</small></div><Field label="Client confirmé"><select value={clientId} onChange={(e) => { setClientId(e.target.value); setContactId(''); setTenantId('') }} required><option value="">Sélectionner le client</option>{snapshot.clients.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.display_name)} · {String(item.city || '')}</option>)}</select></Field><Field label="Contact"><select value={contactId} onChange={(e) => setContactId(e.target.value)}><option value="">Non identifié</option>{snapshot.contacts.filter((item) => String(item.client_id) === clientId).map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.full_name)} · {String(item.role_type)}</option>)}</select></Field><Field label="Tenant"><select value={tenantId} onChange={(e) => setTenantId(e.target.value)}><option value="">Non lié</option>{snapshot.tenants.filter((item) => String(item.client_id) === clientId).map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.tenant_slug)}</option>)}</select></Field><footer className={styles.editorFooter}><span>Aucun match faible n’est appliqué silencieusement.</span><button type="submit" data-primary disabled={busy}><Link2 size={16}/>Confirmer et apprendre</button></footer></form>
}

function ApprovalInspector({ record, snapshot, execute, busy }: { record: Record<string, unknown>; snapshot: EmailCommandSnapshot; execute: (operation: string, payload: Record<string, unknown>) => Promise<unknown>; busy: boolean }) {
  const message = snapshot.messages.find((item) => item.id === record.message_id)
  return <div className={styles.approvalInspector}><div className={styles.editorHero}><ShieldCheck size={28}/><div><strong>Communication authority chamber</strong><p>Message, audience, risque, mailbox et calendrier sont visibles avant décision.</p></div></div><div className={styles.approvalPreview}><Insight label="Objet" value={message?.subject || '—'}/><Insight label="Recipients" value={message?.recipient_emails.join(', ') || '—'}/><Insight label="Mailbox" value={message?.mailbox_key || '—'}/><Insight label="Risk" value={text(record.risk_summary) || 'Standard'}/><Insight label="Reason" value={text(record.reason) || 'Automation governed'}/></div><article className={styles.emailPreview}><header>{message?.subject}</header><p>{message?.body_text}</p></article><footer className={styles.editorFooter}><button type="button" data-danger disabled={busy} onClick={() => execute('approval.decide',{id:record.id,decision:'rejected',note:'Rejet motivé par l’autorité'})}>Rejeter</button><button type="button" data-primary disabled={busy} onClick={() => execute('approval.decide',{id:record.id,decision:'approved',note:'Approuvé après revue complète'})}>Approuver la queue</button></footer></div>
}

function Truth({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: string }) { return <div className={styles.truth} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function SectionTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <header className={styles.sectionTitle}><span>{eyebrow}</span><h2>{title}</h2><p>{detail}</p></header> }
function SignalBand({ label, value, tone }: { label: string; value: number; tone: string }) { return <div data-tone={tone}><span>{label}</span><strong>{value}</strong><i/></div> }
function ControlMetric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string | number; detail: string }) { return <div className={styles.controlMetric}><span>{icon}</span><div><strong>{label}</strong><small>{detail}</small></div><em>{value}</em></div> }
function Insight({ label, value }: { label: string; value: string }) { return <div className={styles.insight}><span>{label}</span><strong>{value || '—'}</strong></div> }
function JourneyStep({ index, title, detail }: { index: string; title: string; detail: string }) { return <div className={styles.journeyStep}><span>{index}</span><div><strong>{title}</strong><small>{detail}</small></div><ArrowRight size={16}/></div> }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className={styles.empty}><Sparkles size={22}/><strong>{title}</strong><span>{detail}</span></div> }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label> }
function portalTitle(kind: NonNullable<PortalState>['kind']) { return ({ rule:'Automation Rule Studio',message:'Correspondence Composer',template:'Template & Brand Studio',match:'Inbound Identity Resolution',approval:'Communication Approval Chamber' } as Record<string,string>)[kind] }
function portalPurpose(kind: NonNullable<PortalState>['kind']) { return ({ rule:'Configurer déclencheur, audience, fréquence, approbation et action.',message:'Composer ou inspecter un message relié au contexte client.',template:'Ingénierie de contenu versionné et validé.',match:'Relier l’expéditeur au bon client sans risque de fuite.',approval:'Décider avec impact, audience et preuve complète.' } as Record<string,string>)[kind] }
function human(value: string) { return String(value || '').replace(/[._-]/g,' ').replace(/\b\w/g,(letter) => letter.toUpperCase()) }
function text(value: unknown) { return value === null || value === undefined ? '' : String(value) }
function dateTime(value: unknown) { if (!value) return '—'; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}) }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0,2).map((item) => item[0]?.toUpperCase()).join('') || 'EM' }
function deliveryIcon(event: string) { if (event.includes('failed')) return <XCircle size={15}/>; if (event.includes('reply')) return <MessageCircleReply size={15}/>; if (event.includes('accepted') || event.includes('sent')) return <MailCheck size={15}/>; return <Activity size={15}/> }
