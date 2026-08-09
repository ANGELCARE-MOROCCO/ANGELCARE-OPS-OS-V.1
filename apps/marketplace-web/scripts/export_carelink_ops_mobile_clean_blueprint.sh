#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-$(pwd)}"
cd "$PROJECT_ROOT"

if [ ! -f "package.json" ]; then
  echo "ERROR: Run this from the project root or pass project root as argument."
  exit 1
fi

EXPORT_TS="$(date +%Y%m%d-%H%M%S)"
EXPORT_DIR="$HOME/Desktop/carelink-ops-mobile-production-clean-$EXPORT_TS"
ZIP_FILE="$HOME/Desktop/carelink-ops-mobile-production-clean-$EXPORT_TS.zip"

mkdir -p "$EXPORT_DIR"

copy_file() {
  [ -f "$1" ] && cp "$1" "$EXPORT_DIR/$1" 2>/dev/null || true
}

copy_dir() {
  [ -d "$1" ] || return 0
  mkdir -p "$EXPORT_DIR/$(dirname "$1")"
  rsync -a \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude=".git" \
    --exclude=".DS_Store" \
    --exclude="*.bak*" \
    --exclude="*.before-*" \
    --exclude="*backup*" \
    --exclude=".angelcare_backups" \
    --exclude=".patch-backups*" \
    --exclude=".rollback-*" \
    "$1" "$EXPORT_DIR/$(dirname "$1")/"
}

mkdir -p "$EXPORT_DIR"
for f in \
  package.json package-lock.json pnpm-lock.yaml yarn.lock \
  tsconfig.json next.config.js next.config.mjs tailwind.config.js tailwind.config.ts \
  middleware.ts postcss.config.js postcss.config.mjs; do
  [ -f "$f" ] && cp "$f" "$EXPORT_DIR/"
done

copy_dir app/carelink
copy_dir app/carelink-ops
mkdir -p "$EXPORT_DIR/app/api"
copy_dir app/api/carelink

copy_dir components/carelink
copy_dir components/brand

copy_dir lib/carelink
copy_dir lib/missions
copy_dir lib/supabase
copy_dir lib/auth
copy_dir lib/runtime

mkdir -p "$EXPORT_DIR/supabase/migrations"
if [ -d supabase/migrations ]; then
  find supabase/migrations -type f \( -iname "*carelink*" -o -iname "*mission*" \) \
    ! -iname "*.bak*" \
    ! -iname "*.before-*" \
    -print | while IFS= read -r f; do
      mkdir -p "$EXPORT_DIR/$(dirname "$f")"
      cp "$f" "$EXPORT_DIR/$f"
    done
fi

cat > "$EXPORT_DIR/CARELINK_BLUEPRINT_CHECKLIST.md" <<'MD'
# CareLink Ops + Mobile Production Blueprint Checklist

## Included runtime surfaces
- `/carelink`
- `/carelink/missions`
- `/carelink/missions/[id]`
- `/carelink/schedule`
- `/carelink/payments`
- `/carelink/messages`
- `/carelink/notifications`
- `/carelink/profile`
- `/carelink/readiness`
- `/carelink/history`
- `/carelink/safety`
- `/carelink/support`
- `/carelink-ops`
- `/carelink-ops/dispatch`
- `/carelink-ops/missions`
- `/carelink-ops/schedule`
- `/carelink-ops/agents`

## Included source-of-truth dependencies
- `components/carelink`
- `components/brand`
- `lib/carelink`
- `lib/missions`
- `lib/supabase`
- `lib/auth`
- `lib/runtime`
- `app/api/carelink`
- CareLink/Mission migrations

## Production cleanliness policy
- No `.next`
- No `node_modules`
- No `.env`
- No backup files
- No rollback folders
- No patch-backup folders
MD

{
  echo "CARELINK OPS + MOBILE CLEAN PRODUCTION EXPORT"
  echo "Generated: $EXPORT_TS"
  echo ""
  echo "Git branch:"
  git branch --show-current 2>/dev/null || true
  echo ""
  echo "Latest commits:"
  git log --oneline -12 2>/dev/null || true
  echo ""
  echo "Git status:"
  git status --short 2>/dev/null || true
} > "$EXPORT_DIR/EXPORT_README.txt"

cd "$HOME/Desktop"
zip -r "$ZIP_FILE" "$(basename "$EXPORT_DIR")" \
  -x "*/node_modules/*" \
  -x "*/.next/*" \
  -x "*/.git/*" \
  -x "*/.env" \
  -x "*/.env.*" \
  -x "*/tsconfig.tsbuildinfo" \
  -x "*/.DS_Store" \
  -x "*.zip" \
  -x "*.bak*" \
  -x "*.before-*" \
  -x "*backup*"

echo ""
echo "DONE:"
echo "$ZIP_FILE"
ls -lh "$ZIP_FILE"
