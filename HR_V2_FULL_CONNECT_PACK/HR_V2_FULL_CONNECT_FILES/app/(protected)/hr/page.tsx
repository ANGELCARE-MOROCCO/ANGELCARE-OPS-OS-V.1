import React from 'react'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { requireAccess } from '@/lib/auth/requireAccess'
import { loadHRV2ConnectedData, hrTitle, hrDate } from '@/lib/hr-v2/connectors'
import { HR_V2_MODULES } from '@/lib/hr-v2/workforce'
import { approveHRRequest, createHRLeaveRequest, createHRMemo, createHRProfile, createHRRosterShift } from './actions'

function fmtDate(v?: string | null) { if (!v) return 'No date'; try { return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) } catch { return String(v) } }
function pct(n: number, d: number) { return d ? Math.round((n / d) * 100) : 0 }
function tone(status?: string) { const s=String(status||'open').toLowerCase(); if(['completed','done','approved','active','scheduled'].includes(s)) return '#16a34a'; if(['pending','waiting','paused'].includes(s)) return '#d97706'; if(['rejected','blocked','critical','open'].includes(s)) return '#dc2626'; return '#2563eb' }

export default async function HRV2ConnectedPage() {
  await requireAccess('hr.view')
  const data = await loadHRV2ConnectedData()
  const h = data.health
  const coverage = pct(h.presentToday, Math.max(h.staff, 1))
  const rosterCoverage = pct(h.rostered, Math.max(h.staff, 1))
  const operationalRisk = Math.min(100, h.openIncidents * 12 + h.expiringDocs * 5 + h.openLeave * 3 + h.missingTables * 4)
  const healthScore = Math.max(0, 100 - operationalRisk)
  const users = data.staff
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <AppShell
      title="AngelCare Workforce Command Center"
      subtitle="Connected HR V2: staff, positions, attendance, roster, tasks, missions, incidents, academy, documents, approvals and management memos in one operational system."
      breadcrumbs={[{ label: 'HR' }, { label: 'Workforce Command Center' }]}
      actions={<><PageAction href="/users/new">New Staff</PageAction><PageAction href="/pointage" variant="light">Pointage</PageAction><PageAction href="/staff-home" variant="light">Staff Home</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={kickerStyle}>HR V2 FULL CONNECT • ANGELCARE OPERATIONS OS</div>
            <h1 style={heroTitleStyle}>Unified Workforce Control Room</h1>
            <p style={heroTextStyle}>This page scans your app system and connects HR to users, pointage, roster, revenue tasks, market tasks, ambassador missions, incidents, academy, documents, certifications, leave and approvals. Missing tables are shown as diagnostics instead of crashing the app.</p>
            <div style={heroGridStyle}>
              <HeroMetric label="Workforce health" value={`${healthScore}%`} note="Computed from incidents, docs, leave and missing sync" />
              <HeroMetric label="Attendance today" value={`${coverage}%`} note={`${h.presentToday}/${h.staff} staff with activity`} />
              <HeroMetric label="Roster coverage" value={`${rosterCoverage}%`} note={`${h.rostered}/${h.staff} staff rostered`} />
              <HeroMetric label="Connected tables" value={`${h.connectedTables}`} note={`${h.missingTables} missing / optional`} />
            </div>
          </div>
          <div style={commandPanelStyle}>
            <strong>Today command signal</strong>
            <div style={signalLineStyle}><span>Open tasks</span><b>{h.openTasks}</b></div>
            <div style={signalLineStyle}><span>Incidents</span><b>{h.openIncidents}</b></div>
            <div style={signalLineStyle}><span>Pending approvals</span><b>{h.pendingApprovals}</b></div>
            <div style={signalLineStyle}><span>Expiring/missing docs</span><b>{h.expiringDocs}</b></div>
            <div style={progressOuterStyle}><div style={{...progressInnerStyle,width:`${healthScore}%`}} /></div>
          </div>
        </section>

        <section style={moduleGridStyle}>
          {HR_V2_MODULES.map(m => <Link key={m.href+m.label} href={m.href} style={moduleCardStyle}><span style={moduleIconStyle}>{m.icon}</span><strong>{m.label}</strong><small>{m.description}</small><em>{m.permission}</em></Link>)}
        </section>

        <section style={twoColStyle}>
          <Panel title="Live Staff Directory + Readiness" subtitle="Every active user enriched with HR profile, attendance, roster, task, incident and certification signals.">
            <div style={staffGridStyle}>{users.slice(0,18).map((s:any)=><div key={s.id} style={staffCardStyle}>
              <div style={rowBetweenStyle}><strong>{s.full_name}</strong><span style={{...pillStyle,background:'#eef2ff',color:'#3730a3'}}>{s.readiness}% ready</span></div>
              <p style={mutedStyle}>{s.position} • {s.department} • {s.contract_type}</p>
              <div style={miniGridStyle}><Mini label="Pointage" value={s.logs_count}/><Mini label="Roster" value={s.roster_count}/><Mini label="Tasks" value={s.open_tasks}/><Mini label="Incidents" value={s.open_incidents}/></div>
            </div>)}</div>
          </Panel>

          <Panel title="HR Action Center" subtitle="Create memo, roster shift, leave request and profile assignment directly from HR.">
            <div style={formStackStyle}>
              <form action={createHRMemo} style={formCardStyle}><strong>Push management memo</strong><input name="title" placeholder="Memo title" style={inputStyle}/><textarea name="message" placeholder="Message for staff / all staff" rows={3} style={inputStyle}/><select name="type" style={inputStyle}><option value="memo">Memo</option><option value="urgent">Urgent</option><option value="reminder">Reminder</option><option value="policy">Policy</option></select><button style={buttonStyle}>Push memo</button></form>
              <form action={createHRRosterShift} style={formCardStyle}><strong>Create roster shift</strong><select name="user_id" required style={inputStyle}>{users.map((u:any)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><input name="shift_date" type="date" required style={inputStyle}/><div style={twoInputStyle}><input name="start_time" type="time" defaultValue="10:00" style={inputStyle}/><input name="end_time" type="time" defaultValue="18:00" style={inputStyle}/></div><input name="role" placeholder="Duty / role" style={inputStyle}/><button style={buttonStyle}>Add shift</button></form>
              <form action={createHRLeaveRequest} style={formCardStyle}><strong>Create leave request</strong><select name="user_id" required style={inputStyle}>{users.map((u:any)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><div style={twoInputStyle}><input name="start_date" type="date" required style={inputStyle}/><input name="end_date" type="date" required style={inputStyle}/></div><textarea name="reason" placeholder="Reason / note" rows={2} style={inputStyle}/><button style={buttonStyle}>Create leave</button></form>
              <form action={createHRProfile} style={formCardStyle}><strong>Assign position / department</strong><select name="user_id" required style={inputStyle}>{users.map((u:any)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><select name="position" required style={inputStyle}>{data.positions.map((p:any)=><option key={p.title} value={p.title}>{p.title}</option>)}</select><select name="department" required style={inputStyle}>{data.departments.map((d:any)=><option key={d.name} value={d.name}>{d.name}</option>)}</select><input name="contract_type" placeholder="CDI / CDD / trainee / freelance" style={inputStyle}/><button style={buttonStyle}>Save profile</button></form>
            </div>
          </Panel>
        </section>

        <section id="roster" style={widePanelStyle}>
          <div style={rowBetweenStyle}><div><h2 style={sectionTitleStyle}>Monthly Workforce Roster — {monthLabel}</h2><p style={sectionTextStyle}>All staff duties and shifts. Click staff/users/tasks from connected widgets to navigate.</p></div><Link href="/staff-home" style={smallLinkStyle}>Open staff dashboard →</Link></div>
          <div style={calendarGridStyle}>{Array.from({length:35}).map((_,i)=>{ const d=new Date(); d.setDate(1+i); const day=String(d.getDate()).padStart(2,'0'); const dayRows=data.rosters.filter((r:any)=>String(r.shift_date||'').slice(0,10)===d.toISOString().slice(0,10)); return <div key={i} style={dayCardStyle}><b>{day}</b>{dayRows.slice(0,3).map((r:any)=><span key={r.id||Math.random()} style={shiftPillStyle}>{r.role || 'Shift'} · {r.start_time || ''}</span>)}{dayRows.length>3 && <small>+{dayRows.length-3} more</small>}</div>})}</div>
        </section>

        <section style={threeColStyle}>
          <ListPanel title="My / App Tasks" count={h.openTasks} href="/revenue-command-center/tasks">{data.allOpenTasks.slice(0,8).map((t:any)=><ActionRow key={(t._source||'task')+t.id} title={hrTitle(t,'Task')} meta={`${t._source} • ${t.status || 'open'} • ${fmtDate(hrDate(t))}`} href={t._href || '/revenue-command-center/tasks'} status={t.priority || t.status}/>)}</ListPanel>
          <ListPanel title="Open Incidents" count={h.openIncidents} href="/incidents">{data.openIncidents.slice(0,8).map((i:any)=><ActionRow key={i.id} title={hrTitle(i,'Incident')} meta={`${i.severity || i.status || 'open'} • ${fmtDate(hrDate(i))}`} href="/incidents" status={i.severity || i.status}/>)}</ListPanel>
          <ListPanel title="Approvals / Leave" count={h.pendingApprovals+h.openLeave} href="/hr#leave">{[...data.openLeave,...data.openApprovals].slice(0,8).map((r:any)=><div key={(r.id||Math.random())} style={rowCardStyle}><div><strong>{r.reason || r.type || 'Request'}</strong><p style={mutedStyle}>{r.status || 'pending'} • {r.start_date || fmtDate(r.created_at)}</p></div>{r.id && <form action={approveHRRequest}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="table" value={r.start_date ? 'hr_leave_requests':'hr_approval_requests'}/><button style={tinyButtonStyle}>Approve</button></form>}</div>)}</ListPanel>
        </section>

        <section style={threeColStyle}>
          <ListPanel title="Training / Academy" count={h.trainingCohorts} href="/academy">{data.cohorts.slice(0,8).map((c:any)=><ActionRow key={c.id} title={c.name || c.code || 'Training cohort'} meta={`${c.service_line || 'Academy'} • readiness ${c.readiness || 0}%`} href="/academy" status={c.status || 'active'}/>)}</ListPanel>
          <ListPanel title="Documents / Compliance" count={h.expiringDocs} href="/contracts">{data.expiringDocs.slice(0,8).map((d:any)=><ActionRow key={d.id} title={d.document_type || d.type || 'Document'} meta={`${d.status || 'check'} • expires ${d.expires_at || 'not set'}`} href="/contracts" status={d.status}/>)}</ListPanel>
          <ListPanel title="Management Memos" count={data.memos.length} href="/staff-home">{data.memos.slice(0,8).map((m:any)=><ActionRow key={m.id} title={m.title || m.type || 'Memo'} meta={`${m.message || ''}`.slice(0,90)} href="/staff-home" status={m.type}/>)}</ListPanel>
        </section>

        <section id="positions" style={widePanelStyle}>
          <h2 style={sectionTitleStyle}>AngelCare Position Catalog</h2><p style={sectionTextStyle}>Official positions connected to department logic, permissions, KPIs and default shift logic.</p>
          <div style={positionsGridStyle}>{data.positions.map((p:any)=><div key={p.title} style={positionCardStyle}><div style={rowBetweenStyle}><strong>{p.title}</strong><span style={pillStyle}>{p.level}</span></div><p style={mutedStyle}>{p.department}</p><p style={bodyTextStyle}>{p.mission}</p><div style={tagWrapStyle}>{p.kpis.map((k:string)=><span key={k} style={tagStyle}>{k}</span>)}</div></div>)}</div>
        </section>

        {data.missing.length > 0 && <section style={diagStyle}><h2 style={sectionTitleStyle}>Sync diagnostics</h2><p style={sectionTextStyle}>These sources were not available or not installed yet. The page still works safely; install the SQL migration to reduce missing items.</p><div style={diagGridStyle}>{data.missing.map((m:any)=><div key={m.source} style={diagCardStyle}><strong>{m.source}</strong><small>{m.error}</small></div>)}</div></section>}
      </div>
    </AppShell>
  )
}

function HeroMetric({label,value,note}:{label:string;value:string;note:string}){return <div style={heroMetricStyle}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Mini({label,value}:{label:string;value:any}){return <div style={miniStyle}><small>{label}</small><b>{value}</b></div>}
function Panel({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){return <section style={panelStyle}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p>{children}</section>}
function ListPanel({title,count,href,children}:{title:string;count:number;href:string;children:React.ReactNode}){return <section style={panelStyle}><div style={rowBetweenStyle}><h2 style={sectionTitleStyle}>{title}</h2><Link href={href} style={smallLinkStyle}>Open →</Link></div><p style={sectionTextStyle}>{count} live records</p><div style={listStyle}>{children}</div></section>}
function ActionRow({title,meta,href,status}:{title:string;meta:string;href:string;status?:string}){return <Link href={href} style={rowCardStyle}><div><strong>{title}</strong><p style={mutedStyle}>{meta}</p></div><span style={{...pillStyle,background:tone(status),color:'#fff'}}>{status || 'open'}</span></Link>}

const pageStyle:React.CSSProperties={display:'grid',gap:22}
const heroStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'1.7fr .8fr',gap:18,padding:28,borderRadius:30,background:'linear-gradient(135deg,#0f172a,#1e3a8a 55%,#0f766e)',color:'#fff',boxShadow:'0 24px 60px rgba(15,23,42,.22)'}
const kickerStyle:React.CSSProperties={fontSize:12,fontWeight:950,letterSpacing:1.2,opacity:.9}
const heroTitleStyle:React.CSSProperties={fontSize:42,lineHeight:1.05,margin:'10px 0',fontWeight:950}
const heroTextStyle:React.CSSProperties={fontSize:16,lineHeight:1.65,opacity:.92,maxWidth:940}
const heroGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginTop:18}
const heroMetricStyle:React.CSSProperties={padding:14,borderRadius:20,background:'rgba(255,255,255,.13)',border:'1px solid rgba(255,255,255,.18)',display:'grid',gap:5}
const commandPanelStyle:React.CSSProperties={padding:18,borderRadius:24,background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.2)',display:'grid',gap:12,alignContent:'start'}
const signalLineStyle:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:12,padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,.16)'}
const progressOuterStyle:React.CSSProperties={height:10,borderRadius:99,background:'rgba(255,255,255,.2)',overflow:'hidden'}
const progressInnerStyle:React.CSSProperties={height:'100%',background:'#22c55e',borderRadius:99}
const moduleGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(9,minmax(0,1fr))',gap:12}
const moduleCardStyle:React.CSSProperties={textDecoration:'none',color:'#0f172a',background:'#fff',border:'1px solid #e2e8f0',borderRadius:20,padding:14,display:'grid',gap:7,boxShadow:'0 16px 34px rgba(15,23,42,.06)'}
const moduleIconStyle:React.CSSProperties={fontSize:24}
const twoColStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'1.25fr .75fr',gap:18,alignItems:'start'}
const threeColStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:18,alignItems:'start'}
const panelStyle:React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:26,padding:20,boxShadow:'0 16px 38px rgba(15,23,42,.06)',display:'grid',gap:14}
const widePanelStyle:React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:28,padding:22,boxShadow:'0 16px 38px rgba(15,23,42,.06)',display:'grid',gap:14}
const sectionTitleStyle:React.CSSProperties={margin:0,fontSize:22,fontWeight:950,color:'#0f172a'}
const sectionTextStyle:React.CSSProperties={margin:0,color:'#64748b',fontWeight:700,lineHeight:1.5}
const staffGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12}
const staffCardStyle:React.CSSProperties={padding:14,borderRadius:18,border:'1px solid #e2e8f0',background:'#f8fafc',display:'grid',gap:10}
const rowBetweenStyle:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}
const mutedStyle:React.CSSProperties={margin:0,color:'#64748b',fontSize:13,fontWeight:700,lineHeight:1.45}
const miniGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}
const miniStyle:React.CSSProperties={padding:8,borderRadius:12,background:'#fff',border:'1px solid #e2e8f0',display:'grid',gap:3}
const formStackStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr',gap:12}
const formCardStyle:React.CSSProperties={display:'grid',gap:9,padding:14,borderRadius:18,background:'#f8fafc',border:'1px solid #e2e8f0'}
const inputStyle:React.CSSProperties={width:'100%',border:'1px solid #cbd5e1',borderRadius:12,padding:'10px 12px',fontWeight:700,color:'#0f172a',background:'#fff'}
const twoInputStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}
const buttonStyle:React.CSSProperties={border:0,borderRadius:12,padding:'10px 12px',background:'#2563eb',color:'#fff',fontWeight:950,cursor:'pointer'}
const tinyButtonStyle:React.CSSProperties={border:0,borderRadius:10,padding:'8px 10px',background:'#16a34a',color:'#fff',fontWeight:950,cursor:'pointer'}
const smallLinkStyle:React.CSSProperties={textDecoration:'none',color:'#2563eb',fontWeight:950}
const calendarGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:10}
const dayCardStyle:React.CSSProperties={minHeight:110,padding:10,borderRadius:16,background:'#f8fafc',border:'1px solid #e2e8f0',display:'grid',alignContent:'start',gap:6}
const shiftPillStyle:React.CSSProperties={fontSize:11,padding:'5px 7px',borderRadius:999,background:'#dbeafe',color:'#1d4ed8',fontWeight:900,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}
const listStyle:React.CSSProperties={display:'grid',gap:10}
const rowCardStyle:React.CSSProperties={textDecoration:'none',color:'#0f172a',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:12,borderRadius:16,background:'#f8fafc',border:'1px solid #e2e8f0'}
const pillStyle:React.CSSProperties={display:'inline-flex',padding:'5px 8px',borderRadius:999,background:'#e2e8f0',color:'#0f172a',fontSize:11,fontWeight:950,whiteSpace:'nowrap'}
const positionsGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12}
const positionCardStyle:React.CSSProperties={padding:15,borderRadius:18,background:'#f8fafc',border:'1px solid #e2e8f0',display:'grid',gap:8}
const bodyTextStyle:React.CSSProperties={margin:0,color:'#334155',fontWeight:700,lineHeight:1.5}
const tagWrapStyle:React.CSSProperties={display:'flex',gap:6,flexWrap:'wrap'}
const tagStyle:React.CSSProperties={fontSize:11,padding:'5px 7px',borderRadius:999,background:'#eef2ff',color:'#3730a3',fontWeight:900}
const diagStyle:React.CSSProperties={padding:18,borderRadius:24,background:'#fff7ed',border:'1px solid #fed7aa',display:'grid',gap:12}
const diagGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}
const diagCardStyle:React.CSSProperties={padding:12,borderRadius:16,background:'#fff',border:'1px solid #fed7aa',display:'grid',gap:6,color:'#9a3412'}
