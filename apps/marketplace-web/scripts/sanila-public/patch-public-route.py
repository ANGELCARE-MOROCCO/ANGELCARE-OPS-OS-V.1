#!/usr/bin/env python3
from pathlib import Path
import sys

repo = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
target = repo / "apps/marketplace-web/app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx"
if not target.exists():
    raise SystemExit(f"STOP — target route not found: {target}")

text = target.read_text()

imports = """import { SanilaPublicUniverse } from '@/angelcare-marketplace/sanila-public/SanilaPublicUniverse'
import { isSanilaPublicRoute } from '@/angelcare-marketplace/sanila-public/content'
import { getSanilaPublicMetadata } from '@/angelcare-marketplace/sanila-public/metadata'
"""

if "sanila-public/SanilaPublicUniverse" not in text:
    marker = "import { getPublicPage, publicRoutePath } from '@/angelcare-marketplace/public-universe/repository'\n"
    if marker not in text:
        raise SystemExit("STOP — public route import marker changed; manual reconciliation required.")
    text = text.replace(marker, marker + imports, 1)

metadata_marker = "  const alias = canonicalAlias(locale, slug)\n"
metadata_insert = "  if (locale === 'fr' && isSanilaPublicRoute(slug)) return getSanilaPublicMetadata(slug)\n"
# first occurrence is generateMetadata
if metadata_insert not in text:
    idx = text.find(metadata_marker)
    if idx < 0:
        raise SystemExit("STOP — metadata slug marker missing.")
    insert_at = idx + len(metadata_marker)
    text = text[:insert_at] + metadata_insert + text[insert_at:]

page_marker = "  const alias = canonicalAlias(locale, slug)\n  if (alias) permanentRedirect(`/angelcare-marketplace/${locale}/${alias}`)\n"
page_insert = "  if (locale === 'fr' && isSanilaPublicRoute(slug)) return <SanilaPublicUniverse slug={slug} locale={locale} />\n"
if page_insert not in text:
    if page_marker not in text:
        raise SystemExit("STOP — page slug marker changed; manual reconciliation required.")
    text = text.replace(page_marker, page_marker + page_insert, 1)

target.write_text(text)
print("SANILA_PUBLIC_ROUTE_PATCH=PASS")
print(f"TARGET={target}")
