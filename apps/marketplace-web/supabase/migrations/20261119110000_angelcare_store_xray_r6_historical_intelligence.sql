-- AngelCare Store X-Ray R6: read-only, bounded historical intelligence.
-- NO data deletion, backfill, tracking policy change or permission escalation.
-- Apply to the Marketplace Supabase database before enabling historical queries.
create index if not exists ac_xray_r6_events_created_idx
  on public.angelcare_marketplace_live_experience_interactions (created_at desc, session_key)
  where event_type like 'xray_%';

create index if not exists ac_xray_r6_geo_country_idx
  on public.angelcare_marketplace_live_experience_interactions ((upper(metadata #>> '{network,countryCode}')), created_at desc)
  where event_type like 'xray_%';

create or replace function public.angelcare_xray_historical_r6(
  p_start timestamptz,
  p_end timestamptz,
  p_granularity text default 'day',
  p_timezone text default 'UTC',
  p_country text default null,
  p_device text default null,
  p_route text default null,
  p_source text default null,
  p_intent text default null,
  p_campaign text default null,
  p_locale text default null,
  p_event text default null,
  p_search text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  result jsonb;
begin
  if p_start is null or p_end is null or p_end <= p_start
    or p_end > now() + interval '1 minute'
    or p_end - p_start > interval '367 days' then
    raise exception 'XRAY_R6_INVALID_RANGE';
  end if;
  if p_granularity not in ('hour','day','week','month') then
    raise exception 'XRAY_R6_INVALID_GRANULARITY';
  end if;
  if not exists (select 1 from pg_timezone_names where name = p_timezone) then
    raise exception 'XRAY_R6_INVALID_TIMEZONE';
  end if;
  if length(coalesce(p_search,'')) > 120 or length(coalesce(p_route,'')) > 240 then
    raise exception 'XRAY_R6_INVALID_FILTER';
  end if;

  with source_rows as materialized (
    select e.id, e.created_at, e.event_type, e.pathname, e.locale, e.device_class,
           e.customer_account_id, e.metadata,
           coalesce(nullif(e.session_key,''), e.id::text) as sid,
           nullif(upper(e.metadata #>> '{network,countryCode}'),'') as country,
           nullif(e.metadata #>> '{network,region}','') as region,
           nullif(e.metadata #>> '{network,city}','') as city,
           coalesce(nullif(e.metadata #>> '{traffic,source}',''),'direct') as traffic_source,
           coalesce(e.metadata #>> '{traffic,campaign}','') as campaign,
           coalesce(e.metadata #>> '{businessEvent}','') as business_event,
           case when (e.metadata #>> '{network,latitude}') ~ '^[-+]?[0-9]{1,3}(\.[0-9]{1,8})?$'
             then (e.metadata #>> '{network,latitude}')::numeric else null end as lat,
           case when (e.metadata #>> '{network,longitude}') ~ '^[-+]?[0-9]{1,3}(\.[0-9]{1,8})?$'
             then (e.metadata #>> '{network,longitude}')::numeric else null end as lng
      from public.angelcare_marketplace_live_experience_interactions e
     where e.event_type like 'xray_%'
       and e.created_at >= p_start and e.created_at < p_end
       and (nullif(p_country,'') is null or
         (p_country = '??' and coalesce(nullif(upper(e.metadata #>> '{network,countryCode}'),''),'??')='??') or
         (p_country <> '??' and upper(e.metadata #>> '{network,countryCode}') = upper(p_country)))
       and (nullif(p_device,'') is null or e.device_class = p_device)
       and (nullif(p_route,'') is null or e.pathname like '%' || p_route || '%')
       and (nullif(p_source,'') is null or e.metadata #>> '{traffic,source}' = p_source)
       and (nullif(p_campaign,'') is null or e.metadata #>> '{traffic,campaign}' = p_campaign)
       and (nullif(p_locale,'') is null or e.locale = p_locale)
       and (nullif(p_event,'') is null or e.event_type = 'xray_' || p_event)
       and (nullif(p_intent,'') is null or
            lower(coalesce(e.metadata #>> '{businessEvent}','') || ' ' || e.pathname) like '%' || lower(p_intent) || '%')
       and (nullif(p_search,'') is null or
            e.pathname ilike '%' || p_search || '%' or
            e.metadata #>> '{network,city}' ilike '%' || p_search || '%')
  ),
  normalized as materialized (
    select *,
      (lat between -90 and 90 and lng between -180 and 180) as geo_valid,
      (event_type = 'xray_error' or event_type = 'xray_resource_error'
        or (event_type = 'xray_api_call' and
            (metadata #>> '{status}') ~ '^[4-5][0-9][0-9]$')) as is_error,
      (business_event ~* '(order\.|checkout\.completed|booking\.confirmed|payment\.)') as is_commerce
    from source_rows
  ),
  countries as (
    select coalesce(country,'??') as code,
      count(distinct sid)::integer as sessions,
      count(*)::integer as events,
      count(*) filter (where is_error)::integer as errors,
      count(*) filter (where is_commerce)::integer as commerce
    from normalized group by 1
  ),
  timeseries as (
    select date_trunc(p_granularity, timezone(p_timezone,created_at)) as bucket,
           count(*)::integer as events,
           count(distinct sid)::integer as sessions,
           count(*) filter (where is_error)::integer as errors,
           count(*) filter (where is_commerce)::integer as commerce
    from normalized group by 1
  ),
  geographical as (
    select country as code, region, city,
       round(lat,1) as lat, round(lng,1) as lng,
       count(distinct sid)::integer as sessions,
       count(*) filter(where is_error)::integer as errors,
       count(*) filter(where is_commerce)::integer as commerce
    from normalized
    where country ~ '^[A-Z]{2}$' and city is not null
      and geo_valid is true and not (lat=0 and lng=0)
    group by country,region,city,round(lat,1),round(lng,1)
  ),
  geo_series as (
    select date_trunc('day', timezone(p_timezone,n.created_at)) as bucket,
           n.country as code, count(distinct n.sid)::integer as sessions
    from normalized n
    where n.country in (
      select code from countries where code ~ '^[A-Z]{2}$'
      order by sessions desc limit 8
    )
    group by 1,2
  )
  select jsonb_build_object(
    'from',p_start,'to',p_end,'timezone',p_timezone,'granularity',p_granularity,
    'events', (select count(*) from normalized),
    'sessions', (select count(distinct sid) from normalized),
    'known', (select count(distinct sid) from normalized where customer_account_id is not null),
    'geoSessions', (select count(distinct sid) from normalized
       where country ~ '^[A-Z]{2}$' and city is not null
         and geo_valid is true and not (lat=0 and lng=0)),
    'errors', (select count(*) from normalized where is_error),
    'commerce', (select count(*) from normalized where is_commerce),
    'firstObserved', (select min(created_at) from normalized),
    'lastObserved', (select max(created_at) from normalized),
    'geoCellsTotal', (select count(*) from geographical),
    'countries',coalesce((select jsonb_agg(to_jsonb(x) order by x.sessions desc) from
       (select * from countries order by sessions desc limit 250) x),'[]'::jsonb),
    'timeline',coalesce((select jsonb_agg(to_jsonb(x) order by x.bucket) from
       (select * from timeseries order by bucket limit 9000) x),'[]'::jsonb),
    'locations',coalesce((select jsonb_agg(to_jsonb(x) order by x.sessions desc) from
       (select * from geographical order by sessions desc limit 800) x),'[]'::jsonb),
    'countryTimeline',coalesce((select jsonb_agg(to_jsonb(x) order by x.bucket, x.code) from
       (select * from geo_series order by bucket, code limit 3000) x),'[]'::jsonb)
  ) into result;
  return result;
end;
$function$;

revoke all on function public.angelcare_xray_historical_r6(
 timestamptz,timestamptz,text,text,text,text,text,text,text,text,text,text,text
) from public, anon, authenticated;
grant execute on function public.angelcare_xray_historical_r6(
 timestamptz,timestamptz,text,text,text,text,text,text,text,text,text,text,text
) to service_role;
