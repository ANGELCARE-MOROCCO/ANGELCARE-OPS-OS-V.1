import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EMAIL_NAV, DEFAULT_TEMPLATES } from '@/lib/email-os/email-os-types'

type Mode = 'command'|'inbox'|'composer'|'templates'|'automation'|'approvals'|'followups'|'families'|'caregivers'|'missions'|'contracts'|'billing'|'incidents'|'hr'|'academy'|'campaigns'|'settings'|'audit'

async function table(name: string, select = '*', limit = 200) {
  const supabase = await createClient()
  const { data, error } = await supabase.from(name).select(select).order('created_at', { ascending: false }).limit(limit)
  return { data: data || [], error }
}

function byContext(rows: any[], ctx: string) { return rows.filter(r => String(r.business_context || '').includes(ctx) || String(r.context || '').includes(ctx)) }
function status(rows: any[], s: string) { return rows.filter(r => String(r.status || '').toLowerCase() === s) }
function urgent(rows: any[]) { return rows.filter(r => ['urgent','critical'].includes(String(r.priority || '').toLowerCase())) }
function date(v: any) { return v ? new Intl.DateTimeFormat('fr-FR', { dateStyle:'medium', timeStyle:'short' }).format(new Date(v)) : '—' }

export default async function EmailOsShell({ mode='command' }: { mode?: Mode }) {
  const [{data: messages, error: msgError}, {data: templates}, {data: approvals}, {data: automations}, {data: followups}, {data: audit}] = await Promise.all([
    table('email_messages'), table('email_templates'), table('email_approvals'), table('email_automations'), table('email_followups'), table('email_audit_logs')
  ])
  const openApprovals = approvals.filter((a:any)=>['pending','submitted','requested'].includes(String(a.status||'pending')))
  const openFollowups = followups.filter((f:any)=>!['done','cancelled'].includes(String(f.status||'open')))
  const queued = status(messages, 'queued')
  const failed = status(messages, 'failed')
  const received = status(messages, 'received')
  const templateRows = templates.length ? templates : DEFAULT_TEMPLATES
  const title = titles[mode]

  const focusRows = mode === 'billing' ? byContext(messages,'billing') : mode === 'incidents' ? byContext(messages,'incident') : mode === 'missions' ? byContext(messages,'mission') : mode === 'hr' ? byContext(messages,'hr') : mode === 'academy' ? byContext(messages,'academy') : mode === 'contracts' ? byContext(messages,'contract') : mode === 'families' ? byContext(messages,'family') : mode === 'caregivers' ? byContext(messages,'caregiver') : messages

  return <main style={page}>
    <section style={hero}>
      <div>
        <div style={badge}>AngelCare Mail OS • Production Command Layer</div>
        <h1 style={h1}>{title}</h1>
        <p style={lead}>Built-in email operating system for families, caregivers, missions, contracts, billing, incidents, HR, academy, partners and internal backoffice exchange.</p>
      </div>
      <div style={heroCard}><span>Critical communication risk</span><strong>{urgent(messages).length + failed.length + openApprovals.length}</strong><small>{openApprovals.length} approvals • {failed.length} failed • {urgent(messages).length} urgent</small></div>
    </section>

    <nav style={nav}>{EMAIL_NAV.map(([href,label]) => <Link key={href} href={href} style={{...navItem, ...(active(href, mode)?navActive:{})}}>{label}</Link>)}</nav>

    {msgError ? <div style={warning}>Database tables not installed yet. Run <b>supabase/migrations/080_email_os_full_foundation.sql</b>, then refresh. The UI is already wired and safe.</div> : null}

    <section style={kpis}>
      <Kpi label="Inbox" value={received.length} sub="received communications" />
      <Kpi label="Urgent" value={urgent(messages).length} sub="priority triage" />
      <Kpi label="Approvals" value={openApprovals.length} sub="manager review" />
      <Kpi label="Follow-ups" value={openFollowups.length} sub="operational promises" />
      <Kpi label="Queued" value={queued.length} sub="outbox control" />
      <Kpi label="Automations" value={automations.length} sub="active rules" />
    </section>

    {mode === 'composer' ? <Composer templates={templateRows} /> : null}
    {mode === 'templates' ? <Templates rows={templateRows} /> : null}
    {mode === 'automation' ? <Automation rows={automations} /> : null}
    {mode === 'approvals' ? <Approvals rows={openApprovals} /> : null}
    {mode === 'followups' ? <Followups rows={openFollowups} /> : null}
    {mode === 'settings' ? <Settings /> : null}
    {mode === 'audit' ? <Audit rows={audit} /> : null}
    {['command','inbox','families','caregivers','missions','contracts','billing','incidents','hr','academy','campaigns'].includes(mode) ? <Command mode={mode} messages={focusRows} templates={templateRows} approvals={openApprovals} followups={openFollowups} /> : null}
  </main>
}

