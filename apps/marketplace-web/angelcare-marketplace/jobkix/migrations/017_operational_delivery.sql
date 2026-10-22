begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=16) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
-- One permission implementation is used for user requests and service-side delivery rechecks.
create function public.jobkix_member_can_act(p_actor uuid,p_org uuid,p_capability text,p_site uuid default null,p_vacancy uuid default null) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(select 1 from public.jobkix_memberships m join public.jobkix_accounts a on a.user_id=m.user_id and a.status='active'
 join auth.users u on u.id=m.user_id and u.email_confirmed_at is not null join public.jobkix_organizations o on o.id=m.organization_id and o.status='active'
 where m.user_id=p_actor and m.organization_id=p_org and m.active and (m.expires_at is null or m.expires_at>now())
 and (cardinality(m.site_ids)=0 or p_site=any(m.site_ids)) and (cardinality(m.vacancy_ids)=0 or p_vacancy=any(m.vacancy_ids))
 and case when p_capability in ('organization.manage','team.manage') then m.role in ('owner','admin')
 when p_capability in ('vacancy.write','vacancy.publish','talent.search') then m.role in ('owner','admin','recruiter')
 when p_capability in ('application.read','application.decide','interview.manage','offer.write','message.write','analytics.read') then m.role in ('owner','admin','recruiter','hiring_manager')
 when p_capability='evaluation.write' then m.role in ('owner','admin','recruiter','hiring_manager','interviewer') else false end)
$$;
create or replace function public.jobkix_can_act(p_org uuid,p_capability text,p_site uuid default null,p_vacancy uuid default null) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$ select public.jobkix_member_can_act(auth.uid(),p_org,p_capability,p_site,p_vacancy) $$;
create function public.jobkix_member_application_visible(p_actor uuid,p_application uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(select 1 from public.jobkix_applications a join public.jobkix_vacancies v on v.id=a.vacancy_id
 join public.jobkix_accounts account on account.user_id=p_actor and account.status='active' join auth.users u on u.id=p_actor and u.email_confirmed_at is not null
 where a.id=p_application and (a.candidate_user_id=p_actor or (a.state<>'withdrawn'
 and not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=a.candidate_user_id and b.organization_id=a.organization_id)
 and (public.jobkix_member_can_act(p_actor,a.organization_id,'application.read',v.site_id,v.id) or (public.jobkix_member_can_act(p_actor,a.organization_id,'evaluation.write',v.site_id,v.id)
 and exists(select 1 from public.jobkix_interviews i join public.jobkix_interview_panels panel on panel.interview_id=i.id where i.application_id=a.id and i.state in ('proposed','scheduled','completed') and panel.member_user_id=p_actor and panel.response<>'declined'))))))
