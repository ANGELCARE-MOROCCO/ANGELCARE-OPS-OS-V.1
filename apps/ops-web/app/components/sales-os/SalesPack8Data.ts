export const agentWorkbench = [
  { block: 'Now Action', purpose: 'Shows the single most important action the agent must execute next.', controls: ['Call now', 'Send WhatsApp', 'Send quote', 'Escalate', 'Mark blocked'], output: 'No lead stays passive.' },
  { block: 'Client Snapshot', purpose: 'Need, payer, urgency, objections, package fit and last promise in one view.', controls: ['Edit need', 'Update payer', 'Log objection', 'Change temperature'], output: 'Agent acts with context, not memory.' },
  { block: 'Closing Micro-Steps', purpose: 'Breaks close into small executable steps: confirm need, confirm price, confirm start, confirm payment.', controls: ['Step done', 'Step failed', 'Manager help'], output: 'Better control of close progression.' },
  { block: 'Execution Notes', purpose: 'Forces useful sales notes with result, objection, next step and deadline.', controls: ['Save structured note', 'Flag weak note'], output: 'Cleaner performance truth.' },
]

export const dailySalesPlan = [
  { timeBlock: '10:00 - 11:00', mission: 'Hot lead attack', rule: 'Only urgent callbacks, quote follow-ups and fresh high-intent leads.', expectedOutput: 'Immediate close attempts started.' },
  { timeBlock: '11:00 - 13:00', mission: 'Quote and payment conversion', rule: 'Every sent quote receives a same-day close action.', expectedOutput: 'Signed, paid, or escalated.' },
  { timeBlock: '14:00 - 16:00', mission: 'Warm lead upgrade', rule: 'Move warm leads into hot, quote, or lost with reason.', expectedOutput: 'Pipeline cleaned and accelerated.' },
  { timeBlock: '16:00 - 18:00', mission: 'End-of-day closing sprint', rule: 'No hot lead sleeps without a next action.', expectedOutput: 'Clear tomorrow and protected revenue.' },
]

export const liveFollowupQueue = [
  { queue: 'Due Now', entryRule: 'Next action deadline is now or overdue.', action: 'Agent must execute or reassign with reason.' },
  { queue: 'Quote Sent', entryRule: 'Quote exists but no payment/contract confirmation.', action: 'Close, revise, or manager rescue.' },
  { queue: 'Payment Promise', entryRule: 'Client promised payment at a specific time.', action: 'Reminder before time, confirmation after time.' },
  { queue: 'Silent Risk', entryRule: 'Lead has value but no client reply after configured attempts.', action: 'Change channel, escalate, or mark lost with autopsy.' },
]

export const closingSprintMode = [
  { sprint: '30-Minute Close Push', target: 'Top 10 hottest leads', command: 'Call first, WhatsApp second, quote third, manager intervention last.' },
  { sprint: 'Quote Recovery Sprint', target: 'Quotes older than 24h', command: 'Identify objection, adjust offer, push payment or close lost.' },
  { sprint: 'End-of-Day Revenue Lock', target: 'Deals that can realistically close today', command: 'Force payment path, contract path and activation readiness.' },
  { sprint: 'CEO Rescue Sprint', target: 'High-value stuck opportunities', command: 'Prepare clean summary and executive intervention option.' },
]

export const executionFloorRhythm = [
  { rhythm: 'Morning Command', frequency: 'Daily 10:00', focus: 'Priorities, hot leads, target, blocked deals.', owner: 'Sales manager' },
  { rhythm: 'Midday Correction', frequency: 'Daily 13:30', focus: 'Missed SLA, quote conversion, weak agent actions.', owner: 'Supervisor' },
  { rhythm: 'Closing Hour', frequency: 'Daily 17:00', focus: 'Today closable revenue and payment promises.', owner: 'Closer' },
  { rhythm: 'End Audit', frequency: 'Daily 18:00', focus: 'Tomorrow plan, lost reasons, handoff risks.', owner: 'Manager' },
]

export const shiftCommandBoard = [
  { metric: 'Calls executed', target: 'Configured per agent', control: 'Low activity triggers supervisor check.' },
  { metric: 'Hot lead SLA', target: 'No breach tolerated', control: 'Breach creates escalation queue item.' },
  { metric: 'Quotes followed', target: '100% same day', control: 'Unfollowed quote blocks daily closure.' },
  { metric: 'Deals activated', target: 'Won deals must have handoff status', control: 'No fake win without activation readiness.' },
]

export const callbackControl = [
  { callbackType: 'Exact-time promise', behavior: 'Locks a countdown and reminder before the promised time.', failureMode: 'Escalate if missed.' },
  { callbackType: 'Client requested later', behavior: 'Requires reason and preferred channel.', failureMode: 'Lead temperature decreases if ignored.' },
  { callbackType: 'Manager callback', behavior: 'Creates high-priority intervention task.', failureMode: 'Visible in supervisor room.' },
  { callbackType: 'Payment callback', behavior: 'Connects promise to quote/payment tracker.', failureMode: 'Moves deal into payment risk.' },
]

export const dealRescueDesk = [
  { risk: 'Client says too expensive', rescue: 'Reframe value, compare package, offer safer payment structure without uncontrolled discount.' },
  { risk: 'Client delaying decision', rescue: 'Force decision path: start date, consequence of delay, next exact action.' },
  { risk: 'Client silent after quote', rescue: 'Change channel and send short close-oriented message.' },
  { risk: 'Fulfillment uncertainty', rescue: 'Pause promise, verify capacity, redesign start condition.' },
]
