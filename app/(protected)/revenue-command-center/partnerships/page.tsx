import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge, Field, Kpi, Panel, RowLink, Select, TextArea, WorkspaceHero, dateTime, money, statusTone } from '../_components/BDV3Primitives'

export default async function PartnershipsPage() {
  const supabase = await createClient()
  const { data: partnerships } = await supabase.from('bd_partnerships').select('*').order('updated_at', { ascending: false })
  async function createPartnership(formData: FormData) {
    'use server'
    const supabase = await createClient()
    await supabase.from('bd_partnerships').insert([{ organization: String(formData.get('organization')||''), contact_name: String(formData.get('contact_name')||''), phone: String(formData.get('phone')||''), email: String(formData.get('email')||''), city: String(formData.get('city')||''), category: String(formData.get('category')||''), stage: String(formData.get('stage')||'identified'), potential_value: Number(formData.get('potential_value')||0), next_action: String(formData.get('next_action')||''), next_action_at: String(formData.get('next_action_at')||'') || null, notes: String(formData.get('notes')||'') }])
    redirect('/revenue-command-center/partnerships')
  }
  const value = (partnerships||[]).reduce((s:number,p:any)=>s+Number(p.potential_value||0),0)
  return <AppShell title="Partnership Pipeline" subtitle="B2B institutional growth system for schools, clinics, companies and associations." breadcrumbs={[{ label: 'Business Development', href: '/revenue-command-center/business-development' }, { label: 'Partnerships' }]}>
    <div style={{ display:'grid', gap:20 }}><WorkspaceHero title="Corporate Partnership Engine" subtitle="Map, approach, negotiate and sign strategic partnerships that create recurring demand beyond social media acquisition." />
    <section style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:14 }}><Kpi title="Partners" value={String(partnerships?.length||0)} /><Kpi title="Potential" value={money(value)} tone="#16a34a" /><Kpi title="Negotiation" value={String((partnerships||[]).filter((p:any)=>p.stage==='negotiation').length)} tone="#f59e0b" /><Kpi title="Signed" value={String((partnerships||[]).filter((p:any)=>p.stage==='signed').length)} tone="#16a34a" /></section>
    <section style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:18 }}><Panel title="Partnership board" subtitle="Pipeline by stage and potential value."><div style={{ display:'grid', gap:10 }}>{(partnerships||[]).map((p:any)=><RowLink key={p.id} href="/revenue-command-center/partnerships"><strong>{p.organization}</strong><span>{p.city || 'No city'} • {p.category || 'No category'} • {money(p.potential_value)}</span><Badge tone={statusTone[p.stage]||'#2563eb'}>{p.stage}</Badge></RowLink>)}</div></Panel><Panel title="Create partnership" subtitle="Add institutional opportunities."><form action={createPartnership} style={{ display:'grid', gap:12 }}><Field name="organization" label="Organization" required /><Field name="contact_name" label="Contact name" /><Field name="phone" label="Phone" /><Field name="email" label="Email" /><Field name="city" label="City" /><Field name="category" label="Category" /><Select name="stage" label="Stage" options={[{value:'identified',label:'Identified'},{value:'discussion',label:'Discussion'},{value:'negotiation',label:'Negotiation'},{value:'signed',label:'Signed'},{value:'lost',label:'Lost'}]} /><Field name="potential_value" label="Potential value" type="number" /><Field name="next_action" label="Next action" /><Field name="next_action_at" label="Next action date" type="datetime-local" /><TextArea name="notes" label="Notes" /><button style={{ border:'none', borderRadius:14, background:'#0f172a', color:'#fff', padding:14, fontWeight:950 }}>Create partnership</button></form></Panel></section></div>
  </AppShell>
}
