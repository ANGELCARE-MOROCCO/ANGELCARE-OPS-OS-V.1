-- ANGELCARE Flashcards OS — Ultra Mega ZIP 6
-- Fulfilment, Customer Experience, Executive Intelligence and Production Hardening.
-- One additive, manual-safe consolidated migration. Requires UMZ1–UMZ5.
-- R1: aligns product_quality_signals.collection_id with flashcards_os.collections.id (text).
begin;
select pg_advisory_xact_lock(84745006);
set local lock_timeout='5min';
set local statement_timeout='0';
create extension if not exists pgcrypto;
create schema if not exists flashcards_os;
do $$ begin
 if to_regclass('flashcards_os.sales_orders') is null or to_regclass('flashcards_os.invoices') is null then raise exception 'UMZ5 baseline missing: sales orders and invoices are required.'; end if;
 if to_regclass('flashcards_os.product_releases') is null or to_regclass('flashcards_os.deliverables') is null then raise exception 'UMZ3 baseline missing: product releases and deliverables are required.'; end if;
 if to_regclass('flashcards_os.audit_events') is null or to_regclass('flashcards_os.outbox_events') is null then raise exception 'Flashcards OS audit/outbox baseline missing.'; end if;
end $$;
create or replace function flashcards_os.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

create table if not exists flashcards_os.fulfilment_plans(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,universe text not null check(universe in('b2c','b2b')),customer_id uuid not null,customer_name text not null,order_id uuid not null references flashcards_os.sales_orders(id) on delete restrict,order_number text not null,delivery_note_ids uuid[] not null default '{}',mode text not null check(mode in('physical','digital','hybrid')),status text not null default 'draft' check(status in('draft','ready','picking','packing','dispatch_ready','dispatched','partially_delivered','delivered','exception','cancelled','closed')),priority text not null default 'standard' check(priority in('standard','priority','urgent')),site_id uuid null,delivery_address jsonb not null default '{}'::jsonb,promised_at timestamptz null,owner text not null default '',shipment_ids uuid[] not null default '{}',entitlement_ids uuid[] not null default '{}',open_exceptions integer not null default 0 check(open_exceptions>=0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.fulfilment_plan_items(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',fulfilment_plan_id uuid not null references flashcards_os.fulfilment_plans(id) on delete restrict,order_item_id uuid not null references flashcards_os.sales_order_items(id) on delete restrict,description text not null,release_ids uuid[] not null default '{}',quantity numeric(14,3) not null check(quantity>0),physical_quantity numeric(14,3) not null default 0 check(physical_quantity>=0),digital_quantity numeric(14,3) not null default 0 check(digital_quantity>=0),allocated_quantity numeric(14,3) not null default 0 check(allocated_quantity>=0),picked_quantity numeric(14,3) not null default 0 check(picked_quantity>=0),packed_quantity numeric(14,3) not null default 0 check(packed_quantity>=0),dispatched_quantity numeric(14,3) not null default 0 check(dispatched_quantity>=0),delivered_quantity numeric(14,3) not null default 0 check(delivered_quantity>=0),status text not null default 'pending' check(status in('pending','allocated','picked','packed','dispatched','delivered','exception','cancelled')),exception_reason text null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(allocated_quantity<=quantity and picked_quantity<=quantity and packed_quantity<=quantity and dispatched_quantity<=quantity and delivered_quantity<=quantity)
);
create table if not exists flashcards_os.fulfilment_events(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',fulfilment_plan_id uuid not null references flashcards_os.fulfilment_plans(id) on delete restrict,event_type text not null,from_status text null,to_status text null,detail text not null default '',actor_id text not null default '',actor_name text not null default '',created_at timestamptz not null default now()
);
create table if not exists flashcards_os.physical_work_orders(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,fulfilment_plan_id uuid not null references flashcards_os.fulfilment_plans(id) on delete restrict,status text not null default 'ready' check(status in('ready','picking','packing','qa_hold','dispatch_ready','completed','cancelled')),zone text not null default 'Main',assigned_to text null,pick_progress numeric(6,2) not null default 0 check(pick_progress between 0 and 100),pack_progress numeric(6,2) not null default 0 check(pack_progress between 0 and 100),quality_status text not null default 'pending' check(quality_status in('pending','passed','failed')),due_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.pick_tasks(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',work_order_id uuid not null references flashcards_os.physical_work_orders(id) on delete restrict,plan_item_id uuid not null references flashcards_os.fulfilment_plan_items(id) on delete restrict,quantity numeric(14,3) not null check(quantity>0),picked_quantity numeric(14,3) not null default 0,status text not null default 'open',location text not null default '',assigned_to text null,completed_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(picked_quantity between 0 and quantity)
);
create table if not exists flashcards_os.pack_units(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',work_order_id uuid not null references flashcards_os.physical_work_orders(id) on delete restrict,code text not null,package_index integer not null default 1,content_manifest jsonb not null default '[]'::jsonb,weight_kg numeric(12,3) not null default 0,quality_status text not null default 'pending',sealed_at timestamptz null,sealed_by text null,created_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.shipment_records(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,fulfilment_plan_id uuid not null references flashcards_os.fulfilment_plans(id) on delete restrict,delivery_note_id uuid null references flashcards_os.delivery_notes(id) on delete restrict,carrier text not null,tracking_number text null,status text not null default 'draft' check(status in('draft','booked','labelled','handed_over','in_transit','out_for_delivery','delivered','failed','returned')),recipient_name text not null,recipient_phone text not null default '',address jsonb not null default '{}'::jsonb,package_count integer not null default 1 check(package_count>0),weight_kg numeric(12,3) not null default 0,dispatched_at timestamptz null,delivered_at timestamptz null,proof_storage_object_id uuid null,exception_reason text null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.shipment_events(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',shipment_id uuid not null references flashcards_os.shipment_records(id) on delete restrict,status text not null,detail text not null default '',occurred_at timestamptz not null default now(),actor_name text not null default '',payload jsonb not null default '{}'::jsonb
);
create table if not exists flashcards_os.delivery_confirmations(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',fulfilment_plan_id uuid not null references flashcards_os.fulfilment_plans(id) on delete restrict,shipment_id uuid null references flashcards_os.shipment_records(id) on delete restrict,delivery_note_id uuid null references flashcards_os.delivery_notes(id) on delete restrict,confirmation_type text not null,confirmed_by text not null,confirmed_at timestamptz not null default now(),proof_storage_object_id uuid null,notes text not null default ''
);
create table if not exists flashcards_os.fulfilment_exceptions(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',fulfilment_plan_id uuid not null references flashcards_os.fulfilment_plans(id) on delete restrict,exception_type text not null check(exception_type in('stock','release','address','carrier','damage','missing','entitlement','customer_unavailable','other')),severity text not null default 'medium' check(severity in('low','medium','high','critical')),status text not null default 'open' check(status in('open','assigned','resolved','waived')),detail text not null,owner text null,due_at timestamptz null,resolution text null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists flashcards_os.customer_delivery_preferences(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',universe text not null check(universe in('b2c','b2b')),customer_id uuid not null,preferred_days text[] not null default '{}',preferred_window text not null default '',delivery_instructions text not null default '',digital_access_contact text not null default '',updated_at timestamptz not null default now(),unique(tenant_key,universe,customer_id)
);

create table if not exists flashcards_os.digital_entitlements(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,fulfilment_plan_id uuid not null references flashcards_os.fulfilment_plans(id) on delete restrict,customer_id uuid not null,learner_id uuid null,release_id uuid not null references flashcards_os.product_releases(id) on delete restrict,deliverable_id uuid not null references flashcards_os.deliverables(id) on delete restrict,status text not null default 'draft' check(status in('draft','active','suspended','expired','revoked','replaced')),access_token_hint text not null,starts_at timestamptz null,expires_at timestamptz null,download_limit integer null check(download_limit is null or download_limit>=0),download_count integer not null default 0 check(download_count>=0),last_access_at timestamptz null,replaced_by_id uuid null references flashcards_os.digital_entitlements(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.digital_entitlement_events(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',entitlement_id uuid not null references flashcards_os.digital_entitlements(id) on delete restrict,event_type text not null,detail text not null default '',actor_name text not null default '',occurred_at timestamptz not null default now(),payload jsonb not null default '{}'::jsonb
);
create table if not exists flashcards_os.entitlement_download_events(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',entitlement_id uuid not null references flashcards_os.digital_entitlements(id) on delete restrict,storage_object_id uuid null,ip_hash text not null default '',device_hash text not null default '',result text not null check(result in('allowed','denied','failed')),reason text not null default '',occurred_at timestamptz not null default now()
);

create table if not exists flashcards_os.cx_sla_policies(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',case_type text not null,severity text not null,first_response_hours integer not null,resolve_hours integer not null,escalation_role text not null,status text not null default 'active',unique(tenant_key,case_type,severity)
);
create table if not exists flashcards_os.cx_cases(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,universe text not null check(universe in('b2c','b2b')),customer_id uuid not null,customer_name text not null,case_type text not null,severity text not null check(severity in('low','medium','high','critical')),status text not null default 'opened' check(status in('opened','eligibility_review','evidence_required','investigating','resolution_proposed','approval_required','action_in_progress','customer_confirmation','closed','rejected')),subject text not null,description text not null,order_id uuid null references flashcards_os.sales_orders(id) on delete restrict,delivery_note_id uuid null references flashcards_os.delivery_notes(id) on delete restrict,invoice_id uuid null references flashcards_os.invoices(id) on delete restrict,fulfilment_plan_id uuid null references flashcards_os.fulfilment_plans(id) on delete restrict,evidence_count integer not null default 0 check(evidence_count>=0),owner text null,sla_due_at timestamptz null,eligibility_decision text null,resolution text null,customer_confirmed_at timestamptz null,quality_signal_ids uuid[] not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.cx_case_items(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',case_id uuid not null references flashcards_os.cx_cases(id) on delete restrict,source_type text not null check(source_type in('order','delivery_note','invoice','entitlement','release')),source_id uuid not null,line_id uuid null,description text not null,quantity numeric(14,3) not null default 0 check(quantity>=0),eligible_quantity numeric(14,3) not null default 0 check(eligible_quantity>=0),requested_resolution text not null default '',approved_resolution text null,created_at timestamptz not null default now(),check(eligible_quantity<=quantity or quantity=0)
);
create table if not exists flashcards_os.cx_case_events(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',case_id uuid not null references flashcards_os.cx_cases(id) on delete restrict,event_type text not null,from_status text null,to_status text null,detail text not null default '',actor_name text not null default '',created_at timestamptz not null default now()
);
create table if not exists flashcards_os.cx_evidence(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',case_id uuid not null references flashcards_os.cx_cases(id) on delete restrict,evidence_type text not null,label text not null,reference text not null default '',storage_object_id uuid null,recorded_by text not null,created_at timestamptz not null default now()
);
create table if not exists flashcards_os.service_recovery_actions(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',case_id uuid not null references flashcards_os.cx_cases(id) on delete restrict,action_type text not null,status text not null default 'planned',owner text not null,amount_dh numeric(14,2) not null default 0,description text not null,approved_by text null,executed_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists flashcards_os.return_authorizations(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,case_id uuid not null references flashcards_os.cx_cases(id) on delete restrict,customer_id uuid not null,status text not null default 'requested' check(status in('requested','approved','pickup_planned','in_transit','received','inspected','accepted','rejected','closed')),pickup_method text not null check(pickup_method in('customer_dropoff','agent_pickup','carrier_pickup','digital_only')),pickup_address jsonb not null default '{}'::jsonb,items_snapshot jsonb not null default '[]'::jsonb,approved_by text null,approved_at timestamptz null,received_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.return_items(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',return_authorization_id uuid not null references flashcards_os.return_authorizations(id) on delete restrict,case_item_id uuid null references flashcards_os.cx_case_items(id) on delete restrict,description text not null,quantity numeric(14,3) not null check(quantity>0),received_quantity numeric(14,3) not null default 0,condition text null,inspection_result text null,status text not null default 'expected',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(received_quantity between 0 and quantity)
);
create table if not exists flashcards_os.return_receipts(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',return_authorization_id uuid not null references flashcards_os.return_authorizations(id) on delete restrict,received_by text not null,received_at timestamptz not null default now(),inspection_summary text not null default '',storage_object_ids uuid[] not null default '{}'
);
create table if not exists flashcards_os.exchange_orders(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,case_id uuid not null references flashcards_os.cx_cases(id) on delete restrict,status text not null default 'draft' check(status in('draft','approved','preparing','dispatched','delivered','cancelled')),replacement_release_ids uuid[] not null default '{}',replacement_quantities numeric[] not null default '{}',linked_fulfilment_plan_id uuid null references flashcards_os.fulfilment_plans(id) on delete restrict,approved_by text null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.exchange_order_items(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',exchange_order_id uuid not null references flashcards_os.exchange_orders(id) on delete restrict,release_id uuid not null references flashcards_os.product_releases(id) on delete restrict,quantity numeric(14,3) not null check(quantity>0),status text not null default 'approved',created_at timestamptz not null default now()
);
create table if not exists flashcards_os.refund_requests(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,case_id uuid not null references flashcards_os.cx_cases(id) on delete restrict,invoice_id uuid not null references flashcards_os.invoices(id) on delete restrict,customer_id uuid not null,customer_name text not null,reason text not null,requested_amount_dh numeric(14,2) not null check(requested_amount_dh>0),eligible_amount_dh numeric(14,2) not null check(eligible_amount_dh>=0),approved_amount_dh numeric(14,2) not null default 0 check(approved_amount_dh>=0),status text not null default 'draft' check(status in('draft','approval_required','approved','rejected','processing','completed','cancelled')),payment_method text not null default 'original_method',approval_note text null,approved_by text null,approved_at timestamptz null,completed_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code),check(requested_amount_dh<=eligible_amount_dh and approved_amount_dh<=eligible_amount_dh)
);
create table if not exists flashcards_os.refund_approvals(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',refund_request_id uuid not null references flashcards_os.refund_requests(id) on delete restrict,status text not null default 'pending' check(status in('pending','approved','rejected','cancelled')),assigned_role text not null,requested_by text not null,requested_at timestamptz not null default now(),decided_by text null,decided_at timestamptz null,decision_note text not null default ''
);
create table if not exists flashcards_os.refund_transactions(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',refund_request_id uuid not null references flashcards_os.refund_requests(id) on delete restrict,credit_note_id uuid null references flashcards_os.credit_notes(id) on delete restrict,amount_dh numeric(14,2) not null check(amount_dh>0),payment_reference text not null,evidence_storage_object_id uuid null,completed_by text not null,completed_at timestamptz not null default now()
);
create table if not exists flashcards_os.feedback_entries(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',customer_id uuid not null,case_id uuid null references flashcards_os.cx_cases(id) on delete restrict,source text not null check(source in('post_delivery','post_case','programme','product','manual')),rating integer null check(rating between 1 and 5),csat integer null check(csat between 1 and 5),nps integer null check(nps between 0 and 10),comment text not null default '',consent_to_contact boolean not null default false,created_at timestamptz not null default now()
);
create table if not exists flashcards_os.satisfaction_surveys(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',customer_id uuid not null,trigger_type text not null,trigger_id uuid null,status text not null default 'planned',sent_at timestamptz null,responded_at timestamptz null,feedback_entry_id uuid null references flashcards_os.feedback_entries(id) on delete restrict,created_at timestamptz not null default now()
);

create table if not exists flashcards_os.product_quality_signals(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,collection_id text null references flashcards_os.collections(id) on update cascade on delete restrict,release_id uuid null references flashcards_os.product_releases(id) on delete restrict,deliverable_id uuid null references flashcards_os.deliverables(id) on delete restrict,case_id uuid null references flashcards_os.cx_cases(id) on delete restrict,signal_type text not null,severity text not null check(severity in('low','medium','high','critical')),status text not null default 'new' check(status in('new','triaged','investigating','product_action_required','linked_to_design','resolved','dismissed')),title text not null,detail text not null,occurrence_count integer not null default 1 check(occurrence_count>0),customer_impact integer not null default 0 check(customer_impact>=0),revenue_impact_dh numeric(14,2) not null default 0,recommended_action text not null default '',linked_opportunity_id uuid null,linked_design_id uuid null,linked_review_id uuid null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.product_quality_signal_links(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',signal_id uuid not null references flashcards_os.product_quality_signals(id) on delete restrict,link_type text not null,link_id uuid not null,linked_by text not null,created_at timestamptz not null default now(),unique(tenant_key,signal_id,link_type,link_id)
);
create table if not exists flashcards_os.corrective_actions(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',signal_id uuid not null references flashcards_os.product_quality_signals(id) on delete restrict,action_type text not null,title text not null,owner text not null,status text not null default 'planned',due_at timestamptz null,evidence text not null default '',completed_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.executive_metric_snapshots(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',snapshot_at timestamptz not null default now(),metric_key text not null,label text not null,value numeric(18,4) not null default 0,unit text not null check(unit in('count','dh','percent','hours','days')),trend numeric(12,4) not null default 0,status text not null check(status in('healthy','degraded','critical','unknown')),detail text not null default ''
);
create table if not exists flashcards_os.executive_decisions(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,domain text not null check(domain in('product','intelligence','solutions','revenue','fulfilment','cx','infrastructure')),severity text not null check(severity in('low','medium','high','critical')),title text not null,detail text not null,owner text not null,due_at timestamptz null,status text not null default 'open' check(status in('open','accepted','rejected','completed')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.executive_interventions(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',decision_id uuid null references flashcards_os.executive_decisions(id) on delete restrict,domain text not null,entity_type text not null,entity_id uuid not null,instruction text not null,owner text not null,status text not null default 'open',due_at timestamptz null,completed_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.operational_health_checks(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',check_key text not null,label text not null,domain text not null check(domain in('application','database','storage','provider','security','financial','operations')),status text not null check(status in('healthy','degraded','critical','unknown')),latency_ms integer null,detail text not null default '',checked_at timestamptz null,created_at timestamptz not null default now(),unique(tenant_key,check_key)
);
create table if not exists flashcards_os.alert_rules(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',rule_key text not null,domain text not null,condition jsonb not null default '{}'::jsonb,severity text not null,assigned_role text not null,status text not null default 'active',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,rule_key)
);
create table if not exists flashcards_os.alert_events(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',rule_id uuid null references flashcards_os.alert_rules(id) on delete restrict,domain text not null,entity_type text not null,entity_id uuid null,severity text not null,title text not null,detail text not null,status text not null default 'open',acknowledged_by text null,acknowledged_at timestamptz null,created_at timestamptz not null default now()
);
create table if not exists flashcards_os.reconciliation_runs(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,scope text[] not null default '{}',status text not null check(status in('queued','running','passed','warning','failed')),started_at timestamptz null,completed_at timestamptz null,checked_records integer not null default 0,finding_count integer not null default 0,blocking_count integer not null default 0,created_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.reconciliation_findings(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',run_id uuid not null references flashcards_os.reconciliation_runs(id) on delete restrict,domain text not null check(domain in('orders','deliveries','invoices','payments','balances','vault','entitlements','audit')),severity text not null check(severity in('low','medium','high','critical')),record_type text not null,record_id text not null,expected_value text not null,actual_value text not null,status text not null default 'open' check(status in('open','resolved','waived')),resolution text null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists flashcards_os.backup_registry(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',backup_type text not null,scope text not null,location_alias text not null,started_at timestamptz not null,completed_at timestamptz null,status text not null,checksum text null,size_bytes bigint not null default 0,retention_until date null,evidence text not null default '',created_at timestamptz not null default now()
);
create table if not exists flashcards_os.restore_tests(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',backup_id uuid not null references flashcards_os.backup_registry(id) on delete restrict,test_environment text not null,started_at timestamptz not null,completed_at timestamptz null,status text not null,records_verified integer not null default 0,files_verified integer not null default 0,evidence text not null default '',performed_by text not null,created_at timestamptz not null default now()
);
create table if not exists flashcards_os.incident_records(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,severity text not null check(severity in('low','medium','high','critical')),domain text not null,status text not null default 'open' check(status in('open','investigating','mitigating','monitoring','resolved','closed')),title text not null,summary text not null,detected_at timestamptz not null default now(),owner text null,customer_impact text not null default '',financial_impact_dh numeric(14,2) not null default 0,root_cause text null,resolution text null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.incident_events(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',incident_id uuid not null references flashcards_os.incident_records(id) on delete restrict,status text not null,detail text not null,occurred_at timestamptz not null default now(),actor_name text not null
);
create table if not exists flashcards_os.release_readiness_checks(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',check_key text not null,domain text not null check(domain in('security','data','documents','fulfilment','cx','infrastructure','recovery','people')),label text not null,status text not null default 'not_started' check(status in('not_started','in_progress','passed','blocked','waived')),evidence text not null default '',owner text not null,due_at timestamptz null,blocking boolean not null default true,updated_at timestamptz not null default now(),unique(tenant_key,check_key)
);
create table if not exists flashcards_os.production_change_freezes(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',release_tag text not null,starts_at timestamptz not null,ends_at timestamptz null,status text not null default 'active',reason text not null,approved_by text not null,emergency_change_policy jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists flashcards_os.runbook_registry(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',runbook_key text not null,title text not null,domain text not null,version text not null,status text not null default 'active',owner text not null,content_location text not null,last_tested_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,runbook_key,version)
);
create table if not exists flashcards_os.retention_policies(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',policy_key text not null,entity_type text not null,retention_days integer not null check(retention_days>0),legal_hold_enabled boolean not null default false,destruction_requires_approval boolean not null default true,status text not null default 'active',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,policy_key)
);
create table if not exists flashcards_os.security_review_findings(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',finding_key text not null,severity text not null,title text not null,detail text not null,status text not null default 'open',owner text not null,due_at timestamptz null,evidence text not null default '',resolved_at timestamptz null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,finding_key)
);
create table if not exists flashcards_os.pilot_cohorts(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',code text not null,name text not null,status text not null default 'planned' check(status in('planned','active','paused','completed','cancelled')),starts_at timestamptz null,ends_at timestamptz null,operator_ids text[] not null default '{}',customer_ids uuid[] not null default '{}',scope text[] not null default '{}',success_criteria text[] not null default '{}',open_issues integer not null default 0 check(open_issues>=0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(tenant_key,code)
);
create table if not exists flashcards_os.pilot_events(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',pilot_id uuid not null references flashcards_os.pilot_cohorts(id) on delete restrict,event_type text not null,detail text not null,actor_name text not null,occurred_at timestamptz not null default now()
);
create table if not exists flashcards_os.experience_intelligence_runs(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',task text not null,actor_id text not null,actor_name text not null,model_requested text not null,model_used text not null,prompt_tokens integer not null default 0,completion_tokens integer not null default 0,total_tokens integer not null default 0,cost_usd numeric(14,6) not null default 0,latency_ms integer not null default 0,input_hash text not null,result_payload jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists flashcards_os.experience_settings(
 id uuid primary key default gen_random_uuid(),tenant_key text not null default 'angelcare-internal',setting_key text not null,setting_value jsonb not null default '{}'::jsonb,description text not null default '',updated_by text null,updated_at timestamptz not null default now(),unique(tenant_key,setting_key)
);

-- Indexes for operational queues.
create index if not exists idx_fc_fulfilment_status on flashcards_os.fulfilment_plans(tenant_key,status,priority,promised_at);
create index if not exists idx_fc_fulfilment_order on flashcards_os.fulfilment_plans(tenant_key,order_id);
create index if not exists idx_fc_shipment_status on flashcards_os.shipment_records(tenant_key,status,updated_at);
create index if not exists idx_fc_entitlement_customer on flashcards_os.digital_entitlements(tenant_key,customer_id,status);
create index if not exists idx_fc_cx_status on flashcards_os.cx_cases(tenant_key,status,severity,sla_due_at);
create index if not exists idx_fc_return_case on flashcards_os.return_authorizations(tenant_key,case_id,status);
create index if not exists idx_fc_refund_status on flashcards_os.refund_requests(tenant_key,status,approved_at);
create index if not exists idx_fc_quality_signal_status on flashcards_os.product_quality_signals(tenant_key,status,severity);
create index if not exists idx_fc_health_domain on flashcards_os.operational_health_checks(tenant_key,domain,status);
create index if not exists idx_fc_incident_status on flashcards_os.incident_records(tenant_key,status,severity);

-- Updated-at triggers without destructive DROP TRIGGER operations.
do $$ declare n text; begin
 for n in select unnest(array['fulfilment_plans','fulfilment_plan_items','physical_work_orders','pick_tasks','shipment_records','fulfilment_exceptions','customer_delivery_preferences','digital_entitlements','cx_cases','service_recovery_actions','return_authorizations','return_items','exchange_orders','refund_requests','product_quality_signals','corrective_actions','executive_decisions','executive_interventions','alert_rules','reconciliation_findings','incident_records','release_readiness_checks','runbook_registry','retention_policies','security_review_findings','pilot_cohorts']) loop
  if not exists(select 1 from pg_trigger where tgname='trg_fc_'||n||'_updated_at' and not tgisinternal) then execute format('create trigger %I before update on flashcards_os.%I for each row execute function flashcards_os.touch_updated_at()','trg_fc_'||n||'_updated_at',n); end if;
 end loop;
end $$;

create or replace function flashcards_os.protect_closed_experience_record() returns trigger language plpgsql as $$
begin
 if tg_table_name='cx_cases' and old.status in('closed','rejected') and (to_jsonb(old)-array['updated_at'])<>(to_jsonb(new)-array['updated_at']) then raise exception 'Closed CX case is immutable; reopen through a governed event.'; end if;
 if tg_table_name='refund_requests' and old.status in('completed','cancelled','rejected') and (to_jsonb(old)-array['updated_at'])<>(to_jsonb(new)-array['updated_at']) then raise exception 'Completed or rejected refund is immutable.'; end if;
 if tg_table_name='return_authorizations' and old.status='closed' and (to_jsonb(old)-array['updated_at'])<>(to_jsonb(new)-array['updated_at']) then raise exception 'Closed return authorization is immutable.'; end if;
 return new;
end $$;
do $$ declare n text; begin for n in select unnest(array['cx_cases','refund_requests','return_authorizations']) loop if not exists(select 1 from pg_trigger where tgname='trg_fc_'||n||'_immutable' and not tgisinternal) then execute format('create trigger %I before update on flashcards_os.%I for each row execute function flashcards_os.protect_closed_experience_record()','trg_fc_'||n||'_immutable',n); end if; end loop; end $$;

-- Service views, RLS and grants.
do $$ declare n text; begin
 for n in select unnest(array['fulfilment_plans','fulfilment_plan_items','fulfilment_events','physical_work_orders','pick_tasks','pack_units','shipment_records','shipment_events','delivery_confirmations','fulfilment_exceptions','customer_delivery_preferences','digital_entitlements','digital_entitlement_events','entitlement_download_events','cx_sla_policies','cx_cases','cx_case_items','cx_case_events','cx_evidence','service_recovery_actions','return_authorizations','return_items','return_receipts','exchange_orders','exchange_order_items','refund_requests','refund_approvals','refund_transactions','feedback_entries','satisfaction_surveys','product_quality_signals','product_quality_signal_links','corrective_actions','executive_metric_snapshots','executive_decisions','executive_interventions','operational_health_checks','alert_rules','alert_events','reconciliation_runs','reconciliation_findings','backup_registry','restore_tests','incident_records','incident_events','release_readiness_checks','production_change_freezes','runbook_registry','retention_policies','security_review_findings','pilot_cohorts','pilot_events','experience_intelligence_runs','experience_settings']) loop
  execute format('create or replace view public.%I as select * from flashcards_os.%I','fc_os_'||n,n);
  execute format('grant select on public.%I to authenticated','fc_os_'||n);
  execute format('grant select,insert,update,delete on public.%I to service_role','fc_os_'||n);
  execute format('alter table flashcards_os.%I enable row level security',n);
  if not exists(select 1 from pg_policies where schemaname='flashcards_os' and tablename=n and policyname='fc_internal_read') then execute format('create policy fc_internal_read on flashcards_os.%I for select to authenticated using (tenant_key=''angelcare-internal'')',n); end if;
  if not exists(select 1 from pg_policies where schemaname='flashcards_os' and tablename=n and policyname='fc_service_all') then execute format('create policy fc_service_all on flashcards_os.%I for all to service_role using (true) with check (true)',n); end if;
 end loop;
end $$;

-- Controlled doctrine, no invented customers, orders, refunds or operational transactions.
insert into flashcards_os.cx_sla_policies(tenant_key,case_type,severity,first_response_hours,resolve_hours,escalation_role,status) values
('angelcare-internal','default','low',24,120,'cx_coordinator','active'),('angelcare-internal','default','medium',8,72,'cx_manager','active'),('angelcare-internal','default','high',2,24,'operations_director','active'),('angelcare-internal','default','critical',1,4,'managing_director','active')
on conflict(tenant_key,case_type,severity) do update set first_response_hours=excluded.first_response_hours,resolve_hours=excluded.resolve_hours,escalation_role=excluded.escalation_role,status=excluded.status;
insert into flashcards_os.alert_rules(tenant_key,rule_key,domain,condition,severity,assigned_role,status) values
('angelcare-internal','windows_vault_offline','storage','{"status":"offline"}'::jsonb,'critical','it_admin','active'),('angelcare-internal','reconciliation_blocker','financial','{"blocking_count":{"gt":0}}'::jsonb,'critical','finance_controller','active'),('angelcare-internal','critical_cx_case','cx','{"severity":"critical","status_not_in":["closed","rejected"]}'::jsonb,'critical','operations_director','active'),('angelcare-internal','refund_exposure','cx','{"requested_amount_dh":{"gte":5000}}'::jsonb,'high','finance_controller','active')
on conflict(tenant_key,rule_key) do update set condition=excluded.condition,severity=excluded.severity,assigned_role=excluded.assigned_role,status=excluded.status;
insert into flashcards_os.release_readiness_checks(tenant_key,check_key,domain,label,status,evidence,owner,blocking) values
('angelcare-internal','role_matrix','people','Production role and separation-of-duties matrix approved','not_started','','Direction',true),
('angelcare-internal','financial_configuration','documents','Legal identity, tax, numbering, margin and payment configuration approved','not_started','','Finance',true),
('angelcare-internal','document_issuance','documents','Devis, delivery note, invoice, credit and receipt live examples validated','not_started','','Finance',true),
('angelcare-internal','rls_role_test','security','RLS and production roles tested with restricted identities','not_started','','IT + Direction',true),
('angelcare-internal','vault_backup','recovery','Windows Vault backup completed with checksum evidence','not_started','','IT',true),
('angelcare-internal','restore_test','recovery','Database and Vault restoration successfully tested','not_started','','IT',true),
('angelcare-internal','reconciliation_zero_blocker','data','Latest full reconciliation contains zero critical finding','not_started','','Finance + IT',true),
('angelcare-internal','controlled_pilot','people','Controlled pilot completed against signed success criteria','not_started','','Operations',true),
('angelcare-internal','incident_rehearsal','infrastructure','Production incident and rollback rehearsal completed','not_started','','IT + Operations',true),
('angelcare-internal','cx_resolution_test','cx','Return, exchange, complaint and refund cycles validated','not_started','','CX Manager',true),
('angelcare-internal','fulfilment_e2e','fulfilment','Physical, digital and hybrid fulfilment validated end-to-end','not_started','','Operations',true),
('angelcare-internal','monitoring_alerts','infrastructure','Health checks, alerts and escalation ownership active','not_started','','IT',true)
on conflict(tenant_key,check_key) do update set domain=excluded.domain,label=excluded.label,owner=excluded.owner,blocking=excluded.blocking;
insert into flashcards_os.experience_settings(tenant_key,setting_key,setting_value,description) values
('angelcare-internal','experience.ai_authority','{"advisory_only":true,"may_approve_refund":false,"may_confirm_delivery":false,"may_close_case":false,"may_contact_customer":false}'::jsonb,'OpenRouter has no irreversible fulfilment or CX authority.'),
('angelcare-internal','experience.external_research_boundary','{"tavily_allowed":false,"research_mission_required":true,"owner":"UMZ2"}'::jsonb,'No silent Tavily call in fulfilment or customer experience.'),
('angelcare-internal','experience.fulfilment_modes','{"modes":["physical","digital","hybrid"],"confirmed_order_required":true,"approved_release_required_for_digital":true}'::jsonb,'Fulfilment eligibility doctrine.'),
('angelcare-internal','experience.refund_authority','{"human_approval_required":true,"executive_threshold_dh":500,"paid_value_ceiling":true,"credit_note_lineage_required_for_completion":true}'::jsonb,'Refund control doctrine.'),
('angelcare-internal','experience.production_final','{"requires_umz1_to_umz6":true,"requires_build":true,"requires_live_migrations":true,"requires_reconciliation":true,"requires_restore_test":true,"requires_controlled_pilot":true}'::jsonb,'Final production acceptance contract.')
on conflict(tenant_key,setting_key) do update set setting_value=excluded.setting_value,description=excluded.description,updated_at=now();

insert into flashcards_os.permission_catalogue(tenant_key,permission_key,label,domain,risk_level,description) values
('angelcare-internal','flashcards_os.view_executive','Voir Executive Command','experience','high','Portfolio, revenue, fulfilment, CX and readiness.'),
('angelcare-internal','flashcards_os.view_delivery_experience','Voir Delivery & Experience','experience','medium','UMZ6 command bridge.'),
('angelcare-internal','flashcards_os.view_fulfilment','Voir fulfilment','experience','medium','Plans and operational lineage.'),
('angelcare-internal','flashcards_os.create_fulfilment_plans','Créer plans fulfilment','experience','high','Convert confirmed orders into execution plans.'),
('angelcare-internal','flashcards_os.manage_fulfilment','Gérer fulfilment','experience','high','Transition physical/digital/hybrid fulfilment.'),
('angelcare-internal','flashcards_os.manage_physical_fulfilment','Gérer physical fulfilment','experience','high','Pick, pack, QA and dispatch.'),
('angelcare-internal','flashcards_os.manage_shipments','Gérer shipments','experience','high','Carrier and delivery evidence.'),
('angelcare-internal','flashcards_os.manage_digital_entitlements','Gérer digital entitlements','experience','critical','Issue, suspend, revoke and replace access.'),
('angelcare-internal','flashcards_os.view_customer_experience','Voir Customer Experience','experience','medium','Cases, SLA and resolution.'),
('angelcare-internal','flashcards_os.open_cx_cases','Ouvrir CX cases','experience','high','Formal customer case intake.'),
('angelcare-internal','flashcards_os.manage_cx_cases','Gérer CX cases','experience','high','Eligibility, investigation and resolution.'),
('angelcare-internal','flashcards_os.manage_cx_evidence','Gérer CX evidence','experience','high','Evidence and attachments.'),
('angelcare-internal','flashcards_os.approve_returns','Approuver returns','experience','critical','Create return authorisations.'),
('angelcare-internal','flashcards_os.receive_returns','Recevoir returns','experience','high','Receipt and inspection evidence.'),
('angelcare-internal','flashcards_os.approve_exchanges','Approuver exchanges','experience','critical','Replacement obligations.'),
('angelcare-internal','flashcards_os.view_refunds','Voir refunds','experience','high','Refund exposure and status.'),
('angelcare-internal','flashcards_os.create_refund_requests','Créer refund requests','experience','critical','Paid-value bounded refund request.'),
('angelcare-internal','flashcards_os.approve_refunds','Approuver refunds','experience','critical','Finance/executive human authority.'),
('angelcare-internal','flashcards_os.complete_refunds','Compléter refunds','experience','critical','Record credit-note and payout evidence.'),
('angelcare-internal','flashcards_os.manage_product_quality_signals','Gérer product quality signals','experience','high','Feed customer evidence to product design.'),
('angelcare-internal','flashcards_os.view_operational_health','Voir operational health','experience','high','Infrastructure and control health.'),
('angelcare-internal','flashcards_os.run_health_checks','Exécuter health checks','experience','high','Database, Vault and provider checks.'),
('angelcare-internal','flashcards_os.run_reconciliation','Exécuter reconciliation','experience','critical','Orders, invoices, payments, balances, Vault and entitlements.'),
('angelcare-internal','flashcards_os.manage_release_readiness','Gérer release readiness','experience','critical','Production-final evidence and waivers.'),
('angelcare-internal','flashcards_os.manage_production_pilot','Gérer production pilot','experience','critical','Controlled cohort and success criteria.'),
('angelcare-internal','flashcards_os.manage_incidents','Gérer incidents','experience','critical','Incident lifecycle and impact.'),
('angelcare-internal','flashcards_os.capture_executive_snapshots','Capturer executive snapshots','experience','high','Deterministic board metrics.'),
('angelcare-internal','flashcards_os.run_experience_intelligence','Exécuter CX intelligence','experience','high','OpenRouter advisory only.'),
('angelcare-internal','flashcards_os.admin_production_hardening','Administrer production hardening','experience','critical','UMZ6 governance and controls.'),
('angelcare-internal','flashcards_os.audit_experience','Auditer Delivery & Experience','experience','high','Full UMZ6 lineage.'),
('angelcare-internal','flashcards_os.admin_experience','Administrer Delivery & Experience','experience','critical','Complete UMZ6 authority.')
on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;

select to_regclass('flashcards_os.fulfilment_plans') as fulfilment_plans,to_regclass('flashcards_os.digital_entitlements') as digital_entitlements,to_regclass('flashcards_os.cx_cases') as cx_cases,to_regclass('flashcards_os.return_authorizations') as return_authorizations,to_regclass('flashcards_os.refund_requests') as refund_requests,to_regclass('flashcards_os.product_quality_signals') as product_quality_signals,to_regclass('flashcards_os.reconciliation_runs') as reconciliation_runs,to_regclass('flashcards_os.release_readiness_checks') as release_readiness_checks;
commit;
