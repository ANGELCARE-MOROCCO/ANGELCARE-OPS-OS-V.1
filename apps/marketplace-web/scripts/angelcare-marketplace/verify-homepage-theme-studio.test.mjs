import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const studio = read('angelcare-marketplace/theme-studio/ThemeStudio.tsx');
const repo = read('angelcare-marketplace/theme-studio/repository.ts');
const api = read('angelcare-marketplace/theme-studio/api-handlers.ts');
const defaults = read('angelcare-marketplace/theme-studio/defaults.ts');
const flagship = read('angelcare-marketplace/homepage-flagship/components/HomepageFlagship.tsx');
const flagshipRepo = read('angelcare-marketplace/homepage-flagship/repository.ts');
const composerExport = read('angelcare-marketplace/commerce-studio/components/HomepageComposerStudio.tsx');
const adminPages = read('angelcare-marketplace/commerce-studio/admin-pages.tsx');
const experienceRoute = read('app/angelcare-marketplace/(protected)/admin/experience/homepage/page.tsx');
const categoryRoute = read('app/angelcare-marketplace/(protected)/admin/category-native/homepage-designer/page.tsx');
const releaseAuthority = read('angelcare-marketplace/homepage-final/components/HomepageReleaseAuthority.tsx');

function hasAll(source, needles) {
  for (const needle of needles) assert.ok(source.includes(needle), `missing: ${needle}`);
}

test('editor preview uses the exact HomepageFlagship runtime renderer', () => {
  hasAll(studio, [
    'import { HomepageFlagship }',
    '<HomepageFlagship',
    'editor={{',
    'selectedSectionKey',
    'onSelectSection',
  ]);
});

test('current live design is the immutable default Theme V1', () => {
  hasAll(defaults, [
    "id: 'angelcare-flagship-2026'",
    "name: 'AngelCare Flagship 2026'",
    "navy: '#071b35'",
    "navy2: '#0e315a'",
    "blue: '#176da1'",
    "red: '#d93246'",
    'contentWidth: 1460',
  ]);
  hasAll(flagship, ['themeAuthoringActive = Boolean(editor || experience.themeStudioPublished)']);
});

test('draft editing is separated from explicit publication', () => {
  hasAll(repo, [
    'saveThemeStudioDraft',
    'publishThemeStudioDocument',
    'latestThemeStudioDraft',
    'angelcare_marketplace_homepage_versions',
    "status: 'draft'",
    "status: 'published'",
  ]);
  hasAll(api, ["action === 'save_draft'", "action === 'publish'"]);
});

test('published storefront resolves the active published theme state', () => {
  hasAll(repo, ['publishedThemeStudioState', "eq('status', 'published')", 'theme_studio']);
  hasAll(flagshipRepo, ['publishedThemeStudioState', 'themeStudioPublished', 'theme: themeState.theme']);
});

test('rollback is real and creates a new published version', () => {
  hasAll(repo, ['restoreThemeStudioVersion', 'publishThemeStudioDocument']);
  hasAll(api, ["action === 'restore'", 'versionId']);
  hasAll(releaseAuthority, ["action:'restore'", '>Restaurer</button>']);
});

test('legacy homepage editor routes converge on one Theme Studio', () => {
  assert.ok(composerExport.includes('ThemeStudio'));
  assert.ok(!composerExport.includes('HomepageDesigner2'));
  hasAll(experienceRoute, ['HomepageComposerPage']);
  hasAll(categoryRoute, ['HomepageComposerPage']);
});

test('specialized hero and collection studios are preserved', () => {
  hasAll(adminPages, [
    "mode === 'hero'",
    'HeroCampaignStudio',
    "mode === 'collections'",
    'CollectionStudio',
    'HomepageComposerStudio',
  ]);
});

test('Theme Studio covers real homepage authoring and responsive controls', () => {
  hasAll(studio, [
    "'desktop'",
    "'tablet'",
    "'mobile'",
    "'fr'",
    "'en'",
    "'ar'",
    'undo',
    'redo',
    'duplicateSection',
    'deleteSection',
    'moveSection',
    'patchCampaign',
    'patchCategory',
    'patchSection',
    'patchTheme',
    'Vault',
    'Publier',
    '>Brouillon</button>',
  ]);
});

test('Vault selection is sufficient and no media bureaucracy is encoded in Theme Studio', () => {
  hasAll(studio, ['asset.public_url', 'asset.desktop_url']);
  const forbidden = [
    'official logo',
    'ratio requirement',
    'rights_status',
    'optimization_status',
    'must be 1200',
    'must be 512',
  ];
  for (const needle of forbidden) {
    assert.ok(!studio.toLowerCase().includes(needle.toLowerCase()), `forbidden media gate found: ${needle}`);
  }
});

test('Theme Studio API reuses native Marketplace authorization and audits publication', () => {
  hasAll(api, ['requireMarketplaceWorkspaceApiContext']);
  hasAll(repo, ['writeMarketplaceAudit']);
});
