begin;

-- Conservative MZ17 database rollback.
-- It never enables external actions and does not delete the canonical command library.

update public.revenue_os_installations
set execution_mode='shadow',
    external_actions_enabled=false,
    contract_locked=true,
    release_code='AC-REVENUE-OS-MZ16-MEGA-PRODUCTION',
    module_version='16.0.0',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'mz17RollbackAt',timezone('utc',now()),
      'mz17RollbackReason','Application rollback requested; external actions remain disabled.'
    ),
    updated_at=timezone('utc',now())
where installation_key='revenue-command-os';

update public.revenue_os_system_checks
set status='attention',
    detail='MZ17 application rollback recorded. Re-run full consistency verification before activation.',
    recommended_action='Restore the MZ17 source package and execute the live acceptance checklist.',
    checked_at=timezone('utc',now()),
    updated_at=timezone('utc',now())
where check_key='revenue-os-production-consistency';

insert into public.revenue_os_audit_events(
  event_id,action,actor_label,actor_type,resource_type,outcome,summary,metadata
) values(
  'REVOS-MZ17-ROLLBACK-'||replace(gen_random_uuid()::text,'-',''),
  'production.consistency.repair.rolled_back','Revenue OS Migration','migration',
  'revenue_command_os','warning','Rollback MZ17 enregistré; posture Shadow conservée.',
  jsonb_build_object('externalActions',false,'recordedAt',timezone('utc',now()))
);

commit;
