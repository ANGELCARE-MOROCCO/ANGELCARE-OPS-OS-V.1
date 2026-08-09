begin;
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='attention_required',updated_at=now() where introduced_by_mega_zip between 8 and 11 or module_key in('marketplace.child-development','marketplace.core','marketplace.crm','marketplace.partner-os');
update public.angelcare_marketplace_feature_flags set enabled=false,status='paused',reason='Safe rollback Ultra Delivery 2/5: data preserved.',updated_at=now() where flag_key in('marketplace.child-development.enabled','marketplace.core.enabled','marketplace.crm.enabled','marketplace.partner-os.enabled');
update public.angelcare_marketplace_partner_tenants set status='suspended',updated_at=now() where status in('trial','active');
update public.angelcare_marketplace_partner_module_activations set status='suspended',deactivated_at=now(),updated_at=now() where status='active';
update public.angelcare_marketplace_catalog_items set availability_status='unavailable',updated_at=now() where status='published';
commit;
