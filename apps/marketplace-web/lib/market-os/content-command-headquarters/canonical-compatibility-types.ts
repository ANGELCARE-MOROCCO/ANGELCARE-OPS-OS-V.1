export type CanonicalContentStatus = 'idea' | 'brief' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'revision' | 'archived'
export type CanonicalChannel = 'Blog' | 'Instagram' | 'Facebook' | 'TikTok' | 'LinkedIn' | 'Newsletter' | 'WhatsApp' | 'Landing Page' | 'Clinic Partner' | 'Ambassador Kit' | string
export type CanonicalPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type CompatibilityContentItem = {
  id: string
  title: string
  type: string
  channel: CanonicalChannel
  campaign: string
  owner: string
  reviewer: string
  status: CanonicalContentStatus
  priority: CanonicalPriority
  dueDate: string
  scheduledDate: string
  body: string
  objective: string
  audience: string
  angle: string
  cta: string
  assets: string[]
  brandScore: number
  seoKeyword: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type CompatibilityTask = {
  id: string
  contentId: string
  title: string
  owner: string
  status: 'todo' | 'doing' | 'done' | 'blocked'
  dueDate: string
  priority: CanonicalPriority
  notes: string
}

export type CompatibilityAsset = {
  id: string
  name: string
  type: 'Image' | 'Video' | 'PDF' | 'Script' | 'Brief' | 'Landing' | 'Presentation' | 'Other'
  channel: CanonicalChannel
  linkedContentId: string
  owner: string
  status: 'draft' | 'approved' | 'needs revision' | 'archived'
  url: string
  notes: string
}

export type CompatibilityBrief = {
  id: string
  title: string
  campaign: string
  audience: string
  objective: string
  message: string
  channel: CanonicalChannel
  owner: string
  dueDate: string
  status: 'draft' | 'ready' | 'used' | 'archived'
}

export type CompatibilityBrandRule = {
  id: string
  title: string
  category: 'Tone' | 'Compliance' | 'Visual' | 'Message' | 'CTA' | 'Medical sensitivity'
  required: boolean
  active: boolean
  notes: string
}

export type CompatibilityLog = {
  id: string
  timestamp: string
  action: string
  entity: string
  detail: string
}

export type CanonicalCompatibilityStore = {
  items: CompatibilityContentItem[]
  tasks: CompatibilityTask[]
  assets: CompatibilityAsset[]
  briefs: CompatibilityBrief[]
  rules: CompatibilityBrandRule[]
  logs: CompatibilityLog[]
}

export type CanonicalCommitPayload = {
  before: CanonicalCompatibilityStore
  after: CanonicalCompatibilityStore
  mutationAction: string
  detail: string
}
