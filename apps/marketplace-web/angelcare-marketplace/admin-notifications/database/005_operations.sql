-- AC-NOTIFY-PROMAX-R1 / 5. Bounded monitors, explicit backfill and data retention.
begin;
alter table public.ac_nc_sources add column if not exists monitor_cursor text;
alter table public.ac_nc_sources add column if not exists monitored_at timestamptz;
create table if not exists public.ac_nc_activity_hour(
 record_id uuid not null,hour timestamptz not null,action text not null,total bigint not null default 0,
 emitted bigint not null default 0,primary key(record_id,hour,action));
alter table public.ac_nc_activity_hour enable row level security;
revoke all on public.ac_nc_activity_hour from public,anon,authenticated;
grant all on public.ac_nc_activity_hour to service_role;
create or replace function public.ac_nc_aggregate_activity()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if NEW.environment='production'and NEW.action in('discover','start','complete','download','download_pdf','download_png','print','bookmark','share','love','unlove','action_failed','ad_failed','ad_no_fill','ad_filled','native_conversion')then
 insert into ac_nc_activity_hour(record_id,hour,action,total)values(NEW.record_id,date_trunc('hour',NEW.occurred_at),NEW.action,1)
 on conflict(record_id,hour,action)do update set total=ac_nc_activity_hour.total+1;
 end if;return NEW;end $$;
create or replace function public.ac_nc_monitor(p_source_limit int default 12,p_row_limit int default 100)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
#variable_conflict use_column
declare src record;r record;j jsonb;k jsonb;token text;kind text;deadline timestamptz;fp text;old_fp text;n int:=0;sc int:=0;col text;row_cursor text;lastkey text;st text;begin
 if not pg_try_advisory_xact_lock(773210062)then return '{"busy":true}';end if;
 for src in select *from ac_nc_sources where enabled and state in('connected','degraded')and id<>'ac_dce_activity_v2'order by monitored_at nulls first,id limit least(greatest(p_source_limit,1),200)loop
 sc:=sc+1;row_cursor:=src.monitor_cursor;lastkey:=null;
 begin
 for r in execute format('select to_jsonb(x)j,public.ac_nc_key(%L,to_jsonb(x))::text k from public.%I x where ($1 is null or public.ac_nc_key(%L,to_jsonb(x))::text>$1)order by public.ac_nc_key(%L,to_jsonb(x))::text limit $2',src.id,src.id,src.id,src.id)using row_cursor,least(greatest(p_row_limit,1),1000)loop
 j:=r.j;k:=ac_nc_key(src.id,j);token:=md5(k::text);lastkey:=r.k;st:=coalesce(j->>'status',j->>'state',j->>'lifecycle','');
 foreach col in array array['due_at','expires_at','locked_until','lease_until']loop
 deadline:=null;begin deadline:=nullif(j->>col,'')::timestamptz;exception when others then null;end;
 if deadline is null then continue;end if;
 kind:=case when col='expires_at'and deadline>now()and deadline<now()+make_interval(days=>coalesce((src.config->>'expiryWarningDays')::int,7))then 'EXPIRING'when deadline<now()then case when col in('locked_until','lease_until')then 'LEASE_EXPIRED'else 'OVERDUE'end else null end;
 if kind is null or st ~ '^(completed|complete|resolved|closed|cancelled|canceled|paid|published|issued|rejected|retired|archived|succeeded|sent|provider_accepted)$'then continue;end if;
 fp:=md5(kind||deadline::text||st);select fingerprint into old_fp from ac_nc_condition_state where source_id=src.id and object_token=token and ac_nc_condition_state.kind=col;
 if old_fp is distinct from fp then
 perform ac_nc_enqueue(src.id,j,kind,'condition:'||src.id||token||col||fp);
 insert into ac_nc_condition_state(source_id,object_token,kind,fingerprint)values(src.id,token,col,fp)on conflict(source_id,object_token,kind)do update set fingerprint=excluded.fingerprint,seen_at=now();n:=n+1;end if;
 end loop;
 end loop;
 update ac_nc_sources set monitor_cursor=lastkey,monitored_at=now(),state='connected',reason='CAPTURE_AND_MONITOR_CONNECTED'where id=src.id;
 exception when others then update ac_nc_sources set state='degraded',reason='MONITOR_FAILED_'||SQLSTATE,checked_at=now(),monitored_at=now()where id=src.id;end;
 end loop;
 if to_regclass('public.ac_dce_records')is not null then
 for r in select *from ac_nc_activity_hour where hour<date_trunc('hour',now())and total<>emitted order by hour limit 100 loop
 select to_jsonb(x)into j from ac_dce_records x where id=r.record_id;
 if j is not null then perform ac_nc_enqueue('ac_dce_records',j||jsonb_build_object('type','activity.'||r.action,'total_count',r.total),'ACTIVITY','activity:'||r.record_id||r.hour||r.action||r.total);end if;
 update ac_nc_activity_hour set emitted=r.total where record_id=r.record_id and hour=r.hour and action=r.action;n:=n+1;
 end loop;end if;
 return jsonb_build_object('sources',sc,'conditions',n);end $$;
