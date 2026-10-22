begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=14) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
alter table public.jobkix_cases add column original_locale text not null default 'en' check(original_locale in ('en','fr','es','hi','tl','id','ar'));
alter table public.jobkix_case_events add column original_locale text not null default 'en' check(original_locale in ('en','fr','es','hi','tl','id','ar'));
create function public.jobkix_case_receipt(p_action text,p_key text) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_case_actor();receipt public.jobkix_command_receipts;begin
 if p_action not in ('case.create','case.reply','case.appeal','privacy.request','verification.submit') or length(coalesce(p_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 select * into receipt from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_key and action=p_action;
 if not found then return null;end if;
 if not exists(select 1 from public.jobkix_cases where id=(receipt.result->>'id')::uuid and reporter_user_id=actor) then raise exception 'FORBIDDEN';end if;
 return receipt.result||jsonb_build_object('recordedAt',receipt.created_at);
end $$;
revoke all on function public.jobkix_case_receipt(text,text) from public,anon,authenticated;
grant execute on function public.jobkix_case_receipt(text,text) to authenticated;
create or replace function public.jobkix_public_employers(p_country text default null,p_query text default '',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if p_page is null or p_page<1 or p_page>10000 or length(coalesce(p_query,''))>300 or (p_country is not null and p_country!~'^[A-Z]{2}$') then raise exception 'INVALID_INPUT';end if;
 with eligible as (select * from public.jobkix_organizations where status='active' and public_profile_approved_at is not null and (p_country is null or country=p_country) and position(lower(coalesce(p_query,'')) in lower(public_name))>0),
 paged as (select * from eligible order by public_name,id offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.public_name,'kind',o.kind,'country',o.country,'city',o.city,'description',o.public_description,
 'identityReview',case when o.identity_reviewed_until>now() then jsonb_build_object('scope','organization_identity','validUntil',o.identity_reviewed_until) else null end,
 'liveVacancies',(select count(*) from public.jobkix_vacancies v where v.organization_id=o.id and public.jobkix_job_eligible(v.id))) order by o.public_name,o.id) from paged o),'[]'),'total',(select count(*) from eligible),'page',p_page,'pageSize',24) into result;return result;
end $$;
create function public.jobkix_blocked_organizations() returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();begin
 return (select coalesce(jsonb_agg(jsonb_build_object('id',b.organization_id,'name',case when o.status='active' and o.public_profile_approved_at is not null then o.public_name else null end,'blockedAt',b.created_at) order by b.created_at desc,b.organization_id),'[]') from public.jobkix_candidate_blocks b join public.jobkix_organizations o on o.id=b.organization_id where b.candidate_user_id=actor);
end $$;
create function public.jobkix_self_export() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();result jsonb;begin
 select jsonb_build_object('format','JOBKIX_PRIVATE_CAREER_EXPORT_V1','generatedAt',now(),'account',(select jsonb_build_object('displayName',display_name,'locale',preferred_locale,'timezone',timezone,'emailNotifications',notifications_email,'createdAt',created_at) from public.jobkix_accounts where user_id=actor),
 'profile',(select to_jsonb(c) from public.jobkix_candidates c where user_id=actor),
 'files',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'filename',filename,'mime',mime,'purpose',purpose,'revision',revision,'state',state,'createdAt',created_at)),'[]') from public.jobkix_files where owner_user_id=actor),
 'applications',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.jobkix_applications a where candidate_user_id=actor),
 'messages',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'applicationId',a.id,'fromMe',m.sender_user_id=actor,'body',m.body,'originalLocale',m.original_locale,'attachmentId',m.attachment_id,'createdAt',m.created_at) order by m.created_at,m.id),'[]') from public.jobkix_messages m join public.jobkix_threads thread on thread.id=m.thread_id join public.jobkix_applications a on a.id=thread.application_id where a.candidate_user_id=actor),
 'interviews',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'applicationId',i.application_id,'startsAt',i.starts_at,'endsAt',i.ends_at,'timezone',i.timezone,'format',i.format,'location',i.location,'state',i.state,'candidateResponse',i.candidate_response,'version',i.version)),'[]') from public.jobkix_interviews i where i.candidate_user_id=actor),
 'offers',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'applicationId',o.application_id,'title',o.title,'terms',o.terms,'compensation',o.compensation,'startsAt',o.starts_at,'responseDeadline',o.response_deadline,'sentAt',o.sent_at,'respondedAt',o.responded_at,'version',o.version,'state',o.state)),'[]') from public.jobkix_offers o where candidate_user_id=actor and sent_at is not null and state<>'draft'),
 'savedJobs',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.jobkix_saved_jobs s where user_id=actor),
 'savedResources',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.jobkix_saved_resources s where user_id=actor),
 'savedSearches',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.jobkix_saved_searches s where user_id=actor),
 'blockedOrganizations',(select coalesce(jsonb_agg(jsonb_build_object('id',organization_id,'blockedAt',created_at)),'[]') from public.jobkix_candidate_blocks where candidate_user_id=actor),
 'consents',(select coalesce(jsonb_agg(to_jsonb(c)),'[]') from public.jobkix_account_consents c where user_id=actor),
 'reputationContributions',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'organizationId',r.organization_id,'kind',r.kind,'body',r.body,'originalLocale',r.original_locale,'state',r.state,'amount',r.amount,'currency',r.currency,'unit',r.unit,'createdAt',r.created_at)),'[]') from public.jobkix_reputation r where contributor_user_id=actor),
 'cases',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'reference',c.public_reference,'kind',c.kind,'category',c.category,'description',c.description,'originalLocale',c.original_locale,'state',c.state,'createdAt',c.created_at)),'[]') from public.jobkix_cases c where reporter_user_id=actor),
 'caseMessages',(select coalesce(jsonb_agg(jsonb_build_object('caseId',e.case_id,'detail',e.detail,'originalLocale',e.original_locale,'createdAt',e.created_at) order by e.created_at,e.id),'[]') from public.jobkix_case_events e join public.jobkix_cases c on c.id=e.case_id where c.reporter_user_id=actor and e.visibility='reporter')) into result;
 perform public.jobkix_emit('privacy.exported',actor,actor,'{}',jsonb_build_object('format','JOBKIX_PRIVATE_CAREER_EXPORT_V1'));return result;
end $$;
revoke all on function public.jobkix_blocked_organizations(),public.jobkix_self_export() from public,anon,authenticated;
grant execute on function public.jobkix_blocked_organizations(),public.jobkix_self_export() to authenticated;
insert into public.jobkix_schema_versions(version) values(15);
commit;
