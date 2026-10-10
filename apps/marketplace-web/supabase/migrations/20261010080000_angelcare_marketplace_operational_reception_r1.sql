begin;
do $$ begin
 if not exists(select 1 from pg_trigger where tgname='trg_ac_materialize_journey_from_conversion' and not tgisinternal) then raise exception 'Required Journey Control materialization trigger missing';end if;
 if to_regclass('public.angelcare_marketplace_order_lines') is null or to_regclass('public.angelcare_marketplace_public_inquiry_events') is null then raise exception 'Enterprise Business Control / Total Commerce migrations required';end if;
end $$;
-- Marketplace Operational Reception R1. Run before releasing the matching source.
-- No catalogue/schema/import mutation. Existing domain authorities remain canonical.
alter table public.angelcare_marketplace_order_lines add column if not exists intake_line_key text;
create unique index if not exists ac_order_intake_line_uq on public.angelcare_marketplace_order_lines(journey_id,intake_line_key) where intake_line_key is not null;
alter table public.angelcare_marketplace_b2b_public_requests add column if not exists territory_id uuid;
alter table public.angelcare_marketplace_b2b_public_requests add column if not exists tenant_id uuid;
alter table public.angelcare_marketplace_b2b_public_requests add column if not exists source_route text;
alter table public.angelcare_marketplace_b2b_public_requests add column if not exists organization_id uuid references public.angelcare_marketplace_b2b_organizations(id);
alter table public.angelcare_marketplace_b2b_public_requests add column if not exists diagnostic_id uuid references public.angelcare_marketplace_b2b_diagnostics(id);
alter table public.angelcare_marketplace_b2b_public_requests add column if not exists admin_notes text;
create table if not exists public.angelcare_marketplace_intake_events (
 id uuid primary key default gen_random_uuid(), source_type text not null, source_id uuid not null,
 action text not null, actor_id uuid, reason text not null, evidence jsonb not null default '{}', created_at timestamptz not null default now()
);
alter table public.angelcare_marketplace_intake_events enable row level security;
revoke all on public.angelcare_marketplace_intake_events from public,anon,authenticated;
grant all on public.angelcare_marketplace_intake_events to service_role;
create index if not exists ac_intake_events_source_idx on public.angelcare_marketplace_intake_events(source_type,source_id,created_at desc);
create index if not exists ac_b2b_public_queue_idx on public.angelcare_marketplace_b2b_public_requests(status,territory_id,created_at desc);
create index if not exists ac_intake_journey_customer_idx on public.angelcare_marketplace_journeys(customer_account_id,created_at desc);

