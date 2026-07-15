export const finalSecurityGuardrails = {
  clientForbidden: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'publishing provider secrets',
    'admin-only mutation helpers',
  ],
  mandatory: [
    'server-side validation',
    'permission checks',
    'audit events',
    'human approval for critical actions',
    'rollback strategy',
  ],
};