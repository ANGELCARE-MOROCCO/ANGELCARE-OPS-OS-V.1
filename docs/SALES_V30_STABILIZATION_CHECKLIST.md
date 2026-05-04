# SALES MODULE V30 — PACK 22 STABILIZATION CHECKLIST

## Purpose
This pack is not a new expansion pack. It is a stabilization layer after Packs 1–21.

## What to verify
1. App starts with `npm run dev`
2. No duplicate routes conflict
3. SQL migrations are run only in Supabase SQL Editor
4. TypeScript files are pasted only into VS Code/project files
5. Terminal is used only for shell commands
6. Sales routes load:
   - /sales
   - /sales/closing-room
   - /sales/master-command
   - /sales/orchestrator
7. Supabase tables exist for sales execution, closing, payment, automation, safety, and orchestrator.
8. No shared non-sales API route is overwritten by sales files.
9. Existing objective-owner API remains untouched unless explicitly sales-only.
10. Test one fake deal from qualification to handoff.

## Red flags
- `command not found` means code was pasted into terminal.
- `relation does not exist` means SQL was not run or table name mismatch.
- `module not found` means file path/import mismatch.
- `hydration error` usually means client/server component mismatch.
