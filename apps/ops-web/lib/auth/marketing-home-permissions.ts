export const MARKETING_HOME_PERMISSIONS = [
  'marketing.home.view','marketing.home.manage','marketing.campaigns.view','marketing.campaigns.manage','marketing.content.view','marketing.content.manage','marketing.partnerships.view','marketing.ai.view','marketing.ai.execute'
]
export function canAccessMarketingHome(user:any){ const role=String(user?.role_key||user?.role||'').toLowerCase(); const p=Array.isArray(user?.permissions)?user.permissions:[]; return ['ceo','admin','direction','marketing_director','marketing'].includes(role) || p.includes('*') || p.includes('marketing.home.view') || p.includes('market_os.view') }
