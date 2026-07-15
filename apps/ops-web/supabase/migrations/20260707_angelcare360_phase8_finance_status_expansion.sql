-- Phase 8 finance hardening
-- Additive only: expands lifecycle states and enables class/section fee assignment context.

alter table public.angelcare360_student_fee_assignments
  add column if not exists class_id uuid references public.angelcare360_classes(id) on delete set null,
  add column if not exists section_id uuid references public.angelcare360_sections(id) on delete set null;

alter table public.angelcare360_invoices
  drop constraint if exists angelcare360_invoices_status_check;

alter table public.angelcare360_invoices
  add constraint angelcare360_invoices_status_check
  check (status in ('draft', 'issued', 'sent', 'partial', 'partially_paid', 'paid', 'overdue', 'void', 'cancelled', 'archived'));

alter table public.angelcare360_payments
  drop constraint if exists angelcare360_payments_status_check;

alter table public.angelcare360_payments
  add constraint angelcare360_payments_status_check
  check (status in ('pending', 'confirmed', 'failed', 'rejected', 'refunded', 'cancelled'));

alter table public.angelcare360_receipts
  drop constraint if exists angelcare360_receipts_status_check;

alter table public.angelcare360_receipts
  add constraint angelcare360_receipts_status_check
  check (status in ('draft', 'issued', 'void', 'cancelled', 'archived'));

alter table public.angelcare360_discounts
  drop constraint if exists angelcare360_discounts_status_check;

alter table public.angelcare360_discounts
  add constraint angelcare360_discounts_status_check
  check (status in ('requested', 'approved', 'rejected', 'applied', 'cancelled', 'active', 'inactive', 'archived'));

alter table public.angelcare360_payment_reminders
  drop constraint if exists angelcare360_payment_reminders_status_check;

alter table public.angelcare360_payment_reminders
  add constraint angelcare360_payment_reminders_status_check
  check (status in ('planned', 'scheduled', 'sent', 'blocked', 'failed', 'cancelled', 'archived'));
