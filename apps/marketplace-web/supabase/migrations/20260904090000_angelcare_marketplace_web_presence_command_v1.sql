begin;

insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive) values
 ('marketplace.web_presence.view','Voir la présence Web','Web Presence',false),
 ('marketplace.web_presence.manage','Gérer les brouillons de présence Web','Web Presence',true),
 ('marketplace.web_presence.publish','Publier la présence Web','Web Presence',true),
 ('marketplace.web_presence.rollback','Restaurer la présence Web','Web Presence',true),
 ('marketplace.web_presence.verify','Vérifier la présence Web en production','Web Presence',true)
on conflict(permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive;

insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select roles.role_key,permissions.permission_key
from public.angelcare_marketplace_roles roles
cross join public.angelcare_marketplace_permissions permissions
where roles.role_key in('marketplace_admin','marketplace_super_admin','marketplace_executive')
  and permissions.permission_key like 'marketplace.web_presence.%'
on conflict do nothing;

create table if not exists public.angelcare_marketplace_web_presence_profiles(
 id uuid primary key default gen_random_uuid(),
 scope_key text not null unique check(scope_key in('GLOBAL_DOMAIN','MARKETPLACE')),
 domain text not null,
 default_locale text not null default 'fr' check(default_locale in('fr','en','ar')),
 supported_locales text[] not null default '{fr,en,ar}'::text[],
 current_published_version_id uuid,
 status text not null default 'active' check(status in('active','paused','archived')),
 created_by uuid,
 updated_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(scope_key,domain)
);

create table if not exists public.angelcare_marketplace_web_presence_versions(
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.angelcare_marketplace_web_presence_profiles(id) on delete restrict,
 version_number integer not null check(version_number>0),
 lifecycle_state text not null default 'DRAFT' check(lifecycle_state in('DRAFT','VALIDATED','PUBLISHED','SUPERSEDED','ROLLED_BACK')),
 configuration jsonb not null,
 configuration_checksum text not null check(configuration_checksum~'^[a-f0-9]{64}$'),
 validation_result jsonb,
 change_summary text,
 created_by uuid,
 validated_by uuid,
 published_by uuid,
 created_at timestamptz not null default now(),
 validated_at timestamptz,
 published_at timestamptz,
 unique(profile_id,version_number)
);

do $$ begin
 if not exists(select 1 from pg_constraint where conname='ac_web_presence_published_version_fk') then
  alter table public.angelcare_marketplace_web_presence_profiles add constraint ac_web_presence_published_version_fk foreign key(current_published_version_id) references public.angelcare_marketplace_web_presence_versions(id) on delete restrict;
 end if;
end $$;

create unique index if not exists ac_web_presence_one_open_draft_idx on public.angelcare_marketplace_web_presence_versions(profile_id) where lifecycle_state in('DRAFT','VALIDATED');
create index if not exists ac_web_presence_history_idx on public.angelcare_marketplace_web_presence_versions(profile_id,version_number desc);

create table if not exists public.angelcare_marketplace_web_presence_verifications(
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.angelcare_marketplace_web_presence_profiles(id) on delete restrict,
 version_id uuid not null references public.angelcare_marketplace_web_presence_versions(id) on delete restrict,
 request_id text not null,
 checked_by uuid,
 checked_urls text[] not null default '{}',
 evidence jsonb not null default '[]'::jsonb,
 result text not null check(result in('PASS','FAIL')),
 checked_at timestamptz not null default now()
);
create index if not exists ac_web_presence_verification_idx on public.angelcare_marketplace_web_presence_verifications(profile_id,checked_at desc);

insert into public.angelcare_marketplace_web_presence_profiles(scope_key,domain,default_locale,supported_locales,status) values
 ('GLOBAL_DOMAIN','my.angelcarehub.com','fr','{fr,en,ar}','active'),
 ('MARKETPLACE','my.angelcarehub.com','fr','{fr,en,ar}','active')
on conflict(scope_key) do update set domain=excluded.domain,supported_locales=excluded.supported_locales,updated_at=now();

create or replace function public.angelcare_marketplace_publish_web_presence(
 p_profile_id uuid,p_version_id uuid,p_expected_current_revision integer,p_actor_id uuid,p_request_id text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_profile public.angelcare_marketplace_web_presence_profiles;v_version public.angelcare_marketplace_web_presence_versions;v_current_revision integer:=0;
begin
 select * into v_profile from public.angelcare_marketplace_web_presence_profiles where id=p_profile_id for update;
 if v_profile.id is null then raise exception 'PROFILE_NOT_FOUND';end if;
 if v_profile.current_published_version_id is not null then select version_number into v_current_revision from public.angelcare_marketplace_web_presence_versions where id=v_profile.current_published_version_id;end if;
 if coalesce(v_current_revision,0)<>p_expected_current_revision then raise exception 'STALE_REVISION';end if;
 select * into v_version from public.angelcare_marketplace_web_presence_versions where id=p_version_id and profile_id=p_profile_id for update;
 if v_version.id is null or v_version.lifecycle_state<>'VALIDATED' or coalesce((v_version.validation_result->>'valid')::boolean,false)=false then raise exception 'PUBLICATION_BLOCKED';end if;
 if v_profile.current_published_version_id is not null then update public.angelcare_marketplace_web_presence_versions set lifecycle_state='SUPERSEDED' where id=v_profile.current_published_version_id and lifecycle_state='PUBLISHED';end if;
 update public.angelcare_marketplace_web_presence_versions set lifecycle_state='PUBLISHED',published_by=p_actor_id,published_at=now() where id=p_version_id;
 update public.angelcare_marketplace_web_presence_profiles set current_published_version_id=p_version_id,updated_by=p_actor_id,updated_at=now() where id=p_profile_id;
 insert into public.angelcare_marketplace_audit_events(request_id,actor_id,action,object_type,object_id,after_value,result,severity,source) values(p_request_id,p_actor_id,'web_presence.version.published','web_presence_version',p_version_id::text,jsonb_build_object('profileId',p_profile_id,'revision',v_version.version_number,'scope',v_profile.scope_key),'success','info','web-presence-rpc');
 return jsonb_build_object('profile_id',p_profile_id,'version_id',p_version_id,'revision',v_version.version_number,'scope',v_profile.scope_key);
end $$;

create or replace function public.angelcare_marketplace_rollback_web_presence(
 p_profile_id uuid,p_source_version_id uuid,p_expected_current_revision integer,p_reason text,p_actor_id uuid,p_request_id text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_profile public.angelcare_marketplace_web_presence_profiles;v_source public.angelcare_marketplace_web_presence_versions;v_current_revision integer:=0;v_next integer;v_new_id uuid;
begin
 if length(trim(coalesce(p_reason,'')))<10 then raise exception 'ROLLBACK_REASON_REQUIRED';end if;
 select * into v_profile from public.angelcare_marketplace_web_presence_profiles where id=p_profile_id for update;
 if v_profile.id is null then raise exception 'PROFILE_NOT_FOUND';end if;
 if v_profile.current_published_version_id is not null then select version_number into v_current_revision from public.angelcare_marketplace_web_presence_versions where id=v_profile.current_published_version_id;end if;
 if coalesce(v_current_revision,0)<>p_expected_current_revision then raise exception 'STALE_REVISION';end if;
 select * into v_source from public.angelcare_marketplace_web_presence_versions where id=p_source_version_id and profile_id=p_profile_id and lifecycle_state in('PUBLISHED','SUPERSEDED','ROLLED_BACK');
 if v_source.id is null then raise exception 'ROLLBACK_SOURCE_INVALID';end if;
 select coalesce(max(version_number),0)+1 into v_next from public.angelcare_marketplace_web_presence_versions where profile_id=p_profile_id;
 update public.angelcare_marketplace_web_presence_versions set lifecycle_state='ROLLED_BACK' where id=v_profile.current_published_version_id and lifecycle_state='PUBLISHED';
 insert into public.angelcare_marketplace_web_presence_versions(profile_id,version_number,lifecycle_state,configuration,configuration_checksum,validation_result,change_summary,created_by,validated_by,published_by,validated_at,published_at)
 values(p_profile_id,v_next,'PUBLISHED',v_source.configuration,v_source.configuration_checksum,v_source.validation_result,'ROLLBACK: '||trim(p_reason),p_actor_id,p_actor_id,p_actor_id,now(),now()) returning id into v_new_id;
 update public.angelcare_marketplace_web_presence_profiles set current_published_version_id=v_new_id,updated_by=p_actor_id,updated_at=now() where id=p_profile_id;
 insert into public.angelcare_marketplace_audit_events(request_id,actor_id,action,object_type,object_id,after_value,reason,result,severity,source) values(p_request_id,p_actor_id,'web_presence.rollback.performed','web_presence_version',v_new_id::text,jsonb_build_object('profileId',p_profile_id,'sourceVersionId',p_source_version_id,'revision',v_next,'scope',v_profile.scope_key),trim(p_reason),'success','warning','web-presence-rpc');
 return jsonb_build_object('profile_id',p_profile_id,'version_id',v_new_id,'revision',v_next,'scope',v_profile.scope_key);
end $$;

alter table public.angelcare_marketplace_web_presence_profiles enable row level security;
alter table public.angelcare_marketplace_web_presence_versions enable row level security;
alter table public.angelcare_marketplace_web_presence_verifications enable row level security;
revoke all on public.angelcare_marketplace_web_presence_profiles,public.angelcare_marketplace_web_presence_versions,public.angelcare_marketplace_web_presence_verifications from anon,authenticated;
grant all on public.angelcare_marketplace_web_presence_profiles,public.angelcare_marketplace_web_presence_versions,public.angelcare_marketplace_web_presence_verifications to service_role;
revoke all on function public.angelcare_marketplace_publish_web_presence(uuid,uuid,integer,uuid,text) from public,anon,authenticated;
revoke all on function public.angelcare_marketplace_rollback_web_presence(uuid,uuid,integer,text,uuid,text) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_publish_web_presence(uuid,uuid,integer,uuid,text) to service_role;
grant execute on function public.angelcare_marketplace_rollback_web_presence(uuid,uuid,integer,text,uuid,text) to service_role;

comment on table public.angelcare_marketplace_web_presence_profiles is 'Stable GLOBAL_DOMAIN and MARKETPLACE identity with a single published-version pointer.';
comment on table public.angelcare_marketplace_web_presence_versions is 'Immutable-version Web Presence snapshots; drafts never become effective until atomic publication.';
commit;
