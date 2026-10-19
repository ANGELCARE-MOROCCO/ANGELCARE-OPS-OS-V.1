-- ANGELCARE_DCE_MATURITY_R3. Additive activation after R1 + R2, separately in Marketplace SQL Editor.
begin;
do $$declare n text;f record;begin
 foreach n in array array['ac_dce_records','ac_dce_releases','ac_dce_events','ac_dce_jobs','ac_dce_job_lines','ac_dce_links']loop
 if to_regclass('public.'||n) is null then raise exception 'DCE_R1_REQUIRED: %',n;end if;
 if obj_description(to_regclass('public.'||n),'pg_class') is distinct from 'ANGELCARE_DCE_ADMIN_R1' then raise exception 'FOREIGN_BASELINE: %',n;end if;end loop;
 if to_regprocedure('public.ac_dce_dashboard_counts(text,text)') is null then raise exception 'DCE_R2_REQUIRED';end if;
 if to_regclass('public.ac_dce_attachment_receipts') is not null and obj_description(to_regclass('public.ac_dce_attachment_receipts'),'pg_class') is distinct from 'ANGELCARE_DCE_MATURITY_R3' then raise exception 'FOREIGN_ATTACHMENT_TABLE';end if;
 for f in select oid,proname from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_experience_page','ac_dce_context_page','ac_dce_ranked_content','ac_dce_connections','ac_dce_health','ac_dce_analytics_context','ac_dce_receive_attached','ac_dce_attach_case') loop if obj_description(f.oid,'pg_proc') is distinct from 'ANGELCARE_DCE_MATURITY_R3' then raise exception 'FOREIGN_FUNCTION: %',f.proname;end if;end loop;
end $$;
create table if not exists public.ac_dce_attachment_receipts(
 id uuid primary key,customer_id uuid,case_id uuid references public.ac_dce_records on delete restrict,release_id uuid references public.ac_dce_releases on delete restrict,field_id text,
 file_name text not null check(length(file_name) between 1 and 180),mime_type text not null check(mime_type in('application/pdf','image/jpeg','image/png','image/webp')),
 size_bytes bigint not null check(size_bytes between 1 and 20971520),sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 state text not null default 'pending' check(state in('pending','verified','linked','revoked')),tenant_id text,territory_id text,created_by text not null,
 created_at timestamptz not null default now(),verified_at timestamptz,linked_at timestamptz,expires_at timestamptz not null default(now()+interval '30 minutes'),check(customer_id is not null or case_id is not null));
comment on table public.ac_dce_attachment_receipts is 'ANGELCARE_DCE_MATURITY_R3';
alter table public.ac_dce_attachment_receipts enable row level security;
revoke all on public.ac_dce_attachment_receipts from public;
create index if not exists ac_dce_attachments_case on public.ac_dce_attachment_receipts(case_id,state);
create index if not exists ac_dce_attachments_owner on public.ac_dce_attachment_receipts(customer_id,release_id,state);

create or replace function public.ac_dce_experience_page(p_tenant text,p_territory text,p_view text default 'all',p_family text default '',p_topic text default '',p_search text default '',p_page int default 1,p_size int default 24) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;begin
 if p_view not in('all','released','draft','review','approved','scheduled','archived') or p_page<1 or p_size not between 1 and 100 then raise exception 'INVALID_INVENTORY_QUERY';end if;
 with matching as(select r.* from ac_dce_records r where r.kind='experience' and r.tenant_id is not distinct from p_tenant and r.territory_id is not distinct from p_territory
 and(p_view='all' or p_view='released' and r.published_release_id is not null or p_view in('draft','review','approved','archived') and r.lifecycle=p_view or p_view='scheduled' and exists(select 1 from ac_dce_releases z where z.record_id=r.id and z.state='scheduled'))
 and(p_family='' or r.family=p_family)and(p_topic='' or r.topic=p_topic)and(p_search='' or r.title ilike '%'||p_search||'%' or r.key ilike '%'||p_search||'%')),
 paged as(select * from matching order by updated_at desc,id limit p_size offset(p_page-1)*p_size)
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(x))from paged x),'[]'),'total',(select count(*)from matching),'page',p_page,'pageSize',p_size,'complete',true)into result;return result;end $$;

