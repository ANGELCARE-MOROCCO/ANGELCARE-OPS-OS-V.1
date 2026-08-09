begin;
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Ultra Delivery 5/5 safe rollback: authorities disabled while all evidence is preserved.',updated_at=now() where flag_key in('marketplace.trust-quality.enabled','marketplace.finance-authority.enabled','marketplace.analytics-security.enabled','marketplace.qa-launch.enabled');
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='blocked',updated_at=now() where module_key in('trust-quality-authority','finance-authority','analytics-security-assurance','qa-final-launch-authority');
update public.angelcare_marketplace_qa_release_candidates set status='paused',paused_at=coalesce(paused_at,now()),updated_at=now() where status in('approved_for_controlled_release','controlled_release','monitoring','general_release');
insert into public.angelcare_marketplace_launch_events(release_candidate_id,event_type,severity,status,description) select id,'safe_rollback.authority_disabled','critical','recorded','Final authorities disabled without deleting evidence.' from public.angelcare_marketplace_qa_release_candidates where status='paused';
commit;
