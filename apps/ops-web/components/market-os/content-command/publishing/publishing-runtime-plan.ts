export const publishingRuntimePlan = {
  channels: [
    'meta',
    'linkedin',
    'tiktok',
    'whatsapp',
    'email',
    'google-business',
  ],

  executionRules: [
    'never publish directly from client',
    'queue all publishing actions',
    'require approval before dispatch',
    'log all publication attempts',
  ],
}