-- OPTIONAL DEPLOYED DATABASE GATE. Review before running in SQL editor.
-- Uses one existing draft offer as a fixture. Does not publish or send anything.
-- Every test write is enclosed in BEGIN / ROLLBACK. No committed data change.
-- If a statement fails, execute ROLLBACK; before any other SQL.
begin;
set local lock_timeout='5s';
set local statement_timeout='45s';
do $$
declare item uuid;actor uuid=gen_random_uuid();job uuid=gen_random_uuid();line uuid;
 before_graph jsonb;run jsonb;lease jsonb;receipt jsonb;blocked boolean=false;
begin
 select id into item from public.angelcare_marketplace_catalog_items where status='draft'order by id limit 1 for update;
 if item is null then raise exception 'No draft fixture available; smoke gate not executed';end if;
 before_graph=public.angelcare_import_r2_snapshot(item);
 run=public.angelcare_import_r2_create(jsonb_build_object(
 'id',job,'created_by',actor,'territory_id',before_graph->'territory_id','tenant_id',before_graph->'tenant_id',
 'source_name','ROLLBACK-ONLY-SMOKE.csv','source_csv','fixture','source_hash',job::text,
 'profile_key','smoke-only','profile_fingerprint','smoke-only','profile_snapshot','{}'::jsonb,'target','{}'::jsonb),
 jsonb_build_array(jsonb_build_object('row_number',2,'identity_key',before_graph->>'item_key','item_id',item,
 'original','{}'::jsonb,'prepared','{}'::jsonb,'issues','[]'::jsonb,'status','ready')));
 select id into line from public.angelcare_marketplace_catalogue_import_lines where run_id=job;
 update public.angelcare_marketplace_catalogue_import_lines set plan=jsonb_build_object('before',before_graph,'after',before_graph)where id=line;
 update public.angelcare_marketplace_catalogue_import_runs set status='ready'where id=job;
 begin perform public.angelcare_import_r2_claim(job,actor,null,null,99,'smoke-only');exception when others then if sqlerrm not like '%IMPORT_REVISION_CONFLICT%'then raise;end if;blocked=true;end;
 if not blocked then raise exception 'Revision guard failed';end if;
 lease=public.angelcare_import_r2_claim(job,actor,null,null,1,'smoke-only');
 receipt=public.angelcare_import_r2_apply(job,line,(lease->>'lease_token')::uuid,actor,null,null);
 if receipt->>'status'<>'applied' or receipt->'after_snapshot'is null then raise exception 'Receipt missing';end if;
 if public.angelcare_import_r2_apply(job,line,(lease->>'lease_token')::uuid,actor,null,null)is distinct from receipt then raise exception 'Replay changed receipt';end if;
 perform public.angelcare_import_r2_release(job,(lease->>'lease_token')::uuid);
 update public.angelcare_marketplace_catalog_items set name_en=coalesce(name_en,'')||' [ROLLBACK-ONLY]'where id=item;
 blocked=false;
 begin perform public.angelcare_import_r2_rollback(job,line,actor,null,null);exception when others then if sqlerrm not like '%IMPORT_LATER_EDIT_CONFLICT%'then raise;end if;blocked=true;end;
 if not blocked then raise exception 'Later-edit rollback guard failed';end if;
 raise notice 'R2_SQL_SMOKE=PASS: claim, atomic receipt, replay and later-edit guard; transaction will be rolled back';
end $$;
rollback;
