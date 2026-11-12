-- ANGELCARE LXC360 R3: operator-owned custom themes / presets
-- Apply AFTER the R1 lifecycle SQL and R2 visual themes SQL.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('angelcare:lxc360:creative-editor'));
DO $block$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY[
 'angelcare_marketplace_live_experience_themes',
 'angelcare_marketplace_live_experience_presets'
 ] LOOP
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1',name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT true',name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at timestamptz',name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by uuid',name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deletion_reason text',name);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_by uuid',name);
 END LOOP;
END $block$;
CREATE OR REPLACE FUNCTION public.ac_live_creative_command_360(
 p_type text,p_action text,p_data jsonb,p_actor uuid,p_version integer DEFAULT NULL,p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $body$
DECLARE v_table text; v_id uuid; v_before jsonb; v_after jsonb;
 v_key text; v_kind text; v_name jsonb; v_tokens jsonb; v_configuration jsonb;
 v_purpose text; v_theme text; v_status text; v_version integer;
BEGIN
 IF p_type NOT IN ('theme','preset') OR p_action NOT IN
 ('create','update','duplicate','activate','pause','archive','trash','restore')
 OR p_actor IS NULL THEN
  RAISE EXCEPTION 'Invalid creative command or operator identity' USING ERRCODE='22023';
 END IF;
 v_table=CASE p_type WHEN 'theme' THEN 'angelcare_marketplace_live_experience_themes'
  ELSE 'angelcare_marketplace_live_experience_presets' END;
 v_name=coalesce(p_data->'name','{}'::jsonb);
 v_tokens=coalesce(p_data->'tokens','{}'::jsonb);
 v_configuration=coalesce(p_data->'configuration','{}'::jsonb);
 IF p_action='create' THEN
  v_key=btrim(coalesce(CASE WHEN p_type='theme' THEN p_data->>'theme_key' ELSE p_data->>'preset_key' END,''));
  v_kind=btrim(coalesce(p_data->>'kind',''));
  IF v_key !~ '^[a-z][a-z0-9_-]{3,79}$' OR v_kind NOT IN ('popup','broadcast','proof')
   OR length(coalesce(v_name->>'fr',''))<3
   OR length(coalesce(v_name->>'en',''))<3
   OR length(coalesce(v_name->>'ar',''))<2 THEN
   RAISE EXCEPTION 'Creative key, family, and FR/EN/AR names required' USING ERRCODE='22023';
  END IF;
  IF p_type='theme' THEN
   IF v_tokens->>'background' !~ '^#[0-9a-fA-F]{6}$'
    OR v_tokens->>'surface' !~ '^#[0-9a-fA-F]{6}$'
    OR v_tokens->>'text' !~ '^#[0-9a-fA-F]{6}$'
    OR v_tokens->>'accent' !~ '^#[0-9a-fA-F]{6}$'
    OR v_tokens->>'composition' NOT IN
      ('split','poster','gallery','editorial','orbit','atrium','terrace','botanical',
       'lilac','precision','bento','museum','glass','ledger','cinema') THEN
    RAISE EXCEPTION 'Theme requires approved colors and a supported layout' USING ERRCODE='22023';
   END IF;
   INSERT INTO public.angelcare_marketplace_live_experience_themes
   (theme_key,kind,name,tokens,composition,status,is_system,row_version,updated_by)
   VALUES (v_key,v_kind,v_name,v_tokens,jsonb_build_object('layout',v_tokens->>'composition'),
    'draft',false,1,p_actor)
   RETURNING to_jsonb(angelcare_marketplace_live_experience_themes) INTO v_after;
  ELSE
   v_purpose=btrim(coalesce(p_data->>'purpose_key',''));
   v_theme=btrim(coalesce(p_data->>'theme_key',''));
   IF NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_live_experience_purposes x
      WHERE x.purpose_key=v_purpose AND x.kind=v_kind AND x.status='active') OR
      NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_live_experience_themes x
      WHERE x.theme_key=v_theme AND x.kind=v_kind AND x.deleted_at IS NULL) THEN
     RAISE EXCEPTION 'Preset requires compatible active purpose and existing theme' USING ERRCODE='23503';
   END IF;
   INSERT INTO public.angelcare_marketplace_live_experience_presets
   (preset_key,kind,purpose_key,theme_key,name,configuration,status,is_system,row_version,updated_by)
   VALUES(v_key,v_kind,v_purpose,v_theme,v_name,v_configuration,'draft',false,1,p_actor)
   RETURNING to_jsonb(angelcare_marketplace_live_experience_presets) INTO v_after;
  END IF;
 ELSE
  IF p_data->>'id' IS NULL THEN RAISE EXCEPTION 'Record ID is required' USING ERRCODE='22023'; END IF;
  v_id=(p_data->>'id')::uuid;
  EXECUTE format('SELECT to_jsonb(c) FROM public.%I c WHERE c.id=$1 FOR UPDATE',v_table)
   INTO v_before USING v_id;
  IF v_before IS NULL THEN RAISE EXCEPTION 'Creative not found' USING ERRCODE='P0002'; END IF;
  IF coalesce((v_before->>'is_system')::boolean,true) THEN
   RAISE EXCEPTION 'Protected system definition; create a custom copy' USING ERRCODE='42501';
  END IF;
  v_version=(v_before->>'row_version')::integer;
  IF p_version IS NULL OR v_version<>p_version THEN
   RAISE EXCEPTION 'Stale creative version' USING ERRCODE='40001';
  END IF;
  v_key=CASE WHEN p_type='theme' THEN v_before->>'theme_key' ELSE v_before->>'preset_key' END;
  IF v_before->>'deleted_at' IS NOT NULL AND p_action<>'restore' THEN
   RAISE EXCEPTION 'Creative already in trash' USING ERRCODE='22023';
  END IF;
  IF p_action='restore' AND v_before->>'deleted_at' IS NULL THEN
   RAISE EXCEPTION 'Creative is not in trash' USING ERRCODE='22023';
  END IF;
  IF p_action IN ('trash','pause','archive') AND (
    (p_type='theme' AND EXISTS(SELECT 1 FROM public.angelcare_marketplace_live_experience_campaigns c
     WHERE c.deleted_at IS NULL AND c.status IN ('active','scheduled') AND c.theme_key=v_key))
    OR (p_type='preset' AND EXISTS(SELECT 1 FROM public.angelcare_marketplace_live_experience_campaigns c
     WHERE c.deleted_at IS NULL AND c.status IN ('active','scheduled')
       AND c.conversion->>'preset_key'=v_key))) THEN
    RAISE EXCEPTION 'Pause dependent campaigns before changing this creative' USING ERRCODE='23503';
  END IF;
  IF p_action IN ('trash','pause','archive','restore') AND length(btrim(coalesce(p_reason,'')))<4 THEN
   RAISE EXCEPTION 'Operator reason required' USING ERRCODE='22023';
  END IF;
  IF p_action='duplicate' THEN
   v_key=btrim(coalesce(p_data->>'new_key',''));
   IF v_key !~ '^[a-z][a-z0-9_-]{3,79}$' THEN
    RAISE EXCEPTION 'Unique new key required for duplication' USING ERRCODE='22023';
   END IF;
   IF p_type='theme' THEN
    INSERT INTO public.angelcare_marketplace_live_experience_themes
    (theme_key,kind,name,tokens,composition,status,is_system,row_version,updated_by)
    SELECT v_key,kind,name,tokens,composition,'draft',false,1,p_actor
      FROM public.angelcare_marketplace_live_experience_themes WHERE id=v_id
    RETURNING to_jsonb(angelcare_marketplace_live_experience_themes) INTO v_after;
   ELSE
    INSERT INTO public.angelcare_marketplace_live_experience_presets
    (preset_key,kind,purpose_key,theme_key,name,configuration,status,is_system,row_version,updated_by)
    SELECT v_key,kind,purpose_key,theme_key,name,configuration,'draft',false,1,p_actor
      FROM public.angelcare_marketplace_live_experience_presets WHERE id=v_id
    RETURNING to_jsonb(angelcare_marketplace_live_experience_presets) INTO v_after;
   END IF;
  ELSIF p_action='update' THEN
   IF p_type='theme' THEN
    v_tokens=coalesce(p_data->'tokens',v_before->'tokens');
    IF v_tokens->>'background' !~ '^#[0-9a-fA-F]{6}$'
      OR v_tokens->>'surface' !~ '^#[0-9a-fA-F]{6}$'
      OR v_tokens->>'text' !~ '^#[0-9a-fA-F]{6}$'
      OR v_tokens->>'accent' !~ '^#[0-9a-fA-F]{6}$' THEN
     RAISE EXCEPTION 'Invalid theme tokens' USING ERRCODE='22023';
    END IF;
    IF v_tokens->>'composition' NOT IN
      ('split','poster','gallery','editorial','orbit','atrium','terrace','botanical',
       'lilac','precision','bento','museum','glass','ledger','cinema') THEN
      RAISE EXCEPTION 'Unsupported theme layout' USING ERRCODE='22023';
    END IF;
    UPDATE public.angelcare_marketplace_live_experience_themes SET
      name=coalesce(p_data->'name',name),tokens=v_tokens,
      composition=jsonb_build_object('layout',v_tokens->>'composition'),
      row_version=row_version+1,updated_at=now(),updated_by=p_actor
      WHERE id=v_id
    RETURNING to_jsonb(angelcare_marketplace_live_experience_themes) INTO v_after;
   ELSE
    UPDATE public.angelcare_marketplace_live_experience_presets SET
      name=coalesce(p_data->'name',name),
      configuration=coalesce(p_data->'configuration',configuration),
      row_version=row_version+1,updated_at=now(),updated_by=p_actor
      WHERE id=v_id
    RETURNING to_jsonb(angelcare_marketplace_live_experience_presets) INTO v_after;
   END IF;
  ELSE
   v_status=CASE p_action WHEN 'activate' THEN 'active' WHEN 'pause' THEN 'inactive'
     WHEN 'archive' THEN 'archived' WHEN 'trash' THEN 'archived'
     WHEN 'restore' THEN 'draft' ELSE NULL END;
   EXECUTE format('UPDATE public.%I SET status=$1,row_version=row_version+1,updated_at=now(),updated_by=$2,
    deleted_at=CASE WHEN $3=''trash'' THEN now() WHEN $3=''restore'' THEN NULL ELSE deleted_at END,
    deleted_by=CASE WHEN $3=''trash'' THEN $2 WHEN $3=''restore'' THEN NULL ELSE deleted_by END,
    deletion_reason=CASE WHEN $3=''trash'' THEN $4 WHEN $3=''restore'' THEN NULL ELSE deletion_reason END
    WHERE id=$5 RETURNING to_jsonb(%I)',v_table,v_table)
   INTO v_after USING v_status,p_actor,p_action,p_reason,v_id;
  END IF;
 END IF;
 INSERT INTO public.angelcare_marketplace_live_experience_audit_events
 (actor_id,action,object_type,object_id,evidence)
 VALUES(p_actor,'creative.'||p_action,p_type,v_after->>'id',
 jsonb_build_object('key',v_key,'reason',p_reason,'version',v_after->>'row_version'));
 RETURN v_after;
END $body$;
REVOKE ALL ON FUNCTION public.ac_live_creative_command_360(text,text,jsonb,uuid,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ac_live_creative_command_360(text,text,jsonb,uuid,integer,text) TO service_role;
COMMIT;
