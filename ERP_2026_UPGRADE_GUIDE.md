
# AngelCare OpsOS — ERP 2026 Upgrade Guide

## What this upgrade adds

This package upgrades your app toward a premium ERP/OpsOS structure:

1. Premium ERP navigation system
- left sidebar with AngelCare brand block
- module groups
- top search
- profile button
- notifications bell
- quick-create menu
- breadcrumbs
- page action bars
- responsive shell foundation

2. Advanced sales system
- `/sales`
- pipeline board
- client type segmentation
- family / institution sales logic
- quotation and proposal direction
- WhatsApp-ready scripts
- renewal and follow-up architecture

3. Product and service management
- `/services`
- `/services/new`
- flexible catalog for services, packages, academy, B2B, events
- city pricing, duration rules, skill requirements and checklists

4. Printing and document templates
- `/print`
- pre-installed document template center
- contract, mission order, caregiver assignment, daily planning, incident report, devis, invoice-ready summary, profiles, monthly report, pointage report, certificate and proposal templates

5. Multi-location architecture
- `/locations`
- branches, cities, zones, service lines and client types

6. Executive reports
- `/reports`
- revenue projection, active contracts, completed missions, caregiver productivity, incidents, sales conversion, renewal risk and staff activity library

7. Billing foundation
- `/billing`
- contract consumption and invoice-ready preparation view

8. Academy foundation
- `/academy`
- training, certification and B2B training hub

## Installation steps

### Step 1 — backup
Make a copy of your current project folder before replacing files.

### Step 2 — copy/replace
Copy the unzipped contents into your original project folder and choose **Replace / Merge**.

### Step 3 — run SQL
Open Supabase SQL Editor and run:

`sql/erp_2026_foundation.sql`

Run it normally, without enabling RLS yet.

### Step 4 — restart
In terminal:

```bash
npm run dev
```

### Step 5 — test these pages
- `/`
- `/sales`
- `/services`
- `/services/new`
- `/print`
- `/reports`
- `/locations`
- `/billing`
- `/academy`

## Important

Your Supabase data remains safe. This package adds new tables and pages and keeps your existing modules.

The `.env.local`, `.next`, `.git`, `node_modules` and Mac hidden files were intentionally excluded from this ZIP.
