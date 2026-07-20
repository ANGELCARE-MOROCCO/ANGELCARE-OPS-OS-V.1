export type WorkspaceDomain = 'account' | 'execute' | 'deal' | 'intelligence' | 'more'

export type WorkspaceSession = {
  prospectId: string
  opportunityId?: string | null
  activePartnerId?: string | null
  activeContractId?: string | null
  activeSiteId?: string | null
  activeServiceId?: string | null
  activeActivationId?: string | null
  activeIssueId?: string | null
  activeGrowthOpportunityId?: string | null
  activeRenewalId?: string | null
  activeRecommendationId?: string | null
  activeRiskId?: string | null
  activeCoachingId?: string | null
  activeAutomationId?: string | null
  accountName?: string | null
  sourceUrl?: string | null
  sourceAdapter?: string | null
  updatedAt: string
}

export type WorkspaceHydration = {
  account: Record<string, any>
  partnerSummary?: Record<string, any> | null
  owner?: Record<string, any> | null
  contacts: Array<Record<string, any>>
  committee: Array<Record<string, any>>
  opportunities: Array<Record<string, any>>
  activeOpportunity?: Record<string, any> | null
  intelligence: {
    score?: Record<string, any> | null
    accountPlan?: Record<string, any> | null
    researchMissions: Array<Record<string, any>>
    evidence: Array<Record<string, any>>
    dataQuality: { score: number; completed: number; total: number; missing: string[] }
    commercialHealth: { score: number; level: string; reasons: string[] }
  }
  execution: {
    nextActions: Array<Record<string, any>>
    followups: Array<Record<string, any>>
    outreachStrategies: Array<Record<string, any>>
    communicationContexts: Array<Record<string, any>>
    communicationDrafts: Array<Record<string, any>>
    callBriefs: Array<Record<string, any>>
    fieldVisits: Array<Record<string, any>>
    meetings: {
      briefs: Array<Record<string, any>>
      notes: Array<Record<string, any>>
      outcomes: Array<Record<string, any>>
    }
    sequenceEnrollments: Array<Record<string, any>>
    stageHistory: Array<Record<string, any>>
  }
  deal: {
    offerConfiguration?: Record<string, any> | null
    pricing?: Record<string, any> | null
    margin?: Record<string, any> | null
    proposal?: Record<string, any> | null
    approvals: Array<Record<string, any>>
    discountRequests: Array<Record<string, any>>
    negotiationRoom?: Record<string, any> | null
    negotiationEvents: Array<Record<string, any>>
    counteroffer?: Record<string, any> | null
    objections: Array<Record<string, any>>
    closingReadiness?: Record<string, any> | null
    closingGate?: Record<string, any> | null
    contractRequirements: Array<Record<string, any>>
    paymentGate?: Record<string, any> | null
    paymentPromises: Array<Record<string, any>>
    rescueCases: Array<Record<string, any>>
    executiveInterventions: Array<Record<string, any>>
  }
  more: {
    timeline: Array<Record<string, any>>
    evidence: Array<Record<string, any>>
    attribution: Array<Record<string, any>>
    referrals: Array<Record<string, any>>
  }
  diagnostics: Record<string, string>
  refreshedAt: string
}


export type PartnerWorkspaceHydration = {
  partner: Record<string, any> | null
  account?: Record<string, any> | null
  opportunity?: Record<string, any> | null
  identity?: {
    sites: Array<Record<string, any>>
    services: Array<Record<string, any>>
    contacts: Array<Record<string, any>>
    documents: Array<Record<string, any>>
  }
  operate?: {
    handoffs: Array<Record<string, any>>
    activeHandoff?: Record<string, any> | null
    onboardingPlans: Array<Record<string, any>>
    onboardingTasks: Array<Record<string, any>>
    activationPlans: Array<Record<string, any>>
    activeActivation?: Record<string, any> | null
    activationGates: Array<Record<string, any>>
    firstServices: Array<Record<string, any>>
    hypercare: Array<Record<string, any>>
    issues: Array<Record<string, any>>
    activeIssue?: Record<string, any> | null
    correctiveActions: Array<Record<string, any>>
    reviews: Array<Record<string, any>>
  }
  growth?: {
    signals: Array<Record<string, any>>
    opportunities: Array<Record<string, any>>
    activeOpportunity?: Record<string, any> | null
    expansionPlans: Array<Record<string, any>>
    renewals: Array<Record<string, any>>
    activeRenewal?: Record<string, any> | null
    renewalMilestones: Array<Record<string, any>>
    churnRisks: Array<Record<string, any>>
    rescueCases: Array<Record<string, any>>
  }
  intelligence?: {
    performance: Array<Record<string, any>>
    latestPerformance?: Record<string, any> | null
    health: Array<Record<string, any>>
    latestHealth?: Record<string, any> | null
    missingData: string[]
  }
  tenders?: {
    tenders: Array<Record<string, any>>
    requirements: Array<Record<string, any>>
    compliance: Array<Record<string, any>>
  }
  more?: {
    timeline: Array<Record<string, any>>
    documents: Array<Record<string, any>>
    diagnostics: Record<string, string>
  }
  activeContext?: Record<string, string | null>
  diagnostics?: Record<string, string>
  refreshedAt: string
}


export type ManagementWorkspaceHydration = {
  command: { accounts:Array<Record<string,any>>; opportunities:Array<Record<string,any>>; partners:Array<Record<string,any>>; renewals:Array<Record<string,any>>; priorities:Array<Record<string,any>>; revenueAtRisk:number; decisionQueue:Array<Record<string,any>> }
  aiDirector: { recommendations:Array<Record<string,any>>; evidence:Array<Record<string,any>>; activeRecommendation?:Record<string,any>|null; generated:number; accepted:number }
  pipeline: { assessments:Array<Record<string,any>>; latestForecast?:Record<string,any>|null; forecasts:Array<Record<string,any>>; overrides:Array<Record<string,any>>; opportunities:Array<Record<string,any>> }
  risks: { items:Array<Record<string,any>>; open:Array<Record<string,any>>; activeRisk?:Record<string,any>|null; interventions:Array<Record<string,any>>; openInterventions:Array<Record<string,any>>; revenueAtRisk:number }
  team: { assessments:Array<Record<string,any>>; patterns:Array<Record<string,any>>; coachingMissions:Array<Record<string,any>>; activeCoaching?:Record<string,any>|null }
  territory: { snapshots:Array<Record<string,any>>; latest?:Record<string,any>|null }
  reports: { items:Array<Record<string,any>>; latest?:Record<string,any>|null }
  automation: { definitions:Array<Record<string,any>>; activeAutomation?:Record<string,any>|null; approvals:Array<Record<string,any>>; runs:Array<Record<string,any>>; killSwitches:Array<Record<string,any>> }
  activeContext?: Record<string,string|null>
  diagnostics?: Record<string,string>
  refreshedAt:string
}
