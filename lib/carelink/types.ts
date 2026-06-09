export type CareLinkStatus =
  | 'assigned'
  | 'agent_notified'
  | 'agent_accepted'
  | 'agent_declined'
  | 'confirmed_by_dispatch'
  | 'en_route'
  | 'arrived'
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'client_validated'
  | 'incident_reported'
  | 'cancelled'
  | 'no_show'
  | 'closed'

export type CareLinkAgent = {
  id: string
  userId?: string | null
  staffId?: string | null
  agentCode: string
  fullName: string
  role: 'caregiver' | 'childcare_specialist' | 'field_agent' | 'dispatcher' | 'operations_manager'
  phone: string
  city: string
  zones: string[]
  skills: string[]
  languages: string[]
  availabilityStatus: 'available' | 'busy' | 'offline' | 'blocked'
  verificationStatus: 'verified' | 'pending' | 'expired'
  complianceStatus: 'clear' | 'attention' | 'blocked'
  ratingScore: number
  reliabilityScore: number
  documentsDue: number
}

export type CareLinkChecklistItem = {
  id: string
  label: string
  required: boolean
  completed: boolean
}

export type CareLinkMission = {
  id: string
  code: string
  serviceType: string
  serviceCategory: 'childcare' | 'caregiver' | 'home_support' | 'medical_support'
  clientName: string
  beneficiaryName: string
  beneficiaryAge?: string
  scheduledStart: string
  scheduledEnd: string
  city: string
  zone: string
  addressHint: string
  riskLevel: 'low' | 'medium' | 'high'
  priority: 'normal' | 'urgent' | 'critical'
  status: CareLinkStatus
  payEstimateMad: number
  hoursEstimate: number
  instructions: string[]
  safetyNotes: string[]
  checklist: CareLinkChecklistItem[]
  dispatcherName: string
  dispatcherPhone: string
  lastEventAt: string
}

export type CareLinkMessage = {
  id: string
  missionId?: string
  sender: 'dispatch' | 'agent' | 'system'
  title: string
  body: string
  createdAt: string
  urgent?: boolean
}

export type CareLinkDashboard = {
  agent: CareLinkAgent
  nextMission: CareLinkMission | null
  todayMissions: CareLinkMission[]
  upcomingMissions: CareLinkMission[]
  messages: CareLinkMessage[]
  alerts: Array<{ id: string; title: string; body: string; level: 'info' | 'warning' | 'critical' }>
  stats: {
    todayMissions: number
    weekHours: number
    pendingReports: number
    reliabilityScore: number
    documentsDue: number
  }
}
