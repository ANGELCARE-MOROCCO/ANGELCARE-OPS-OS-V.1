-- AC-NOTIFY-PROMAX-R1 / 2. Safe synchronous transactional capture.
begin;
create or replace function public.ac_nc_safe(r jsonb) returns jsonb language plpgsql immutable set search_path=public,pg_temp as $$
declare k text;v text;a jsonb:='{}';begin
 foreach k in array array['status','state','lifecycle','kind','type','action','result','severity','priority','role_key','scope_type','workspace_key','verification_code','error_code','event_key','event_type','action_key','last_error_code']loop
 v:=r->>k;if v is not null and v ~ '^[a-zA-Z0-9_.:/-]{1,96}$' then a:=a||jsonb_build_object(k,v);end if;end loop;
 foreach k in array array['revision','version','processed_count','failed_count','total_count','attempts','stock','quantity','available_quantity','stock_on_hand','available_stock','total_reported','cursor','file_count','chunk_count']loop
 v:=r->>k;if v ~ '^[0-9]{1,12}$' then a:=a||jsonb_build_object(k,v::bigint);end if;end loop;
 foreach k in array array['id','record_id','journey_id','organization_id','school_id','tenant_id','territory_id','assigned_to','assigned_admin_id']loop
 v:=r->>k;if v ~ '^[a-zA-Z0-9_-]{1,80}$' then a:=a||jsonb_build_object(k,v);end if;end loop;
 foreach k in array array['public_reference','reference']loop
 v:=r->>k;if v ~ '^[A-Z0-9][A-Z0-9_-]{2,60}$' then a:=a||jsonb_build_object(k,v);end if;end loop;
 foreach k in array array['due_at','expires_at','locked_until','lease_until','scheduled_at','updated_at','created_at']loop
 v:=r->>k;if v ~ '^\d{4}-\d\d-\d\dT? .*$' or v ~ '^\d{4}-\d\d-\d\dT' then
 begin a:=a||jsonb_build_object(k,v::timestamptz);exception when others then null;end;end if;end loop;
 foreach k in array array['active','enabled','verified','cj_managed','factory_managed']loop
 if jsonb_typeof(r->k)='boolean'then a:=a||jsonb_build_object(k,r->k);end if;end loop;
 if coalesce(r->>'source_route','')~ '^/[^?]*sanila(/|$)'then a:=a||'{"type":"SANILA_DEMO_REQUEST"}';end if;
 return a;end $$;
create or replace function public.ac_nc_key(t text,r jsonb) returns jsonb language sql stable set search_path=public,pg_temp as $$
 select coalesce(jsonb_object_agg(a.attname,r->a.attname),'{}'::jsonb) from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
 where i.indrelid=to_regclass('public.'||quote_ident(t)) and i.indisprimary
$$;
create or replace function public.ac_nc_native(t text,k jsonb) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare a record;q text:='';r jsonb;typ text;begin
 if not exists(select 1 from ac_nc_sources where id=t and enabled)or k='{}' then return null;end if;
 for a in select key,value from jsonb_each_text(k)loop
 if not exists(select 1 from pg_attribute where attrelid=to_regclass('public.'||quote_ident(t))and attname=a.key and attnum>0 and not attisdropped)then return null;end if;
 select format_type(atttypid,atttypmod)into typ from pg_attribute where attrelid=to_regclass('public.'||quote_ident(t))and attname=a.key;
 q:=q||case when q='' then ''else ' and 'end||format('%I=($1->>%L)::%s',a.key,a.key,typ);end loop;
 execute format('select to_jsonb(x) from public.%I x where %s limit 1',t,q)into r using k;return r;
 exception when undefined_table or undefined_column then return null;end $$;
