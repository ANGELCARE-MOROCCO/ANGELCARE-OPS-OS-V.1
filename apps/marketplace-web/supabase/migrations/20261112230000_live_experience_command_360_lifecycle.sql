-- ANGELCARE Live Experience Command 360 — R1 / guarded soft deletion and restoration
-- APPLY ONCE AFTER 20261010094500_live_experience_studio_2030.sql.
-- Preserves customer events, published evidence, original media, versions and audit rows.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('angelcare:live-experience:360:lifecycle'));
ALTER TABLE public.angelcare_marketplace_live_experience_campaigns
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz;
CREATE INDEX IF NOT EXISTS ac_live_360_campaign_live_idx
  ON public.angelcare_marketplace_live_experience_campaigns(status,priority DESC,starts_at)
  WHERE deleted_at IS NULL;
DO $plpgsql$
DECLARE table_name text;
BEGIN
 FOREACH table_name IN ARRAY ARRAY[
 'angelcare_marketplace_live_experience_audiences',
 'angelcare_marketplace_live_experience_placements',
 'angelcare_marketplace_live_experience_schedules',
 'angelcare_marketplace_live_experience_experiments',
 'angelcare_marketplace_live_experience_capabilities',
 'angelcare_marketplace_live_experience_source_snapshots'
 ] LOOP
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at timestamptz',table_name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by uuid',table_name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deletion_reason text',table_name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS restored_at timestamptz',table_name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1',table_name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()',table_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (deleted_at, status)', 'ac_live360_'+substring(md5(table_name),1,12),table_name);
 END LOOP;
END $plpgsql$;
ALTER TABLE public.angelcare_marketplace_live_experience_capabilities
 ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT true;
