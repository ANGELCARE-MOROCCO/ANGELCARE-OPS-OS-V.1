import type { B2BDealCommandDefinition } from './types'

export const B2B_DEAL_COMMANDS:B2BDealCommandDefinition[] = [
  { commandKey:'b2b.offer.configure', capabilityPermission:'extension.b2b.proposal_studio', requiredSubmodule:'proposal_studio', mutating:true, acceptanceId:'M4-A01' },
  { commandKey:'b2b.proposal.create', capabilityPermission:'extension.b2b.proposal_studio', requiredSubmodule:'proposal_studio', mutating:true, acceptanceId:'M4-A01' },
  { commandKey:'b2b.proposal.update', capabilityPermission:'extension.b2b.proposal_studio', requiredSubmodule:'proposal_studio', mutating:true, acceptanceId:'M4-A01' },
  { commandKey:'b2b.proposal.version_create', capabilityPermission:'extension.b2b.proposal_studio', requiredSubmodule:'proposal_studio', mutating:true, acceptanceId:'M4-A01' },
  { commandKey:'b2b.proposal.submit_approval', capabilityPermission:'extension.b2b.proposal_studio', requiredSubmodule:'proposal_studio', mutating:true, acceptanceId:'M4-A01' },
  { commandKey:'b2b.proposal.approve', capabilityPermission:'extension.b2b.proposal_studio', requiredSubmodule:'proposal_studio', mutating:true, acceptanceId:'M4-A09' },
  { commandKey:'b2b.proposal.reject', capabilityPermission:'extension.b2b.proposal_studio', requiredSubmodule:'proposal_studio', mutating:true, acceptanceId:'M4-A09' },
  { commandKey:'b2b.proposal.mark_delivered', capabilityPermission:'extension.b2b.proposal_studio', requiredSubmodule:'proposal_studio', mutating:true, acceptanceId:'M4-A01' },
  { commandKey:'b2b.pricing.model_recommend', capabilityPermission:'extension.b2b.pricing_model_selection', requiredSubmodule:'pricing_margin', mutating:false, acceptanceId:'M4-A01' },
  { commandKey:'b2b.pricing.calculate', capabilityPermission:'extension.b2b.pricing_model_selection', requiredSubmodule:'pricing_margin', mutating:true, acceptanceId:'M4-A01' },
  { commandKey:'b2b.margin.evaluate', capabilityPermission:'extension.b2b.pricing_margin_protection', requiredSubmodule:'pricing_margin', mutating:true, acceptanceId:'M4-A02' },
  { commandKey:'b2b.discount.request', capabilityPermission:'extension.b2b.pricing_margin_protection', requiredSubmodule:'pricing_margin', mutating:true, acceptanceId:'M4-A03' },
  { commandKey:'b2b.discount.approve', capabilityPermission:'extension.b2b.pricing_margin_protection', requiredSubmodule:'pricing_margin', mutating:true, acceptanceId:'M4-A09' },
  { commandKey:'b2b.discount.reject', capabilityPermission:'extension.b2b.pricing_margin_protection', requiredSubmodule:'pricing_margin', mutating:true, acceptanceId:'M4-A09' },
  { commandKey:'b2b.negotiation.open', capabilityPermission:'extension.b2b.negotiation_deal_room', requiredSubmodule:'negotiation_deal_room', mutating:true, acceptanceId:'M4-A04' },
  { commandKey:'b2b.negotiation.change_record', capabilityPermission:'extension.b2b.negotiation_deal_room', requiredSubmodule:'negotiation_deal_room', mutating:true, acceptanceId:'M4-A04' },
  { commandKey:'b2b.counteroffer.prepare', capabilityPermission:'extension.b2b.negotiation_deal_room', requiredSubmodule:'negotiation_deal_room', mutating:true, acceptanceId:'M4-A04' },
  { commandKey:'b2b.objection.record', capabilityPermission:'extension.b2b.objection_intelligence', requiredSubmodule:'negotiation_deal_room', mutating:true, acceptanceId:'M4-A05' },
  { commandKey:'b2b.objection.resolve', capabilityPermission:'extension.b2b.objection_intelligence', requiredSubmodule:'negotiation_deal_room', mutating:true, acceptanceId:'M4-A05' },
  { commandKey:'b2b.closing.readiness', capabilityPermission:'extension.b2b.closing_room', requiredSubmodule:'closing_room', mutating:true, acceptanceId:'M4-A06' },
  { commandKey:'b2b.closing.gate_check', capabilityPermission:'extension.b2b.closing_room', requiredSubmodule:'closing_room', mutating:true, acceptanceId:'M4-A06' },
  { commandKey:'b2b.contract.requirement_create', capabilityPermission:'extension.b2b.contract_payment_gates', requiredSubmodule:'contracts', mutating:true, acceptanceId:'M4-A06' },
  { commandKey:'b2b.contract.status_update', capabilityPermission:'extension.b2b.contract_payment_gates', requiredSubmodule:'contracts', mutating:true, acceptanceId:'M4-A06' },
  { commandKey:'b2b.payment.gate_check', capabilityPermission:'extension.b2b.contract_payment_gates', requiredSubmodule:'payment_promises', mutating:true, acceptanceId:'M4-A06' },
  { commandKey:'b2b.payment_promise.create', capabilityPermission:'extension.b2b.payment_promise_control', requiredSubmodule:'payment_promises', mutating:true, acceptanceId:'M4-A07' },
  { commandKey:'b2b.payment_promise.verify_request', capabilityPermission:'extension.b2b.payment_promise_control', requiredSubmodule:'payment_promises', mutating:true, acceptanceId:'M4-A07' },
  { commandKey:'b2b.revenue_rescue.create', capabilityPermission:'extension.b2b.revenue_rescue', requiredSubmodule:'revenue_rescue', mutating:true, acceptanceId:'M4-A08' },
  { commandKey:'b2b.executive_intervention.prepare', capabilityPermission:'extension.b2b.executive_intervention', requiredSubmodule:'revenue_rescue', mutating:true, acceptanceId:'M4-A08' },
]

export const B2B_DEAL_COMMAND_MAP = new Map(B2B_DEAL_COMMANDS.map((row)=>[row.commandKey,row]))
