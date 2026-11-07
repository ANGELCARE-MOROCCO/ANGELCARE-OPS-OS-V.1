-- AC-NOTIFY-PROMAX-R1 / 3. Projection, native scope checks and per-operator state.
begin;
create or replace function public.ac_nc_project(p_limit int default 500)returns int language plpgsql security definer set search_path=public,pg_temp as $$
declare e record;n int:=0;begin
 if not pg_try_advisory_xact_lock(773210061)then return 0;end if;
 update ac_nc_worker_state set last_started_at=now()where singleton;
 for e in select *from ac_nc_events where projected_at is null and attempts<8 and next_attempt_at<=now()order by id for update skip locked limit least(greatest(p_limit,1),2000)loop
 begin
 insert into ac_nc_threads(source_id,thread_key,object_key,safe,scope,world,severity,actionable,last_event,last_at)
 values(e.source_id,e.thread_key,e.object_key,e.safe,e.scope,e.world,e.severity,e.actionable,e.id,e.occurred_at)
 on conflict(source_id,thread_key)do update set
 version=ac_nc_threads.version+1,event_count=ac_nc_threads.event_count+1,
 object_key=case when excluded.last_event>ac_nc_threads.last_event then excluded.object_key else ac_nc_threads.object_key end,
 safe=case when excluded.last_event>ac_nc_threads.last_event then excluded.safe else ac_nc_threads.safe end,
 scope=case when excluded.last_event>ac_nc_threads.last_event then excluded.scope else ac_nc_threads.scope end,
 world=case when excluded.last_event>ac_nc_threads.last_event then excluded.world else ac_nc_threads.world end,
 severity=case when excluded.last_event>ac_nc_threads.last_event then excluded.severity else ac_nc_threads.severity end,
 actionable=case when excluded.last_event>ac_nc_threads.last_event then excluded.actionable else ac_nc_threads.actionable end,
 last_event=greatest(ac_nc_threads.last_event,excluded.last_event),last_at=greatest(ac_nc_threads.last_at,excluded.last_at);
 update ac_nc_events set projected_at=now(),error_code=null where id=e.id;n:=n+1;
 exception when others then update ac_nc_events set attempts=attempts+1,next_attempt_at=now()+least(interval '1 hour',interval '10 seconds'*power(2,least(attempts,8))),error_code='PROJECTION_FAILED'where id=e.id;end;
 end loop;
 update ac_nc_worker_state set last_success_at=now(),processed=processed+n,last_error_code=null where singleton;return n;end $$;
create or replace function public.ac_nc_allowed(t ac_nc_threads,p jsonb)returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
declare r jsonb;s jsonb;a jsonb;c jsonb;k text;match boolean;begin
 if not(p->'sources' ? t.source_id)then return false;end if;
 select config into c from ac_nc_sources where id=t.source_id and enabled;if c is null then return false;end if;
 r:=ac_nc_native(t.source_id,t.object_key);
 if r is null then return coalesce((p->>'global')::boolean,false)and coalesce(p->>'tenant','')=''and coalesce(p->>'territory','')='';end if;
 s:=ac_nc_scope(t.source_id,r);
 if nullif(p->>'tenant','')is not null and s->>'tenant_id' is distinct from p->>'tenant'then return false;end if;
 if nullif(p->>'territory','')is not null and s->>'territory_id'is distinct from p->>'territory'and not(s='{}'and c->>'globalRecord'='true')then return false;end if;
 if p->>'global'='true'then return true;end if;
 if s ? 'unresolved' or s ? 'organization_id'or s ? 'school_id'then return false;end if;
 for a in select value from jsonb_array_elements(coalesce(p->'scopes','[]'))loop
 match:=true;
 if a->>'type'='global'then return true;end if;
 if a->>'type'not in('tenant','territory','read_only')then continue;end if;
 if nullif(a->>'tenant','')is null and nullif(a->>'territory','')is null then continue;end if;
 if nullif(a->>'tenant','')is not null and s->>'tenant_id'is distinct from a->>'tenant'then match:=false;end if;
 if nullif(a->>'territory','')is not null and s->>'territory_id'is distinct from a->>'territory'then match:=false;end if;
 if match then return true;end if;
 end loop;return false;end $$;
