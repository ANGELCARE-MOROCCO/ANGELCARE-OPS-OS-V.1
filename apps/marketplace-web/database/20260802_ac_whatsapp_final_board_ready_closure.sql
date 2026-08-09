begin;

alter table public.ac_whatsapp_conversations
  add column if not exists last_message_sender_display_name_snapshot text,
  add column if not exists last_message_sender_type text,
  add column if not exists last_read_at timestamptz,
  add column if not exists last_read_by_user_id uuid;

alter table public.ac_whatsapp_messages
  add column if not exists sender_display_name_snapshot text,
  add column if not exists sender_role_snapshot text,
  add column if not exists sender_type text,
  add column if not exists message_origin text not null default 'whatsapp',
  add column if not exists campaign_id uuid references public.ac_whatsapp_campaigns(id) on delete set null,
  add column if not exists campaign_name_snapshot text,
  add column if not exists automation_name_snapshot text,
  add column if not exists responsible_user_id uuid;

create table if not exists public.ac_whatsapp_followup_tasks (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  contact_id uuid references public.ac_whatsapp_contacts(id) on delete set null,
  account_id uuid references public.ac_whatsapp_accounts(id) on delete set null,
  title text not null,
  notes text,
  due_at timestamptz not null,
  priority text not null default 'normal' check (priority in ('normal','high','critical')),
  status text not null default 'open' check (status in ('open','completed','cancelled')),
  assigned_user_id uuid,
  created_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ac_whatsapp_followup_tasks_due_idx
  on public.ac_whatsapp_followup_tasks(status,due_at);

create index if not exists ac_whatsapp_followup_tasks_conversation_idx
  on public.ac_whatsapp_followup_tasks(conversation_id,created_at desc);

alter table public.ac_whatsapp_followup_tasks enable row level security;

drop trigger if exists ac_whatsapp_followup_tasks_touch on public.ac_whatsapp_followup_tasks;
create trigger ac_whatsapp_followup_tasks_touch
before update on public.ac_whatsapp_followup_tasks
for each row execute function public.ac_whatsapp_touch_updated_at();

create index if not exists ac_whatsapp_messages_sender_user_idx
  on public.ac_whatsapp_messages(sender_user_id, created_at desc);

create index if not exists ac_whatsapp_messages_campaign_idx
  on public.ac_whatsapp_messages(campaign_id, created_at desc)
  where campaign_id is not null;

insert into public.ac_whatsapp_labels(code,name,color,description)
values
  ('hot_prospect','Prospect chaud','#b91c1c','Prospect à fort potentiel nécessitant un suivi prioritaire.'),
  ('customer','Client','#047857','Relation client active.'),
  ('vip','VIP','#7c3aed','Relation à forte sensibilité ou valeur stratégique.'),
  ('complaint','Réclamation','#dc2626','Réclamation ou insatisfaction à traiter.'),
  ('quote_requested','Devis demandé','#2563eb','Demande de devis enregistrée.'),
  ('callback','À rappeler','#d97706','Rappel humain requis.'),
  ('followup','Relance nécessaire','#c2410c','Relance planifiée ou requise.'),
  ('decision_maker','Décisionnaire','#4338ca','Interlocuteur ayant un rôle de décision.'),
  ('partner_potential','Partenaire potentiel','#0f766e','Potentiel partenariat B2B.'),
  ('reputation_risk','Risque réputationnel','#be123c','Dossier nécessitant une vigilance réputationnelle.'),
  ('urgent','Urgent','#e11d48','Traitement immédiat requis.'),
  ('out_of_scope','Hors cible','#64748b','Contact ou demande hors périmètre actuel.')
on conflict (code) do update
set name=excluded.name,color=excluded.color,description=excluded.description,status='active';

update public.ac_whatsapp_contacts
set contact_type='unqualified'
where lower(coalesce(contact_type,'')) in ('','unknown','null','undefined','n/a');

update public.ac_whatsapp_messages as m
set sender_display_name_snapshot = coalesce(
      nullif(m.sender_display_name_snapshot,''),
      case when m.direction='inbound' then nullif(resolved.contact_display_name,'') end,
      case when m.direction='outbound' then nullif(resolved.account_name,'') end,
      case when m.direction='internal' then 'Note interne AngelCare' end,
      'Identité à confirmer'
    ),
    sender_type = coalesce(
      nullif(m.sender_type,''),
      case when m.direction='inbound' then 'contact'
           when m.direction='outbound' then 'whatsapp_account'
           else 'internal_user' end
    ),
    message_origin = coalesce(nullif(m.message_origin,''),'whatsapp')
from (
  select
    source_cv.id as conversation_id,
    c.display_name as contact_display_name,
    a.name as account_name
  from public.ac_whatsapp_conversations as source_cv
  left join public.ac_whatsapp_contacts as c
    on c.id = source_cv.contact_id
  left join public.ac_whatsapp_accounts as a
    on a.id = source_cv.account_id
) as resolved
where resolved.conversation_id = m.conversation_id
  and (
    m.sender_display_name_snapshot is null
    or m.sender_type is null
    or m.message_origin is null
  );

update public.ac_whatsapp_conversations as cv
set last_message_sender_display_name_snapshot = coalesce(
      nullif(cv.last_message_sender_display_name_snapshot,''),
      case
        when cv.last_message_direction='inbound'
          then nullif(resolved.contact_display_name,'')
        else nullif(resolved.account_name,'')
      end,
      'Identité à confirmer'
    ),
    last_message_sender_type = coalesce(
      nullif(cv.last_message_sender_type,''),
      case
        when cv.last_message_direction='inbound' then 'contact'
        else 'whatsapp_account'
      end
    )
from (
  select
    source_cv.id as conversation_id,
    c.display_name as contact_display_name,
    a.name as account_name
  from public.ac_whatsapp_conversations as source_cv
  left join public.ac_whatsapp_contacts as c
    on c.id = source_cv.contact_id
  left join public.ac_whatsapp_accounts as a
    on a.id = source_cv.account_id
) as resolved
where resolved.conversation_id = cv.id
  and (
    cv.last_message_sender_display_name_snapshot is null
    or cv.last_message_sender_type is null
  );

commit;
