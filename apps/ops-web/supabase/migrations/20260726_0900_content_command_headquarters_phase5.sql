-- ANGELCARE Content Command Center 360 · Phase 5
-- Additive foundation: signals → strategy → missions → supervised dossiers → source vault → distribution.
begin;

create extension if not exists pgcrypto;

create sequence if not exists public.market_content_general_code_seq start 1;
create sequence if not exists public.market_content_dossier_code_seq start 1;

create or replace function public.market_content_next_code(p_prefix text)
returns text language sql volatile set search_path=public as $$
  select 'AC-' || upper(regexp_replace(coalesce(nullif(trim(p_prefix),''),'OBJ'),'[^A-Za-z0-9]+','','g')) || '-' || to_char(timezone('Africa/Casablanca',now()),'YYYY') || '-' || lpad(nextval('public.market_content_general_code_seq')::text,6,'0');
$$;

create or replace function public.market_content_next_content_code(p_family text,p_service text)
returns text language sql volatile set search_path=public as $$
  select 'AC-CONT-' || to_char(timezone('Africa/Casablanca',now()),'YYYY') || '-' ||
    case lower(coalesce(p_family,'')) when 'digital' then 'DIG' when 'print_offline' then 'PRT' when 'corporate_document' then 'DOC' else 'OTH' end || '-' ||
    upper(left(regexp_replace(coalesce(nullif(trim(p_service),''),'GEN'),'[^A-Za-z0-9]+','','g'),8)) || '-' || lpad(nextval('public.market_content_dossier_code_seq')::text,6,'0');
$$;

