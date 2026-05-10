export const finalAiRuntimePlan = {
  serverOnly: true,
  reviewRequired: true,
  auditRequired: true,
  allowedActions: [
    'rewrite',
    'translate',
    'seo_optimize',
    'generate_caption',
    'score_quality',
  ],
  forbiddenWithoutHumanApproval: [
    'publish',
    'approve',
    'modify_brand_policy',
    'override_governance',
  ],
};