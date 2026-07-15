export const executionRules = [
  { rule: 'No quote without payer confirmation', trigger: 'Agent attempts quote before payer/decision-maker is identified.', control: 'Block quote lock and force payer field + decision power note.', owner: 'Sales manager' },
  { rule: 'No discount without reason code', trigger: 'Any discount above normal range.', control: 'Require reason, competitor context, margin risk and manager approval.', owner: 'Manager' },
  { rule: 'No close without fulfillment readiness', trigger: 'Deal marked won before start date, capacity and handoff are checked.', control: 'Move deal to pending activation, not won.', owner: 'Closer + Fulfillment owner' },
  { rule: 'No silent follow-up gaps', trigger: 'Hot lead has no action inside SLA.', control: 'Create escalation task and notify supervisor queue.', owner: 'Team lead' },
]

export const approvalLanes = [
  { lane: 'Discount Approval', requester: 'Closer', approver: 'Sales manager', requiredWhen: 'Discount exceeds configured threshold or margin impact is unclear.', result: 'Approved, rejected or replaced by safer package.' },
  { lane: 'Urgent Start Approval', requester: 'Frontline sales', approver: 'Operations coordinator', requiredWhen: 'Client requests same-day or next-day activation.', result: 'Capacity confirmed before promise is made.' },
  { lane: 'Payment Exception Approval', requester: 'Closer', approver: 'Finance / CEO', requiredWhen: 'Client asks partial, delayed or unusual payment terms.', result: 'Payment exposure controlled.' },
  { lane: 'Strategic Deal Approval', requester: 'Manager', approver: 'CEO', requiredWhen: 'Large B2B, high visibility or reputation-sensitive deal.', result: 'Executive control before commitment.' },
]

export const slaCommandTimers = [
  { leadTemperature: 'Hot', firstResponse: '5 minutes', nextAction: '30 minutes', escalation: 'Supervisor after missed next action.' },
  { leadTemperature: 'Warm', firstResponse: '20 minutes', nextAction: '2 hours', escalation: 'Daily manager review.' },
  { leadTemperature: 'Quote Sent', firstResponse: 'Immediate confirmation', nextAction: 'Same day close attempt', escalation: 'Manager if quote remains unsigned after 24h.' },
  { leadTemperature: 'Won Pending Activation', firstResponse: 'Instant handoff', nextAction: 'Activation checklist same day', escalation: 'Operations risk queue.' },
]

export const agentTaskDiscipline = [
  'Every open lead must have one next action, one owner, one deadline and one expected outcome.',
  'Agents cannot move a lead forward using vague notes such as “called client”; they must record result, objection and next step.',
  'Missed tasks are not hidden; they move into supervisor control and impact sales quality score.',
  'Closing tasks must include payment, contract, start date and fulfillment readiness status.',
]

export const escalationMatrix = [
  { risk: 'Hot lead ignored', level: 'Team lead', response: 'Reassign or force immediate call.', maxDelay: '30 minutes' },
  { risk: 'Discount conflict', level: 'Sales manager', response: 'Approve, reject or redesign offer.', maxDelay: '2 hours' },
  { risk: 'Fulfillment impossible', level: 'Ops manager', response: 'Stop close, adjust promise, or escalate to CEO.', maxDelay: 'Same day' },
  { risk: 'High-value deal at risk', level: 'CEO queue', response: 'Executive intervention call or custom offer.', maxDelay: '4 hours' },
]

export const salesPermissionControl = [
  { permission: 'Create quote', allowedFor: 'Agent, closer, manager', restriction: 'Cannot lock quote without required qualification fields.' },
  { permission: 'Apply discount', allowedFor: 'Closer, manager', restriction: 'Agent can propose but not approve beyond threshold.' },
  { permission: 'Mark deal won', allowedFor: 'Closer, manager', restriction: 'Requires payment/contract/activation gate.' },
  { permission: 'Override execution rule', allowedFor: 'Manager, CEO', restriction: 'Override reason must be audit-logged.' },
]

export const dealQualityGates = [
  { gate: 'Qualification Gate', passCondition: 'Need, payer, decision-maker, urgency and service fit are documented.', failureAction: 'Return to discovery.' },
  { gate: 'Offer Gate', passCondition: 'Package, price, payment terms and start condition are clear.', failureAction: 'Revise quote.' },
  { gate: 'Closing Gate', passCondition: 'Client accepts offer and payment/contract path is locked.', failureAction: 'Move to close recovery.' },
  { gate: 'Activation Gate', passCondition: 'Fulfillment owner, start date, documents and risk status are ready.', failureAction: 'Hold won status and escalate.' },
]

export const supervisorControlRoom = [
  { zone: 'Missed SLA', command: 'Review all leads with breached timer and force owner action.', output: 'Reassigned, escalated or closed as lost with reason.' },
  { zone: 'Approval Queue', command: 'Approve only deals that protect margin and fulfillment reality.', output: 'Clean approval trail.' },
  { zone: 'Agent Quality', command: 'Detect weak notes, missing next actions and fake progress.', output: 'Coaching target and quality score.' },
  { zone: 'Risky Promises', command: 'Catch promises made before operations can deliver.', output: 'Protected client experience.' },
]
