-- Read only. No email, session, pickup or audio connection.
select
 to_regprocedure('public.ac_hotline_pickup_r5(uuid,uuid)') is not null as pickup_function,
 to_regprocedure('public.ac_hotline_presence_r5(uuid,text)') is not null as presence_function,
 position('worker_heartbeat' in pg_get_functiondef('public.ac_hotline_receive(text,uuid,uuid,jsonb)'::regprocedure))=0 as admission_has_no_worker_gate,
 position('''assigned'',0' in pg_get_functiondef('public.ac_hotline_dispatch()'::regprocedure))>0 as dispatch_is_maintenance_only,
 not has_function_privilege('anon','public.ac_hotline_pickup_r5(uuid,uuid)','EXECUTE') as anonymous_pickup_denied,
 not has_function_privilege('authenticated','public.ac_hotline_pickup_r5(uuid,uuid)','EXECUTE') as direct_customer_pickup_denied,
 has_function_privilege('service_role','public.ac_hotline_pickup_r5(uuid,uuid)','EXECUTE') as server_pickup_authorized;