function Command({ mode, messages, templates, approvals, followups }: any) {
  return <section style={twoCol}>
    <Panel title={mode === 'command' ? 'Executive communication cockpit' : `${titles[mode as Mode]} queue`} subtitle="Unified, contextualized, auditable conversations.">
      <div style={toolbar}><Link href="/email-os/composer" style={primary}>+ New controlled email</Link><Link href="/email-os/templates" style={secondary}>Template Studio</Link><Link href="/email-os/approvals" style={secondary}>Approval Desk</Link></div>
      <div style={list}>{messages.slice(0,12).map((m:any)=><MailRow key={m.id || m.subject} m={m} />)}{!messages.length?<Empty text="No messages yet. Once SQL is installed and SMTP/IMAP configured, operational email appears here."/>:null}</div>
    </Panel>
    <div style={{display:'grid',gap:16}}>
      <Panel title="Operational control panels" subtitle="AngelCare-specific execution areas."><div style={cards}>{controlCards.map(c=><Link href={c.href} key={c.title} style={control}><b style={textStrong}>{c.icon} {c.title}</b><span style={textMeta}>{c.text}</span></Link>)}</div></Panel>
      <Panel title="Templates requiring discipline" subtitle="Sensitive emails are routed through approval."><div style={list}>{templates.filter((t:any)=>t.approval_required || t.approval).slice(0,7).map((t:any)=><div key={t.id||t.key} style={mini}><b style={textStrong}>{t.title}</b><span style={textMeta}>{t.category || t.business_context} • approval required</span></div>)}</div></Panel>
      <Panel title="Promise tracker" subtitle="Follow-ups and pending approvals."><div style={list}>{[...approvals.slice(0,3),...followups.slice(0,3)].map((x:any,i:number)=><div key={x.id||i} style={mini}><b style={textStrong}>{x.title || x.reason || 'Operational item'}</b><span style={textMeta}>{x.status || 'open'} • {date(x.created_at)}</span></div>)}{!approvals.length&&!followups.length?<Empty text="No blocked promises."/>:null}</div></Panel>
    </div>
  </section>
}

