
-- ANGELCARE MARKETPLACE · Commercial Order Studio 360 · R7
-- Additive, service-only, forward-only. Existing orders, payments, header and shell remain unchanged.
begin;

do $guard$
begin
 if to_regclass('public.angelcare_marketplace_journeys') is null
 or to_regclass('public.angelcare_marketplace_order_lines') is null
 or to_regclass('public.angelcare_marketplace_catalog_items') is null
 or to_regclass('public.angelcare_marketplace_customer_accounts') is null
 then raise exception 'R7_PREREQUISITE_SCHEMA_MISSING'; end if;
 if to_regprocedure('public.angelcare_marketplace_receive_assisted(jsonb,uuid,uuid,uuid)') is null
 then raise exception 'R7_LEGACY_ASSISTED_RECEPTION_REQUIRED'; end if;
end $guard$;

create table if not exists public.angelcare_marketplace_commercial_drafts_r7(
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null,
 tenant_id uuid,
 territory_id uuid,
 mode text not null default 'expert' check(mode in('quick','expert','quote','subscription','b2b','renewal')),
 payload jsonb not null default '{}'::jsonb,
 version integer not null default 1 check(version>0),
 status text not null default 'draft' check(status in('draft','submitted','abandoned')),
 approval_state text not null default 'none' check(approval_state in('none','requested','approved')),
 approval_by uuid,
 approval_at timestamptz,
 last_request_key text not null,
 submitted_order_id uuid references public.angelcare_marketplace_journeys(id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint r7_payload_object check(jsonb_typeof(payload)='object')
);
create index if not exists ac_commercial_r7_actor_recent
 on public.angelcare_marketplace_commercial_drafts_r7(actor_id,updated_at desc);
create index if not exists ac_commercial_r7_status
 on public.angelcare_marketplace_commercial_drafts_r7(status,updated_at desc);

create table if not exists public.angelcare_marketplace_commercial_events_r7(
 id uuid primary key default gen_random_uuid(),
 draft_id uuid not null references public.angelcare_marketplace_commercial_drafts_r7(id) on delete restrict,
 actor_id uuid not null,
 event_type text not null check(length(event_type) between 3 and 70),
 detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists ac_commercial_r7_events_recent
 on public.angelcare_marketplace_commercial_events_r7(draft_id,created_at desc);

-- Authoritative item retrieval, pricing and explicit approval indicators.
-- Taxes, costs, discounts and margin are NEVER fabricated from UI example values.
create or replace function public.angelcare_marketplace_commercial_r7_quote(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 line jsonb; item record; result_lines jsonb='[]'::jsonb;
 quantity integer; unit_price numeric; catalog_price numeric; discount numeric;
 subtotal numeric=0; total_discount numeric=0; line_gross numeric; line_net numeric;
 row_currency text; currency text=null; needs_approval boolean=false; override boolean;
 idx integer=0;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'R7_INVALID_PAYLOAD';end if;
 if jsonb_typeof(p_payload->'lines')<>'array' or jsonb_array_length(p_payload->'lines')>60
 then raise exception 'R7_INVALID_CART';end if;
 for line in select value from jsonb_array_elements(p_payload->'lines') loop
   idx=idx+1;
   if jsonb_typeof(line)<>'object' or coalesce(line->>'itemId','') !~
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
   then raise exception 'R7_INVALID_CATALOG_ID';end if;
   select id,name_fr,status,price_mode,price_amount,currency_label
    into item from public.angelcare_marketplace_catalog_items
    where id=(line->>'itemId')::uuid;
   if not found or item.status<>'published' then raise exception 'R7_UNPUBLISHED_CATALOG_ITEM';end if;
   quantity=(line->>'quantity')::integer;
   if quantity<1 or quantity>1000 then raise exception 'R7_INVALID_QUANTITY';end if;
   catalog_price=item.price_amount;
   if line->>'unitPrice' is not null then unit_price=(line->>'unitPrice')::numeric;
   else unit_price=catalog_price;end if;
   if unit_price is null or unit_price<0 or unit_price>100000000
    then raise exception 'R7_PRICE_MISSING_OR_INVALID';end if;
   discount=coalesce((line->>'discountAmount')::numeric,0);
   line_gross=round(unit_price*quantity,2);
   if discount<0 or discount>line_gross then raise exception 'R7_INVALID_DISCOUNT';end if;
   discount=round(discount,2);
   line_net=line_gross-discount;
   row_currency=coalesce(nullif(item.currency_label,''),'MAD');
   if row_currency='Dh' then row_currency='MAD';end if;
   if currency is null then currency=row_currency;
   elsif currency<>row_currency then raise exception 'R7_CURRENCY_MISMATCH';end if;
   override=(catalog_price is null or abs(unit_price-catalog_price)>0.001 or
    coalesce(item.price_mode,'')='quote_only' or discount>0);
   needs_approval=needs_approval or override;
   subtotal=subtotal+line_gross;
   total_discount=total_discount+discount;
   result_lines=result_lines||jsonb_build_array(jsonb_build_object(
    'itemId',item.id,'title',item.name_fr,'quantity',quantity,'unitPrice',round(unit_price,2),
    'discount',discount,'subtotal',line_gross,'net',line_net,'currency',row_currency,
    'requiresApproval',override));
 end loop;
 return jsonb_build_object('lines',result_lines,
  'subtotal',round(subtotal,2),'discount',round(total_discount,2),
  'net',round(subtotal-total_discount,2),'total',round(subtotal-total_discount,2),
  'currency',coalesce(currency,'MAD'),'requiresApproval',needs_approval,
  'taxStatus','not_calculated','warnings',jsonb_build_array('TAX_NOT_VERIFIED'));
end $$;

-- Versioned, idempotent autosave with explicit ownership and scope.
create or replace function public.angelcare_marketplace_commercial_r7_save(
 p_id uuid,p_actor uuid,p_tenant uuid,p_territory uuid,p_expected integer,
 p_payload jsonb,p_request text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare d public.angelcare_marketplace_commercial_drafts_r7; v_mode text;
begin
 if p_id is null or p_actor is null or length(p_request) not between 8 and 160
  or jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>250000
 then raise exception 'R7_INVALID_SAVE';end if;
 v_mode=coalesce(p_payload->>'mode','expert');
 if v_mode not in('quick','expert','quote','subscription','b2b','renewal')
 then raise exception 'R7_INVALID_MODE';end if;
 if jsonb_typeof(p_payload->'lines')<>'array'
 or jsonb_array_length(p_payload->'lines')>60 then raise exception 'R7_INVALID_CART';end if;
 select * into d from public.angelcare_marketplace_commercial_drafts_r7
 where id=p_id and actor_id=p_actor for update;
 if not found then
  if p_expected<>0 then raise exception 'R7_STALE_DRAFT_VERSION';end if;
  insert into public.angelcare_marketplace_commercial_drafts_r7
  (id,actor_id,tenant_id,territory_id,mode,payload,last_request_key)
  values(p_id,p_actor,p_tenant,p_territory,v_mode,p_payload,p_request)
  returning * into d;
 else
  if d.status<>'draft' then raise exception 'R7_DRAFT_LOCKED';end if;
  if d.last_request_key=p_request then return to_jsonb(d);end if;
  if d.version<>p_expected then raise exception 'R7_STALE_DRAFT_VERSION';end if;
  if d.tenant_id is distinct from p_tenant or d.territory_id is distinct from p_territory
  then raise exception 'R7_SCOPE_MISMATCH';end if;
  update public.angelcare_marketplace_commercial_drafts_r7
  set payload=p_payload,mode=v_mode,version=version+1,updated_at=now(),
   approval_state='none',approval_by=null,approval_at=null,last_request_key=p_request
  where id=p_id returning * into d;
 end if;
 insert into public.angelcare_marketplace_commercial_events_r7(draft_id,actor_id,event_type,detail)
 values(d.id,p_actor,'draft_saved',jsonb_build_object('version',d.version,'mode',d.mode));
 return to_jsonb(d);
end $$;

-- Approval must come from a distinct authorized operator; server API verifies elevated permission.
create or replace function public.angelcare_marketplace_commercial_r7_review(
 p_id uuid,p_actor uuid,p_expected integer,p_action text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare d public.angelcare_marketplace_commercial_drafts_r7; next_state text;
begin
 select * into strict d from public.angelcare_marketplace_commercial_drafts_r7
 where id=p_id for update;
 if d.status<>'draft' or d.version<>p_expected then raise exception 'R7_STALE_DRAFT_VERSION';end if;
 if p_action='request' then
  if d.actor_id<>p_actor then raise exception 'R7_NOT_DRAFT_OWNER';end if;
  next_state='requested';
 elsif p_action='approve' then
  if d.actor_id=p_actor then raise exception 'R7_SELF_APPROVAL_FORBIDDEN';end if;
  if d.approval_state<>'requested' then raise exception 'R7_APPROVAL_NOT_REQUESTED';end if;
  next_state='approved';
 else raise exception 'R7_UNKNOWN_APPROVAL_ACTION';end if;
 update public.angelcare_marketplace_commercial_drafts_r7 set
  approval_state=next_state,
  approval_by=case when next_state='approved' then p_actor else null end,
  approval_at=case when next_state='approved' then now() else null end,
  version=version+1,updated_at=now()
 where id=d.id returning * into d;
 insert into public.angelcare_marketplace_commercial_events_r7(draft_id,actor_id,event_type,detail)
 values(d.id,p_actor,'approval_'||next_state,jsonb_build_object('version',d.version));
 return to_jsonb(d);
end $$;

-- One canonical Journey, one canonical basket; entire submit is a DB transaction.
-- Legacy receive_assisted remains the booking/customer authority; no separate checkout or fake capture.
create or replace function public.angelcare_marketplace_commercial_r7_submit(
 p_id uuid,p_actor uuid,p_tenant uuid,p_territory uuid,p_expected integer,p_request text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 d public.angelcare_marketplace_commercial_drafts_r7;
 quote jsonb; first_line jsonb; cfg jsonb; body jsonb; created jsonb; result jsonb;
 order_id uuid; lines_count integer; row_count integer; ix integer=0;
 line jsonb; prior_line uuid; effective_currency text; order_financial jsonb;
begin
 if p_id is null or p_actor is null or length(p_request) not between 8 and 160
 then raise exception 'R7_INVALID_SUBMISSION';end if;
 select * into strict d from public.angelcare_marketplace_commercial_drafts_r7
 where id=p_id for update;
 if d.actor_id<>p_actor then raise exception 'R7_NOT_DRAFT_OWNER';end if;
 if d.tenant_id is distinct from p_tenant or d.territory_id is distinct from p_territory
 then raise exception 'R7_SCOPE_MISMATCH';end if;
 if d.status='submitted' then
  return jsonb_build_object('id',d.submitted_order_id,
   'public_reference',(select public_reference from public.angelcare_marketplace_journeys where id=d.submitted_order_id),
   'status','submitted','idempotent',true);
 end if;
 if d.status<>'draft' or d.version<>p_expected then raise exception 'R7_STALE_DRAFT_VERSION';end if;
 quote=public.angelcare_marketplace_commercial_r7_quote(d.payload);
 if jsonb_array_length(quote->'lines')=0 then raise exception 'R7_EMPTY_CART';end if;
 if (quote->>'requiresApproval')::boolean and d.approval_state<>'approved'
 then raise exception 'R7_COMMERCIAL_APPROVAL_REQUIRED';end if;
 if coalesce(d.payload->>'customerAccountId','')='' and
  (length(trim(coalesce(d.payload->>'guestName','')))<3 or
   (length(trim(coalesce(d.payload->>'guestPhone','')))=0 and
    length(trim(coalesce(d.payload->>'guestEmail','')))=0))
 then raise exception 'R7_CUSTOMER_REQUIRED';end if;
 if d.mode in('subscription','b2b') and length(trim(coalesce(d.payload->>'contractNote','')))=0
 then raise exception 'R7_CONTRACT_TERMS_REQUIRED';end if;
 if d.mode<>'quote' and coalesce(d.payload->>'paymentMode','none')='none'
 then raise exception 'R7_PAYMENT_METHOD_REQUIRED';end if;
 first_line=(quote->'lines')->0;cfg=(d.payload->'lines')->0->'configuration';
 effective_currency=quote->>'currency';
 body=jsonb_build_object(
  'idempotencyKey','r7-'||d.id::text,
  'familyRequestId',d.payload->'familyRequestId',
  'customerAccountId',nullif(d.payload->>'customerAccountId',''),
  'guestName',d.payload->'guestName','guestEmail',d.payload->'guestEmail',
  'guestPhone',d.payload->'guestPhone','itemId',first_line->'itemId',
  'quantity',first_line->'quantity','unitPrice',first_line->'unitPrice',
  'discountAmount',first_line->'discount',
  'territoryId',coalesce(nullif(d.payload->>'territoryId',''),p_territory::text),
  'city',d.payload->'city','address',d.payload->'address',
  'scheduledStartAt',d.payload->'scheduledStartAt',
  'scheduledEndAt',d.payload->'scheduledEndAt','notes',d.payload->'notes',
  'inquiryId',d.payload->'inquiryId','configuration',coalesce(cfg,'{}'::jsonb)
   ||jsonb_build_object('studio','Commercial Order Studio 360','draftId',d.id),
  'paymentMode','none','paymentStatus','pending');
 if d.mode in('quote','b2b') then body=body||jsonb_build_object('journeyType','b2b_quotation');end if;
 if d.mode='subscription' then body=body||jsonb_build_object('journeyType','recurring_service');end if;
 select to_jsonb(public.angelcare_marketplace_receive_assisted(
  body,p_actor,p_territory,p_tenant)) into created;
 order_id=coalesce(nullif(created->>'id','')::uuid,
  nullif(created->>'journey_id','')::uuid,
  nullif(created->>'journeyId','')::uuid,
  nullif(created->>'orderId','')::uuid,
  nullif(created->'journey'->>'id','')::uuid);
 if order_id is null then raise exception 'R7_CANONICAL_ORDER_RECEIPT_MISSING';end if;
 perform 1 from public.angelcare_marketplace_journeys where id=order_id for update;
 if not found then raise exception 'R7_CANONICAL_ORDER_NOT_FOUND';end if;
 select count(*),min(id) into lines_count,prior_line
 from public.angelcare_marketplace_order_lines where journey_id=order_id;
 if lines_count>1 then raise exception 'R7_UNEXPECTED_LEGACY_LINES';end if;
 for line in select value from jsonb_array_elements(quote->'lines') loop
  ix=ix+1;
  cfg=(d.payload->'lines')->(ix-1)->'configuration';
  if ix=1 and prior_line is not null then
   update public.angelcare_marketplace_order_lines set
    catalog_item_id=(line->>'itemId')::uuid,title=line->>'title',
    quantity=(line->>'quantity')::numeric,unit_price=(line->>'unitPrice')::numeric,
    discount_amount=(line->>'discount')::numeric,tax_amount=0,
    line_total=(line->>'net')::numeric,currency_label=effective_currency,
    configuration=coalesce(cfg,'{}'::jsonb),updated_by=p_actor,updated_at=now(),
    status='active',sort_order=ix
   where id=prior_line and journey_id=order_id;
  else
   insert into public.angelcare_marketplace_order_lines(
    journey_id,catalog_item_id,line_type,title,quantity,unit_price,discount_amount,
    tax_amount,line_total,currency_label,configuration,fulfillment_config,status,
    sort_order,created_by,updated_by)
   values(order_id,(line->>'itemId')::uuid,'catalog_item',line->>'title',
    (line->>'quantity')::numeric,(line->>'unitPrice')::numeric,
    (line->>'discount')::numeric,0,(line->>'net')::numeric,effective_currency,
    coalesce(cfg,'{}'::jsonb),'{}'::jsonb,'active',ix,p_actor,p_actor);
  end if;
 end loop;
 select financial_status into order_financial
 from public.angelcare_marketplace_journeys where id=order_id;
 update public.angelcare_marketplace_journeys
 set financial_status=coalesce(order_financial,'{}'::jsonb)
  ||jsonb_build_object('expected_amount',(quote->>'total')::numeric,
    'currency_label',effective_currency,'pricing_authority','commercial_r7',
    'tax_status','not_calculated','payment_status','pending'),
  assisted_order_payload=coalesce(assisted_order_payload,'{}'::jsonb)
  ||jsonb_build_object('r7DraftId',d.id,'r7Quote',quote,'r7Mode',d.mode,
    'r7Context',jsonb_build_object('contractNote',d.payload->'contractNote',
      'depositPercent',d.payload->'depositPercent','paymentMode',d.payload->'paymentMode')),
  updated_at=now()
 where id=order_id;
 update public.angelcare_marketplace_commercial_drafts_r7 set
  status='submitted',submitted_order_id=order_id,version=version+1,updated_at=now(),
  last_request_key=p_request where id=d.id;
 insert into public.angelcare_marketplace_commercial_events_r7(draft_id,actor_id,event_type,detail)
 values(d.id,p_actor,'order_created',jsonb_build_object('orderId',order_id,'total',quote->'total','lines',ix));
 select jsonb_build_object('id',id,'public_reference',public_reference,
  'status','submitted','lines',ix,'total',quote->'total','currency',effective_currency)
 into result from public.angelcare_marketplace_journeys where id=order_id;
 return result;
end $$;

alter table public.angelcare_marketplace_commercial_drafts_r7 enable row level security;
alter table public.angelcare_marketplace_commercial_events_r7 enable row level security;
revoke all on table public.angelcare_marketplace_commercial_drafts_r7 from public,anon,authenticated;
revoke all on table public.angelcare_marketplace_commercial_events_r7 from public,anon,authenticated;
grant all on table public.angelcare_marketplace_commercial_drafts_r7 to service_role;
grant all on table public.angelcare_marketplace_commercial_events_r7 to service_role;
revoke all on function public.angelcare_marketplace_commercial_r7_quote(jsonb) from public,anon,authenticated;
revoke all on function public.angelcare_marketplace_commercial_r7_save(uuid,uuid,uuid,uuid,integer,jsonb,text) from public,anon,authenticated;
revoke all on function public.angelcare_marketplace_commercial_r7_review(uuid,uuid,integer,text) from public,anon,authenticated;
revoke all on function public.angelcare_marketplace_commercial_r7_submit(uuid,uuid,uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_commercial_r7_quote(jsonb) to service_role;
grant execute on function public.angelcare_marketplace_commercial_r7_save(uuid,uuid,uuid,uuid,integer,jsonb,text) to service_role;
grant execute on function public.angelcare_marketplace_commercial_r7_review(uuid,uuid,integer,text) to service_role;
grant execute on function public.angelcare_marketplace_commercial_r7_submit(uuid,uuid,uuid,uuid,integer,text) to service_role;

commit;
