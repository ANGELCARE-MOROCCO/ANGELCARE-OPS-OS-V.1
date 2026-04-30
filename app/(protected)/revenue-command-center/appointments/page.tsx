import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge, Field, Kpi, Panel, RowLink, Select, TextArea, WorkspaceHero, dateTime, statusTone } from '../_components/BDV3Primitives'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: appointments } = await supabase.from('bd_appointments').select('*').order('starts_at', { ascending: true })
  async function createAppointment(formData: FormData) {
    'use server'
    const supabase = await createClient()
    await supabase.from('bd_appointments').insert([{ title: String(formData.get('title')||''), status: String(formData.get('status')||'scheduled'), linked_type: String(formData.get('linked_type')||'') || null, linked_id: String(formData.get('linked_id')||'') || null, starts_at: String(formData.get('starts_at')||'') || null, ends_at: String(formData.get('ends_at')||'') || null, location: String(formData.get('location')||''), notes: String(formData.get('notes')||'') }])
    redirect('/revenue-command-center/appointments')
  }
  return <AppShell title="Appointments Desk" subtitle="Handle meetings, visits, calls, demos and follow-up appointments." breadcrumbs={[{ label: 'Business Development', href: '/revenue-command-center/business-development' }, { label: 'Appointments' }]}>
    <div style={{ display: 'grid', gap: 20 }}><WorkspaceHero title="Appointment Handling Center" subtitle="A single desk for booking, preparing, executing and tracking business appointments." />
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}><Kpi title="Appointments" value={String(appointments?.length||0)} /><Kpi title="Scheduled" value={String((appointments||[]).filter((a:any)=>a.status==='scheduled').length)} /><Kpi title="Completed" value={String((appointments||[]).filter((a:any)=>a.status==='completed').length)} tone="#16a34a" /><Kpi title="Cancelled" value={String((appointments||[]).filter((a:any)=>a.status==='cancelled').length)} tone="#dc2626" /></section>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18 }}><Panel title="Appointment pipeline" subtitle="Upcoming and past appointments."><div style={{ display:'grid', gap:10 }}>{(appointments||[]).map((a:any)=><RowLink key={a.id} href="/revenue-command-center/appointments"><strong>{a.title}</strong><span>{dateTime(a.starts_at)} • {a.location || 'no location'}</span><Badge tone={statusTone[a.status]||'#2563eb'}>{a.status}</Badge></RowLink>)}</div></Panel><Panel title="Create appointment" subtitle="Link it to a prospect/lead/family when available."><form action={createAppointment} style={{ display:'grid', gap:12 }}><Field name="title" label="Title" required /><Select name="status" label="Status" options={[{value:'scheduled',label:'Scheduled'},{value:'completed',label:'Completed'},{value:'cancelled',label:'Cancelled'}]} /><Select name="linked_type" label="Linked to" options={[{value:'',label:'None'},{value:'prospect',label:'Prospect'},{value:'lead',label:'Lead'},{value:'family',label:'Family'},{value:'partnership',label:'Partnership'}]} /><Field name="linked_id" label="Linked ID" /><Field name="starts_at" label="Starts" type="datetime-local" /><Field name="ends_at" label="Ends" type="datetime-local" /><Field name="location" label="Location" /><TextArea name="notes" label="Notes" /><button style={{ border:'none', borderRadius:14, background:'#0f172a', color:'#fff', padding:14, fontWeight:950 }}>Create appointment</button></form></Panel></section>
    </div></AppShell>
}
