begin;
-- ANGELCARE Revenue Command OS MZ06 database rollback.
-- Restores the MZ05 command-kernel posture. Historical audit events remain.
delete from public.revenue_os_command_test_runs where case_id in (
 select id from public.revenue_os_command_test_cases where case_code like 'G300-EVAL-%'
);
delete from public.revenue_os_command_test_cases where case_code like 'G300-EVAL-%';
delete from public.revenue_os_command_graph_nodes where graph_id in (
 select id from public.revenue_os_command_graphs where code like 'GRAPH-G300-%'
);
delete from public.revenue_os_command_graphs where code like 'GRAPH-G300-%';
delete from public.revenue_os_command_schedules where code like 'SCH-G300-%';
delete from public.revenue_os_command_triggers where code like 'TRG-G300-%';
delete from public.revenue_os_command_versions where command_code like 'REV-G300-%';
delete from public.revenue_os_command_definitions where command_code like 'REV-G300-%';
delete from public.revenue_os_command_benchmarks where release_code='AC-REVENUE-OS-MZ06-GOLDEN-300';
delete from public.revenue_os_command_uniqueness_fingerprints where release_code='AC-REVENUE-OS-MZ06-GOLDEN-300';
delete from public.revenue_os_command_coverage where release_code='AC-REVENUE-OS-MZ06-GOLDEN-300';
delete from public.revenue_os_command_releases where release_code='AC-REVENUE-OS-MZ06-GOLDEN-300';
delete from public.revenue_os_permission_registry where permission_key in('revenue_os.commands.golden300.view','revenue_os.commands.golden300.audit');
delete from public.revenue_os_feature_flags where flag_key='revenue_os.golden_300';
update public.revenue_os_workspaces set label='Noyau des commandes',short_label='Commandes',
 description='Registre, routage, éligibilité, déclencheurs, graphes, simulation, versions et garde-fous.',
 href='/revenue-command-os/command-kernel',permission_key='revenue_os.commands.view',maturity_status='ready',
 updated_at=timezone('utc',now()) where workspace_key='intelligent-commands';
update public.revenue_os_installations set release_code='AC-REVENUE-OS-MZ05-COMMAND-KERNEL',
 module_version='5.0.0-phase5',execution_mode='shadow',contract_locked=true,external_actions_enabled=false,
 metadata=jsonb_build_object('cumulativeOver',jsonb_build_array('MZ01','MZ02','MZ03','MZ04'),'externalActions',false,
 'commandFamilies',12,'representativeCommands',12,'evaluationCases',70000,'openAiStrategyGeneration',false),
 updated_at=timezone('utc',now()) where installation_key='revenue-command-os';
insert into public.revenue_os_audit_events(event_id,action,actor_label,actor_type,resource_type,outcome,summary,metadata)
values('REVOS-MZ06-ROLLBACK-'||replace(gen_random_uuid()::text,'-',''),'command.golden300.rolled_back',
 'Revenue OS Rollback','migration','golden_300','success','MZ06 Golden 300 retiré; MZ05 restauré.',
 jsonb_build_object('releaseCode','AC-REVENUE-OS-MZ06-GOLDEN-300','externalActions',false));
drop table if exists public.revenue_os_command_benchmarks;
drop table if exists public.revenue_os_command_uniqueness_fingerprints;
drop table if exists public.revenue_os_command_coverage;
drop table if exists public.revenue_os_command_releases;
commit;
