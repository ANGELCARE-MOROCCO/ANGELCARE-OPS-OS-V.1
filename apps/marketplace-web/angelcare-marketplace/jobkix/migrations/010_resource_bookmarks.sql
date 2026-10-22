begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=9) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
alter table public.jobkix_saved_jobs add column version integer not null default 1;
alter table public.jobkix_saved_jobs add column saved boolean not null default true;
create table public.jobkix_saved_resources(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.jobkix_accounts(user_id),document_id uuid not null references public.jobkix_editorial_documents(id),
 collection text not null default 'default' check(length(collection) between 1 and 180),saved boolean not null default true,title_snapshot text not null,saved_locale text not null check(saved_locale in ('en','fr','es','hi','tl','id','ar')),
 saved_revision integer not null,version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,document_id)
);
alter table public.jobkix_saved_resources enable row level security;
revoke all on public.jobkix_saved_resources from public,anon,authenticated;
grant select on public.jobkix_saved_resources to authenticated;
create function public.jobkix_save_resource(p_document uuid,p_locale text,p_saved boolean,p_collection text,p_expected_version integer,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();fingerprint text;prior public.jobkix_command_receipts;bookmark public.jobkix_saved_resources;doc public.jobkix_editorial_documents;edition jsonb;result jsonb;begin
 if p_document is null or p_locale is null or p_locale not in ('en','fr','es','hi','tl','id','ar') or p_saved is null or length(trim(coalesce(p_collection,''))) not between 1 and 180 or p_expected_version is null or p_expected_version<0 or length(coalesce(p_idempotency_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':'||p_idempotency_key,0));
 fingerprint:=encode(sha256(convert_to(jsonb_build_array('resource.save',p_document,p_locale,p_saved,p_collection,p_expected_version)::text,'UTF8')),'hex');
 select * into prior from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_idempotency_key;
 if found then if prior.request_hash<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT';end if;return prior.result||jsonb_build_object('replayed',true);end if;
 perform pg_advisory_xact_lock(hashtextextended('jobkix-resource:'||actor::text||':'||p_document::text,0));
 select * into bookmark from public.jobkix_saved_resources where user_id=actor and document_id=p_document for update;
 if found then perform public.jobkix_version(bookmark.version,p_expected_version);elsif p_expected_version<>0 then raise exception 'VERSION_CONFLICT';end if;
 select * into doc from public.jobkix_editorial_documents where id=p_document;
 if not found or doc.kind<>'guide' then raise exception 'NOT_FOUND';end if;
 edition:=public.jobkix_public_editorial(doc.slug,p_locale);if p_saved and edition is null then raise exception 'NOT_FOUND';end if;
 if bookmark.id is null then
  if not p_saved then result:=jsonb_build_object('documentId',p_document,'saved',false,'version',0);
  else insert into public.jobkix_saved_resources(user_id,document_id,collection,title_snapshot,saved_locale,saved_revision) values(actor,p_document,p_collection,edition->>'title',p_locale,(edition->>'translationRevision')::integer) returning * into bookmark;end if;
 else
  update public.jobkix_saved_resources set saved=p_saved,collection=p_collection,title_snapshot=case when p_saved then edition->>'title' else title_snapshot end,saved_locale=case when p_saved then p_locale else saved_locale end,saved_revision=case when p_saved then (edition->>'translationRevision')::integer else saved_revision end,version=version+1,updated_at=now() where id=bookmark.id returning * into bookmark;
 end if;
 result:=coalesce(result,jsonb_build_object('documentId',p_document,'saved',bookmark.saved,'version',bookmark.version,'replayed',false));
 insert into public.jobkix_command_receipts(actor_user_id,idempotency_key,action,request_hash,result) values(actor,p_idempotency_key,'resource.save',fingerprint,result);
 insert into public.jobkix_events(type,object_id,actor_user_id,detail) values('resource.saved',p_document,actor,jsonb_build_object('saved',p_saved));return result;
end $$;
revoke all on function public.jobkix_save_resource(uuid,text,boolean,text,integer,text) from public,anon,authenticated;
grant execute on function public.jobkix_save_resource(uuid,text,boolean,text,integer,text) to authenticated;
create function public.jobkix_saved_collection(p_locale text,p_kind text default 'all',p_collection text default '',p_query text default '',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();result jsonb;begin
 if p_locale is null or p_locale not in ('en','fr','es','hi','tl','id','ar') or p_kind is null or p_kind not in ('all','job','resource') or p_collection is null or length(p_collection)>180 or p_query is null or length(p_query)>240 or p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 with bookmarks as (
  select s.vacancy_id id,'job' kind,s.collection,s.saved_at,s.version,public.jobkix_public_vacancy(s.vacancy_id,true) target,null::text slug,''::text saved_title from public.jobkix_saved_jobs s where s.user_id=actor and s.saved
  union all
  select s.document_id,'resource',s.collection,s.updated_at,s.version,public.jobkix_public_editorial(d.slug,p_locale),d.slug,s.title_snapshot from public.jobkix_saved_resources s join public.jobkix_editorial_documents d on d.id=s.document_id where s.user_id=actor and s.saved
 ), matches as (select * from bookmarks where (p_kind='all' or kind=p_kind) and (p_collection='' or collection=p_collection) and (p_query='' or position(lower(p_query) in lower(coalesce(target->>'title',saved_title)))>0)),
 paged as (select * from matches order by saved_at desc,id offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'collection',collection,'savedAt',saved_at,'version',version,'target',target,'slug',slug,'title',coalesce(target->>'title',saved_title)) order by saved_at desc,id) from paged),'[]'),'total',(select count(*) from matches),'page',p_page,'pageSize',24,
 'collections',(select coalesce(jsonb_agg(collection order by collection),'[]') from (select distinct collection from bookmarks) names)) into result;return result;
end $$;
revoke all on function public.jobkix_saved_collection(text,text,text,text,integer) from public,anon,authenticated;grant execute on function public.jobkix_saved_collection(text,text,text,text,integer) to authenticated;
-- The existing actor helper remains private. A boolean wrapper is needed in a row policy.
create function public.jobkix_own_active_account(p_user uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.jobkix_accounts a join auth.users u on u.id=a.user_id where a.user_id=p_user and a.user_id=auth.uid() and a.status='active' and u.email_confirmed_at is not null)
$$;
revoke all on function public.jobkix_own_active_account(uuid) from public,anon,authenticated;grant execute on function public.jobkix_own_active_account(uuid) to authenticated;
create policy jobkix_saved_resources_self on public.jobkix_saved_resources for select to authenticated using(public.jobkix_own_active_account(user_id));
insert into public.jobkix_schema_versions(version) values(10);
commit;
