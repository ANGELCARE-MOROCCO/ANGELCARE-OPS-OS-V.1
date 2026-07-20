# Mega ZIP 6 — Surgical Terminal Injection

Run from the actual ANGELCARE repository. The package contains a complete clean source snapshot, but injection must copy only the 67 files listed in `MEGA6_APPLIED_FILES.txt`.

```bash
cd "$HOME/Desktop/angelcare-platform" || exit 1

APP="$PWD"
PACKAGE="ANGELCARE_BROWSER_OS_B2B_MEGA_PATCH_06_AI_SALES_DIRECTOR"
ZIP="$(find "$HOME/Downloads" -maxdepth 1 -type f -name "${PACKAGE}*.zip" -print0 | xargs -0 ls -t 2>/dev/null | head -1)"

if [ -z "$ZIP" ] || [ ! -f "$ZIP" ]; then
  echo "ERROR: Mega ZIP 6 not found in Downloads."
  exit 1
fi

TMP="$(mktemp -d /tmp/angelcare-mega6.XXXXXX)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$HOME/Desktop/angelcare-platform-pre-mega6-$STAMP"
trap 'rm -rf "$TMP"' EXIT

unzip -q "$ZIP" -d "$TMP"
PATCH_ROOT="$TMP/$PACKAGE/angelcare-platform"
MANIFEST="$PATCH_ROOT/MEGA6_APPLIED_FILES.txt"
FILE_LIST="$TMP/mega6-file-list.txt"

if [ ! -d "$PATCH_ROOT" ] || [ ! -f "$MANIFEST" ]; then
  echo "ERROR: Invalid Mega ZIP 6 package structure."
  exit 1
fi

awk '/^[+~] / { print substr($0,3) }' "$MANIFEST" > "$FILE_LIST"
COUNT="$(wc -l < "$FILE_LIST" | tr -d ' ')"

if [ "$COUNT" != "67" ]; then
  echo "ERROR: Expected 67 surgical files, found $COUNT."
  exit 1
fi

mkdir -p "$BACKUP"
cp "$FILE_LIST" "$BACKUP/MEGA6_FILES_MANIFEST.txt"
: > "$BACKUP/FILES_NOT_PRESENT_BEFORE.txt"
git status --short > "$BACKUP/GIT_STATUS_BEFORE.txt" 2>/dev/null || true

while IFS= read -r RELATIVE_PATH; do
  if [ -e "$APP/$RELATIVE_PATH" ] || [ -L "$APP/$RELATIVE_PATH" ]; then
    mkdir -p "$BACKUP/$(dirname "$RELATIVE_PATH")"
    cp -pR "$APP/$RELATIVE_PATH" "$BACKUP/$RELATIVE_PATH"
  else
    printf '%s\n' "$RELATIVE_PATH" >> "$BACKUP/FILES_NOT_PRESENT_BEFORE.txt"
  fi
done < "$FILE_LIST"

printf '%s\n' "$BACKUP" > "$HOME/Desktop/MEGA6_LAST_BACKUP_PATH.txt"

rsync -avh --itemize-changes --files-from="$FILE_LIST" "$PATCH_ROOT/" "$APP/"

VERSION="$(node -p "require('./apps/revenue-browser-extension/package.json').version")"
[ "$VERSION" = "0.6.0" ] || { echo "ERROR: expected version 0.6.0, found $VERSION"; exit 1; }

test -f apps/ops-web/supabase/migrations/20260720_browser_extension_b2b_ai_sales_director.sql
test -f apps/ops-web/lib/browser-extension/b2b-management-command/service.ts
test -f apps/revenue-browser-extension/src/modules/revenue-b2b/management-mode.ts
test -f packages/browser-extension-contracts/b2b-ai-sales-director.v6.json

echo "Mega ZIP 6 source injection completed."
echo "Backup: $BACKUP"
echo "No Git stage, commit or push was performed."
echo "The SQL migration must still be applied separately."
```

## Verification after injection

```bash
cd "$HOME/Desktop/angelcare-platform"
npm run browser-extension:contracts:verify
npm run typecheck:extension
npm run browser-extension:b2b-ai-sales-director:verify
npm run browser-extension:verify
npm --prefix apps/revenue-browser-extension run build
npm --prefix apps/revenue-browser-extension run verify
```

Then apply:

`apps/ops-web/supabase/migrations/20260720_browser_extension_b2b_ai_sales_director.sql`

Do not run the rollback unless intentionally reverting Mega ZIP 6.
