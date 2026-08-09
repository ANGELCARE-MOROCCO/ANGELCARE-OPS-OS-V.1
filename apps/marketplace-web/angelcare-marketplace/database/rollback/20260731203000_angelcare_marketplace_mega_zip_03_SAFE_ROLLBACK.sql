begin;
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Safe rollback Mega ZIP 03',updated_at=now() where flag_key='marketplace.localization-intelligence.enabled';
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='degraded',updated_at=now() where route_prefix='/angelcare-marketplace/admin/localization';
update public.angelcare_marketplace_localization_scan_runs set status='cancelled',completed_at=coalesce(completed_at,now()) where status in('queued','running');
-- Records, versions, reviews, imports, translations and audit evidence are intentionally preserved.
commit;
