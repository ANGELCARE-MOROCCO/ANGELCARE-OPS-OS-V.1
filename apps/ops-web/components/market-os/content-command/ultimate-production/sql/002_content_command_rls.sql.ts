export const contentCommandRlsSql = `
-- REVIEW BEFORE RUNNING
alter table market_content_assets enable row level security;
alter table market_content_deliverables enable row level security;
alter table market_content_approvals enable row level security;
alter table market_content_audit_log enable row level security;

-- Placeholder policies.
-- Replace role checks with your real role/permission source.
-- Do NOT use permissive policies in production.
`;