import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'
import { decideRevenueAction } from '@/lib/ac-whatsapp/revenue-intelligence/doctrine-engine'
import { inferCustomerType, inferServiceLine } from '@/lib/ac-whatsapp/revenue-intelligence/scoring'
import { loadDoctrinePacks } from '@/lib/ac-whatsapp/revenue-intelligence/repository'

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const context=await acContext(request,'ac-whatsapp.campaign.manage');if('error'in context)return context.error
  const {id}=await params
  const body=await request.json().catch(()=>({}))
  const campaign=await context.supabase.from('ac_whatsapp_campaigns').select('*').eq('id',id).maybeSingle()
  if(campaign.error)return fail(campaign.error.message,500)
  if(!campaign.data)return fail('CAMPAIGN_NOT_FOUND',404)
  const packId=String(body.doctrine_pack_id||campaign.data.automation_doctrine_pack_id||'')||null
  const packs=await loadDoctrinePacks(context.supabase,packId)
  if(!packs.length)return fail('NO_ACTIVE_DOCTRINE_PACK_FOR_CAMPAIGN',409)
  const recipients=await context.supabase.from('ac_whatsapp_campaign_recipients').select('id,contact_id,status,variables,contact:ac_whatsapp_contacts(*)').eq('campaign_id',id).in('status',['pending','failed']).limit(Math.max(1,Math.min(500,Number(body.limit||500))))
  if(recipients.error)return fail(recipients.error.message,500)
  if(!recipients.data?.length)return fail('NO_ELIGIBLE_RECIPIENTS',409)
  let composed=0,review=0
  const samples:any[]=[]
  for(const row of recipients.data as any[]){
    const contact=row.contact
    if(!contact?.whatsapp_id)continue
    const source=`outbound campaign ${campaign.data.name||id} ${campaign.data.objective||''}`
    const customerType=inferCustomerType(contact,source,source)
    const serviceLine=inferServiceLine(contact,source,source)
    const synthetic:any={
      conversation:{id:`prospecting:${row.id}`,message_count:0,last_message_preview:source,metadata:{lead_source:'outbound_campaign',campaign_id:id}},
      contact,account:null,messages:[],latestInboundText:source,customerType,serviceLine,source,
      journeyStage:'aware',intentFamily:'outbound_prospecting',relationshipTemperature:'cold',momentum:'stalled',
      emotionalSignals:{urgency:.15,priceSensitivity:.1,frustration:0,enthusiasm:.1,hesitation:.2,trustSeeking:.2},
      scores:{buyingIntent:.2,authority:String(contact.organization_name||'').length>0 ? .55:.35,urgency:.15,objection:.1,engagement:.1,conversion:.18,commercialPotential:customerType==='b2b'?.68:.38,risk:.08},
      opportunity:{customerType,serviceLine,journeyStage:'aware',intentFamily:'outbound_prospecting'},
      memory:{knownName:contact.display_name||null,organization:contact.organization_name||null,city:contact.city||null,tags:contact.tags||[],messageCount:0},
    }
    const decision=decideRevenueAction({packs,context:synthetic,commercialIntensityCap:Number(body.commercial_intensity_cap||3)})
    if(!decision.responseText||decision.confidence<Number(body.min_confidence||.48)){review++;samples.push({recipient_id:row.id,status:'review',confidence:decision.confidence,reasoning:decision.reasoning});continue}
    const update=await context.supabase.from('ac_whatsapp_campaign_recipients').update({rendered_body:decision.responseText,variables:{...(row.variables||{}),revenue_intelligence:{pack_id:decision.packId,node_ids:decision.doctrineNodeIds,confidence:decision.confidence,goal:decision.goal}}}).eq('id',row.id)
    if(update.error)return fail(update.error.message,500)
    composed++
    if(samples.length<10)samples.push({recipient_id:row.id,status:'ready',confidence:decision.confidence,goal:decision.goal,body:decision.responseText})
  }
  await audit(context,{action:'revenue.campaign.compose_outbound',entityType:'campaign',entityId:id,newState:{packId,composed,review,total:recipients.data.length},reason:String(body.reason||'Doctrine-driven outbound prospecting preparation')})
  return ok({campaign_id:id,pack_id:packId,total:recipients.data.length,composed,review,ready:composed>0,samples})
}
