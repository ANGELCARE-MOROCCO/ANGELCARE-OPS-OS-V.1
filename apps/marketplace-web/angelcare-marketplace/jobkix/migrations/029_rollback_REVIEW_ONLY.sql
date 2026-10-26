-- REVIEW ONLY. Requires explicit DBA approval. NOT part of installer.
-- Backup jobkix_hero_placements and jobkix_hero_revisions first.
-- Deliberately refuses to destroy published galleries or saved editor work.
BEGIN;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.jobkix_hero_placements WHERE published IS NOT NULL OR jsonb_array_length(coalesce(draft->'slides','[]'::jsonb))>0) THEN
  RAISE EXCEPTION 'HERO_ROLLBACK_BLOCKED_DATA_PRESENT: export records and design recovery first';
 END IF;
END $$;
DROP FUNCTION IF EXISTS public.jobkix_hero_command(text,text,text,integer,jsonb,text,integer);
DROP TABLE IF EXISTS public.jobkix_hero_revisions;
DROP TABLE IF EXISTS public.jobkix_hero_placements;
COMMIT;
