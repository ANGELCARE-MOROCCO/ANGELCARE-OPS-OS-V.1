import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();

function resolve(...segments) {
  return path.join(root, ...segments);
}

function assertExists(relativePath) {
  const absolute = resolve(relativePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Missing required path: ${relativePath}`);
  }
}

function assertNoMatches(pattern, args) {
  try {
    const output = execFileSync(pattern, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (String(output || '').trim()) {
      throw new Error(output.trim());
    }
  } catch (error) {
    if (error?.status === 1 && String(error.stdout || '').trim() === '') {
      return;
    }
    if (error?.stdout && String(error.stdout).trim() === '') {
      return;
    }
    throw new Error(`Unexpected matches for ${pattern} ${args.join(' ')}:\n${String(error.stdout || error.message || '').trim()}`);
  }
}

function scanTreeFor(pattern, dirs) {
  for (const dir of dirs) {
    const absolute = resolve(dir);
    if (!fs.existsSync(absolute)) continue;
    const result = spawnSync('grep', ['-R', pattern, dir, '--exclude-dir=node_modules', '--exclude-dir=.next', '--exclude-dir=.git'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const output = String(result.stdout || '').trim();
    if (result.status === 0 && output) {
      throw new Error(`Unexpected reference to ${pattern} found under ${dir}:\n${output}`);
    }
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(`grep failed for ${pattern} under ${dir}: ${String(result.stderr || result.error?.message || '').trim()}`);
    }
  }
}

function read(relativePath) {
  return fs.readFileSync(resolve(relativePath), 'utf8');
}

function check(message, fn) {
  try {
    fn();
    console.log(`PASS ${message}`);
  } catch (error) {
    console.error(`FAIL ${message}`);
    throw error;
  }
}

const staleGatewayName = ['Reffer', 'QGateway'].join('');
const staleMegaModuleName = ['Reffer', 'QMegaModule'].join('');
const retiredAmbassadorPath = ['lib/ambassadors/', 'final'].join('');

check('no stale RefferQ namespace references', () => {
  scanTreeFor(staleGatewayName, ['app', 'components', 'lib', 'integrations', 'scripts']);
  scanTreeFor(staleMegaModuleName, ['app', 'components', 'lib', 'integrations', 'scripts']);
});

check('old Ambassador runtime remains absent from active RefferQ surfaces', () => {
  scanTreeFor(retiredAmbassadorPath, ['app', 'components', 'integrations/refferq/live/src', 'scripts']);
});

check('integrations/refferq/source exists', () => assertExists('integrations/refferq/source'));
check('integrations/refferq/live exists', () => assertExists('integrations/refferq/live'));
check('live Prisma schema exists', () => assertExists('integrations/refferq/live/prisma/schema.prisma'));
check('live Prisma schema uses REFFERQ_DATABASE_URL', () => {
  const schema = read('integrations/refferq/live/prisma/schema.prisma');
  if (!schema.includes('env("REFFERQ_DATABASE_URL")')) {
    throw new Error('live Prisma schema does not reference REFFERQ_DATABASE_URL');
  }
});
check('live env helper exists', () => assertExists('integrations/refferq/live/src/lib/env.ts'));
check('live prisma helper exists', () => assertExists('integrations/refferq/live/src/lib/prisma.ts'));
check('auth bridge helper exists', () => assertExists('integrations/refferq/live/src/lib/angelcare-auth-bridge.ts'));
check('compatibility env helper exists', () => assertExists('integrations/refferq/live/lib/env.ts'));
check('compatibility prisma helper exists', () => assertExists('integrations/refferq/live/lib/prisma.ts'));
check('compatibility auth bridge helper exists', () => assertExists('integrations/refferq/live/lib/angelcare-auth-bridge.ts'));
check('schema SQL file exists', () => assertExists('database/refferq/20260710_refferq_schema.sql'));
check('seed script exists', () => assertExists('scripts/seed-refferq.mjs'));
check('market-os/refferq API namespace exists', () => assertExists('app/api/market-os/refferq'));
check('mounted RefferQ route tree still exists', () => assertExists('app/(protected)/market-os/ambassadors/refferq'));

check('no root public /api/auth overwrite uses RefferQ namespace', () => {
  scanTreeFor('market-os/refferq', ['app/api/auth']);
});

check('no root public /api/admin overwrite uses RefferQ namespace', () => {
  scanTreeFor('market-os/refferq', ['app/api/admin']);
});

check('cookie namespace is RefferQ-specific', () => {
  const authFiles = [
    'integrations/refferq/live/src/app/api/auth/login/route.ts',
    'integrations/refferq/live/src/app/api/auth/logout/route.ts',
    'integrations/refferq/live/src/app/api/auth/me/route.ts',
    'integrations/refferq/live/src/app/api/auth/verify-otp/route.ts',
  ];
  for (const file of authFiles) {
    const content = read(file);
    if (content.includes('auth-token')) {
      throw new Error(`Legacy auth-token cookie still present in ${file}`);
    }
    if (
      !content.includes('refferq_session') &&
      !content.includes('setRefferqSessionCookies') &&
      !content.includes('REFFERQ_COOKIE_NAMES')
    ) {
      throw new Error(`RefferQ cookie namespace helper missing in ${file}`);
    }
  }
});

check('RefferQ root-mounted routes are still present', () => {
  assertExists('app/(protected)/market-os/ambassadors/refferq/login/page.tsx');
  assertExists('app/(protected)/market-os/ambassadors/refferq/page.tsx');
});

console.log('RefferQ inside AngelCare verification complete.');
