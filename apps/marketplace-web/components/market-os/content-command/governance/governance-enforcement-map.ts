export const governanceEnforcementMap = {
  publishing: 'human-approved',
  aiGeneration: 'review-required',
  analytics: 'read-safe',
  campaignDeletion: 'executive-only',
  escalationRouting: 'audit-required',
}