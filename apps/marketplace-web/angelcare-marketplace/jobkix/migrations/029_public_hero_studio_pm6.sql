-- JOBKIX Hero Studio PM6. Additive migration. REVIEW ONLY; not executed by installer.
-- Requires Marketplace asset table and service-role server access.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.angelcare_marketplace_media_assets') IS NULL THEN RAISE EXCEPTION 'HERO_REQUIRES_MARKETPLACE_MEDIA_LIBRARY'; END IF;
 IF to_regclass('public.jobkix_hero_placements') IS NOT NULL THEN RAISE EXCEPTION 'HERO_MIGRATION_ALREADY_PRESENT'; END IF;
END $$;
CREATE TABLE public.jobkix_hero_placements (
 placement_key text PRIMARY KEY CHECK(length(placement_key) BETWEEN 3 AND 200),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 state text NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','reviewed','published','unpublished')),
 draft jsonb NOT NULL DEFAULT '{"slides":[],"intervalMs":3000,"transition":"fade","transitionMs":700,"autoplay":true}'::jsonb CHECK(jsonb_typeof(draft)='object'),
 published jsonb CHECK(published IS NULL OR jsonb_typeof(published)='object'),
 published_revision integer NOT NULL DEFAULT 0 CHECK(published_revision>=0),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text NOT NULL, published_at timestamptz
);
CREATE INDEX jobkix_hero_placements_published_gin ON public.jobkix_hero_placements USING GIN(published jsonb_path_ops);
CREATE INDEX jobkix_hero_placements_draft_gin ON public.jobkix_hero_placements USING GIN(draft jsonb_path_ops);
CREATE TABLE public.jobkix_hero_revisions (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 placement_key text NOT NULL REFERENCES public.jobkix_hero_placements(placement_key),
 revision integer NOT NULL,
 action text NOT NULL CHECK(action IN ('publish','unpublish','restore')),
 snapshot jsonb,
 actor text NOT NULL,
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(placement_key,revision)
);
CREATE INDEX jobkix_hero_revisions_placement_history ON public.jobkix_hero_revisions(placement_key,revision DESC);
ALTER TABLE public.jobkix_hero_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobkix_hero_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.jobkix_hero_placements,public.jobkix_hero_revisions FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.jobkix_hero_revisions_id_seq FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.jobkix_hero_placements TO service_role;
GRANT SELECT,INSERT ON public.jobkix_hero_revisions TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.jobkix_hero_revisions_id_seq TO service_role;

