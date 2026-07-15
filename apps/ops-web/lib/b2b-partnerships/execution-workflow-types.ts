export type B2BApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type B2BProspectLite = {
  id: string
  name: string
  sector?: string | null
  city?: string | null
  status?: string | null
  priority_score?: string | null
  assigned_owner_id?: string | null
  next_follow_up_at?: string | null
  next_action?: string | null
  decision_maker_name?: string | null
  decision_maker_email?: string | null
  decision_maker_phone?: string | null
}

export type B2BContactLite = {
  id: string
  prospect_id: string
  name: string
  role?: string | null
  phone?: string | null
  email?: string | null
  preferred_channel?: string | null
  is_decision_maker?: boolean | null
}

export type B2BOutreachLog = {
  id: string
  prospect_id: string
  contact_id?: string | null
  channel: string
  template_key?: string | null
  subject?: string | null
  message_body?: string | null
  outcome: string
  sent_by?: string | null
  sent_at?: string | null
  next_follow_up_at?: string | null
  created_at?: string | null
  prospect?: B2BProspectLite | null
  contact?: B2BContactLite | null
}

export type B2BCallLog = {
  id: string
  prospect_id: string
  contact_id?: string | null
  caller_id?: string | null
  call_type?: string | null
  call_result?: string | null
  duration_minutes?: number | null
  summary?: string | null
  objections?: string | null
  decision_maker_identified?: boolean | null
  next_step?: string | null
  next_follow_up_at?: string | null
  created_at?: string | null
  prospect?: B2BProspectLite | null
  contact?: B2BContactLite | null
}

export type B2BMeeting = {
  id: string
  prospect_id: string
  meeting_type?: string | null
  status: string
  scheduled_at?: string | null
  location?: string | null
  video_link?: string | null
  agenda?: string | null
  notes?: string | null
  needs_identified?: string | null
  objections?: string | null
  decision_process?: string | null
  budget_discussion?: string | null
  next_step?: string | null
  follow_up_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  prospect?: B2BProspectLite | null
}

export type B2BTask = {
  id: string
  title: string
  task_type?: string | null
  prospect_id?: string | null
  assigned_to?: string | null
  priority: string
  due_date?: string | null
  status: string
  description?: string | null
  created_by?: string | null
  completed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  prospect?: B2BProspectLite | null
}

export type B2BExecutionSnapshot = {
  prospects: B2BProspectLite[]
  contacts: B2BContactLite[]
  outreach: B2BOutreachLog[]
  calls: B2BCallLog[]
  meetings: B2BMeeting[]
  tasks: B2BTask[]
}

export const OUTREACH_CHANNELS = ['Email', 'Phone', 'WhatsApp', 'LinkedIn', 'Instagram', 'In-person visit', 'Referral introduction'] as const
export const OUTREACH_OUTCOMES = ['No response', 'Positive reply', 'Negative reply', 'Asked for info', 'Meeting booked', 'Wrong contact', 'Follow up later', 'Not interested'] as const
export const CALL_RESULTS = ['No answer', 'Wrong number', 'Gatekeeper answered', 'Decision maker reached', 'Interested', 'Not interested', 'Meeting booked', 'Asked to send email', 'Follow up later'] as const
export const CALL_TYPES = ['First call', 'Follow-up', 'Proposal discussion', 'Negotiation', 'Partnership qualification'] as const
export const MEETING_TYPES = ['Discovery meeting', 'Partnership presentation', 'Proposal review', 'Negotiation meeting', 'Pilot preparation', 'Account review'] as const
export const MEETING_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-show', 'Rescheduled'] as const
export const TASK_TYPES = ['Research prospect', 'Find decision maker', 'Send first email', 'Make call', 'Send WhatsApp', 'Connect on LinkedIn', 'Book meeting', 'Prepare proposal', 'Send proposal', 'Follow up proposal', 'Update CRM', 'Prepare report', 'Visit prospect', 'Internal validation'] as const
export const TASK_STATUSES = ['To Do', 'In Progress', 'Blocked', 'Done', 'Overdue', 'Cancelled'] as const
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const

export const OUTREACH_TEMPLATES = [
  {
    key: 'hotel_first_contact',
    label: 'Hotel first contact',
    sector: 'Hotels',
    subject: 'Opportunité de partenariat pour renforcer l’expérience familiale',
    body: `Bonjour [Nom],\n\nJe me permets de vous contacter au nom d’ANGELCARE, une structure spécialisée dans les solutions d’accompagnement, d’animation et de services dédiés aux enfants et aux familles.\n\nNous développons actuellement des partenariats avec des hôtels souhaitant renforcer leur expérience client familiale à travers des services tels que l’accompagnement enfants, l’animation ludique, le support kids club, la garde encadrée et les solutions événementielles pour familles.\n\nSeriez-vous disponible pour un court échange cette semaine afin d’explorer une collaboration possible ?\n\nBien cordialement,\nANGELCARE`,
  },
  {
    key: 'clinic_first_contact',
    label: 'Pediatric clinic first contact',
    sector: 'Clinics',
    subject: 'Collaboration ANGELCARE x [Nom de la clinique]',
    body: `Bonjour [Nom],\n\nJe vous contacte au nom d’ANGELCARE, une structure dédiée aux solutions pour l’enfance, l’accompagnement familial et le développement de services autour de l’enfant.\n\nNous souhaitons développer des partenariats avec des cliniques pédiatriques et professionnels de santé afin de proposer un accompagnement complémentaire aux familles : orientation parentale, activités de développement, programmes éducatifs et support aux familles.\n\nSeriez-vous disponible pour un échange de 15 minutes cette semaine ?\n\nBien cordialement,\nANGELCARE`,
  },
  {
    key: 'meeting_confirmation',
    label: 'Meeting confirmation',
    sector: 'General',
    subject: 'Confirmation de notre échange ANGELCARE',
    body: `Bonjour [Nom],\n\nMerci pour votre retour. Je vous confirme notre échange concernant une collaboration potentielle avec ANGELCARE.\n\nObjectif : comprendre vos besoins familles/enfants et identifier le format de partenariat le plus pertinent.\n\nBien cordialement,\nANGELCARE`,
  },
  {
    key: 'proposal_follow_up',
    label: 'Proposal follow-up',
    sector: 'General',
    subject: 'Suivi proposition de partenariat ANGELCARE',
    body: `Bonjour [Nom],\n\nJe me permets de revenir vers vous concernant la proposition de partenariat ANGELCARE transmise récemment.\n\nNous restons disponibles pour l’adapter à vos priorités opérationnelles et définir un pilote simple à lancer.\n\nBien cordialement,\nANGELCARE`,
  },
]
