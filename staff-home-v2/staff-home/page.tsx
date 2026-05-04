
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, ModuleCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { getAllowedAppRoutes, groupRoutesByModule } from '@/lib/auth/page-access'

type AnyRow = Record<string, any>

function low(value: unknown) { return String(value || '').toLowerCase() }
function todayISO() { return new Date().toISOString().slice(0, 10) }
function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate()+days); return d }
function dateISO(date: Date) { return date.toISOString().slice(0, 10) }
function displayName(user: any) { return user?.full_name || user?.name || user?.username || user?.email || 'AngelCare teammate' }
function canAccess(user: any, permission: string) { if (low(user?.role || user?.role_key) === 'ceo') return true; return Array.isArray(user?.permissions) && user.permissions.includes(permission) }
function asArray(res: any) { return Array.isArray(res?.data) ? res.data : [] }
function fmtDate(v: unknown) { if (!v) return 'Not scheduled'; const d = new Date(String(v)); if (Number.isNaN(d.getTime())) return String(v); return d.toLocaleDateString('fr-MA', { weekday:'short', day:'2-digit', month:'short' }) }
function fmtDay(v: unknown) { if (!v) return '—'; const d = new Date(String(v)); if (Number.isNaN(d.getTime())) return String(v).slice(0,10); return d.toLocaleDateString('fr-MA', { day:'2-digit', month:'short' }) }
function fmtTime(v: unknown) { if (!v) return '—'; const raw=String(v); if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0,5); const d=new Date(raw); if (Number.isNaN(d.getTime())) return raw; return d.toLocaleTimeString('fr-MA',{hour:'2-digit',minute:'2-digit'}) }
function titleOf(row: AnyRow) { return row.title || row.name || row.subject || row.label || row.mission_title || row.client_name || row.family_name || row.company_name || `Item ${String(row.id || '').slice(0,8)}` }
function rowDate(row: AnyRow) { return row.mission_date || row.date || row.due_date || row.deadline || row.start_date || row.scheduled_at || row.appointment_at || row.created_at }
function rowOwner(row: AnyRow) { return row.assigned_to || row.user_id || row.agent_id || row.owner_id || row.assignee_id || row.created_by || row.staff_id }
function belongsToUser(row: AnyRow, userId: any) { const owner=rowOwner(row); if (!userId || !owner) return true; return String(owner)===String(userId) }
function statusTone(status: unknown): 'blue'|'green'|'red'|'amber'|'purple'|'slate' { const s=low(status); if(['done','completed','closed','resolved','confirmed'].includes(s)) return 'green'; if(['late','urgent','blocked','critical','overdue'].includes(s)) return 'red'; if(['pending','open','in_progress','progress','planned'].includes(s)) return 'amber'; if(['assigned','new','qualified'].includes(s)) return 'blue'; return 'slate' }
function hrefFor(source: string, row: AnyRow) { const id=row.id || row.task_id || row.uuid; if (source==='Mission') return id ? `/missions/${id}` : '/missions'; if (source==='Revenue Task') return id ? `/revenue-command-center/tasks/${id}` : '/revenue-command-center/tasks'; if (source==='Appointment') return '/revenue-command-center/appointments'; if (source==='Incident') return id ? `/incidents/${id}` : '/incidents'; if (source==='Lead') return id ? `/leads/${id}` : '/leads'; if (source==='Contract') return id ? `/contracts/${id}` : '/contracts'; return '/staff-home' }
function priorityScore(item: any) { const s=low(item.status); let n=0; if(['urgent','critical','blocked','overdue'].includes(s)) n+=50; if(['pending','open','new','assigned','in_progress'].includes(s)) n+=20; const d=new Date(String(item.date||'')); if(!Number.isNaN(d.getTime())) { const diff=(d.getTime()-Date.now())/86400000; if(diff<0) n+=30; if(diff<=1) n+=20; if(diff<=7) n+=10 } return n }
const moduleMeta: Record<string,{icon:string;text:string}> = {
  hr:{icon:'👥',text:'People, attendance, users and HR control.'}, sales:{icon:'💼',text:'Orders, clients and commercial execution.'}, missions:{icon:'🛫',text:'Mission planning, execution and follow-up.'}, operations:{icon:'🧭',text:'Availability, replacements and dispatch.'}, pointage:{icon:'🕒',text:'Attendance and shift presence.'}, incidents:{icon:'🚨',text:'Escalation, risk and incident resolution.'}, leads:{icon:'📈',text:'Lead intake and conversion.'}, contracts:{icon:'📦',text:'Contracts and renewals.'}, billing:{icon:'🧾',text:'Payment follow-up and invoicing.'}, reports:{icon:'📊',text:'Reporting and management visibility.'}, users:{icon:'🔐',text:'Users and permission control.'}, 'revenue-command-center':{icon:'🚀',text:'Revenue tasks, prospects and appointments.'}, 'market-os':{icon:'📣',text:'Marketing, content and campaigns.'}, profile:{icon:'👤',text:'Account and profile workspace.'}
}
const rosterFilters=['All staff','Morning','Evening','Duty','Off','Incidents','Missions']

