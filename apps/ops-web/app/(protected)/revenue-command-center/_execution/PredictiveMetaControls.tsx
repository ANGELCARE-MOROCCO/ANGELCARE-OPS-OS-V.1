import { setRevenueTarget, createRevenueAction, updateCampaignBrief } from './predictiveMetaActions'

async function setRevenueTargetFormAction(formData: FormData) {
  'use server'
  await setRevenueTarget(formData)
}

async function createRevenueActionFormAction(formData: FormData) {
  'use server'
  await createRevenueAction(formData)
}

async function updateCampaignBriefFormAction(formData: FormData) {
  'use server'
  await updateCampaignBrief(formData)
}

export function PredictiveControls(){
  return (
    <section style={{display:'grid',gap:12,padding:16,border:'1px solid #e2e8f0',borderRadius:16}}>
      <strong>Revenue Target</strong>
      <form action={setRevenueTargetFormAction} style={{display:'grid',gap:6}}>
        <input name="target_revenue" placeholder="Target revenue"/>
        <input name="target_leads" placeholder="Target leads"/>
        <button>Set Target</button>
      </form>

      <strong>Action Plan</strong>
      <form action={createRevenueActionFormAction} style={{display:'grid',gap:6}}>
        <input name="action" placeholder="What must happen today"/>
        <select name="priority" defaultValue="high">
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <button>Add Action</button>
      </form>
    </section>
  )
}

type CampaignMetaRecord = {
  id?: string | null
  name?: string | null
  briefing?: string | null
  sales_script?: string | null
  quality_feedback?: string | null
}

export function CampaignExecutionPanel({ c }: { c: CampaignMetaRecord }){
  return (
    <section style={{display:'grid',gap:8,padding:12,border:'1px solid #e2e8f0',borderRadius:14}}>
      <strong>{c.name ?? "Campaign"}</strong>
      <form action={updateCampaignBriefFormAction} style={{display:'grid',gap:6}}>
        <input type="hidden" name="id" value={c.id ?? ""}/>
        <textarea name="briefing" defaultValue={c.briefing ?? ""} placeholder="Agent briefing"/>
        <textarea name="sales_script" defaultValue={c.sales_script ?? ""} placeholder="Sales script"/>
        <textarea name="quality_feedback" defaultValue={c.quality_feedback ?? ""} placeholder="Lead quality feedback"/>
        <button>Update</button>
      </form>
    </section>
  )
}