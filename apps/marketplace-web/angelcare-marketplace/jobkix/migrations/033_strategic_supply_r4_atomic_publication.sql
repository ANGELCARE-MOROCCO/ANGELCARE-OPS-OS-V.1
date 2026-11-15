-- JOBKIX Strategic Supply R4 — fail-closed atomic decisions and public eligibility
-- Apply only after migrations 030/031/032 have been verified in the target DB.
-- No existing records are automatically published, deleted or rescored.
begin;
create table if not exists public.jobkix_supply_r4_receipts(
 actor text not null,
 idempotency_key uuid not null,
 vacancy_id uuid not null references public.jobkix_supply_vacancies(id) on delete restrict,
 decision text not null,
 result jsonb not null,
 created_at timestamptz not null default now(),
 primary key(actor,idempotency_key)
);
create index if not exists jobkix_supply_r4_receipts_vacancy_idx on public.jobkix_supply_r4_receipts(vacancy_id,created_at desc);
alter table public.jobkix_supply_r4_receipts enable row level security;
revoke all on public.jobkix_supply_r4_receipts from public,anon,authenticated;
grant select,insert on public.jobkix_supply_r4_receipts to service_role;

-- R3 visibility validators were revoked from PUBLIC; the server-side service
-- role requires explicit execute grants for the R4 preflight and read-back.
grant execute on function public.jobkix_r3_https_url(text) to service_role;
grant execute on function public.jobkix_r3_verified_apply_url(text,jsonb) to service_role;
grant execute on function public.jobkix_r3_external_visible(uuid) to service_role;

create or replace function public.jobkix_supply_r4_assess(p_id uuid)
returns jsonb language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare
 v public.jobkix_supply_vacancies;
 s public.jobkix_supply_sources;
 n jsonb;
 reasons text[] := array[]::text[];
 duties jsonb;
 requirements jsonb;
begin
 select * into v from public.jobkix_supply_vacancies where id=p_id;
 if not found then return jsonb_build_object('id',p_id,'eligible',false,'reasons',jsonb_build_array('VACANCY_NOT_FOUND')); end if;
 select * into s from public.jobkix_supply_sources where id=v.source_id;
 n:=coalesce(v.normalized,'{}'::jsonb);
 if not found or s.approved is distinct from true or s.enabled is distinct from true or s.archived_at is not null then
  reasons:=array_append(reasons,'SOURCE_DISABLED_OR_UNAPPROVED');
 end if;
 if s.publication_mode is distinct from 'full' then
  reasons:=array_append(reasons,'FULL_REPUBLICATION_RIGHTS_REQUIRED');
 end if;
 if length(btrim(coalesce(v.title,'')))<3 or length(btrim(coalesce(v.company,'')))<2 then
  reasons:=array_append(reasons,'IDENTITY_INCOMPLETE');
 end if;
 if v.country !~ '^[A-Z]{2}$' or n->>'countryEvidence' is distinct from 'source' then
  reasons:=array_append(reasons,'SOURCE_COUNTRY_REQUIRED');
 end if;
 if not public.jobkix_r3_https_url(v.canonical_url) then
  reasons:=array_append(reasons,'ORIGINAL_URL_INVALID');
 end if;
 if not public.jobkix_r3_verified_apply_url(n->>'applicationUrl',s.config->'officialApplyHosts') then
  reasons:=array_append(reasons,'OFFICIAL_APPLY_HOST_NOT_APPROVED');
 end if;
 if length(btrim(coalesce(v.description,'')))<120 then
  reasons:=array_append(reasons,'RICH_DESCRIPTION_REQUIRED');
 end if;
 duties:=case when jsonb_typeof(n->'duties')='array' then n->'duties' else '[]'::jsonb end;
 requirements:=case when jsonb_typeof(n->'requirements')='array' then n->'requirements' else '[]'::jsonb end;
 if not exists(select 1 from jsonb_array_elements_text(duties) x where btrim(x.value)<>'')
   and not exists(select 1 from jsonb_array_elements_text(requirements) x where btrim(x.value)<>'') then
  reasons:=array_append(reasons,'DUTIES_OR_REQUIREMENTS_REQUIRED');
 end if;
 if v.quality_score<80 then reasons:=array_append(reasons,'QUALITY_BELOW_80'); end if;
 if v.last_seen>now()+interval '5 minutes' or v.last_seen<now()-interval '60 days' then
  reasons:=array_append(reasons,'SOURCE_OBSERVATION_STALE');
 end if;
 if nullif(n->>'expiresAt','') is not null then
  if n->>'expiresAt' !~ '^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$'
    or n->>'expiresAt'<=to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') then
   reasons:=array_append(reasons,'EXPIRED_VACANCY');
  end if;
 end if;
 if exists(select 1 from public.jobkix_vacancies native where native.id=v.id) then
  reasons:=array_append(reasons,'NATIVE_ID_COLLISION');
 end if;
 return jsonb_build_object('id',v.id,'state',v.state,'version',v.version,
  'qualityScore',v.quality_score,'eligible',cardinality(reasons)=0,'reasons',to_jsonb(reasons));
