-- KIDFLIX_PUBLIC_ENGAGEMENT_BADGES_R1
-- Prerequisites: existing DCE R4 activity table, KidFlix journey R3 tracking.
-- Server-only aggregate function. No table, event or publication data is changed.
-- Existing 'discover' = consented detail view, 'start' = consented learner start.
-- Unique pseudonymous subjects across this experience's releases and languages.
-- Fewer than five unique subjects => NULL (small-sample privacy suppression).
-- Required: run in Supabase SQL Editor before deploying the application code.

begin;
create or replace function public.ac_kidflix_public_engagement_v1(p_release_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $kidflix$
declare
  v_record_id uuid;
  v_views bigint;
  v_clicks bigint;
begin
  select z.record_id into v_record_id
  from public.ac_dce_releases z
  join public.ac_dce_editions e on e.record_id = z.record_id
    and e.active_release_id = z.id
  join public.ac_dce_records r on r.id = z.record_id
  where z.id = p_release_id
    and z.state = 'published'
    and r.kind in ('experience', 'bundle')
    and r.lifecycle <> 'archived'
  limit 1;

  if v_record_id is null then return null; end if;

  select
    count(distinct subject_key) filter (where action = 'discover'),
    count(distinct subject_key) filter (where action = 'start')
  into v_views, v_clicks
  from public.ac_dce_activity_v2
  where record_id = v_record_id
    and environment = 'production'
    and action in ('discover', 'start');

  return jsonb_build_object(
    'views', case when v_views >= 5 then v_views else null end,
    'clicks', case when v_clicks >= 5 then v_clicks else null end,
    'threshold', 5,
    'basis', 'consented_unique_visitors',
    'viewAction', 'discover',
    'clickAction', 'start',
    'scope', 'experience_lifetime'
  );
end
$kidflix$;

comment on function public.ac_kidflix_public_engagement_v1(uuid) is
  'KIDFLIX_PUBLIC_ENGAGEMENT_BADGES_R1: service-only, privacy-suppressed distinct consented visitors; no event identities returned';
revoke all on function public.ac_kidflix_public_engagement_v1(uuid) from public, anon, authenticated;
grant execute on function public.ac_kidflix_public_engagement_v1(uuid) to service_role;
commit;
notify pgrst, 'reload schema';
