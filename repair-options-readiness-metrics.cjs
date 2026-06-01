const fs = require('fs');
const path = require('path');

const root = process.cwd();
const componentPath = path.join(
  root,
  'components',
  'saas-factory',
  'options',
  'SaasFactoryOptionsCommandCenter.tsx'
);

if (!fs.existsSync(componentPath)) {
  console.error(`❌ Missing component file: ${componentPath}`);
  process.exit(1);
}

let source = fs.readFileSync(componentPath, 'utf8');
const before = source;

if (!source.includes('const optionMetrics =')) {
  source = source.replace(
    /(\s*)const scoreTone\s*=\s*summary\.metrics\.readinessScore\s*>=\s*90\s*\?\s*'green'\s*:/,
    `$1const optionMetrics = {
$1  readinessScore:
$1    summary?.metrics?.readinessScore ??
$1    summary?.metrics?.readiness ??
$1    summary?.counts?.readiness ??
$1    0,
$1  optionGroups:
$1    summary?.metrics?.optionGroups ??
$1    summary?.counts?.optionGroups ??
$1    summary?.groups?.length ??
$1    0,
$1  liveOptions:
$1    summary?.metrics?.liveOptions ??
$1    summary?.counts?.liveOptions ??
$1    summary?.options?.filter?.((option: any) => option?.status === 'enabled')?.length ??
$1    0,
$1  featureGates:
$1    summary?.metrics?.featureGates ??
$1    summary?.counts?.featureGates ??
$1    summary?.options?.filter?.((option: any) =>
$1      /feature|gate|flag|release/i.test(String(option?.key ?? '') + ' ' + String(option?.group ?? '') + ' ' + String(option?.label ?? '')),
$1    )?.length ??
$1    0,
$1  warnings:
$1    summary?.metrics?.warnings ??
$1    summary?.counts?.warnings ??
$1    summary?.warnings?.length ??
$1    0,
$1}
$1
$1const scoreTone = optionMetrics.readinessScore >= 90 ? 'green' :`
  );
}

source = source
  .replaceAll('summary.metrics.readinessScore', 'optionMetrics.readinessScore')
  .replaceAll('summary.metrics.optionGroups', 'optionMetrics.optionGroups')
  .replaceAll('summary.metrics.liveOptions', 'optionMetrics.liveOptions')
  .replaceAll('summary.metrics.featureGates', 'optionMetrics.featureGates')
  .replaceAll('summary.metrics.warnings', 'optionMetrics.warnings');

if (source === before) {
  console.warn('⚠️ No changes were made. The file may already be patched or the code shape differs.');
} else {
  fs.writeFileSync(componentPath, source);
  console.log(`✅ Patched ${path.relative(root, componentPath)} with safe optionMetrics fallback.`);
}

const repaired = fs.readFileSync(componentPath, 'utf8');
if (repaired.includes('summary.metrics.readinessScore')) {
  console.error('❌ summary.metrics.readinessScore still exists. Patch did not fully apply.');
  process.exit(1);
}
if (!repaired.includes('const optionMetrics =')) {
  console.error('❌ optionMetrics fallback block is missing.');
  process.exit(1);
}

console.log('✅ Options readiness metrics repair passed.');
