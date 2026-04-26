# AngelCare OpsOS — User Account Module Integration Guide

This ZIP is your cleaned app + user account module integrated into the existing structure.

## What was added

- Username + PIN login system
- CEO default account
- Role hierarchy: CEO, Ops Admin, Ops Manager, CRM Staff, Coordinator, Caregiver
- Advanced permissions tables
- CEO user management pages
- Profile center
- Caregiver field portal `/my-space`
- Forbidden access page
- Logout page
- Route guards added to main modules:
  - dashboard
  - missions
  - contracts
  - families
  - caregivers
  - leads
  - incidents
  - pointage
  - users

## Files/folders added or changed

- `sql/user_account_module_full.sql`
- `lib/auth/permissions.ts`
- `lib/auth/session.ts`
- `app/login/page.tsx`
- `app/logout/page.tsx`
- `app/logout/actions.ts`
- `app/users/page.tsx`
- `app/users/new/page.tsx`
- `app/users/[id]/page.tsx`
- `app/users/edit/[id]/page.tsx`
- `app/profile/page.tsx`
- `app/my-space/page.tsx`
- `app/forbidden/page.tsx`
- main module pages were patched with permission guards

## Step 1 — Backup your current project

Before replacing anything, duplicate your current project folder.

## Step 2 — Replace your app folder with the ZIP content

Unzip this package.

Then copy the extracted project content into your current project folder.

Do not overwrite your own `.env.local`.
This ZIP intentionally does not include `.env.local`.

## Step 3 — Run the SQL in Supabase

Open Supabase → SQL Editor → New Query.

Paste and run:

```text
sql/user_account_module_full.sql
```

This creates all user/account/permissions tables.

## Step 4 — Start the app

In VS Code terminal:

```bash
npm run dev
```

## Step 5 — Login

Open:

```text
http://localhost:3000/login
```

Default CEO account after SQL:

```text
username: ceo
PIN: 0000
```

Change this PIN as soon as possible by editing the CEO account and entering a new temporary PIN.

## Step 6 — Create staff accounts

Go to:

```text
/users
```

Then:

```text
/users/new
```

Create accounts for:

- CEO / Direction
- Ops Admin
- Ops Manager
- CRM Staff
- Coordinator
- Caregiver

Caregiver accounts can be linked to a caregiver profile.

## Step 7 — Test permissions

Test the following:

- CEO can open `/users`
- Ops Admin can open operations pages but not necessarily user management if you deny permissions
- Caregiver can open `/my-space`
- Unauthorized users are sent to `/forbidden`

## Important note

This is now a strong account and permission foundation.
The next phase should be:

- protect all server actions, not only pages
- hide buttons depending on permission
- add a PIN change page
- add CEO reset PIN button
- add audit log viewer page
- add caregiver check-in/check-out directly inside `/my-space`

