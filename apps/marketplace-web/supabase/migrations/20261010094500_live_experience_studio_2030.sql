-- Live Experience Studio 2030. Apply in SQL Editor before deploying the new code.
-- Existing active revisions are retained. No atomic/catalogue/pricing table is modified.
begin;
alter table public.angelcare_marketplace_live_experience_campaigns add column if not exists published_snapshot jsonb;
update public.angelcare_marketplace_live_experience_campaigns c set published_snapshot=to_jsonb(c)-'published_snapshot' where status in ('active','scheduled') and published_snapshot is null;
create or replace function public.ac_live_save_2030(p_payload jsonb,p_actor uuid,p_expected_version integer default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.angelcare_marketplace_live_experience_campaigns; n public.angelcare_marketplace_live_experience_campaigns; cid uuid; prior integer;
begin
 cid=nullif(p_payload->>'id','')::uuid;
 if cid is not null then
  select * into c from public.angelcare_marketplace_live_experience_campaigns where id=cid for update;
  if not found then raise exception 'Campaign not found'; end if;
  if p_expected_version is null or c.version<>p_expected_version then raise exception 'Campaign changed; reload before saving' using errcode='40001'; end if;
 else
  cid=gen_random_uuid();c.id=cid;c.status='draft';c.version=0;c.created_at=now();c.created_by=p_actor;
 end if;
 prior=c.version;
 n=jsonb_populate_record(c,p_payload-'id'-'status'-'version'-'published_snapshot'-'created_by'-'created_at'-'updated_by'-'updated_at');
 n.version=prior+1;n.updated_by=p_actor;n.updated_at=now();
 insert into public.angelcare_marketplace_live_experience_campaigns select (n).* on conflict(id) do update set
 campaign_key=excluded.campaign_key,name=excluded.name,kind=excluded.kind,purpose_key=excluded.purpose_key,theme_key=excluded.theme_key,priority=excluded.priority,
 localized_content=excluded.localized_content,media=excluded.media,placement=excluded.placement,trigger=excluded.trigger,targeting=excluded.targeting,frequency=excluded.frequency,schedule=excluded.schedule,truth_source=excluded.truth_source,conversion=excluded.conversion,experiment_id=excluded.experiment_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,version=excluded.version,updated_by=excluded.updated_by,updated_at=excluded.updated_at;
 insert into public.angelcare_marketplace_live_experience_versions(campaign_id,version,snapshot,created_by) values(cid,n.version,to_jsonb(n)-'published_snapshot',p_actor);
 insert into public.angelcare_marketplace_live_experience_audit_events(actor_id,action,object_type,object_id,evidence) values(p_actor,'campaign.draft_saved','campaign',cid::text,jsonb_build_object('version',n.version,'live_unchanged',c.published_snapshot is not null));
 return to_jsonb(n);
end $$;
create or replace function public.ac_live_transition_2030(p_id uuid,p_status text,p_actor uuid,p_expected_version integer,p_reason text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.angelcare_marketplace_live_experience_campaigns; before_status text;
begin
 if nullif(trim(p_reason),'') is null then raise exception 'Reason required';end if;
 select * into c from public.angelcare_marketplace_live_experience_campaigns where id=p_id for update;
 if not found then raise exception 'Campaign not found';end if;
 if c.version<>p_expected_version then raise exception 'Campaign changed; reload before publishing' using errcode='40001';end if;
 before_status=c.status;
 if not (p_status=any(case c.status when 'draft' then array['active','scheduled','archived'] when 'active' then array['active','scheduled','suspended','expired','archived'] when 'scheduled' then array['active','scheduled','suspended','expired','archived'] when 'suspended' then array['active','scheduled','archived'] when 'expired' then array['active','scheduled','archived'] else array[]::text[] end)) then raise exception 'Campaign transition forbidden';end if;
 c.version=c.version+1;c.status=p_status;c.updated_at=now();c.updated_by=p_actor;
 if p_status in ('active','scheduled') then c.published_snapshot=to_jsonb(c)-'published_snapshot';end if;
 update public.angelcare_marketplace_live_experience_campaigns set status=c.status,version=c.version,published_snapshot=c.published_snapshot,updated_at=c.updated_at,updated_by=p_actor where id=p_id;
 insert into public.angelcare_marketplace_live_experience_versions(campaign_id,version,snapshot,created_by) values(p_id,c.version,to_jsonb(c)-'published_snapshot',p_actor);
 insert into public.angelcare_marketplace_live_experience_audit_events(actor_id,action,object_type,object_id,evidence) values(p_actor,'campaign.'||p_status,'campaign',p_id::text,jsonb_build_object('from',before_status,'to',p_status,'reason',p_reason,'version',c.version));
 return to_jsonb(c);
end $$;
revoke all on function public.ac_live_save_2030(jsonb,uuid,integer) from public,anon,authenticated;
revoke all on function public.ac_live_transition_2030(uuid,text,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.ac_live_save_2030(jsonb,uuid,integer) to service_role;
grant execute on function public.ac_live_transition_2030(uuid,text,uuid,integer,text) to service_role;
create unique index if not exists ac_live_verified_receipt_2030 on public.angelcare_marketplace_live_experience_conversions(campaign_id,canonical_object_id) where canonical_object_type='native_receipt_v2030';
commit;
notify pgrst,'reload schema';
