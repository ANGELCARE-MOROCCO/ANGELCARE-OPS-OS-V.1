-- ANGELCARE Orders 360: surgical recovery of missing canonical assisted-order reception.
-- Source authority: supabase/migrations/20261010080000_angelcare_marketplace_operational_reception_r1.sql
-- This file copies ONLY the original receive_assisted function, not the entire operational migration.
-- Idempotent when function already exists; never overwrites a preexisting definition.
-- Run before Commercial Studio R7 and then R8, only if all dependencies are present.
-- Payment capture is deliberately NOT performed by this function.
begin;
set local lock_timeout='8s';
set local statement_timeout='120s';

do $preflight$
declare missing_objects text;
begin
 select string_agg(dep.ref,', ' order by dep.ref)
   into missing_objects
 from (values
    ('public.angelcare_marketplace_customer_accounts'),
    ('public.angelcare_marketplace_catalog_items'),
    ('public.angelcare_marketplace_journeys'),
    ('public.angelcare_marketplace_family_quote_requests'),
    ('public.angelcare_marketplace_family_accounts'),
    ('public.angelcare_marketplace_public_inquiries'),
    ('public.angelcare_marketplace_catalog_discovery_v'),
    ('public.angelcare_marketplace_experience_schemas'),
    ('public.angelcare_marketplace_order_lines'),
    ('public.angelcare_marketplace_payment_intents'),
    ('public.angelcare_marketplace_public_inquiry_events'),
    ('public.angelcare_marketplace_intake_events')
 ) as dep(ref)
 where to_regclass(dep.ref) is null;
 if missing_objects is not null then
   raise exception 'ASSISTED_RECEPTION_BASE_SCHEMA_MISSING: %',missing_objects;
 end if;
 if to_regprocedure('public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid)') is not null then
   raise notice 'Canonical assisted-order function already exists; preserving existing implementation';
 end if;
end $preflight$;

do $installer$
begin
 if to_regprocedure('public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid)') is null then
   execute $canonical$
create function public.angelcare_marketplace_receive_assisted(p_body jsonb,p_actor uuid,p_territory uuid,p_tenant uuid)
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
   $canonical$;
   revoke all on function public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid)
     from public,anon,authenticated;
   grant execute on function public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid)
     to service_role;
   raise notice 'CANONICAL_RECEIVE_ASSISTED_RESTORED_FROM_ORIGINAL_R1';
 else
   raise notice 'CANONICAL_RECEIVE_ASSISTED_PRESERVED';
 end if;
end $installer$;

do $verification$
begin
 if to_regprocedure('public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid)') is null then
   raise exception 'CANONICAL_RECEIVE_ASSISTED_RESTORE_FAILED';
 end if;
end $verification$;

notify pgrst,'reload schema';
commit;

select to_regprocedure(
 'public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid)'
)::text as canonical_reception_signature;
