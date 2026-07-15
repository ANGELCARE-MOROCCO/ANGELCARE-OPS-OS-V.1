export type MOSRole = 'ceo' | 'manager' | 'agent';
export type MOSStatus = 'draft' | 'active' | 'review' | 'approved' | 'blocked' | 'archived';
export type MOSPriority = 'critical' | 'high' | 'medium' | 'low';

export type MarketEntityKind =
  | 'strategy'
  | 'mission'
  | 'task'
  | 'funnel'
  | 'offer'
  | 'pricing'
  | 'asset'
  | 'script'
  | 'expansion'
  | 'alert'
  | 'ambassador'
  | 'seo'
  | 'pr'
  | 'partnership';

export interface MOSBaseEntity {
  id: string;
  kind: MarketEntityKind;
  title: string;
  owner: string;
  status: MOSStatus;
  priority?: MOSPriority;
  createdAt: string;
  updatedAt: string;
  driveUrl?: string;
  notes?: string;
  linkedIds?: string[];
  city?: string;
  segment?: string;
  score?: number;
  nextAction?: string;
}

export interface Strategy extends MOSBaseEntity {
  kind: 'strategy';
  type: 'market' | 'positioning' | 'acquisition' | 'expansion' | 'brand';
  objective: string;
  kpis: string[];
}

export interface Mission extends MOSBaseEntity {
  kind: 'mission';
  strategyId?: string;
  team: string[];
  slaHours: number;
}

export interface MOSTask extends MOSBaseEntity {
  kind: 'task';
  missionId?: string;
  assignee: string;
  dueDate: string;
  blocker?: string;
}

export interface Funnel extends MOSBaseEntity {
  kind: 'funnel';
  stages: { name: string; target: number; actual: number }[];
  offerId?: string;
  scriptIds: string[];
}

export interface Offer extends MOSBaseEntity {
  kind: 'offer';
  service: string;
  positioning: string;
  components: string[];
  targetSegment: string;
}

export interface Pricing extends MOSBaseEntity {
  kind: 'pricing';
  offerId?: string;
  basePriceMad: number;
  promoRule?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Asset extends MOSBaseEntity {
  kind: 'asset';
  assetType: 'image' | 'video' | 'document' | 'folder' | 'script' | 'brand';
  tags: string[];
}

export interface Script extends MOSBaseEntity {
  kind: 'script';
  scriptType: 'call' | 'whatsapp' | 'landing' | 'ad' | 'objection' | 'ambassador';
  version: string;
  content: string;
  approvedBy?: string;
}

export interface ExpansionPlan extends MOSBaseEntity {
  kind: 'expansion';
  readinessScore: number;
  checklist: { label: string; done: boolean }[];
}

export interface Alert extends MOSBaseEntity {
  kind: 'alert';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: MarketEntityKind;
  actionRequired: string;
}

export interface GenericMarketEntity extends MOSBaseEntity {
  kind: 'ambassador' | 'seo' | 'pr' | 'partnership';
  category?: string;
  channel?: string;
  impact?: string;
}

export type MarketRecord = Strategy | Mission | MOSTask | Funnel | Offer | Pricing | Asset | Script | ExpansionPlan | Alert | GenericMarketEntity;
