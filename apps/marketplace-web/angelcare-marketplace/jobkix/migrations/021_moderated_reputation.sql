begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=20) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
alter table public.jobkix_reputation add column publication_consented_at timestamptz;
alter table public.jobkix_reputation add column consent_methodology_hash text;
alter table public.jobkix_reputation add column rating smallint check(rating between 1 and 5);
alter table public.jobkix_reputation add column parent_id uuid references public.jobkix_reputation(id);
alter table public.jobkix_reputation add column parent_version integer;
create unique index jobkix_one_pending_reputation_correction on public.jobkix_reputation(parent_id) where parent_id is not null and state in ('submitted','under_review');
alter table public.jobkix_drafts drop constraint jobkix_drafts_kind_check;
alter table public.jobkix_drafts add constraint jobkix_drafts_kind_check check(kind in ('application','vacancy','message','profile','organization','hiring','case','team','talent','reputation'));
create function public.jobkix_reputation_methodologies() returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(jsonb_object_agg(e.locale,e.source_hash),'{}') from public.jobkix_editorial_documents d join public.jobkix_editorial_editions e on e.document_id=d.id
 where d.slug='reputation-methodology' and e.status='published' and e.reviewed_by is not null and e.reviewed_hash=e.content_hash and e.source_hash=d.source_hash and e.source_revision=d.source_revision
$$;
revoke all on function public.jobkix_reputation_methodologies() from public,anon,authenticated;
grant execute on function public.jobkix_reputation_methodologies() to anon,authenticated;
create function public.jobkix_my_reputation(p_page integer default 1,p_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();result jsonb;begin
 if p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 with own as (select r.*,case when o.status='active' and o.public_profile_approved_at is not null then o.public_name else null end as public_name from public.jobkix_reputation r join public.jobkix_organizations o on o.id=r.organization_id where contributor_user_id=actor and (p_id is null or r.id=p_id)),paged as (select * from own order by created_at desc,id offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'organizationId',organization_id,'organizationName',public_name,'kind',kind,'locale',original_locale,'body',body,'relationship',evidence->>'relationship','amount',amount,'currency',currency,'unit',unit,'professionId',profession_id,'country',country,'rating',rating,'parentId',parent_id,'version',version,'state',state,'createdAt',created_at) order by created_at desc,id) from paged),'[]'),'total',(select count(*) from own),'page',p_page,'pageSize',24) into result;return result;
