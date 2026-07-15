#!/usr/bin/env bash
set -euo pipefail
cd "${1:-$HOME/Desktop/angelcare-opsos-app}"
rm -f "app/(protected)/admin/b2b-marketplace/quote-requests/CrmHeroWhiteTextFix.tsx" || true
rm -f "app/(protected)/admin/b2b-marketplace/quote-requests/CrmBlueHeroTextOnlyFix.tsx" || true
rm -f "app/(protected)/admin/b2b-marketplace/quote-requests/CrmExactHeroTextFix.tsx" || true
rm -f "app/(protected)/admin/b2b-marketplace/quote-requests/CrmSurgicalTextFix.tsx" || true
rm -f "app/(protected)/admin/b2b-marketplace/quote-requests/CrmFinalTextFix.tsx" || true
rm -f "app/(protected)/admin/b2b-marketplace/crm/CrmSurgicalTextFix.tsx" || true
rm -f "app/(protected)/admin/b2b-marketplace/crm/CrmFinalTextFix.tsx" || true
echo "Old runtime CRM text fix files removed."
