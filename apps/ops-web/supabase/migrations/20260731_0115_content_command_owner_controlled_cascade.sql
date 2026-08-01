-- ANGELCARE Content Command Center 360
-- Owner-Controlled Cascade Disposal — atomic server-side execution.
-- Additive only. No table is dropped or altered.

create or replace function public.market_content_execute_owner_cascade(
  p_root_table text,
  p_root_id uuid,
  p_items jsonb,
  p_actor_id uuid,
  p_actor_name text,
  p_reason text,
  p_plan jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_relation jsonb;
  v_table text;
  v_field text;
  v_match text;
  v_disposition text;
  v_id uuid;
  v_parent_value text;
  v_deleted integer := 0;
  v_detached integer := 0;
  v_rows integer := 0;
  v_allowed_tables constant text[] := array[
    'market_content_signals','market_content_strategies','market_content_action_plans',
    'market_content_missions','market_content_mission_tasks','market_content_dossiers',
    'market_content_checkpoints','market_content_evidence','market_content_ai_reviews',
    'market_content_human_reviews','market_content_source_objects','market_content_source_replacements',
    'market_content_generated_samples','market_content_publication_packages',
    'market_content_performance_events','market_content_learning_records',
    'market_content_assets','market_content_deliverables','market_content_publications',
    'market_content_ai_runs','market_content_approvals','market_content_ai_directors',
    'market_ai_commands','market_ai_skills','market_ai_command_schedules','market_ai_missions',
    'market_ai_compilations','market_ai_compilation_items','market_ai_execution_jobs',
    'market_ai_tool_executions','market_ai_dead_letters','market_ai_decisions',
    'market_ai_doctrine_entries','market_ai_learning_events'
  ];
  v_nullable_fields constant text[] := array[
    'campaign_id','dossier_id','publication_package_id','asset_id','previous_source_id','new_source_id'
  ];
  v_array_fields constant text[] := array['signal_ids'];
begin
  if p_root_table is null or not (p_root_table = any(v_allowed_tables)) then
    raise exception 'CASCADE_ROOT_TABLE_NOT_ALLOWED:%', coalesce(p_root_table, 'NULL');
  end if;
  if p_root_id is null then raise exception 'CASCADE_ROOT_ID_REQUIRED'; end if;
  if coalesce(length(trim(p_reason)),0) < 8 then raise exception 'CASCADE_REASON_REQUIRED'; end if;
  if jsonb_typeof(coalesce(p_items,'[]'::jsonb)) <> 'array' then raise exception 'CASCADE_ITEMS_MUST_BE_ARRAY'; end if;

  insert into public.market_content_audit(actor_id,actor_name,action,entity_type,entity_id,detail)
  values(
    p_actor_id,
    coalesce(nullif(trim(p_actor_name),''),'Authorized operator'),
    'record.owner_cascade_delete.requested',
    p_root_table,
    p_root_id,
    jsonb_build_object('reason',p_reason,'plan',coalesce(p_plan,'{}'::jsonb),'itemCount',jsonb_array_length(coalesce(p_items,'[]'::jsonb)))
  );

  for v_item in select value from jsonb_array_elements(coalesce(p_items,'[]'::jsonb))
  loop
    v_table := v_item->>'table';
    v_disposition := v_item->>'disposition';
    v_id := nullif(v_item->>'id','')::uuid;
    if v_table is null or not (v_table = any(v_allowed_tables)) then
      raise exception 'CASCADE_ITEM_TABLE_NOT_ALLOWED:%', coalesce(v_table,'NULL');
    end if;
    if v_id is null then raise exception 'CASCADE_ITEM_ID_REQUIRED'; end if;

    if v_disposition = 'delete' then
      execute format('delete from public.%I where id = $1', v_table) using v_id;
      get diagnostics v_rows = row_count;
      v_deleted := v_deleted + v_rows;
    elsif v_disposition = 'detach' then
      if jsonb_typeof(coalesce(v_item->'relations','[]'::jsonb)) <> 'array' then
        raise exception 'CASCADE_RELATIONS_MUST_BE_ARRAY:%', v_id;
      end if;
      for v_relation in select value from jsonb_array_elements(coalesce(v_item->'relations','[]'::jsonb))
      loop
        v_field := v_relation->>'field';
        v_match := v_relation->>'match';
        v_parent_value := v_relation->>'parentValue';
        if v_match = 'contains' then
          if not (v_field = any(v_array_fields)) then raise exception 'CASCADE_ARRAY_FIELD_NOT_ALLOWED:%',coalesce(v_field,'NULL'); end if;
          execute format('update public.%I set %I = array_remove(%I, $1::uuid) where id = $2',v_table,v_field,v_field)
            using nullif(v_parent_value,'')::uuid,v_id;
          v_detached := v_detached + 1;
        elsif v_match = 'nullable_eq' then
          if not (v_field = any(v_nullable_fields)) then raise exception 'CASCADE_NULLABLE_FIELD_NOT_ALLOWED:%',coalesce(v_field,'NULL'); end if;
          execute format('update public.%I set %I = null where id = $1',v_table,v_field) using v_id;
          v_detached := v_detached + 1;
        else
          raise exception 'CASCADE_DETACH_MATCH_NOT_ALLOWED:%',coalesce(v_match,'NULL');
        end if;
      end loop;
    else
      raise exception 'CASCADE_DISPOSITION_NOT_ALLOWED:%',coalesce(v_disposition,'NULL');
    end if;
  end loop;

  execute format('delete from public.%I where id = $1',p_root_table) using p_root_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'CASCADE_ROOT_NOT_DELETED:%',p_root_id; end if;
  v_deleted := v_deleted + v_rows;

  insert into public.market_content_audit(actor_id,actor_name,action,entity_type,entity_id,detail)
  values(
    p_actor_id,
    coalesce(nullif(trim(p_actor_name),''),'Authorized operator'),
    'record.owner_cascade_delete.completed',
    p_root_table,
    p_root_id,
    jsonb_build_object('reason',p_reason,'deleted',v_deleted,'detached',v_detached,'plan',coalesce(p_plan,'{}'::jsonb))
  );

  return jsonb_build_object('deleted',true,'rootId',p_root_id,'deletedCount',v_deleted,'detachedCount',v_detached);
exception
  when others then
    raise;
end;
$$;

revoke all on function public.market_content_execute_owner_cascade(text,uuid,jsonb,uuid,text,text,jsonb) from public;
revoke all on function public.market_content_execute_owner_cascade(text,uuid,jsonb,uuid,text,text,jsonb) from anon;
revoke all on function public.market_content_execute_owner_cascade(text,uuid,jsonb,uuid,text,text,jsonb) from authenticated;
grant execute on function public.market_content_execute_owner_cascade(text,uuid,jsonb,uuid,text,text,jsonb) to service_role;

comment on function public.market_content_execute_owner_cascade(text,uuid,jsonb,uuid,text,text,jsonb)
is 'Executes an authorized Content Command cascade delete or detach scope as one PostgreSQL transaction. Service-role only.';