end $$;
create function public.jobkix_reputation_receipt(p_action text,p_key text) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();receipt public.jobkix_command_receipts;begin
 if p_action not in ('reputation.contribute','reputation.withdraw') or length(coalesce(p_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 select * into receipt from public.jobkix_command_receipts where actor_user_id=actor and action=p_action and idempotency_key=p_key;if not found then return null;end if;
 if not exists(select 1 from public.jobkix_reputation where id=(receipt.result->>'id')::uuid and contributor_user_id=actor) then raise exception 'FORBIDDEN';end if;return receipt.result;
end $$;
create function public.jobkix_public_reputation(p_kind text,p_locale text,p_filters jsonb default '{}',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare methodology jsonb;result jsonb;begin
 if p_kind not in ('review','salary') or p_locale not in ('en','fr','es','hi','tl','id','ar') or p_page is null or p_page not between 1 and 10000 or p_filters is null or jsonb_typeof(p_filters)<>'object' or octet_length(p_filters::text)>6000 then raise exception 'INVALID_INPUT';end if;
 if exists(select 1 from jsonb_each(p_filters) f where key not in ('q','country','profession','organizationId','rating','currency','unit') or jsonb_typeof(value)<>'string' or length(value#>>'{}')>300)
 or (p_filters?'country' and p_filters->>'country'!~'^[A-Z]{2}$') or (p_filters?'rating' and p_filters->>'rating' not in ('1','2','3','4','5')) or (p_filters?'currency' and p_filters->>'currency'!~'^[A-Z]{3}$') or (p_filters?'unit' and p_filters->>'unit' not in ('hour','day','week','month','year')) then raise exception 'INVALID_INPUT';end if;
 if p_kind='salary' and (p_filters?'organizationId' or p_filters?'rating') then raise exception 'INVALID_INPUT';end if;
 methodology:=public.jobkix_public_editorial('reputation-methodology',p_locale);
 if methodology is null then return jsonb_build_object('items','[]'::jsonb,'total',0,'page',p_page,'pageSize',24,'statistics',null,'methodology',null);end if;
 with eligible as (select r.*,case when o.status='active' and o.public_profile_approved_at is not null then o.public_name else null end as public_name from public.jobkix_reputation r join public.jobkix_organizations o on o.id=r.organization_id and o.status='active' and o.public_profile_approved_at is not null
 where r.kind=p_kind and r.state='published' and r.methodology_revision=methodology->>'sourceHash' and r.publication_consented_at is not null and r.consent_methodology_hash=methodology->>'sourceHash'
 and (not p_filters?'country' or r.country=p_filters->>'country') and (not p_filters?'profession' or r.profession_id=p_filters->>'profession') and (not p_filters?'organizationId' or r.organization_id::text=p_filters->>'organizationId')
 and (not p_filters?'rating' or r.rating::text=p_filters->>'rating') and (not p_filters?'currency' or r.currency=p_filters->>'currency') and (not p_filters?'unit' or r.unit=p_filters->>'unit')
 and (coalesce(p_filters->>'q','')='' or (p_kind='review' and position(lower(p_filters->>'q') in lower(o.public_name||' '||r.body))>0) or (p_kind='salary' and exists(select 1 from public.jobkix_taxonomy t where t.kind='occupation' and t.key=r.profession_id and t.status='published' and position(lower(p_filters->>'q') in lower(coalesce(t.localized_names->>p_locale,t.source_name_en)||' '||t.key))>0)))),
 latest_salaries as (select distinct on(contributor_user_id,country,profession_id,currency,unit) * from eligible where p_kind='salary' order by contributor_user_id,country,profession_id,currency,unit,created_at desc,id),
 salary_groups as (select country,profession_id,currency,unit,count(*) as sample,percentile_cont(0.5) within group(order by amount) as median,min(amount) as minimum,max(amount) as maximum from latest_salaries group by country,profession_id,currency,unit having count(*)>=5),
 reviews_page as (select * from eligible where p_kind='review' order by reviewed_at desc,id offset (p_page-1)*24 limit 24),
 salaries_page as (select * from salary_groups order by sample desc,country,profession_id,currency,unit offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',case when p_kind='review' then coalesce((select jsonb_agg(jsonb_build_object('id',id,'organizationId',organization_id,'employerName',public_name,'body',body,'originalLocale',original_locale,'rating',rating,'country',country,'professionId',profession_id,'reviewedAt',reviewed_at,'provenance','moderated_contributor_declaration') order by reviewed_at desc,id) from reviews_page),'[]')
 else coalesce((select jsonb_agg(jsonb_build_object('country',country,'professionId',profession_id,'currency',currency,'unit',unit,'sample',sample,'median',median,'minimum',minimum,'maximum',maximum) order by sample desc,country,profession_id,currency,unit) from salaries_page),'[]') end,
 'total',case when p_kind='review' then (select count(*) from eligible) else (select count(*) from salary_groups) end,'page',p_page,'pageSize',24,
 'statistics',case when p_kind='review' and (select count(distinct contributor_user_id) from eligible where rating is not null)>=5 then jsonb_build_object('ratingAverage',(select round(avg(rating),1) from eligible where rating is not null),'ratingSample',(select count(*) from eligible where rating is not null)) else null end,
 'methodology',jsonb_build_object('title',methodology->>'title','sourceHash',methodology->>'sourceHash','translationRevision',methodology->'translationRevision','publishedAt',methodology->'publishedAt')) into result;return result;
end $$;
revoke all on function public.jobkix_my_reputation(integer,uuid),public.jobkix_reputation_receipt(text,text),public.jobkix_public_reputation(text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.jobkix_my_reputation(integer,uuid),public.jobkix_reputation_receipt(text,text) to authenticated;
grant execute on function public.jobkix_public_reputation(text,text,jsonb,integer) to anon,authenticated;
insert into public.jobkix_schema_versions(version) values(21);
commit;