create or replace function public.ac_nc_backfill(p_source text,p_after text default null,p_limit int default 100,p_apply boolean default false)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r record;lastkey text;n int:=0;begin
 if not exists(select 1 from ac_nc_sources where id=p_source and enabled and state in('connected','degraded')and id<>'ac_dce_activity_v2')then raise exception 'SOURCE_NOT_CONNECTED';end if;
 for r in execute format('select to_jsonb(x)j,public.ac_nc_key(%L,to_jsonb(x))::text k from public.%I x where ($1 is null or public.ac_nc_key(%L,to_jsonb(x))::text>$1)order by public.ac_nc_key(%L,to_jsonb(x))::text limit $2',p_source,p_source,p_source,p_source)using p_after,least(greatest(p_limit,1),500)loop
 lastkey:=r.k;n:=n+1;if p_apply then perform ac_nc_enqueue(p_source,r.j,'BACKFILL','backfill-r1:'||p_source||md5(r.k));end if;end loop;
 return jsonb_build_object('source',p_source,'dryRun',not p_apply,'rows',n,'cursor',lastkey);end $$;
create or replace function public.ac_nc_health_refresh()returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r record;rel regclass;bad int:=0;begin
 for r in select *from ac_nc_sources where enabled loop
 rel:=to_regclass('public.'||quote_ident(r.id));
 if rel is null then update ac_nc_sources set state='blocked',reason='SOURCE_TABLE_MISSING',checked_at=now()where id=r.id;bad:=bad+1;
 elsif not exists(select 1 from pg_trigger where tgrelid=rel and tgname in('ac_nc_capture_r1','ac_nc_activity_r1')and tgenabled in('O','A'))then
 update ac_nc_sources set state='blocked',reason='CAPTURE_TRIGGER_MISSING',checked_at=now()where id=r.id;bad:=bad+1;
 else update ac_nc_sources set checked_at=now()where id=r.id;end if;
 end loop;return jsonb_build_object('blocked',bad,'at',now());end $$;
create or replace function public.ac_nc_diagnostic(p_source text,p_key jsonb,p_codes jsonb)returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb;fp text;prior text;begin
 if p_source<>'ac_dce_releases'or jsonb_typeof(p_codes)<>'array'or jsonb_array_length(p_codes)>30 then raise exception 'INVALID_DIAGNOSTIC';end if;
 if exists(select 1 from jsonb_array_elements_text(p_codes)x where x!~ '^[A-Z0-9_]{1,64}$')then raise exception 'INVALID_DIAGNOSTIC_CODE';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_source||p_key::text,7));
 r:=ac_nc_native(p_source,p_key);if r is null then return;end if;
 fp:=md5(p_codes::text);select fingerprint into prior from ac_nc_condition_state where source_id=p_source and object_token=md5(p_key::text)and kind='readiness';
 if prior is distinct from fp and(p_codes<>'[]'or prior is not null)then
 perform ac_nc_enqueue(p_source,r||jsonb_build_object('status',case when p_codes='[]'then 'resolved'else 'blocked'end,'type',case when p_codes='[]'then 'PUBLIC_MEDIA_RECOVERED'else p_codes->>0 end),'READINESS','readiness:'||md5(p_key::text)||fp||coalesce(prior,'')||txid_current());
 insert into ac_nc_condition_state(source_id,object_token,kind,fingerprint)values(p_source,md5(p_key::text),'readiness',fp)on conflict(source_id,object_token,kind)do update set fingerprint=excluded.fingerprint,seen_at=now();end if;
 end $$;
create or replace function public.ac_nc_retention(p_days int default 90)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare n int;begin
 if p_days not between 30 and 730 then raise exception 'INVALID_RETENTION';end if;
 delete from ac_nc_events where id in(select e.id from ac_nc_events e where projected_at is not null and occurred_at<now()-make_interval(days=>p_days)and not exists(select 1 from ac_nc_threads t where t.last_event=e.id)order by e.id limit 5000);get diagnostics n=row_count;
 delete from ac_nc_read_batches where expires_at<now()-interval '1 day';
 delete from ac_nc_receipts where created_at<now()-interval '30 days';
 delete from ac_nc_activity_hour where hour<now()-interval '30 days'and total=emitted;
 delete from ac_nc_threads where id in(select t.id from ac_nc_threads t where not t.actionable and t.last_at<now()-make_interval(days=>p_days)and not exists(select 1 from ac_nc_recipients r where r.thread_id=t.id and(r.read_version<t.version or r.pinned))order by t.last_at limit 500);
 return jsonb_build_object('eventsRemoved',n);end $$;
commit;
