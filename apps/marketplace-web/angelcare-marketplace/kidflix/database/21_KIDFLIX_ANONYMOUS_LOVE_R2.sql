-- PENDING. Run separately in the Marketplace SQL editor after KidFlix SQL17.
-- Anonymous reactions only: no account, email, IP, child profile, message or analytics event.
begin;
do $$declare n text; f regprocedure;begin
 if to_regclass('public.ac_dce_records') is null or to_regprocedure('public.ac_kidflix_experience(text,text,text)') is null then raise exception 'KIDFLIX_PUBLIC_R1_REQUIRED';end if;
 foreach n in array array['ac_kidflix_love_totals','ac_kidflix_love_members']loop
  if to_regclass('public.'||n)is not null and obj_description(to_regclass('public.'||n),'pg_class')is distinct from 'ANGELCARE_KIDFLIX_LOVE_R2'then raise exception 'UNRELATED_OBJECT: %',n;end if;
 end loop;
 f:=to_regprocedure('public.ac_kidflix_love(text,text,text,text,boolean)');
 if f is not null and obj_description(f,'pg_proc')is distinct from 'ANGELCARE_KIDFLIX_LOVE_R2'then raise exception 'UNRELATED_LOVE_FUNCTION';end if;
end $$;
create table if not exists public.ac_kidflix_love_totals(
 record_id uuid primary key references public.ac_dce_records(id) on delete cascade,
 total bigint not null default 0 check(total>=0),
 updated_at timestamptz not null default now()
);
create table if not exists public.ac_kidflix_love_members(
 record_id uuid not null references public.ac_dce_records(id) on delete cascade,
 subject_hash text not null check(subject_hash~'^[a-f0-9]{64}$'),
 liked boolean not null default false,
 window_started_at timestamptz not null default now(),
 changes int not null default 0 check(changes>=0),
 updated_at timestamptz not null default now(),
 primary key(record_id,subject_hash)
);
comment on table public.ac_kidflix_love_totals is 'ANGELCARE_KIDFLIX_LOVE_R2';
comment on table public.ac_kidflix_love_members is 'ANGELCARE_KIDFLIX_LOVE_R2';
alter table public.ac_kidflix_love_totals enable row level security;
alter table public.ac_kidflix_love_members enable row level security;
revoke all on table public.ac_kidflix_love_totals,public.ac_kidflix_love_members from public,anon,authenticated;
-- Only the function owner writes these tables; the API role receives execute alone.
revoke all on table public.ac_kidflix_love_totals,public.ac_kidflix_love_members from service_role;
create or replace function public.ac_kidflix_love(p_host text,p_locale text,p_key text,p_subject_hash text,p_liked boolean default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare v jsonb;rid uuid;n bigint;previous boolean;affected int;member public.ac_kidflix_love_members;begin
 if p_subject_hash is null or p_subject_hash!~'^[a-f0-9]{64}$'or p_host is null or length(p_host)>253 or p_locale is null or p_locale not in('en','fr','ar')or p_key is null or length(p_key)>120 then raise exception 'INVALID_LOVE_REQUEST';end if;
 -- Resolve the active language edition through the existing hostname and publication authority.
 v:=public.ac_kidflix_experience(p_host,p_locale,p_key);
 if v is null then raise exception 'LOVE_NOT_FOUND';end if;
 rid:=(v->'manifest'->>'id')::uuid;
 if rid is null or not exists(select 1 from public.ac_dce_records where id=rid and kind in('experience','bundle')and lifecycle<>'archived')then raise exception 'LOVE_NOT_FOUND';end if;
 if p_liked is null then
  return (select jsonb_build_object('count',coalesce((select total from public.ac_kidflix_love_totals where record_id=rid),0),'liked',coalesce((select liked from public.ac_kidflix_love_members where record_id=rid and subject_hash=p_subject_hash),false)));
 end if;
 -- A resource-level lock serialises competing changes; retries set a desired state instead of toggling.
 insert into public.ac_kidflix_love_totals(record_id)values(rid)on conflict do nothing;
 select total into n from public.ac_kidflix_love_totals where record_id=rid for update;
 insert into public.ac_kidflix_love_members(record_id,subject_hash)values(rid,p_subject_hash)on conflict do nothing;
 select *into member from public.ac_kidflix_love_members where record_id=rid and subject_hash=p_subject_hash for update;
 if member.liked is distinct from p_liked then
  if member.window_started_at>now()-interval '1 minute'and member.changes>=20 then raise exception 'LOVE_RATE_LIMITED';end if;
  update public.ac_kidflix_love_members set liked=p_liked,
   changes=case when window_started_at<=now()-interval '1 minute'then 1 else changes+1 end,
   window_started_at=case when window_started_at<=now()-interval '1 minute'then now()else window_started_at end,
   updated_at=now()where record_id=rid and subject_hash=p_subject_hash;
  n:=n+case when p_liked then 1 else -1 end;
  update public.ac_kidflix_love_totals set total=n,updated_at=now()where record_id=rid;
 end if;
 return jsonb_build_object('count',n,'liked',p_liked);
end $$;
comment on function public.ac_kidflix_love(text,text,text,text,boolean)is 'ANGELCARE_KIDFLIX_LOVE_R2';
revoke all on function public.ac_kidflix_love(text,text,text,text,boolean)from public,anon,authenticated;
grant execute on function public.ac_kidflix_love(text,text,text,text,boolean)to service_role;
notify pgrst,'reload schema';
commit;
