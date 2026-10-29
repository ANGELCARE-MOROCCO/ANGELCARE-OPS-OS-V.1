-- Explicit operator recovery for the reported production incident.
-- No resource is created, republished, translated or moved between scopes.
begin;
do $recovery$
declare document public.ac_dce_records; home public.ac_dce_records;
  proposed jsonb; live jsonb; lang text; total integer; before_data jsonb;
  actor text; created boolean:=false;
begin
  perform pg_advisory_xact_lock(hashtextextended('kidflix-public-recovery-my.angelcarehub.com',0));
  if exists(select 1 from public.ac_dce_events where channel='admin' and action='kidflix_public_recovery_r1' and data->>'host'='my.angelcarehub.com') then
    raise notice 'Recovery already recorded; no activation repeated. Use the verification query.';
    return;
  end if;
  select count(*) into total from public.ac_dce_records x
    join public.ac_dce_editions e on e.record_id=x.id and e.locale='fr'
    join public.ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id
    where x.key='kf-dg-dev-01' and x.kind='experience' and x.family='documents'
      and x.lifecycle<>'archived' and z.state='published' and z.manifest->>'editionLocale'='fr'
      and e.tenant_id is not distinct from x.tenant_id and e.territory_id is not distinct from x.territory_id
      and z.tenant_id is not distinct from x.tenant_id and z.territory_id is not distinct from x.territory_id
      and coalesce(z.manifest->'definition'->>'visibility','free')='free';
  if total<>1 then raise exception 'RECOVERY_REQUIRES_ONE_CONFIRMED_PUBLIC_FR_DOCUMENT: found %',total;end if;
  select x.* into document from public.ac_dce_records x
    join public.ac_dce_editions e on e.record_id=x.id and e.locale='fr'
    join public.ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id
    where x.key='kf-dg-dev-01' and x.kind='experience' and x.family='documents'
      and x.lifecycle<>'archived' and z.state='published' and z.manifest->>'editionLocale'='fr'
      and e.tenant_id is not distinct from x.tenant_id and e.territory_id is not distinct from x.territory_id
      and z.tenant_id is not distinct from x.tenant_id and z.territory_id is not distinct from x.territory_id
      and coalesce(z.manifest->'definition'->>'visibility','free')='free';
  if exists(select 1 from public.ac_dce_records where kind='setting' and key='kidflix-homepage'
    and lower(data->>'liveHost')='my.angelcarehub.com' and
    (tenant_id is distinct from document.tenant_id or territory_id is distinct from document.territory_id))
    then raise exception 'PUBLIC_HOST_BELONGS_TO_ANOTHER_SCOPE';end if;
  select * into home from public.ac_dce_records where kind='setting' and key='kidflix-homepage'
    and tenant_id is not distinct from document.tenant_id and territory_id is not distinct from document.territory_id for update;
  if home.lifecycle='archived' then raise exception 'ARCHIVED_HOMEPAGE_REQUIRES_EXPLICIT_RESTORE';end if;
  if coalesce(home.data->>'liveHost','') not in('','my.angelcarehub.com') then raise exception 'EXISTING_DOMAIN_BINDING_PROTECTED';end if;
  actor:='sql:public-journey-recovery-r1';
  before_data:=coalesce(home.data,'{}'::jsonb);
  proposed:=before_data||jsonb_build_object('liveHost','my.angelcarehub.com');
  live:=coalesce(nullif(proposed->'live','null'::jsonb),'{}'::jsonb);
  if jsonb_typeof(live)<>'object' then raise exception 'INVALID_HOMEPAGE_LIVE_DATA';end if;
  foreach lang in array array['fr','en','ar'] loop
    if live ? lang then
      if jsonb_typeof(live->lang)<>'object' or live->lang->>'publishedAt' is null then raise exception 'EXISTING_LIVE_EDITION_REQUIRES_REVIEW: %',lang;end if;
      if (coalesce(live->lang->'edition'->>'startsAt','')<>'' and (live->lang->'edition'->>'startsAt')::timestamptz>now()) or
         (coalesce(live->lang->'edition'->>'endsAt','')<>'' and (live->lang->'edition'->>'endsAt')::timestamptz<=now()) then raise exception 'EXISTING_PUBLICATION_WINDOW_PROTECTED: %',lang;end if;
    else
      -- An empty edition resolves to the shipped native homepage defaults.
      -- Never publish a saved/unreviewed homepage draft during incident recovery.
      live:=live||jsonb_build_object(lang,jsonb_build_object('edition','{}'::jsonb,'revision',coalesce(home.revision,0)+1,'publishedAt',now()));
    end if;
  end loop;
  proposed:=proposed||jsonb_build_object('live',live);
  if home.id is null then
    insert into public.ac_dce_records(kind,key,title,audience,data,created_by,updated_by,tenant_id,territory_id)
      values('setting','kidflix-homepage','KidFlix · public homepage','parent',proposed,actor,actor,document.tenant_id,document.territory_id) returning * into home;
    created:=true;
  else
    insert into public.ac_dce_versions(record_id,revision,snapshot,actor_id)values(home.id,home.revision,to_jsonb(home),actor)on conflict(record_id,revision)do nothing;
    update public.ac_dce_records set data=proposed,revision=revision+1,updated_at=now(),updated_by=actor where id=home.id returning * into home;
  end if;
  insert into public.ac_dce_events(channel,action,record_id,actor_id,tenant_id,territory_id,data)
    values('admin','kidflix_public_recovery_r1',home.id,actor,home.tenant_id,home.territory_id,
      jsonb_build_object('host','my.angelcarehub.com','documentId',document.id,'created',created,'beforeData',before_data,'afterData',proposed,'reason','Operator-requested recovery of published resource discovery'));
  foreach lang in array array['fr','en','ar'] loop
    if public.ac_kidflix_home('my.angelcarehub.com',lang)->>'configured' is distinct from 'true' then raise exception 'POST_RECOVERY_CONFIGURATION_FAILED: %',lang;end if;
  end loop;
  if public.ac_kidflix_experience('my.angelcarehub.com','fr','kf-dg-dev-01') is null then raise exception 'POST_RECOVERY_DOCUMENT_NOT_PUBLIC';end if;
end $recovery$;
commit;

-- Last result is an immediately usable release verification, not an empty success.
select lang as locale, public.ac_kidflix_home('my.angelcarehub.com',lang)->>'configured' as configured,
  public.ac_kidflix_catalogue('my.angelcarehub.com',lang,'{}'::jsonb,1,false)->>'total' as public_resources
from unnest(array['fr','en','ar'])lang;