-- Resolve actual FK ancestry. A string that merely looks like a parent ID is never authorization.
create or replace function public.ac_nc_scope(t text,r jsonb,visited text[] default '{}')returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare a record;k text;v text;s jsonb:='{}';p jsonb;parent jsonb;where_clause text;begin
 if r is null then return jsonb_build_object('unresolved',true);end if;
 foreach k in array array['tenant_id','territory_id','organization_id','school_id']loop
 v:=nullif(r->>k,'');if v is not null then s:=s||jsonb_build_object(k,v);end if;end loop;
 if t in('ac_kidflix_import_sessions','ac_kidflix_interactive_packages')then
 if r->>'scope_key'is null or array_length(string_to_array(r->>'scope_key','|'),1)<>2 then s:=s||'{"unresolved":true}';else
 if split_part(r->>'scope_key','|',1)<>'~'then s:=s||jsonb_build_object('tenant_id',split_part(r->>'scope_key','|',1));end if;
 if split_part(r->>'scope_key','|',2)<>'~'then s:=s||jsonb_build_object('territory_id',split_part(r->>'scope_key','|',2));end if;end if;end if;
 if cardinality(visited)>=6 or t=any(visited)then return s;end if;
 for a in select c.confrelid::regclass::text parent_table,
 array_agg(ch.attname order by z.ord) child_columns,array_agg(pa.attname order by z.ord) parent_columns
 from pg_constraint c cross join lateral unnest(c.conkey,c.confkey)with ordinality z(child_num,parent_num,ord)
 join pg_attribute ch on ch.attrelid=c.conrelid and ch.attnum=z.child_num
 join pg_attribute pa on pa.attrelid=c.confrelid and pa.attnum=z.parent_num
 where c.contype='f' and c.conrelid=to_regclass('public.'||quote_ident(t))and c.confrelid in(select to_regclass('public.'||quote_ident(id))from ac_nc_sources)
 group by c.oid,c.confrelid loop
 where_clause:='';for i in 1..cardinality(a.child_columns)loop
 v:=r->>a.child_columns[i];if v is null then where_clause:='';exit;end if;
 where_clause:=where_clause||case when i=1 then ''else ' and 'end||format('%I::text=%L',a.parent_columns[i],v);end loop;
 if where_clause=''then continue;end if;
 execute format('select to_jsonb(x)from %s x where %s limit 1',a.parent_table,where_clause)into parent;
 if parent is null then s:=s||'{"unresolved":true}';continue;end if;
 p:=ac_nc_scope(replace(a.parent_table,'public.',''),parent,visited||t);
 foreach k in array array['tenant_id','territory_id','organization_id','school_id']loop
 if s ? k and p ? k and s->>k<>p->>k then s:=s||'{"unresolved":true}';end if;end loop;
 s:=p||s;
 end loop;return s;end $$;
create or replace function public.ac_nc_world(t text,r jsonb,s jsonb)returns text language plpgsql stable security definer set search_path=public,pg_temp as $$
declare w text;k text;begin
 select config->>'world'into w from ac_nc_sources where id=t;
 if w<>'dce'then return w;end if;
 k:=coalesce(r->>'key','');
 if k like 'angelcare-imagery-%'then return 'angelcare';end if;
 if k like 'kidflix-%'then return 'kidflix';end if;
 -- Matches native KidFlix discovery authority: explicit homepage ownership by identical tenant/territory.
 if to_regclass('public.ac_dce_records')is not null then
 if exists(select 1 from ac_dce_records h where h.kind='setting' and h.key='kidflix-homepage' and h.lifecycle<>'archived' and h.tenant_id::text is not distinct from s->>'tenant_id' and h.territory_id::text is not distinct from s->>'territory_id')then return 'kidflix';end if;
 end if;return 'angelcare';end $$;
