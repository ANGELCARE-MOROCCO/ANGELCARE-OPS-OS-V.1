import React from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Field, Panel, Select, TextArea } from '../../../_components/BDV3Primitives'

export default async function EditProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: prospect } = await supabase
    .from('bd_prospects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!prospect) notFound()

  async function updateProspect(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const prospectId = String(formData.get('prospect_id') || '')

    if (!prospectId) throw new Error('Prospect ID is missing')

    const payload = {
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      email: String(formData.get('email') || '').trim() || null,
      company_name: String(formData.get('company_name') || '').trim() || null,
      contact_name: String(formData.get('contact_name') || '').trim() || null,
      type: String(formData.get('type') || '').trim() || null,
      status: String(formData.get('status') || 'new'),
      stage: String(formData.get('stage') || 'prospecting'),
      segment: String(formData.get('segment') || '').trim() || null,
      priority: String(formData.get('priority') || 'medium'),
      source: String(formData.get('source') || '').trim() || null,
      channel: String(formData.get('channel') || '').trim() || null,
      city: String(formData.get('city') || '').trim() || null,
      next_action: String(formData.get('next_action') || '').trim() || null,
      next_action_at: String(formData.get('next_action_at') || '') || null,
      estimated_value: Number(formData.get('estimated_value') || 0) || 0,
      probability: Number(formData.get('probability') || 0) || 0,
      strategic_value: Number(formData.get('strategic_value') || 0) || 0,
      notes: String(formData.get('notes') || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (!payload.name) throw new Error('Prospect name is required')
    if (!payload.phone) throw new Error('Phone is required')

    const { error } = await supabase
      .from('bd_prospects')
      .update(payload)
      .eq('id', prospectId)

    if (error) throw new Error(error.message)

    redirect(`/revenue-command-center/prospects/${prospectId}`)
  }

  return (
    <AppShell
      title={`Edit ${prospect.name || 'Prospect'}`}
      subtitle="Update prospect profile, qualification, ownership context, and next action."
      breadcrumbs={[
        { label: 'Revenue Command', href: '/revenue-command-center' },
        { label: 'Prospects', href: '/revenue-command-center/prospects' },
        { label: prospect.name || 'Prospect', href: `/revenue-command-center/prospects/${prospect.id}` },
        { label: 'Edit' },
      ]}
      actions={
        <>
          <PageAction href={`/revenue-command-center/prospects/${prospect.id}`} variant="light">Cancel</PageAction>
        </>
      }
    >
      <form action={updateProspect} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18 }}>
        <input type="hidden" name="prospect_id" value={prospect.id} />

        <Panel title="Prospect profile" subtitle="Keep this information clean because it feeds the action room and follow-up workflow.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
            <Field name="name" label="Prospect / Opportunity name" defaultValue={prospect.name || ''} required />
            <Field name="phone" label="Phone" defaultValue={prospect.phone || ''} required />
            <Field name="email" label="Email" defaultValue={prospect.email || ''} />
            <Field name="city" label="City / Zone" defaultValue={prospect.city || ''} />
            <Field name="company_name" label="Company / Family name" defaultValue={prospect.company_name || ''} />
            <Field name="contact_name" label="Decision maker / Contact" defaultValue={prospect.contact_name || ''} />

            <Select name="type" label="Prospect type" defaultValue={prospect.type || ''} options={[
              { value: '', label: 'Not specified' },
              { value: 'b2c_family', label: 'B2C Family' },
              { value: 'b2b_partner', label: 'B2B Partner' },
              { value: 'clinic', label: 'Clinic / Hospital' },
              { value: 'agency', label: 'Agency' },
              { value: 'corporate', label: 'Corporate' },
            ]} />

            <Select name="status" label="Status" defaultValue={prospect.status || 'new'} options={[
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'proposal', label: 'Proposal / Offer' },
              { value: 'won', label: 'Won' },
              { value: 'lost', label: 'Lost' },
            ]} />

            <Select name="stage" label="Stage" defaultValue={prospect.stage || 'prospecting'} options={[
              { value: 'prospecting', label: 'Prospecting' },
              { value: 'qualification', label: 'Qualification' },
              { value: 'needs_analysis', label: 'Needs analysis' },
              { value: 'offer_preparation', label: 'Offer preparation' },
              { value: 'negotiation', label: 'Negotiation' },
              { value: 'closing', label: 'Closing' },
              { value: 'nurturing', label: 'Nurturing' },
            ]} />

            <Select name="priority" label="Priority" defaultValue={prospect.priority || 'medium'} options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical / Urgent care need' },
            ]} />

            <Field name="segment" label="Segment" defaultValue={prospect.segment || ''} />
            <Field name="source" label="Source" defaultValue={prospect.source || ''} />
            <Field name="channel" label="Channel" defaultValue={prospect.channel || ''} />
            <Field name="estimated_value" label="Estimated value" type="number" defaultValue={String(prospect.estimated_value || 0)} />
            <Field name="probability" label="Probability %" type="number" defaultValue={String(prospect.probability || 0)} />
            <Field name="strategic_value" label="Strategic value score" type="number" defaultValue={String(prospect.strategic_value || 0)} />

            <div style={{ gridColumn: '1 / -1' }}>
              <TextArea name="notes" label="Notes" defaultValue={prospect.notes || ''} />
            </div>
          </div>
        </Panel>

        <Panel title="Next action" subtitle="Every prospect should have a clear next operational move.">
          <div style={{ display: 'grid', gap: 12 }}>
            <Field name="next_action" label="Next action" defaultValue={prospect.next_action || ''} />
            <Field name="next_action_at" label="Next action date/time" type="datetime-local" />
            <button style={{ border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: 14, fontWeight: 950, width: '100%', cursor: 'pointer' }}>
              Save changes
            </button>
            <a href={`/revenue-command-center/prospects/${prospect.id}`} style={{ textAlign: 'center', color: '#0f172a', fontWeight: 850, textDecoration: 'none' }}>
              Cancel and return
            </a>
          </div>
        </Panel>
      </form>
    </AppShell>
  )
}