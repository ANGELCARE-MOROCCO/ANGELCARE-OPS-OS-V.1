#!/usr/bin/env bash

APP_ROOT="$(pwd)/.."

echo "Applying Sales Orders Workspace patch..."

mkdir -p "$APP_ROOT/app/(protected)/sales/orders/new"
mkdir -p "$APP_ROOT/app/api/sales-terminal/service-catalog"

# Replace Orders page
cp -f orders_page.tsx "$APP_ROOT/app/(protected)/sales/orders/page.tsx"

# Create new workspace page
cp -f new_page.tsx "$APP_ROOT/app/(protected)/sales/orders/new/page.tsx"

# API
cp -f service_catalog.ts "$APP_ROOT/app/api/sales-terminal/service-catalog/route.ts"

echo "Patch applied. Restart app."
