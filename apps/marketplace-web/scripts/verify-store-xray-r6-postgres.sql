\set ON_ERROR_STOP on
-- Disposable CI database only. No production DML.
do $$
begin
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
end $$;
create table public.angelcare_marketplace_live_experience_interactions (
 id uuid primary key,
 created_at timestamptz not null default now(),
 event_type text not null,
 session_key text,
 customer_account_id uuid,
 pathname text not null,
 locale text not null,
 device_class text,
 metadata jsonb not null default '{}'::jsonb
);
insert into public.angelcare_marketplace_live_experience_interactions
(id, created_at, event_type,session_key,pathname,locale,device_class,metadata) values
('10000000-0000-0000-0000-000000000001',now()-interval '120 minutes','xray_page_view','A','/angelcare-marketplace/fr/hospitality','fr','desktop','{"network":{"countryCode":"MA","city":"Casablanca","latitude":"33.57","longitude":"-7.59"},"traffic":{"source":"organic"}}'),
('10000000-0000-0000-0000-000000000002',now()-interval '100 minutes','xray_business_event','A','/angelcare-marketplace/fr/hospitality','fr','desktop','{"network":{"countryCode":"MA","city":"Casablanca","latitude":"33.57","longitude":"-7.59"},"traffic":{"source":"organic"},"businessEvent":"order.paid"}'),
('10000000-0000-0000-0000-000000000003',now()-interval '90 minutes','xray_page_view','B','/angelcare-marketplace/en/hospitality','en','mobile','{"network":{"countryCode":"FR","city":"Paris","latitude":"","longitude":""},"traffic":{"source":"direct"}}'),
('10000000-0000-0000-0000-000000000004',now()-interval '70 minutes','xray_error','C','/angelcare-marketplace/fr/hospitality','fr','mobile','{"network":{"countryCode":"MA","city":"Rabat","latitude":"0","longitude":"0"}}'),
('10000000-0000-0000-0000-000000000005',now()-interval '40 minutes','xray_page_view','D','/angelcare-marketplace/en/hospitality','en','tablet','{"network":{"countryCode":"GB"},"traffic":{"source":"direct"}}');
\i supabase/migrations/20261119110000_angelcare_store_xray_r6_historical_intelligence.sql
do $$
declare
 data jsonb;
 country_data jsonb;
 deny_anon boolean;
 deny_auth boolean;
begin
 select public.angelcare_xray_historical_r6(now()-interval '3 hours',now(),'hour','UTC')
 into data;
 if (data->>'events')::int <> 5 then raise exception 'R6 events incorrect: %',data->>'events'; end if;
 if (data->>'sessions')::int <> 4 then raise exception 'R6 distinct sessions incorrect: %',data->>'sessions'; end if;
 if (data->>'geoSessions')::int <> 1 then raise exception 'R6 geographical coverage incorrect: %',data->>'geoSessions'; end if;
 if (data->>'commerce')::int <> 1 then raise exception 'R6 commerce incorrect: %',data->>'commerce'; end if;
 if (data->>'errors')::int <> 1 then raise exception 'R6 errors incorrect: %',data->>'errors'; end if;
 if jsonb_array_length(data->'locations') <> 1 then raise exception 'R6 invalid city mapping: %',data->'locations'; end if;
 select public.angelcare_xray_historical_r6(now()-interval '3 hours',now(),'hour','UTC','MA')
 into country_data;
 if (country_data->>'sessions')::int <> 2 then raise exception 'R6 country filtering incorrect: %',country_data; end if;
 if (country_data->>'geoSessions')::int <> 1 then raise exception 'R6 country mapping incorrect'; end if;
 select not has_function_privilege('anon','public.angelcare_xray_historical_r6(timestamptz,timestamptz,text,text,text,text,text,text,text,text,text,text,text)','EXECUTE'),
        not has_function_privilege('authenticated','public.angelcare_xray_historical_r6(timestamptz,timestamptz,text,text,text,text,text,text,text,text,text,text,text)','EXECUTE')
 into deny_anon,deny_auth;
 if not deny_anon or not deny_auth then raise exception 'R6 historical RPC leaked to unauthenticated roles'; end if;
end $$;
