# Operator Guide — Category-Native MZ1

## Master route

`/angelcare-marketplace/admin/category-native`

## Recommended operating sequence

### 1. Architecture
Open **Experience Schema Architecture** to inspect a segment, vertical, category, subcategory and archetype. Toggle only the intended Admin, CSV, Public, Filter, Comparison and Operations roles for each field.

### 2. Purpose-built studio
Open the archetype studio. The form is generated from the selected schema and grouped by real business purpose rather than by a generic product form.

### 3. CSV Factory
Select the exact archetype and download its dedicated template. Do not reuse a template across unrelated categories.

### 4. Dry-run import
Upload the completed CSV in Import Command. Review every invalid line and warning. Nothing is changed during dry-run.

### 5. Execute
Execute only the valid rows. The system creates or updates canonical catalogue records, media references, categories, variants, territory availability and merchandising assignments.

### 6. Homepage Designer 2.0
Use the visual block library to add category-aware commercial sections. Reorder on the canvas, switch devices/locales, configure data sources and publish immediately.

## Important rules

- Use stable `item_key`, `service_key`, `programme_key` or `solution_key` identities.
- Use Media Library asset keys whenever possible.
- Use `|` to separate list values in CSV.
- Never invent stock, capacity, territory coverage or price.
- Use rollback on an import job rather than manually deleting imported records.
- An Admin action is immediate; audit records the action but does not request approval.