end $$;
revoke all on function public.jobkix_supply_r4_assess(uuid) from public,anon,authenticated;
grant execute on function public.jobkix_supply_r4_assess(uuid) to service_role;

create or replace function public.jobkix_supply_r4_decide(
 p_id uuid,p_version integer,p_action text,p_actor text,p_key uuid,p_automatic boolean default false
) returns jsonb language plpgsql volatile security invoker set search_path=pg_catalog,public as $$
declare
 v public.jobkix_supply_vacancies;
 s public.jobkix_supply_sources;
 prior public.jobkix_supply_r4_receipts;
 old_state text;
 assessment jsonb;
 receipt jsonb;
begin
 if nullif(btrim(p_actor),'') is null or p_key is null or p_id is null or p_version is null or
  p_action not in ('approved','rejected','needs_review','published','withdrawn') then
  return jsonb_build_object('ok',false,'code','INVALID_INPUT');
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor||':'||p_key::text,0));
 select * into prior from public.jobkix_supply_r4_receipts
  where actor=p_actor and idempotency_key=p_key;
 if found then
  if prior.vacancy_id<>p_id or prior.decision<>p_action then
   return jsonb_build_object('ok',false,'code','IDEMPOTENCY_CONFLICT');
  end if;
  return prior.result||jsonb_build_object('replayed',true);
 end if;
 select * into v from public.jobkix_supply_vacancies where id=p_id for update;
 if not found then return jsonb_build_object('ok',false,'code','NOT_FOUND'); end if;
 -- Replay after the row lock: concurrent retries must not become false version conflicts.
 select * into prior from public.jobkix_supply_r4_receipts where actor=p_actor and idempotency_key=p_key;
 if found then
  if prior.vacancy_id<>p_id or prior.decision<>p_action then
   return jsonb_build_object('ok',false,'code','IDEMPOTENCY_CONFLICT');
  end if;
  return prior.result||jsonb_build_object('replayed',true);
 end if;
 if v.version<>p_version then
  return jsonb_build_object('ok',false,'code','VERSION_CONFLICT','actualVersion',v.version);
 end if;
 old_state:=v.state;
 if not (
  (p_action='approved' and old_state in ('ready','needs_review'))
  or (p_action='rejected' and old_state in ('new','ready','needs_review','approved'))
  or (p_action='needs_review' and old_state in ('ready','approved'))
  or (p_action='published' and (old_state='approved' or (p_automatic and old_state='ready')))
  or (p_action='withdrawn' and old_state='published')
 ) then
  return jsonb_build_object('ok',false,'code','INVALID_TRANSITION','state',old_state);
 end if;
 if p_action='published' then
  select * into s from public.jobkix_supply_sources where id=v.source_id for share;
  if p_automatic and (not found or s.config->>'autoPublish' is distinct from 'true') then
   return jsonb_build_object('ok',false,'code','AUTO_PUBLICATION_NOT_AUTHORIZED');
  end if;
  assessment:=public.jobkix_supply_r4_assess(p_id);
  if (assessment->>'eligible') is distinct from 'true' then
   return jsonb_build_object('ok',false,'code','PUBLICATION_NOT_ELIGIBLE','assessment',assessment);
  end if;
 end if;
 update public.jobkix_supply_vacancies set
  state=p_action,version=v.version+1,updated_at=now(),
  approved_by=case when p_action='approved' and not p_automatic then p_actor::uuid else approved_by end,
  published_by=case when p_action='published' and not p_automatic then p_actor::uuid else published_by end,
  published_at=case when p_action='published' then now() when p_action='withdrawn' then null else published_at end
 where id=p_id and version=p_version;
 if not found then return jsonb_build_object('ok',false,'code','VERSION_CONFLICT'); end if;
 if p_action='published' and not public.jobkix_r3_external_visible(p_id) then
  raise exception 'R4_PUBLIC_VISIBILITY_PARITY_FAILURE' using errcode='P0001';
 end if;
 receipt:=jsonb_build_object('ok',true,'id',p_id,'state',p_action,'version',p_version+1,
  'from',old_state,'replayed',false,'published',p_action='published');
 insert into public.jobkix_supply_events(actor,action,source_id,vacancy_id,data)
 values(p_actor,
  case when p_automatic and p_action='published' then 'vacancy.auto_published' else 'vacancy.'||p_action end,
  v.source_id,p_id,
  jsonb_build_object('from',old_state,'to',p_action,'version',p_version+1,'idempotencyKey',p_key,'automatic',p_automatic));
 insert into public.jobkix_supply_r4_receipts(actor,idempotency_key,vacancy_id,decision,result)
 values(p_actor,p_key,p_id,p_action,receipt);
 return receipt;