create or replace function public.ac_nc_enqueue(t text,r jsonb,op text,event_identity text default null)returns bigint language plpgsql security definer set search_path=public,pg_temp as $$
declare c jsonb;k jsonb;s jsonb;f jsonb;w text;st text;sev text;act boolean;eid bigint;dedupe text;group_key jsonb:='{}';g text;begin
 select config into c from ac_nc_sources where id=t and enabled;if c is null then return null;end if;
 if c->>'audit'='true'and coalesce(r->>'result','success')='success'and coalesce(r->>'action','')!~ '(access|permission|grant|revok|security|privileg)'then return null;end if;
 k:=ac_nc_key(t,r);if k='{}'then raise exception 'NOTIFICATION_SOURCE_REQUIRES_PRIMARY_KEY';end if;
 s:=ac_nc_scope(t,r);f:=ac_nc_safe(r)||jsonb_build_object('operation',op);
 -- Semantic updates ignore updated_at-only changes and repeated retries.
 w:=ac_nc_world(t,r,s);st:=coalesce(f->>'status',f->>'state',f->>'lifecycle','');
 sev:=case when st ~ '(fail|block|incident|overdue|risk|reject|expired)'or f->>'severity'='critical' then 'critical' when st ~ '(pending|new|review|await|submitted|queued|reported)'then 'attention'when st ~ '(complete|paid|publish|issued|resolved|approved|sent)'then 'positive'else 'info'end;
 if sev<>'critical'and c->>'minimumSeverity'='critical'then sev:='critical';elsif sev in('info','positive')and c->>'minimumSeverity'='attention'then sev:='attention';end if;
 act:=st ~ '(fail|block|incident|overdue|risk|pending|new|review|await|submitted|queued|reported)'and op<>'DELETE';
 if op in('OVERDUE','LEASE_EXPIRED','EXPIRING')then sev:=case when op='EXPIRING'then 'attention'else 'critical'end;act:=true;end if;
 for g in select jsonb_array_elements_text(coalesce(c->'groupFields','[]'))loop
 if nullif(r->>g,'')is not null then group_key:=group_key||jsonb_build_object(g,r->g);end if;end loop;
 dedupe:=coalesce(event_identity,md5(t||k::text||op||txid_current()::text||f::text));
 insert into ac_nc_events(event_key,source_id,object_key,thread_key,safe,scope,world,severity,actionable)
 values(dedupe,t,k,md5(case when group_key='{}'then k::text else group_key::text end),f,s,w,sev,act)on conflict(event_key)do nothing returning id into eid;
 update ac_nc_sources set last_capture_at=now()where id=t;return eid;end $$;
create or replace function public.ac_nc_capture()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb;old_safe jsonb;new_safe jsonb;begin
 r:=case when TG_OP='DELETE'then to_jsonb(OLD)else to_jsonb(NEW)end;
 if TG_OP='UPDATE'then
 old_safe:=ac_nc_safe(to_jsonb(OLD))-'updated_at';new_safe:=ac_nc_safe(r)-'updated_at';
 if old_safe=new_safe and ac_nc_scope(TG_TABLE_NAME,to_jsonb(OLD))=ac_nc_scope(TG_TABLE_NAME,r)then return NEW;end if;end if;
 perform ac_nc_enqueue(TG_TABLE_NAME,r,TG_OP);return case when TG_OP='DELETE'then OLD else NEW end;end $$;
create or replace function public.ac_nc_install_hooks()returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r record;rel regclass;cols jsonb;n int:=0;begin
 for r in select *from ac_nc_sources order by id loop
 rel:=to_regclass('public.'||quote_ident(r.id));
 if r.id='ac_dce_activity_v2'then continue;end if;
 if not r.enabled then update ac_nc_sources set state='disabled',reason='DISABLED',checked_at=now()where id=r.id;continue;end if;
 if rel is null then update ac_nc_sources set state='blocked',reason='SOURCE_TABLE_MISSING',checked_at=now()where id=r.id;continue;end if;
 if not exists(select 1 from pg_index where indrelid=rel and indisprimary)then update ac_nc_sources set state='blocked',reason='SOURCE_PRIMARY_KEY_MISSING',checked_at=now()where id=r.id;continue;end if;
 select jsonb_agg(attname order by attnum)into cols from pg_attribute where attrelid=rel and attnum>0 and not attisdropped;
 execute format('drop trigger if exists ac_nc_capture_r1 on public.%I',r.id);
 execute format('create trigger ac_nc_capture_r1 after insert or update or delete on public.%I for each row execute function public.ac_nc_capture()',r.id);
 update ac_nc_sources set state='connected',reason='CAPTURE_INSTALLED',installed_at=now(),checked_at=now(),observed_columns=cols where id=r.id;n:=n+1;
 end loop;return jsonb_build_object('connected',n,'registered',(select count(*)from ac_nc_sources));end $$;
commit;