CREATE OR REPLACE FUNCTION public.ac_live_campaign_lifecycle_360(
 p_id uuid,p_action text,p_actor uuid,p_expected_version integer,p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $plpgsql$
DECLARE previous public.angelcare_marketplace_live_experience_campaigns;
        changed public.angelcare_marketplace_live_experience_campaigns;
        action_name text;
BEGIN
 IF p_action NOT IN ('trash','restore') OR p_expected_version IS NULL
    OR length(btrim(coalesce(p_reason,''))) < 4 THEN
   RAISE EXCEPTION 'Valid action, expected version and operator reason required' USING ERRCODE='22023';
 END IF;
 SELECT * INTO previous FROM public.angelcare_marketplace_live_experience_campaigns
 WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Campaign not found' USING ERRCODE='P0002'; END IF;
 IF previous.version <> p_expected_version THEN
  RAISE EXCEPTION 'Stale campaign revision; refresh before changing lifecycle' USING ERRCODE='40001';
 END IF;
 IF p_action='trash' AND previous.deleted_at IS NOT NULL THEN
  RAISE EXCEPTION 'Campaign already in trash' USING ERRCODE='22023';
 ELSIF p_action='restore' AND previous.deleted_at IS NULL THEN
  RAISE EXCEPTION 'Campaign is not in trash' USING ERRCODE='22023';
 END IF;
 UPDATE public.angelcare_marketplace_live_experience_campaigns SET
  deleted_at=CASE WHEN p_action='trash' THEN now() ELSE NULL END,
  deleted_by=CASE WHEN p_action='trash' THEN p_actor ELSE NULL END,
  deletion_reason=CASE WHEN p_action='trash' THEN p_reason ELSE NULL END,
  restored_at=CASE WHEN p_action='restore' THEN now() ELSE restored_at END,
  status=CASE WHEN p_action='trash' THEN 'archived' ELSE 'draft' END,
  published_snapshot=CASE WHEN p_action='restore' THEN NULL ELSE published_snapshot END,
  version=version+1,updated_at=now(),updated_by=p_actor
 WHERE id=p_id RETURNING * INTO changed;
 INSERT INTO public.angelcare_marketplace_live_experience_versions
  (campaign_id,version,snapshot,created_by)
 VALUES (changed.id,changed.version,to_jsonb(changed)-'published_snapshot',p_actor);
 action_name=CASE WHEN p_action='trash' THEN 'campaign.trashed' ELSE 'campaign.restored_to_draft' END;
 INSERT INTO public.angelcare_marketplace_live_experience_audit_events
 (actor_id,action,object_type,object_id,evidence)
 VALUES(p_actor,action_name,'campaign',p_id::text,
 jsonb_build_object('reason',p_reason,'from_status',previous.status,
 'from_version',previous.version,'to_version',changed.version,'immutable_history_preserved',true));
 RETURN to_jsonb(changed);
END $plpgsql$;
CREATE OR REPLACE FUNCTION public.ac_live_governance_lifecycle_360(
 p_mode text,p_id uuid,p_action text,p_actor uuid,p_expected_version integer,p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $plpgsql$
DECLARE target_table text; row_before jsonb; row_after jsonb; next_status text;
BEGIN
 IF p_action NOT IN ('trash','restore') OR p_expected_version IS NULL
   OR length(btrim(coalesce(p_reason,'')))<4 THEN
  RAISE EXCEPTION 'Action, expected version and reason required' USING ERRCODE='22023';
 END IF;
 target_table=CASE p_mode
  WHEN 'audiences' THEN 'angelcare_marketplace_live_experience_audiences'
  WHEN 'placements' THEN 'angelcare_marketplace_live_experience_placements'
  WHEN 'schedules' THEN 'angelcare_marketplace_live_experience_schedules'
  WHEN 'experiments' THEN 'angelcare_marketplace_live_experience_experiments'
  WHEN 'sources' THEN 'angelcare_marketplace_live_experience_source_snapshots'
  ELSE NULL END;
 IF target_table IS NULL THEN
  RAISE EXCEPTION 'Protected system authority cannot be deleted' USING ERRCODE='42501';
 END IF;
 EXECUTE format('SELECT to_jsonb(r) FROM public.%I r WHERE id=$1 FOR UPDATE',target_table)
 INTO row_before USING p_id;
 IF row_before IS NULL THEN RAISE EXCEPTION 'Governance object not found' USING ERRCODE='P0002'; END IF;
 IF (row_before->>'row_version')::integer<>p_expected_version THEN
  RAISE EXCEPTION 'Stale governance revision' USING ERRCODE='40001';
 END IF;
 IF p_action='trash' AND row_before->>'deleted_at' IS NOT NULL THEN
  RAISE EXCEPTION 'Already trashed' USING ERRCODE='22023';
 ELSIF p_action='restore' AND row_before->>'deleted_at' IS NULL THEN
  RAISE EXCEPTION 'Not in trash' USING ERRCODE='22023';
 END IF;
 IF p_action='trash' AND p_mode='audiences' AND EXISTS(
   SELECT 1 FROM public.angelcare_marketplace_live_experience_campaigns c
   WHERE c.deleted_at IS NULL AND c.status IN ('active','scheduled')
   AND c.targeting->'audience_keys' ? (row_before->>'audience_key')) THEN
   RAISE EXCEPTION 'Pause dependent live campaigns before deleting this audience' USING ERRCODE='23503';
 END IF;
 IF p_action='trash' AND p_mode='placements' AND EXISTS(
   SELECT 1 FROM public.angelcare_marketplace_live_experience_campaigns c
   WHERE c.deleted_at IS NULL AND c.status IN ('active','scheduled')
   AND c.placement->>'slot'=row_before->>'placement_key') THEN
   RAISE EXCEPTION 'Pause dependent campaigns before deleting this placement' USING ERRCODE='23503';
 END IF;
 IF p_action='trash' AND p_mode='schedules' AND EXISTS(
   SELECT 1 FROM public.angelcare_marketplace_live_experience_campaigns c
   WHERE c.id=(row_before->>'campaign_id')::uuid
     AND c.deleted_at IS NULL AND c.status IN ('active','scheduled')) THEN
   RAISE EXCEPTION 'Pause or unschedule the associated campaign first' USING ERRCODE='23503';
 END IF;
 IF p_action='trash' AND p_mode='experiments' AND EXISTS(
   SELECT 1 FROM public.angelcare_marketplace_live_experience_campaigns c
   WHERE c.experiment_id=p_id AND c.deleted_at IS NULL AND c.status IN ('active','scheduled')) THEN
   RAISE EXCEPTION 'Pause dependent campaigns before deleting this experiment' USING ERRCODE='23503';
 END IF;
 IF p_action='trash' AND p_mode='sources' AND EXISTS(
   SELECT 1 FROM public.angelcare_marketplace_live_experience_campaigns c
   WHERE c.deleted_at IS NULL AND c.status IN ('active','scheduled')
     AND c.truth_source->>'source_key'=row_before->>'source_key') THEN
   RAISE EXCEPTION 'Pause dependent proof campaigns before deleting this source' USING ERRCODE='23503';
 END IF;
 next_status=CASE WHEN p_action='trash' THEN
   CASE p_mode WHEN 'schedules' THEN 'cancelled' WHEN 'experiments' THEN 'closed'
    WHEN 'sources' THEN 'inactive' ELSE 'archived' END
  ELSE CASE p_mode WHEN 'schedules' THEN 'paused' WHEN 'sources' THEN 'inactive'
    ELSE 'draft' END END;
 EXECUTE format('UPDATE public.%I SET
 deleted_at=CASE WHEN $1=''trash'' THEN now() ELSE NULL END,
 deleted_by=CASE WHEN $1=''trash'' THEN $2 ELSE NULL END,
 deletion_reason=CASE WHEN $1=''trash'' THEN $3 ELSE NULL END,
 restored_at=CASE WHEN $1=''restore'' THEN now() ELSE restored_at END,
 status=$4,row_version=row_version+1,updated_at=now()
 WHERE id=$5 RETURNING to_jsonb(%I)',target_table,target_table)
 INTO row_after USING p_action,p_actor,p_reason,next_status,p_id;
 INSERT INTO public.angelcare_marketplace_live_experience_audit_events
 (actor_id,action,object_type,object_id,evidence)
 VALUES(p_actor,p_mode||'.'||CASE WHEN p_action='trash' THEN 'trashed' ELSE 'restored' END,
 p_mode,p_id::text,jsonb_build_object('reason',p_reason,
 'from_status',row_before->>'status','to_status',next_status,
 'from_version',row_before->>'row_version','to_version',row_after->>'row_version'));
 RETURN row_after;
END $plpgsql$;
REVOKE ALL ON FUNCTION public.ac_live_campaign_lifecycle_360(uuid,text,uuid,integer,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.ac_live_governance_lifecycle_360(text,uuid,text,uuid,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ac_live_campaign_lifecycle_360(uuid,text,uuid,integer,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ac_live_governance_lifecycle_360(text,uuid,text,uuid,integer,text) TO service_role;
COMMIT;
