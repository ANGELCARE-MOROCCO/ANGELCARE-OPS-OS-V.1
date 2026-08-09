begin;
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='blocked',updated_at=now() where module_key in('academy-engine','provider-workforce','operations-execution');
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Ultra Delivery 4/5 safe rollback — records preserved',updated_at=now() where flag_key in('marketplace.academy.enabled','marketplace.providers.enabled','marketplace.operations.enabled');
update public.angelcare_marketplace_operations_missions set status='suspended',next_action='Review required after safe rollback',updated_at=now() where status not in('closed','cancelled','suspended');
update public.angelcare_marketplace_academy_cohorts set status='cancelled',updated_at=now() where status in('scheduled','active','assessment','completion_review');
update public.angelcare_marketplace_provider_profiles set operational_status='temporarily_blocked',next_action='Operational eligibility review required',updated_at=now() where operational_status in('active','restricted');
commit;
