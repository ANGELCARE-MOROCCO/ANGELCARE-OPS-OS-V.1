-- READ ONLY. Run after SQL23.
select public.ac_kidflix_fold('٠١٢٣٤٥٦٧٨٩')='0123456789' as arabic_digits, public.ac_kidflix_fold('Éléphant')='elephant' as french_fold,
public.ac_kidflix_fold('أَطْفَال')=public.ac_kidflix_fold('اطفال') as arabic_fold,
position('ac_kidflix_fold' in pg_get_functiondef('public.ac_kidflix_catalogue(text,text,jsonb,integer,boolean)'::regprocedure))>0 as catalogue_search,
position('ac_kidflix_fold' in pg_get_functiondef('public.ac_kidflix_storefront(text,text,text,jsonb,integer)'::regprocedure))>0 as storefront_search;

select to_regclass('public.ac_kidflix_recent_starts') is not null as starts_index, exists(select 1 from pg_constraint where conrelid='public.ac_dce_activity_v2'::regclass and conname='ac_dce_activity_v2_action_check' and position('output_ready' in pg_get_constraintdef(oid))>0 and position('completion_reported' in pg_get_constraintdef(oid))>0) as distinct_observed_events;
