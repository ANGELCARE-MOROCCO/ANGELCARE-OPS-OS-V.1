
-- SEO POWER COMMAND CENTER 360 · R5
-- Additive: no edits to customer storefronts, existing jobs, SEO publications or R4 activation.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.ac_seo_power_r4_control') IS NULL THEN RAISE EXCEPTION 'SEO_POWER_R4_REQUIRED'; END IF;
  IF to_regclass('public.ac_seo_power_executions') IS NULL THEN RAISE EXCEPTION 'SEO_POWER_R2_REQUIRED'; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ac_seo_power_r5_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  enabled boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.ac_seo_power_r5_control(singleton,enabled) VALUES(true,false) ON CONFLICT(singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ac_seo_power_r5_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ac_seo_power_projects(id),
  title text NOT NULL CHECK(length(title) BETWEEN 3 AND 160),
  source text NOT NULL CHECK(source IN ('manual','scheduled')),
  kind text NOT NULL CHECK(kind IN ('crawl','links','verify','indexnow')),
  state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','paused','completed','cancelled')),
  created_by uuid NOT NULL,
  request_key text NOT NULL CHECK(length(request_key) BETWEEN 8 AND 160),
  target_total integer NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(created_by,request_key)
);
CREATE INDEX IF NOT EXISTS ac_seo_power_r5_campaign_recent ON public.ac_seo_power_r5_campaigns(project_id,created_at DESC);
CREATE INDEX IF NOT EXISTS ac_seo_power_r5_campaign_active ON public.ac_seo_power_r5_campaigns(state,project_id) WHERE state IN ('queued','running','paused');

