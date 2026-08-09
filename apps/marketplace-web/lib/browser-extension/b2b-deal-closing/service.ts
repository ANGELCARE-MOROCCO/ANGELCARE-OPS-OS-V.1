import { assertTerritory, filterByOwnership } from '../b2b-intelligence/scope'
import { cleanText } from '../b2b-intelligence/normalize'
import { B2B_DEAL_COMMAND_MAP } from './contract'

function now(){return new Date().toISOString()}
function error(message:string,status=400,details?:unknown){return Object.assign(new Error(message),{status,details})}
function dbError(prefix:string,e:any){console.error(`[${prefix}]`,e);throw error(prefix,500,{message:e?.message,code:e?.code})}
function text(value:unknown,max=8000){return cleanText(value,max)||null}
function number(value:unknown,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function bool(value:unknown){return value===true||value==='true'||value===1||value==='1'}
function canApprove(access:any,permission:string){
  const row=(access.capabilities||[]).find((item:any)=>item.capability_key===permission)
  return ['APPROVE','ADMINISTER'].includes(String(row?.access_level||'').toUpperCase())
}
function scopeRecord(access:any){return Object.fromEntries((access.scopes||[]).map((row:any)=>[row.scope_key,row.scope_value])) as Record<string,unknown>}

async function loadOpportunity(db:any,actor:any,access:any,id:string){
  const {data,error:e}=await db.from('browser_extension_b2b_opportunities').select('*').eq('id',id).maybeSingle()
  if(e)dbError('B2B_DEAL_OPPORTUNITY_LOAD_FAILED',e)
  if(!data)throw error('OPPORTUNITY_NOT_FOUND',404)
  const {data:prospect,error:pError}=await db.from('b2b_prospects').select('*').eq('id',data.prospect_id).maybeSingle()
  if(pError)dbError('B2B_DEAL_PROSPECT_LOAD_FAILED',pError)
  if(!prospect)throw error('PROSPECT_NOT_FOUND',404)
  assertTerritory(scopeRecord(access),prospect.city)
  if(!filterByOwnership([prospect],actor.id,scopeRecord(access)).length)throw error('ACCOUNT_SCOPE_DENIED',403)
  return {opportunity:data,prospect}
}

async function timeline(db:any,actor:any,input:{prospectId?:string|null;opportunityId?:string|null;type:string;title:string;description?:string|null;outcome?:string|null;metadata?:any}){
  await db.from('browser_extension_b2b_timeline_events').insert({prospect_id:input.prospectId||null,opportunity_id:input.opportunityId||null,user_id:actor.id,event_type:input.type,title:input.title,description:input.description||null,outcome:input.outcome||null,metadata:input.metadata||{},occurred_at:now()})
}

function calculate(payload:any){
  const lineItems=Array.isArray(payload.lineItems)?payload.lineItems:[]
  const revenue=lineItems.reduce((sum:number,row:any)=>sum+number(row.quantity,1)*number(row.unitPrice),0) || number(payload.quotedRevenue)
  const staffing=number(payload.staffingCost)
  const transport=number(payload.transportCost)
  const materials=number(payload.materialsCost)
  const training=number(payload.trainingCost)
  const overhead=number(payload.overheadCost)
  const commissions=number(payload.commissions)
  const contingency=number(payload.contingency)
  const discountPercent=Math.max(0,Math.min(100,number(payload.discountPercent)))
  const discountAmount=revenue*(discountPercent/100)
  const netRevenue=Math.max(0,revenue-discountAmount)
  const deliveryCost=staffing+transport+materials+training+overhead+commissions+contingency
  const contribution=netRevenue-deliveryCost
  const marginPercent=netRevenue>0?(contribution/netRevenue)*100:0
  return {revenue,discountPercent,discountAmount,netRevenue,staffing,transport,materials,training,overhead,commissions,contingency,deliveryCost,contribution,marginPercent:Number(marginPercent.toFixed(2)),lineItems}
}

function marginStatus(margin:number,policy:any){
  const healthy=number(policy?.healthy_margin,35)
  const manager=number(policy?.manager_approval_margin,25)
  const executive=number(policy?.executive_approval_margin,15)
  if(margin>=healthy)return {status:'healthy',approvalRole:null,blocked:false}
  if(margin>=manager)return {status:'review',approvalRole:'sales_manager',blocked:false}
  if(margin>=executive)return {status:'approval_required',approvalRole:'managing_director',blocked:false}
  if(margin>0)return {status:'critical',approvalRole:'managing_director',blocked:true}
  return {status:'blocked',approvalRole:'managing_director',blocked:true}
}

async function policy(db:any){
  const {data}=await db.from('browser_extension_b2b_margin_policies').select('*').eq('active',true).order('created_at',{ascending:false}).limit(1).maybeSingle()
  return data||{healthy_margin:35,manager_approval_margin:25,executive_approval_margin:15,blocked_below_margin:15}
}

async function latestProposal(db:any,opportunityId:string){
  const {data,error:e}=await db.from('browser_extension_b2b_proposal_versions').select('*').eq('opportunity_id',opportunityId).order('version_number',{ascending:false}).limit(1).maybeSingle()
  if(e)dbError('B2B_PROPOSAL_LOAD_FAILED',e)
  return data
}

async function latestPricing(db:any,opportunityId:string){
  const {data,error:e}=await db.from('browser_extension_b2b_pricing_calculations').select('*').eq('opportunity_id',opportunityId).order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(e)dbError('B2B_PRICING_LOAD_FAILED',e)
  return data
}

async function readiness(db:any,actor:any,access:any,opportunityId:string,payload:any={}){
  const {opportunity,prospect}=await loadOpportunity(db,actor,access,opportunityId)
  const proposal=await latestProposal(db,opportunityId)
  const pricing=await latestPricing(db,opportunityId)
  const {data:contracts}=await db.from('browser_extension_b2b_contract_requirements').select('*').eq('opportunity_id',opportunityId)
  const {data:payments}=await db.from('browser_extension_b2b_payment_gates').select('*').eq('opportunity_id',opportunityId)
  const checks={
    needConfirmed:Boolean(opportunity.need_confirmed),
    scopeConfirmed:Boolean(opportunity.scope_summary||payload.scopeConfirmed),
    decisionMakerEngaged:Boolean(payload.decisionMakerEngaged||opportunity.decision_process),
    financialApproverEngaged:Boolean(payload.financialApproverEngaged),
    proposalApproved:Boolean(proposal&&['approved','delivered','accepted'].includes(proposal.status)),
    priceAccepted:Boolean(payload.priceAccepted||proposal?.client_acceptance_at),
    paymentTermsAccepted:Boolean(payload.paymentTermsAccepted),
    implementationFeasible:Boolean(payload.implementationFeasible||opportunity.activation_readiness==='ready'),
    contractComplete:Boolean((contracts||[]).length>0&&(contracts||[]).every((row:any)=>row.status==='complete')),
    paymentVerified:Boolean((payments||[]).some((row:any)=>row.status==='verified')),
  }
  const weights:any={needConfirmed:12,scopeConfirmed:10,decisionMakerEngaged:10,financialApproverEngaged:8,proposalApproved:12,priceAccepted:12,paymentTermsAccepted:8,implementationFeasible:10,contractComplete:10,paymentVerified:8}
  const score=Object.entries(checks).reduce((sum,[key,value])=>sum+(value?weights[key]:0),0)
  const missing=Object.entries(checks).filter(([,value])=>!value).map(([key])=>key)
  const {data,error:e}=await db.from('browser_extension_b2b_closing_readiness_snapshots').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,user_id:actor.id,score,checks,missing,status:score>=90?'ready':score>=70?'conditional':'not_ready'}).select('*').single()
  if(e)dbError('B2B_CLOSING_READINESS_SAVE_FAILED',e)
  return {readiness:data,opportunity,prospect,proposal,pricing,checks,missing}
}

