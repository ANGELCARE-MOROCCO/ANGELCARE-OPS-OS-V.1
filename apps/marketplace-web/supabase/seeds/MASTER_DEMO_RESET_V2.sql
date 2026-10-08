\set ON_ERROR_STOP on
-- Factory reset orchestration. DO NOT EXECUTE in authoring mission.
-- Permanent school/tenant/config/access/auth authorities are never targets.
begin;
select set_config('sanila.demo_reset_write','on',true);
do $$
declare c public.sanila_demo_configs%rowtype;t text;pending text[];next_pending text[];before_count bigint;
begin
 select * into c from public.sanila_demo_configs where id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid for update;
 if not found or c.school_id<>'8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid or c.operator_tenant_id<>'85a655be-a92b-4b82-8e60-130f4e7c8e2f'::uuid
  or c.classification<>'master_demo' or not c.active or c.billing_mode<>'non_billable' or c.safety_status<>'enforced'
 then raise exception 'RESET_REFUSED_NOT_EXACT_MASTER_DEMO';end if;
 if not pg_try_advisory_xact_lock(hashtextextended('sanila-master-demo-v2:'||c.id::text,0)) then raise exception 'RESET_REFUSED_ALREADY_RUNNING';end if;
 select count(*) into before_count from public.sanila_demo_fixture_registry where config_id=c.id and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2';
 if before_count<>127177 then raise exception 'RESET_REFUSED_REGISTRY_COUNT expected 127177 got %',before_count;end if;
 update public.sanila_demo_configs set reset_status='running',reset_started_at=clock_timestamp(),seed_health='degraded',reset_failure=null where id=c.id;

 select array_agg(distinct table_name order by table_name) into pending from public.sanila_demo_mutation_journal
  where config_id=c.id and mutation_kind='insert' and reset_run_id is null;
 loop
  next_pending:=array[]::text[];
  foreach t in array coalesce(pending,array[]::text[]) loop
   begin
    execute format('delete from public.%I x using public.sanila_demo_mutation_journal j where j.config_id=$1 and j.table_name=%L and j.row_id=x.id and j.mutation_kind=''insert'' and j.reset_run_id is null',t,t) using c.id;
   exception when foreign_key_violation then next_pending:=array_append(next_pending,t);end;
  end loop;
  exit when coalesce(array_length(next_pending,1),0)=0;
  if array_length(next_pending,1)=array_length(pending,1) then raise exception 'RESET_DEPENDENCY_BLOCKED: %',array_to_string(next_pending,',');end if;
  pending:=next_pending;
 end loop;

 -- Canonical updates/deletes are restored by deterministic upsert below.
 -- Non-canonical rows existing before a Demo session remain untouched. The
 -- journal deliberately remains intact until reseed and postconditions pass.
end $$;

-- Recreate/restore every deterministic canonical row inside this transaction.
\set SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION 1
\ir MASTER_DEMO_SEED_V2.sql
\unset SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION

do $$
declare c public.sanila_demo_configs%rowtype;registry_rows bigint;registry_tables integer;content_mismatches bigint;
begin
 select * into strict c from public.sanila_demo_configs where id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid for update;
 select count(*),count(distinct table_name) into registry_rows,registry_tables from public.sanila_demo_fixture_registry
 where config_id=c.id and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2';
 if registry_rows<>127177 or registry_tables<>111 then
  raise exception 'RESET_RESEED_POSTCONDITION_FAILED rows=% tables=%',registry_rows,registry_tables;
 end if;
 select count(*) into content_mismatches from public.sanila_demo_fixture_registry r
 where r.config_id=c.id and r.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
  and (r.canonical_content_hash<>md5(r.canonical_payload::text)
   or not public.sanila_master_demo_fixture_content_matches(r.table_name,r.fixture_id,r.canonical_payload));
 if content_mismatches<>0 then raise exception 'RESET_RESEED_CONTENT_POSTCONDITION_FAILED mismatches=%',content_mismatches;end if;
 if (select count(*) from public.angelcare360_attendance_sessions where school_id=c.school_id and session_date=date '2027-02-17')<>36
  or (select count(*) from public.angelcare360_attendance_records r join public.angelcare360_attendance_sessions s on s.id=r.attendance_session_id where r.school_id=c.school_id and s.session_date=date '2027-02-17')<>600
 then raise exception 'RESET_RESEED_TODAY_ATTENDANCE_POSTCONDITION_FAILED';end if;
 delete from public.sanila_demo_mutation_journal where config_id=c.id;
 update public.sanila_demo_configs set last_reset_at=clock_timestamp(),reset_status='idle',reset_started_at=null,reset_failure=null,seed_health='healthy',updated_at=clock_timestamp() where id=c.id;
end $$;
commit;
