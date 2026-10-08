export type RelationshipSeverity = 'healthy' | 'attention' | 'critical'

export type RelationshipCustomer = {
  id: string
  reference: string
  name: string
  email: string | null
  phone: string | null
  accountKind: string
  status: string
  premium: boolean
  locale: string
  city: string | null
  createdAt: string
  updatedAt: string
  orderCount: number
  activeOrders: number
  bookingCount: number
  activeSubscriptions: number
  capturedRevenue: number
  averageOrderValue: number
  outstanding: number
  walletBalance: number
  refundTotal: number
  openCases: number
  criticalCases: number
  lastOrderAt: string | null
  lastActivityAt: string | null
  relationshipDays: number
  risk: RelationshipSeverity
  riskReasons: string[]
}

export type RelationshipMovement = {
  id: string
  kind: 'new' | 'premium' | 'returned' | 'high_value' | 'at_risk' | 'payment' | 'case'
  customerId: string
  reference: string
  title: string
  subtitle: string
  occurredAt: string
  value?: number
  severity: RelationshipSeverity
}

export type RelationshipAttention = {
  id: string
  customerId: string
  reference: string
  customerName: string
  customerValue: number
  premium: boolean
  reason: string
  detail: string
  exposure: number
  severity: RelationshipSeverity
  action: 'open' | 'recover' | 'contact' | 'resolve' | 'commercial'
}

export type RelationshipSegment = {
  key: string
  label: string
  count: number
  value: number
  severity: RelationshipSeverity
  description: string
}

export type RelationshipMove = {
  id: string
  rank: number
  title: string
  detail: string
  actionLabel: string
  targetCustomerId?: string | null
  targetCaseId?: string | null
  severity: RelationshipSeverity
}

export type RelationshipEvent = {
  id: string
  kind: 'customer' | 'order' | 'payment' | 'booking' | 'crm' | 'case' | 'wallet' | 'inquiry'
  reference: string
  title: string
  subtitle: string
  occurredAt: string
  customerId?: string | null
  amount?: number | null
  status?: string | null
}

export type FamilyRelationship = {
  id: string
  reference: string
  displayName: string
  customerId: string | null
  customerName: string | null
  guardians: Array<{ id: string; reference: string; name: string; relationship: string; email: string | null; phone: string | null; primary: boolean; status: string }>
  children: Array<{ id: string; reference: string; name: string; birthDate: string | null; schoolLevel: string | null; status: string }>
  addresses: Array<{ id: string; label: string; city: string; line: string; isDefault: boolean; status: string }>
  supportOpen: number
  requestOpen: number
  missionOpen: number
}

export type CrmRelationshipOpportunity = {
  id: string
  reference: string
  name: string
  stage: string
  estimatedValue: number
  probability: number
  expectedCloseAt: string | null
  nextAction: string | null
  nextActionAt: string | null
  accountId: string | null
  leadId: string | null
  updatedAt: string
}

export type CustomerCaseRecord = {
  id: string
  reference: string
  customerId: string | null
  customerName: string | null
  title: string
  status: string
  priority: string
  riskLevel: string
  nextAction: string | null
  dueAt: string | null
  exposure: number
  currency: string
  updatedAt: string
  workspaceKey: string
  sourceReference: string | null
}

export type CustomerRelationshipOverview = {
  generatedAt: string
  metrics: {
    active: number
    premium: number
    newThisMonth: number
    atRisk: number
    openOrders: number
    openBookings: number
    customerValue: number
    outstanding: number
    creditBalance: number
  }
  customers: RelationshipCustomer[]
  movements: RelationshipMovement[]
  attention: RelationshipAttention[]
  segments: RelationshipSegment[]
  nextMoves: RelationshipMove[]
  activity: RelationshipEvent[]
  families: FamilyRelationship[]
  opportunities: CrmRelationshipOpportunity[]
  cases: CustomerCaseRecord[]
}
