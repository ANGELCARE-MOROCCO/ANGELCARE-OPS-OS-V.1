# ANGELCARE SEO Blog Workspace Excellence v1 — Patch Manifest

Extract this archive into the **ANGELCARE platform repository root**.

## Modified

- `apps/ops-web/components/market-os/seo-blog-workspace.tsx`
- `apps/ops-web/components/market-os/seo-blog/seo-subpage.tsx`
- `apps/ops-web/components/market-os/seo-blog/seo-blog-system.tsx`

## Added

- `apps/ops-web/scripts/verify-seo-blog-workspace-uiux-excellence.mjs`
- `docs/market-os/seo-blog-workspace/ANGELCARE_SEO_BLOG_WORKSPACE_UIUX_EXCELLENCE_IMPLEMENTATION_REPORT.md`
- `PATCH_MANIFEST_SEO_BLOG_WORKSPACE_EXCELLENCE.md`

## Apply

```bash
cd ~/Desktop/angelcare-platform
unzip -o ~/Downloads/ANGELCARE_SEO_BLOG_WORKSPACE_EXCELLENCE_v1_PATCH.zip -d .
cd apps/ops-web
node scripts/verify-seo-blog-workspace-uiux-excellence.mjs
```

Expected result:

```text
105 checks passed, 0 failed.
No protected route, API, storage, browser-extension or workflow contract violation detected by the static gate.
```

## Important

- Do not extract from inside `apps/ops-web`.
- The ZIP already contains paths beginning with `apps/ops-web/...`.
- No database migration is included.
- No API, route wrapper, authentication, Browser OS catalogue or external module file is replaced.
