begin;

-- ANGELCARE Ambassador OS
-- Additive geographic foundation for the OpenStreetMap territory command surface.
-- Existing notes/metadata contracts remain authoritative and backward compatible.

alter table public.market_os_ambassador_territories
  add column if not exists center_latitude double precision,
  add column if not exists center_longitude double precision,
  add column if not exists radius_meters integer,
  add column if not exists geometry_type text,
  add column if not exists geometry_geojson jsonb,
  add column if not exists area_square_km numeric(14,4),
  add column if not exists osm_object_type text,
  add column if not exists osm_object_id text,
  add column if not exists osm_display_name text,
  add column if not exists geography_updated_at timestamptz;

create or replace function public.market_os_ambassador_safe_double(p_value text)
returns double precision
language sql
immutable
parallel safe
as $function$
  select case
    when nullif(btrim(p_value), '') is null then null
    when btrim(p_value) ~ '^-?[0-9]+([.][0-9]+)?$' then btrim(p_value)::double precision
    else null
  end
$function$;

create or replace function public.market_os_ambassador_sync_territory_geography()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  v_prefix constant text := 'AMB_TERRITORY_OS_V2:';
  v_config jsonb := '{}'::jsonb;
  v_lat double precision;
  v_lon double precision;
  v_radius_km double precision;
  v_area double precision;
begin
  if coalesce(new.notes, '') like v_prefix || '%' then
    begin
      v_config := substring(new.notes from length(v_prefix) + 1)::jsonb;
    exception
      when invalid_text_representation then
        v_config := '{}'::jsonb;
    end;
  elsif jsonb_typeof(coalesce(new.metadata, '{}'::jsonb)) = 'object' then
    v_config := coalesce(new.metadata -> 'territoryGeography', '{}'::jsonb);
  end if;

  v_lat := public.market_os_ambassador_safe_double(v_config ->> 'centerLatitude');
  v_lon := public.market_os_ambassador_safe_double(v_config ->> 'centerLongitude');
  v_radius_km := public.market_os_ambassador_safe_double(v_config ->> 'radiusKm');
  v_area := public.market_os_ambassador_safe_double(v_config ->> 'areaSquareKm');

  new.center_latitude := coalesce(new.center_latitude, v_lat);
  new.center_longitude := coalesce(new.center_longitude, v_lon);
  new.radius_meters := coalesce(
    new.radius_meters,
    case when v_radius_km is not null and v_radius_km >= 0 then round(v_radius_km * 1000)::integer end
  );
  new.geometry_type := coalesce(nullif(new.geometry_type, ''), nullif(v_config ->> 'geometryType', ''), 'none');
  new.geometry_geojson := coalesce(new.geometry_geojson, v_config -> 'geometryGeoJson');
  new.area_square_km := coalesce(new.area_square_km, v_area);
  new.osm_object_type := coalesce(nullif(new.osm_object_type, ''), nullif(v_config ->> 'osmObjectType', ''));
  new.osm_object_id := coalesce(nullif(new.osm_object_id, ''), nullif(v_config ->> 'osmObjectId', ''));
  new.osm_display_name := coalesce(nullif(new.osm_display_name, ''), nullif(v_config ->> 'osmDisplayName', ''));

  if new.center_latitude is not null
     or new.center_longitude is not null
     or new.geometry_geojson is not null
     or new.radius_meters is not null then
    new.geography_updated_at := coalesce(new.geography_updated_at, now());
  end if;

  new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
    'territoryGeographyVersion', 1,
    'territoryGeography', jsonb_strip_nulls(jsonb_build_object(
      'centerLatitude', new.center_latitude,
      'centerLongitude', new.center_longitude,
      'radiusMeters', new.radius_meters,
      'geometryType', new.geometry_type,
      'geometryGeoJson', new.geometry_geojson,
      'areaSquareKm', new.area_square_km,
      'osmObjectType', new.osm_object_type,
      'osmObjectId', new.osm_object_id,
      'osmDisplayName', new.osm_display_name,
      'updatedAt', new.geography_updated_at
    ))
  );

  return new;
end;
$function$;

drop trigger if exists market_os_ambassador_sync_territory_geography_trigger
  on public.market_os_ambassador_territories;

create trigger market_os_ambassador_sync_territory_geography_trigger
before insert or update of notes, metadata, center_latitude, center_longitude,
  radius_meters, geometry_type, geometry_geojson, area_square_km,
  osm_object_type, osm_object_id, osm_display_name
on public.market_os_ambassador_territories
for each row
execute function public.market_os_ambassador_sync_territory_geography();

update public.market_os_ambassador_territories
set notes = notes
where archived_at is null
  and coalesce(notes, '') like 'AMB_TERRITORY_OS_V2:%';

create index if not exists market_os_ambassador_territories_city_region_map_idx
  on public.market_os_ambassador_territories (tenant_id, organization_id, region, city)
  where archived_at is null;

create index if not exists market_os_ambassador_territories_center_map_idx
  on public.market_os_ambassador_territories (tenant_id, organization_id, center_latitude, center_longitude)
  where archived_at is null
    and center_latitude is not null
    and center_longitude is not null;

create index if not exists market_os_ambassador_territories_geometry_geojson_gin_idx
  on public.market_os_ambassador_territories
  using gin (geometry_geojson)
  where geometry_geojson is not null;

alter table public.market_os_ambassador_territories
  drop constraint if exists market_os_ambassador_territories_latitude_check,
  drop constraint if exists market_os_ambassador_territories_longitude_check,
  drop constraint if exists market_os_ambassador_territories_radius_check,
  drop constraint if exists market_os_ambassador_territories_geometry_type_check;

alter table public.market_os_ambassador_territories
  add constraint market_os_ambassador_territories_latitude_check
    check (center_latitude is null or center_latitude between -90 and 90) not valid,
  add constraint market_os_ambassador_territories_longitude_check
    check (center_longitude is null or center_longitude between -180 and 180) not valid,
  add constraint market_os_ambassador_territories_radius_check
    check (radius_meters is null or radius_meters between 0 and 250000) not valid,
  add constraint market_os_ambassador_territories_geometry_type_check
    check (geometry_type is null or geometry_type in ('none', 'radius', 'polygon', 'administrative')) not valid;

comment on column public.market_os_ambassador_territories.geometry_geojson is
  'GeoJSON geometry used by the AngelCare Ambassador OpenStreetMap command surface.';
comment on column public.market_os_ambassador_territories.center_latitude is
  'Territory centre latitude in WGS84; contains no personal GPS telemetry.';
comment on column public.market_os_ambassador_territories.center_longitude is
  'Territory centre longitude in WGS84; contains no personal GPS telemetry.';

commit;

select
  count(*) filter (where center_latitude is not null and center_longitude is not null) as located_territories,
  count(*) filter (where geometry_geojson is not null) as polygon_territories,
  count(*) filter (where coalesce(radius_meters, 0) > 0) as radius_territories,
  count(*) as total_territories
from public.market_os_ambassador_territories
where archived_at is null;