CREATE TABLE IF NOT EXISTS public.ac_seo_power_r5_campaign_jobs (
  campaign_id uuid NOT NULL REFERENCES public.ac_seo_power_r5_campaigns(id) ON DELETE RESTRICT,
  job_id uuid NOT NULL REFERENCES public.ac_seo_power_jobs(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(campaign_id,job_id)
);
CREATE INDEX IF NOT EXISTS ac_seo_power_r5_job_campaign ON public.ac_seo_power_r5_campaign_jobs(job_id,campaign_id);

CREATE TABLE IF NOT EXISTS public.ac_seo_power_r5_events(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_id uuid REFERENCES public.ac_seo_power_r5_campaigns(id),
  execution_id uuid REFERENCES public.ac_seo_power_executions(id),
  job_id uuid REFERENCES public.ac_seo_power_jobs(id),
  category text NOT NULL CHECK(length(category) BETWEEN 2 AND 50),
  event text NOT NULL CHECK(length(event) BETWEEN 2 AND 70),
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ac_seo_power_r5_events_feed ON public.ac_seo_power_r5_events(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ac_seo_power_r5_events_campaign ON public.ac_seo_power_r5_events(campaign_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.ac_seo_power_r5_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ac_seo_power_projects(id),
  name text NOT NULL CHECK(length(name) BETWEEN 3 AND 100),
  kind text NOT NULL CHECK(kind IN ('crawl','links','verify','indexnow')),
  enabled boolean NOT NULL DEFAULT false,
  interval_minutes integer NOT NULL DEFAULT 1440 CHECK(interval_minutes BETWEEN 15 AND 10080),
  max_pages integer NOT NULL DEFAULT 100 CHECK(max_pages BETWEEN 1 AND 1000),
  next_due_at timestamptz NOT NULL DEFAULT now(),
  last_started_at timestamptz,
  last_campaign_id uuid REFERENCES public.ac_seo_power_r5_campaigns(id),
  version integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ac_seo_power_r5_schedule_due ON public.ac_seo_power_r5_schedules(next_due_at)
 WHERE enabled=true;

CREATE TABLE IF NOT EXISTS public.ac_seo_power_r5_workers (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 3 AND 120),
  last_execution_id uuid REFERENCES public.ac_seo_power_executions(id),
  source text NOT NULL CHECK(source IN ('manual','scheduler')),
  engine text NOT NULL CHECK(engine IN ('legacy','r4','r5')),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NOT NULL DEFAULT now(),
  revision integer NOT NULL DEFAULT 1
);

-- Truthful, single read model: counts are derived from persistent jobs, never fictitious progress.
CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_dashboard(p_project uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE response jsonb; ctrl jsonb; campaigns jsonb; events jsonb; workers jsonb; schedules jsonb; errors jsonb; performance jsonb; queue jsonb;
BEGIN
 SELECT to_jsonb(c) INTO ctrl FROM public.ac_seo_power_r5_control c WHERE singleton;
 SELECT COALESCE(jsonb_agg(c),'[]') INTO campaigns FROM (
  SELECT z.*, CASE WHEN z.total=0 THEN NULL
     ELSE round(100.0*(z.succeeded+z.failed+z.cancelled)::numeric / z.total,1) END AS progress_percent
  FROM (
   SELECT c.id,c.project_id,p.world,c.title,c.source,c.kind,c.state,c.priority,c.target_total,
    c.created_at,c.started_at,c.finished_at,c.updated_at,
    (SELECT count(*) FROM public.ac_seo_power_r5_campaign_jobs x WHERE x.campaign_id=c.id) AS total,
    (SELECT count(*) FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id WHERE x.campaign_id=c.id AND j.state='succeeded') AS succeeded,
    (SELECT count(*) FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id WHERE x.campaign_id=c.id AND j.state='failed') AS failed,
    (SELECT count(*) FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id WHERE x.campaign_id=c.id AND j.state='cancelled') AS cancelled,
    (SELECT count(*) FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id WHERE x.campaign_id=c.id AND j.state='queued') AS queued,
    (SELECT count(*) FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id WHERE x.campaign_id=c.id AND j.state='running') AS running
   FROM public.ac_seo_power_r5_campaigns c JOIN public.ac_seo_power_projects p ON p.id=c.project_id
   WHERE p_project IS NULL OR c.project_id=p_project
   ORDER BY c.created_at DESC LIMIT 40
  ) z
 ) c;
 SELECT COALESCE(jsonb_agg(e),'[]') INTO events FROM (
  SELECT e.id,e.campaign_id,e.execution_id,e.job_id,e.category,e.event,e.detail,e.created_at
  FROM public.ac_seo_power_r5_events e
  WHERE p_project IS NULL OR
   (e.campaign_id IN (SELECT id FROM public.ac_seo_power_r5_campaigns WHERE project_id=p_project))
   OR (e.job_id IN (SELECT id FROM public.ac_seo_power_jobs WHERE project_id=p_project))
   OR (e.execution_id IN (SELECT id FROM public.ac_seo_power_executions WHERE project_id=p_project))
  ORDER BY e.id DESC LIMIT 120
 ) e;
 SELECT COALESCE(jsonb_agg(w),'[]') INTO workers FROM (
  SELECT * FROM public.ac_seo_power_r5_workers ORDER BY last_seen_at DESC LIMIT 30
 ) w;
 SELECT COALESCE(jsonb_agg(s),'[]') INTO schedules FROM (
  SELECT s.*,p.world FROM public.ac_seo_power_r5_schedules s
  JOIN public.ac_seo_power_projects p ON p.id=s.project_id
  WHERE p_project IS NULL OR s.project_id=p_project ORDER BY next_due_at LIMIT 100
 ) s;
 SELECT COALESCE(jsonb_agg(f),'[]') INTO errors FROM (
  SELECT p.world,coalesce(j.result->>'code',left(j.error,100),'UNKNOWN') AS code,count(*) AS total,
   max(j.finished_at) AS latest
  FROM public.ac_seo_power_jobs j JOIN public.ac_seo_power_projects p ON p.id=j.project_id
  WHERE j.state='failed' AND j.recovered_at IS NULL AND (p_project IS NULL OR p.id=p_project)
  GROUP BY p.world,coalesce(j.result->>'code',left(j.error,100),'UNKNOWN')
  ORDER BY count(*) DESC LIMIT 20
 ) f;
 SELECT jsonb_build_object(
  'succeeded15m',(SELECT count(*) FROM public.ac_seo_power_jobs WHERE state='succeeded' AND finished_at>now()-interval '15 minutes' AND (p_project IS NULL OR project_id=p_project)),
  'failed15m',(SELECT count(*) FROM public.ac_seo_power_jobs WHERE state='failed' AND finished_at>now()-interval '15 minutes' AND (p_project IS NULL OR project_id=p_project)),
  'running',(SELECT count(*) FROM public.ac_seo_power_jobs WHERE state='running' AND lease_until>now() AND (p_project IS NULL OR project_id=p_project)),
  'queued',(SELECT count(*) FROM public.ac_seo_power_jobs WHERE state='queued' AND (p_project IS NULL OR project_id=p_project)),
  'overdue',(SELECT count(*) FROM public.ac_seo_power_jobs WHERE state='queued' AND due_at<now()-interval '5 minutes' AND (p_project IS NULL OR project_id=p_project)),
  'unresolved',(SELECT count(*) FROM public.ac_seo_power_jobs WHERE state='failed' AND recovered_at IS NULL AND (p_project IS NULL OR project_id=p_project)),
  'p95Seconds',(SELECT round((percentile_cont(0.95) WITHIN GROUP (ORDER BY extract(epoch FROM finished_at-started_at)))::numeric,2)
    FROM (SELECT a.started_at,a.finished_at FROM public.ac_seo_power_r4_attempts a JOIN public.ac_seo_power_jobs j ON j.id=a.job_id
      WHERE a.finished_at IS NOT NULL AND a.started_at>now()-interval '24 hours'
      AND (p_project IS NULL OR j.project_id=p_project) ORDER BY a.started_at DESC LIMIT 1000) x)
 ) INTO performance;
 SELECT COALESCE(jsonb_agg(j),'[]') INTO queue FROM (
  SELECT j.id,j.project_id,p.world,pg.path,j.kind,j.state,j.attempts,j.error,j.due_at,j.started_at,j.finished_at,j.lease_until,
  j.result->>'code' AS error_code
  FROM public.ac_seo_power_jobs j JOIN public.ac_seo_power_projects p ON p.id=j.project_id
  JOIN public.ac_seo_power_pages pg ON pg.id=j.page_id
  WHERE (p_project IS NULL OR j.project_id=p_project) AND j.state IN ('queued','running','failed')
  ORDER BY CASE j.state WHEN 'running' THEN 0 WHEN 'failed' THEN 1 ELSE 2 END, j.due_at ASC LIMIT 100
 ) j;
 RETURN jsonb_build_object('version',5,'observedAt',now(),'control',ctrl,
  'r4',public.ac_seo_power_r4_status(),'campaigns',campaigns,'events',events,
  'workers',workers,'schedules',schedules,'errors',errors,'performance',performance,'queue',queue,
  'latestExecutions',coalesce((SELECT jsonb_agg(x) FROM
    (SELECT id,project_id,source,state,started_at,finished_at,result
    FROM public.ac_seo_power_executions
    WHERE p_project IS NULL OR project_id=p_project OR project_id IS NULL
    ORDER BY started_at DESC LIMIT 35) x),'[]'));
END $$;

CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_log(
 p_category text,p_event text,p_detail jsonb DEFAULT '{}',
 p_execution uuid DEFAULT NULL,p_job uuid DEFAULT NULL,p_campaign uuid DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE logged bigint;
BEGIN
 IF (SELECT enabled FROM public.ac_seo_power_r5_control WHERE singleton) IS DISTINCT FROM true THEN RETURN NULL; END IF;
 INSERT INTO public.ac_seo_power_r5_events(category,event,detail,execution_id,job_id,campaign_id)
 VALUES(left(p_category,50),left(p_event,70),coalesce(p_detail,'{}'),p_execution,p_job,p_campaign)
 RETURNING id INTO logged;
 RETURN logged;
END $$;

CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_worker_seen(
 p_id text,p_source text,p_engine text,p_execution uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF (SELECT enabled FROM public.ac_seo_power_r5_control WHERE singleton) IS DISTINCT FROM true THEN RETURN; END IF;
 INSERT INTO public.ac_seo_power_r5_workers(id,source,engine,last_execution_id)
 VALUES(left(p_id,120),p_source,p_engine,p_execution)
 ON CONFLICT(id) DO UPDATE SET
  source=excluded.source,engine=excluded.engine,last_execution_id=excluded.last_execution_id,
  last_seen_at=now(),revision=public.ac_seo_power_r5_workers.revision+1;
END $$;

CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_job_event(
 p_execution uuid,p_job uuid,p_event text,p_detail jsonb DEFAULT '{}')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF (SELECT enabled FROM public.ac_seo_power_r5_control WHERE singleton) IS DISTINCT FROM true THEN RETURN; END IF;
 INSERT INTO public.ac_seo_power_r5_events(campaign_id,execution_id,job_id,category,event,detail)
 SELECT x.campaign_id,p_execution,p_job,'job',left(p_event,70),coalesce(p_detail,'{}')
 FROM public.ac_seo_power_r5_campaign_jobs x WHERE x.job_id=p_job;
 IF NOT FOUND THEN
  INSERT INTO public.ac_seo_power_r5_events(execution_id,job_id,category,event,detail)
  VALUES(p_execution,p_job,'job',left(p_event,70),coalesce(p_detail,'{}'));
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_start(
 p_project uuid,p_kind text,p_limit integer,p_title text,p_actor uuid,p_request text,
 p_source text DEFAULT 'manual')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE pr public.ac_seo_power_projects; pg public.ac_seo_power_pages;
 campaign public.ac_seo_power_r5_campaigns; jid uuid; jobs integer=0;payload jsonb;
BEGIN
 IF (SELECT enabled FROM public.ac_seo_power_r5_control WHERE singleton) IS DISTINCT FROM true THEN RAISE EXCEPTION 'R5_DISABLED';END IF;
 IF p_actor IS NULL OR length(p_request) NOT BETWEEN 8 AND 160 OR p_kind NOT IN ('crawl','links','verify','indexnow')
  OR p_source NOT IN ('manual','scheduled') OR p_limit NOT BETWEEN 1 AND 1000 OR length(trim(p_title)) NOT BETWEEN 3 AND 160
 THEN RAISE EXCEPTION 'INVALID_R5_CAMPAIGN';END IF;
 SELECT * INTO STRICT pr FROM public.ac_seo_power_projects WHERE id=p_project AND enabled;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text||':'||p_request,0));
 SELECT * INTO campaign FROM public.ac_seo_power_r5_campaigns WHERE created_by=p_actor AND request_key=p_request;
 IF FOUND THEN RETURN to_jsonb(campaign);END IF;
 INSERT INTO public.ac_seo_power_r5_campaigns(project_id,title,kind,source,created_by,request_key)
 VALUES(pr.id,trim(p_title),p_kind,p_source,p_actor,p_request) RETURNING * INTO campaign;
 FOR pg IN SELECT * FROM public.ac_seo_power_pages
 WHERE project_id=pr.id
 AND (p_kind<>'verify' OR published_change_id IS NOT NULL)
 AND (p_kind<>'links' OR jsonb_typeof(facts->'links')='array')
 AND (p_kind<>'indexnow' OR (indexable=true AND http_status=200 AND coalesce((pr.policy->>'indexNowEnabled')::boolean,false)))
 ORDER BY last_scanned_at NULLS FIRST,id LIMIT p_limit
 LOOP
  payload=CASE WHEN p_kind='verify' THEN jsonb_build_object('changeId',pg.published_change_id)
    WHEN p_kind='crawl' THEN '{"discover":true}'::jsonb ELSE '{}'::jsonb END;
  jid=public.ac_seo_power_r4_enqueue(pg.id,p_kind,payload);
  IF jid IS NOT NULL THEN
   INSERT INTO public.ac_seo_power_r5_campaign_jobs(campaign_id,job_id) VALUES(campaign.id,jid) ON CONFLICT DO NOTHING;
   jobs=jobs+1;
  END IF;
 END LOOP;
 UPDATE public.ac_seo_power_r5_campaigns SET target_total=jobs,state=CASE WHEN jobs=0 THEN 'completed' ELSE 'queued' END,
  finished_at=CASE WHEN jobs=0 THEN now() ELSE NULL END,updated_at=now() WHERE id=campaign.id RETURNING * INTO campaign;
 PERFORM public.ac_seo_power_r5_log('campaign','created',jsonb_build_object('total',jobs,'kind',p_kind,'source',p_source),NULL,NULL,campaign.id);
 RETURN to_jsonb(campaign);
END $$;

-- Campaign management is idempotent with expected current state; running workers finish safely.
CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_campaign_action(
 p_id uuid,p_action text,p_actor uuid,p_expected text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.ac_seo_power_r5_campaigns;target text;
BEGIN
 IF (SELECT enabled FROM public.ac_seo_power_r5_control WHERE singleton) IS DISTINCT FROM true THEN RAISE EXCEPTION 'R5_DISABLED';END IF;
 SELECT * INTO STRICT c FROM public.ac_seo_power_r5_campaigns WHERE id=p_id FOR UPDATE;
 IF c.state<>p_expected THEN RAISE EXCEPTION 'STALE_CAMPAIGN_STATE';END IF;
 IF p_action='pause' AND c.state IN ('queued','running') THEN target='paused';
 ELSIF p_action='resume' AND c.state='paused' THEN target='queued';
 ELSIF p_action='cancel' AND c.state IN ('queued','running','paused') THEN target='cancelled';
 ELSE RAISE EXCEPTION 'INVALID_CAMPAIGN_TRANSITION';END IF;
 UPDATE public.ac_seo_power_r5_campaigns SET state=target,updated_at=now(),
  finished_at=CASE WHEN target='cancelled' THEN now() ELSE NULL END
 WHERE id=c.id RETURNING * INTO c;
 IF target='cancelled' THEN
  UPDATE public.ac_seo_power_jobs j SET state='cancelled',finished_at=now(),error='R5_CAMPAIGN_CANCELLED'
  WHERE j.state='queued' AND EXISTS(SELECT 1 FROM public.ac_seo_power_r5_campaign_jobs x WHERE x.job_id=j.id AND x.campaign_id=c.id)
    AND NOT EXISTS(SELECT 1 FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_r5_campaigns other
        ON other.id=x.campaign_id WHERE x.job_id=j.id AND x.campaign_id<>c.id AND other.state IN ('queued','running'));
 END IF;
 PERFORM public.ac_seo_power_r5_log('campaign',target,jsonb_build_object('actor',p_actor),NULL,NULL,c.id);
 RETURN to_jsonb(c);
END $$;

CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_reconcile() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE changed integer;
BEGIN
 UPDATE public.ac_seo_power_r5_campaigns c SET
  state=CASE WHEN EXISTS(
    SELECT 1 FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id
    WHERE x.campaign_id=c.id AND j.state='running'
   ) THEN 'running' ELSE 'queued' END,
  started_at=coalesce(c.started_at,CASE WHEN EXISTS(
    SELECT 1 FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id
    WHERE x.campaign_id=c.id AND j.started_at IS NOT NULL
  ) THEN now() END),updated_at=now()
 WHERE c.state IN ('queued','running') AND EXISTS(
  SELECT 1 FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id WHERE x.campaign_id=c.id
 ) AND EXISTS(
  SELECT 1 FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id
   WHERE x.campaign_id=c.id AND j.state IN ('queued','running')
 ) AND c.state IS DISTINCT FROM CASE WHEN EXISTS(
    SELECT 1 FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id
    WHERE x.campaign_id=c.id AND j.state='running'
   ) THEN 'running' ELSE 'queued' END;
 UPDATE public.ac_seo_power_r5_campaigns c SET state='completed',finished_at=now(),updated_at=now()
 WHERE c.state IN ('queued','running') AND NOT EXISTS(
  SELECT 1 FROM public.ac_seo_power_r5_campaign_jobs x JOIN public.ac_seo_power_jobs j ON j.id=x.job_id
   WHERE x.campaign_id=c.id AND j.state IN ('queued','running')
 );
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed;
END $$;

CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_schedule_save(
 p_id uuid,p_project uuid,p_name text,p_kind text,p_interval integer,p_limit integer,
 p_enabled boolean,p_actor uuid,p_version integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s public.ac_seo_power_r5_schedules;
BEGIN
 IF (SELECT enabled FROM public.ac_seo_power_r5_control WHERE singleton) IS DISTINCT FROM true THEN RAISE EXCEPTION 'R5_DISABLED';END IF;
 IF p_actor IS NULL OR length(trim(p_name)) NOT BETWEEN 3 AND 100
 OR p_kind NOT IN ('crawl','links','verify','indexnow')
 OR p_interval NOT BETWEEN 15 AND 10080 OR p_limit NOT BETWEEN 1 AND 1000
 OR NOT EXISTS(SELECT 1 FROM public.ac_seo_power_projects WHERE id=p_project AND enabled)
 THEN RAISE EXCEPTION 'INVALID_R5_SCHEDULE';END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.ac_seo_power_r5_schedules(project_id,name,kind,interval_minutes,max_pages,enabled,created_by,next_due_at)
  VALUES(p_project,trim(p_name),p_kind,p_interval,p_limit,p_enabled,p_actor,now()+make_interval(mins=>p_interval))
  RETURNING * INTO s;
 ELSE
  UPDATE public.ac_seo_power_r5_schedules SET name=trim(p_name),kind=p_kind,
    interval_minutes=p_interval,max_pages=p_limit,enabled=p_enabled,
    version=version+1,updated_at=now(),
    next_due_at=now()+make_interval(mins=>p_interval)
  WHERE id=p_id AND project_id=p_project AND version=p_version RETURNING * INTO s;
  IF NOT FOUND THEN RAISE EXCEPTION 'STALE_SCHEDULE_REVISION';END IF;
 END IF;
 PERFORM public.ac_seo_power_r5_log('schedule','saved',jsonb_build_object('name',s.name,'enabled',s.enabled,'version',s.version),NULL,NULL,NULL);
 RETURN to_jsonb(s);
END $$;

-- Called only on a verified R5-enabled worker tick. Each schedule uses a stable idempotency key for a due window.
CREATE OR REPLACE FUNCTION public.ac_seo_power_r5_schedule_tick() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s public.ac_seo_power_r5_schedules; c jsonb; n integer=0; stamp text;
BEGIN
 IF (SELECT enabled FROM public.ac_seo_power_r5_control WHERE singleton) IS DISTINCT FROM true THEN RETURN '{"enabled":false}'::jsonb;END IF;
 FOR s IN SELECT * FROM public.ac_seo_power_r5_schedules WHERE enabled AND next_due_at<=now()
 ORDER BY next_due_at FOR UPDATE SKIP LOCKED LIMIT 5
 LOOP
  stamp=to_char(s.next_due_at AT TIME ZONE 'UTC','YYYYMMDDHH24MI');
  c=public.ac_seo_power_r5_start(s.project_id,s.kind,s.max_pages,s.name,
    '00000000-0000-4000-8000-000000000001'::uuid,'schedule:'||s.id::text||':'||stamp,'scheduled');
  UPDATE public.ac_seo_power_r5_schedules SET last_started_at=now(),last_campaign_id=(c->>'id')::uuid,
   next_due_at=now()+make_interval(mins=>s.interval_minutes),version=version+1,updated_at=now() WHERE id=s.id;
  n=n+1;
 END LOOP;
 RETURN jsonb_build_object('scheduled',n,'observedAt',now());
END $$;

-- R5 respects paused campaign assignments during R4 claiming. Preexisting R4 claim semantics retained.
create or replace function public.ac_seo_power_r4_claim(p_project uuid default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $
declare c jsonb;pr public.ac_seo_power_projects;j public.ac_seo_power_jobs;
 token uuid; gc int;pc int;oc int;lb int;attempt_cap int;budget int; used_pages bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended('seo-power-r4-claim',0));
 select capacity into c from public.ac_seo_power_r4_control where singleton and enabled=true;
 if not found then return null;end if;
 gc=least(64,greatest(1,coalesce((c->>'globalConcurrency')::int,16)));
 pc=least(32,greatest(1,coalesce((c->>'perProjectConcurrency')::int,8)));
 oc=least(32,greatest(1,coalesce((c->>'perOriginConcurrency')::int,8)));
 lb=least(600,greatest(90,coalesce((c->>'leaseSeconds')::int,240)));
 attempt_cap=least(12,greatest(1,coalesce((c->>'maxAttempts')::int,6)));
 budget=least(100000,greatest(120,coalesce((c->>'dailyJobsPerProject')::int,20000)));

 update public.ac_seo_power_r4_attempts a set finished_at=now(),state='lease_expired',error='R4_LEASE_EXPIRED'
 from public.ac_seo_power_jobs old where old.id=a.job_id and old.state='running'
 and old.lease_until<now() and a.lease_token=old.lease_token and a.finished_at is null;
 update public.ac_seo_power_jobs j set
  state=case when attempts>=attempt_cap then 'failed' else 'queued' end,
  lease_token=null,lease_until=null,
  error='R4_LEASE_EXPIRED',
  result=jsonb_build_object('code','R4_LEASE_EXPIRED','recovery','retry'),
  due_at=now()+make_interval(secs=>least(3600,(2^least(attempts,10))::int*30)),
  finished_at=case when attempts>=attempt_cap then now() else null end
 where j.state='running' and j.lease_until<now();
 if (select count(*) from public.ac_seo_power_jobs where state='running' and lease_until>=now())>=gc then return null;end if;

 insert into public.ac_seo_power_r4_project_state(project_id)
 select id from public.ac_seo_power_projects on conflict(project_id) do nothing;
 for pr in select p.* from public.ac_seo_power_projects p
  join public.ac_seo_power_r4_project_state ps on ps.project_id=p.id
  where p.enabled and (p_project is null or p.id=p_project)
  order by ps.last_claim_at nulls first,p.id for update of p skip locked
 loop
  if (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state='running' and lease_until>=now())>=pc then continue;end if;
  if (select count(*) from public.ac_seo_power_jobs x join public.ac_seo_power_projects pp on pp.id=x.project_id
      where pp.origin=pr.origin and x.state='running' and x.lease_until>=now())>=oc then continue;end if;
  -- Budget counts unique crawl pages rather than every auxiliary task or repeated network attempt.
  select count(distinct page_id) into used_pages from public.ac_seo_power_jobs where
    project_id=pr.id and kind='crawl' and started_at>=date_trunc('day',now());
  select * into j from public.ac_seo_power_jobs where project_id=pr.id and state='queued' and due_at<=now()
    and (kind<>'crawl' or used_pages<budget)
    and not exists (
      select 1 from public.ac_seo_power_r5_campaign_jobs assigned
      join public.ac_seo_power_r5_campaigns campaign on campaign.id=assigned.campaign_id
      where assigned.job_id=ac_seo_power_jobs.id and campaign.state='paused'
    )
    order by case kind when 'verify' then 0 when 'crawl' then 1 when 'links' then 2 else 3 end,
    due_at,created_at for update skip locked limit 1;
  if not found then continue;end if;
  if j.kind='links' and not exists(select 1 from public.ac_seo_power_pages p where p.id=j.page_id and jsonb_typeof(p.facts->'links')='array') then
    update public.ac_seo_power_jobs set state='cancelled',error='R4_DEPENDENCY_CRAWL_REQUIRED',finished_at=now() where id=j.id;
    -- Do not acquire page locks while holding a claimed job lock; the next scheduler tick queues the prerequisite.
    continue;
  end if;
  if j.kind='indexnow' and not exists(select 1 from public.ac_seo_power_pages p
      where p.id=j.page_id and p.http_status=200 and p.indexable=true
      and coalesce((pr.policy->>'indexNowEnabled')::boolean,false)) then
    update public.ac_seo_power_jobs set state='cancelled',error='R4_INDEXNOW_INELIGIBLE',finished_at=now() where id=j.id;
    continue;
  end if;
  token=gen_random_uuid();
  update public.ac_seo_power_jobs set state='running',attempts=attempts+1,lease_token=token,
    lease_until=now()+make_interval(secs=>lb),started_at=now(),finished_at=null,error=null
   where id=j.id returning * into j;
  insert into public.ac_seo_power_r4_attempts(job_id,lease_token,attempt) values(j.id,token,j.attempts);
  update public.ac_seo_power_r4_project_state set last_claim_at=now() where project_id=pr.id;
  return to_jsonb(j)||jsonb_build_object('project',to_jsonb(pr),'page',(select to_jsonb(p) from public.ac_seo_power_pages p where p.id=j.page_id));
 end loop;
 return null;
end $;

-- Access restricted to service_role through the authenticated, permission-checked app API.
DO $$ DECLARE t text; f record;
BEGIN
 FOREACH t IN ARRAY ARRAY['control','campaigns','campaign_jobs','events','schedules','workers'] LOOP
  EXECUTE format('ALTER TABLE public.ac_seo_power_r5_%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE public.ac_seo_power_r5_%I FROM public,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON TABLE public.ac_seo_power_r5_%I TO service_role',t);
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'ac_seo_power_r5_%' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM public,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
COMMIT;
