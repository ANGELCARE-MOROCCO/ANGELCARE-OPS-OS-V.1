export type CampaignMode = 'portfolio'|'architecture'|'waves'|'capacity'|'experiments'|'live'|'closure'
export type CampaignStatus = 'candidate'|'draft'|'under_review'|'authorized'|'active'|'paused'|'completed'|'closed'|'cancelled'|'archived'|'superseded'

export type CampaignContentObject = {
  id:string
  title:string
  role:'hero'|'support'|'education'|'authority'|'conversion'|'follow_up'|'experiment'
  family:'digital'|'print_offline'|'corporate_document'
  format:string
  channel:string
  language:string
  audience:string
  mandatory:boolean
  status:'proposed'|'ready'|'created'|'blocked'|'reused'|'omitted'|'superseded'
  waveId:string|null
  dossierId?:string|null
  reuseDossierId?:string|null
}
export type CampaignWave = {
  id:string
  name:string
  purpose:string
  status:'draft'|'ready'|'active'|'paused'|'completed'|'cancelled'
  startAt:string|null
  endAt:string|null
  channels:string[]
  contentIds:string[]
  dependencies:string[]
  measurementWindowDays:number
  override?:{reason:string;actor:string;at:string}|null
}
export type CampaignCapacityLine = {
  role:string
  requiredHours:number
  availableHours:number
  reservedHours:number
  owner:string
  status:'healthy'|'tight'|'overloaded'|'unassigned'
}
export type CampaignExperiment = {
  id:string
  title:string
  hypothesis:string
  variable:string
  control:string
  variants:string[]
  audience:string
  channel:string
  metric:string
  stopCondition:string
  status:'draft'|'authorized'|'running'|'decision_required'|'completed'|'cancelled'
  decision?:string|null
}
export type CampaignProfile = {
  kind:'campaign_operating_profile'
  version:1
  classification:{campaignType:string;serviceLines:string[];audiences:string[];geographies:string[];languages:string[];funnelStages:string[];opportunityIds:string[]}
  charter:{executivePurpose:string;businessObjective:string;expectedOutcome:string;hypothesis:string;offer:string;primaryMessage:string;proofRequirements:string[];brandConstraints:string[];risks:string[];dependencies:string[];successConditions:string[];measurementPlan:string;ownerName:string;sponsorName:string;startAt:string|null;endAt:string|null;preparationDeadline:string|null}
  architecture:{audienceSegments:Array<{name:string;tension:string;desiredAction:string}>;messageSystem:Array<{level:string;message:string;proof:string;cta:string}>;contentSystem:CampaignContentObject[]}
  waves:CampaignWave[]
  capacity:CampaignCapacityLine[]
  budget:{currency:'Dh';estimatedInternal:number;external:number;media:number;distribution:number;contingency:number;approved:number;committed:number;actual:number;valueHypothesis:string}
  experiments:CampaignExperiment[]
  governance:{status:CampaignStatus;approvedBy?:string|null;approvedAt?:string|null;conditions:string[];decisionReason?:string|null;externalCampaignId?:string|null;externalCampaignHref:'/market-os/campaign-lifecycle'}
  live:{activeWaveId:string|null;incidents:Array<{id:string;title:string;severity:'low'|'medium'|'high'|'critical';status:'open'|'resolved';resolution?:string|null}>;nextAction:string}
  conversion:{status:'not_started'|'partial'|'completed';actionPlanId?:string|null;records:Array<{dossierId:string;missionId:string;contentCode:string;contentObjectId:string;waveId:string|null}>}
  closure:{executiveConclusion:string;objectiveAchievement:string;omittedContent:string[];budgetConclusion:string;capacityConclusion:string;experimentConclusion:string;performanceConclusion:string;attributionConclusion:string;lessons:string[];reusableAssets:string[];decision:'renew'|'extend'|'archive'|'supersede'|'retire'|null;closedBy?:string|null;closedAt?:string|null}
}

export type CampaignRecord = {
  id:string
  code:string
  title:string
  status:string
  updatedAt:string
  profile:CampaignProfile
  linkedDossiers:Array<{id:string;title:string;status:string;progress:number;readiness:number;channel:string;contentCode:string}>
  linkedMissions:Array<{id:string;title:string;status:string;progress:number}>
}

export type CampaignSnapshot = {
  generatedAt:string
  campaigns:CampaignRecord[]
  opportunities:Array<{id:string;code:string;title:string;status:string;score:number;origin:string;serviceLine:string;audience:string;campaignObjective:string;publicationWindowStart:string|null}>
  canonicalCampaigns:Array<{id:string;title:string;status:string;startDate:string|null;endDate:string|null;updatedAt:string}>
  rollups:{total:number;candidate:number;authorized:number;active:number;atRisk:number;readyForClosure:number;contentObjects:number;capacityOverloads:number}
  capability:{canonicalRegistryAvailable:boolean;canonicalHref:string;manualContinuity:true}
}

export const modeLabels:Record<CampaignMode,string>={portfolio:'Portfolio',architecture:'Architecture',waves:'Waves & calendrier',capacity:'Capacité & budget',experiments:'Expérimentation',live:'Mission Control',closure:'Clôture'}
export const statusLabels:Record<CampaignStatus,string>={candidate:'Candidate',draft:'Brouillon',under_review:'À autoriser',authorized:'Autorisée',active:'Active',paused:'Suspendue',completed:'Terminée',closed:'Clôturée',cancelled:'Annulée',archived:'Archivée',superseded:'Supersédée'}