CREATE FUNCTION public.jobkix_hero_command(p_actor text,p_action text,p_placement text,p_expected_version integer,p_document jsonb DEFAULT NULL,p_reason text DEFAULT '',p_restore_revision integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_row public.jobkix_hero_placements%ROWTYPE;
  new_revision integer;
  old_snapshot jsonb;
  changed jsonb;
BEGIN
 IF current_user <> 'postgres' AND session_user <> 'postgres' AND NOT pg_has_role(current_user,'service_role','member') THEN
  RAISE EXCEPTION 'HERO_SERVICE_ROLE_ONLY';
 END IF;
 IF nullif(trim(p_actor),'') IS NULL OR length(p_actor)>160 OR p_placement !~ '^P(00|01|03|04|05|06|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25)(:[a-z0-9~-]{1,160})?$' THEN
  RAISE EXCEPTION 'HERO_INVALID_SCOPE';
 END IF;
 IF p_action NOT IN ('save','review','publish','unpublish','restore') THEN RAISE EXCEPTION 'HERO_INVALID_ACTION'; END IF;
 SELECT * INTO current_row FROM public.jobkix_hero_placements WHERE placement_key=p_placement FOR UPDATE;
 IF NOT FOUND THEN
  IF p_action <> 'save' OR p_expected_version<>0 THEN RAISE EXCEPTION 'HERO_NOT_FOUND'; END IF;
  IF p_document IS NULL OR jsonb_typeof(p_document)<>'object' THEN RAISE EXCEPTION 'HERO_INVALID_DOCUMENT'; END IF;
  INSERT INTO public.jobkix_hero_placements(placement_key,draft,updated_by) VALUES(p_placement,p_document,p_actor) RETURNING * INTO current_row;
  RETURN jsonb_build_object('placement',p_placement,'version',current_row.version,'state',current_row.state,'publishedRevision',0);
 END IF;
 IF p_expected_version<>current_row.version THEN RAISE EXCEPTION 'HERO_VERSION_CONFLICT'; END IF;
 IF p_action='save' THEN
  IF p_document IS NULL OR jsonb_typeof(p_document)<>'object' THEN RAISE EXCEPTION 'HERO_INVALID_DOCUMENT'; END IF;
  UPDATE public.jobkix_hero_placements SET draft=p_document,state='draft',version=version+1,updated_by=p_actor,updated_at=now() WHERE placement_key=p_placement;
 ELSIF p_action='review' THEN
  IF jsonb_array_length(coalesce(current_row.draft->'slides','[]'::jsonb))=0 THEN RAISE EXCEPTION 'HERO_EMPTY_GALLERY'; END IF;
  UPDATE public.jobkix_hero_placements SET state='reviewed',version=version+1,updated_by=p_actor,updated_at=now() WHERE placement_key=p_placement;
 ELSIF p_action='publish' THEN
  IF current_row.state<>'reviewed' OR jsonb_array_length(coalesce(current_row.draft->'slides','[]'::jsonb))=0 THEN RAISE EXCEPTION 'HERO_NOT_REVIEWED'; END IF;
  new_revision:=current_row.published_revision+1;
  UPDATE public.jobkix_hero_placements SET published=current_row.draft,published_revision=new_revision,state='published',version=version+1,updated_by=p_actor,updated_at=now(),published_at=now() WHERE placement_key=p_placement;
  INSERT INTO public.jobkix_hero_revisions(placement_key,revision,action,snapshot,actor,reason)VALUES(p_placement,new_revision,'publish',current_row.draft,p_actor,p_reason);
 ELSIF p_action='unpublish' THEN
  new_revision:=current_row.published_revision+1;
  UPDATE public.jobkix_hero_placements SET published=NULL,published_revision=new_revision,state='unpublished',version=version+1,updated_by=p_actor,updated_at=now(),published_at=NULL WHERE placement_key=p_placement;
  INSERT INTO public.jobkix_hero_revisions(placement_key,revision,action,snapshot,actor,reason)VALUES(p_placement,new_revision,'unpublish',NULL,p_actor,p_reason);
 ELSE
  SELECT snapshot INTO old_snapshot FROM public.jobkix_hero_revisions WHERE placement_key=p_placement AND revision=p_restore_revision AND snapshot IS NOT NULL;
  IF old_snapshot IS NULL THEN RAISE EXCEPTION 'HERO_RESTORE_NOT_FOUND'; END IF;
  new_revision:=current_row.published_revision+1;
  UPDATE public.jobkix_hero_placements SET published=old_snapshot,draft=old_snapshot,published_revision=new_revision,state='published',version=version+1,updated_by=p_actor,updated_at=now(),published_at=now() WHERE placement_key=p_placement;
  INSERT INTO public.jobkix_hero_revisions(placement_key,revision,action,snapshot,actor,reason)VALUES(p_placement,new_revision,'restore',old_snapshot,p_actor,p_reason);
 END IF;
 SELECT jsonb_build_object('placement',placement_key,'version',version,'state',state,'publishedRevision',published_revision) INTO changed FROM public.jobkix_hero_placements WHERE placement_key=p_placement;
 RETURN changed;
END $$;
REVOKE ALL ON FUNCTION public.jobkix_hero_command(text,text,text,integer,jsonb,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.jobkix_hero_command(text,text,text,integer,jsonb,text,integer) TO service_role;
COMMIT;
