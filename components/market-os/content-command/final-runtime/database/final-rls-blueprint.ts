export const finalRlsBlueprint = [
  {
    table: 'market_content_assets',
    policy: 'Allow authorized Market-OS content users to read assets.',
    sqlPreview: 'alter table market_content_assets enable row level security;',
    requiresRoleModel: true,
  },
  {
    table: 'market_content_audit_log',
    policy: 'Restrict audit visibility to governance/admin roles.',
    sqlPreview: 'alter table market_content_audit_log enable row level security;',
    requiresRoleModel: true,
  },
];