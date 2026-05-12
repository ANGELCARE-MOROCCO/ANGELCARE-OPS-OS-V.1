create table if not exists public.serviceos_blueprints (
  id text primary key,
  code text unique not null,
  title text not null,
  family text not null,
  status text not null default 'draft',
  "commercialTitle" text,
  description text,
  "targetClients" jsonb not null default '[]'::jsonb,
  modules jsonb not null default '[]'::jsonb,
  rules jsonb not null default '[]'::jsonb,
  cities jsonb not null default '[]'::jsonb,
  "basePriceMad" numeric not null default 0,
  "marginTargetPct" numeric not null default 35,
  "staffRoles" jsonb not null default '[]'::jsonb,
  "requiredDocuments" jsonb not null default '[]'::jsonb,
  "workflowTemplate" text not null default 'standard',
  "defaultSlaMinutes" integer not null default 120,
  "subscriptionEligible" boolean not null default false,
  "institutionalEligible" boolean not null default false,
  "aiTags" jsonb not null default '[]'::jsonb,
  "createdForHorizon" text not null default 'now',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.serviceos_modules (id text primary key, code text unique not null, label text not null, family text not null, description text, "riskLevel" text, "defaultPriceMad" numeric default 0, "requiredCertifications" jsonb default '[]'::jsonb, "operationalChecklist" jsonb default '[]'::jsonb, "enabledByDefault" boolean default false);
create table if not exists public.serviceos_rules (id text primary key, code text unique not null, label text not null, "appliesToFamilies" jsonb default '[]'::jsonb, condition text, action text, "pricingModifierMad" numeric default 0, "pricingMultiplier" numeric default 1, "requiredModules" jsonb default '[]'::jsonb, "requiredCertifications" jsonb default '[]'::jsonb, escalation text, status text default 'active');
create table if not exists public.serviceos_city_deployments (city text primary key, country text default 'MA', "launchStage" text, "demandScore" numeric, "capacityScore" numeric, "riskScore" numeric, "targetMonthlyRevenueMad" numeric, "requiredHires" integer, "premiumDistricts" jsonb default '[]'::jsonb, "activeFamilies" jsonb default '[]'::jsonb);
create table if not exists public.serviceos_missions (id text primary key, "serviceCode" text, city text, "clientName" text, "requestedStart" timestamptz, "requestedEnd" timestamptz, status text, "assignedStaff" text, "riskScore" numeric default 0, "priceMad" numeric default 0, "marginMad" numeric default 0, "nextAction" text, created_at timestamptz default now());
create table if not exists public.serviceos_audit_events (id text primary key, "entityType" text, "entityId" text, action text, actor text, payload jsonb default '{}'::jsonb, "createdAt" timestamptz default now());
