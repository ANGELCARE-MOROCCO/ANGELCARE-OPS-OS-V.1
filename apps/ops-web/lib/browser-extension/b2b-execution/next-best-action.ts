import type { B2BExecutionStage } from './types'

type Input = {
  stage: B2BExecutionStage
  prospect: Record<string, any>
  opportunity?: Record<string, any> | null
  contactCount?: number
  decisionMakerCount?: number
  openFollowups?: number
  overdueFollowups?: number
  hasMeeting?: boolean
  hasMeetingOutcome?: boolean
  lastActivityAt?: string | null
}

function due(hours:number){return new Date(Date.now()+hours*3600000).toISOString()}

export function computeNextBestAction(input:Input){
  const { stage, prospect } = input
  const accountName = String(prospect.name || 'this account')
  if ((input.overdueFollowups || 0) > 0) return { actionType:'followup_recovery', title:`Recover overdue follow-up for ${accountName}`, objective:'Complete the overdue commitment, record the outcome, and restore a dated next step.', dueAt:due(4), priority:'critical', reasoning:['An assigned follow-up is overdue','Active opportunities must always have a current next action'] }
  if (!input.contactCount) return { actionType:'contact_research', title:`Identify a valid contact at ${accountName}`, objective:'Find and validate an operational or commercial contact before outreach.', dueAt:due(24), priority:'high', reasoning:['No validated contact is linked to the account','Outreach without a role-matched contact is low quality'] }
  if (!input.decisionMakerCount && ['qualified','initial_contact','discovery','meeting_scheduled','needs_confirmed','solution_design','proposal_preparation','proposal_sent','negotiation'].includes(stage)) return { actionType:'decision_maker_research', title:`Identify the decision authority for ${accountName}`, objective:'Confirm the economic buyer, final approver, or sponsor and record evidence.', dueAt:due(36), priority:'high', reasoning:['Decision-maker coverage is incomplete','The opportunity is already beyond basic research'] }
  if (stage === 'new_target' || stage === 'research') return { actionType:'qualify', title:`Qualify ${accountName}`, objective:'Confirm business need, fit, potential value, and the best entry route.', dueAt:due(24), priority:'high', reasoning:['The account is not yet commercially qualified'] }
  if (stage === 'qualified') return { actionType:'first_contact', title:`Launch a personalized first contact with ${accountName}`, objective:'Secure a discovery conversation with the most relevant stakeholder.', dueAt:due(12), priority:'high', reasoning:['The account is qualified but no active conversation is recorded'] }
  if (stage === 'initial_contact') return { actionType:'followup', title:`Secure discovery with ${accountName}`, objective:'Convert the first contact into a dated discovery call or meeting.', dueAt:due(24), priority:'high', reasoning:['Initial contact must result in a scheduled next step'] }
  if (stage === 'discovery' && !input.hasMeeting) return { actionType:'meeting', title:`Schedule the discovery meeting with ${accountName}`, objective:'Confirm need, timing, decision process, expected scope, and launch conditions.', dueAt:due(24), priority:'high', reasoning:['Discovery is active but no meeting is scheduled'] }
  if (stage === 'meeting_scheduled' && !input.hasMeetingOutcome) return { actionType:'meeting_prepare', title:`Prepare the decision meeting for ${accountName}`, objective:'Enter the meeting with missing questions, stakeholder risks, and a precise desired commitment.', dueAt:due(8), priority:'high', reasoning:['A scheduled meeting requires a structured brief'] }
  if (stage === 'needs_confirmed') return { actionType:'solution_design', title:`Design the AngelCare solution for ${accountName}`, objective:'Translate confirmed needs into scope, operating model, responsibilities, and next decision milestone.', dueAt:due(36), priority:'high', reasoning:['Business needs are confirmed','The next commercial value is solution design'] }
  if (stage === 'solution_design' || stage === 'proposal_preparation') return { actionType:'proposal_requirement', title:`Prepare the proposal requirements for ${accountName}`, objective:'Confirm scope, volumes, start date, stakeholders, and approval path before proposal production.', dueAt:due(24), priority:'high', reasoning:['Proposal work should begin only with confirmed commercial inputs'] }
  if (stage === 'proposal_sent') return { actionType:'decision_meeting', title:`Secure a proposal decision meeting with ${accountName}`, objective:'Confirm review participants, objections, decision date, and the next contractual step.', dueAt:due(24), priority:'critical', reasoning:['A proposal without a decision meeting creates revenue leakage'] }
  if (stage === 'negotiation') return { actionType:'negotiation_followup', title:`Resolve the main negotiation blocker for ${accountName}`, objective:'Document the blocker, assign the internal response, and secure a final decision date.', dueAt:due(12), priority:'critical', reasoning:['Negotiation requires a single explicit blocker and decision path'] }
  if (['commercial_agreement','contract_pending','payment_pending'].includes(stage)) return { actionType:'closing_control', title:`Protect closing execution for ${accountName}`, objective:'Verify agreement, contract, payment, owner, and exact deadline without declaring a premature win.', dueAt:due(8), priority:'critical', reasoning:['The opportunity is commercially advanced','Closing gates must remain explicit'] }
  return { actionType:'account_review', title:`Review the next revenue action for ${accountName}`, objective:'Confirm the current state, owner, deadline, risk, and measurable next outcome.', dueAt:due(24), priority:'medium', reasoning:['The opportunity requires an explicit next action'] }
}
