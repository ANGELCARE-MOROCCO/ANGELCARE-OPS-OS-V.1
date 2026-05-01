import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { CampaignCard, EmptyState, Kpi, Panel, formatCurrency } from '../_components/MetaReadinessPrimitives'
import { computeCampaignMetrics, sourceLabel } from '@/lib/metaAdsReadinessEngine'
import { attributeProspect, createAdCampaign, createAdCreative, updateCampaignMetrics } from './actions'

export default async function MetaReadinessPage() {
  const supabase = await createClient()

  const [{ data: campaignsRaw }, { data: prospectsRaw }, { data: creativesRaw }] = await Promise.all([
    supabase.from('bd_ad_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_prospects').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_ad_creatives').select('*').order('created_at', { ascending: false }),
  ])

  const campaigns = campaignsRaw || []
  const prospects = prospectsRaw || []
  const creatives = creativesRaw || []

  const attributed = prospects.filter((p: any) => p.source_platform || p.campaign_id)
  const unattributed = prospects.filter((p: any) => !p.source_platform && !p.campaign_id)
  const totalSpend = campaigns.reduce((sum: number, c: any) => sum + Number(c.spend || 0), 0)
  const totalLeads = campaigns.reduce((sum: number, c: any) => sum + Number(c.leads || 0), 0)
  const influenced = attributed.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)

  return (
    <AppShell
      title="Meta / Ads Readiness Layer"
      subtitle="Tier 2 marketing-to-sales bridge: attribution, campaign tracking, creative library, and lead source quality."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Meta Readiness' }]}
      actions={<><PageAction href="/revenue-command-center/prospects" variant="light">Prospects</PageAction><PageAction href="/revenue-command-center/control-tower">Control Tower</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>TIER 2 — META / ADS READINESS</div>
            <h1 style={heroTitleStyle}>Prepare the revenue system for Meta Business intelligence.</h1>
            <p style={heroTextStyle}>Track campaign influence, lead source, creative angles, and sales-readiness before direct Meta API integration.</p>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Campaigns" value={campaigns.length} sub="tracked" tone="#2563eb" />
          <Kpi title="Creatives" value={creatives.length} sub="scripts / angles" tone="#7c3aed" />
          <Kpi title="Attributed Leads" value={attributed.length} sub="source known" tone="#16a34a" />
          <Kpi title="Unattributed" value={unattributed.length} sub="missing source" tone="#dc2626" />
          <Kpi title="Spend" value={formatCurrency(totalSpend)} sub="manual / imported" tone="#d97706" />
          <Kpi title="Influenced" value={formatCurrency(influenced)} sub="pipeline value" tone="#0f172a" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '.85fr 1.15fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Create Campaign" subtitle="Create Meta campaign placeholder before API sync.">
            <form action={createAdCampaign} style={formStyle}>
              <input name="name" required placeholder="Campaign name" style={inputStyle} />
              <input name="objective" placeholder="Objective: leads / awareness / conversion..." style={inputStyle} />
              <input name="budget" type="number" placeholder="Budget" style={inputStyle} />
              <button type="submit" style={buttonStyle}>Create Campaign</button>
            </form>
          </Panel>

          <Panel title="Campaign Performance" subtitle="Manual metrics now; Meta API sync later.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              {campaigns.length ? campaigns.map((campaign: any) => {
                const linked = prospects.filter((p: any) => p.campaign_id === campaign.id)
                const metrics = computeCampaignMetrics(campaign, linked)
                return (
                  <CampaignCard key={campaign.id} campaign={campaign} metrics={metrics}>
                    <form action={updateCampaignMetrics} style={metricFormStyle}>
                      <input type="hidden" name="id" value={campaign.id} />
                      <input name="spend" type="number" placeholder="Spend" style={smallInputStyle} />
                      <input name="impressions" type="number" placeholder="Impressions" style={smallInputStyle} />
                      <input name="clicks" type="number" placeholder="Clicks" style={smallInputStyle} />
                      <input name="leads" type="number" placeholder="Leads" style={smallInputStyle} />
                      <select name="status" defaultValue={campaign.status || 'active'} style={smallInputStyle}>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button type="submit" style={smallButtonStyle}>Update</button>
                    </form>
                  </CampaignCard>
                )
              }) : <EmptyState title="No campaigns" text="Create your first campaign placeholder." />}
            </div>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Creative Library" subtitle="Turn marketing angles into sales-ready scripts.">
            <form action={createAdCreative} style={formStyle}>
              <select name="campaign_id" required style={inputStyle}>
                <option value="">Select campaign</option>
                {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input name="name" required placeholder="Creative name" style={inputStyle} />
              <input name="angle" placeholder="Angle: trust / urgency / premium care..." style={inputStyle} />
              <input name="offer" placeholder="Offer" style={inputStyle} />
              <input name="audience" placeholder="Audience" style={inputStyle} />
              <textarea name="primary_text" rows={3} placeholder="Primary text / script" style={inputStyle} />
              <input name="headline" placeholder="Headline" style={inputStyle} />
              <input name="call_to_action" placeholder="CTA" style={inputStyle} />
              <button type="submit" style={buttonStyle}>Add Creative</button>
            </form>

            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {creatives.slice(0, 8).map((creative: any) => (
                <article key={creative.id} style={miniCardStyle}>
                  <strong>{creative.name}</strong>
                  <span>{creative.angle || 'No angle'} • {creative.audience || 'No audience'}</span>
                  <p>{creative.primary_text || 'No script.'}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Lead Attribution Repair" subtitle="Assign unattributed prospects to a source/campaign.">
            <div style={{ display: 'grid', gap: 10 }}>
              {unattributed.slice(0, 10).map((p: any) => (
                <form key={p.id} action={attributeProspect} style={repairCardStyle}>
                  <input type="hidden" name="prospect_id" value={p.id} />
                  <strong>{p.name || 'Unnamed prospect'}</strong>
                  <span>{sourceLabel(p)} • {formatCurrency(p.estimated_value)}</span>
                  <select name="campaign_id" style={inputStyle}>
                    <option value="">No campaign</option>
                    {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select name="source_channel" defaultValue="lead_form" style={inputStyle}>
                    <option value="lead_form">Lead Form</option>
                    <option value="messenger">Messenger</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="landing_page">Landing Page</option>
                    <option value="manual">Manual</option>
                  </select>
                  <select name="lead_quality" defaultValue="unknown" style={inputStyle}>
                    <option value="unknown">Unknown</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="premium">Premium</option>
                  </select>
                  <button type="submit" style={buttonStyle}>Attribute</button>
                </form>
              ))}
              {!unattributed.length ? <EmptyState title="Attribution clean" text="All prospects have a source or campaign." /> : null}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#1877f2,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 750, maxWidth: 820, lineHeight: 1.6 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '12px 14px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const metricFormStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }
const smallInputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 9, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 750 }
const smallButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 10, padding: '9px 11px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const miniCardStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const repairCardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
