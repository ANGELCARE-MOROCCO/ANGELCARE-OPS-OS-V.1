-- AngelCare HR Interview Questionnaires — cleanup pasted Markdown fences
-- Run in Supabase SQL editor after installing the patch.

update public.hr_interview_questionnaires
set html_code = trim(
  regexp_replace(
    regexp_replace(
      regexp_replace(coalesce(html_code, ''), E'(^|\\n)[[:space:]]*```[A-Za-z0-9_-]*[[:space:]]*(\\n|$)', E'\\n', 'g'),
      E'(^|\\n)[[:space:]]*:::[[:space:]]*(\\n|$)', E'\\n', 'g'
    ),
    E'(^|\\n)[[:space:]]*:::writing[^\\n]*(\\n|$)', E'\\n', 'g'
  )
)
where coalesce(html_code, '') ~ E'(^|\\n)[[:space:]]*```'
   or coalesce(html_code, '') ~ E'(^|\\n)[[:space:]]*:::writing';

select pg_notify('pgrst', 'reload schema');