create table if not exists public.market_content_signals(
 id uuid primary key default gen_random_uuid(), code text not null unique, title text not null, summary text not null default '',
 source_type text not null default 'manual_observation', source_label text not null default '', source_url text,
 status text not null default 'captured' check(status in('captured','enriching','verified','qualified','converted','deferred','rejected','expired')),
 confidence integer not null default 0 check(confidence between 0 and 100), urgency integer not null default 0 check(urgency between 0 and 100), opportunity_score integer not null default 0 check(opportunity_score between 0 and 100),
 freshness text not null default 'current', services text[] not null default '{}', audiences text[] not null default '{}', cities text[] not null default '{}',
 evidence jsonb not null default '[]', ai_interpretation text, human_conclusion text, detected_at timestamptz not null default now(), next_scan_at timestamptz,
 created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists market_content_signals_status_idx on public.market_content_signals(status,opportunity_score desc);

create table if not exists public.market_content_strategies(
 id uuid primary key default gen_random_uuid(), code text not null unique, title text not null, problem_statement text not null default '', desired_perception text not null default '', business_objective text not null default '', content_objective text not null default '',
 status text not null default 'draft' check(status in('draft','review','approved','active','completed','suspended','archived')),
 services text[] not null default '{}', audiences text[] not null default '{}', cities text[] not null default '{}', journey_stages text[] not null default '{}',
 pillars jsonb not null default '[]', channel_plan jsonb not null default '[]', risks jsonb not null default '[]', measurement_doctrine jsonb not null default '{}', signal_ids uuid[] not null default '{}',
 owner_id uuid, owner_name text, approved_by uuid, approved_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.market_content_action_plans(
 id uuid primary key default gen_random_uuid(), strategy_id uuid not null references public.market_content_strategies(id) on delete cascade,
 code text not null unique, title text not null, objective text not null default '', status text not null default 'draft', start_date date,end_date date,
 deliverables jsonb not null default '[]', required_roles text[] not null default '{}', capacity_estimate_hours numeric(10,2) not null default 0,
 created_by uuid, created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.market_content_missions(
 id uuid primary key default gen_random_uuid(), code text not null unique, strategy_id uuid references public.market_content_strategies(id) on delete set null,
 action_plan_id uuid references public.market_content_action_plans(id) on delete set null,dossier_id uuid,
 title text not null, objective text not null default '',scope text not null default '',out_of_scope text not null default '',success_definition text not null default '',
 status text not null default 'proposed' check(status in('proposed','qualifying','scope_approved','ready','assigned','accepted','in_progress','checkpoint','submitted','ai_review','human_review','revision','validated','closed','blocked','paused','cancelled','archived')),
 priority text not null default 'medium',origin_type text not null default 'manual',origin_ref text,assigned_to uuid,assigned_to_name text,reviewer_id uuid,reviewer_name text,ai_director_id uuid,
 due_at timestamptz,progress integer not null default 0 check(progress between 0 and 100),risk_level text not null default 'low',blockers jsonb not null default '[]',
 created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists market_content_missions_state_idx on public.market_content_missions(status,due_at);

create table if not exists public.market_content_dossiers(
 id uuid primary key default gen_random_uuid(),content_code text not null unique,title text not null,
 family text not null check(family in('digital','print_offline','corporate_document')),category text not null,subcategory text not null,
 service_key text not null,service_label text not null,campaign_id uuid,campaign_label text,strategy_id uuid references public.market_content_strategies(id) on delete set null,mission_id uuid,
 audience text not null default '',city text not null default '',language text not null default 'fr',channel text not null default '',journey_stage text not null default '',objective text not null default '',message_pillar text not null default '',offer text not null default '',cta text not null default '',
 status text not null default 'opportunity' check(status in('opportunity','ideation','brief','scope_locked','planned','assigned','in_creation','checkpoint_review','draft_submitted','ai_review','human_review','revision','validated','source_required','source_secured','classified','ready_distribution','scheduled','published','performance_review','closed','archived')),
 priority text not null default 'medium',owner_id uuid,owner_name text,reviewer_id uuid,reviewer_name text,ai_director_id uuid,due_at timestamptz,
 progress integer not null default 0 check(progress between 0 and 100),readiness integer not null default 0 check(readiness between 0 and 100),source_state text not null default 'missing',publication_state text not null default 'not_ready',rights_state text not null default 'not_assessed',confidentiality text not null default 'internal',
 brief jsonb not null default '{}',scope_constitution jsonb not null default '{}',classification jsonb not null default '{}',legacy_origin_id text,legacy_origin_type text,provenance jsonb not null default '{}',created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.market_content_missions drop constraint if exists market_content_missions_dossier_id_fkey;
alter table public.market_content_missions add constraint market_content_missions_dossier_id_fkey foreign key(dossier_id) references public.market_content_dossiers(id) on delete set null;
alter table public.market_content_missions drop constraint if exists market_content_missions_ai_director_id_fkey;
alter table public.market_content_dossiers drop constraint if exists market_content_dossiers_mission_id_fkey;
alter table public.market_content_dossiers add constraint market_content_dossiers_mission_id_fkey foreign key(mission_id) references public.market_content_missions(id) on delete set null;
create index if not exists market_content_dossiers_class_idx on public.market_content_dossiers(family,category,subcategory);
create unique index if not exists market_content_dossiers_legacy_origin_idx on public.market_content_dossiers(legacy_origin_id) where legacy_origin_id is not null;
create index if not exists market_content_dossiers_state_idx on public.market_content_dossiers(status,updated_at desc);

create table if not exists public.market_content_mission_tasks(
 id uuid primary key default gen_random_uuid(),mission_id uuid not null references public.market_content_missions(id) on delete cascade,dossier_id uuid references public.market_content_dossiers(id) on delete set null,
 code text not null,title text not null,description text not null default '',status text not null default 'todo' check(status in('todo','doing','done','blocked','cancelled')),
 priority text not null default 'medium',sequence_number integer not null default 1,depends_on uuid[] not null default '{}',assigned_to uuid,assigned_to_name text,due_at timestamptz,
 evidence_required boolean not null default true,completion_definition text not null default '',progress integer not null default 0 check(progress between 0 and 100),created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(mission_id,code)
);
create index if not exists market_content_tasks_assignment_idx on public.market_content_mission_tasks(assigned_to,status,due_at);

create table if not exists public.market_content_checkpoints(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete cascade,mission_id uuid references public.market_content_missions(id) on delete set null,task_id uuid references public.market_content_mission_tasks(id) on delete set null,
 checkpoint_type text not null,title text not null,instructions text not null default '',required_evidence text[] not null default '{}',status text not null default 'pending',sequence_number integer not null,due_at timestamptz,completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(dossier_id,sequence_number)
);

create table if not exists public.market_content_evidence(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete cascade,mission_id uuid references public.market_content_missions(id) on delete set null,task_id uuid references public.market_content_mission_tasks(id) on delete set null,checkpoint_id uuid references public.market_content_checkpoints(id) on delete set null,
 evidence_type text not null,title text not null,note text not null default '',bridge_file_id text,storage_key text,content_type text,filename text,size_bytes bigint not null default 0,preview_url text,progress_percent integer not null default 0 check(progress_percent between 0 and 100),submitted_by uuid,submitted_by_name text,status text not null default 'submitted',created_at timestamptz not null default now()
);

create table if not exists public.market_content_ai_reviews(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete cascade,evidence_id uuid references public.market_content_evidence(id) on delete set null,
 result text not null,score integer not null default 0 check(score between 0 and 100),summary text not null default '',findings jsonb not null default '[]',corrections jsonb not null default '[]',rubric jsonb not null default '{}',model_code text,provider_dossier_id uuid,input_tokens integer not null default 0,output_tokens integer not null default 0,latency_ms integer not null default 0,reviewer_id uuid,reviewer_name text,created_at timestamptz not null default now()
);
create table if not exists public.market_content_human_reviews(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete cascade,evidence_id uuid references public.market_content_evidence(id) on delete set null,
 result text not null,score integer not null default 0 check(score between 0 and 100),summary text not null default '',findings jsonb not null default '[]',corrections jsonb not null default '[]',rubric jsonb not null default '{}',reviewer_id uuid,reviewer_name text,authority_role text,created_at timestamptz not null default now()
);

create table if not exists public.market_content_source_objects(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete restrict,content_code text not null,
 bridge_file_id text not null,storage_key text not null,original_filename text not null,safe_filename text not null,content_type text not null,size_bytes bigint not null,sha256_hash text not null,source_version integer not null,
 is_current boolean not null default true,integrity_state text not null default 'verified',deletion_verified_at timestamptz,created_by uuid,created_by_name text,created_at timestamptz not null default now(),unique(dossier_id,source_version)
);
create unique index if not exists market_content_one_current_source_idx on public.market_content_source_objects(dossier_id) where is_current;
create index if not exists market_content_source_code_idx on public.market_content_source_objects(content_code,is_current);

create table if not exists public.market_content_source_replacements(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete restrict,content_code text not null,previous_source_id uuid references public.market_content_source_objects(id),new_source_id uuid references public.market_content_source_objects(id),
 status text not null default 'locked',reason text not null,previous_bridge_file_id text,previous_storage_key text,previous_sha256_hash text,previous_filename text,previous_size_bytes bigint,new_bridge_file_id text,new_storage_key text,error text,
 requested_by uuid,requested_by_name text,committed_at timestamptz,previous_deleted_at timestamptz,failed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.market_content_generation_credits(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete cascade,mission_id uuid references public.market_content_missions(id) on delete set null,credit_number integer not null check(credit_number between 1 and 2),status text not null default 'reserved' check(status in('reserved','consumed','released')),reserved_by uuid,reserved_by_name text,sample_id uuid,reason text,reserved_at timestamptz not null default now(),consumed_at timestamptz,released_at timestamptz,unique(dossier_id,credit_number)
);
create table if not exists public.market_content_generated_samples(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete cascade,mission_id uuid references public.market_content_missions(id) on delete set null,credit_id uuid references public.market_content_generation_credits(id),credit_number integer not null,prompt text not null,model_code text not null,provider_dossier_id uuid,bridge_file_id text,storage_key text,content_type text,filename text,size_bytes bigint not null default 0,sha256_hash text,preview_data_url text,status text not null default 'generated',generated_by uuid,generated_by_name text,created_at timestamptz not null default now()
);
alter table public.market_content_generation_credits drop constraint if exists market_content_generation_credits_sample_id_fkey;
alter table public.market_content_generation_credits add constraint market_content_generation_credits_sample_id_fkey foreign key(sample_id) references public.market_content_generated_samples(id) on delete set null;

create table if not exists public.market_content_ai_directors(
 id uuid primary key default gen_random_uuid(),code text not null unique,name text not null,director_type text not null,mandate text not null,status text not null default 'draft',provider_module_key text not null default 'marketing_ai',preferred_model text not null default '',grounding_enabled boolean not null default false,image_generation_enabled boolean not null default false,authority_mode text not null default 'human_governed',
 services text[] not null default '{}',content_families text[] not null default '{}',audiences text[] not null default '{}',cities text[] not null default '{}',languages text[] not null default '{fr}',allowed_sources text[] not null default '{}',excluded_sources text[] not null default '{}',schedule_policy jsonb not null default '{}',rate_policy jsonb not null default '{}',skill_codes text[] not null default '{}',command_codes text[] not null default '{}',prompt_version_id uuid,human_supervisor_id uuid,human_supervisor_name text,last_run_at timestamptz,next_run_at timestamptz,created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.market_content_missions add constraint market_content_missions_ai_director_id_fkey foreign key(ai_director_id) references public.market_content_ai_directors(id) on delete set null;
alter table public.market_content_dossiers drop constraint if exists market_content_dossiers_ai_director_id_fkey;
alter table public.market_content_dossiers add constraint market_content_dossiers_ai_director_id_fkey foreign key(ai_director_id) references public.market_content_ai_directors(id) on delete set null;

create table if not exists public.market_content_prompt_versions(
 id uuid primary key default gen_random_uuid(),director_id uuid references public.market_content_ai_directors(id) on delete cascade,version_number integer not null,prompt_type text not null,content text not null,output_schema jsonb not null default '{}',guardrails jsonb not null default '{}',status text not null default 'draft',created_by uuid,created_at timestamptz not null default now(),unique(director_id,prompt_type,version_number)
);
create table if not exists public.market_content_taxonomy_nodes(
 id uuid primary key default gen_random_uuid(),node_type text not null,parent_id uuid references public.market_content_taxonomy_nodes(id) on delete cascade,stable_key text not null,label text not null,status text not null default 'active',metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(node_type,stable_key)
);
create table if not exists public.market_content_publication_packages(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete cascade,channel text not null,scheduled_at timestamptz,status text not null default 'draft',package_readiness integer not null default 0 check(package_readiness between 0 and 100),required_renditions jsonb not null default '[]',evidence jsonb not null default '[]',published_at timestamptz,external_reference text,created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.market_content_performance_events(
 id uuid primary key default gen_random_uuid(),dossier_id uuid not null references public.market_content_dossiers(id) on delete cascade,publication_package_id uuid references public.market_content_publication_packages(id) on delete set null,metric_key text not null,metric_value numeric not null default 0,period_start timestamptz,period_end timestamptz,evidence jsonb not null default '{}',created_at timestamptz not null default now()
);
create table if not exists public.market_content_learning_records(
 id uuid primary key default gen_random_uuid(),dossier_id uuid references public.market_content_dossiers(id) on delete set null,signal_id uuid references public.market_content_signals(id) on delete set null,learning_type text not null,title text not null,observation text not null,recommendation text not null,status text not null default 'proposed',evidence jsonb not null default '{}',created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.market_content_audit(
 id bigserial primary key,actor_id uuid,actor_name text not null default 'System',action text not null,entity_type text not null,entity_id uuid,detail jsonb not null default '{}',created_at timestamptz not null default now()
);

create or replace function public.market_content_register_initial_source(p_dossier_id uuid,p_content_code text,p_bridge_file_id text,p_storage_key text,p_original_filename text,p_safe_filename text,p_content_type text,p_size_bytes bigint,p_sha256_hash text,p_actor_id uuid,p_actor_name text,p_reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_dossier_id::text,0));
 if exists(select 1 from public.market_content_source_objects where dossier_id=p_dossier_id and is_current) then raise exception 'CANONICAL_SOURCE_ALREADY_EXISTS'; end if;
 insert into public.market_content_source_objects(dossier_id,content_code,bridge_file_id,storage_key,original_filename,safe_filename,content_type,size_bytes,sha256_hash,source_version,is_current,integrity_state,created_by,created_by_name)
 values(p_dossier_id,p_content_code,p_bridge_file_id,p_storage_key,p_original_filename,p_safe_filename,p_content_type,p_size_bytes,p_sha256_hash,1,true,'verified',p_actor_id,p_actor_name) returning id into v_id;
 update public.market_content_dossiers set source_state='secured',status=case when status in('validated','source_required') then 'source_secured' else status end,updated_at=now() where id=p_dossier_id;
 insert into public.market_content_audit(actor_id,actor_name,action,entity_type,entity_id,detail) values(p_actor_id,p_actor_name,'source.initial_registered','content_source',v_id,jsonb_build_object('contentCode',p_content_code,'reason',p_reason));
 return v_id;
end$$;

create or replace function public.market_content_begin_source_replacement(p_dossier_id uuid,p_content_code text,p_actor_id uuid,p_actor_name text,p_reason text)
returns table(replacement_id uuid,previous_bridge_file_id text,previous_storage_key text) language plpgsql security definer set search_path=public as $$
declare v_source public.market_content_source_objects%rowtype; v_replacement uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_dossier_id::text,0));
 select * into v_source from public.market_content_source_objects where dossier_id=p_dossier_id and is_current for update;
 if not found then raise exception 'CURRENT_SOURCE_NOT_FOUND'; end if;
 if exists(select 1 from public.market_content_source_replacements where dossier_id=p_dossier_id and status in('locked','promoted','deletion_pending')) then raise exception 'SOURCE_REPLACEMENT_ALREADY_ACTIVE'; end if;
 insert into public.market_content_source_replacements(dossier_id,content_code,previous_source_id,status,reason,previous_bridge_file_id,previous_storage_key,previous_sha256_hash,previous_filename,previous_size_bytes,requested_by,requested_by_name)
 values(p_dossier_id,p_content_code,v_source.id,'locked',p_reason,v_source.bridge_file_id,v_source.storage_key,v_source.sha256_hash,v_source.original_filename,v_source.size_bytes,p_actor_id,p_actor_name) returning id into v_replacement;
 return query select v_replacement,v_source.bridge_file_id,v_source.storage_key;
end$$;

create or replace function public.market_content_commit_source_replacement(p_replacement_id uuid,p_bridge_file_id text,p_storage_key text,p_original_filename text,p_safe_filename text,p_content_type text,p_size_bytes bigint,p_sha256_hash text,p_actor_id uuid,p_actor_name text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_rep public.market_content_source_replacements%rowtype;v_version integer;v_new uuid;
begin
 select * into v_rep from public.market_content_source_replacements where id=p_replacement_id for update;
 if not found or v_rep.status<>'locked' then raise exception 'SOURCE_REPLACEMENT_NOT_LOCKED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_rep.dossier_id::text,0));
 select coalesce(max(source_version),0)+1 into v_version from public.market_content_source_objects where dossier_id=v_rep.dossier_id;
 update public.market_content_source_objects set is_current=false,integrity_state='superseded_pending_delete' where id=v_rep.previous_source_id;
 insert into public.market_content_source_objects(dossier_id,content_code,bridge_file_id,storage_key,original_filename,safe_filename,content_type,size_bytes,sha256_hash,source_version,is_current,integrity_state,created_by,created_by_name)
 values(v_rep.dossier_id,v_rep.content_code,p_bridge_file_id,p_storage_key,p_original_filename,p_safe_filename,p_content_type,p_size_bytes,p_sha256_hash,v_version,true,'verified',p_actor_id,p_actor_name) returning id into v_new;
 update public.market_content_source_replacements set new_source_id=v_new,new_bridge_file_id=p_bridge_file_id,new_storage_key=p_storage_key,status='deletion_pending',committed_at=now(),updated_at=now() where id=p_replacement_id;
 update public.market_content_dossiers set source_state='secured',updated_at=now() where id=v_rep.dossier_id;
 insert into public.market_content_audit(actor_id,actor_name,action,entity_type,entity_id,detail) values(p_actor_id,p_actor_name,'source.replacement_promoted','source_replacement',p_replacement_id,jsonb_build_object('newSourceId',v_new,'version',v_version));
 return v_new;
end$$;

create or replace function public.market_content_confirm_previous_source_deleted(p_replacement_id uuid,p_actor_id uuid,p_actor_name text)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_rep public.market_content_source_replacements%rowtype;
begin
 select * into v_rep from public.market_content_source_replacements where id=p_replacement_id for update;
 if not found or v_rep.status<>'deletion_pending' then raise exception 'SOURCE_REPLACEMENT_NOT_PENDING_DELETE'; end if;
 update public.market_content_source_objects set integrity_state='bytes_deleted',deletion_verified_at=now() where id=v_rep.previous_source_id;
 update public.market_content_source_replacements set status='completed',previous_deleted_at=now(),updated_at=now() where id=p_replacement_id;
 insert into public.market_content_audit(actor_id,actor_name,action,entity_type,entity_id,detail) values(p_actor_id,p_actor_name,'source.previous_bytes_deleted','source_replacement',p_replacement_id,jsonb_build_object('previousSourceId',v_rep.previous_source_id,'previousHash',v_rep.previous_sha256_hash));
 return true;
end$$;

create or replace function public.market_content_fail_source_replacement(p_replacement_id uuid,p_error text,p_actor_id uuid,p_actor_name text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.market_content_source_replacements set status=case when status='deletion_pending' then 'deletion_failed' else 'failed' end,error=left(p_error,2000),failed_at=now(),updated_at=now() where id=p_replacement_id;
 insert into public.market_content_audit(actor_id,actor_name,action,entity_type,entity_id,detail) values(p_actor_id,p_actor_name,'source.replacement_failed','source_replacement',p_replacement_id,jsonb_build_object('error',left(p_error,2000)));
 return true;
end$$;

create or replace function public.market_content_reserve_generation_credit(p_dossier_id uuid,p_mission_id uuid,p_actor_id uuid,p_actor_name text)
returns table(credit_id uuid,credit_number integer) language plpgsql security definer set search_path=public as $$
declare v_num integer;v_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_dossier_id::text,0));
 select n into v_num from generate_series(1,2)n where not exists(select 1 from public.market_content_generation_credits c where c.dossier_id=p_dossier_id and c.credit_number=n and c.status in('reserved','consumed')) order by n limit 1;
 if v_num is null then raise exception 'GENERATION_CREDIT_LIMIT_REACHED'; end if;
 insert into public.market_content_generation_credits(dossier_id,mission_id,credit_number,status,reserved_by,reserved_by_name) values(p_dossier_id,p_mission_id,v_num,'reserved',p_actor_id,p_actor_name)
 on conflict(dossier_id,credit_number) do update set mission_id=excluded.mission_id,status='reserved',reserved_by=excluded.reserved_by,reserved_by_name=excluded.reserved_by_name,reserved_at=now(),released_at=null,reason=null returning id into v_id;
 return query select v_id,v_num;
end$$;
create or replace function public.market_content_release_generation_credit(p_credit_id uuid,p_reason text) returns boolean language plpgsql security definer set search_path=public as $$begin update public.market_content_generation_credits set status='released',reason=left(p_reason,1000),released_at=now() where id=p_credit_id and status='reserved';return found;end$$;
create or replace function public.market_content_commit_generation_credit(p_credit_id uuid,p_sample_id uuid) returns boolean language plpgsql security definer set search_path=public as $$begin update public.market_content_generation_credits set status='consumed',sample_id=p_sample_id,consumed_at=now() where id=p_credit_id and status='reserved';return found;end$$;

insert into public.market_content_taxonomy_nodes(node_type,stable_key,label,metadata) values
 ('family','digital','Contenu digital','{"canonical":true}'::jsonb),('family','print_offline','Print & Offline','{"canonical":true}'::jsonb),('family','corporate_document','Documents corporate','{"canonical":true}'::jsonb)
on conflict(node_type,stable_key) do update set label=excluded.label,metadata=excluded.metadata;

-- Server-only persistence. Human users operate through protected Next.js routes with app RBAC and audit.
do $$declare t text;begin
 foreach t in array array['market_content_signals','market_content_strategies','market_content_action_plans','market_content_missions','market_content_mission_tasks','market_content_dossiers','market_content_checkpoints','market_content_evidence','market_content_ai_reviews','market_content_human_reviews','market_content_source_objects','market_content_source_replacements','market_content_generation_credits','market_content_generated_samples','market_content_ai_directors','market_content_prompt_versions','market_content_taxonomy_nodes','market_content_publication_packages','market_content_performance_events','market_content_learning_records','market_content_audit'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from anon, authenticated',t);
  execute format('grant all on table public.%I to service_role',t);
 end loop;
end$$;
revoke all on function public.market_content_next_code(text) from public,anon,authenticated;
revoke all on function public.market_content_next_content_code(text,text) from public,anon,authenticated;
revoke all on function public.market_content_register_initial_source(uuid,text,text,text,text,text,text,bigint,text,uuid,text,text) from public,anon,authenticated;
revoke all on function public.market_content_begin_source_replacement(uuid,text,uuid,text,text) from public,anon,authenticated;
revoke all on function public.market_content_commit_source_replacement(uuid,text,text,text,text,text,bigint,text,uuid,text) from public,anon,authenticated;
revoke all on function public.market_content_confirm_previous_source_deleted(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.market_content_fail_source_replacement(uuid,text,uuid,text) from public,anon,authenticated;
revoke all on function public.market_content_reserve_generation_credit(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.market_content_release_generation_credit(uuid,text) from public,anon,authenticated;
revoke all on function public.market_content_commit_generation_credit(uuid,uuid) from public,anon,authenticated;
grant execute on function public.market_content_next_code(text),public.market_content_next_content_code(text,text),public.market_content_register_initial_source(uuid,text,text,text,text,text,text,bigint,text,uuid,text,text),public.market_content_begin_source_replacement(uuid,text,uuid,text,text),public.market_content_commit_source_replacement(uuid,text,text,text,text,text,bigint,text,uuid,text),public.market_content_confirm_previous_source_deleted(uuid,uuid,text),public.market_content_fail_source_replacement(uuid,text,uuid,text),public.market_content_reserve_generation_credit(uuid,uuid,uuid,text),public.market_content_release_generation_credit(uuid,text),public.market_content_commit_generation_credit(uuid,uuid) to service_role;
grant usage,select on sequence public.market_content_general_code_seq,public.market_content_dossier_code_seq,public.market_content_audit_id_seq to service_role;

comment on table public.market_content_source_objects is 'Exactly one active canonical source object per Content Command dossier. Delivery renditions are separate.';
comment on table public.market_content_generation_credits is 'Two governed successful AI image-generation credits per content dossier. Released technical failures do not consume a credit.';
comment on table public.market_content_audit is 'Append-only operational evidence for Content Command Headquarters Phase 5.';

commit;
