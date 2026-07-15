import type {
  Phase20AiOutput,
  Phase20AiSafetyGate,
  Phase20AiTask,
  Phase20PromptTemplate,
} from './phase20-ai-types';

export const phase20AiTasks: Phase20AiTask[] = [
  {
    id: 'ai-task-001',
    title: 'Rewrite core service brochure intro',
    action: 'rewrite_professional',
    language: 'fr',
    status: 'needs_review',
    riskLevel: 'medium',
    owner: 'Content Lead',
    createdAt: 'Recent',
  },
  {
    id: 'ai-task-002',
    title: 'Generate Arabic captions for trust campaign',
    action: 'generate_caption',
    language: 'ar',
    status: 'queued',
    riskLevel: 'low',
    owner: 'Marketing Ops',
    createdAt: 'Recent',
  },
  {
    id: 'ai-task-003',
    title: 'SEO optimize family support page',
    action: 'seo_optimize',
    language: 'fr',
    status: 'running',
    riskLevel: 'medium',
    owner: 'Marketing',
    createdAt: 'Recent',
  },
  {
    id: 'ai-task-004',
    title: 'Generate product sheet for post-hospital support',
    action: 'generate_product_sheet',
    language: 'fr',
    status: 'needs_review',
    riskLevel: 'high',
    owner: 'Content Lead',
    createdAt: 'Recent',
  },
];

export const phase20PromptTemplates: Phase20PromptTemplate[] = [
  {
    id: 'prompt-rewrite-fr',
    title: 'Professional Rewrite — FR',
    action: 'rewrite_professional',
    language: 'fr',
    systemInstruction: 'Rewrite the text with professional, clear, brand-safe marketing language.',
    userPromptPattern: 'Rewrite this AngelCare content in French: {{content}}',
    requiresHumanReview: true,
  },
  {
    id: 'prompt-caption-ar',
    title: 'Social Caption — AR',
    action: 'generate_caption',
    language: 'ar',
    systemInstruction: 'Generate concise Arabic social captions with respectful healthcare-oriented tone.',
    userPromptPattern: 'Create Arabic social captions for: {{campaignBrief}}',
    requiresHumanReview: true,
  },
  {
    id: 'prompt-seo-fr',
    title: 'SEO Optimization — FR',
    action: 'seo_optimize',
    language: 'fr',
    systemInstruction: 'Improve SEO title, meta description, headings, and keyword clarity.',
    userPromptPattern: 'Optimize this content for SEO: {{content}}',
    requiresHumanReview: true,
  },
];

export const phase20AiOutputs: Phase20AiOutput[] = [
  {
    id: 'output-001',
    taskId: 'ai-task-001',
    summary: 'Improved brochure introduction with clearer value proposition and stronger CTA.',
    qualityScore: 86,
    brandFitScore: 91,
    seoScore: 72,
    requiresApproval: true,
  },
  {
    id: 'output-002',
    taskId: 'ai-task-004',
    summary: 'Generated structured product sheet draft with audience, benefits, CTA, and SEO fields.',
    qualityScore: 78,
    brandFitScore: 84,
    seoScore: 80,
    requiresApproval: true,
  },
];

export const phase20SafetyGates: Phase20AiSafetyGate[] = [
  {
    id: 'gate-brand-fit',
    title: 'Brand fit review',
    description: 'AI output must respect AngelCare tone, positioning, and approved brand language.',
    required: true,
    passed: true,
  },
  {
    id: 'gate-human-approval',
    title: 'Human approval required',
    description: 'AI output should not be published without review and approval.',
    required: true,
    passed: true,
  },
  {
    id: 'gate-medical-claims',
    title: 'Sensitive claims check',
    description: 'Healthcare-related wording should avoid unsupported medical claims.',
    required: true,
    passed: false,
  },
  {
    id: 'gate-translation-check',
    title: 'Translation verification',
    description: 'Multilingual outputs should be checked before campaign use.',
    required: true,
    passed: false,
  },
];