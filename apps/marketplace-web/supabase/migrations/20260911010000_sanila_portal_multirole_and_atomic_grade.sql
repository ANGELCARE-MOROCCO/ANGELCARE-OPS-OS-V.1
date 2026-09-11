begin;

-- Existing human identity + additional school persona, validated application-side with bcrypt.
create or replace function public.angelcare360_accept_existing_portal_invitation_v1(
  p_token_digest text,
  p_app_user_id uuid
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  inv public.angelcare360_portal_invitations%rowtype;
  u public.app_users%rowtype;
  v_role_id uuid;
  v_table text;
begin
  select * into inv from public.angelcare360_portal_invitations where token_digest=p_token_digest for update;
  if inv.id is null then raise exception 'INVITATION_NOT_FOUND'; end if;
  if inv.state not in ('prepared','smtp_accepted','opened') then raise exception 'INVITATION_NOT_ACCEPTABLE'; end if;
  if inv.expires_at<=now() then
    update public.angelcare360_portal_invitations set state='expired',updated_at=now() where id=inv.id;
    raise exception 'INVITATION_EXPIRED';
  end if;
  select * into u from public.app_users where id=p_app_user_id for update;
  if u.id is null or u.status<>'active' then raise exception 'IDENTITY_NOT_ACTIVE'; end if;
  if lower(coalesce(u.email,''))<>lower(inv.email) and lower(coalesce(u.username,''))<>lower(inv.email) then
    raise exception 'IDENTITY_EMAIL_MISMATCH';
  end if;

  if inv.role_id is not null then v_role_id:=inv.role_id;
  else
    select id into v_role_id from public.angelcare360_roles
    where school_id=inv.school_id and status='active'
      and lower(role_key)=lower(case when inv.portal_kind='school_user' then 'staff' else inv.portal_kind end)
    order by created_at limit 1;
  end if;
  if v_role_id is not null then
    insert into public.angelcare360_user_roles(school_id,app_user_id,role_id,starts_at,status,created_by,updated_by,metadata_json)
    values(inv.school_id,u.id,v_role_id,inv.starts_at,'active',inv.invited_by,inv.invited_by,jsonb_build_object('source','portal_invitation','invitation_id',inv.id,'identity_reused',true))
    on conflict(school_id,app_user_id,role_id) do update set status='active',ends_at=null,updated_at=now();
  end if;

  if inv.person_id is not null and inv.portal_kind<>'school_user' then
    v_table:=case inv.portal_kind when 'parent' then 'angelcare360_parents' when 'student' then 'angelcare360_students' else 'angelcare360_staff' end;
    execute format('update public.%I set portal_app_user_id=$1,updated_at=now() where id=$2 and school_id=$3 and status=''active'' and (portal_app_user_id is null or portal_app_user_id=$1)',v_table)
      using u.id,inv.person_id,inv.school_id;
    if not found then raise exception 'PORTAL_PROFILE_NOT_FOUND_OR_ALREADY_LINKED'; end if;
  end if;

  update public.angelcare360_portal_invitations
    set state='accepted',app_user_id=u.id,accepted_at=now(),updated_at=now()
    where id=inv.id;
  insert into public.angelcare360_enterprise_audit_ledger(school_id,actor_app_user_id,action_key,resource_type,resource_id,after_json,reason,metadata_json)
  values(inv.school_id,u.id,'portal.invitation.accept_existing_identity','app_user',u.id,
    jsonb_build_object('portal_kind',inv.portal_kind,'person_id',inv.person_id),'Activation multi-rôle par invitation',
    jsonb_build_object('invitation_id',inv.id,'identity_reused',true));
  return jsonb_build_object('app_user_id',u.id,'school_id',inv.school_id,'portal_kind',inv.portal_kind,'identity_reused',true);
end;$$;
revoke all on function public.angelcare360_accept_existing_portal_invitation_v1(text,uuid) from public,anon,authenticated;
grant execute on function public.angelcare360_accept_existing_portal_invitation_v1(text,uuid) to service_role;

-- Atomic grading: submission + mark become one transaction.
create or replace function public.angelcare360_grade_submission_atomic_v1(
  p_school_id uuid,
  p_submission_id uuid,
  p_teacher_staff_id uuid,
  p_score numeric,
  p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  sub public.angelcare360_assignment_submissions%rowtype;
  a public.angelcare360_assignments%rowtype;
  v_mark_id uuid;
  v_now timestamptz:=now();
begin
  select * into sub from public.angelcare360_assignment_submissions where school_id=p_school_id and id=p_submission_id for update;
  if sub.id is null then raise exception 'SUBMISSION_NOT_FOUND'; end if;
  select * into a from public.angelcare360_assignments where school_id=p_school_id and id=sub.assignment_id and created_by_staff_id=p_teacher_staff_id for update;
  if a.id is null then raise exception 'ASSIGNMENT_OUT_OF_SCOPE'; end if;
  if p_score<0 or p_score>coalesce(a.max_score,20) then raise exception 'INVALID_SCORE'; end if;

  update public.angelcare360_assignment_submissions
    set score=p_score,status='graded',updated_at=v_now,
        metadata_json=coalesce(metadata_json,'{}'::jsonb)||jsonb_build_object('graded_from','teacher_portal','correlation_id',p_correlation_id)
    where id=sub.id;

  select id into v_mark_id from public.angelcare360_marks
    where school_id=p_school_id and assignment_id=a.id and student_id=sub.student_id
    order by created_at limit 1 for update;
  if v_mark_id is null then
    insert into public.angelcare360_marks(school_id,student_id,subject_id,assignment_id,assessment_type,score,max_score,mark_state,recorded_at,status,metadata_json)
    values(p_school_id,sub.student_id,a.subject_id,a.id,'assignment',p_score,coalesce(a.max_score,20),'published',v_now,'active',jsonb_build_object('source','teacher_portal','correlation_id',p_correlation_id))
    returning id into v_mark_id;
  else
    update public.angelcare360_marks
      set score=p_score,max_score=coalesce(a.max_score,20),mark_state='published',recorded_at=v_now,status='active',
          metadata_json=coalesce(metadata_json,'{}'::jsonb)||jsonb_build_object('source','teacher_portal','correlation_id',p_correlation_id)
      where id=v_mark_id;
  end if;
  return jsonb_build_object('submissionId',sub.id,'markId',v_mark_id,'score',p_score,'status','graded');
end;$$;
revoke all on function public.angelcare360_grade_submission_atomic_v1(uuid,uuid,uuid,numeric,uuid) from public,anon,authenticated;
grant execute on function public.angelcare360_grade_submission_atomic_v1(uuid,uuid,uuid,numeric,uuid) to service_role;


-- Atomic tenant ownership transfer: owner flag, identity role, school role permissions and session revocation move together.
create or replace function public.angelcare360_transfer_tenant_ownership_v1(
  p_tenant_id uuid,
  p_from_access_account_id uuid,
  p_to_access_account_id uuid,
  p_actor_user_id uuid,
  p_reason text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  target public.angelcare360_operator_tenant_access_accounts%rowtype;
  v_transfer_id uuid;
  v_role_id uuid;
begin
  if p_reason is null or btrim(p_reason)='' then raise exception 'OWNERSHIP_REASON_REQUIRED'; end if;
  select * into target from public.angelcare360_operator_tenant_access_accounts
    where id=p_to_access_account_id and tenant_id=p_tenant_id for update;
  if target.id is null or target.status<>'active' then raise exception 'TARGET_OWNER_NOT_ACTIVE'; end if;

  insert into public.angelcare360_operator_tenant_owner_transfers(
    tenant_id,from_access_account_id,to_access_account_id,status,effective_at,reason,requested_by,approved_by,completed_at
  ) values(p_tenant_id,p_from_access_account_id,p_to_access_account_id,'completed',now(),p_reason,p_actor_user_id,p_actor_user_id,now())
  returning id into v_transfer_id;

  update public.angelcare360_operator_tenant_access_accounts
    set is_primary_owner=false,updated_by=p_actor_user_id,updated_at=now()
    where tenant_id=p_tenant_id and is_primary_owner=true;
  update public.angelcare360_operator_tenant_access_accounts
    set is_primary_owner=true,role_template='tenant_owner',module_keys='{}'::text[],explicit_permissions='{}'::text[],updated_by=p_actor_user_id,updated_at=now()
    where id=target.id;

  if target.app_user_id is not null then
    update public.app_users
      set role='direction_generale',
          permissions=(select coalesce(array_agg('deny:'||d),'{}'::text[]) from unnest(coalesce(target.denied_permissions,'{}'::text[])) d),
          updated_at=now()
      where id=target.app_user_id;
    delete from public.app_sessions where user_id=target.app_user_id;
  end if;

  if target.school_user_role_id is not null then
    select role_id into v_role_id from public.angelcare360_user_roles where id=target.school_user_role_id for update;
    if v_role_id is not null then
      delete from public.angelcare360_role_permissions
        where role_id=v_role_id and coalesce(metadata_json->>'source','')='tenant-access';
      insert into public.angelcare360_role_permissions(role_id,permission_key,effect,metadata_json)
      select v_role_id,p.permission_key,
             case when exists(select 1 from unnest(coalesce(target.denied_permissions,'{}'::text[])) d
                         where p.permission_key=d or (right(d,2)='.*' and p.permission_key like left(d,length(d)-1)||'%')) then 'deny' else 'allow' end,
             jsonb_build_object('source','tenant-access','access_account_id',target.id,'role_template','tenant_owner')
      from public.angelcare360_permissions p where p.status='active'
      on conflict(role_id,permission_key) do update set effect=excluded.effect,metadata_json=excluded.metadata_json;
      update public.angelcare360_roles set metadata_json=coalesce(metadata_json,'{}'::jsonb)||jsonb_build_object('role_template','tenant_owner'),updated_at=now() where id=v_role_id;
    end if;
  end if;

  return jsonb_build_object('transfer_id',v_transfer_id,'tenant_id',p_tenant_id,'to_access_account_id',target.id,'sessions_revoked',target.app_user_id is not null);
end;$$;
revoke all on function public.angelcare360_transfer_tenant_ownership_v1(uuid,uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.angelcare360_transfer_tenant_ownership_v1(uuid,uuid,uuid,uuid,text) to service_role;

commit;
