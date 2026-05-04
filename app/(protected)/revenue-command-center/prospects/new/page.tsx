import React from 'react'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Field, Panel, Select, TextArea } from '../../_components/BDV3Primitives'

export default function NewProspectPage() {
  async function createProspect(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const name = String(formData.get('name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const companyName = String(formData.get('company_name') || '').trim()
    const status = String(formData.get('status') || 'new').trim()
    const source = String(formData.get('source') || '').trim()
    const channel = String(formData.get('channel') || '').trim()
    const priority = String(formData.get('priority') || 'normal').trim()
    const assignedTo = String(formData.get('assigned_to') || '').trim() || null
    const rawNotes = String(formData.get('notes') || '').trim()

    const prospectType = String(formData.get('prospect_type') || '').trim()
    const segment = String(formData.get('segment') || '').trim()
    const serviceNeed = String(formData.get('service_need') || '').trim()
    const urgency = String(formData.get('urgency') || '').trim()
    const cityZone = String(formData.get('city_zone') || '').trim()
    const decisionMaker = String(formData.get('decision_maker') || '').trim()
    const decisionRole = String(formData.get('decision_role') || '').trim()
    const expectedVolume = String(formData.get('expected_volume') || '').trim()
    const budgetSignal = String(formData.get('budget_signal') || '').trim()
    const nextAction = String(formData.get('next_action') || '').trim()
    const nextFollowUp = String(formData.get('next_follow_up') || '').trim()
    const qualification = String(formData.get('qualification') || '').trim()
    const objection = String(formData.get('objection') || '').trim()

    if (!name) throw new Error('Prospect name is required')
    if (!phone) throw new Error('Phone number is required')
    if (!status) throw new Error('Status is required')
    if (!priority) throw new Error('Priority is required')

    const structuredNotes = [
      '--- ANGELCARE BUSINESS DEV CONTEXT ---',
      `Prospect type: ${prospectType || 'Not specified'}`,
      `Segment: ${segment || 'Not specified'}`,
      `Service need: ${serviceNeed || 'Not specified'}`,
      `Urgency: ${urgency || 'Not specified'}`,
      `City / zone: ${cityZone || 'Not specified'}`,
      `Decision maker: ${decisionMaker || 'Not specified'}`,
      `Decision role: ${decisionRole || 'Not specified'}`,
      `Expected volume / need size: ${expectedVolume || 'Not specified'}`,
      `Budget signal: ${budgetSignal || 'Not specified'}`,
      `Qualification: ${qualification || 'Not specified'}`,
      `Main objection / risk: ${objection || 'None'}`,
      `Next action: ${nextAction || 'Not specified'}`,
      `Next follow-up: ${nextFollowUp || 'Not specified'}`,
      '',
      '--- AGENT NOTES ---',
      rawNotes || 'No additional notes',
    ].join('\n')

    const payload = {
      name,
      phone,
      email,
      company_name: companyName,
      status,
      source,
      channel,
      priority,
      assigned_to: assignedTo,
      notes: structuredNotes,
    }

    const { data, error } = await supabase
      .from('bd_prospects')
      .insert([payload])
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    redirect(`/revenue-command-center/prospects/${data.id}`)
  }

  return (
    <AppShell
      title="Create Prospect"
      subtitle="Capture a complete B2B or B2C business opportunity without changing the Revenue data model."
      breadcrumbs={[
        { label: 'Prospects', href: '/revenue-command-center/prospects' },
        { label: 'New' },
      ]}
    >
      <form action={createProspect} style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Identity & contact" subtitle="Core synced fields saved directly into bd_prospects.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              <Field name="name" label="Full name / Main contact" required />
              <Field name="phone" label="Phone / WhatsApp" required />
              <Field name="email" label="Email" />
              <Field name="company_name" label="Company / Family / Organization" />
            </div>
          </Panel>

          <Panel title="Business classification" subtitle="B2C family need, B2B partner, clinic, company or institutional opportunity.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
              <Select name="prospect_type" label="Prospect type" options={[
                { value: '', label: 'Select type' },
                { value: 'b2c_family', label: 'B2C - Family' },
                { value: 'b2b_company', label: 'B2B - Company' },
                { value: 'clinic_hospital', label: 'Clinic / Hospital' },
                { value: 'partner_referral', label: 'Partner / Referral' },
                { value: 'institution', label: 'Institution' },
              ]} />

              <Select name="segment" label="Segment" options={[
                { value: '', label: 'Select segment' },
                { value: 'elderly_care', label: 'Elderly care' },
                { value: 'post_hospitalization', label: 'Post-hospitalization' },
                { value: 'chronic_condition', label: 'Chronic condition support' },
                { value: 'disability_support', label: 'Disability support' },
                { value: 'household_support', label: 'Household support' },
                { value: 'corporate_care_plan', label: 'Corporate care plan' },
                { value: 'referral_network', label: 'Referral network' },
              ]} />

              <Select name="urgency" label="Urgency" options={[
                { value: '', label: 'Select urgency' },
                { value: 'immediate', label: 'Immediate - today/24h' },
                { value: 'soon', label: 'Soon - 2 to 7 days' },
                { value: 'planned', label: 'Planned' },
                { value: 'exploratory', label: 'Exploratory' },
              ]} />

              <Field name="service_need" label="Service needed" />
              <Field name="city_zone" label="City / zone" />
              <Field name="expected_volume" label="Expected volume / need size" />
            </div>
          </Panel>

          <Panel title="Qualification & decision" subtitle="Help the agent understand who decides, what matters, and what blocks conversion.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              <Field name="decision_maker" label="Decision maker" />
              <Field name="decision_role" label="Decision role" />

              <Select name="budget_signal" label="Budget signal" options={[
                { value: '', label: 'Not assessed' },
                { value: 'confirmed', label: 'Confirmed budget' },
                { value: 'probable', label: 'Probable budget' },
                { value: 'sensitive', label: 'Price sensitive' },
                { value: 'unknown', label: 'Unknown' },
              ]} />

              <Select name="qualification" label="Qualification" options={[
                { value: '', label: 'Not qualified' },
                { value: 'hot', label: 'Hot - ready for action' },
                { value: 'warm', label: 'Warm - needs follow-up' },
                { value: 'cold', label: 'Cold - low intent' },
                { value: 'partner_potential', label: 'Partner potential' },
              ]} />

              <div style={{ gridColumn: '1 / -1' }}>
                <TextArea name="objection" label="Main objection / risk" />
              </div>
            </div>
          </Panel>

          <Panel title="Agent notes" subtitle="Operational notes that will be stored with the prospect record.">
            <TextArea name="notes" label="Notes" />
          </Panel>
        </div>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <Panel title="Pipeline control" subtitle="These are the core synced fields used by the Revenue module.">
            <div style={{ display: 'grid', gap: 14 }}>
              <Select name="status" label="Status" options={[
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'proposal', label: 'Proposal / Offer needed' },
                { value: 'won', label: 'Won' },
                { value: 'lost', label: 'Lost' },
              ]} />

              <Select name="priority" label="Priority" options={[
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]} />

              <Field name="source" label="Source" />
              <Field name="channel" label="Channel" />
              <Field name="assigned_to" label="Assigned user UUID" />
            </div>
          </Panel>

          <Panel title="Next execution" subtitle="Captured inside notes to avoid schema changes.">
            <div style={{ display: 'grid', gap: 14 }}>
              <Select name="next_action" label="Next action" options={[
                { value: '', label: 'Select action' },
                { value: 'call_back', label: 'Call back' },
                { value: 'send_whatsapp', label: 'Send WhatsApp' },
                { value: 'send_brochure', label: 'Send brochure' },
                { value: 'book_meeting', label: 'Book meeting' },
                { value: 'prepare_offer', label: 'Prepare offer' },
                { value: 'manager_review', label: 'Manager review' },
              ]} />
              <Field name="next_follow_up" label="Next follow-up date" type="datetime-local" />
            </div>
          </Panel>

          <Panel title="Create record" subtitle="No schema change. No route change. Existing sync preserved.">
            <button
              type="submit"
              style={{
                border: 'none',
                borderRadius: 14,
                background: '#0f172a',
                color: '#fff',
                padding: 14,
                fontWeight: 900,
                width: '100%',
                cursor: 'pointer',
              }}
            >
              Create prospect
            </button>
          </Panel>
        </div>
      </form>
    </AppShell>
  )
}