create or replace function public.ac_dce_context_page(p_tenant text,p_territory text,p_context uuid,p_kind text,p_filters jsonb default '{}',p_page int default 1,p_size int default 24) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;begin
 if p_page<1 or p_size not between 1 and 100 or not exists(select 1 from ac_dce_records where id=p_context and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory)then raise exception 'INVALID_CONTEXT';end if;
 with matching as(select r.* from ac_dce_records r where r.kind=p_kind and r.tenant_id is not distinct from p_tenant and r.territory_id is not distinct from p_territory
 and(r.id=p_context or r.data->>'targetId'=p_context::text or r.data->>'experienceId'=p_context::text or r.data->>'resourceId'=p_context::text or exists(select 1 from ac_dce_links l where l.target_type='record' and(l.record_id=p_context and l.target_id=r.id or l.target_id=p_context and l.record_id=r.id)))
 and(coalesce(p_filters->>'family','')='' or r.family=p_filters->>'family')and(coalesce(p_filters->>'lifecycle','')='' or r.lifecycle=p_filters->>'lifecycle')and(coalesce(p_filters->>'q','')='' or r.title ilike '%'||(p_filters->>'q')||'%')),
 paged as(select * from matching order by updated_at desc,id limit p_size offset(p_page-1)*p_size)
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(x))from paged x),'[]'),'total',(select count(*)from matching),'page',p_page,'pageSize',p_size,'complete',true)into result;return result;end $$;

create or replace function public.ac_dce_ranked_content(p_tenant text,p_territory text,p_days int default 30,p_metric text default 'complete')returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin if p_days not between 1 and 366 or p_metric not in('discover','checkpoint','complete','action_failed')then raise exception 'INVALID_RANKING_QUERY';end if;
 return jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(x))from(select ev.record_id as id,r.title,count(*) as n from ac_dce_events ev join ac_dce_records r on r.id=ev.record_id and r.tenant_id is not distinct from p_tenant and r.territory_id is not distinct from p_territory where ev.channel='experience' and ev.action=p_metric and ev.tenant_id is not distinct from p_tenant and ev.territory_id is not distinct from p_territory and ev.created_at>=now()-make_interval(days=>p_days)group by ev.record_id,r.title order by n desc,ev.record_id limit 5)x),'[]'),'metric',p_metric,'complete',true,'checkedAt',now());end $$;

create or replace function public.ac_dce_connections(p_tenant text,p_territory text,p_id uuid,p_private boolean default false,p_ads boolean default false)returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin if not exists(select 1 from ac_dce_records where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory)then raise exception 'NOT_FOUND';end if;
 return jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(x))from(select distinct r.id,r.kind,r.title,r.family,r.lifecycle,r.revision,r.published_release_id,case when l.record_id=p_id then 'dependency' else 'usage' end relation from ac_dce_links l join ac_dce_records r on r.id=case when l.record_id=p_id then l.target_id else l.record_id end where l.target_type='record' and(l.record_id=p_id or l.target_id=p_id)and r.tenant_id is not distinct from p_tenant and r.territory_id is not distinct from p_territory and(p_private or r.kind not in('case','contribution','run','grant'))and(p_ads or r.kind not in('ad_connection','ad_unit','ad_policy')))x),'[]'),
 'media',coalesce((select jsonb_agg(target_id)from ac_dce_links where record_id=p_id and target_type='media'),'[]'),'offers',coalesce((select jsonb_agg(target_id)from ac_dce_links where record_id=p_id and target_type='offer'),'[]'),
 'releaseCounts',coalesce((select jsonb_object_agg(state,n)from(select state,count(*)n from ac_dce_releases where record_id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory group by state)x),'{}'),'complete',true);end $$;