end $$;
revoke all on function public.jobkix_supply_r4_decide(uuid,integer,text,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.jobkix_supply_r4_decide(uuid,integer,text,text,uuid,boolean) to service_role;

-- Source-backed editorial enrichment has the same all-or-nothing audit guarantee
-- as the publication decision. The server supplies a constrained, verified patch.
create or replace function public.jobkix_supply_r4_enrich(
 p_id uuid,p_version integer,p_actor text,p_normalized jsonb,p_notes text,
 p_quality integer,p_evidence text default null
) returns jsonb language plpgsql volatile security invoker set search_path=pg_catalog,public as $$
declare v public.jobkix_supply_vacancies;
begin
 if p_id is null or p_version is null or nullif(btrim(p_actor),'') is null
  or p_normalized is null or jsonb_typeof(p_normalized)<>'object'
  or p_quality not between 0 and 100 then
  return jsonb_build_object('ok',false,'code','INVALID_INPUT');
 end if;
 select * into v from public.jobkix_supply_vacancies where id=p_id for update;
 if not found then return jsonb_build_object('ok',false,'code','NOT_FOUND'); end if;
 if v.version<>p_version then return jsonb_build_object('ok',false,'code','VERSION_CONFLICT','actualVersion',v.version); end if;
 if v.state in ('published','withdrawn') then return jsonb_build_object('ok',false,'code','INVALID_TRANSITION'); end if;
 if (p_normalized->>'countryEvidence') is distinct from (v.normalized->>'countryEvidence')
  or (p_normalized->>'applicationUrl') is distinct from (v.normalized->>'applicationUrl')
  or (p_normalized->>'expiresAt') is distinct from (v.normalized->>'expiresAt') then
  return jsonb_build_object('ok',false,'code','PROVENANCE_FIELD_IMMUTABLE');
 end if;
 if p_evidence is not null and p_evidence is distinct from v.canonical_url then
  return jsonb_build_object('ok',false,'code','EDITORIAL_SOURCE_EVIDENCE_REQUIRED');
 end if;
 update public.jobkix_supply_vacancies set normalized=p_normalized,review_notes=left(coalesce(p_notes,''),2000),
 quality_score=p_quality,version=p_version+1,updated_at=now() where id=p_id and version=p_version;
 if not found then return jsonb_build_object('ok',false,'code','VERSION_CONFLICT'); end if;
 insert into public.jobkix_supply_events(actor,action,source_id,vacancy_id,data)
 values(p_actor,'vacancy.enriched',v.source_id,p_id,
 jsonb_build_object('fromVersion',p_version,'toVersion',p_version+1,'oldScore',v.quality_score,
 'newScore',p_quality,'evidenceUrl',p_evidence));
 return jsonb_build_object('ok',true,'id',p_id,'state',v.state,'version',p_version+1,'quality_score',p_quality);
end $$;
revoke all on function public.jobkix_supply_r4_enrich(uuid,integer,text,jsonb,text,integer,text) from public,anon,authenticated;
grant execute on function public.jobkix_supply_r4_enrich(uuid,integer,text,jsonb,text,integer,text) to service_role;
commit;
