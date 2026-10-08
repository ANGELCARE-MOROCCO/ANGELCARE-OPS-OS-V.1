begin;

do $$
declare
  c public.sanila_demo_configs%rowtype;
  v_school public.angelcare360_schools%rowtype;
  v_matches integer;
begin
  select *
  into c
  from public.sanila_demo_configs
  where id = '5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid;

  if not found
     or c.school_id <> '8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid
     or c.classification <> 'master_demo'
     or not c.active
     or c.billing_mode <> 'non_billable'
     or c.safety_status <> 'enforced'
  then
    raise exception
      'REFUSED: exact SANILA Master Demo identity/safety contract mismatch';
  end if;

  select *
  into v_school
  from public.angelcare360_schools
  where id = c.school_id
    and status = 'active';

  if not found then
    raise exception
      'REFUSED: active canonical Master Demo school missing';
  end if;

  if exists (
    select 1
    from public.ac360_organizations
    where org_code = 'SANILA-MASTER-DEMO'
      and id <> c.school_id
  ) then
    raise exception
      'REFUSED: SANILA-MASTER-DEMO org_code already belongs to another organization';
  end if;

  insert into public.ac360_organizations (
    id,
    org_code,
    display_name,
    legal_name,
    org_type,
    lifecycle_status,
    status,
    country,
    city,
    address,
    phone,
    email,
    website,
    timezone,
    currency,
    preferred_language,
    metadata_json
  )
  values (
    c.school_id,
    'SANILA-MASTER-DEMO',
    v_school.name,
    v_school.legal_name,
    'kindergarten_school',
    'active',
    'active',
    'Morocco',
    v_school.city,
    v_school.address,
    v_school.phone,
    v_school.email,
    v_school.website,
    coalesce(v_school.timezone, 'Africa/Casablanca'),
    coalesce(v_school.currency, 'MAD'),
    coalesce(v_school.language, 'fr'),
    jsonb_build_object(
      'demo', true,
      'sanila_master_demo', true,
      'fictional', true,
      'angelcare360_school_id', c.school_id,
      'sanila_demo_config_id', c.id,
      'billing_mode', 'non_billable',
      'safety_status', 'enforced',
      'projection_contract', 'SANILA_MASTER_DEMO_AC360_ORG_V1'
    )
  )
  on conflict (id) do update
  set
    org_code = excluded.org_code,
    display_name = excluded.display_name,
    legal_name = excluded.legal_name,
    org_type = excluded.org_type,
    lifecycle_status = excluded.lifecycle_status,
    status = excluded.status,
    country = excluded.country,
    city = excluded.city,
    address = excluded.address,
    phone = excluded.phone,
    email = excluded.email,
    website = excluded.website,
    timezone = excluded.timezone,
    currency = excluded.currency,
    preferred_language = excluded.preferred_language,
    metadata_json =
      coalesce(public.ac360_organizations.metadata_json, '{}'::jsonb)
      || excluded.metadata_json,
    updated_at = now();

  select count(*)
  into v_matches
  from public.ac360_organizations o
  where
    o.id = c.school_id
    and o.org_code = 'SANILA-MASTER-DEMO'
    and o.lifecycle_status = 'active'
    and o.status = 'active'
    and o.metadata_json->>'angelcare360_school_id' = c.school_id::text
    and o.metadata_json->>'billing_mode' = 'non_billable'
    and o.metadata_json->>'safety_status' = 'enforced';

  if v_matches <> 1 then
    raise exception
      'MASTER_DEMO_AC360_ORG_POSTCONDITION_FAILED matches=%',
      v_matches;
  end if;
end
$$;

comment on table public.ac360_organizations is
'Canonical organization authority. SANILA Master Demo organization projection is infrastructure identity and deliberately remains outside the disposable V2 fixture registry.';

commit;
