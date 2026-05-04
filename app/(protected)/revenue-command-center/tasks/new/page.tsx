import React from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const CATEGORIES = ['B2C Family Acquisition','B2B Partnership','Clinic Outreach','Hospital Network','Referral Program','Meta Lead Follow-up','WhatsApp Conversion','Offer Preparation','Appointment Preparation','Caregiver Demand Mapping','Corporate Account','Market Domination','Service Catalogue Alignment','Brochure Sending','Post-Meeting Follow-up','Lost Lead Recovery','High Value Lead','Partner Activation','Campaign Execution','Quality Control']
const SEGMENTS = ['B2C','B2B','Partner','Clinic','Hospital','Corporate','Agency','Family']
const TYPES = ['Call','WhatsApp','Email','Meeting','Research','Offer','Follow-up','Qualification','Admin','Field Coordination']
const PRIORITIES = ['normal','high','critical','low']
const TASK_TEMPLATES = Array.from({length:500},(_,i)=>{const n=i+1,c=CATEGORIES[i%CATEGORIES.length],s=SEGMENTS[i%SEGMENTS.length],t=TYPES[i%TYPES.length],p=PRIORITIES[i%PRIORITIES.length];return {id:`template-${n}`,title:`${c} ${String(n).padStart(3,'0')} — ${t} execution`,category:c,segment:s,priority:p,task_type:t,duration:i%5===0?'90 min':i%3===0?'60 min':'30 min',description:`Execute a ${t.toLowerCase()} task for ${s} growth under ${c}. Confirm objective, record outcome, define next action, and update linked context.`}})
function clean(v: FormDataEntryValue | null) { const x=String(v||'').trim(); return x||null }

async function createTask(formData: FormData) {
  'use server'
  const supabase=await createClient()
  const title=clean(formData.get('title'))
  if(!title) throw new Error('Task title is required')
  const desc=[clean(formData.get('description')),clean(formData.get('task_context')),clean(formData.get('success_criteria'))?`Success criteria: ${clean(formData.get('success_criteria'))}`:null].filter(Boolean).join('\n\n')
  const payload={title,description:desc||null,status:clean(formData.get('status'))||'open',priority:clean(formData.get('priority'))||'normal',assigned_to:clean(formData.get('assigned_to')),related_type:clean(formData.get('related_type')),related_id:clean(formData.get('related_id')),linked_type:clean(formData.get('related_type')),linked_id:clean(formData.get('related_id')),due_at:clean(formData.get('due_at'))}
  const {data,error}=await supabase.from('bd_tasks').insert(payload).select('id').single()
  if(error) throw new Error(error.message)
  await supabase.from('bd_activity_logs').insert({entity_type:'task',entity_id:data.id,action:'task_created',note:'Task created from professional task factory.'})
  redirect(`/revenue-command-center/tasks/${data.id}`)
}

