export const EXPERIENCE_TENANT_KEY='angelcare-internal'
export const DEFAULT_CX_SLA_HOURS={low:120,medium:72,high:24,critical:4} as const
export const MAX_REFUND_WITHOUT_EXECUTIVE_APPROVAL_DH=500
export const EXPERIENCE_POLICY={
  immutableIssuedDocuments:true,
  refundRequiresHumanApproval:true,
  fulfilmentRequiresConfirmedOrder:true,
  entitlementRequiresApprovedRelease:true,
  qualitySignalsFeedProductDesign:true,
  tavilyAllowed:false,
  openRouterAuthority:'advisory-only',
} as const
