begin;
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Ultra Delivery 3/5 safe rollback: records preserved',updated_at=now() where flag_key in('marketplace.b2b.establishments.enabled','marketplace.b2b.hospitality.enabled','marketplace.b2b.health-adjacent.enabled','marketplace.b2b.corporates.enabled');
update public.angelcare_marketplace_b2b_programs set status='paused',next_action='Réactivation requise après validation du rollback',updated_at=now() where status in('scheduled','active');
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='blocked',updated_at=now() where introduced_by_mega_zip between 12 and 15;
commit;
