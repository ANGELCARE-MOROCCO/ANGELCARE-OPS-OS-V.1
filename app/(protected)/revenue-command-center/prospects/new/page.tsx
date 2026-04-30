import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Field, Panel, Select, TextArea } from '../../_components/BDV3Primitives'

export default async function NewProspectPage() {
  async function createProspect(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const payload = { company_name: String(formData.get('company_name')||''), contact_name: String(formData.get('contact_name')||''), phone: String(formData.get('phone')||''), email: String(formData.get('email')||''), city: String(formData.get('city')||''), segment: String(formData.get('segment')||''), channel: String(formData.get('channel')||''), status: String(formData.get('status')||'new'), priority: String(formData.get('priority')||'normal'), estimated_value: Number(formData.get('estimated_value')||0), next_action: String(formData.get('next_action')||''), next_action_at: String(formData.get('next_action_at')||'') || null, notes: String(formData.get('notes')||'') }
    const { data, error } = await supabase.from('bd_prospects').insert([payload]).select('id').single()
    if (error) throw new Error(error.message)
    redirect(`/revenue-command-center/prospects/${data.id}`)
  }
  return <AppShell title="New Prospect" subtitle="Add a B2B/B2C prospect with segmentation, value and next action." breadcrumbs={[{ label: 'Prospects', href: '/revenue-command-center/prospects' }, { label: 'New' }]}>
    <form action={createProspect} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18 }}><Panel title="Prospect profile" subtitle="Capture enough information to start execution."><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><Field name="company_name" label="Company / Institution" /><Field name="contact_name" label="Contact person" /><Field name="phone" label="Phone" /><Field name="email" label="Email" /><Field name="city" label="City" /><Field name="segment" label="Segment" placeholder="school, clinic, corporate, parent, preschool..." /><Field name="channel" label="Source channel" /><Field name="estimated_value" label="Estimated value MAD" type="number" /><Select name="status" label="Status" options={[{value:'new',label:'New'},{value:'contacted',label:'Contacted'},{value:'qualified',label:'Qualified'},{value:'proposal',label:'Proposal'},{value:'won',label:'Won'},{value:'lost',label:'Lost'}]} /><Select name="priority" label="Priority" options={[{value:'low',label:'Low'},{value:'normal',label:'Normal'},{value:'high',label:'High'},{value:'critical',label:'Critical'}]} /><Field name="next_action" label="Next action" /><Field name="next_action_at" label="Next action date/time" type="datetime-local" /><div style={{ gridColumn: '1 / -1' }}><TextArea name="notes" label="Notes" /></div></div></Panel><Panel title="Create" subtitle="Prospect will become actionable immediately."><button style={{ border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: 14, fontWeight: 950, width: '100%' }}>Create prospect</button></Panel></form>
  </AppShell>
}
