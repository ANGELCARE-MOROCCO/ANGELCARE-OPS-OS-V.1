import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge, Field, Kpi, Panel, RowLink, Select, TextArea, WorkspaceHero, dateTime, money, statusTone } from '../_components/BDV3Primitives'

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: campaigns } = await supabase.from('bd_campaigns').select('*').order('created_at', { ascending: false })
  async function createCampaign(formData: FormData) {
    'use server'
    const supabase = await createClient()
    await supabase.from('bd_campaigns').insert([{ name: String(formData.get('name')||''), type: String(formData.get('type')||'b2b'), status: String(formData.get('status')||'planning'), objective: String(formData.get('objective')||''), target_segment: String(formData.get('target_segment')||''), city: String(formData.get('city')||''), start_at: String(formData.get('start_at')||'') || null, end_at: String(formData.get('end_at')||'') || null, budget: Number(formData.get('budget')||0), kpi_target: String(formData.get('kpi_target')||'') }])
    redirect('/revenue-command-center/campaigns')
  }
  const totalBudget = (campaigns||[]).reduce((s:number,c:any)=>s+Number(c.budget||0),0)
  return <AppShell title="Campaign Execution Engine" subtitle="Plan and manage B2B/B2C prospecting campaigns with objectives, targets, timing, budget and KPIs." breadcrumbs={[{ label: 'Business Development', href: '/revenue-command-center/business-development' }, { label: 'Campaigns' }]}>
    <div style={{ display: 'grid', gap: 20 }}><WorkspaceHero title="Campaign Control Room" subtitle="Run outbound, field, partnership, school, clinic and social campaigns from one operational board." />
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}><Kpi title="Campaigns" value={String(campaigns?.length||0)} /><Kpi title="Budget" value={money(totalBudget)} tone="#16a34a" /><Kpi title="Active" value={String((campaigns||[]).filter((c:any)=>c.status==='active').length)} tone="#2563eb" /><Kpi title="Planning" value={String((campaigns||[]).filter((c:any)=>c.status==='planning').length)} tone="#f59e0b" /></section>
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18 }}><Panel title="Campaign board" subtitle="Click later into detail pages; use tasks to execute steps."><div style={{ display: 'grid', gap: 10 }}>{(campaigns||[]).map((c:any)=><RowLink key={c.id} href="/revenue-command-center/campaigns"><strong>{c.name}</strong><span>{c.type} • {c.target_segment || 'no target'} • {dateTime(c.start_at)}</span><Badge tone={statusTone[c.status]||'#2563eb'}>{c.status}</Badge></RowLink>)}</div></Panel><Panel title="Create campaign" subtitle="Add a campaign then create execution tasks."><form action={createCampaign} style={{ display: 'grid', gap: 12 }}><Field name="name" label="Campaign name" required /><Select name="type" label="Type" options={[{value:'b2b',label:'B2B'},{value:'b2c',label:'B2C'},{value:'partnership',label:'Partnership'},{value:'field',label:'Field'}]} /><Select name="status" label="Status" options={[{value:'planning',label:'Planning'},{value:'active',label:'Active'},{value:'paused',label:'Paused'}]} /><Field name="target_segment" label="Target segment" /><Field name="city" label="City" /><Field name="start_at" label="Start" type="datetime-local" /><Field name="end_at" label="End" type="datetime-local" /><Field name="budget" label="Budget" type="number" /><Field name="kpi_target" label="KPI target" /><TextArea name="objective" label="Objective" /><button style={{ border:'none', borderRadius:14, background:'#0f172a', color:'#fff', padding:14, fontWeight:950 }}>Create campaign</button></form></Panel></section></div>
  </AppShell>
}
