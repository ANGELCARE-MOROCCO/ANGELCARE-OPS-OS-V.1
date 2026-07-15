export const B2B_SECTORS = [
  'Hotel',
  'Resort',
  'Family hotel',
  'Boutique hotel',
  'Event venue',
  'Pediatric clinic',
  'Pediatrician',
  'Child development center',
  'Orthophonist',
  'Psychomotor specialist',
  'Family wellness center',
  'School',
  'Nursery',
  'Corporate family service buyer',
  'Other',
] as const

export const B2B_CRM_STATUSES = [
  'New',
  'Contacted',
  'No Response',
  'Interested',
  'Meeting Booked',
  'Meeting Done',
  'Proposal Sent',
  'Negotiation',
  'Pilot Agreed',
  'Signed Partner',
  'Not Fit',
  'Follow Up Later',
  'Lost',
] as const

export const B2B_PRIORITY_SCORES = ['A', 'B', 'C'] as const
export const B2B_RELATIONSHIP_WARMTH = ['Cold', 'Warm', 'Hot'] as const

export const B2B_OUTREACH_CHANNELS = [
  'Email',
  'Phone',
  'WhatsApp',
  'LinkedIn',
  'Instagram',
  'In-person visit',
  'Referral introduction',
] as const

export const B2B_OUTREACH_OUTCOMES = [
  'No response',
  'Positive reply',
  'Negative reply',
  'Asked for info',
  'Meeting booked',
  'Wrong contact',
  'Follow up later',
  'Not interested',
] as const

export const B2B_MEETING_STATUSES = [
  'Scheduled',
  'Completed',
  'Cancelled',
  'No-show',
  'Rescheduled',
] as const

export const B2B_PROPOSAL_STATUSES = [
  'Draft',
  'Internal Review',
  'Approved',
  'Sent',
  'Viewed',
  'Follow-up Needed',
  'Negotiation',
  'Accepted',
  'Rejected',
  'Expired',
] as const

export const B2B_TASK_STATUSES = [
  'To Do',
  'In Progress',
  'Blocked',
  'Done',
  'Overdue',
  'Cancelled',
] as const

export const B2B_TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const

export const B2B_AUDIT_ACTIONS = {
  PROSPECT_CREATED: 'b2b.prospect.created',
  PROSPECT_UPDATED: 'b2b.prospect.updated',
  PROSPECT_STATUS_CHANGED: 'b2b.prospect.status_changed',
  PROSPECT_OWNER_CHANGED: 'b2b.prospect.owner_changed',
  PROSPECT_ARCHIVED: 'b2b.prospect.archived',
  CONTACT_CREATED: 'b2b.contact.created',
  CONTACT_UPDATED: 'b2b.contact.updated',
  OUTREACH_LOGGED: 'b2b.outreach.logged',
  CALL_LOGGED: 'b2b.call.logged',
  MEETING_CREATED: 'b2b.meeting.created',
  MEETING_UPDATED: 'b2b.meeting.updated',
  MEETING_COMPLETED: 'b2b.meeting.completed',
  PROPOSAL_CREATED: 'b2b.proposal.created',
  PROPOSAL_UPDATED: 'b2b.proposal.updated',
  PROPOSAL_APPROVED: 'b2b.proposal.approved',
  PROPOSAL_SENT: 'b2b.proposal.sent',
  TASK_CREATED: 'b2b.task.created',
  TASK_UPDATED: 'b2b.task.updated',
  TASK_COMPLETED: 'b2b.task.completed',
  REPORT_GENERATED: 'b2b.report.generated',
} as const
