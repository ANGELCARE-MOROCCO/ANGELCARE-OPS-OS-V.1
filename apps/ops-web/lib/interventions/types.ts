export type InterventionStatus =
  | 'Nouvelle'
  | 'À trier'
  | 'Validée'
  | 'En attente devis'
  | 'Devis envoyé'
  | 'Acceptée'
  | 'Ordre créé'
  | 'À assigner'
  | 'Planifiée'
  | 'Dispatchée'
  | 'En route'
  | 'Sur site'
  | 'En cours'
  | 'En pause'
  | 'Terminée'
  | 'Clôturée'
  | 'Annulée'
  | 'Escaladée'

export type RiskLevel = 'Faible' | 'Modéré' | 'Élevé' | 'Critique'
export type ServiceCategory = 'Médecin' | 'Infirmier' | 'Adult care' | 'Équipement' | 'Partenaire' | 'Transport'
export type StaffRole = 'Médecin' | 'Infirmier' | 'Aide-soignant' | 'Auxiliaire de vie' | 'Technicien Équipement' | 'Chauffeur' | 'Coordinateur' | 'Superviseur Médical'

export type InterventionTemplate = {
  id: string
  name: string
  category: ServiceCategory
  requiredRole: StaffRole
  durationMinutes: number
  basePriceMad: number
  checklist: string[]
  equipment: string[]
  riskLevel: RiskLevel
  requiredDocuments: string[]
  slaMinutes: number
}

export type InterventionRequest = {
  id: string
  reference: string
  patientName: string
  contactName: string
  phone: string
  city: string
  zone: string
  address: string
  category: ServiceCategory
  templateId: string
  requestedAt: string
  preferredWindow: string
  riskLevel: RiskLevel
  status: InterventionStatus
  estimatedAmountMad: number
  source: 'Téléphone' | 'WhatsApp' | 'Portail' | 'Partenaire' | 'Interne'
  notes: string
  consentStatus: 'À collecter' | 'Collecté' | 'Non requis'
}

export type InterventionOrder = {
  id: string
  reference: string
  requestId: string
  patientName: string
  city: string
  zone: string
  category: ServiceCategory
  status: InterventionStatus
  riskLevel: RiskLevel
  assignedStaffIds: string[]
  appointmentId?: string
  routeId?: string
  locationId?: string
  invoiceId?: string
  requiredEquipment: string[]
  checklist: string[]
  billingStatus: 'Non facturé' | 'Devis' | 'Facturable' | 'Facturé' | 'Payé'
  amountMad: number
  slaDueAt: string
  createdAt: string
}

export type InterventionAppointment = {
  id: string
  orderId: string
  reference: string
  startsAt: string
  endsAt: string
  actualStartAt?: string
  actualEndAt?: string
  status: InterventionStatus
  staffIds: string[]
  locationId: string
  routeId?: string
}

export type InterventionStaff = {
  id: string
  fullName: string
  role: StaffRole
  phone: string
  city: string
  zone: string
  availability: 'Disponible' | 'Occupé' | 'Indisponible' | 'Urgence seulement'
  workload: number
  certifications: string[]
  expiresAt?: string
  emergencyEligible: boolean
  skills: string[]
}

export type InterventionLocation = {
  id: string
  name: string
  type: 'Domicile patient' | 'Crèche / école partenaire' | 'Entreprise' | 'Clinique partenaire' | 'Dépôt équipement' | 'Bureau AngelCare' | 'Autre'
  city: string
  zone: string
  address: string
  accessNotes: string
  linkedPatient?: string
}

export type InterventionRoute = {
  id: string
  name: string
  date: string
  city: string
  zone: string
  staffId: string
  driverId?: string
  status: 'Brouillon' | 'Planifiée' | 'En cours' | 'Clôturée'
  stopIds: string[]
}

export type InterventionRouteStop = {
  id: string
  routeId: string
  orderId: string
  sequence: number
  plannedTime: string
  status: InterventionStatus
  notes: string
}

export type InterventionEquipment = {
  id: string
  name: string
  type: 'Matériel médical' | 'Mobilité' | 'Consommable' | 'Kit soin' | 'Diagnostic'
  serial?: string
  status: 'Disponible' | 'Réservé' | 'En intervention' | 'Chez patient' | 'En transit' | 'En maintenance' | 'Hors service' | 'Retourné'
  city: string
  zone: string
  assignedOrderId?: string
  nextMaintenanceAt?: string
}

export type InterventionAuditEvent = {
  id: string
  at: string
  actor: string
  role: string
  entityType: string
  entityId: string
  event: string
  summary: string
  riskLevel?: RiskLevel
}

export type InterventionIncident = {
  id: string
  orderId: string
  title: string
  riskLevel: RiskLevel
  status: 'Ouvert' | 'En revue' | 'Résolu'
  owner: string
  createdAt: string
}

export type InterventionInvoice = {
  id: string
  orderId: string
  reference: string
  patientName: string
  amountMad: number
  paidMad: number
  status: 'Brouillon' | 'Émise' | 'Partiellement payée' | 'Payée' | 'Impayée'
  dueAt: string
}

export type InterventionsState = {
  templates: InterventionTemplate[]
  requests: InterventionRequest[]
  orders: InterventionOrder[]
  appointments: InterventionAppointment[]
  staff: InterventionStaff[]
  locations: InterventionLocation[]
  routes: InterventionRoute[]
  routeStops: InterventionRouteStop[]
  equipment: InterventionEquipment[]
  audits: InterventionAuditEvent[]
  incidents: InterventionIncident[]
  invoices: InterventionInvoice[]
}

export type InterventionActionPayload = {
  action: string
  entityId?: string
  entityType?: string
  values?: Record<string, any>
}