export async function executeB2BDealCommand(input:{db:any;actor:any;device:any;access:any;commandKey:string;payload:any}){
  const {db,actor,access,commandKey}=input; const payload=input.payload||{}
  if(!B2B_DEAL_COMMAND_MAP.has(commandKey))throw error('UNREGISTERED_B2B_DEAL_COMMAND',400)
  const opportunityId=text(payload.opportunityId,100)

  switch(commandKey){
    case 'b2b.pricing.model_recommend': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId))
      const vertical=String(prospect.sector||prospect.vertical||'general').toLowerCase()
      const models=vertical.includes('hotel')||vertical.includes('hospital')?['retainer_plus_usage','per_booking','annual_multi_site']:vertical.includes('school')||vertical.includes('education')?['fixed_pilot','monthly_retainer','per_child_session']:vertical.includes('corporate')?['annual_subscription','retainer_plus_usage','volume_package']:['fixed_pilot','monthly_retainer','per_service']
      return {opportunity,prospect,recommendedPricingModel:models[0],alternatives:models.slice(1),reasoning:['Usage predictability','Operational burden','Expansion potential','Payment-risk control']}
    }
    case 'b2b.offer.configure': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId))
      const row={prospect_id:prospect.id,opportunity_id:opportunity.id,user_id:actor.id,service_line:text(payload.serviceLine,240)||'AngelCare B2B Partnership',partner_program:text(payload.partnerProgram,240),locations:payload.locations||[],population_volume:number(payload.populationVolume),frequency:text(payload.frequency,160),service_hours:text(payload.serviceHours,500),staffing_requirements:payload.staffingRequirements||{},materials_requirements:payload.materialsRequirements||{},client_responsibilities:payload.clientResponsibilities||[],angelcare_responsibilities:payload.angelcareResponsibilities||[],optional_services:payload.optionalServices||[],exclusions:payload.exclusions||[],deployment_mode:text(payload.deploymentMode,80)||'pilot',contract_months:number(payload.contractMonths,12),launch_at:payload.launchAt||null,billing_frequency:text(payload.billingFrequency,80)||'monthly',status:'configured',created_by:actor.id,updated_by:actor.id}
      const {data,error:e}=await db.from('browser_extension_b2b_offer_configurations').insert(row).select('*').single(); if(e)dbError('B2B_OFFER_CONFIGURE_FAILED',e)
      await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,type:'offer_configured',title:'Offre configurée',description:row.service_line,metadata:{offerConfigurationId:data.id}})
      return {offerConfiguration:data,opportunity,prospect}
    }
    case 'b2b.pricing.calculate': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const calc=calculate(payload); const p=await policy(db); const guard=marginStatus(calc.marginPercent,p)
      const {data,error:e}=await db.from('browser_extension_b2b_pricing_calculations').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,user_id:actor.id,pricing_model:text(payload.pricingModel,100)||'fixed_pilot',currency:'Dh',quoted_revenue:calc.revenue,discount_percent:calc.discountPercent,discount_amount:calc.discountAmount,net_revenue:calc.netRevenue,direct_staffing_cost:calc.staffing,transport_cost:calc.transport,materials_cost:calc.materials,training_cost:calc.training,overhead_cost:calc.overhead,commissions_cost:calc.commissions,contingency_cost:calc.contingency,delivery_cost:calc.deliveryCost,gross_contribution:calc.contribution,gross_margin_percent:calc.marginPercent,margin_status:guard.status,approval_role:guard.approvalRole,assumptions:payload.assumptions||{},line_items:calc.lineItems,created_by:actor.id}).select('*').single(); if(e)dbError('B2B_PRICING_CALCULATE_FAILED',e)
      return {pricing:data,marginGuard:guard,policy:p,opportunity,prospect}
    }
    case 'b2b.margin.evaluate': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const pricing=payload.pricingId?(await db.from('browser_extension_b2b_pricing_calculations').select('*').eq('id',payload.pricingId).single()).data:await latestPricing(db,opportunity.id); if(!pricing)throw error('PRICING_REQUIRED',409)
      const p=await policy(db); const guard=marginStatus(number(pricing.gross_margin_percent),p)
      const {data,error:e}=await db.from('browser_extension_b2b_margin_snapshots').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,pricing_calculation_id:pricing.id,user_id:actor.id,margin_percent:pricing.gross_margin_percent,status:guard.status,approval_role:guard.approvalRole,blocked:guard.blocked,policy_snapshot:p}).select('*').single(); if(e)dbError('B2B_MARGIN_EVALUATE_FAILED',e)
      return {marginSnapshot:data,marginGuard:guard,pricing,policy:p}
    }
    case 'b2b.proposal.create': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const pricing=payload.pricingId?(await db.from('browser_extension_b2b_pricing_calculations').select('*').eq('id',payload.pricingId).single()).data:await latestPricing(db,opportunity.id); if(!pricing)throw error('PRICING_REQUIRED',409)
      const offer=payload.offerConfigurationId?(await db.from('browser_extension_b2b_offer_configurations').select('*').eq('id',payload.offerConfigurationId).single()).data:null
      const latest=await latestProposal(db,opportunity.id); const version=(latest?.version_number||0)+1
      const status=pricing.margin_status==='healthy'?'draft':'approval_required'
      const {data,error:e}=await db.from('browser_extension_b2b_proposal_versions').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,offer_configuration_id:offer?.id||null,pricing_calculation_id:pricing.id,version_number:version,title:text(payload.title,300)||`${prospect.name} — Proposition AngelCare`,proposal_type:text(payload.proposalType,100)||'partnership',client_context:text(payload.clientContext),confirmed_need:text(payload.confirmedNeed)||opportunity.scope_summary,solution_summary:text(payload.solutionSummary),scope:payload.scope||{},operating_model:payload.operatingModel||{},responsibilities:payload.responsibilities||{},implementation_timeline:payload.implementationTimeline||{},kpis:payload.kpis||[],risk_controls:payload.riskControls||[],exclusions:payload.exclusions||offer?.exclusions||[],valid_until:payload.validUntil||null,commercial_value:pricing.net_revenue,gross_margin_percent:pricing.gross_margin_percent,status,created_by:actor.id}).select('*').single(); if(e)dbError('B2B_PROPOSAL_CREATE_FAILED',e)
      if(Array.isArray(payload.lineItems)&&payload.lineItems.length){const rows=payload.lineItems.map((item:any,index:number)=>({proposal_id:data.id,line_order:index+1,label:text(item.label,300)||`Ligne ${index+1}`,description:text(item.description),quantity:number(item.quantity,1),unit_price:number(item.unitPrice),total:number(item.quantity,1)*number(item.unitPrice),metadata:item.metadata||{}})); const {error:lErr}=await db.from('browser_extension_b2b_proposal_line_items').insert(rows); if(lErr)dbError('B2B_PROPOSAL_LINES_FAILED',lErr)}
      await db.from('browser_extension_b2b_opportunities').update({stage:'proposal_preparation',stage_order:90,updated_by:actor.id,updated_at:now()}).eq('id',opportunity.id)
      await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,type:'proposal_created',title:`Proposition V${version} créée`,description:data.title,metadata:{proposalId:data.id,margin:pricing.gross_margin_percent}})
      return {proposal:data,pricing,offerConfiguration:offer,opportunity:{...opportunity,stage:'proposal_preparation'},prospect}
    }
    case 'b2b.proposal.update': {
      if(!payload.proposalId)throw error('PROPOSAL_ID_REQUIRED'); const changes:any={updated_at:now(),updated_by:actor.id}; for(const key of ['title','client_context','confirmed_need','solution_summary','scope','operating_model','responsibilities','implementation_timeline','kpis','risk_controls','exclusions','valid_until'])if(payload[key]!==undefined)changes[key]=payload[key]
      const {data,error:e}=await db.from('browser_extension_b2b_proposal_versions').update(changes).eq('id',payload.proposalId).select('*').single(); if(e)dbError('B2B_PROPOSAL_UPDATE_FAILED',e); return {proposal:data}
    }
    case 'b2b.proposal.version_create': {
      if(!payload.proposalId)throw error('PROPOSAL_ID_REQUIRED'); const {data:source,error:sErr}=await db.from('browser_extension_b2b_proposal_versions').select('*').eq('id',payload.proposalId).single(); if(sErr)dbError('B2B_PROPOSAL_SOURCE_LOAD_FAILED',sErr)
      await loadOpportunity(db,actor,access,source.opportunity_id); const latest=await latestProposal(db,source.opportunity_id); const copy={...source}; delete copy.id; delete copy.created_at; delete copy.updated_at; copy.version_number=(latest?.version_number||source.version_number)+1; copy.parent_proposal_id=source.id; copy.status='draft'; copy.change_summary=text(payload.changeSummary)||'Nouvelle version contrôlée'; copy.created_by=actor.id; copy.updated_by=actor.id
      const {data,error:e}=await db.from('browser_extension_b2b_proposal_versions').insert(copy).select('*').single(); if(e)dbError('B2B_PROPOSAL_VERSION_FAILED',e); await db.from('browser_extension_b2b_proposal_versions').update({status:'superseded',superseded_by:data.id}).eq('id',source.id); return {proposal:data,previousProposal:source}
    }
    case 'b2b.proposal.submit_approval': {
      if(!payload.proposalId)throw error('PROPOSAL_ID_REQUIRED'); const {data:proposal}=await db.from('browser_extension_b2b_proposal_versions').select('*').eq('id',payload.proposalId).single(); await loadOpportunity(db,actor,access,proposal.opportunity_id)
      const {data,error:e}=await db.from('browser_extension_b2b_approval_requests').insert({prospect_id:proposal.prospect_id,opportunity_id:proposal.opportunity_id,proposal_id:proposal.id,request_type:'proposal',requested_by:actor.id,requested_approver_role:text(payload.approverRole,100)||'sales_manager',reason:text(payload.reason),status:'submitted'}).select('*').single(); if(e)dbError('B2B_PROPOSAL_APPROVAL_SUBMIT_FAILED',e); await db.from('browser_extension_b2b_proposal_versions').update({status:'under_review',updated_at:now()}).eq('id',proposal.id); return {approvalRequest:data,proposal:{...proposal,status:'under_review'}}
    }
    case 'b2b.proposal.approve': case 'b2b.proposal.reject': {
      if(!canApprove(access,'extension.b2b.proposal_studio'))throw error('APPROVAL_ACCESS_LEVEL_REQUIRED',403)
      if(!payload.approvalRequestId)throw error('APPROVAL_REQUEST_ID_REQUIRED'); const {data:reqRow}=await db.from('browser_extension_b2b_approval_requests').select('*').eq('id',payload.approvalRequestId).single(); if(!reqRow)throw error('APPROVAL_REQUEST_NOT_FOUND',404); await loadOpportunity(db,actor,access,reqRow.opportunity_id)
      const decision=commandKey.endsWith('approve')?'approved':'rejected'; const {data,error:e}=await db.from('browser_extension_b2b_approval_decisions').insert({approval_request_id:reqRow.id,decision,decided_by:actor.id,notes:text(payload.notes),evidence:payload.evidence||{}}).select('*').single(); if(e)dbError('B2B_PROPOSAL_APPROVAL_DECISION_FAILED',e); await db.from('browser_extension_b2b_approval_requests').update({status:decision,decided_at:now()}).eq('id',reqRow.id); if(reqRow.proposal_id)await db.from('browser_extension_b2b_proposal_versions').update({status:decision,approved_at:decision==='approved'?now():null,approved_by:decision==='approved'?actor.id:null,updated_at:now()}).eq('id',reqRow.proposal_id); return {approvalDecision:data,status:decision}
    }
    case 'b2b.proposal.mark_delivered': {
      if(!payload.proposalId)throw error('PROPOSAL_ID_REQUIRED'); const {data:proposal}=await db.from('browser_extension_b2b_proposal_versions').select('*').eq('id',payload.proposalId).single(); await loadOpportunity(db,actor,access,proposal.opportunity_id); if(proposal.status!=='approved')throw error('PROPOSAL_MUST_BE_APPROVED_BEFORE_DELIVERY',409)
      const {data,error:e}=await db.from('browser_extension_b2b_proposal_deliveries').insert({proposal_id:proposal.id,prospect_id:proposal.prospect_id,opportunity_id:proposal.opportunity_id,delivered_by:actor.id,channel:text(payload.channel,80)||'email',recipient:text(payload.recipient,300),delivery_reference:text(payload.deliveryReference,1000),follow_up_due_at:payload.followUpDueAt||null,status:'delivered'}).select('*').single(); if(e)dbError('B2B_PROPOSAL_DELIVERY_FAILED',e); await db.from('browser_extension_b2b_proposal_versions').update({status:'delivered',delivered_at:now(),updated_at:now()}).eq('id',proposal.id); await db.from('browser_extension_b2b_opportunities').update({stage:'proposal_sent',stage_order:100,last_activity_at:now(),next_action:'Planifier la réunion de décision',next_action_due_at:payload.followUpDueAt||null,updated_by:actor.id,updated_at:now()}).eq('id',proposal.opportunity_id); return {proposal:{...proposal,status:'delivered'},delivery:data}
    }
    case 'b2b.discount.request': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const pricing=await latestPricing(db,opportunity.id); if(!pricing)throw error('PRICING_REQUIRED',409); const requestedPercent=number(payload.discountPercent); const newNet=number(pricing.quoted_revenue)*(1-requestedPercent/100); const newMargin=newNet>0?((newNet-number(pricing.delivery_cost))/newNet)*100:0; const p=await policy(db); const guard=marginStatus(newMargin,p)
      const {data,error:e}=await db.from('browser_extension_b2b_discount_requests').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,proposal_id:payload.proposalId||null,pricing_calculation_id:pricing.id,requested_by:actor.id,requested_discount_percent:requestedPercent,reason:text(payload.reason),objection_context:text(payload.objectionContext),expected_benefit:text(payload.expectedBenefit),contract_months:number(payload.contractMonths,12),payment_structure:text(payload.paymentStructure),original_margin:pricing.gross_margin_percent,revised_margin:Number(newMargin.toFixed(2)),status:'submitted',required_approver_role:guard.approvalRole||'sales_manager',alternatives:['Reduce scope','Controlled pilot','Annual commitment','Upfront payment','Remove optional services','Volume threshold']}).select('*').single(); if(e)dbError('B2B_DISCOUNT_REQUEST_FAILED',e); return {discountRequest:data,marginGuard:guard,alternatives:data.alternatives}
    }
    case 'b2b.discount.approve': case 'b2b.discount.reject': {
      if(!canApprove(access,'extension.b2b.pricing_margin_protection'))throw error('APPROVAL_ACCESS_LEVEL_REQUIRED',403)
      if(!payload.discountRequestId)throw error('DISCOUNT_REQUEST_ID_REQUIRED'); const {data:reqRow}=await db.from('browser_extension_b2b_discount_requests').select('*').eq('id',payload.discountRequestId).single(); if(!reqRow)throw error('DISCOUNT_REQUEST_NOT_FOUND',404); await loadOpportunity(db,actor,access,reqRow.opportunity_id); const status=commandKey.endsWith('approve')?'approved':'rejected'; const {data,error:e}=await db.from('browser_extension_b2b_discount_requests').update({status,decided_by:actor.id,decision_notes:text(payload.notes),decided_at:now()}).eq('id',reqRow.id).select('*').single(); if(e)dbError('B2B_DISCOUNT_DECISION_FAILED',e); return {discountRequest:data}
    }
    case 'b2b.negotiation.open': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const proposal=await latestProposal(db,opportunity.id); if(!proposal)throw error('PROPOSAL_REQUIRED',409); const {data,error:e}=await db.from('browser_extension_b2b_negotiation_rooms').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,proposal_id:proposal.id,owner_id:actor.id,status:'active',commercial_value:proposal.commercial_value,margin_percent:proposal.gross_margin_percent,decision_date:payload.decisionDate||null,stakeholders:payload.stakeholders||[],competitive_threat:text(payload.competitiveThreat),next_action:text(payload.nextAction)||'Confirmer les points ouverts de négociation'}).select('*').single(); if(e)dbError('B2B_NEGOTIATION_OPEN_FAILED',e); await db.from('browser_extension_b2b_opportunities').update({stage:'negotiation',stage_order:110,updated_by:actor.id,updated_at:now()}).eq('id',opportunity.id); return {negotiationRoom:data,proposal,opportunity:{...opportunity,stage:'negotiation'}}
    }
    case 'b2b.negotiation.change_record': {
      if(!payload.negotiationRoomId)throw error('NEGOTIATION_ROOM_ID_REQUIRED'); const {data:room}=await db.from('browser_extension_b2b_negotiation_rooms').select('*').eq('id',payload.negotiationRoomId).single(); await loadOpportunity(db,actor,access,room.opportunity_id); const revenueImpact=number(payload.revenueImpact); const marginImpact=number(payload.marginImpact); const {data,error:e}=await db.from('browser_extension_b2b_negotiation_events').insert({negotiation_room_id:room.id,prospect_id:room.prospect_id,opportunity_id:room.opportunity_id,event_type:text(payload.eventType,80)||'client_request',requested_by:text(payload.requestedBy,200)||'Client',requested_change:text(payload.requestedChange),commercial_impact:revenueImpact,margin_impact:marginImpact,payment_impact:text(payload.paymentImpact),operational_impact:text(payload.operationalImpact),recommended_response:text(payload.recommendedResponse),approval_required:bool(payload.approvalRequired),created_by:actor.id}).select('*').single(); if(e)dbError('B2B_NEGOTIATION_EVENT_FAILED',e); return {negotiationEvent:data,negotiationRoom:room}
    }
    case 'b2b.counteroffer.prepare': {
      if(!payload.negotiationRoomId)throw error('NEGOTIATION_ROOM_ID_REQUIRED'); const {data:room}=await db.from('browser_extension_b2b_negotiation_rooms').select('*').eq('id',payload.negotiationRoomId).single(); await loadOpportunity(db,actor,access,room.opportunity_id); const calc=calculate(payload); const p=await policy(db); const guard=marginStatus(calc.marginPercent,p); const {data,error:e}=await db.from('browser_extension_b2b_counteroffers').insert({negotiation_room_id:room.id,prospect_id:room.prospect_id,opportunity_id:room.opportunity_id,prepared_by:actor.id,strategy:text(payload.strategy,100)||'revised_scope',summary:text(payload.summary),scope_changes:payload.scopeChanges||{},payment_changes:payload.paymentChanges||{},contract_changes:payload.contractChanges||{},commercial_value:calc.netRevenue,margin_percent:calc.marginPercent,approval_required:guard.status!=='healthy',required_approver_role:guard.approvalRole,status:guard.status==='healthy'?'prepared':'approval_required'}).select('*').single(); if(e)dbError('B2B_COUNTEROFFER_FAILED',e); return {counteroffer:data,marginGuard:guard}
    }
    case 'b2b.objection.record': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const category=text(payload.category,100)||'other'; const strategies:any={price:{meaning:'Valeur ou structure financière non alignée',recommended:'Requalifier valeur, portée et engagement avant toute remise',avoid:'Remise immédiate'},operational_capacity:{meaning:'Risque de mise en œuvre',recommended:'Présenter gouvernance, staffing, supervision et plan de lancement',avoid:'Baisser le prix'},trust:{meaning:'Confiance et preuve insuffisantes',recommended:'Apporter preuves, processus qualité et références',avoid:'Promesse non vérifiée'},payment_timing:{meaning:'Décalage de trésorerie',recommended:'Proposer calendrier contrôlé ou lancement phasé',avoid:'Net 60 non approuvé'}}; const strategy=strategies[category]||{meaning:'Objection commerciale à clarifier',recommended:'Poser une question de diagnostic et documenter la preuve',avoid:'Réponse générique'}
      const {data,error:e}=await db.from('browser_extension_b2b_objections').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,negotiation_room_id:payload.negotiationRoomId||null,recorded_by:actor.id,category,statement:text(payload.statement),meaning:strategy.meaning,recommended_response:text(payload.recommendedResponse)||strategy.recommended,action_to_avoid:strategy.avoid,evidence:payload.evidence||{},status:'open'}).select('*').single(); if(e)dbError('B2B_OBJECTION_RECORD_FAILED',e); return {objection:data,strategy}
    }
    case 'b2b.objection.resolve': {
      if(!payload.objectionId)throw error('OBJECTION_ID_REQUIRED'); const {data:obj}=await db.from('browser_extension_b2b_objections').select('*').eq('id',payload.objectionId).single(); await loadOpportunity(db,actor,access,obj.opportunity_id); const {data,error:e}=await db.from('browser_extension_b2b_objections').update({status:'resolved',resolution:text(payload.resolution),resolution_evidence:payload.evidence||{},resolved_by:actor.id,resolved_at:now()}).eq('id',obj.id).select('*').single(); if(e)dbError('B2B_OBJECTION_RESOLVE_FAILED',e); return {objection:data}
    }
    case 'b2b.closing.readiness': return readiness(db,actor,access,String(opportunityId),payload)
    case 'b2b.contract.requirement_create': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const {data,error:e}=await db.from('browser_extension_b2b_contract_requirements').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,requirement_key:text(payload.requirementKey,120)||'contract_document',label:text(payload.label,300)||'Contrat signé',required:true,status:'pending',owner_id:payload.ownerId||actor.id,evidence:payload.evidence||{},created_by:actor.id}).select('*').single(); if(e)dbError('B2B_CONTRACT_REQUIREMENT_FAILED',e); return {contractRequirement:data}
    }
    case 'b2b.contract.status_update': {
      if(!payload.requirementId)throw error('REQUIREMENT_ID_REQUIRED'); const {data:reqRow}=await db.from('browser_extension_b2b_contract_requirements').select('*').eq('id',payload.requirementId).single(); await loadOpportunity(db,actor,access,reqRow.opportunity_id); const status=text(payload.status,50)||'pending'; const {data,error:e}=await db.from('browser_extension_b2b_contract_requirements').update({status,evidence:payload.evidence||reqRow.evidence,completed_by:status==='complete'?actor.id:null,completed_at:status==='complete'?now():null,updated_at:now()}).eq('id',reqRow.id).select('*').single(); if(e)dbError('B2B_CONTRACT_STATUS_FAILED',e); return {contractRequirement:data}
    }
    case 'b2b.payment.gate_check': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const {data:promises}=await db.from('browser_extension_b2b_payment_promises').select('*').eq('opportunity_id',opportunity.id).order('promised_at',{ascending:false}); const verified=Boolean(payload.financeVerified); if(verified&&!canApprove(access,'extension.b2b.contract_payment_gates'))throw error('FINANCE_VERIFICATION_ACCESS_REQUIRED',403); const status=verified?'verified':(promises||[]).some((row:any)=>row.status==='promised')?'promise_recorded':'pending'; const {data,error:e}=await db.from('browser_extension_b2b_payment_gates').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,amount_due:number(payload.amountDue),deposit_percent:number(payload.depositPercent),due_at:payload.dueAt||null,payment_method:text(payload.paymentMethod,100),payer:text(payload.payer,300),status,verification_required:!verified,verified_by:verified?actor.id:null,verified_at:verified?now():null,evidence:payload.evidence||{},created_by:actor.id}).select('*').single(); if(e)dbError('B2B_PAYMENT_GATE_FAILED',e); return {paymentGate:data,paymentPromises:promises||[]}
    }
    case 'b2b.closing.gate_check': {
      const result=await readiness(db,actor,access,String(opportunityId),payload); const blocked=result.missing.length>0; const {data,error:e}=await db.from('browser_extension_b2b_closing_gates').insert({prospect_id:result.prospect.id,opportunity_id:result.opportunity.id,user_id:actor.id,requested_state:text(payload.requestedState,80)||'won',readiness_score:result.readiness.score,blocked,missing_requirements:result.missing,evidence:payload.evidence||{},status:blocked?'blocked':'passed'}).select('*').single(); if(e)dbError('B2B_CLOSING_GATE_FAILED',e); if(blocked)throw error('CLOSING_GATES_INCOMPLETE',409,{closingGate:data,missing:result.missing,readiness:result.readiness}); await db.from('browser_extension_b2b_opportunities').update({stage:'won',stage_order:160,status:'won',updated_by:actor.id,updated_at:now()}).eq('id',result.opportunity.id); return {closingGate:data,opportunity:{...result.opportunity,stage:'won',status:'won'},readiness:result.readiness}
    }
    case 'b2b.payment_promise.create': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); if(!payload.promisedAt)throw error('PROMISED_AT_REQUIRED'); const {data,error:e}=await db.from('browser_extension_b2b_payment_promises').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,created_by:actor.id,amount:number(payload.amount),promised_at:payload.promisedAt,payment_method:text(payload.paymentMethod,100),payer:text(payload.payer,300),internal_owner_id:payload.ownerId||actor.id,verification_due_at:payload.verificationDueAt||payload.promisedAt,escalation_rule:text(payload.escalationRule)||'Escalate after missed promise',status:'promised',evidence:payload.evidence||{}}).select('*').single(); if(e)dbError('B2B_PAYMENT_PROMISE_FAILED',e); return {paymentPromise:data}
    }
    case 'b2b.payment_promise.verify_request': {
      if(!payload.paymentPromiseId)throw error('PAYMENT_PROMISE_ID_REQUIRED'); const {data:promise}=await db.from('browser_extension_b2b_payment_promises').select('*').eq('id',payload.paymentPromiseId).single(); await loadOpportunity(db,actor,access,promise.opportunity_id); const status=bool(payload.missed)?'missed':'verification_requested'; const {data,error:e}=await db.from('browser_extension_b2b_payment_promises').update({status,verification_requested_by:actor.id,verification_requested_at:now(),proof:payload.proof||{},updated_at:now()}).eq('id',promise.id).select('*').single(); if(e)dbError('B2B_PAYMENT_VERIFY_REQUEST_FAILED',e); return {paymentPromise:data,financeVerificationRequired:true}
    }
    case 'b2b.revenue_rescue.create': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const {data,error:e}=await db.from('browser_extension_b2b_revenue_rescue_cases').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,created_by:actor.id,rescue_type:text(payload.rescueType,100)||'proposal_recovery',risk_value:number(payload.riskValue,opportunity.estimated_annual_value),reason:text(payload.reason),signals:payload.signals||[],recommended_actions:payload.recommendedActions||[],owner_id:payload.ownerId||actor.id,due_at:payload.dueAt||null,status:'open',priority:text(payload.priority,30)||'high'}).select('*').single(); if(e)dbError('B2B_REVENUE_RESCUE_FAILED',e); return {revenueRescue:data}
    }
    case 'b2b.executive_intervention.prepare': {
      const {opportunity,prospect}=await loadOpportunity(db,actor,access,String(opportunityId)); const proposal=await latestProposal(db,opportunity.id); const pricing=await latestPricing(db,opportunity.id); const {data:objections}=await db.from('browser_extension_b2b_objections').select('*').eq('opportunity_id',opportunity.id).eq('status','open'); const {data,error:e}=await db.from('browser_extension_b2b_executive_interventions').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,prepared_by:actor.id,executive_role:text(payload.executiveRole,100)||'managing_director',account_summary:`${prospect.name} · ${prospect.city||''}`,opportunity_value:opportunity.estimated_annual_value,strategic_value:text(payload.strategicValue),current_stage:opportunity.stage,stakeholders:payload.stakeholders||[],latest_proposal:proposal||{},margin_percent:pricing?.gross_margin_percent||null,main_blocker:text(payload.mainBlocker)||(objections||[])[0]?.statement||'Blocage à confirmer',client_request:text(payload.clientRequest),approved_position:text(payload.approvedPosition),recommended_intervention:text(payload.recommendedIntervention),prohibited_commitments:payload.prohibitedCommitments||[],required_outcome:text(payload.requiredOutcome),follow_up_owner_id:payload.followUpOwnerId||actor.id,status:'prepared'}).select('*').single(); if(e)dbError('B2B_EXECUTIVE_INTERVENTION_FAILED',e); return {executiveIntervention:data,proposal,pricing,objections:objections||[]}
    }
    default: throw error('UNHANDLED_B2B_DEAL_COMMAND',400)
  }
}