create or replace function public.ac_nc_filter(t ac_nc_threads,r ac_nc_recipients,f jsonb)returns boolean language sql stable set search_path=public,pg_temp as $$
 select (coalesce(f->>'world','all')='all'or t.world=f->>'world')
 and(coalesce(f->>'source','')=''or t.source_id=f->>'source')
 and(coalesce(f->>'severity','all')='all'or t.severity=f->>'severity')
 and(coalesce(f->>'query','')=''or lower(t.safe::text)like '%'||lower(replace(replace(left(f->>'query',100),'%','\%'),'_','\_'))||'%')
 and(case coalesce(f->>'view','unread')when 'unread'then t.version>coalesce(r.read_version,0)when 'action'then t.actionable when 'critical'then t.actionable and t.severity='critical'else true end)
 and(case when f->>'view'='archived'then coalesce(r.archive_version,0)>=t.version else coalesce(r.archive_version,0)<t.version or(t.actionable and t.severity='critical')end)
 and(coalesce(r.snoozed_until,'-infinity')<=now()or(t.actionable and t.severity='critical')or f->>'view'='all')
$$;
create or replace function public.ac_nc_personal(t ac_nc_threads,p_actor text)returns boolean language sql stable set search_path=public,pg_temp as $$
 select (t.severity='critical'and t.actionable)or not coalesce((select muted_sources ? t.source_id from ac_nc_preferences where actor_id=p_actor),false)
$$;
create or replace function public.ac_nc_read(p_actor text,p_policy jsonb,p_filter jsonb default '{}',p_cursor jsonb default null,p_limit int default 30)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare answer jsonb;begin
 if nullif(p_actor,'')is null or octet_length(p_filter::text)>2048 then raise exception 'INVALID_NOTIFICATION_READ';end if;
 -- Delivery is internal eligibility, not message transport. Read state is never changed by a GET.
 insert into ac_nc_recipients(actor_id,thread_id)select p_actor,t.id from ac_nc_threads t where ac_nc_allowed(t,p_policy)on conflict do nothing;
 with visible as materialized(select t.*,r.read_version,r.archive_version,r.snoozed_until,r.pinned from ac_nc_threads t join ac_nc_recipients r on r.thread_id=t.id and r.actor_id=p_actor where ac_nc_allowed(t,p_policy)),
 active as(select *from visible where ac_nc_personal(jsonb_populate_record(null::ac_nc_threads,to_jsonb(visible)),p_actor) and (archive_version<version or(severity='critical'and actionable))and(snoozed_until is null or snoozed_until<=now()or(severity='critical'and actionable))),
 picked as(select t.*,r.read_version read_through,r.pinned is_pinned from ac_nc_threads t join ac_nc_recipients r on r.thread_id=t.id and r.actor_id=p_actor
 where ac_nc_allowed(t,p_policy)and ac_nc_filter(t,r,p_filter)and(coalesce(p_filter->>'view','unread')in('all','archived')or ac_nc_personal(t,p_actor))
 and(p_cursor is null or(t.last_at,t.id)<((p_cursor->>'at')::timestamptz,(p_cursor->>'id')::uuid))
 order by t.last_at desc,t.id desc limit least(greatest(p_limit,1),100)),
 items as(select jsonb_build_object('id',id,'source',source_id,'world',world,'safe',safe,'severity',severity,'actionable',actionable,'version',version,'eventCount',event_count,'at',last_at,'unread',version>read_through,'pinned',is_pinned)j,last_at,id from picked)
 select jsonb_build_object('items',coalesce((select jsonb_agg(j order by last_at desc,id desc)from items),'[]'),
 'cursor',(select jsonb_build_object('at',last_at,'id',id)from picked order by last_at,id limit 1),
 'counts',jsonb_build_object('unread',(select count(*)from active where version>read_version),'critical',(select count(*)from active where severity='critical'and actionable),'actionable',(select count(*)from active where actionable),'worlds',coalesce((select jsonb_object_agg(world,n)from(select world,count(*)n from active where version>read_version group by world)a),'{}')),
 'health',jsonb_build_object('sources',coalesce((select jsonb_agg(jsonb_build_object('id',id,'state',state,'reason',reason,'lastCapture',last_capture_at,'checkedAt',checked_at))from ac_nc_sources where p_policy->'sources'?id),'[]'),
 'worker',(select jsonb_build_object('lastSuccess',last_success_at,'stale',last_success_at is null or last_success_at<now()-interval '90 seconds')from ac_nc_worker_state where singleton),
 'pending',(select count(*)from ac_nc_events where projected_at is null and p_policy->'sources'?source_id),
 'oldestPending',(select min(occurred_at)from ac_nc_events where projected_at is null and p_policy->'sources'?source_id),
 'failed',(select count(*)from ac_nc_events where projected_at is null and attempts>=5 and p_policy->'sources'?source_id)),
 'rules',coalesce((select jsonb_object_agg(id,jsonb_build_object('minimumSeverity',coalesce(config->>'minimumSeverity','info'),'expiryWarningDays',coalesce((config->>'expiryWarningDays')::int,7),'version',coalesce((config->>'ruleVersion')::int,0)))from ac_nc_sources where p_policy->'sources'?id),'{}'),
 'preferences',coalesce((select to_jsonb(p)-'actor_id'from ac_nc_preferences p where actor_id=p_actor),'{}'),
 'generatedAt',now())into answer;return answer;end $$;