function Composer({templates}: any) { return <Panel title="Controlled composer" subtitle="Queue emails safely; sensitive contexts can be forced into approval before sending."><form action="/api/email-os/queue" method="POST" style={form}><div style={formGrid}><input name="to_email" required placeholder="Recipient email" style={input}/><input name="to_name" placeholder="Recipient name" style={input}/><select name="business_context" style={input}><option>family_support</option><option>mission_operation</option><option>caregiver_coordination</option><option>contract</option><option>billing</option><option>incident</option><option>hr</option><option>academy</option><option>partnership</option><option>marketing</option></select><select name="priority" style={input}><option>normal</option><option>important</option><option>urgent</option><option>critical</option></select></div><input name="subject" required placeholder="Subject" style={input}/><select name="template_key" style={input}><option value="">No template</option>{templates.map((t:any)=><option key={t.key||t.id} value={t.key||t.id}>{t.title}</option>)}</select><textarea name="body_text" required placeholder="Write email body. Variables supported: {{family_name}}, {{mission_date}}, {{caregiver_name}}, {{amount_due}}, {{agent_name}}" style={{...input,minHeight:220}}/><div style={toolbar}><button style={primary}>Queue / submit safely</button><span style={hint}>Real sending is controlled by the outbox API and SMTP environment variables.</span></div></form></Panel> }
function Templates({rows}:any){return <Panel title="Template Studio" subtitle="Prebuilt AngelCare templates for repeatable, compliant communication."><div style={cards}>{rows.map((t:any)=><div key={t.id||t.key} style={templateCard}><b style={textStrong}>{t.title}</b><span style={textMeta}>{t.category || t.business_context}</span><small style={textSoft}>{t.subject}</small><em style={textAccent}>{t.approval_required || t.approval ? 'Manager approval' : 'Direct queue allowed'}</em></div>)}</div></Panel>}
function Automation({rows}:any){return <Panel title="Automation monitor" subtitle="Event-triggered messages from missions, billing, incidents, HR and academy."><div style={cards}>{(rows.length?rows:automationSeed).map((r:any)=><div key={r.id||r.key} style={templateCard}><b style={textStrong}>{r.title}</b><span style={textMeta}>{r.trigger_event}</span><small style={textSoft}>{r.description}</small><em style={textAccent}>{r.enabled===false?'disabled':'enabled'}</em></div>)}</div></Panel>}
function Approvals({rows}:any){return <Panel title="Approval Desk" subtitle="Sensitive outgoing emails must be reviewed before release."><div style={list}>{rows.map((a:any)=><div key={a.id} style={row}><div style={{display:'grid',gap:6}}><b style={textStrong}>{a.title || a.reason || 'Approval request'}</b><span style={textMeta}>{a.business_context || 'email'} • {a.status || 'pending'}</span></div><form action="/api/email-os/approve" method="POST"><input type="hidden" name="approval_id" value={a.id}/><button name="decision" value="approved" style={primary}>Approve</button><button name="decision" value="rejected" style={danger}>Reject</button></form></div>)}{!rows.length?<Empty text="No email is waiting for approval."/>:null}</div></Panel>}
function Followups({rows}:any){return <Panel title="Follow-up control" subtitle="Promises, callbacks, missing documents, unpaid invoices and next actions."><div style={list}>{rows.map((f:any)=><div key={f.id} style={row}><div style={{display:'grid',gap:6}}><b style={textStrong}>{f.title}</b><span style={textMeta}>{f.status} • due {date(f.due_at)}</span></div><Link href="/email-os/composer" style={secondary}>Respond</Link></div>)}{!rows.length?<Empty text="No open follow-ups."/>:null}</div></Panel>}
function Settings(){return <Panel title="Mail OS settings" subtitle="Production configuration checklist."><div style={cards}>{settings.map(s=><div key={s.title} style={templateCard}><b style={textStrong}>{s.title}</b><span style={textAccent}>{s.state}</span><small style={textSoft}>{s.text}</small></div>)}</div></Panel>}
function Audit({rows}:any){return <Panel title="Audit trail" subtitle="Every sensitive action is traceable for compliance and management review."><div style={list}>{rows.map((a:any)=><div key={a.id} style={mini}><b style={textStrong}>{a.action}</b><span style={textMeta}>{a.actor_user_id || 'system'} • {date(a.created_at)}</span></div>)}{!rows.length?<Empty text="No audit events yet."/>:null}</div></Panel>}
function MailRow({m}:any){
  return (
    <div style={row}>
      <div style={{display:'grid',gap:6}}>
        <b style={textStrong}>{m.subject || 'No subject'}</b>
        <span style={textMeta}>
          {m.from_email || m.to_email || 'unknown'} • {m.business_context || 'unclassified'} • {date(m.created_at || m.received_at || m.sent_at)}
        </span>
      </div>
      <div style={pillWrap}>
        <em style={pill}>{m.priority || 'normal'}</em>
        <em style={pill}>{m.status || 'received'}</em>
      </div>
    </div>
  )
}
function Panel({title,subtitle,children}:any){
  return (
    <section style={panel}>
      <h2 style={panelTitle}>{title}</h2>
      <p style={panelSubtitle}>{subtitle}</p>
      <div style={{marginTop:16}}>{children}</div>
    </section>
  )
}
function Kpi({label,value,sub}:any){
  return (
    <div style={kpi}>
      <span style={kpiLabel}>{label}</span>
      <strong style={kpiValue}>{value}</strong>
      <small style={kpiSub}>{sub}</small>
    </div>
  )
}
function Empty({text}:any){
  return <div style={empty}>{text}</div>
}
function active(href:string, mode:Mode){return (href==='/email-os'&&mode==='command')||href.includes(mode.replace('families','client-threads').replace('caregivers','staff-threads').replace('missions','mission-mail').replace('contracts','contracts-mail').replace('incidents','incidents-mail'))}
const titles: Record<Mode,string> = {command:'AngelCare Email Command Center',inbox:'Unified Inbox',composer:'Smart Composer',templates:'Template Studio',automation:'Automation Command',approvals:'Approval Desk',followups:'Follow-up Control',families:'Family Communication',caregivers:'Caregiver Communication',missions:'Mission Mail Workspace',contracts:'Contract Mail Workspace',billing:'Billing Mail Workspace',incidents:'Incident Communication',hr:'HR Mail Workspace',academy:'Academy Mail Workspace',campaigns:'Campaign Mail Control',settings:'Email OS Settings',audit:'Audit & Compliance'}
const controlCards=[{href:'/email-os/mission-mail',icon:'🗓️',title:'Mission Mail',text:'Confirmations, replacements, cancellations, daily execution.'},{href:'/email-os/billing-mail',icon:'💳',title:'Billing Recovery',text:'Invoices, reminders, receipts, escalation.'},{href:'/email-os/incidents-mail',icon:'🛡️',title:'Incident Comms',text:'Sensitive complaint and quality follow-up with approvals.'},{href:'/email-os/hr-mail',icon:'👥',title:'HR/Caregiver Mail',text:'Documents, warnings, payroll notices and onboarding.'},{href:'/email-os/client-threads',icon:'🏠',title:'Family Support',text:'Every family thread linked to service, contract and mission.'},{href:'/email-os/automation',icon:'⚙️',title:'Automation',text:'Business events converted into controlled communication.'}]
const automationSeed=[{key:'new_lead',title:'Lead welcome',trigger_event:'lead.created',description:'Send family welcome and intake checklist.'},{key:'mission_assigned',title:'Mission assigned',trigger_event:'mission.assigned',description:'Send caregiver assignment and family confirmation.'},{key:'invoice_overdue',title:'Invoice overdue',trigger_event:'invoice.overdue',description:'Send payment reminder with escalation ladder.'},{key:'incident_created',title:'Incident opened',trigger_event:'incident.created',description:'Notify internal manager and prepare family acknowledgement.'},{key:'certificate_ready',title:'Academy completed',trigger_event:'academy.completed',description:'Send certificate and next training path.'}]
const settings=[{title:'SMTP outbound',state:'ENV controlled',text:'EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS, EMAIL_FROM_NAME.'},{title:'IMAP inbound sync',state:'connector-ready',text:'Use email_accounts table to register Maroc Telecom or provider mailboxes.'},{title:'Approval governance',state:'enabled',text:'Incident, contract, HR, partnership and critical emails require review.'},{title:'Audit logs',state:'enabled',text:'Queue, approve, reject, send, fail and sync actions are recorded.'},{title:'Business linking',state:'enabled',text:'Messages can link to family, caregiver, mission, contract, invoice and incident.'}]
const panelTitle:React.CSSProperties={color:'#ffffff',fontSize:24,lineHeight:1.15,fontWeight:950,margin:'0 0 8px'}
const panelSubtitle:React.CSSProperties={color:'#dbeafe',fontSize:14,lineHeight:1.6,fontWeight:750,margin:0}
const textStrong:React.CSSProperties={color:'#ffffff',fontWeight:900,lineHeight:1.35}
const textMeta:React.CSSProperties={color:'#dbeafe',fontWeight:750,lineHeight:1.55}
const textSoft:React.CSSProperties={color:'#cbd5e1',fontWeight:700,lineHeight:1.55}
const textAccent:React.CSSProperties={color:'#67e8f9',fontStyle:'normal',fontWeight:900,lineHeight:1.45}
const kpiLabel:React.CSSProperties={color:'#dbeafe',fontWeight:850,fontSize:14}
const kpiValue:React.CSSProperties={color:'#ffffff',fontSize:34,lineHeight:1,fontWeight:950}
const kpiSub:React.CSSProperties={color:'#cbd5e1',fontWeight:750,fontSize:13,lineHeight:1.45}
const page:React.CSSProperties={display:'grid',gap:20,padding:24,color:'#f8fafc',background:'linear-gradient(180deg,#07111f 0%,#0b1220 45%,#020617 100%)',minHeight:'100vh'}
const hero:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:24,padding:34,borderRadius:34,background:'radial-gradient(circle at top left,rgba(34,211,238,.28) 0%,#0f172a 38%,#020617 100%)',color:'#f8fafc',border:'1px solid rgba(148,163,184,.24)',boxShadow:'0 34px 90px rgba(0,0,0,.35)'}
const badge:React.CSSProperties={display:'inline-flex',padding:'8px 13px',borderRadius:999,background:'rgba(34,211,238,.14)',border:'1px solid rgba(34,211,238,.28)',fontWeight:900,color:'#cffafe'}
const h1:React.CSSProperties={fontSize:40,lineHeight:1.05,letterSpacing:-1,fontWeight:950,margin:'16px 0 8px',color:'#ffffff'}
const lead:React.CSSProperties={maxWidth:850,color:'#dbeafe',fontWeight:750,lineHeight:1.65}
const heroCard:React.CSSProperties={minWidth:270,background:'rgba(15,23,42,.88)',border:'1px solid rgba(34,211,238,.26)',borderRadius:26,padding:22,display:'grid',gap:8,color:'#f8fafc'}
const nav:React.CSSProperties={display:'flex',gap:8,flexWrap:'wrap',background:'rgba(15,23,42,.92)',border:'1px solid rgba(148,163,184,.22)',borderRadius:22,padding:10,boxShadow:'0 18px 38px rgba(0,0,0,.22)'}
const navItem:React.CSSProperties={textDecoration:'none',color:'#cbd5e1',fontWeight:850,padding:'10px 13px',borderRadius:14}
const navActive:React.CSSProperties={background:'linear-gradient(135deg,#0891b2,#2563eb)',color:'#ffffff',boxShadow:'0 10px 25px rgba(37,99,235,.28)'}
const warning:React.CSSProperties={padding:16,borderRadius:18,background:'rgba(120,53,15,.28)',border:'1px solid rgba(251,191,36,.42)',fontWeight:850,color:'#fde68a'}
const kpis:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(6,minmax(0,1fr))',gap:14}
const kpi:React.CSSProperties={background:'rgba(15,23,42,.96)',border:'1px solid rgba(148,163,184,.28)',borderRadius:22,padding:18,boxShadow:'0 18px 38px rgba(0,0,0,.24)',display:'grid',gap:8,color:'#f8fafc'}
const twoCol:React.CSSProperties={display:'grid',gridTemplateColumns:'1.3fr .9fr',gap:18}
const panel:React.CSSProperties={background:'rgba(15,23,42,.96)',border:'1px solid rgba(148,163,184,.22)',borderRadius:28,padding:22,boxShadow:'0 18px 38px rgba(0,0,0,.26)',color:'#f8fafc'}
const toolbar:React.CSSProperties={display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}
const primary:React.CSSProperties={border:0,textDecoration:'none',background:'linear-gradient(135deg,#0891b2,#2563eb)',color:'#ffffff',fontWeight:900,borderRadius:14,padding:'11px 14px',cursor:'pointer',boxShadow:'0 12px 28px rgba(37,99,235,.25)'}
const secondary:React.CSSProperties={textDecoration:'none',background:'rgba(30,41,59,.96)',color:'#e2e8f0',border:'1px solid rgba(148,163,184,.22)',fontWeight:900,borderRadius:14,padding:'11px 14px'}
const danger:React.CSSProperties={...primary,background:'#991b1b',marginLeft:8}
const list:React.CSSProperties={display:'grid',gap:10}
const row:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:14,borderRadius:18,background:'rgba(2,6,23,.55)',border:'1px solid rgba(148,163,184,.18)',color:'#f8fafc'}
const mini:React.CSSProperties={padding:13,borderRadius:16,background:'rgba(2,6,23,.68)',border:'1px solid rgba(148,163,184,.24)',display:'grid',gap:6,color:'#f8fafc'}
const pillWrap:React.CSSProperties={display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end'}
const pill:React.CSSProperties={fontStyle:'normal',fontSize:12,fontWeight:900,padding:'6px 9px',borderRadius:999,background:'rgba(34,211,238,.13)',border:'1px solid rgba(34,211,238,.24)',color:'#cffafe'}
const cards:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}
const control:React.CSSProperties={textDecoration:'none',color:'#f8fafc',display:'grid',gap:8,padding:16,borderRadius:20,background:'rgba(2,6,23,.68)',border:'1px solid rgba(148,163,184,.24)'}
const templateCard:React.CSSProperties={display:'grid',gap:8,padding:16,borderRadius:20,background:'rgba(2,6,23,.68)',border:'1px solid rgba(148,163,184,.24)',color:'#f8fafc'}
const form:React.CSSProperties={display:'grid',gap:12}
const formGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12}
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',border:'1px solid rgba(148,163,184,.28)',borderRadius:16,padding:'13px 14px',fontWeight:750,color:'#f8fafc',background:'rgba(2,6,23,.72)',outline:'none'}
const hint:React.CSSProperties={fontWeight:800,color:'#cbd5e1'}
const empty:React.CSSProperties={padding:18,borderRadius:18,background:'rgba(2,6,23,.45)',border:'1px dashed rgba(148,163,184,.35)',fontWeight:850,color:'#cbd5e1'}