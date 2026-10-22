-- Authoring only. Extend existing packaged editorial media validation; never publish content.
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=27) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create or replace function public.jobkix_editorial_sections(p_sections jsonb) returns void
language plpgsql set search_path=pg_catalog,public as $$
declare section jsonb;media jsonb;point jsonb;section_id text;ids text[]:='{}';source_id uuid;begin
 if p_sections is null or jsonb_typeof(p_sections)<>'array' or jsonb_array_length(p_sections)>100 then raise exception 'INVALID_INPUT';end if;
 for section in select value from jsonb_array_elements(p_sections) loop
  section_id:=section->>'id';
  if jsonb_typeof(section)<>'object' or coalesce(section_id,'')!~'^[a-z0-9][a-z0-9-]{0,99}$' or section_id=any(ids) or length(trim(coalesce(section->>'title',''))) not between 1 and 240 or length(coalesce(section->>'body',''))>40000 then raise exception 'INVALID_INPUT';end if;
  ids:=array_append(ids,section_id);
  if section?'paragraphs' and (jsonb_typeof(section->'paragraphs')<>'array' or jsonb_array_length(section->'paragraphs')>100) or section?'items' and (jsonb_typeof(section->'items')<>'array' or jsonb_array_length(section->'items')>100) then raise exception 'INVALID_INPUT';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(section->'paragraphs','[]')) entry where jsonb_typeof(entry)<>'string' or length(entry#>>'{}')>10000)
   or exists(select 1 from jsonb_array_elements(coalesce(section->'items','[]')) entry where jsonb_typeof(entry)<>'string' or length(entry#>>'{}')>2000) then raise exception 'INVALID_INPUT';end if;
  media:=section->'media';if media is null or media='null'::jsonb then continue;end if;
  if jsonb_typeof(media)<>'object' or coalesce(media->>'source','') not in ('editorial','native') or length(trim(coalesce(media->>'alt',''))) not between 1 and 500
   or exists(select 1 from jsonb_object_keys(media) key where key not in ('source','id','alt','desktopFocal','mobileFocal')) then raise exception 'INVALID_INPUT';end if;
  foreach section_id in array array['desktopFocal','mobileFocal'] loop
   point:=media->section_id;if jsonb_typeof(point)<>'object' or coalesce(jsonb_typeof(point->'x'),'null')<>'number' or coalesce(jsonb_typeof(point->'y'),'null')<>'number' or (point->>'x')::numeric not between 0 and 100 or (point->>'y')::numeric not between 0 and 100 then raise exception 'INVALID_INPUT';end if;
  end loop;
  if media->>'source'='native' then
   source_id:=(media->>'id')::uuid;
   if not exists(select 1 from public.angelcare_marketplace_media_assets a where a.id=source_id and a.status='active' and a.mime_type in ('image/jpeg','image/png','image/webp','image/avif') and a.rights_status in ('owned','licensed','public_domain') and (a.rights_expires_at is null or a.rights_expires_at>now()) and length(a.public_url)>0) then raise exception 'DOCUMENT_NOT_READY';end if;
  elsif coalesce(media->>'id','') not in ('home-hero','search-hero','profession-cook','destination-toronto','destination-london','setting-households','setting-nurseries','setting-preschool','setting-primary-schools','setting-secondary-colleges','setting-international-schools','setting-public-education','setting-pediatrics','setting-maternity-neonatal','setting-therapy-development','setting-hospitality','setting-camps-sports','setting-ngo-child-welfare','setting-school-operations','setting-digital-learning','setting-public-specialist') then raise exception 'INVALID_INPUT';end if;
 end loop;
end $$;
revoke all on function public.jobkix_editorial_sections(jsonb) from public,anon,authenticated;
insert into public.jobkix_schema_versions(version) values(28);
commit;
