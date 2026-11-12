-- LXC360 R4 — harden operator-created theme integrity without altering protected system presets.
-- Apply AFTER 20261112232000_live_experience_command_360_creative_crud.sql
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('angelcare:lxc360:creative-guards'));
ALTER TABLE public.angelcare_marketplace_live_experience_themes
 DROP CONSTRAINT IF EXISTS ac_live_custom_theme_colors_360;
ALTER TABLE public.angelcare_marketplace_live_experience_themes
 ADD CONSTRAINT ac_live_custom_theme_colors_360 CHECK (
   is_system OR (
     coalesce(tokens->>'background','') ~ '^#[0-9a-fA-F]{6}$'
     AND coalesce(tokens->>'surface','') ~ '^#[0-9a-fA-F]{6}$'
     AND coalesce(tokens->>'text','') ~ '^#[0-9a-fA-F]{6}$'
     AND coalesce(tokens->>'accent','') ~ '^#[0-9a-fA-F]{6}$'
     AND coalesce(tokens->>'composition','') IN
      ('split','poster','gallery','editorial','orbit','atrium','terrace',
       'botanical','lilac','precision','bento','museum','glass','ledger','cinema')
   )
 ) NOT VALID;
ALTER TABLE public.angelcare_marketplace_live_experience_themes
 VALIDATE CONSTRAINT ac_live_custom_theme_colors_360;
CREATE OR REPLACE FUNCTION public.ac_live_guard_custom_theme_change_360()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp
AS $guard$
BEGIN
 IF OLD.is_system IS DISTINCT FROM NEW.is_system THEN
   RAISE EXCEPTION 'System ownership cannot be reassigned' USING ERRCODE='42501';
 END IF;
 IF OLD.is_system AND (OLD.tokens IS DISTINCT FROM NEW.tokens
   OR OLD.name IS DISTINCT FROM NEW.name OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
   RAISE EXCEPTION 'System themes are immutable; duplicate to customize' USING ERRCODE='42501';
 END IF;
 IF NOT OLD.is_system AND (
     OLD.tokens IS DISTINCT FROM NEW.tokens OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
     OR (NEW.status IN ('archived','inactive') AND OLD.status IS DISTINCT FROM NEW.status))
    AND EXISTS(SELECT 1 FROM public.angelcare_marketplace_live_experience_campaigns c
      WHERE c.deleted_at IS NULL AND c.status IN ('active','scheduled')
        AND c.theme_key=OLD.theme_key) THEN
   RAISE EXCEPTION 'Pause dependent live campaigns before changing the creative theme'
      USING ERRCODE='23503';
 END IF;
 RETURN NEW;
END $guard$;
DROP TRIGGER IF EXISTS ac_live_guard_custom_theme_change_360
 ON public.angelcare_marketplace_live_experience_themes;
CREATE TRIGGER ac_live_guard_custom_theme_change_360
 BEFORE UPDATE ON public.angelcare_marketplace_live_experience_themes
 FOR EACH ROW EXECUTE FUNCTION public.ac_live_guard_custom_theme_change_360();
COMMIT;
