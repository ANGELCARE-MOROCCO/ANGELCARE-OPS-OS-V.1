export type Angelcare360Area11View =
  | 'today'
  | 'families'
  | 'adults'
  | 'child-links'
  | 'authority'
  | 'pickup'
  | 'emergency'
  | 'households'
  | 'documents'
  | 'billing'
  | 'portal'
  | 'attention'
  | 'transitions'
  | 'history'

export type Angelcare360Area11DossierTab =
  | 'today'
  | 'overview'
  | 'children'
  | 'adults'
  | 'authority'
  | 'pickup'
  | 'emergency'
  | 'households'
  | 'documents'
  | 'billing'
  | 'portal'
  | 'actions'
  | 'history'

export type Angelcare360Area11Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'violet'

export type Angelcare360Area11Metric = {
  key: string
  label: string
  value: number | string
  detail: string
  tone: Angelcare360Area11Tone
  targetView: Angelcare360Area11View
}

export type Angelcare360Area11AdultSummary = {
  id: string
  parentCode: string | null
  fullName: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  preferredLanguage: string | null
  address: string | null
  status: string
  verificationState: string
  childCount: number
  childNames: string[]
  relationshipLabels: string[]
  guardianChildCount: number
  pickupChildCount: number
  emergencyChildCount: number
  billingChildCount: number
  portalState: string
  documentState: string
  householdCount: number
  attentionCount: number
}

export type Angelcare360Area11FamilySummary = {
  id: string
  displayName: string
  familyCode: string | null
  status: string
  verificationState: string
  childCount: number
  children: string[]
  adultCount: number
  adults: string[]
  primaryResponsible: string | null
  householdCount: number
  verifiedGuardianCount: number
  activePickupCount: number
  emergencyReadyCount: number
  billingResponsibleCount: number
  portalReadyCount: number
  openTaskCount: number
  attentionCount: number
  provisional: boolean
  primaryPersonId: string | null
}

export type Angelcare360Area11Attention = {
  id: string
  familyId: string | null
  personId: string | null
  studentId: string | null
  subjectLabel: string
  category: 'identity' | 'relationship' | 'authority' | 'pickup' | 'emergency' | 'address' | 'documents' | 'billing' | 'portal' | 'task'
  title: string
  detail: string
  consequence: string
  actionLabel: string
  tone: Angelcare360Area11Tone
  operation?: string | null
  deepLink?: string | null
}

export type Angelcare360Area11TimelineEvent = {
  id: string
  at: string | null
  category: string
  title: string
  detail: string
  source: string
  tone: Angelcare360Area11Tone
}

export type Angelcare360Area11Dossier = {
  kind: 'family' | 'person'
  id: string
  title: string
  family: Angelcare360Area11FamilySummary | null
  adult: Angelcare360Area11AdultSummary | null
  children: Array<Record<string, unknown>>
  adults: Array<Record<string, unknown>>
  relationships: Array<Record<string, unknown>>
  guardianAuthorities: Array<Record<string, unknown>>
  authorityRestrictions: Array<Record<string, unknown>>
  pickupAuthorizations: Array<Record<string, unknown>>
  emergencyContacts: Array<Record<string, unknown>>
  households: Array<Record<string, unknown>>
  householdMemberships: Array<Record<string, unknown>>
  addresses: Array<Record<string, unknown>>
  identityVerifications: Array<Record<string, unknown>>
  documents: Array<Record<string, unknown>>
  billingResponsibilities: Array<Record<string, unknown>>
  portalRelationships: Array<Record<string, unknown>>
  transitions: Array<Record<string, unknown>>
  tasks: Array<Record<string, unknown>>
  notes: Array<Record<string, unknown>>
  admissionHandover: Array<Record<string, unknown>>
  student360Links: Array<Record<string, unknown>>
  timeline: Angelcare360Area11TimelineEvent[]
  sourceWarnings: string[]
}

export type Angelcare360Area11CommandData = {
  view: Angelcare360Area11View
  school: { id: string; name: string }
  academicYear: { id: string | null; label: string }
  metrics: Angelcare360Area11Metric[]
  families: Angelcare360Area11FamilySummary[]
  adults: Angelcare360Area11AdultSummary[]
  attention: Angelcare360Area11Attention[]
  selectedDossier: Angelcare360Area11Dossier | null
  sourceWarnings: string[]
  permissions: string[]
  generatedAt: string
}

export type Angelcare360Area11MutationRequest = {
  operation: string
  subjectKind: 'family' | 'person' | 'student'
  subjectId: string
  idempotencyKey: string
  payload?: Record<string, unknown>
}

export type Angelcare360Area11MutationResult = {
  ok: boolean
  operation: string
  subjectKind: 'family' | 'person' | 'student'
  subjectId: string
  receiptId?: string | null
  message: string
  deepLink?: string | null
  refresh?: boolean
  data?: Record<string, unknown> | null
}
