\set ON_ERROR_STOP on

-- SANILA_MASTER_DEMO_LIVING_SCHOOL_DIGITAL_TWIN_V1
-- SOURCE ONLY. Codex did not execute this file.
-- Requires MASTER_DEMO_SEED.sql to have been installed and seeded once so every
-- owned row is present in sanila_demo_fixture_registry.

begin;

create or replace function public.sanila_reset_master_demo_living_school_v1(p_requested_by uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  c public.sanila_demo_configs%rowtype;
  run_id uuid:=gen_random_uuid();
  pending_tables text[]; next_pending text[]; t text; before_count bigint;
  result jsonb;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('sanila-living-school-seed:5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a',0)) then
    raise exception 'Master Demo seed/reset is already running';
  end if;
  select * into c from public.sanila_demo_configs
  where id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid for update;
  if not found
    or c.operator_tenant_id<>'85a655be-a92b-4b82-8e60-130f4e7c8e2f'::uuid
    or c.school_id<>'8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid
    or c.school_admin_app_user_id<>'25d16e25-2dd7-4c19-afb9-800609b3ba8a'::uuid
    or c.classification<>'master_demo' or not c.active
    or c.billing_mode<>'non_billable' or c.safety_status<>'enforced'
    or not public.sanila_is_master_demo_school(c.school_id) then
    raise exception 'RESET_REFUSED_NOT_EXACT_MASTER_DEMO';
  end if;
  if not exists(select 1 from public.angelcare360_operator_tenants t where t.id=c.operator_tenant_id and t.school_id=c.school_id and t.tenant_slug='sanila-master-demo' and t.status='active') then
    raise exception 'RESET_REFUSED_TENANT_LINK_MISMATCH';
  end if;
  select count(*) into before_count from public.sanila_demo_fixture_registry where config_id=c.id;
  if before_count<>17714 then
    raise exception 'RESET_REFUSED_REGISTRY_COUNT: got %, expected 17714',before_count;
  end if;

  insert into public.sanila_demo_reset_runs(id,config_id,status,requested_by,target_school_id,seed_version,detail)
  values(run_id,c.id,'running',p_requested_by,c.school_id,'SANILA_MASTER_DEMO_LIVING_SCHOOL_V1',jsonb_build_object('mode','fixture_registry_only','fixture_count',before_count));
  update public.sanila_demo_configs set reset_status='running',reset_started_at=now(),reset_failure=null,seed_health='degraded',updated_at=now() where id=c.id;

  begin
    select array_agg(table_name order by table_name) into pending_tables
    from (select distinct table_name from public.sanila_demo_fixture_registry where config_id=c.id) q;
    loop
      next_pending:=array[]::text[];
      foreach t in array coalesce(pending_tables,array[]::text[]) loop
        begin
          execute format('delete from public.%I x using public.sanila_demo_fixture_registry r where r.config_id=$1 and r.table_name=$2 and x.id=r.fixture_id',t)
          using c.id,t;
        exception when foreign_key_violation then
          next_pending:=array_append(next_pending,t);
        end;
      end loop;
      exit when coalesce(array_length(next_pending,1),0)=0;
      if array_length(next_pending,1)=array_length(pending_tables,1) then
        raise exception 'RESET_ABORTED_FK_CYCLE_OR_NON_FIXTURE_REFERENCE: %',array_to_string(next_pending,',');
      end if;
      pending_tables:=next_pending;
    end loop;
    delete from public.sanila_demo_fixture_registry where config_id=c.id;
    result:=public.sanila_seed_master_demo_living_school_v1();
    if not coalesce((result->>'ok')::boolean,false) then raise exception 'Post-reset seed failed: %',result; end if;
    if (select count(*) from public.sanila_demo_fixture_registry where config_id=c.id)<>17714 then
      raise exception 'Post-reset registry count mismatch';
    end if;
    update public.sanila_demo_configs set last_reset_at=now(),reset_status='idle',reset_started_at=null,reset_failure=null,seed_health='healthy',updated_at=now() where id=c.id;
    update public.sanila_demo_reset_runs set status='succeeded',completed_at=now(),detail=detail||jsonb_build_object('result',result) where id=run_id;
    insert into public.sanila_demo_access_events(config_id,actor_user_id,event_type,severity,metadata)
    values(c.id,p_requested_by,'living_school_v1_reset_completed','warning',jsonb_build_object('run_id',run_id,'deleted_scope','registered_fixture_ids_only','preserved','school,tenant,admin identity,roles,grants,sessions,access events,reset history,unregistered rows'));
    return jsonb_build_object('ok',true,'run_id',run_id,'fixture_count',17714,'seed',result);
  exception when others then
    update public.sanila_demo_configs set reset_status='failed',reset_failure=sqlerrm,seed_health='failed',updated_at=now() where id=c.id;
    update public.sanila_demo_reset_runs set status='failed',completed_at=now(),detail=detail||jsonb_build_object('error',sqlerrm,'transactional_delete_rolled_back',true) where id=run_id;
    return jsonb_build_object('ok',false,'run_id',run_id,'error',sqlerrm,'transactional_delete_rolled_back',true);
  end;
end $$;

revoke all on function public.sanila_reset_master_demo_living_school_v1(uuid) from public,anon,authenticated;
grant execute on function public.sanila_reset_master_demo_living_school_v1(uuid) to service_role;

-- Applying this file installs/updates the reset authority only.
-- Human execution after review, with an authorized app_users.id:
-- select public.sanila_reset_master_demo_living_school_v1('<actor-uuid>'::uuid);

commit;