$$;
create or replace function public.jobkix_application_visible(p_application uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$ select public.jobkix_member_application_visible(auth.uid(),p_application) $$;
create function public.jobkix_notification_context(p_row public.jobkix_outbox,p_delivery boolean default false) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare invitation public.jobkix_invitations;application public.jobkix_applications;meeting public.jobkix_interviews;offer public.jobkix_offers;saved public.jobkix_saved_searches;matches uuid[];loc text;recipient text;path text;begin
 if p_row.template_key='team.invited' then
  if not p_delivery or p_row.channel<>'email' then return null;end if;
  select * into invitation from public.jobkix_invitations where id=(p_row.data->>'invitationId')::uuid;
  if not found or invitation.revoked_at is not null or invitation.accepted_at is not null or invitation.expires_at<=now() or lower(invitation.email) is distinct from lower(p_row.recipient_email)
   or invitation.token_hash is distinct from encode(sha256(convert_to(coalesce(p_row.data->>'token',''),'UTF8')),'hex') or not public.jobkix_member_can_act(invitation.invited_by,invitation.organization_id,'team.manage') then return null;end if;
  return jsonb_build_object('recipient',invitation.email,'locale',p_row.locale,'type',p_row.template_key,'path','onboarding','invitationId',invitation.id,'token',p_row.data->>'token');
 end if;
 if p_row.recipient_user_id is null then return null;end if;
 select a.preferred_locale,u.email into loc,recipient from public.jobkix_accounts a join auth.users u on u.id=a.user_id and u.email_confirmed_at is not null
 where a.user_id=p_row.recipient_user_id and a.status='active' and (not p_delivery or a.notifications_email);
 if not found or recipient is null then return null;end if;
 if p_row.template_key='search.match' then
  select * into saved from public.jobkix_saved_searches where id=(p_row.data->>'savedSearchId')::uuid and user_id=p_row.recipient_user_id and version=(p_row.data->>'searchVersion')::integer and enabled and frequency<>'off';
  if not found then return null;end if;
  select array_agg(m.id) into matches from public.jobkix_matching_vacancies(saved.filters) m join public.jobkix_vacancies v on v.id=m.id
  join public.jobkix_search_matches seen on seen.vacancy_id=v.id and seen.published_version=v.published_version and seen.search_id=saved.id and seen.search_version=saved.version and seen.event_id=p_row.event_id
  where not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=saved.user_id and b.organization_id=v.organization_id);
  if coalesce(cardinality(matches),0)=0 then return null;end if;
  return jsonb_build_object('recipient',recipient,'locale',loc,'type',p_row.template_key,'savedSearchId',saved.id,'filters',saved.filters,'matchCount',cardinality(matches));
 end if;
 if p_row.template_key not in ('application.submitted','application.stage_changed','message.recorded','interview.proposed','interview.updated','interview.panel_responded','offer.sent','offer.accepted','offer.declined','offer.withdrawn','offer.expired','interview.reminder') or nullif(p_row.data->>'applicationId','') is null then return null;end if;
 select * into application from public.jobkix_applications where id=(p_row.data->>'applicationId')::uuid;
 if not found or not public.jobkix_member_application_visible(p_row.recipient_user_id,application.id) then return null;end if;
 if p_delivery and exists(select 1 from public.jobkix_candidate_blocks where candidate_user_id=application.candidate_user_id and organization_id=application.organization_id) then return null;end if;
 if p_row.template_key like 'offer.%' then
  select * into offer from public.jobkix_offers where id=(p_row.data->>'offerId')::uuid and application_id=application.id;
  if not found or offer.state='draft' or (p_delivery and (p_row.data->>'version')::integer is distinct from offer.version) then return null;end if;
 elsif p_row.template_key like 'interview.%' then
  select * into meeting from public.jobkix_interviews where id=(p_row.data->>'interviewId')::uuid and application_id=application.id;
  if not found or (p_delivery and (p_row.data->>'version')::integer is distinct from meeting.version) then return null;end if;
  if p_row.template_key='interview.reminder' and (meeting.state not in ('proposed','scheduled') or meeting.candidate_response not in ('pending','accepted') or meeting.starts_at<=now()
   or (meeting.candidate_user_id<>p_row.recipient_user_id and not exists(select 1 from public.jobkix_interview_panels where interview_id=meeting.id and member_user_id=p_row.recipient_user_id and response<>'declined'))) then return null;end if;
 end if;
 path:=case when application.candidate_user_id=p_row.recipient_user_id then 'career/applications/'||application.id::text else 'hiring/applications' end;
 return jsonb_build_object('recipient',recipient,'locale',loc,'type',p_row.template_key,'path',path,'applicationId',application.id,'organizationId',application.organization_id,'candidate',application.candidate_user_id=p_row.recipient_user_id);
end $$;
create function public.jobkix_notifications_page(p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();result jsonb;begin
 if p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 with eligible as (select o.*,public.jobkix_notification_context(o,false) as context from public.jobkix_outbox o where o.recipient_user_id=actor and o.channel='in_app'),
 visible as (select * from eligible where context is not null),paged as (select * from visible order by created_at desc,id offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'type',template_key,'createdAt',created_at,'readAt',read_at,'context',context-'recipient') order by created_at desc,id) from paged),'[]'),'total',(select count(*) from visible),'page',p_page,'pageSize',24) into result;return result;
end $$;
create function public.jobkix_outbox_claim() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare job public.jobkix_outbox;context jsonb;lease uuid;ignored integer:=0;begin
 -- An expired send lease is uncertain, never proof that transport did not accept the message.
 update public.jobkix_outbox set state='delivery_unknown',last_error_code='DELIVERY_LEASE_EXPIRED',lock_token=null,locked_until=null where channel='email' and state='processing' and locked_until<=now();
 loop
  select * into job from public.jobkix_outbox where channel='email' and available_at<=now() and attempts<attempt_limit
   and (state='pending' or (state='failed' and last_error_code in ('SMTP_AUTH_535','SMTP_TRANSIENT'))) order by available_at,created_at,id for update skip locked limit 1;
  if not found then return null;end if;context:=public.jobkix_notification_context(job,true);
  if context is null then update public.jobkix_outbox set state='cancelled',last_error_code='CURRENT_DELIVERY_GUARD' where id=job.id;ignored:=ignored+1;if ignored>=25 then return null;end if;continue;end if;
  lease:=gen_random_uuid();update public.jobkix_outbox set state='processing',lock_token=lease,locked_until=now()+interval '2 minutes',attempts=attempts+1 where id=job.id;
  return jsonb_build_object('id',job.id,'lease',lease,'context',context,'attempt',job.attempts+1);
 end loop;