create or replace function public.ac_dce_health(p_tenant text,p_territory text,p_private boolean default false)returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
select jsonb_build_object('checkedAt',now(),'dueReleases',(select count(*)from ac_dce_releases where state='scheduled' and scheduled_at<=now()and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory),'failedReleases',(select count(*)from ac_dce_releases where state='failed'and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory),'failedImportLines',(select count(*)from ac_dce_job_lines l join ac_dce_jobs j on j.id=l.job_id where l.state in('failed','conflict','invalid')and j.tenant_id is not distinct from p_tenant and j.territory_id is not distinct from p_territory),'mediaFailures',(select count(*)from ac_dce_records where kind='asset' and data->>'processingState'='failed'and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory),'openCases',case when p_private then(select count(*)from ac_dce_records where kind='case' and lifecycle not in('closed','resolved','archived')and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory)else null end,'complete',true)
$$;

create or replace function public.ac_dce_analytics_context(p_tenant text,p_territory text,p_since timestamptz,p_until timestamptz,p_dimension text,p_filters jsonb default '{}',p_page int default 1) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_dimension not in('action','record_id','audience','source','locale','device','region','family','topic','assetId') then raise exception 'UNKNOWN_DIMENSION';end if;
 if p_until<=p_since or p_until-p_since>interval '366 days' then raise exception 'INVALID_REPORT_WINDOW';end if;
 with e as(
  select ev.*,case p_dimension when 'action' then ev.action when 'record_id' then ev.record_id::text else coalesce(ev.data->>p_dimension,'unknown') end dimension
  from ac_dce_events ev where ev.channel='experience' and ev.tenant_id is not distinct from p_tenant and ev.territory_id is not distinct from p_territory and ev.created_at>=p_since and ev.created_at<p_until
  and(coalesce(p_filters->>'recordId','')='' or ev.record_id::text=p_filters->>'recordId')
  and not exists(select 1 from jsonb_each_text(p_filters) f where f.key in('audience','source','locale','device','region','family','topic','assetId') and f.value<>'' and coalesce(ev.data->>f.key,'unknown')<>f.value)
 ),b as(select dimension,count(*) n,count(*) filter(where action='complete') completions,count(*) filter(where action='action_failed') failures from e group by dimension),paged as(select * from b order by n desc,dimension limit 50 offset(greatest(1,p_page)-1)*50)
 select jsonb_build_object('totalEvents',(select count(*) from e),'totalBuckets',(select count(*) from b),'rows',coalesce((select jsonb_agg(jsonb_build_object('value',b.dimension,'label',case when p_dimension='record_id' then coalesce(r.title,b.dimension) else b.dimension end,'count',b.n,'completions',b.completions,'failures',b.failures) order by b.n desc,b.dimension) from paged b left join ac_dce_records r on r.id::text=b.dimension and r.tenant_id is not distinct from p_tenant and r.territory_id is not distinct from p_territory),'[]'),'byAction',coalesce((select jsonb_object_agg(action,n) from(select action,count(*) n from e group by action)a),'{}'),'source','ac_dce_events:experience','complete',true,'page',greatest(1,p_page),'pageSize',50,'since',p_since,'until',p_until,'timeZone','UTC','checkedAt',now()) into result;
 return result;
