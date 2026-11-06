-- KidFlix delivery R2. Additive; native authoring and all existing releases remain intact.
begin;
do $$ begin
 if to_regclass('public.ac_kidflix_interactive_packages') is null or to_regclass('public.ac_dce_releases') is null then
   raise exception 'KIDFLIX_UNIVERSAL_INTERACTIVE_AND_DCE_R5_REQUIRED';
 end if;
end $$;
create table if not exists public.ac_kidflix_import_sessions(
 id uuid primary key, scope_key text not null, owner_actor_id text not null,
 family_key text not null,locale text not null check(locale in('fr','en','ar')),record_id uuid,
 checksum text not null check(checksum ~ '^[a-f0-9]{64}$'),size_bytes bigint not null check(size_bytes between 22 and 67108864),
 chunk_count int not null check(chunk_count between 1 and 16),received int[] not null default '{}',
 state text not null check(state in('uploading','processing','validated','failed','cancelled')),
 package_id uuid not null, cursor int not null default 0 check(cursor>=0),file_count int not null default 0,
 error text, dedup_key text not null unique,lease_token uuid,lease_until timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.ac_kidflix_import_sessions enable row level security;
revoke all on public.ac_kidflix_import_sessions from public,anon,authenticated;
grant select,insert,update,delete on public.ac_kidflix_import_sessions to service_role;
create index if not exists ac_kidflix_import_scope_actor on public.ac_kidflix_import_sessions(scope_key,owner_actor_id,updated_at desc);

create or replace function public.ac_kidflix_import_receive(p_id uuid,p_scope text,p_actor text,p_index int)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s ac_kidflix_import_sessions;
begin
 select * into s from ac_kidflix_import_sessions where id=p_id and scope_key=p_scope and owner_actor_id=p_actor for update;
 if not found or s.state<>'uploading' or p_index<0 or p_index>=s.chunk_count then raise exception 'INVALID_IMPORT_RECEIPT';end if;
 update ac_kidflix_import_sessions set received=array(select distinct n from unnest(received||array[p_index])n order by n),updated_at=now() where id=p_id returning * into s;
 return to_jsonb(s);
end $$;
create or replace function public.ac_kidflix_import_claim(p_id uuid,p_scope text,p_actor text,p_token uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s ac_kidflix_import_sessions;
begin
 select * into s from ac_kidflix_import_sessions where id=p_id and scope_key=p_scope and owner_actor_id=p_actor for update;
 if not found then raise exception 'IMPORT_SESSION_NOT_FOUND';end if;
 if s.state in('validated','cancelled') or cardinality(s.received)<>s.chunk_count then return null;end if;
 if s.lease_until>now() then return null;end if;
 update ac_kidflix_import_sessions set state='processing',lease_token=p_token,lease_until=now()+interval '3 minutes',error=null,updated_at=now() where id=p_id returning * into s;
 return to_jsonb(s);
end $$;
revoke all on function public.ac_kidflix_import_receive(uuid,text,text,int),public.ac_kidflix_import_claim(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.ac_kidflix_import_receive(uuid,text,text,int),public.ac_kidflix_import_claim(uuid,text,text,uuid) to service_role;

-- Every publication route, including scheduled releases and restoration, binds
-- the package in the same database transaction as the native release.
create or replace function public.ac_kidflix_bind_delivery_release()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare ref jsonb;p ac_kidflix_interactive_packages;edition text;release_scope text;
begin
 if new.state<>'published' then return new;end if;
 ref:=new.manifest#>'{definition,interactivePackage}';
 if ref is null or ref='null'::jsonb then return new;end if;
 if ref->>'id' is null or (ref->>'id')!~*'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then raise exception 'INVALID_INTERACTIVE_RELEASE_REFERENCE';end if;
 edition:=new.manifest->>'editionLocale';release_scope:=coalesce(new.tenant_id,'~')||'|'||coalesce(new.territory_id,'~');
 select * into p from ac_kidflix_interactive_packages where id=(ref->>'id')::uuid for update;
 if not found or p.scope_key is distinct from release_scope or p.locale is distinct from edition
   or ref->>'locale' is distinct from edition or p.family_key is distinct from new.manifest->>'family'
   or p.checksum_sha256 is distinct from ref->>'checksum' or p.entry_path is distinct from ref->>'entry'
   or p.state not in('validated','published') or (p.record_id is not null and p.record_id<>new.record_id) then
   raise exception 'INTERACTIVE_RELEASE_BINDING_CONFLICT';
 end if;
 update ac_kidflix_interactive_packages set state='published',record_id=new.record_id,release_id=new.id where id=p.id;
 return new;
end $$;
drop trigger if exists ac_kidflix_delivery_release_binding on public.ac_dce_releases;
create trigger ac_kidflix_delivery_release_binding after insert or update of state on public.ac_dce_releases for each row execute function public.ac_kidflix_bind_delivery_release();
revoke all on function public.ac_kidflix_bind_delivery_release() from public,anon,authenticated;
create or replace function public.ac_kidflix_delivery_status() returns jsonb
language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('contract','KIDFLIX_DELIVERY_R2','chunkedImport',true,'atomicBinding',exists(select 1 from pg_trigger where tgrelid='public.ac_dce_releases'::regclass and tgname='ac_kidflix_delivery_release_binding' and tgenabled<>'D'));
$$;
revoke all on function public.ac_kidflix_delivery_status() from public,anon,authenticated;
grant execute on function public.ac_kidflix_delivery_status() to service_role;
commit;
