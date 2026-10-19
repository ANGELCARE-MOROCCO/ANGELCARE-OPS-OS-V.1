-- PENDING: apply only in the Marketplace SQL editor after KidFlix SQL17,19,21.
begin;
create or replace function public.ac_kidflix_fold(p_value text)returns text language sql immutable parallel safe set search_path=pg_catalog as $$select lower(regexp_replace(translate(coalesce(p_value,''),'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñأإآٱى٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnااااي01234567890123456789'),'[̀-ًͯ-ٰٟـ]','','g'))$$;
revoke all on function public.ac_kidflix_fold(text)from public;
grant execute on function public.ac_kidflix_fold(text)to service_role;
-- Modify the two existing scoped discovery functions, preserving their hostname,
-- independent edition, visibility, pagination, facets and rights predicates.
do $body$declare signature text;f regprocedure;s text;old_clause text;new_clause text;begin
 old_clause:=$old$(coalesce(p_filters->>'q','')=''or l.title ilike '%'||replace(replace(left(p_filters->>'q',100),'%','\%'),'_','\_')||'%'or l.d->'locales'->p_locale->>'summary'ilike '%'||replace(replace(left(p_filters->>'q',100),'%','\%'),'_','\_')||'%')$old$;
 new_clause:=$new$(coalesce(p_filters->>'q','')=''or position(public.ac_kidflix_fold(left(p_filters->>'q',100)) in public.ac_kidflix_fold(coalesce(l.title,'')||' '||coalesce(l.d->'locales'->p_locale->>'summary','')||' '||coalesce(l.d->'locales'->p_locale->>'kidflixAliases',l.d->>'kidflixAliases','')))>0)$new$;
 foreach signature in array array['public.ac_kidflix_catalogue(text,text,jsonb,integer,boolean)','public.ac_kidflix_storefront(text,text,text,jsonb,integer)']loop
  f:=to_regprocedure(signature);if f is null then raise exception 'KIDFLIX_SQL17_19_REQUIRED: %',signature;end if;s:=pg_get_functiondef(f);
  if position(new_clause in s)>0 then continue;end if;
  if position(old_clause in s)=0 then raise exception 'UNRECOGNIZED_DISCOVERY_SOURCE: %; no source overwritten',signature;end if;
  s:=replace(s,old_clause,new_clause);
  s:=replace(s,$old$(coalesce(p_filters->>'family','')=''or l.family=p_filters->>'family')and$old$,$new$(coalesce(p_filters->>'family','')=''or l.family=p_filters->>'family')and(coalesce(p_filters->>'notFamily','')=''or l.family<>p_filters->>'notFamily')and$new$);

  s:=replace(s,$old$(coalesce(p_filters->>'subject','')=''or$old$,$new$(coalesce(p_filters->>'intent','')not in('read','listen')or l.family<>'stories'or (p_filters->>'intent'='listen')=(l.d->>'mode'in('Read-aloud story mode','Slideshow story mode','read_aloud','slideshow')and(coalesce(l.bindings->'media'->(l.d->>'narrationAssetId')->>'mime','')like'audio/%'or exists(select 1 from jsonb_array_elements(coalesce(l.d->'units','[]'))u where coalesce(l.bindings->'media'->(u->>'narrationAssetId')->>'mime','')like'audio/%'))))and(coalesce(p_filters->>'subject','')=''or$new$);

  if position('ranked as(select *,row_number()' in s)>0 then
   if to_regclass('public.ac_kidflix_love_totals')is null or to_regclass('public.ac_dce_activity_v2')is null then raise exception 'SQL21_AND_DCE_ACTIVITY_REQUIRED';end if;
   s:=replace(s,'ranked as(select *,row_number()', $rank$ranked as(select *,coalesce((select total from public.ac_kidflix_love_totals where record_id=filtered.id),0)love_total,(select case when count(distinct subject_key)>=5 then count(distinct subject_key)else 0 end from public.ac_dce_activity_v2 where record_id=filtered.id and action='start'and environment='production'and occurred_at>=now()-interval '7 days')recent_starts,row_number()$rank$);
   s:=replace(s,'cards as(select id,key,family,audience,release_id,published_at,title,','cards as(select id,key,family,audience,release_id,published_at,title,love_total,recent_starts,');
   s:=replace(s,'order by case when p_filters->>''sort''=''title''then title end,','order by case when p_filters->>''sort''=''loved''then love_total end desc nulls last,case when p_filters->>''sort''=''popular''then recent_starts end desc nulls last,case when p_filters->>''sort''=''title''then title end,');
   s:=replace(s,')from ranked where(not p_home',')from ranked where(not p_home');
   s:=replace(s,$old$(select count(*)from filtered)$old$,$new$(select count(*)from ranked where(coalesce(p_filters->>'sort','')<>'popular'or recent_starts>=5)and(coalesce(p_filters->>'sort','')<>'loved'or love_total>0))$new$);
   -- No zero-sample rows are presented as popular or loved.
   s:=replace(s,$old$where(not p_home or family_rank<=6)order by$old$,$new$where(not p_home or family_rank<=6)and(coalesce(p_filters->>'sort','')<>'popular'or recent_starts>=5)and(coalesce(p_filters->>'sort','')<>'loved'or love_total>0)order by$new$);
  end if;
  execute s;
 end loop;
end $body$;
comment on function public.ac_kidflix_fold(text)is 'ANGELCARE_KIDFLIX_JOURNEY_R3';
alter table public.ac_dce_activity_v2 drop constraint if exists ac_dce_activity_v2_action_check;
alter table public.ac_dce_activity_v2 add constraint ac_dce_activity_v2_action_check check(action in('discover','start','checkpoint','complete','bookmark','share','download','print','submission','return','native_conversion','result_view','download_pdf','download_png','certificate_request','action_failed','completion_reported','output_prepare','output_ready','download_intent','recommendation_open','love','unlove','ad_request','ad_filled','ad_no_fill','ad_failed'));
create index if not exists ac_kidflix_recent_starts on public.ac_dce_activity_v2(record_id,occurred_at,subject_key) where action='start' and environment='production';
notify pgrst,'reload schema';commit;
