# Overhead Panel Global Permission Fix

Applied fixes:

1. `app/(protected)/layout.tsx`
   - Mounted `OverheadPanel` globally for every protected page.
   - This makes the overhead panel appear outside individual page templates.

2. `app/components/erp/AppShell.tsx`
   - Removed local `OverheadPanel` import/render.
   - Prevents duplicate overhead panels on pages already using `AppShell`.

3. `app/components/erp/OverheadPanel.tsx`
   - Removed unsafe initial full-route preload.
   - Removed fallback to all static routes when `/api/app-routes/allowed` fails or returns empty.
   - Now starts with zero routes and only displays routes returned by the permission-filtered API.
   - If the API fails, route list remains locked/empty instead of exposing every page.

Result:

- The overhead panel is now global for protected app pages.
- The Pages dropdown is permission-synced only through `/api/app-routes/allowed`.
- A user with no permissions will not see all static app routes anymore.
- CEO access remains handled by the API, not by the client fallback.