create or replace function public.ac_nc_command(p_actor text,p_policy jsonb,p_request uuid,p_command jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
#variable_conflict use_column
declare prev ac_nc_receipts;t ac_nc_threads;r ac_nc_recipients;b ac_nc_read_batches;op text:=p_command->>'action';v bigint;result jsonb;entries jsonb;n int;src ac_nc_sources;prior_rule jsonb;begin
 if nullif(p_actor,'')is null or octet_length(p_command::text)>8192 then raise exception 'INVALID_NOTIFICATION_COMMAND';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,5));
 select *into prev from ac_nc_receipts where actor_id=p_actor and request_id=p_request;
 if found then if prev.command<>p_command then raise exception 'IDEMPOTENCY_KEY_REUSED';end if;return prev.result;end if;
 if op in('source_rule','retry_source','backfill_preview','backfill_apply')then
 if p_policy->>'manage'<>'true'or nullif(p_policy->>'tenant','')is not null or nullif(p_policy->>'territory','')is not null then raise exception 'INVALID_GLOBAL_SCOPE_REQUIRED';end if;
 select *into src from ac_nc_sources where id=p_command->>'source'and p_policy->'sources'?id for update;
 if not found or length(coalesce(p_command->>'reason',''))not between 8 and 160 then raise exception 'INVALID_SOURCE_OR_REASON';end if;
 prior_rule:=src.config;
 if op='source_rule'then
 if p_command->>'minimumSeverity'not in('info','attention','critical')or(p_command->>'expiryWarningDays')::int not between 0 and 90 then raise exception 'INVALID_SOURCE_RULE';end if;
 update ac_nc_sources set config=config||jsonb_build_object('minimumSeverity',p_command->>'minimumSeverity','expiryWarningDays',(p_command->>'expiryWarningDays')::int,'ruleVersion',coalesce((config->>'ruleVersion')::int,0)+1)where id=src.id;
 result:=jsonb_build_object('saved',true,'source',src.id);
 elsif op='retry_source'then
 update ac_nc_events set next_attempt_at=now(),attempts=0,error_code=null where id in(select id from ac_nc_events where source_id=src.id and projected_at is null and attempts>0 order by id limit 100);
 get diagnostics n=row_count;result:=jsonb_build_object('retried',n);
 else result:=ac_nc_backfill(src.id,p_command->>'after',100,op='backfill_apply');end if;
 insert into ac_nc_policy_changes(actor_id,request_id,source_id,action,reason,before_rule,after_rule)values(p_actor,p_request,src.id,op,p_command->>'reason',prior_rule,(select config from ac_nc_sources where id=src.id));
 elsif op='prepare_read_all'then
 select coalesce(jsonb_object_agg(t.id::text,t.version),'{}'),count(*)into entries,n from ac_nc_threads t left join ac_nc_recipients r on r.thread_id=t.id and r.actor_id=p_actor where ac_nc_allowed(t,p_policy)and ac_nc_filter(t,r,coalesce(p_command->'filter','{}'))and(coalesce(p_command->'filter'->>'view','unread')in('all','archived')or ac_nc_personal(t,p_actor));
 if n>10000 then raise exception 'REFINE_FILTER_MAX_10000_THREADS';end if;
 insert into ac_nc_read_batches(actor_id,filter,versions,affected)values(p_actor,coalesce(p_command->'filter','{}'),entries,n)returning *into b;
 result:=jsonb_build_object('token',b.id,'affected',n,'expiresAt',b.expires_at);
 elsif op='apply_read_all'then
 select *into b from ac_nc_read_batches where id=(p_command->>'token')::uuid and actor_id=p_actor for update;
 if not found or b.expires_at<now()then raise exception 'READ_SNAPSHOT_EXPIRED';end if;
 insert into ac_nc_recipients(actor_id,thread_id,read_version)
 select p_actor,t.id,least(t.version,e.value::bigint)from jsonb_each_text(b.versions)e join ac_nc_threads t on t.id=e.key::uuid where ac_nc_allowed(t,p_policy)
 on conflict(actor_id,thread_id)do update set read_version=greatest(ac_nc_recipients.read_version,excluded.read_version);
 get diagnostics n=row_count;update ac_nc_read_batches set applied_at=now()where id=b.id;result:=jsonb_build_object('affected',n,'token',b.id);
 elsif op='preferences'then
 if jsonb_typeof(coalesce(p_command->'mutedSources','[]'))<>'array'or jsonb_array_length(coalesce(p_command->'mutedSources','[]'))>200 then raise exception 'INVALID_PREFERENCES';end if;
 if exists(select 1 from jsonb_array_elements_text(coalesce(p_command->'mutedSources','[]'))x where not(p_policy->'sources'?x))then raise exception 'INVALID_PREFERENCE_SOURCE';end if;
 if coalesce((p_command->>'quietStart')::int,0)not between 0 and 23 or coalesce((p_command->>'quietEnd')::int,0)not between 0 and 23 then raise exception 'INVALID_QUIET_HOURS';end if;
 insert into ac_nc_preferences(actor_id,locale,muted_sources,quiet_start,quiet_end)values(p_actor,case when p_command->>'locale'in('fr','en','ar')then p_command->>'locale'else 'fr'end,coalesce(p_command->'mutedSources','[]'),(p_command->>'quietStart')::int,(p_command->>'quietEnd')::int)
 on conflict(actor_id)do update set locale=excluded.locale,muted_sources=excluded.muted_sources,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,updated_at=now();result:='{"saved":true}';
 else
 select *into t from ac_nc_threads where id=(p_command->>'id')::uuid;
 if not found or not ac_nc_allowed(t,p_policy)then raise exception 'NOTIFICATION_NOT_ACCESSIBLE';end if;
 v:=(p_command->>'version')::bigint;if v is null or v<1 or v>t.version then raise exception 'INVALID_READ_VERSION';end if;
 insert into ac_nc_recipients(actor_id,thread_id)values(p_actor,t.id)on conflict do nothing;
 select *into r from ac_nc_recipients where actor_id=p_actor and thread_id=t.id for update;
 if op='read'then update ac_nc_recipients set read_version=greatest(read_version,v)where actor_id=p_actor and thread_id=t.id;
 elsif op='unread'then update ac_nc_recipients set read_version=least(read_version,v-1)where actor_id=p_actor and thread_id=t.id;
 elsif op='archive'then update ac_nc_recipients set archive_version=greatest(archive_version,v)where actor_id=p_actor and thread_id=t.id;
 elsif op='unarchive'then update ac_nc_recipients set archive_version=0 where actor_id=p_actor and thread_id=t.id;
 elsif op='snooze'then
 if t.actionable and t.severity='critical'then raise exception 'CRITICAL_CANNOT_BE_HIDDEN';end if;
 if (p_command->>'until')::timestamptz<=now()or(p_command->>'until')::timestamptz>now()+interval '30 days'then raise exception 'INVALID_SNOOZE';end if;
 update ac_nc_recipients set snoozed_until=(p_command->>'until')::timestamptz where actor_id=p_actor and thread_id=t.id;
 elsif op='unsnooze'then update ac_nc_recipients set snoozed_until=null where actor_id=p_actor and thread_id=t.id;
 elsif op='pin'then update ac_nc_recipients set pinned=not pinned where actor_id=p_actor and thread_id=t.id;
 else raise exception 'UNKNOWN_NOTIFICATION_COMMAND';end if;
 result:=jsonb_build_object('id',t.id,'action',op,'version',v);
 end if;
 insert into ac_nc_receipts(actor_id,request_id,command,result)values(p_actor,p_request,p_command,result);return result;end $$;
