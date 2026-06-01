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

const failures = [];

if (!fs.existsSync(componentPath)) {
  failures.push(`Missing ${path.relative(root, componentPath)}`);
} else {
  const source = fs.readFileSync(componentPath, 'utf8');
  if (!source.includes('const optionMetrics =')) {
    failures.push('Missing safe optionMetrics fallback block.');
  }
  if (source.includes('summary.metrics.readinessScore')) {
    failures.push('Unsafe summary.metrics.readinessScore reference still exists.');
  }
  if (!source.includes('summary?.counts?.readiness')) {
    failures.push('Missing compatibility with API counts.readiness response.');
  }
}

if (failures.length) {
  console.error('Options readiness metrics fix verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Options readiness metrics fix verification passed.');
