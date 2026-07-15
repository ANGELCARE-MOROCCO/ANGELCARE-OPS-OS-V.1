export const finalPublishingRuntimePlan = {
  mode: 'queued-human-approved',
  providers: ['meta', 'linkedin', 'tiktok', 'whatsapp', 'email'],
  rules: [
    'never publish directly from client',
    'require approved content status',
    'require channel compliance checks',
    'log dispatch attempt',
    'retry failed dispatch safely',
  ],
};