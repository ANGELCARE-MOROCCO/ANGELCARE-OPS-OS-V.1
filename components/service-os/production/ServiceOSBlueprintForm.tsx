import { saveServiceOSBlueprint } from '@/lib/service-os/production/actions'
import type { ServiceOSBlueprint } from '@/lib/service-os/production/types'

const inputStyle = { width:'100%', border:'1px solid #dbe3ef', borderRadius:14, padding:'12px 14px', background:'#fff', color:'#0f172a' }
const labelStyle = { display:'grid', gap:6, fontSize:13, color:'#334155', fontWeight:700 }

export function ServiceOSBlueprintForm({ blueprint }: { blueprint?: Partial<ServiceOSBlueprint> }) {
  return (
    <form action={saveServiceOSBlueprint} style={{display:'grid',gap:16}}>
      <input type="hidden" name="id" defaultValue={blueprint?.id || ''} />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
        <label style={labelStyle}>Code<input name="code" required defaultValue={blueprint?.code || ''} style={inputStyle}/></label>
        <label style={labelStyle}>Titre<input name="title" required defaultValue={blueprint?.title || ''} style={inputStyle}/></label>
        <label style={labelStyle}>Famille<select name="family" defaultValue={blueprint?.family || 'home_care'} style={inputStyle as any}><option value="home_care">Home care</option><option value="special_needs">Special needs</option><option value="school_support">School support</option><option value="postpartum">Postpartum</option><option value="events">Events</option><option value="education_ludique">Education ludique</option><option value="corporate_institutional">Corporate</option></select></label>
        <label style={labelStyle}>Statut<select name="status" defaultValue={blueprint?.status || 'draft'} style={inputStyle as any}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="retired">Retired</option></select></label>
      </div>
      <label style={labelStyle}>Titre commercial<input name="commercialTitle" defaultValue={blueprint?.commercialTitle || ''} style={inputStyle}/></label>
      <label style={labelStyle}>Description<textarea name="description" defaultValue={blueprint?.description || ''} rows={4} style={inputStyle}/></label>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
        <label style={labelStyle}>Modules codes CSV<input name="modules" defaultValue={(blueprint?.modules || []).join(', ')} style={inputStyle}/></label>
        <label style={labelStyle}>Rules codes CSV<input name="rules" defaultValue={(blueprint?.rules || []).join(', ')} style={inputStyle}/></label>
        <label style={labelStyle}>Villes CSV<input name="cities" defaultValue={(blueprint?.cities || []).join(', ')} style={inputStyle}/></label>
        <label style={labelStyle}>Clients cibles CSV<input name="targetClients" defaultValue={(blueprint?.targetClients || []).join(', ')} style={inputStyle}/></label>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
        <label style={labelStyle}>Prix base MAD<input name="basePriceMad" type="number" defaultValue={blueprint?.basePriceMad || 0} style={inputStyle}/></label>
        <label style={labelStyle}>Marge cible %<input name="marginTargetPct" type="number" defaultValue={blueprint?.marginTargetPct || 35} style={inputStyle}/></label>
        <label style={labelStyle}>SLA minutes<input name="defaultSlaMinutes" type="number" defaultValue={blueprint?.defaultSlaMinutes || 120} style={inputStyle}/></label>
        <label style={labelStyle}>Horizon<select name="createdForHorizon" defaultValue={blueprint?.createdForHorizon || 'now'} style={inputStyle as any}><option value="now">Now</option><option value="12_months">12 months</option><option value="3_years">3 years</option><option value="10_years">10 years</option></select></label>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
        <label style={labelStyle}>Rôles staff CSV<input name="staffRoles" defaultValue={(blueprint?.staffRoles || []).join(', ')} style={inputStyle}/></label>
        <label style={labelStyle}>Documents requis CSV<input name="requiredDocuments" defaultValue={(blueprint?.requiredDocuments || []).join(', ')} style={inputStyle}/></label>
        <label style={labelStyle}>Workflow template<input name="workflowTemplate" defaultValue={blueprint?.workflowTemplate || 'standard'} style={inputStyle}/></label>
        <label style={labelStyle}>AI tags CSV<input name="aiTags" defaultValue={(blueprint?.aiTags || []).join(', ')} style={inputStyle}/></label>
      </div>
      <div style={{display:'flex',gap:18,flexWrap:'wrap'}}>
        <label><input type="checkbox" name="subscriptionEligible" defaultChecked={!!blueprint?.subscriptionEligible}/> Subscription eligible</label>
        <label><input type="checkbox" name="institutionalEligible" defaultChecked={!!blueprint?.institutionalEligible}/> Institutional eligible</label>
      </div>
      <button style={{border:0,borderRadius:16,padding:'14px 18px',background:'#0f172a',color:'#fff',fontWeight:800}}>Sauvegarder Blueprint</button>
    </form>
  )
}