export default async function StaffHomePage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const today = todayISO(); const start=dateISO(addDays(new Date(),-5)); const end=dateISO(addDays(new Date(),35))
  const allowedRoutes = getAllowedAppRoutes(user); const groupedRoutes = groupRoutesByModule(allowedRoutes); const allowedModules=Object.keys(groupedRoutes)

  const [missionsRes, tasksRes, appointmentsRes, incidentsRes, leadsRes, contractsRes, attendanceRes, usersRes, rosterRes] = await Promise.all([
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }).limit(120),
    supabase.from('bd_tasks').select('*').order('created_at', { ascending: false }).limit(150),
    supabase.from('bd_appointments').select('*').order('appointment_at', { ascending: true }).limit(80),
    supabase.from('incidents').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(60),
    supabase.from('leads').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(60),
    supabase.from('contracts').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(60),
    supabase.from('attendance_logs').select('*').order('id', { ascending: false }).limit(40),
    supabase.from('app_users').select('id, full_name, username, role, department').order('full_name').limit(80),
    supabase.from('staff_rosters').select('*').gte('shift_date', start).lte('shift_date', end).order('shift_date', { ascending: true }).limit(250),
  ])

  const missions=asArray(missionsRes), tasks=asArray(tasksRes), appointments=asArray(appointmentsRes), incidents=asArray(incidentsRes), leads=asArray(leadsRes), contracts=asArray(contractsRes), attendance=asArray(attendanceRes), appUsers=asArray(usersRes), rosterTable=asArray(rosterRes)
  const userId=user?.id
  const workItems = [
    ...missions.filter(r=>belongsToUser(r,userId)).map(r=>({source:'Mission', row:r, title:titleOf(r), status:r.status||'planned', date:rowDate(r), href:hrefFor('Mission',r), detail:r.description||r.family_name||r.client_name||'Mission execution item'})),
    ...tasks.filter(r=>belongsToUser(r,userId)).map(r=>({source:'Revenue Task', row:r, title:titleOf(r), status:r.status||r.priority||'open', date:rowDate(r), href:hrefFor('Revenue Task',r), detail:r.description||r.notes||r.category||'Revenue command task'})),
    ...appointments.filter(r=>belongsToUser(r,userId)).map(r=>({source:'Appointment', row:r, title:titleOf(r), status:r.status||'scheduled', date:rowDate(r), href:hrefFor('Appointment',r), detail:r.notes||r.location||r.contact_name||'Appointment or event'})),
    ...incidents.filter(r=>belongsToUser(r,userId)).map(r=>({source:'Incident', row:r, title:titleOf(r), status:r.status||'open', date:rowDate(r), href:hrefFor('Incident',r), detail:r.description||r.severity||'Incident follow-up'})),
    ...leads.filter(r=>belongsToUser(r,userId)).map(r=>({source:'Lead', row:r, title:titleOf(r), status:r.status||'new', date:rowDate(r), href:hrefFor('Lead',r), detail:r.phone||r.email||r.notes||'Lead follow-up'})),
    ...contracts.filter(r=>belongsToUser(r,userId)).map(r=>({source:'Contract', row:r, title:titleOf(r), status:r.status||'active', date:rowDate(r), href:hrefFor('Contract',r), detail:r.client_name||r.family_name||'Contract action'})),
  ].sort((a,b)=>priorityScore(b)-priorityScore(a)).slice(0,18)

  const openWork=workItems.filter(i=>!['done','completed','closed','resolved','cancelled','archived'].includes(low(i.status)))
  const todayWork=workItems.filter(i=>String(i.date||'').startsWith(today))
  const latestAttendance=attendance[0]
  const openIncidents=incidents.filter(i=>!['resolved','closed','archived'].includes(low(i.status)))
  const priority = workItems[0]?.href || '/profile'

  const rosterSource = rosterTable.length ? rosterTable.map((r:any)=>({name:r.staff_name||r.full_name||r.user_name||r.employee_name||'Staff member', role:r.role||r.department||r.position||'Staff', date:r.shift_date||r.date||r.start_date, start:r.start_time||r.shift_start||r.clock_in, end:r.end_time||r.shift_end||r.clock_out, duty:r.duty||r.shift_type||r.status||'Duty', area:r.area||r.location||r.zone||'AngelCare'})) : missions.slice(0,42).map((m:any)=>({name:m.caregiver_name||m.assigned_name||m.staff_name||m.agent_name||'Assigned staff', role:m.role||'Mission duty', date:m.mission_date||m.start_time, start:m.start_time, end:m.end_time, duty:m.status||'Mission', area:m.location||m.zone||m.client_name||'Field'}))
  const rosterDays = Array.from({length:30},(_,i)=>dateISO(addDays(new Date(),i)))

  return <AppShell title="Staff Home Command Dashboard" subtitle="Post-login operational desk: permitted modules, all assigned tasks, monthly staff roster, attendance, memos, reminders and AI guidance." breadcrumbs={[{label:'Staff Home'}]} actions={<><PageAction href={priority}>Start priority work</PageAction><PageAction href="/pointage" variant="light">Clock / Pointage</PageAction><PageAction href="/profile" variant="light">Profile</PageAction></>}>
    <section style={hero}><div><div style={badge}>LIVE STAFF COMMAND • FULL SYSTEM SYNC • ROLE AWARE</div><h1 style={h1}>Welcome, {displayName(user)}.</h1><p style={p}>This is the upgraded landing page after login. It combines authorized gateways, active assignments from all major work tables, attendance, management memos, AI briefing, and a large monthly roster view for staff duties and shifts.</p><div style={heroBtns}><Link href={priority} style={btnPrimary}>⚡ Open top priority</Link><Link href="/pointage" style={btnGhost}>🕒 Attendance</Link><Link href="/reports" style={btnGhost}>📊 Reports</Link></div></div><div style={heroPanel}><div style={small}>User role</div><strong style={role}>{user?.role || user?.role_key || 'staff'}</strong><div style={heroStats}><div><b>{allowedModules.length}</b><span>Modules</span></div><div><b>{openWork.length}</b><span>Open work</span></div><div><b>{todayWork.length}</b><span>Today</span></div><div><b>{openIncidents.length}</b><span>Alerts</span></div></div></div></section>

    <section style={metrics}><MetricCard label="Allowed modules" value={allowedModules.length} sub="Permission-based gateways" icon="🧭" accent="#2563eb"/><MetricCard label="System tasks" value={workItems.length} sub="Missions, tasks, events, appointments" icon="✅" accent="#7c3aed"/><MetricCard label="Today duties" value={todayWork.length} sub="Assigned for current day" icon="📅" accent="#059669"/><MetricCard label="Attendance status" value={latestAttendance?.status || latestAttendance?.event_type || 'Open'} sub={latestAttendance ? `Last activity ${fmtTime(latestAttendance.created_at || latestAttendance.clock_in_at)}` : 'No recent pointage record'} icon="🕒" accent="#ea580c"/></section>

    <section style={grid2}><ERPPanel title="Permitted Modules Gateway" subtitle="Only authorized modules appear. Use this as the staff control panel after login."><div style={moduleGrid}>{allowedModules.length?allowedModules.map(module=>{const first=groupedRoutes[module]?.[0]; const meta=moduleMeta[module]||{icon:'🔹',text:'Authorized workspace.'}; return <ModuleCard key={module} href={first?.href || '/profile'} icon={meta.icon} title={first?.moduleLabel || module.replaceAll('-',' ')} text={meta.text} badge={`${groupedRoutes[module]?.length||1} access points`}/>}) : <Empty title="No permissions found" text="Ask admin to assign allowed modules."/>}</div></ERPPanel><ERPPanel title="Management Memo + Reminder Board" subtitle="Operational notes for staff before starting the shift."><div style={memo}><Memo tone="blue" title="Start with attendance" text="Clock in, check your roster, then open priority tasks."/><Memo tone={openIncidents.length?'red':'green'} title={openIncidents.length?'Open incident attention':'No critical incident visible'} text={openIncidents.length?'Review open incidents and document every escalation.':'Normal operations: keep statuses updated.'}/><Memo tone="amber" title="Documentation rule" text="Every task, mission, event or appointment should be updated after execution."/><Memo tone="purple" title="Management visibility" text="Your cards show only what the system can detect from assigned records and permissions."/></div></ERPPanel></section>

    <ERPPanel title="All My Operational Tasks, Missions, Events & Appointments" subtitle="Scans the app system queues: missions, revenue tasks, appointments, incidents, leads and contracts. Buttons open the source page directly." right={<div style={toolbar}><span>Filters:</span><b>All</b><b>Today</b><b>Urgent</b><b>Open</b></div>}><div style={taskGrid}>{workItems.length?workItems.map((item:any)=><Link key={`${item.source}-${item.row.id}`} href={item.href} style={taskCard}><div style={taskTop}><StatusPill tone={statusTone(item.status)}>{item.status || 'open'}</StatusPill><span style={source}>{item.source}</span></div><h3 style={taskTitle}>{item.title}</h3><p style={taskText}>{item.detail}</p><div style={taskMeta}><span>📅 {fmtDate(item.date)}</span><span>🕒 {fmtTime(item.date)}</span></div><div style={taskActions}><span>Open details</span><span>Update status</span><span>Follow-up</span></div></Link>) : <Empty title="No assigned system work detected" text="The page is ready; once tasks/missions/events are assigned to this user, they appear here."/>}</div></ERPPanel>

    <section style={grid2}><ERPPanel title="AI Staff Assistant" subtitle="Useful logic to guide the agent by role, tasks and roster."><div style={aiBox}><div style={aiIcon}>✨</div><div><h3 style={aiTitle}>Recommended next move</h3><p style={aiText}>{todayWork.length?`You have ${todayWork.length} item(s) today. Start with the earliest or highest-risk card, then update progress.`:openWork.length?`You have ${openWork.length} open item(s). Clear urgent and overdue items first.`:'No direct task pressure detected. Check attendance, roster and authorized module queue.'}</p></div></div><div style={brief}>{['Confirm attendance status before execution.','Review roster duties and shift coverage.','Open every assigned task from the cards above, not from memory.','Document outcomes after each client, mission, lead or appointment.','Escalate incident or blocker immediately.'].map(x=><div key={x}>• {x}</div>)}</div></ERPPanel><ERPPanel title="Smart User-Type Widgets" subtitle="Cards adapt logically to module permissions."><div style={widgetGrid}><Quick show={canAccess(user,'sales.view')} href="/sales/orders" icon="💼" label="Sales execution" value={contracts.length} sub="Orders/contracts"/><Quick show={canAccess(user,'revenue.view')} href="/revenue-command-center/tasks" icon="🚀" label="Revenue tasks" value={tasks.length} sub="BD queue"/><Quick show={canAccess(user,'missions.view')} href="/missions" icon="🛫" label="Missions" value={missions.length} sub="Field operations"/><Quick show={canAccess(user,'hr.view')} href="/hr" icon="👥" label="HR desk" value={appUsers.length} sub="Staff visibility"/><Quick show={canAccess(user,'incidents.view')} href="/incidents" icon="🚨" label="Incidents" value={openIncidents.length} sub="Risk queue"/><Quick show={true} href="/profile" icon="👤" label="My profile" value="Open" sub="Account"/></div></ERPPanel></section>

    <ERPPanel title="Monthly Staff Roster Display" subtitle="Clickable monthly roster card with filters. Shows duties and shifts for all staff where roster data exists; falls back to mission-duty planning if no roster table is available." right={<div style={toolbar}>{rosterFilters.map(f=><b key={f}>{f}</b>)}</div>}><div style={calendar}>{rosterDays.map(day=>{const items=rosterSource.filter((r:any)=>String(r.date||'').startsWith(day)).slice(0,4); return <Link href={`/operations?date=${day}`} key={day} style={dayCard}><div style={dayHead}><strong>{fmtDay(day)}</strong><span>{items.length} duty</span></div>{items.length?items.map((r:any,idx:number)=><div key={idx} style={shift}><b>{r.name}</b><span>{fmtTime(r.start)} - {fmtTime(r.end)} • {r.duty}</span><em>{r.area}</em></div>):<div style={off}>No planned duty</div>}</Link>})}</div></ERPPanel>

    <section style={grid3}><ERPPanel title="Attendance Control" subtitle="Daily pointage shortcuts."><div style={bigAction}><Link href="/pointage">Clock in / out</Link><Link href="/users">Staff presence</Link><Link href="/reports">Attendance report</Link></div></ERPPanel><ERPPanel title="Operations Rows" subtitle="Direct operational lanes."><div style={bigAction}><Link href="/missions">Missions</Link><Link href="/operations/availability">Availability</Link><Link href="/operations/replacements">Replacements</Link></div></ERPPanel><ERPPanel title="Follow-up Center" subtitle="Commercial and service follow-ups."><div style={bigAction}><Link href="/revenue-command-center/appointments">Appointments</Link><Link href="/leads">Leads</Link><Link href="/contracts">Contracts</Link></div></ERPPanel></section>
  </AppShell>
}
function Empty({title,text}:{title:string;text:string}){return <div style={empty}><b>{title}</b><p>{text}</p></div>}
function Memo({tone,title,text}:{tone:string;title:string;text:string}){const colors:any={blue:'#eff6ff',green:'#f0fdf4',red:'#fef2f2',amber:'#fffbeb',purple:'#faf5ff'};return <div style={{...memoItem,background:colors[tone]||'#f8fafc'}}><b>{title}</b><p>{text}</p></div>}
function Quick({show,href,icon,label,value,sub}:any){if(!show)return null;return <Link href={href} style={quick}><div>{icon}</div><b>{value}</b><strong>{label}</strong><span>{sub}</span></Link>}
const hero:React.CSSProperties={display:'grid',gridTemplateColumns:'1.6fr .8fr',gap:22,padding:28,borderRadius:30,background:'linear-gradient(135deg,#0f172a,#1d4ed8 55%,#7c3aed)',color:'#fff',boxShadow:'0 24px 70px rgba(15,23,42,.22)',marginBottom:22}
const badge:React.CSSProperties={display:'inline-flex',padding:'8px 12px',borderRadius:999,background:'rgba(255,255,255,.14)',border:'1px solid rgba(255,255,255,.25)',fontSize:12,fontWeight:900,letterSpacing:.5}
const h1:React.CSSProperties={fontSize:46,lineHeight:1.02,margin:'18px 0 12px',letterSpacing:-1.8,fontWeight:950}
const p:React.CSSProperties={maxWidth:880,color:'#dbeafe',fontSize:16,lineHeight:1.7,fontWeight:650,margin:0}
const heroBtns:React.CSSProperties={display:'flex',gap:12,flexWrap:'wrap',marginTop:22}.valueOf()
const btnPrimary:React.CSSProperties={padding:'13px 18px',borderRadius:16,background:'#fff',color:'#1d4ed8',fontWeight:950,textDecoration:'none'}
const btnGhost:React.CSSProperties={padding:'13px 18px',borderRadius:16,background:'rgba(255,255,255,.12)',color:'#fff',border:'1px solid rgba(255,255,255,.24)',fontWeight:900,textDecoration:'none'}
const heroPanel:React.CSSProperties={borderRadius:24,background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.2)',padding:20}
const small:React.CSSProperties={fontSize:12,color:'#bfdbfe',fontWeight:900,textTransform:'uppercase'}
const role:React.CSSProperties={display:'block',fontSize:32,marginTop:8,textTransform:'capitalize'}
const heroStats:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginTop:18}
const metrics:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:16,marginBottom:18}
const grid2:React.CSSProperties={display:'grid',gridTemplateColumns:'1.35fr .9fr',gap:18,marginBottom:18}
const grid3:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,marginTop:18}
const moduleGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14}
const memo:React.CSSProperties={display:'grid',gap:12}
const memoItem:React.CSSProperties={padding:16,border:'1px solid #e2e8f0',borderRadius:18}.valueOf()
const toolbar:React.CSSProperties={display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',fontSize:12,color:'#64748b'}
const taskGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14}
const taskCard:React.CSSProperties={display:'flex',flexDirection:'column',gap:10,padding:18,border:'1px solid #dbe3ee',borderRadius:22,background:'linear-gradient(180deg,#fff,#f8fafc)',textDecoration:'none',boxShadow:'0 16px 34px rgba(15,23,42,.06)'}
const taskTop:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}
const source:React.CSSProperties={fontSize:12,fontWeight:950,color:'#475569'}
const taskTitle:React.CSSProperties={margin:0,color:'#0f172a',fontSize:18,fontWeight:950,lineHeight:1.25}
const taskText:React.CSSProperties={margin:0,color:'#64748b',fontSize:13,fontWeight:650,lineHeight:1.55,minHeight:42}
const taskMeta:React.CSSProperties={display:'flex',gap:10,flexWrap:'wrap',fontSize:12,fontWeight:850,color:'#334155'}
const taskActions:React.CSSProperties={display:'flex',gap:8,flexWrap:'wrap',marginTop:6}.valueOf()
const aiBox:React.CSSProperties={display:'flex',gap:16,padding:18,borderRadius:22,background:'linear-gradient(135deg,#f8fafc,#eef2ff)',border:'1px solid #dbe3ee'}
const aiIcon:React.CSSProperties={width:58,height:58,borderRadius:20,display:'grid',placeItems:'center',background:'#fff',fontSize:30}
const aiTitle:React.CSSProperties={margin:'0 0 8px',fontSize:22,color:'#0f172a'}
const aiText:React.CSSProperties={margin:0,color:'#475569',fontWeight:700,lineHeight:1.6}
const brief:React.CSSProperties={display:'grid',gap:9,marginTop:14,color:'#334155',fontWeight:750}
const widgetGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}
const quick:React.CSSProperties={padding:16,borderRadius:20,border:'1px solid #dbe3ee',background:'#fff',textDecoration:'none',color:'#0f172a',display:'grid',gap:4}.valueOf()
const calendar:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:10}
const dayCard:React.CSSProperties={minHeight:178,padding:12,border:'1px solid #dbe3ee',borderRadius:18,background:'#fff',textDecoration:'none',color:'#0f172a',display:'flex',flexDirection:'column',gap:8}.valueOf()
const dayHead:React.CSSProperties={display:'flex',justifyContent:'space-between',fontSize:12,color:'#64748b'}
const shift:React.CSSProperties={display:'grid',gap:2,padding:8,borderRadius:12,background:'#f8fafc',border:'1px solid #e2e8f0',fontSize:11}.valueOf()
const off:React.CSSProperties={color:'#94a3b8',fontSize:12,fontWeight:800,marginTop:18,textAlign:'center'}
const bigAction:React.CSSProperties={display:'grid',gap:10}.valueOf()
const empty:React.CSSProperties={padding:22,border:'1px dashed #cbd5e1',borderRadius:20,color:'#64748b',background:'#f8fafc'}
