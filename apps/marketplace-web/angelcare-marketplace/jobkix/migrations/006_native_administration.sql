-- Additive JOBKIX operations. Native Marketplace administration authenticates and authorizes
-- every request before the service-only RPC. Public Supabase identities receive no execute grant.
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=5) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
alter table public.jobkix_editorial_editions add column edited_by uuid;
alter table public.jobkix_editorial_editions add column reviewed_at timestamptz;

create function public.jobkix_editorial_hash(p_title text,p_summary text,p_sections jsonb,p_author text,p_provenance text) returns text
language sql immutable set search_path=pg_catalog as $$
 select encode(sha256(convert_to(jsonb_build_object('title',p_title,'summary',p_summary,'sections',p_sections,'author',p_author,'provenance',p_provenance)::text,'UTF8')),'hex')
$$;

create function public.jobkix_admin_command(p_actor uuid,p_action text,p_payload jsonb,p_expected_version integer,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare previous public.jobkix_admin_receipts;req_hash text;result jsonb;obj uuid;ver integer;target text;
 org public.jobkix_organizations;vac public.jobkix_vacancies;c public.jobkix_cases;reputation public.jobkix_reputation;reputation_parent public.jobkix_reputation;methodology jsonb;
 doc public.jobkix_editorial_documents;edition public.jobkix_editorial_editions;prior_edition public.jobkix_editorial_editions;
 lang text;content_hash text;source_hash text;source_revision integer;next_version integer;note text;
 evidence uuid[];recipients uuid[];evidence_id uuid;definition public.jobkix_taxonomy;
begin
 if p_actor is null or p_action is null or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>200000
 or p_idempotency_key is null or length(p_idempotency_key) not between 16 and 180 or p_expected_version is null or p_expected_version<0 then raise exception 'INVALID_INPUT';end if;
 perform pg_advisory_xact_lock(hashtextextended('jobkix-admin:'||p_actor::text||':'||p_idempotency_key,0));
 req_hash:=encode(sha256(convert_to(jsonb_build_object('action',p_action,'payload',p_payload,'version',p_expected_version)::text,'UTF8')),'hex');
 select * into previous from public.jobkix_admin_receipts where admin_actor_id=p_actor and idempotency_key=p_idempotency_key;
 if found then if previous.request_hash<>req_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return previous.result||jsonb_build_object('replayed',true);end if;
 note:=trim(coalesce(p_payload->>'note',''));
 if length(note) not between 20 and 4000 then raise exception 'INVALID_INPUT';end if;

 if p_action in ('delivery.retry','delivery.cancel') then
  result:=public.jobkix_delivery_recovery((p_payload->>'id')::uuid,p_expected_version,p_action);obj:=(result->>'id')::uuid;ver:=(result->>'version')::integer;target:=result->>'state';
 elsif p_action in ('organization.review','organization.revoke','organization.suspend','organization.restore','organization.media_review','organization.media_revoke') then
  select * into org from public.jobkix_organizations where id=(p_payload->>'id')::uuid for update;
  if not found then raise exception 'NOT_FOUND';end if;perform public.jobkix_version(org.version,p_expected_version);
  if p_action in ('organization.media_review','organization.media_revoke') then
   if p_action='organization.media_review' then
    if not exists(select 1 from public.jobkix_files where id=(p_payload->>'evidenceId')::uuid and organization_id=org.id and purpose='verification' and state='ready' and sha256 is not null and scanner_reference is not null) then raise exception 'DOCUMENT_NOT_READY';end if;
    if not exists(select 1 from public.angelcare_marketplace_media_assets where id=(p_payload->>'mediaId')::uuid and status='active' and mime_type in ('image/jpeg','image/png','image/webp','image/avif') and rights_status in ('owned','licensed','public_domain') and (rights_expires_at is null or rights_expires_at>now()) and length(public_url)>0) then raise exception 'DOCUMENT_NOT_READY';end if;
    insert into public.jobkix_employer_media_approvals(organization_id,media_asset_id,evidence_file_id,reviewed_by) values(org.id,(p_payload->>'mediaId')::uuid,(p_payload->>'evidenceId')::uuid,p_actor) on conflict(organization_id,media_asset_id) do update set evidence_file_id=excluded.evidence_file_id,reviewed_by=excluded.reviewed_by,reviewed_at=now(),revoked_at=null;
    insert into public.angelcare_marketplace_media_usage(media_asset_id,object_type,object_id,slot_key,locale) values((p_payload->>'mediaId')::uuid,'jobkix_employer_approval',org.id,'asset:'||(p_payload->>'mediaId'),'en') on conflict do nothing;
   else update public.jobkix_employer_media_approvals set revoked_at=now() where organization_id=org.id and media_asset_id=(p_payload->>'mediaId')::uuid and revoked_at is null;if not found then raise exception 'NOT_FOUND';end if;end if;
   update public.jobkix_organizations set version=version+1,updated_at=now() where id=org.id returning version into ver;target:='media_reviewed';
  elsif p_action='organization.review' then
   if org.status<>'active' or nullif(p_payload->>'validUntil','') is null or (p_payload->>'validUntil')::timestamptz<=now() or (p_payload->>'validUntil')::timestamptz>now()+interval '1 year' or length(trim(coalesce(p_payload->>'reference',''))) not between 3 and 240 then raise exception 'INVALID_INPUT';end if;
   evidence:=array(select value::uuid from jsonb_array_elements_text(p_payload->'evidenceIds'));
   if coalesce(cardinality(evidence),0)=0 or cardinality(evidence)>30 then raise exception 'DOCUMENT_NOT_READY';end if;
   foreach evidence_id in array evidence loop
    if not exists(select 1 from public.jobkix_files f where f.id=evidence_id and f.organization_id=org.id and f.purpose='verification' and f.state='ready' and f.scanner_reference is not null and f.sha256 is not null) then raise exception 'DOCUMENT_NOT_READY';end if;
   end loop;
   update public.jobkix_organizations set identity_reviewed_until=(p_payload->>'validUntil')::timestamptz,identity_review_reference=p_payload->>'reference',public_profile_approved_at=now(),version=version+1,updated_at=now() where id=org.id returning version into ver;target:='identity_reviewed';
   if nullif(p_payload->>'caseId','') is not null then
    select * into c from public.jobkix_cases where id=(p_payload->>'caseId')::uuid and organization_id=org.id and kind='verification' for update;
    if not found then raise exception 'FORBIDDEN';end if;perform public.jobkix_version(c.version,(p_payload->>'caseVersion')::integer);
    if c.state in ('resolved','action','no_action') then raise exception 'INVALID_TRANSITION';end if;
    update public.jobkix_cases set state='resolved',version=version+1,assigned_admin_id=p_actor,updated_at=now() where id=c.id;
    insert into public.jobkix_case_events(case_id,admin_actor_id,visibility,detail,original_locale) values(c.id,p_actor,'reporter',note,coalesce(p_payload->>'locale','en'));
   end if;
  else
   if p_action in ('organization.suspend','organization.revoke') then update public.jobkix_employer_media_approvals set revoked_at=coalesce(revoked_at,now()) where organization_id=org.id;end if;
   target:=case p_action when 'organization.suspend' then 'suspended' when 'organization.restore' then 'active' else org.status end;
   -- Restoration never silently restores an old verification or publication approval.
   update public.jobkix_organizations set status=target,identity_reviewed_until=null,identity_review_reference=null,public_profile_approved_at=null,version=version+1,updated_at=now() where id=org.id returning version into ver;
  end if;obj:=org.id;
 elsif p_action in ('vacancy.approve','vacancy.return','vacancy.suspend') then
  select * into vac from public.jobkix_vacancies where id=(p_payload->>'id')::uuid for update;
  if not found then raise exception 'NOT_FOUND';end if;perform public.jobkix_version(vac.version,p_expected_version);
  if p_action='vacancy.approve' then
   if vac.state<>'pending_review' then raise exception 'INVALID_TRANSITION';end if;
   update public.jobkix_vacancies set reviewed_version=version,reviewed_at=now() where id=vac.id;ver:=vac.version;target:='reviewed';
  else
   target:=case when p_action='vacancy.return' then 'draft' else 'suspended' end;
   update public.jobkix_vacancies set state=target,reviewed_version=null,reviewed_at=null,version=version+1,updated_at=now() where id=vac.id returning version into ver;
  end if;obj:=vac.id;
  insert into public.jobkix_vacancy_revisions(vacancy_id,version,snapshot,edited_by)
  select id,version,to_jsonb(v),created_by from public.jobkix_vacancies v where id=vac.id on conflict(vacancy_id,version) do nothing;
 elsif p_action='case.advance' then
  select * into c from public.jobkix_cases where id=(p_payload->>'id')::uuid for update;
  if not found then raise exception 'NOT_FOUND';end if;if c.kind='verification' then raise exception 'FORBIDDEN';end if;perform public.jobkix_version(c.version,p_expected_version);target:=p_payload->>'state';
  if not (case c.state when 'reported' then target in ('triaged','under_review') when 'triaged' then target in ('under_review','needs_information')
    when 'under_review' then target in ('needs_information','action','no_action','resolved') when 'needs_information' then target in ('under_review','resolved')
    when 'appealed' then target in ('under_review','action','no_action','resolved') when 'action' then target='resolved' when 'no_action' then target='resolved' else false end) then raise exception 'INVALID_TRANSITION';end if;
  if p_payload->>'visibility' not in ('internal','reporter') then raise exception 'INVALID_INPUT';end if;
  update public.jobkix_cases set state=target,assigned_admin_id=p_actor,version=version+1,updated_at=now() where id=c.id returning version into ver;
  insert into public.jobkix_case_events(case_id,admin_actor_id,visibility,detail,original_locale) values(c.id,p_actor,p_payload->>'visibility',note,coalesce(p_payload->>'locale','en'));obj:=c.id;
 elsif p_action='reputation.review' then
  select * into reputation from public.jobkix_reputation where id=(p_payload->>'id')::uuid for update;
  if not found then raise exception 'NOT_FOUND';end if;perform public.jobkix_version(reputation.version,p_expected_version);target:=p_payload->>'state';
  if target not in ('under_review','published','rejected','withdrawn') or reputation.state='withdrawn' then raise exception 'INVALID_TRANSITION';end if;
  methodology:=public.jobkix_public_editorial('reputation-methodology',reputation.original_locale);
  if target='published' and (reputation.publication_consented_at is null or reputation.consent_methodology_hash is distinct from methodology->>'sourceHash' or reputation.evidence->>'relationship' is null or public.jobkix_public_editorial('reputation-methodology',reputation.original_locale) is null or p_payload->>'methodologyRevision' is distinct from methodology->>'sourceHash') then raise exception 'INVALID_INPUT';end if;
  if target='published' and reputation.parent_id is not null then
   select * into reputation_parent from public.jobkix_reputation where id=reputation.parent_id for update;perform public.jobkix_version(reputation_parent.version,reputation.parent_version);if reputation_parent.state='withdrawn' then raise exception 'INVALID_TRANSITION';end if;
   update public.jobkix_reputation set state='withdrawn',version=version+1 where id=reputation_parent.id;
  end if;
  update public.jobkix_reputation set state=target,methodology_revision=p_payload->>'methodologyRevision',reviewed_at=now(),version=version+1 where id=reputation.id returning version into ver;obj:=reputation.id;
 elsif p_action='taxonomy.save' then
  select * into definition from public.jobkix_taxonomy where kind=p_payload->>'kind' and key=p_payload->>'key' for update;
  if found then perform public.jobkix_version(definition.version,p_expected_version);
  elsif p_expected_version<>0 or p_payload->>'kind'='setting' then raise exception 'INVALID_INPUT';end if;
  if p_payload->>'status' not in ('draft','published','archived') or p_payload->>'kind' not in ('setting','occupation','skill','age_cohort','collection')
   or (p_payload->>'kind'='setting' and p_payload->>'status'<>'published') or jsonb_typeof(p_payload->'localizedNames')<>'object'
   or length(trim(p_payload->>'sourceName')) not between 1 and 240 then raise exception 'INVALID_INPUT';end if;
  if p_payload->>'status'='published' and (exists(select 1 from unnest(array['en','fr','es','hi','tl','id','ar']) as languages(lang) where coalesce(jsonb_typeof(p_payload->'localizedNames'->languages.lang),'null')<>'string' or length(trim(coalesce(p_payload->'localizedNames'->>languages.lang,''))) not between 1 and 240) or p_payload->'localizedNames'->>'en' is distinct from trim(p_payload->>'sourceName')) then raise exception 'INVALID_INPUT';end if;
  if p_payload->>'kind'='setting' and coalesce((p_payload->>'sortOrder')::integer,0)<>definition.sort_order then raise exception 'INVALID_INPUT';end if;
  insert into public.jobkix_taxonomy(kind,key,source_name_en,localized_names,synonyms,status,sort_order) values(p_payload->>'kind',p_payload->>'key',p_payload->>'sourceName',p_payload->'localizedNames',public.jobkix_array(p_payload->'synonyms'),p_payload->>'status',coalesce((p_payload->>'sortOrder')::integer,0))
  on conflict(kind,key) do update set source_name_en=excluded.source_name_en,localized_names=excluded.localized_names,synonyms=excluded.synonyms,status=excluded.status,sort_order=excluded.sort_order,version=jobkix_taxonomy.version+1 returning version into ver;obj:=gen_random_uuid();target:='saved';
 elsif p_action in ('editorial.create','editorial.save','editorial.translate','editorial.review','editorial.publish','editorial.unpublish','editorial.rollback') then
  if p_action='editorial.create' then
   if p_expected_version<>0 then raise exception 'VERSION_CONFLICT';end if;
   insert into public.jobkix_editorial_documents(slug,kind) values(p_payload->>'slug',p_payload->>'kind') returning * into doc;
  else
   select document_id into obj from public.jobkix_editorial_editions where id=(p_payload->>'id')::uuid;
   if not found then raise exception 'NOT_FOUND';end if;
   select * into doc from public.jobkix_editorial_documents where id=obj for update;
   select * into edition from public.jobkix_editorial_editions where id=(p_payload->>'id')::uuid for update;
   perform public.jobkix_version(edition.version,p_expected_version);
   if p_action in ('editorial.save','editorial.review','editorial.publish') and edition.version<>(select max(e.version) from public.jobkix_editorial_editions e where e.document_id=doc.id and e.locale=edition.locale) then raise exception 'VERSION_CONFLICT';end if;
  end if;
  if p_action in ('editorial.create','editorial.save','editorial.translate') then
   lang:=p_payload->>'locale';
   if lang not in ('en','fr','es','hi','tl','id','ar') or length(trim(p_payload->>'title')) not between 1 and 240 or length(coalesce(p_payload->>'summary',''))>4000
    or length(trim(p_payload->>'author')) not between 1 and 180 or length(trim(p_payload->>'provenance')) not between 1 and 1000 or jsonb_typeof(p_payload->'sections')<>'array' or jsonb_array_length(p_payload->'sections')>100 then raise exception 'INVALID_INPUT';end if;
   if p_action='editorial.save' and edition.locale<>lang then raise exception 'INVALID_INPUT';end if;
   if p_action='editorial.translate' and (lang='en' or edition.locale<>'en' or edition.status<>'published' or edition.content_hash is distinct from doc.source_hash or edition.source_revision<>doc.source_revision
    or exists(select 1 from public.jobkix_editorial_editions e where e.document_id=doc.id and e.locale=lang)) then raise exception 'INVALID_TRANSITION';end if;
   content_hash:=public.jobkix_editorial_hash(p_payload->>'title',coalesce(p_payload->>'summary',''),p_payload->'sections',p_payload->>'author',p_payload->>'provenance');
   if lang='en' then source_hash:=content_hash;source_revision:=case when doc.source_hash is null then 1 else doc.source_revision+1 end;
   else
    if doc.source_hash is null or p_payload->>'sourceHash' is distinct from doc.source_hash then raise exception 'VERSION_CONFLICT';end if;
    source_hash:=doc.source_hash;source_revision:=doc.source_revision;
   end if;
   select coalesce(max(version),0)+1 into next_version from public.jobkix_editorial_editions where document_id=doc.id and locale=lang;
   -- Every save creates an immutable revision; published content is untouched by draft authoring.
   insert into public.jobkix_editorial_editions(document_id,locale,title,summary,sections,source_revision,source_hash,content_hash,translator_provenance,author_name,version,edited_by)
   values(doc.id,lang,p_payload->>'title',coalesce(p_payload->>'summary',''),p_payload->'sections',source_revision,source_hash,content_hash,p_payload->>'provenance',p_payload->>'author',next_version,p_actor) returning * into edition;
   target:='draft';
  elsif p_action='editorial.review' then
   if edition.status<>'draft' then raise exception 'INVALID_TRANSITION';end if;
   perform public.jobkix_editorial_sections(edition.sections);
   if jsonb_array_length(edition.sections)=0 or exists(select 1 from jsonb_array_elements(edition.sections) section where jsonb_typeof(section)<>'object' or length(trim(coalesce(section->>'title','')))=0 or (length(trim(coalesce(section->>'body','')))=0 and coalesce(jsonb_array_length(section->'paragraphs'),0)=0 and coalesce(jsonb_array_length(section->'items'),0)=0)) then raise exception 'INVALID_INPUT';end if;
   if p_payload->>'contentHash' is distinct from edition.content_hash then raise exception 'VERSION_CONFLICT';end if;
   if edition.locale<>'en' and (edition.source_hash is distinct from doc.source_hash or edition.source_revision<>doc.source_revision) then raise exception 'VERSION_CONFLICT';end if;
   update public.jobkix_editorial_editions set status='reviewed',reviewed_hash=edition.content_hash,reviewed_by=p_actor,reviewed_at=now(),review_note=note where id=edition.id returning * into edition;target:='reviewed';
  elsif p_action='editorial.unpublish' then
   if edition.status<>'published' then raise exception 'INVALID_TRANSITION';end if;
   update public.jobkix_editorial_editions set status='retired',updated_at=now() where id=edition.id returning * into edition;target:='retired';
  else
   if p_action='editorial.publish' and edition.status<>'reviewed' then raise exception 'INVALID_TRANSITION';end if;
   perform public.jobkix_editorial_sections(edition.sections);
   if p_payload->>'contentHash' is distinct from edition.content_hash or edition.reviewed_hash is distinct from edition.content_hash or edition.reviewed_by is null then raise exception 'VERSION_CONFLICT';end if;
   if p_action='editorial.rollback' then
    if edition.status<>'retired' or edition.published_at is null then raise exception 'INVALID_TRANSITION';end if;
    prior_edition:=edition;
    select coalesce(max(version),0)+1 into next_version from public.jobkix_editorial_editions where document_id=doc.id and locale=edition.locale;
    insert into public.jobkix_editorial_editions(document_id,locale,title,summary,sections,source_revision,source_hash,content_hash,status,translator_provenance,author_name,version,edited_by,reviewed_hash,reviewed_by,reviewed_at,review_note)
    values(doc.id,edition.locale,edition.title,edition.summary,edition.sections,case when edition.locale='en' then doc.source_revision+1 else doc.source_revision end,edition.source_hash,edition.content_hash,'reviewed',edition.translator_provenance,edition.author_name,next_version,p_actor,edition.reviewed_hash,edition.reviewed_by,edition.reviewed_at,note) returning * into edition;
   end if;
   if edition.locale='en' then
    if p_action='editorial.publish' and edition.source_revision<>(case when doc.source_hash is null then 1 else doc.source_revision+1 end) then raise exception 'VERSION_CONFLICT';end if;
    update public.jobkix_editorial_documents set source_hash=edition.content_hash,source_revision=edition.source_revision where id=doc.id;
   elsif edition.source_hash is distinct from doc.source_hash or edition.source_revision<>doc.source_revision then raise exception 'VERSION_CONFLICT';end if;
   update public.jobkix_editorial_editions set status='retired',updated_at=now() where document_id=doc.id and locale=edition.locale and status='published';
   update public.jobkix_editorial_editions set status='published',published_by=p_actor,published_at=now(),updated_at=now() where id=edition.id returning * into edition;target:='published';
  end if;obj:=edition.id;ver:=edition.version;
  result:=jsonb_build_object('id',edition.id,'documentId',doc.id,'locale',edition.locale,'version',edition.version,'state',target,'contentHash',edition.content_hash,'sourceHash',edition.source_hash,'sourceRevision',edition.source_revision,'replayed',false);
 else raise exception 'INVALID_INPUT';end if;

 insert into public.jobkix_events(type,object_id,admin_actor_id,detail) values(p_action,obj,p_actor,jsonb_build_object('version',ver,'state',target,'note',note,'evidenceIds',to_jsonb(evidence)));
 if result is null then result:=jsonb_build_object('id',obj,'version',ver,'state',target,'replayed',false);end if;
 insert into public.jobkix_admin_receipts(admin_actor_id,idempotency_key,request_hash,result) values(p_actor,p_idempotency_key,req_hash,result);
 return result;
end $$;
revoke all on function public.jobkix_editorial_hash(text,text,jsonb,text,text),public.jobkix_admin_command(uuid,text,jsonb,integer,text) from public,anon,authenticated;
grant execute on function public.jobkix_admin_command(uuid,text,jsonb,integer,text) to service_role;

create function public.jobkix_admin_read(p_actor uuid,p_collection text,p_purpose text,p_id uuid default null,p_page integer default 1) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare result jsonb;source_table text;
begin
 if p_actor is null or length(trim(p_purpose)) not between 20 and 1000 or p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 source_table:=case p_collection when 'organizations' then 'jobkix_organizations' when 'verification' then 'jobkix_cases' when 'vacancies' then 'jobkix_vacancies'
 when 'cases' then 'jobkix_cases' when 'reputation' then 'jobkix_reputation' when 'editorial' then 'jobkix_editorial_editions' when 'audit' then 'jobkix_events' end;
 if p_collection='taxonomy' then select coalesce(jsonb_agg(to_jsonb(t) order by kind,sort_order,key),'[]') into result from (select * from public.jobkix_taxonomy order by kind,sort_order,key offset (p_page-1)*24 limit 24)t;
 elsif p_collection='verification' then
  select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('organization',jsonb_build_object('id',o.id,'publicName',o.public_name,'kind',o.kind,'country',o.country,'version',o.version,'status',o.status,'legalName',p.legal_name,'identityReviewedUntil',o.identity_reviewed_until,'mediaApprovals',(select coalesce(jsonb_agg(jsonb_build_object('id',media_asset_id,'revokedAt',revoked_at,'reviewedAt',reviewed_at)),'[]') from public.jobkix_employer_media_approvals where organization_id=o.id)))),'[]') into result
  from (select * from public.jobkix_cases where kind='verification' and (p_id is null or id=p_id) order by created_at desc,id offset (p_page-1)*24 limit 24)c
  join public.jobkix_organizations o on o.id=c.organization_id left join public.jobkix_organization_private p on p.organization_id=o.id;
 elsif p_collection='editorial' then
  select coalesce(jsonb_agg(to_jsonb(e)||jsonb_build_object('document_slug',d.slug,'document_kind',d.kind,'current_source_hash',d.source_hash,'current_source_revision',d.source_revision)),'[]') into result
  from (select * from public.jobkix_editorial_editions where p_id is null or id=p_id order by updated_at desc,id offset (p_page-1)*24 limit 24)e join public.jobkix_editorial_documents d on d.id=e.document_id;
 elsif p_collection='reputation' then
  select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('current_methodology_hash',public.jobkix_public_editorial('reputation-methodology',r.original_locale)->>'sourceHash')),'[]') into result from (select * from public.jobkix_reputation where p_id is null or id=p_id order by created_at desc,id offset (p_page-1)*24 limit 24)r;
 elsif p_collection='health' then select jsonb_build_object('outbox',(select coalesce(jsonb_object_agg(state,n),'{}') from (select state,count(*) n from public.jobkix_outbox group by state)s),
  'expiredPublishedVacancies',(select count(*) from public.jobkix_vacancies where state='published' and expires_at<=now()),'pendingCases',(select count(*) from public.jobkix_cases where state not in ('resolved','no_action'))) into result;
 elsif source_table is not null then
  -- Identifier is selected exclusively from the internal literal map; values remain bound parameters.
  execute format('select coalesce(jsonb_agg(to_jsonb(r) order by id),''[]'') from (select * from public.%I where ($1 is null or id=$1) %s order by id offset $2 limit 24) r',source_table,case when p_collection='cases' then 'and kind<>''verification''' else '' end) into result using p_id,(p_page-1)*24;
 else raise exception 'INVALID_INPUT';end if;
 insert into public.jobkix_events(type,object_id,admin_actor_id,detail) values('admin.read',coalesce(p_id,gen_random_uuid()),p_actor,jsonb_build_object('collection',p_collection,'purpose',p_purpose,'page',p_page));
 return result;
end $$;
revoke all on function public.jobkix_admin_read(uuid,text,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.jobkix_admin_read(uuid,text,text,uuid,integer) to service_role;
insert into public.jobkix_schema_versions(version) values(6);
commit;
