export type Phase20AiAction =
  | 'generate_caption'
  | 'rewrite_professional'
  | 'translate'
  | 'seo_optimize'
  | 'generate_cta'
  | 'generate_hashtags'
  | 'generate_product_sheet'
  | 'generate_campaign_variants'
  | 'score_content_quality';

export type Phase20AiLanguage = 'fr' | 'ar' | 'en';

export type Phase20AiTaskStatus =
  | 'queued'
  | 'running'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'failed';

export type Phase20AiRiskLevel = 'low' | 'medium' | 'high';

export interface Phase20AiTask {
  id: string;
  title: string;
  action: Phase20AiAction;
  language: Phase20AiLanguage;
  status: Phase20AiTaskStatus;
  riskLevel: Phase20AiRiskLevel;
  owner: string;
  createdAt: string;
}

export interface Phase20PromptTemplate {
  id: string;
  title: string;
  action: Phase20AiAction;
  language: Phase20AiLanguage;
  systemInstruction: string;
  userPromptPattern: string;
  requiresHumanReview: boolean;
}

export interface Phase20AiOutput {
  id: string;
  taskId: string;
  summary: string;
  qualityScore: number;
  brandFitScore: number;
  seoScore: number;
  requiresApproval: boolean;
}

export interface Phase20AiSafetyGate {
  id: string;
  title: string;
  description: string;
  required: boolean;
  passed: boolean;
}