end $$;
create function public.jobkix_outbox_recheck(p_id uuid,p_lease uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare job public.jobkix_outbox;begin select * into job from public.jobkix_outbox where id=p_id and lock_token=p_lease and state='processing' and locked_until>now();if not found then return null;end if;return public.jobkix_notification_context(job,true);end $$;
create function public.jobkix_outbox_finish(p_id uuid,p_lease uuid,p_state text,p_code text default null,p_transport_reference text default null) returns boolean
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if p_state not in ('provider_accepted','failed','delivery_unknown','cancelled') or (p_code is not null and p_code not in ('SMTP_AUTH_535','SMTP_TRANSIENT','SMTP_RECIPIENT_REJECTED','AUTH_EMAIL_CONFIGURATION','DELIVERY_ACKNOWLEDGEMENT_UNKNOWN','CURRENT_DELIVERY_GUARD','TRANSPORT_CONFIGURATION')) or length(coalesce(p_transport_reference,''))>500 then raise exception 'INVALID_INPUT';end if;
 update public.jobkix_outbox set state=p_state,last_error_code=p_code,transport_reference=p_transport_reference,lock_token=null,locked_until=null,
 available_at=case when p_state='failed' and p_code in ('SMTP_AUTH_535','SMTP_TRANSIENT') then now()+least(interval '1 hour',interval '1 minute'*power(2,least(attempts,6))) else available_at end
 where id=p_id and state='processing' and lock_token=p_lease;return found;
end $$;
revoke all on function public.jobkix_member_can_act(uuid,uuid,text,uuid,uuid),public.jobkix_member_application_visible(uuid,uuid),public.jobkix_notification_context(public.jobkix_outbox,boolean),public.jobkix_notifications_page(integer),public.jobkix_outbox_claim(),public.jobkix_outbox_recheck(uuid,uuid),public.jobkix_outbox_finish(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.jobkix_notifications_page(integer) to authenticated;
grant execute on function public.jobkix_outbox_claim(),public.jobkix_outbox_recheck(uuid,uuid),public.jobkix_outbox_finish(uuid,uuid,text,text,text) to service_role;
create function public.jobkix_invitation_preview(p_id uuid,p_token text) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();invitation public.jobkix_invitations;begin
 select * into invitation from public.jobkix_invitations where id=p_id;
 if not found or length(coalesce(p_token,''))<>64 or invitation.token_hash is distinct from encode(sha256(convert_to(p_token,'UTF8')),'hex')
 or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null and lower(email)=invitation.email) then raise exception 'FORBIDDEN';end if;
 if invitation.accepted_by=actor then
  if not exists(select 1 from public.jobkix_memberships where organization_id=invitation.organization_id and user_id=actor and active and (expires_at is null or expires_at>now())) then raise exception 'FORBIDDEN';end if;
  return jsonb_build_object('id',invitation.id,'state','accepted','organizationId',invitation.organization_id);
 end if;
 if invitation.accepted_by is not null or invitation.revoked_at is not null or invitation.expires_at<=now() or not public.jobkix_member_can_act(invitation.invited_by,invitation.organization_id,'team.manage') then raise exception 'FORBIDDEN';end if;
 return jsonb_build_object('id',invitation.id,'state','pending','organizationId',invitation.organization_id,'organizationName',(select public_name from public.jobkix_organizations where id=invitation.organization_id),'role',invitation.role,'expiresAt',invitation.expires_at,
 'sites',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label) order by label,id),'[]') from public.jobkix_sites where id=any(invitation.site_ids) and organization_id=invitation.organization_id),
 'vacancies',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title) order by title,id),'[]') from public.jobkix_vacancies where id=any(invitation.vacancy_ids) and organization_id=invitation.organization_id));
end $$;
revoke all on function public.jobkix_invitation_preview(uuid,text) from public,anon,authenticated;
grant execute on function public.jobkix_invitation_preview(uuid,text) to authenticated;
insert into public.jobkix_schema_versions(version) values(17);
commit;
