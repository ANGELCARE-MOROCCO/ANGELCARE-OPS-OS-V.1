export const contentCommandIndexesSql = `
create index if not exists idx_market_content_assets_status on market_content_assets(status);
create index if not exists idx_market_content_assets_campaign on market_content_assets(campaign_id);
create index if not exists idx_market_content_assets_due_date on market_content_assets(due_date);
create index if not exists idx_market_content_assets_scheduled_date on market_content_assets(scheduled_date);
create index if not exists idx_market_content_deliverables_campaign on market_content_deliverables(campaign_id);
create index if not exists idx_market_content_approvals_target on market_content_approvals(target_table, target_id);
create index if not exists idx_market_content_audit_entity on market_content_audit_log(entity_table, entity_id);
`;