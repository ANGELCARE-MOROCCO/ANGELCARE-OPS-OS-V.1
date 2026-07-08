-- AngelCare 360 Phase 11
-- Enterprise Library, Inventory, Asset & Resource Control Plane
-- Additive widening only: no destructive rewrite of legacy AC360 tables.

do $$
declare
  v_constraint text;
begin
  select conname
    into v_constraint
  from pg_constraint
  where conrelid = 'public.angelcare360_library_copies'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status in (%';

  if v_constraint is not null then
    execute format('alter table public.angelcare360_library_copies drop constraint %I', v_constraint);
  end if;
end $$;

alter table public.angelcare360_library_copies
  add constraint angelcare360_library_copies_status_check
  check (status in ('available', 'loaned', 'damaged', 'lost', 'archived', 'reserved'));

do $$
declare
  v_constraint text;
begin
  select conname
    into v_constraint
  from pg_constraint
  where conrelid = 'public.angelcare360_library_loans'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status in (%';

  if v_constraint is not null then
    execute format('alter table public.angelcare360_library_loans drop constraint %I', v_constraint);
  end if;
end $$;

alter table public.angelcare360_library_loans
  add constraint angelcare360_library_loans_status_check
  check (status in ('open', 'active', 'returned', 'overdue', 'lost', 'cancelled', 'archived'));

do $$
declare
  v_constraint text;
begin
  select conname
    into v_constraint
  from pg_constraint
  where conrelid = 'public.angelcare360_inventory_items'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status in (%';

  if v_constraint is not null then
    execute format('alter table public.angelcare360_inventory_items drop constraint %I', v_constraint);
  end if;
end $$;

alter table public.angelcare360_inventory_items
  add column if not exists responsible_staff_id uuid references public.angelcare360_staff(id) on delete set null;

alter table public.angelcare360_inventory_items
  add constraint angelcare360_inventory_items_status_check
  check (status in ('active', 'low_stock', 'out_of_stock', 'damaged', 'lost', 'inactive', 'archived'));

create index if not exists idx_angelcare360_inventory_items_responsible_staff on public.angelcare360_inventory_items(school_id, responsible_staff_id);

do $$
declare
  v_constraint text;
begin
  select conname
    into v_constraint
  from pg_constraint
  where conrelid = 'public.angelcare360_inventory_movements'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%movement_type in (%';

  if v_constraint is not null then
    execute format('alter table public.angelcare360_inventory_movements drop constraint %I', v_constraint);
  end if;
end $$;

alter table public.angelcare360_inventory_movements
  add constraint angelcare360_inventory_movements_type_check
  check (movement_type in ('in', 'out', 'adjust', 'transfer', 'entry', 'exit', 'adjustment', 'loss', 'damage'));

create index if not exists idx_angelcare360_library_books_school_title on public.angelcare360_library_books(school_id, title);
create index if not exists idx_angelcare360_library_copies_school_book on public.angelcare360_library_copies(school_id, book_id);
create index if not exists idx_angelcare360_library_loans_school_status_due on public.angelcare360_library_loans(school_id, status, due_at);
create index if not exists idx_angelcare360_inventory_categories_school_label on public.angelcare360_inventory_categories(school_id, label);
create index if not exists idx_angelcare360_inventory_movements_school_item on public.angelcare360_inventory_movements(school_id, item_id, movement_date);