end $$;
create or replace function public.ac_dce_receive_attached(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_record jsonb,p_refs jsonb,p_attachments jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a ac_dce_attachment_receipts;v jsonb;reply jsonb;prior ac_dce_commands;details jsonb:='[]';cid uuid;begin
 select * into prior from ac_dce_commands where request_id=p_request and actor_id=p_actor;
 if found then if prior.input_hash<>p_hash then raise exception 'CONFLICT_RECEIPT';end if;return prior.response;end if;
 if p_actor<>'customer:'||(p_record->'data'->>'customerId')or p_record->>'kind'<>'case'or jsonb_array_length(p_attachments)>10 then raise exception 'INVALID_ATTACHMENT_RECEIPT';end if;
 for v in select value from jsonb_array_elements(p_attachments)order by value->>'id' loop
 select * into a from ac_dce_attachment_receipts where id=(v->>'id')::uuid and customer_id=(p_record->'data'->>'customerId')::uuid and release_id=(p_record->'data'->>'releaseId')::uuid and field_id=v->>'fieldId' and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if not found or a.state<>'verified' or a.expires_at<=now() or p_record->'data'->'values'->>a.field_id<>a.id::text then raise exception 'PRIVATE_ATTACHMENT_NOT_READY';end if;
 details:=details||jsonb_build_array(jsonb_build_object('id',a.id,'fieldId',a.field_id,'name',a.file_name,'mime',a.mime_type,'bytes',a.size_bytes));end loop;
 reply:=public.ac_dce_write(p_actor,p_tenant,p_territory,p_request,p_hash,'save',null,0,jsonb_set(p_record,'{data,attachments}',details,true),p_refs);
 cid:=(reply->'record'->>'id')::uuid;
 update ac_dce_attachment_receipts set case_id=cid,state='linked',linked_at=now() where id in(select(value->>'id')::uuid from jsonb_array_elements(p_attachments));return reply;end $$;

create or replace function public.ac_dce_attach_case(p_actor text,p_tenant text,p_territory text,p_id uuid,p_case uuid,p_revision int)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a ac_dce_attachment_receipts;r ac_dce_records;items jsonb;begin
 select * into r from ac_dce_records where id=p_case and kind='case'and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if not found then raise exception 'NOT_FOUND';end if;
 select * into a from ac_dce_attachment_receipts where id=p_id and case_id=p_case and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if a.state='linked' then return jsonb_build_object('record',r,'replayed',true);end if;
 if a.state<>'verified' or a.expires_at<=now()then raise exception 'PRIVATE_ATTACHMENT_NOT_READY';end if;
 if r.revision<>p_revision then raise exception 'CONFLICT';end if;
 items:=coalesce(r.data->'attachments','[]');if jsonb_array_length(items)>=10 then raise exception 'ATTACHMENT_LIMIT';end if;
 items:=items||jsonb_build_array(jsonb_build_object('id',a.id,'name',a.file_name,'mime',a.mime_type,'bytes',a.size_bytes));
 update ac_dce_records set data=jsonb_set(data,'{attachments}',items,true),revision=revision+1,updated_by=p_actor,updated_at=now()where id=r.id returning * into r;
 insert into ac_dce_versions(record_id,revision,snapshot,actor_id)values(r.id,r.revision,to_jsonb(r),p_actor);
 update ac_dce_attachment_receipts set state='linked',linked_at=now()where id=a.id;
 insert into ac_dce_events(channel,action,record_id,actor_id,data,tenant_id,territory_id)values('admin','attachment_link',r.id,p_actor,jsonb_build_object('attachmentId',a.id),p_tenant,p_territory);
 return jsonb_build_object('record',r);end $$;

do $$declare f regprocedure;begin
 for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_experience_page','ac_dce_context_page','ac_dce_ranked_content','ac_dce_connections','ac_dce_health','ac_dce_analytics_context','ac_dce_receive_attached','ac_dce_attach_case')loop
 execute format('comment on function %s is %L',f,'ANGELCARE_DCE_MATURITY_R3');execute format('revoke all on function %s from public',f);
 if exists(select 1 from pg_roles where rolname='anon')then execute format('revoke all on function %s from anon',f);end if;
 if exists(select 1 from pg_roles where rolname='authenticated')then execute format('revoke all on function %s from authenticated',f);end if;
 if exists(select 1 from pg_roles where rolname='service_role')then execute format('grant execute on function %s to service_role',f);end if;end loop;
 if exists(select 1 from pg_roles where rolname='anon')then revoke all on ac_dce_attachment_receipts from anon;end if;
 if exists(select 1 from pg_roles where rolname='authenticated')then revoke all on ac_dce_attachment_receipts from authenticated;end if;
 if exists(select 1 from pg_roles where rolname='service_role')then grant select,insert,update,delete on ac_dce_attachment_receipts to service_role;end if;
end $$;
notify pgrst,'reload schema';
commit;
