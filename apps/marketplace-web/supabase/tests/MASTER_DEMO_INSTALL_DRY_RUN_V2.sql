\set ON_ERROR_STOP on
-- INSTALLATION DRY RUN ONLY. Executes the real V2 seed for schema/FK proof,
-- reports legacy contamination, validates, and never commits business data.
begin;
\set SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION 1
\ir ../seeds/MASTER_DEMO_SEED_V2.sql

create temporary table sanila_master_demo_v2_install_report(
 table_name text primary key,
 registered_rows bigint not null,
 canonical_rows_present bigint not null,
 missing_registered_rows bigint not null,
 noncanonical_demo_scope_rows bigint not null
) on commit drop;
create temporary table sanila_master_demo_v2_install_anomalies(
 anomaly text not null,
 table_name text not null,
 row_id uuid,
 fixture_key text
) on commit drop;

do $$
declare t text;has_school boolean;has_org boolean;scope_sql text;registered_count bigint;present_count bigint;missing_count bigint;noncanonical_count bigint;
begin
 for t in select key from jsonb_each(public.sanila_master_demo_v2_expected_fixture_counts()) order by key loop
  select exists(select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='school_id'),
         exists(select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='org_id')
  into has_school,has_org;
  if has_school then
   scope_sql:=format('x.school_id=%L::uuid','8bc47614-f16c-41c0-8d37-22fe78b08cad');
  elsif has_org then
   scope_sql:=format('x.org_id in(select o.id from public.ac360_organizations o where o.id=%L::uuid or o.metadata_json->>''angelcare360_school_id''=%L)','8bc47614-f16c-41c0-8d37-22fe78b08cad','8bc47614-f16c-41c0-8d37-22fe78b08cad');
  else
   raise exception 'DRY_RUN_SCOPE_COLUMN_MISSING: %',t;
  end if;
  select count(*) into registered_count from public.sanila_demo_fixture_registry r
   where r.config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and r.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2' and r.table_name=t;
  execute format('select count(*) from public.%I x join public.sanila_demo_fixture_registry r on r.fixture_id=x.id and r.table_name=%L and r.config_id=%L::uuid and r.seed_version=''SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'' where %s',t,t,'5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a',scope_sql) into present_count;
  missing_count:=registered_count-present_count;
  execute format('select count(*) from public.%I x where %s and not exists(select 1 from public.sanila_demo_fixture_registry r where r.config_id=%L::uuid and r.seed_version=''SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'' and r.table_name=%L and r.fixture_id=x.id)',t,scope_sql,'5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a',t) into noncanonical_count;
  insert into sanila_master_demo_v2_install_report values(t,registered_count,present_count,missing_count,noncanonical_count);
  execute format('insert into sanila_master_demo_v2_install_anomalies(anomaly,table_name,row_id,fixture_key) select ''MISSING_REGISTERED_ROW'',%L,r.fixture_id,r.fixture_key from public.sanila_demo_fixture_registry r left join public.%I x on x.id=r.fixture_id where r.config_id=%L::uuid and r.seed_version=''SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'' and r.table_name=%L and x.id is null',t,t,'5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a',t);
  execute format('insert into sanila_master_demo_v2_install_anomalies(anomaly,table_name,row_id,fixture_key) select ''LEGACY_NONCANONICAL_OR_UNEXPECTED_DEMO_OWNED_ROW'',%L,x.id,null from public.%I x where %s and not exists(select 1 from public.sanila_demo_fixture_registry r where r.config_id=%L::uuid and r.seed_version=''SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'' and r.table_name=%L and r.fixture_id=x.id)',t,t,scope_sql,'5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a',t);
 end loop;
end $$;

select * from sanila_master_demo_v2_install_report order by table_name;
select * from sanila_master_demo_v2_install_anomalies order by anomaly,table_name,row_id;

-- Embedded validation remains read-only even though the enclosing dry-run
-- transaction has executed the real seed. Any hard failure exits psql and the
-- open transaction is rolled back by disconnect; success reaches explicit ROLLBACK.
\ir MASTER_DEMO_VALIDATION_V2.sql
\unset SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION
rollback;
