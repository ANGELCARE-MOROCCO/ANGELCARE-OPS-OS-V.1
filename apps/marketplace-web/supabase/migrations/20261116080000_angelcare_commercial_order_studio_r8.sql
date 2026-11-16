-- ANGELCARE Orders 360 R8 — forward-only extension.
-- Preserves R7 drafts, independent approvals and canonical receive_assisted.
-- Requires 20261114115500_angelcare_commercial_order_studio_r7.sql.
begin;
do $$ begin
 if to_regprocedure('public.angelcare_marketplace_commercial_r7_quote(jsonb)') is null
 or to_regprocedure('public.angelcare_marketplace_commercial_r7_submit(uuid,uuid,uuid,uuid,integer,text)') is null
 then raise exception 'R8_REQUIRES_COMMERCIAL_R7'; end if;
end $$;

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
    'lineId',line->>'id','itemId',item.id,'title',item.name_fr,'quantity',quantity,'unitPrice',round(unit_price,2),
    'discount',discount,'subtotal',line_gross,'net',line_net,'currency',row_currency,
    'requiresApproval',override));
 end loop;
 return jsonb_build_object('lines',result_lines,
  'subtotal',round(subtotal,2),'discount',round(total_discount,2),
  'net',round(subtotal-total_discount,2),'total',round(subtotal-total_discount,2),
  'currency',coalesce(currency,'MAD'),'requiresApproval',needs_approval,
  'taxStatus','not_calculated','warnings',jsonb_build_array('TAX_NOT_VERIFIED'));
end $$;

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
 if d.mode='b2b' and length(trim(coalesce(d.payload->'commercialContext'->>'legalEntity','')))<3
 then raise exception 'R8_B2B_LEGAL_ENTITY_REQUIRED';end if;
 if d.mode='quote' and
    (coalesce(d.payload->'commercialContext'->>'quoteValidity','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      or (d.payload->'commercialContext'->>'quoteValidity')::date < current_date)
 then raise exception 'R8_QUOTE_VALIDITY_REQUIRED';end if;
 if d.mode='renewal' and length(trim(coalesce(d.payload->'commercialContext'->>'renewalReason','')))<5
 then raise exception 'R8_RENEWAL_REASON_REQUIRED';end if;
 if d.mode in('subscription','b2b') and length(trim(coalesce(d.payload->>'contractNote','')))=0
 then raise exception 'R7_CONTRACT_TERMS_REQUIRED';end if;
 if d.mode<>'quote' and coalesce(d.payload->>'paymentMode','none')='none'
 then raise exception 'R7_PAYMENT_METHOD_REQUIRED';end if;
 if d.mode='renewal' then
  if coalesce(d.payload->>'sourceOrderId','') !~ '^[0-9a-fA-F-]{36}$'
  then raise exception 'R7_RENEWAL_SOURCE_REQUIRED';end if;
  if nullif(d.payload->>'customerAccountId','') is null then raise exception 'R7_RENEWAL_CUSTOMER_REQUIRED';end if;
  perform 1 from public.angelcare_marketplace_journeys j
  where j.id=(d.payload->>'sourceOrderId')::uuid
    and j.customer_account_id=(d.payload->>'customerAccountId')::uuid
    and j.tenant_id is not distinct from d.tenant_id;
  if not found then raise exception 'R7_RENEWAL_SOURCE_MISMATCH';end if;
 end if;
 if d.mode='subscription' then
  if nullif(d.payload->>'scheduledStartAt','') is null or
   not exists(select 1 from jsonb_array_elements(d.payload->'lines') x
    where coalesce((x->'configuration'->>'sessions')::int,0)>1
      and coalesce(x->'configuration'->>'frequency','unique')<>'unique')
  then raise exception 'R7_RECURRENCE_REQUIRED';end if;
 end if;
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
      'depositPercent',d.payload->'depositPercent','paymentMode',d.payload->'paymentMode',
      'commercialContext',coalesce(d.payload->'commercialContext','{}'::jsonb))),
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
commit;
