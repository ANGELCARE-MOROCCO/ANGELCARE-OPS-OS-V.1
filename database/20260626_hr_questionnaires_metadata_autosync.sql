-- ANGELCARE HR QUESTIONNAIRES — PRODUCTION METADATA AUTO-SYNC
-- One canonical questionnaire record:
-- html_code is the source; title/role/department/ref/duration/pass score are auto-synced on insert/update.
-- This prevents stale Marketing/Ops/B2B headers in /assessments/interview/[slug]/print.

create extension if not exists pgcrypto;

create or replace function public.hr_iq_strip_markdown_fences(_html text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      regexp_replace(coalesce(_html, ''), '(^|\n)[[:space:]]*```[a-zA-Z0-9_-]*[[:space:]]*(\n|$)', E'\n', 'g'),
      '(^|\n)[[:space:]]*```[[:space:]]*(\n|$)', E'\n', 'g'
    )
  );
$$;

create or replace function public.hr_iq_plain_text(_html text)
returns text
language plpgsql
immutable
as $$
declare
  t text;
begin
  t := public.hr_iq_strip_markdown_fences(_html);
  t := regexp_replace(t, '<script[^>]*>.*?</script>', ' ', 'gis');
  t := regexp_replace(t, '<style[^>]*>.*?</style>', ' ', 'gis');
  t := regexp_replace(t, '<[^>]+>', ' ', 'g');
  t := replace(t, '&nbsp;', ' ');
  t := replace(t, '&amp;', '&');
  t := replace(t, '&lt;', '<');
  t := replace(t, '&gt;', '>');
  t := replace(t, '&quot;', '"');
  t := replace(t, '&#39;', '''');
  t := regexp_replace(t, '[[:space:]]+', ' ', 'g');
  return trim(t);
end;
$$;

create or replace function public.hr_iq_extract_role(_plain text, _ref text)
returns text
language plpgsql
immutable
as $$
declare
  m text[];
  r text;
begin
  -- Strong known codes used by AngelCare generated templates.
  if _ref ilike '%B2BEXEC%' then
    return 'Business Developer B2B Executive';
  elsif _ref ilike '%ARCC-B2CB2B%' then
    return 'Agent Relations Client et Commerciale B2C / B2B';
  elsif _ref ilike '%MCDO%' then
    return 'Strategic Marketing & Communication Digital Officer Polyvalent et Performant';
  elsif _ref ilike '%OPS%' or _ref ilike '%MDOAM%' then
    return 'Missions Dispatch Operations Assistant Manager';
  end if;

  m := regexp_match(_plain, 'Poste[[:space:]]*:[[:space:]]*([^\.]{6,180})');
  if m is not null then
    r := trim(m[1]);
  end if;

  if r is null or length(r) < 6 then
    m := regexp_match(_plain, '(Évaluation|Evaluation)[[:space:]]*(—|-)?[[:space:]]*([^\.]{8,180})');
    if m is not null then
      r := trim(m[3]);
    end if;
  end if;

  if r is not null then
    r := regexp_replace(r, '[[:space:]]+', ' ', 'g');
    r := regexp_replace(r, 'Questionnaire.*$', '', 'i');
    r := regexp_replace(r, 'Référence document.*$', '', 'i');
    r := trim(r);
  end if;

  if r is null or length(r) < 6 then
    return null;
  end if;

  return r;
end;
$$;

create or replace function public.hr_iq_extract_department(_plain text, _ref text, _role text)
returns text
language plpgsql
immutable
as $$
declare
  m text[];
begin
  if _ref ilike '%B2BEXEC%' or _role ilike '%Business Developer%B2B%' then
    return 'Business Development / B2B Partnerships';
  elsif _ref ilike '%ARCC-B2CB2B%' or _role ilike '%Relations Client%' then
    return 'Customer Relations / Sales / B2C-B2B';
  elsif _ref ilike '%MCDO%' or _role ilike '%Marketing%' then
    return 'Marketing / Communication';
  elsif _ref ilike '%OPS%' or _role ilike '%Dispatch%' or _role ilike '%Operations%' then
    return 'Operations / Dispatch';
  end if;

  m := regexp_match(_plain, '(Département|Departement|Department)[[:space:]]*:[[:space:]]*([^\.]{3,120})');
  if m is not null then
    return trim(m[2]);
  end if;

  return null;
end;
$$;

create or replace function public.hr_interview_questionnaires_sync_metadata()
returns trigger
language plpgsql
as $$
declare
  plain_text text;
  extracted_ref text;
  extracted_role text;
  extracted_dept text;
  extracted_duration text;
  extracted_pass text;
  m text[];
begin
  -- Always clean accidental Markdown fences before saving.
  new.html_code := public.hr_iq_strip_markdown_fences(coalesce(new.html_code, ''));

  plain_text := public.hr_iq_plain_text(new.html_code);

  m := regexp_match(plain_text, '(AC-HR-IQ-[A-Z0-9-]+-20[0-9]{2}-V[0-9]+)');
  if m is not null then
    extracted_ref := trim(m[1]);
  end if;

  extracted_role := public.hr_iq_extract_role(plain_text, extracted_ref);
  extracted_dept := public.hr_iq_extract_department(plain_text, extracted_ref, extracted_role);

  m := regexp_match(plain_text, 'Durée([[:space:]]+indicative)?[[:space:]]*:[[:space:]]*([0-9]{1,3})');
  if m is not null then
    extracted_duration := m[2];
  end if;

  m := regexp_match(plain_text, 'Score[[:space:]]+cible[[:space:]]*:[[:space:]]*([0-9]{1,3})');
  if m is not null then
    extracted_pass := m[1];
  end if;

  if extracted_ref is not null and extracted_ref <> '' then
    new.questionnaire_code := extracted_ref;
  end if;

  if extracted_role is not null and extracted_role <> '' then
    new.title := extracted_role;
    new.role_target := extracted_role;
  end if;

  if extracted_dept is not null and extracted_dept <> '' then
    new.department := extracted_dept;
  end if;

  if extracted_duration ~ '^[0-9]+$' then
    new.duration_minutes := greatest(1, least(300, extracted_duration::int));
  end if;

  if extracted_pass ~ '^[0-9]+$' then
    new.pass_score := greatest(0, least(100, extracted_pass::int));
  end if;

  if coalesce(new.language, '') = '' then
    new.language := case
      when plain_text ~* '(Évaluation|Référence|Département|Durée|Questionnaire)' then 'fr'
      else 'fr'
    end;
  end if;

  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists trg_hr_interview_questionnaires_sync_metadata
on public.hr_interview_questionnaires;

create trigger trg_hr_interview_questionnaires_sync_metadata
before insert or update of html_code, title, role_target, department, questionnaire_code, duration_minutes, pass_score, language
on public.hr_interview_questionnaires
for each row
execute function public.hr_interview_questionnaires_sync_metadata();

-- Repair existing stale records once using the new trigger.
update public.hr_interview_questionnaires
set html_code = html_code
where coalesce(html_code, '') <> '';

-- Force PostgREST/Supabase schema cache reload.
select pg_notify('pgrst', 'reload schema');
