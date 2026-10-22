begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=19) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create table public.jobkix_employer_media_approvals(
 organization_id uuid not null references public.jobkix_organizations(id),media_asset_id uuid not null references public.angelcare_marketplace_media_assets(id),
 evidence_file_id uuid not null references public.jobkix_files(id),reviewed_by uuid not null,reviewed_at timestamptz not null default now(),revoked_at timestamptz,primary key(organization_id,media_asset_id)
);
alter table public.jobkix_employer_media_approvals enable row level security;
revoke all on public.jobkix_employer_media_approvals from public,anon,authenticated;
create or replace function public.jobkix_public_employer(p_id uuid) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('id',o.id,'name',o.public_name,'description',o.public_description,'kind',o.kind,'originalLocale',o.original_locale,'country',o.country,'city',o.city,
 'approvedMediaIds',(select coalesce(jsonb_agg(a.media_asset_id),'[]') from public.jobkix_employer_media_approvals a join public.jobkix_files f on f.id=a.evidence_file_id and f.organization_id=o.id and f.purpose='verification' and f.state='ready'
 join public.angelcare_marketplace_media_assets m on m.id=a.media_asset_id and m.status='active' and m.mime_type in ('image/jpeg','image/png','image/webp','image/avif') and m.rights_status in ('owned','licensed','public_domain') and (m.rights_expires_at is null or m.rights_expires_at>now()) where a.organization_id=o.id and a.revoked_at is null),
 'identityReview',case when o.identity_reviewed_until>now() then jsonb_build_object('scope','organization_identity','validUntil',o.identity_reviewed_until) else null end,
 'liveVacancies',(select count(*) from public.jobkix_vacancies v where v.organization_id=o.id and public.jobkix_job_eligible(v.id)))
 from public.jobkix_organizations o where o.id=p_id and o.status='active' and o.public_profile_approved_at is not null
$$;
create function public.jobkix_employer_saved_search(p_org uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();begin
 return (select jsonb_build_object('id',id,'version',version,'enabled',enabled,'frequency',frequency) from public.jobkix_saved_searches where user_id=actor and filters=jsonb_build_object('organizationId',p_org::text) order by created_at desc,id limit 1);
end $$;
revoke all on function public.jobkix_employer_saved_search(uuid) from public,anon,authenticated;
grant execute on function public.jobkix_employer_saved_search(uuid) to authenticated;
insert into public.jobkix_schema_versions(version) values(20);
commit;