create or replace function public.angelcare_marketplace_receive_conversion(
 p_session_key text,p_visitor_hash text,p_customer_id uuid,p_payment_id uuid,p_method text,p_idempotency text
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 s public.angelcare_marketplace_conversion_sessions%rowtype; i public.angelcare_marketplace_catalog_items%rowtype;
 price public.angelcare_marketplace_conversion_price_snapshots%rowtype; pay public.angelcare_marketplace_payment_intents%rowtype;
 customer public.angelcare_marketplace_customer_accounts%rowtype; result public.angelcare_marketplace_conversion_outcomes%rowtype;
 j public.angelcare_marketplace_journeys%rowtype; b record; li jsonb; expected numeric; unit numeric; qty numeric; gross numeric:=0; allocated numeric:=0; discount numeric:=0;
 canonical_id uuid; canonical_type text; ref text; name text; lead_kind text; method text; payment_state text:='pending'; funding_error text;
 category text; native_type text; tax numeric:=0; tax_allocated numeric:=0; outcome_type text; ordinal int:=0; line_count int:=0; line_key text; config jsonb; availability jsonb;
begin
 select * into s from public.angelcare_marketplace_conversion_sessions where session_key=p_session_key and visitor_reference_hash=p_visitor_hash for update;
 if s.id is null then raise exception 'INTAKE_NOT_FOUND'; end if;
 select * into result from public.angelcare_marketplace_conversion_outcomes where session_id=s.id order by created_at limit 1;
 if result.id is not null then return to_jsonb(result); end if;
 if s.expires_at<=now() or s.status in('cancelled','expired') then raise exception 'INTAKE_EXPIRED'; end if;
 select * into i from public.angelcare_marketplace_catalog_items where id=s.catalog_item_id and status='published';
 if i.id is null then raise exception 'INTAKE_UNPUBLISHED'; end if;
 select category_key into category from public.angelcare_marketplace_catalog_discovery_v where id=i.id;
 native_type:=case when i.experience_schema_key='home-childcare-recurring' then 'recurring_service' when i.kind='kit' then 'kit_order' when i.kind='training' then 'academy_enrollment' when i.kind='saas_module' then 'partner_activation' when i.kind='audit' then 'quality_assessment' when category='hospitality' then 'hospitality_programme' when category='corporates' then 'corporate_benefit' when s.journey='b2b_quotation' then 'b2b_quotation' when s.journey='service_booking' then 'family_booking' else 'product_order' end;
 name:=coalesce(nullif(s.identity_context->>'fullName',''),nullif(s.identity_context->>'contactName',''));
 if length(coalesce(name,''))<2 or (nullif(s.identity_context->>'email','') is null and nullif(s.identity_context->>'phone','') is null) then raise exception 'INTAKE_CONTACT_REQUIRED'; end if;
 if exists(select 1 from unnest(array['marketplace_terms','privacy_notice']||case when category='health-partners' or i.experience_schema_key in('non-medical-support-service','health-adjacent-programme') then array['non_medical_boundary'] else array[]::text[] end) required(key)
   where not exists(select 1 from public.angelcare_marketplace_conversion_consents c where c.session_id=s.id and c.consent_key=required.key and c.accepted)) then raise exception 'INTAKE_CONSENT_REQUIRED'; end if;
 select * into price from public.angelcare_marketplace_conversion_price_snapshots where session_id=s.id order by created_at desc limit 1;
 if price.id is not null and (price.status not in('valid','quote_required') or price.valid_until<=now()) then raise exception 'INTAKE_PRICE_RECHECK'; end if;
 expected:=price.grand_total; availability:=coalesce(s.availability_result,'{}');
 if p_customer_id is not null then
  select * into customer from public.angelcare_marketplace_customer_accounts where id=p_customer_id and status='active';
  if customer.id is null or (s.customer_account_id is not null and s.customer_account_id<>p_customer_id) then raise exception 'INTAKE_CUSTOMER_MISMATCH'; end if;
  update public.angelcare_marketplace_conversion_sessions set customer_account_id=customer.id,family_account_id=coalesce(s.family_account_id,customer.family_account_id) where id=s.id;
  s.customer_account_id:=customer.id; s.family_account_id:=coalesce(s.family_account_id,customer.family_account_id);
 end if;
 method:=case when p_method in('cash_on_delivery','card','ac_wallet','bank_transfer','invoice','pay_at_location','manual_verified','deposit','installment','corporate_allowance','voucher') then p_method else 'manual_verified' end;
 if p_payment_id is not null then
  select * into pay from public.angelcare_marketplace_payment_intents where id=p_payment_id and conversion_session_id=s.id for update;
  if pay.id is null or expected is null or abs(pay.expected_amount-expected)>0.02 then raise exception 'INTAKE_PAYMENT_MISMATCH'; end if;
  if pay.customer_account_id is not null and s.customer_account_id is distinct from pay.customer_account_id then raise exception 'INTAKE_CUSTOMER_MISMATCH'; end if;
  method:=coalesce(pay.selected_method,method); payment_state:=pay.status;
  if pay.provider_key='ac_wallet' and pay.status='authorized' then
   -- A failed reservation never loses the request. Its ledger transaction rolls back in this subtransaction.
   begin
    if pay.wallet_reservation_id is null then raise exception 'Wallet reservation missing'; end if;
    perform public.angelcare_marketplace_wallet_commit_reservation(pay.wallet_reservation_id,pay.public_reference,coalesce(pay.provider_reference,pay.public_reference));
    update public.angelcare_marketplace_payment_intents set status='captured',captured_amount=expected,authorized_amount=expected,updated_at=now() where id=pay.id returning * into pay;
    payment_state:='captured';
   exception when others then
    funding_error:=SQLERRM; payment_state:='authorized';
   end;
  end if;
 end if;
 if expected is null then payment_state:='quote_required'; elsif expected=0 then payment_state:='not_required'; end if;
 config:=coalesce(s.configuration,'{}');
 if s.quote_basket_id is not null then
  perform 1 from public.angelcare_marketplace_quote_baskets where id=s.quote_basket_id for update;
  select count(*) into line_count from public.angelcare_marketplace_quote_basket_items where basket_id=s.quote_basket_id;
  if line_count=0 then raise exception 'INTAKE_EMPTY_BASKET'; end if;
  if exists(select 1 from public.angelcare_marketplace_quote_basket_items bi left join public.angelcare_marketplace_catalog_items ci on ci.id=bi.catalog_item_id where bi.basket_id=s.quote_basket_id and (ci.id is null or ci.status<>'published')) then raise exception 'INTAKE_UNPUBLISHED';end if;
  if price.id is not null then
   if jsonb_array_length(coalesce(price.evidence->'lines','[]'))<>line_count then raise exception 'INTAKE_BASKET_RECHECK'; end if;
   for b in select * from public.angelcare_marketplace_quote_basket_items where basket_id=s.quote_basket_id for update loop
    select value into li from jsonb_array_elements(price.evidence->'lines') where value->>'lineId'=b.id::text;
    if li is null or li->>'catalogItemId'<>b.catalog_item_id::text or (li->>'quantity')::numeric<>b.quantity or coalesce(li->'configuration','{}')<>b.configuration then raise exception 'INTAKE_BASKET_RECHECK'; end if;
   end loop;
  end if;
 end if;
 -- Receipt is an operational request. No automatic staffing/enrolment/subscription activation.
 if s.journey='service_booking' and s.family_account_id is not null then
  if nullif(config->>'childId','') is not null and not exists(select 1 from public.angelcare_marketplace_family_children where id=(config->>'childId')::uuid and family_account_id=s.family_account_id) then raise exception 'INTAKE_CUSTOMER_MISMATCH';end if;
  insert into public.angelcare_marketplace_family_quote_requests(family_account_id,child_id,service_family,city,requested_start_date,schedule,duration_expectation,location_notes,priorities,status,submitted_at)
   values(s.family_account_id,nullif(config->>'childId','')::uuid,i.item_key,coalesce(nullif(config->>'city',''),nullif(s.identity_context->>'city',''),'À confirmer'),nullif(config->>'requestedDate','')::date,coalesce(config->'schedule','{}'),config->>'duration',config->>'locationNotes',array(select jsonb_array_elements_text(coalesce(config->'priorities','[]'))),'submitted',now()) returning id,public_reference into canonical_id,ref;
  canonical_type:='family_quote_request';outcome_type:='booking_request_created';
 elsif s.journey='product_checkout' then
  canonical_type:='marketplace_order';canonical_id:=null;ref:=s.public_reference;outcome_type:='order_handover_created';
 else
  lead_kind:=case when s.journey='service_booking' then 'family' when s.journey='partner_subscription' then 'partner' when category='hospitality' then 'hotel' when category='health-partners' then 'clinic' when category='corporates' then 'corporate' else 'family' end;
  insert into public.angelcare_marketplace_crm_leads(lead_type,name,organization_name,email,phone,source,source_reference,status,territory_id,consent_evidence,next_action)
   values(lead_kind,name,s.identity_context->>'organizationName',s.identity_context->>'email',s.identity_context->>'phone','marketplace_conversion',s.public_reference,'new',s.territory_id,jsonb_build_object('conversionSessionId',s.id,'journey',s.journey),'Qualifier la demande et confirmer le périmètre. Pas d’activation automatique.') returning id,public_reference into canonical_id,ref;
  canonical_type:='crm_lead';outcome_type:=case s.journey when 'academy_enrollment' then 'enrollment_request_created' when 'partner_subscription' then 'subscription_request_created' when 'quality_assessment' then 'assessment_request_created' when 'b2b_quotation' then 'quotation_request_created' else 'booking_request_created' end;
 end if;
 insert into public.angelcare_marketplace_conversion_outcomes(session_id,outcome_type,canonical_object_type,canonical_object_id,public_reference,status,handover_payload,idempotency_key)
 values(s.id,outcome_type,canonical_type,canonical_id,ref,'submitted',jsonb_build_object('itemId',i.id,'journey',s.journey,'identity',s.identity_context,'configuration',config,'priceSnapshotId',price.id,'availability',availability,'reception','manual_review'),p_idempotency) returning * into result;
 -- Existing Journey Control trigger is a required migration dependency.
 select * into j from public.angelcare_marketplace_journeys where conversion_outcome_id=result.id for update;
 if j.id is null then raise exception 'INTAKE_JOURNEY_TRIGGER_REQUIRED'; end if;
 if s.journey='product_checkout' then
  update public.angelcare_marketplace_conversion_outcomes set canonical_object_id=j.id,public_reference=j.public_reference where id=result.id returning * into result;
 end if;
 if pay.id is null and expected>0 then
  insert into public.angelcare_marketplace_payment_intents(customer_account_id,conversion_session_id,canonical_object_type,canonical_object_id,status,currency_label,expected_amount,due_now_amount,due_later_amount,selected_method,idempotency_key,metadata)
  values(s.customer_account_id,s.id,'marketplace_journey',j.id,'pending',price.currency_label,expected,case when method in('cash_on_delivery','invoice','pay_at_location') then 0 else expected end,case when method in('cash_on_delivery','invoice','pay_at_location') then expected else 0 end,method,'intake:'||s.id,jsonb_build_object('source','operational_reception','manual_followup',true)) returning * into pay;
 end if;
 if pay.id is not null then
  update public.angelcare_marketplace_payment_intents set canonical_object_type='marketplace_journey',canonical_object_id=j.id,customer_account_id=coalesce(customer_account_id,s.customer_account_id),metadata=metadata||jsonb_build_object('conversion_outcome_id',result.id,'manual_followup',payment_state not in('captured','reconciled')),updated_at=now() where id=pay.id;
  insert into public.angelcare_marketplace_journey_links(journey_id,authority_type,authority_object_id,relationship_type,customer_visible) values(j.id,'payment_intent',pay.id::text,'financial_obligation',false) on conflict do nothing;
 end if;
 update public.angelcare_marketplace_journeys set status='awaiting_angelcare',customer_account_id=s.customer_account_id,family_account_id=s.family_account_id,owner_user_id=customer.auth_user_id,
  journey_type=case when s.quote_basket_id is null then native_type else journey_type end,
  financial_status=jsonb_build_object('status',payment_state,'payment_status',payment_state,'amount',expected,'expected_amount',expected,'grand_total',expected,'currency_label',coalesce(price.currency_label,i.currency_label,'Dh'),'payment_method',method,'payment_intent_id',pay.id,'captured_amount',coalesce(pay.captured_amount,0),'funding_followup',funding_error is not null),
  fulfillment_status=jsonb_build_object('status','awaiting_validation','availability',availability,'provider_confirmed',false),
  customer_context=s.identity_context||jsonb_build_object('display_name',name,'customer_account_id',s.customer_account_id),
  next_action_label=case when expected is null then 'Qualifier le besoin et établir le montant' else 'Valider la demande et organiser le paiement / exécution' end,
  creation_source='customer_checkout',metadata=metadata||jsonb_build_object('intake','received','price_snapshot_id',price.id,'source_route',s.source_route,'payment_method',method,'funding_followup',funding_error is not null),updated_at=now() where id=j.id;
 if s.quote_basket_id is not null then
  for b in select bi.*,ci.name_fr,ci.kind from public.angelcare_marketplace_quote_basket_items bi join public.angelcare_marketplace_catalog_items ci on ci.id=bi.catalog_item_id where bi.basket_id=s.quote_basket_id order by bi.id loop
   select value into li from jsonb_array_elements(coalesce(price.evidence->'lines','[]')) where value->>'lineId'=b.id::text;
   unit:=coalesce((li->>'unitPrice')::numeric,0);gross:=unit*b.quantity;
   discount:=case when expected is null or coalesce(price.subtotal,0)=0 then 0 when ordinal=line_count-1 then greatest(0,price.discount_total-allocated) else round(price.discount_total*gross/price.subtotal,2) end;
   allocated:=allocated+discount;
   tax:=case when expected is null or coalesce(price.subtotal,0)=0 then 0 when ordinal=line_count-1 then greatest(0,price.tax_total-tax_allocated) else round(price.tax_total*gross/price.subtotal,2) end;tax_allocated:=tax_allocated+tax;
   insert into public.angelcare_marketplace_order_lines(journey_id,catalog_item_id,line_type,title,quantity,unit_price,discount_amount,tax_amount,line_total,currency_label,configuration,fulfillment_config,intake_line_key,sort_order)
    values(j.id,b.catalog_item_id,b.kind,b.name_fr,b.quantity,unit,discount,tax,greatest(0,gross-discount+tax),coalesce(price.currency_label,'Dh'),b.configuration||jsonb_build_object('price_pending',price.id is null or li->>'unitPrice' is null,'source_basket_line_id',b.id,'price_snapshot_id',price.id),jsonb_build_object('status','awaiting_validation'),b.id::text,ordinal) on conflict do nothing;
   ordinal:=ordinal+1;
  end loop;
 else
  qty:=coalesce(price.quantity,1);unit:=coalesce(price.unit_price,0);
  insert into public.angelcare_marketplace_order_lines(journey_id,catalog_item_id,line_type,title,quantity,unit_price,discount_amount,tax_amount,line_total,currency_label,configuration,fulfillment_config,intake_line_key)
   values(j.id,i.id,i.kind,i.name_fr,qty,unit,coalesce(price.discount_total,0),coalesce(price.tax_total,0),coalesce(expected,0),coalesce(price.currency_label,i.currency_label,'Dh'),config||jsonb_build_object('price_pending',expected is null,'price_snapshot_id',price.id),jsonb_build_object('status','awaiting_validation'),s.id::text);
 end if;
 if s.quote_basket_id is not null then update public.angelcare_marketplace_quote_baskets set basket_status='submitted',updated_at=now() where id=s.quote_basket_id;end if;
 update public.angelcare_marketplace_journey_events set title='Demande reçue',description='Réception enregistrée; validation métier et paiement restent suivis séparément.' where journey_id=j.id and event_key='conversion_confirmed';
 update public.angelcare_marketplace_conversion_sessions set status='submitted',outcome_id=result.id,outcome_type=result.outcome_type,submitted_at=now(),confirmed_at=null,updated_at=now() where id=s.id;
 -- Receipt does not confirm capacity. Temporary holds are released for operational revalidation.
 update public.angelcare_marketplace_conversion_availability_holds set status='released',released_at=now(),reason='Request received; capacity must be confirmed by operations.' where session_id=s.id and status='held';
 insert into public.angelcare_marketplace_journey_events(journey_id,event_key,title,description,status,authority_type,authority_object_id,evidence,customer_visible)
 values(j.id,'request_received','Demande reçue','Validation opérationnelle et paiement suivis séparément.','awaiting_angelcare','operational_intake',result.id::text,jsonb_build_object('payment_status',payment_state,'payment_method',method),true);
 insert into public.angelcare_marketplace_intake_events(source_type,source_id,action,reason,evidence) values('journey',j.id,'received','Customer submission received',jsonb_build_object('conversion_id',s.id,'payment_status',payment_state));
 result.handover_payload:=result.handover_payload||jsonb_build_object('journeyId',j.id,'journeyReference',j.public_reference,'paymentStatus',payment_state,'paymentMethod',method);
 update public.angelcare_marketplace_conversion_outcomes set handover_payload=result.handover_payload where id=result.id;
 return to_jsonb(result);
end;$$;
revoke all on function public.angelcare_marketplace_receive_conversion(text,text,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_receive_conversion(text,text,uuid,uuid,text,text) to service_role;

-- Both legacy and canonical visitor hashes are recognised. Empty email cannot claim anonymous journeys.
create or replace function public.angelcare_marketplace_claim_guest_commerce(p_customer_account_id uuid,p_auth_user_id uuid,p_visitor_reference text,p_email text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_family uuid;v_conversions int;v_journeys int;
begin
 if not exists(select 1 from public.angelcare_marketplace_customer_accounts where id=p_customer_account_id and auth_user_id=p_auth_user_id and status='active' and lower(email)=lower(p_email)) then raise exception 'Verified customer required'; end if;
 select family_account_id into v_family from public.angelcare_marketplace_customer_accounts where id=p_customer_account_id;
 update public.angelcare_marketplace_conversion_sessions set customer_account_id=p_customer_account_id,family_account_id=coalesce(family_account_id,v_family),updated_at=now() where visitor_reference_hash in(encode(digest('angelcare-marketplace:'||p_visitor_reference,'sha256'),'hex'),encode(digest(p_visitor_reference,'sha256'),'hex')) and customer_account_id is null;
 get diagnostics v_conversions=row_count;
 update public.angelcare_marketplace_journeys j set customer_account_id=p_customer_account_id,family_account_id=coalesce(j.family_account_id,v_family),updated_at=now()
 where j.customer_account_id is null and (j.conversion_outcome_id in(select outcome_id from public.angelcare_marketplace_conversion_sessions where customer_account_id=p_customer_account_id) or (nullif(p_email,'') is not null and lower(j.customer_context->>'email')=lower(p_email)));
 get diagnostics v_journeys=row_count;
 update public.angelcare_marketplace_payment_intents p set customer_account_id=p_customer_account_id,updated_at=now() where p.customer_account_id is null and (p.conversion_session_id in(select id from public.angelcare_marketplace_conversion_sessions where customer_account_id=p_customer_account_id) or p.canonical_object_id in(select id from public.angelcare_marketplace_journeys where customer_account_id=p_customer_account_id));
 update public.angelcare_marketplace_homepage_visitor_selections set customer_account_id=p_customer_account_id where visitor_reference=p_visitor_reference and customer_account_id is null;
 update public.angelcare_marketplace_recently_viewed set customer_account_id=p_customer_account_id where visitor_reference=p_visitor_reference and customer_account_id is null;
 return jsonb_build_object('conversions',v_conversions,'journeys',v_journeys);
end;$$;
revoke all on function public.angelcare_marketplace_claim_guest_commerce(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_claim_guest_commerce(uuid,uuid,text,text) to service_role;

alter table public.angelcare_marketplace_journeys add column if not exists intake_owner_id uuid;
alter table public.angelcare_marketplace_public_inquiries add column if not exists intake_owner_id uuid;
alter table public.angelcare_marketplace_intake_events add column if not exists idempotency_key text;
create unique index if not exists ac_intake_event_idem_uq on public.angelcare_marketplace_intake_events(idempotency_key) where idempotency_key is not null;

create or replace function public.angelcare_marketplace_b2b_intake_action(p_id uuid,p_action text,p_reason text,p_actor uuid,p_territory uuid,p_tenant uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.angelcare_marketplace_b2b_public_requests%rowtype; diag public.angelcare_marketplace_b2b_diagnostics%rowtype; lead_id uuid;
begin
 if length(trim(p_reason))<3 then raise exception 'Reason required'; end if;
 select * into r from public.angelcare_marketplace_b2b_public_requests where id=p_id for update;
 if r.id is null then raise exception 'Request not found'; end if;
 if (p_tenant is not null and r.tenant_id is distinct from p_tenant) or (p_territory is not null and r.territory_id is not null and r.territory_id<>p_territory) then raise exception 'Scope mismatch'; end if;
 if p_action='claim' then r.owner_id:=p_actor;
 elsif p_action='triage' and r.status='submitted' then r.status:='triaged';r.owner_id:=coalesce(r.owner_id,p_actor);
 elsif p_action='qualify' and r.status in('submitted','triaged','qualified') then r.status:='qualified';r.owner_id:=coalesce(r.owner_id,p_actor);
 elsif p_action='reject' and r.status in('submitted','triaged','qualified') then r.status:='rejected';
 elsif p_action='archive' and r.status in('rejected','converted') then r.status:='archived';
 elsif p_action='diagnostic' then
  if r.diagnostic_id is null then
   if r.status not in('qualified') then raise exception 'Qualify before creating diagnostic'; end if;
   select * into diag from public.angelcare_marketplace_create_b2b_diagnostic(jsonb_build_object('vertical',r.vertical,'organization_name',r.organization_name,'organization_id',r.organization_id,'answers',jsonb_build_object('public_request_id',r.id,'city',r.city,'capacity',r.capacity,'urgency',r.urgency,'needs',r.needs,'source_locale',r.source_locale)),p_actor,coalesce(r.territory_id,p_territory),coalesce(r.tenant_id,p_tenant));
   r.diagnostic_id:=diag.id;r.organization_id:=diag.organization_id;
   insert into public.angelcare_marketplace_b2b_contacts(organization_id,full_name,email,phone,primary_contact,consent_status) values(r.organization_id,r.organization_name,r.email,r.phone,true,'recorded');
   r.status:='converted';
  end if;
 elsif p_action='crm' then
  if r.crm_lead_id is null then
   if r.status not in('qualified','converted') then raise exception 'Qualify before creating CRM lead'; end if;
   insert into public.angelcare_marketplace_crm_leads(lead_type,name,organization_name,email,phone,source,source_reference,status,territory_id,consent_evidence,next_action)
    values(case r.vertical when 'corporate' then 'corporate' when 'hospitality' then 'hotel' when 'health_partner' then 'clinic' else 'establishment' end,r.organization_name,r.organization_name,r.email,r.phone,'b2b_public_request',r.public_reference,'new',r.territory_id,jsonb_build_object('recorded_at',r.consent_recorded_at,'request_id',r.id),'Qualifier le projet et préparer la proposition.') returning id into lead_id;
   r.crm_lead_id:=lead_id;
  end if;
 elsif p_action='note' then null;
 else raise exception 'Invalid action or transition'; end if;
 update public.angelcare_marketplace_b2b_public_requests set status=r.status,owner_id=r.owner_id,organization_id=r.organization_id,diagnostic_id=r.diagnostic_id,crm_lead_id=r.crm_lead_id,admin_notes=p_reason,updated_at=now() where id=r.id returning * into r;
 insert into public.angelcare_marketplace_intake_events(source_type,source_id,action,actor_id,reason,evidence) values('b2b',r.id,p_action,p_actor,p_reason,jsonb_build_object('status',r.status,'diagnostic_id',r.diagnostic_id,'crm_lead_id',r.crm_lead_id));
 return to_jsonb(r);
end;$$;
revoke all on function public.angelcare_marketplace_b2b_intake_action(uuid,text,text,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_b2b_intake_action(uuid,text,text,uuid,uuid,uuid) to service_role;

-- Staff-assisted orders are also one transaction. Paid is never inferred from a select field.
create or replace function public.angelcare_marketplace_receive_assisted(p_body jsonb,p_actor uuid,p_territory uuid,p_tenant uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.angelcare_marketplace_customer_accounts%rowtype; i public.angelcare_marketplace_catalog_items%rowtype; j public.angelcare_marketplace_journeys%rowtype;
 quantity numeric; unit numeric; discount numeric; amount numeric; key text; typ text; name text; territory uuid; family_request public.angelcare_marketplace_family_quote_requests%rowtype; f public.angelcare_marketplace_family_accounts%rowtype; inquiry public.angelcare_marketplace_public_inquiries%rowtype; sellable text; schema_conversion text; category text; price_pending boolean;
begin
 key:=nullif(p_body->>'idempotencyKey','');if key is null then raise exception 'Idempotency key required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('assisted:'||key,0));
 select * into j from public.angelcare_marketplace_journeys where metadata->>'assisted_idempotency_key'=key;
 if j.id is not null then
  if j.metadata->>'created_by'<>p_actor::text then raise exception 'Idempotency ownership mismatch'; end if;
  return to_jsonb(j);
 end if;
 if p_body->>'paymentStatus' in('paid','external_verified','captured') then raise exception 'Record verified payment separately through Finance'; end if;
 if p_body->>'familyRequestId' is not null then
  select * into family_request from public.angelcare_marketplace_family_quote_requests where id=(p_body->>'familyRequestId')::uuid for update;
  if family_request.id is null then raise exception 'Family request missing'; end if;
  select * into f from public.angelcare_marketplace_family_accounts where id=family_request.family_account_id;
  if p_territory is not null and f.territory_id is distinct from p_territory then raise exception 'Family territory mismatch';end if;
  if p_tenant is not null and not exists(select 1 from public.angelcare_marketplace_customer_accounts where family_account_id=f.id and tenant_id=p_tenant) then raise exception 'Family tenant mismatch';end if;
  if family_request.status in('cancelled','declined','draft') then raise exception 'Family request not eligible';end if;
  select * into j from public.angelcare_marketplace_journeys where canonical_object_type='family_quote_request' and canonical_object_id=family_request.id for update;
  if j.id is not null then return to_jsonb(j); end if;
 end if;
 if nullif(p_body->>'inquiryId','') is not null then
  select * into inquiry from public.angelcare_marketplace_public_inquiries where id=(p_body->>'inquiryId')::uuid for update;
  if inquiry.id is null or inquiry.status in('closed','spam') then raise exception 'Inquiry not eligible';end if;
  if p_territory is not null and inquiry.territory_id is not null and inquiry.territory_id<>p_territory then raise exception 'Inquiry territory mismatch';end if;
  if p_tenant is not null then raise exception 'Unrouted public inquiries require a global operator';end if;
  if inquiry.linked_journey_id is not null then select * into j from public.angelcare_marketplace_journeys where id=inquiry.linked_journey_id;return to_jsonb(j);end if;
 end if;
 select * into i from public.angelcare_marketplace_catalog_items where id=(p_body->>'itemId')::uuid and status='published';
 if i.id is null then raise exception 'Published offer required'; end if;
 if p_territory is not null and i.territory_id is not null and i.territory_id<>p_territory then raise exception 'Offer territory mismatch';end if;
 if p_body->>'customerAccountId' is not null then
  select * into c from public.angelcare_marketplace_customer_accounts where id=(p_body->>'customerAccountId')::uuid;
  if c.id is null then raise exception 'Customer missing'; end if;
  if p_tenant is not null and c.tenant_id is distinct from p_tenant then raise exception 'Customer scope mismatch'; end if;
 end if;
 if family_request.id is not null then
  if c.id is null then select * into c from public.angelcare_marketplace_customer_accounts where family_account_id=f.id and status in('active','pending_verification') and(p_tenant is null or tenant_id=p_tenant) order by created_at limit 1;end if;
  if c.id is not null and c.family_account_id is distinct from f.id then raise exception 'Family customer mismatch';end if;
 end if;
 if c.id is not null and p_tenant is not null and c.tenant_id is distinct from p_tenant then raise exception 'Customer tenant mismatch';end if;
 if c.id is not null and p_territory is not null and c.territory_id is not null and c.territory_id<>p_territory then raise exception 'Customer territory mismatch';end if;
 name:=coalesce(c.display_name,f.display_name,nullif(p_body->>'guestName',''));if length(coalesce(name,''))<2 then raise exception 'Contact name required'; end if;
 if c.id is null and coalesce(f.email,nullif(p_body->>'guestEmail','')) is null and coalesce(f.phone,nullif(p_body->>'guestPhone','')) is null then raise exception 'Contact required'; end if;
 quantity:=coalesce((p_body->>'quantity')::numeric,1);unit:=coalesce((p_body->>'unitPrice')::numeric,i.price_amount,0);discount:=coalesce((p_body->>'discountAmount')::numeric,0);
 if quantity<=0 or quantity>10000 or unit<0 or discount<0 or discount>quantity*unit then raise exception 'Invalid pricing'; end if;
 price_pending:=(i.price_amount is null or i.price_mode='quote_only') and nullif(p_body->>'unitPrice','') is null;amount:=quantity*unit-discount;
 territory:=coalesce(nullif(p_body->>'territoryId','')::uuid,i.territory_id,c.territory_id,p_territory);
 if p_territory is not null and territory is distinct from p_territory then raise exception 'Territory scope mismatch'; end if;
 select category_key,coalesce(commercial_metadata->>'sellable_type','') into category,sellable from public.angelcare_marketplace_catalog_discovery_v where id=i.id;
 select conversion_template into schema_conversion from public.angelcare_marketplace_experience_schemas where schema_key=i.experience_schema_key;
 typ:=coalesce(nullif(p_body->>'journeyType',''),case when i.experience_schema_key='home-childcare-recurring' or sellable like '%recurring%' then 'recurring_service' when schema_conversion='academy_enrollment' or i.kind='training' then 'academy_enrollment' when schema_conversion='partner_subscription' or i.kind='saas_module' then 'partner_activation' when schema_conversion='quality_assessment' or i.kind='audit' then 'quality_assessment' when category='hospitality' then 'hospitality_programme' when category='corporates' then 'corporate_benefit' when schema_conversion='b2b_quotation' then 'b2b_quotation' when i.kind='service' then 'family_booking' when i.kind='kit' then 'kit_order' else 'product_order' end);
 if typ not in('product_order','kit_order','family_booking','recurring_service','academy_enrollment','b2b_quotation','hospitality_programme','corporate_benefit','partner_activation','quality_assessment') then raise exception 'Invalid journey type';end if;
 insert into public.angelcare_marketplace_journeys(journey_type,status,locale,title,customer_account_id,family_account_id,tenant_id,territory_id,canonical_object_type,canonical_object_id,current_authority,next_action_label,financial_status,fulfillment_status,customer_context,creation_source,assisted_order_payload,metadata)
 values(typ,'awaiting_angelcare','fr',i.name_fr,c.id,coalesce(c.family_account_id,f.id),p_tenant,territory,case when family_request.id is not null then 'family_quote_request' else 'catalog_item' end,coalesce(family_request.id,i.id),'manual_order_command','Qualifier la demande et organiser l’exécution',jsonb_build_object('status',case when price_pending then 'quote_required' else 'pending' end,'payment_status',case when price_pending then 'quote_required' else 'pending' end,'amount',case when price_pending then null else amount end,'expected_amount',case when price_pending then null else amount end,'grand_total',case when price_pending then null else amount end,'currency_label',i.currency_label,'payment_method',p_body->>'paymentMode'),jsonb_build_object('status','awaiting_validation'),jsonb_build_object('display_name',name,'fullName',name,'email',coalesce(c.email,f.email,p_body->>'guestEmail'),'phone',coalesce(c.phone,f.phone,p_body->>'guestPhone'),'city',p_body->>'city','address',p_body->>'address'),'admin_assisted_order',p_body,jsonb_build_object('created_by',p_actor,'assisted_idempotency_key',key,'family_request_id',family_request.id)) returning * into j;
 insert into public.angelcare_marketplace_order_lines(journey_id,catalog_item_id,line_type,title,quantity,unit_price,discount_amount,line_total,currency_label,configuration,fulfillment_config,intake_line_key,created_by)
 values(j.id,i.id,i.kind,i.name_fr,quantity,unit,discount,amount,i.currency_label,coalesce(p_body->'configuration','{}')||jsonb_build_object('price_pending',price_pending,'scheduled_start_requested',p_body->>'scheduledStartAt','scheduled_end_requested',p_body->>'scheduledEndAt'),jsonb_build_object('status','awaiting_validation'),key,p_actor);
 if amount>0 then
  insert into public.angelcare_marketplace_payment_intents(customer_account_id,canonical_object_type,canonical_object_id,status,currency_label,expected_amount,due_now_amount,selected_method,idempotency_key,metadata)
  values(c.id,'marketplace_journey',j.id,'pending',i.currency_label,amount,amount,case when p_body->>'paymentMode' in('card','ac_wallet','cash_on_delivery','bank_transfer','invoice','pay_at_location','manual_verified') then p_body->>'paymentMode' else 'manual_verified' end,'assisted:'||key,jsonb_build_object('source','assisted_intake'));
 end if;
 if p_body->>'inquiryId' is not null then
  update public.angelcare_marketplace_public_inquiries set linked_journey_id=j.id,linked_customer_account_id=c.id,status='qualified',updated_at=now() where id=(p_body->>'inquiryId')::uuid;
  insert into public.angelcare_marketplace_public_inquiry_events(inquiry_id,event_type,title,metadata,created_by) values((p_body->>'inquiryId')::uuid,'order_created','Demande liée à une commande',jsonb_build_object('journey_id',j.id),p_actor);
 end if;
 if family_request.id is not null then update public.angelcare_marketplace_family_quote_requests set status='qualified',owner_id=p_actor,updated_at=now() where id=family_request.id; end if;
 insert into public.angelcare_marketplace_intake_events(source_type,source_id,action,actor_id,reason,evidence) values('journey',j.id,'assisted_received',p_actor,coalesce(nullif(p_body->>'notes',''),'Commande assistée reçue'),jsonb_build_object('amount',amount,'family_request_id',family_request.id));
 return to_jsonb(j);
end;$$;
revoke all on function public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid) to service_role;

create or replace function public.angelcare_marketplace_record_manual_capture(p_id uuid,p_amount numeric,p_reference text,p_reason text,p_actor uuid,p_key text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.angelcare_marketplace_payment_intents%rowtype; amount numeric; attempt int; state text;
begin
 select * into p from public.angelcare_marketplace_payment_intents where id=p_id for update;
 if p.id is null then raise exception 'Payment missing'; end if;
 if exists(select 1 from public.angelcare_marketplace_intake_events where idempotency_key=p_key and source_id=p.id) then return to_jsonb(p); end if;
 if length(trim(coalesce(p_key,'')))<12 or length(trim(coalesce(p_reference,'')))<3 or length(trim(coalesce(p_reason,'')))<3 then raise exception 'Verified receipt reference, reason and idempotency required'; end if;
 if p.wallet_contribution>0 and p.selected_method<>'ac_wallet' then raise exception 'Mixed payment requires verified external settlement and its Wallet reservation';end if;
 if p.selected_method='ac_wallet' then raise exception 'Wallet settlement must use the Wallet ledger authority'; end if;
 if p.status not in('created','requires_method','requires_customer_action','pending','authorized','partially_captured','reconciliation_pending') then raise exception 'Payment cannot be captured in this state'; end if;
 if exists(select 1 from public.angelcare_marketplace_intake_events where source_type='payment' and source_id=p.id and action='manual_receipt_verified' and evidence->>'reference'=p_reference) then raise exception 'Receipt reference already recorded';end if;
 amount:=coalesce(p_amount,p.expected_amount-p.captured_amount);
 if amount<=0 or amount>p.expected_amount-p.captured_amount then raise exception 'Invalid capture amount'; end if;
 state:=case when p.captured_amount+amount>=p.expected_amount then 'captured' else 'partially_captured' end;
 select coalesce(max(attempt_number),0)+1 into attempt from public.angelcare_marketplace_payment_attempts where payment_intent_id=p.id;
 update public.angelcare_marketplace_payment_intents set status=state,captured_amount=captured_amount+amount,authorized_amount=greatest(authorized_amount,captured_amount+amount),provider_reference=p_reference,updated_at=now() where id=p.id returning * into p;
 insert into public.angelcare_marketplace_payment_attempts(payment_intent_id,attempt_number,method_kind,status,amount,idempotency_key,provider_key,provider_reference,customer_message,provider_evidence)
 values(p.id,attempt,coalesce(p.selected_method,'manual_verified'),state,amount,p_key,'manual_verified',p_reference,'Réception de fonds vérifiée par Finance.',jsonb_build_object('operator_attestation',true,'actor',p_actor,'reason',p_reason,'charges_card',false));
 update public.angelcare_marketplace_journeys set financial_status=financial_status||jsonb_build_object('status',state,'payment_status',state,'payment_intent_id',p.id,'captured_amount',p.captured_amount),updated_at=now() where id=p.canonical_object_id;
 insert into public.angelcare_marketplace_intake_events(source_type,source_id,action,actor_id,reason,evidence,idempotency_key) values('payment',p.id,'manual_receipt_verified',p_actor,p_reason,jsonb_build_object('amount',amount,'reference',p_reference),p_key);
 return to_jsonb(p);
end;$$;
revoke all on function public.angelcare_marketplace_record_manual_capture(uuid,numeric,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_record_manual_capture(uuid,numeric,text,text,uuid,text) to service_role;

create or replace view public.angelcare_marketplace_operational_intake_v with(security_invoker=true) as
 select 'journey'::text source_type,j.id source_id,j.public_reference reference,j.title,coalesce(j.customer_context->>'display_name',j.customer_context->>'fullName',j.customer_context->>'contactName','Client') contact_name,j.customer_context->>'email' email,j.customer_context->>'phone' phone,j.customer_context->>'organizationName' organization,j.journey_type vertical,j.metadata->>'source_route' source_route,j.status,j.financial_status->>'payment_status' payment_status,coalesce(j.financial_status->>'amount',j.financial_status->>'expected_amount')::numeric amount,coalesce(j.financial_status->>'currency_label','Dh') currency,j.intake_owner_id owner_id,j.territory_id,j.tenant_id,j.created_at,j.updated_at,j.customer_account_id customer_id,j.id journey_id,('/angelcare-marketplace/admin/orders/'||j.id||'/command') detail_url,to_jsonb(j) source_data
 from public.angelcare_marketplace_journeys j
 union all
 select 'b2b',r.id,r.public_reference,r.organization_name,r.organization_name,r.email,r.phone,r.organization_name,r.vertical,r.source_route,r.status,'not_required',null::numeric,'Dh',r.owner_id,r.territory_id,r.tenant_id,r.created_at,r.updated_at,null::uuid,null::uuid,('/angelcare-marketplace/admin/verticals/requests?id='||r.id),to_jsonb(r) from public.angelcare_marketplace_b2b_public_requests r
 union all
 select 'inquiry',r.id,r.public_reference,coalesce(r.organization,r.full_name),r.full_name,r.email,r.phone,r.organization,r.audience,r.source_route,r.status,'not_required',null::numeric,'Dh',r.intake_owner_id,r.territory_id,null::uuid,r.created_at,r.updated_at,r.linked_customer_account_id,r.linked_journey_id,('/angelcare-marketplace/admin/public-inquiries?id='||r.id),to_jsonb(r) from public.angelcare_marketplace_public_inquiries r
 union all
 select 'family',r.id,r.public_reference,r.service_family,f.display_name,f.email,f.phone,null::text,r.service_family,null::text,r.status,'not_required',null::numeric,'Dh',r.owner_id,f.territory_id,c.tenant_id,r.created_at,r.updated_at,c.id,null::uuid,('/angelcare-marketplace/admin/family-requests/'||r.id),to_jsonb(r) from public.angelcare_marketplace_family_quote_requests r join public.angelcare_marketplace_family_accounts f on f.id=r.family_account_id left join lateral(select ca.id,ca.tenant_id from public.angelcare_marketplace_customer_accounts ca where ca.family_account_id=f.id order by ca.created_at limit 1)c on true
 where not exists(select 1 from public.angelcare_marketplace_journeys j where j.canonical_object_type='family_quote_request' and j.canonical_object_id=r.id);
revoke all on public.angelcare_marketplace_operational_intake_v from public,anon,authenticated;
grant select on public.angelcare_marketplace_operational_intake_v to service_role;

-- Historical B2B requests stay visible; preserve their unknown territory rather than inventing one.
-- Existing product handovers acquire explicit financial links without changing amounts/captures.
update public.angelcare_marketplace_payment_intents p set canonical_object_type='marketplace_journey',canonical_object_id=j.id,
 metadata=coalesce(p.metadata,'{}')||jsonb_build_object('previous_canonical_type',p.canonical_object_type,'previous_canonical_id',p.canonical_object_id),updated_at=now()
 from public.angelcare_marketplace_journeys j,public.angelcare_marketplace_conversion_outcomes o
 where j.conversion_outcome_id=o.id and p.conversion_session_id=o.session_id and p.canonical_object_id=o.canonical_object_id and p.canonical_object_id is distinct from j.id;

-- Dispatch reservation is idempotent, rate limited and never stores email tokens/passwords.
create or replace function public.angelcare_marketplace_reserve_access_dispatch(p_customer uuid,p_actor uuid,p_action text,p_reason text,p_key text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.angelcare_marketplace_intake_events%rowtype;
begin
 if p_action not in('recover','resend') or length(trim(p_reason))<3 or length(p_key)<12 then raise exception 'Invalid access dispatch';end if;
 perform pg_advisory_xact_lock(hashtextextended('customer_access:'||p_customer::text,0));
 select * into e from public.angelcare_marketplace_intake_events where idempotency_key=p_key;
 if e.id is not null then
  if e.source_type<>'customer_access' or e.source_id<>p_customer or e.actor_id<>p_actor or e.evidence->>'operation'<>p_action then raise exception 'Dispatch ownership mismatch';end if;
  return to_jsonb(e);
 end if;
 if exists(select 1 from public.angelcare_marketplace_intake_events where source_type='customer_access' and source_id=p_customer and created_at>now()-interval '1 minute') then raise exception 'Attendez une minute avant une nouvelle demande email.';end if;
 insert into public.angelcare_marketplace_intake_events(source_type,source_id,action,actor_id,reason,evidence,idempotency_key) values('customer_access',p_customer,'dispatch_reserved',p_actor,p_reason,jsonb_build_object('operation',p_action,'delivery_verified',false),p_key) returning * into e;
 return to_jsonb(e);
end;$$;
revoke all on function public.angelcare_marketplace_reserve_access_dispatch(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_reserve_access_dispatch(uuid,uuid,text,text,text) to service_role;


-- A verified external capture is not a fully settled mixed payment until its Wallet debit exists.
-- Source adapters already verify external capture. This trigger protects their combined accounting.
create or replace function public.angelcare_marketplace_guard_mixed_settlement()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare reservation public.angelcare_marketplace_wallet_reservations%rowtype;
begin
 if new.status='captured' and coalesce(new.wallet_contribution,0)>0 and new.provider_key is distinct from 'ac_wallet' then
  begin
   select * into reservation from public.angelcare_marketplace_wallet_reservations where id=new.wallet_reservation_id for update;
   if reservation.id is null or reservation.source_id is distinct from new.id or abs(reservation.amount-new.wallet_contribution)>0.01 or not exists(select 1 from public.angelcare_marketplace_wallet_accounts where id=reservation.wallet_account_id and customer_account_id=new.customer_account_id) then raise exception 'Wallet reservation does not match this mixed payment';end if;
   perform public.angelcare_marketplace_wallet_commit_reservation(reservation.id,new.public_reference,new.provider_reference);
   new.metadata:=coalesce(new.metadata,'{}')||jsonb_build_object('mixed_wallet_settled',true,'mixed_wallet_reservation_id',reservation.id);
  exception when others then
   new.status:='partially_captured';
   new.captured_amount:=greatest(0,new.expected_amount-new.wallet_contribution);
   new.metadata:=coalesce(new.metadata,'{}')||jsonb_build_object('mixed_wallet_settled',false,'funding_followup',true,'settlement_boundary','external_verified_wallet_pending');
  end;
 end if;
 return new;
end;$$;
revoke all on function public.angelcare_marketplace_guard_mixed_settlement() from public,anon,authenticated;
drop trigger if exists trg_ac_guard_mixed_settlement on public.angelcare_marketplace_payment_intents;
create trigger trg_ac_guard_mixed_settlement before update of status,captured_amount on public.angelcare_marketplace_payment_intents for each row execute function public.angelcare_marketplace_guard_mixed_settlement();

-- The receipt may precede provider completion; financial changes update the linked journey only.
create or replace function public.angelcare_marketplace_sync_received_payment()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.canonical_object_type='marketplace_journey' then
  update public.angelcare_marketplace_journeys set financial_status=financial_status||jsonb_build_object('status',new.status,'payment_status',new.status,'payment_intent_id',new.id,'captured_amount',new.captured_amount,'refunded_amount',new.refunded_amount),updated_at=now() where id=new.canonical_object_id;
 end if;return new;
end;$$;
revoke all on function public.angelcare_marketplace_sync_received_payment() from public,anon,authenticated;
drop trigger if exists trg_ac_sync_received_payment on public.angelcare_marketplace_payment_intents;
create trigger trg_ac_sync_received_payment after update of status,captured_amount,refunded_amount on public.angelcare_marketplace_payment_intents for each row execute function public.angelcare_marketplace_sync_received_payment();

notify pgrst,'reload schema';
commit;
