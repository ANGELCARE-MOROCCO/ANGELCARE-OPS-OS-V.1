import { setRevenueTarget, createRevenueAction, updateCampaignBrief } from './predictiveMetaActions'

export function PredictiveControls(){
  return (
    <section style={{display:'grid',gap:12,padding:16,border:'1px solid #e2e8f0',borderRadius:16}}>
      <strong>Revenue Target</strong>
      <form action={setRevenueTarget} style={{display:'grid',gap:6}}>
        <input name="target_revenue" placeholder="Target revenue"/>
        <input name="target_leads" placeholder="Target leads"/>
        <button>Set Target</button>
      </form>

      <strong>Action Plan</strong>
      <form action={createRevenueAction} style={{display:'grid',gap:6}}>
        <input name="action" placeholder="What must happen today"/>
        <select name="priority">
          <option>high</option>
          <option>critical</option>
        </select>
        <button>Add Action</button>
      </form>
    </section>
  )
}

export function CampaignExecutionPanel({c}:{c:any}){
  return (
    <section style={{display:'grid',gap:8,padding:12,border:'1px solid #e2e8f0',borderRadius:14}}>
      <strong>{c.name}</strong>
      <form action={updateCampaignBrief} style={{display:'grid',gap:6}}>
        <input type="hidden" name="id" value={c.id}/>
        <textarea name="briefing" defaultValue={c.briefing} placeholder="Agent briefing"/>
        <textarea name="sales_script" defaultValue={c.sales_script} placeholder="Sales script"/>
        <textarea name="quality_feedback" defaultValue={c.quality_feedback} placeholder="Lead quality feedback"/>
        <button>Update</button>
      </form>
    </section>
  )
}