create or replace function public.ac_nc_focus(p_actor text,p_policy jsonb,p_id uuid)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare t ac_nc_threads;r jsonb;begin
 select *into t from ac_nc_threads where id=p_id;
 if not found or not ac_nc_allowed(t,p_policy)then raise exception 'NOTIFICATION_NOT_ACCESSIBLE';end if;
 r:=ac_nc_native(t.source_id,t.object_key);
 return jsonb_build_object('id',t.id,'source',t.source_id,'world',t.world,'version',t.version,'eventCount',t.event_count,'safe',t.safe,'current',case when r is null then null else ac_nc_safe(r)end,'deleted',r is null,'at',t.last_at,
 'events',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'safe',e.safe,'severity',e.severity,'at',e.occurred_at)order by e.id desc)from(select *from ac_nc_events where source_id=t.source_id and thread_key=t.thread_key order by id desc limit 40)e),'[]'));
 end $$;
create or replace function public.ac_nc_indicator_counts(p_policy jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare src text;n bigint;answer jsonb:='{}';begin
 foreach src in array array['angelcare_marketplace_journeys','angelcare_marketplace_customer_accounts','angelcare_marketplace_finance_invoices','angelcare_marketplace_approval_requests','angelcare_marketplace_public_inquiries','angelcare_marketplace_admin_action_items']loop
 if not(p_policy->'sources'?src)or to_regclass('public.'||quote_ident(src))is null then continue;end if;
 execute format('select count(*)from public.%I x where public.ac_nc_allowed(jsonb_populate_record(null::public.ac_nc_threads,jsonb_build_object(''source_id'',%L,''object_key'',public.ac_nc_key(%L,to_jsonb(x)))), $1)and coalesce(to_jsonb(x)->>''status'','''')not in(''archived'',''closed'',''completed'',''paid'',''cancelled'',''rejected'',''approved'',''resolved'')',src,src,src)into n using p_policy;
 answer:=answer||jsonb_build_object(src,n);end loop;return answer;end $$;
commit;