export default async function NewRevenueTaskPage(){
  const supabase=await createClient()
  const {data:prospects}=await supabase.from('bd_prospects').select('id,name,phone,status,priority').order('created_at',{ascending:false}).limit(120)
  return <AppShell title="Create Revenue Task" subtitle="Professional task configuration for AngelCare Business Development and market domination." breadcrumbs={[{label:'Revenue Command',href:'/revenue-command-center'},{label:'Tasks',href:'/revenue-command-center/tasks'},{label:'New'}]} actions={<><PageAction href="/revenue-command-center/tasks" variant="light">Back</PageAction><PageAction href="/revenue-command-center/prospects" variant="light">Prospects</PageAction></>}>
    <form action={createTask} style={pageStyle}>
      <section style={heroStyle}>
        <div><div style={{color:'#ddd6fe',fontSize:12,fontWeight:950,letterSpacing:2}}>ANGELCARE TASK FACTORY</div><h1 style={heroTitleStyle}>Configurable Execution Task Builder</h1><p style={heroTextStyle}>Use 500 performance-oriented task templates, then configure ownership, timing, linked prospect context, and success criteria.</p></div>
        <div style={{display:'grid',gap:9,padding:18,borderRadius:24,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)'}}><strong>Creation protocol</strong><span>1. Browse templates</span><span>2. Fill core task</span><span>3. Link context</span><span>4. Create and execute</span></div>
      </section>
      <section style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 520px',gap:18,alignItems:'start'}}>
        <div style={{display:'grid',gap:18}}>
          <Panel title="Task Core Configuration" subtitle="Manual fields remain editable.">
            <div style={{display:'grid',gap:11}}>
              <input name="title" placeholder="Task title" required style={inputStyle}/>
              <textarea name="description" rows={5} placeholder="Agent instructions, expected outcome, client context..." style={inputStyle}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><select name="status" defaultValue="open" style={inputStyle}><option value="open">Open</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="completed">Completed</option></select><select name="priority" defaultValue="normal" style={inputStyle}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><input name="assigned_to" placeholder="Assigned user UUID" style={inputStyle}/><input name="due_at" type="datetime-local" style={inputStyle}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><select name="related_type" style={inputStyle}><option value="">None</option><option value="prospect">Prospect</option><option value="appointment">Appointment</option><option value="campaign">Campaign</option><option value="partnership">Partnership</option><option value="offer">Offer</option></select><input name="related_id" placeholder="Linked record UUID" style={inputStyle}/></div>
              <textarea name="task_context" rows={4} placeholder="AngelCare context: service need, city, family situation, partner type..." style={inputStyle}/>
              <textarea name="success_criteria" rows={3} placeholder="What must happen for this task to be successful?" style={inputStyle}/>
              <button type="submit" style={buttonStyle}>Create Operational Task</button>
            </div>
          </Panel>
          <Panel title="Available Prospects for Linking" subtitle="Copy a prospect ID into linked record ID if needed.">
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>{(prospects||[]).length ? (prospects||[]).slice(0,16).map((p:any)=><div key={p.id} style={{display:'grid',gap:5,padding:12,borderRadius:16,border:'1px solid #e2e8f0',background:'#f8fafc'}}><strong>{p.name||'Unnamed prospect'}</strong><span>{p.phone||'No phone'} · {p.status||'new'} · {p.priority||'normal'}</span><code style={{fontSize:11,background:'#e2e8f0',padding:6,borderRadius:8,overflow:'hidden',textOverflow:'ellipsis'}}>{p.id}</code></div>) : <Empty title="No prospects loaded" text="Create prospects first or link manually."/>}</div>
          </Panel>
        </div>
        <aside style={{position:'sticky',top:18}}>
          <Panel title="Smart Template Browser" subtitle="500 operational task templates for B2B/B2C execution.">
            <div style={{display:'grid',gap:10,maxHeight:920,overflow:'auto',paddingRight:5}}>
              {TASK_TEMPLATES.map((t:any)=><div key={t.id} style={{padding:13,borderRadius:18,background:'#020617',color:'#e2e8f0',border:'1px solid #1e293b'}}><strong>{t.title}</strong><div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:7,color:'#93c5fd',fontWeight:800,fontSize:12}}><span>{t.category}</span><span>{t.segment}</span><span>{t.task_type}</span><span>{t.duration}</span></div><p style={{lineHeight:1.45}}>{t.description}</p></div>)}
            </div>
          </Panel>
        </aside>
      </section>
    </form>
  </AppShell>
}
function Panel({title,subtitle,children}:{title:string;subtitle?:string;children:React.ReactNode}){return <section style={panelStyle}><div style={{marginBottom:14}}><h2 style={{margin:0,fontSize:20,fontWeight:950}}>{title}</h2>{subtitle?<p style={{margin:'6px 0 0',color:'#64748b',fontWeight:650}}>{subtitle}</p>:null}</div>{children}</section>}
function Empty({title,text}:{title:string;text:string}){return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>}

const pageStyle: React.CSSProperties = { display:'grid', gap:20, color:'#0f172a' }
const heroStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 320px', gap:18, padding:28, borderRadius:30, color:'#fff', background:'radial-gradient(circle at top left,#2563eb,#020617 72%)', boxShadow:'0 28px 70px rgba(15,23,42,.22)' }
const heroTitleStyle: React.CSSProperties = { margin:0, fontSize:38, lineHeight:1.05, fontWeight:950 }
const heroTextStyle: React.CSSProperties = { margin:'10px 0 0', color:'#dbeafe', lineHeight:1.6, fontWeight:700 }
const panelStyle: React.CSSProperties = { borderRadius:26, padding:20, background:'#fff', border:'1px solid #e2e8f0', boxShadow:'0 18px 45px rgba(15,23,42,.07)' }
const kpiGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:14 }
const kpiStyle: React.CSSProperties = { borderTop:'5px solid', borderRadius:22, padding:18, background:'#fff', border:'1px solid #e2e8f0', boxShadow:'0 18px 40px rgba(15,23,42,.08)' }
const grid2Style: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, alignItems:'start' }
const inputStyle: React.CSSProperties = { width:'100%', boxSizing:'border-box', padding:13, borderRadius:13, border:'1px solid #cbd5e1', background:'#f8fafc', color:'#0f172a', fontWeight:750 }
const buttonStyle: React.CSSProperties = { border:'none', borderRadius:14, padding:'13px 16px', background:'#0f172a', color:'#fff', fontWeight:950, cursor:'pointer' }
const pillStyle: React.CSSProperties = { border:'1px solid', borderRadius:999, padding:'5px 9px', fontWeight:950, fontSize:11, whiteSpace:'nowrap', background:'#fff' }
const emptyStyle: React.CSSProperties = { display:'grid', gap:5, padding:18, borderRadius:16, background:'#f8fafc', border:'1px dashed #cbd5e1', color:'#64748b' }
