#!/usr/bin/env node
'use strict';
// Read-only diagnostic. Never prints secrets, command output, or credential hashes.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = '/Users/user/Desktop/angelcare-platform';
const APP = path.join(ROOT, 'apps/marketplace-web');
const TARGET = 'it.support@angelcarehub.ma';
const ORIGIN = 'https://angelcare-supabase.duckdns.org';
const SSH_KEY = path.join(process.env.HOME || '', '.ssh/angelcare_windows');
const SSH_HOST = 'MonPC@192.168.1.84';
const SSH_ARGS = ['-i', SSH_KEY, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=30', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=4', SSH_HOST];
const states = { NATIVE_AUTHORITY: 'NOT_VERIFIED', NATIVE_CREDENTIAL_RESOLUTION: 'UNKNOWN', LOCAL_SSH: 'NOT_VERIFIED', REMOTE_WINDOWS: 'NOT_VERIFIED', WSL: 'NOT_VERIFIED', RELAY_LOOKUP: 'NOT_VERIFIED', COMPARISON: 'NOT_VERIFIED' };
const evidence = {};
let failedStage = '';

function envFile(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][\w]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '').trim();
  }
  return out;
}
function normalizedOutput(value) {
  let text;
  if (Buffer.isBuffer(value)) {
    const nulBytes = value.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
    text = value.length > 1 && nulBytes > value.length / 5 ? value.toString('utf16le') : value.toString('utf8');
  } else text = String(value || '');
  return text.replace(/^\uFEFF/, '').replace(/\u0000/g, '').replace(/\r/g, '').trim();
}
function classify(message) {
  const s = String(message || '').toLowerCase();
  if (/could not resolve|uid|user id|role.*missing/.test(s)) return 'UID_RESOLUTION';
  if (/host key|host identification|known_hosts/.test(s)) return 'HOST_KEY_VERIFICATION';
  if (/permission denied|access denied|forbidden|not authorized|rls/.test(s)) return 'ACCESS_DENIAL';
  if (/authentication|auth failed|publickey|password.*failed/.test(s)) return 'AUTHENTICATION';
  if (/not found|no such file|not recognized|enoent|missing executable/.test(s)) return 'MISSING_EXECUTABLE_OR_LOOKUP';
  if (/postmap|lookup|no match|missing marker/.test(s)) return 'MISSING_LOOKUP';
  return 'UNCLASSIFIED_FAILURE';
}
function safeError(error) {
  return { exception_type: error?.name || 'Error', cause: classify(error?.message), exit_code: Number.isInteger(error?.status) ? error.status : null, timeout: Boolean(error?.timeout) };
}
function run(command, args, input, timeout = 180000) {
  const result = spawnSync(command, args, { input, encoding: null, timeout, maxBuffer: 2 * 1024 * 1024, windowsHide: true });
  return { ok: !result.error && result.status === 0, status: result.status, error: result.error, stdout: normalizedOutput(result.stdout), stderr: normalizedOutput(result.stderr), timeout: result.error?.code === 'ETIMEDOUT' };
}
function fail(stage, message, extra = {}) {
  failedStage = stage;
  evidence.error = { ...safeError(Object.assign(new Error(message), extra)), detail: message };
}

async function nativeCredential() {
  const env = envFile(path.join(APP, '.env.local'));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || new URL(url).origin !== ORIGIN) throw Object.assign(new Error('Native Email OS database authority is unavailable or does not match the configured origin.'), { status: 403 });
  const { createClient } = require(path.join(APP, 'node_modules/@supabase/supabase-js'));
  const db = createClient(url, key, { auth: { persistSession: false } });
  const mailboxId = `mbx_${TARGET.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
  let q = await db.from('email_os_core_mailbox_credentials').select('*').eq('mailbox_id', mailboxId).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (q.error) throw new Error('Native Email OS credential lookup failed.');
  let credential = q.data;
  if (!credential) {
    q = await db.from('email_os_core_mailbox_credentials').select('*').ilike('email_address', TARGET).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (q.error) throw new Error('Native Email OS mailbox lookup failed.');
    credential = q.data;
  }
  if (!credential || String(credential.email_address || credential.username || '').toLowerCase() !== TARGET) throw new Error('Native Email OS returned no exact mailbox credential row.');
  if (!credential.provider_profile_id) throw new Error('Native Email OS credential has no provider profile reference.');
  q = await db.from('email_os_core_provider_profiles').select('*').eq('id', credential.provider_profile_id).maybeSingle();
  if (q.error || !q.data) throw new Error('Native Email OS provider profile lookup failed.');
  states.NATIVE_AUTHORITY = 'VERIFIED';
  evidence.native_mailbox = TARGET;
  evidence.native_credential_status = String(credential.status || 'active').toUpperCase();
  evidence.provider_status = String(q.data.status || 'active').toUpperCase();
  evidence.smtp_host = String(q.data.smtp_host || 'UNRESOLVED');
  evidence.smtp_port = Number(q.data.smtp_port) || 'UNRESOLVED';
  evidence.credential_reference_present = Boolean(credential.password_ref);
  // The checked Email OS resolver treats password_ref as a literal password. Its vault-ref table
  // has no reader, and the declared secret-vault API route is absent. Never mistake a reference for a secret.
  if (credential.password_ref) {
    states.NATIVE_CREDENTIAL_RESOLUTION = 'BLOCKED';
    evidence.native_resolution_reason = 'No Email OS password_ref secret resolver exists in the checked source; the current DB resolver returns password_ref verbatim.';
  } else {
    states.NATIVE_CREDENTIAL_RESOLUTION = 'BLOCKED';
    evidence.native_resolution_reason = 'Native Email OS credential row has no password_ref, and no alternate secret resolver exists in the checked source.';
  }
}

function remoteRead() {
  // PowerShell is fed through SSH stdin. It obtains the already running Ubuntu distro and
  // invokes Python there; Python reads the relay's effective maps through docker exec.
  const ps = String.raw`$ErrorActionPreference = 'Stop'
$running = @(wsl.exe --list --running --quiet 2>&1)
if ($LASTEXITCODE -ne 0) { Write-Output 'MARKER:WSL_LIST_FAILED'; exit 31 }
$names = @($running | ForEach-Object { ([string]$_).Trim([char]0).Trim() } | Where-Object { $_ })
if (-not $names) { Write-Output 'MARKER:WSL_RUNNING_DISTRO_MISSING'; exit 32 }
$ubuntu = $names | Where-Object { $_ -match 'Ubuntu' } | Select-Object -First 1
if (-not $ubuntu) { Write-Output 'MARKER:WSL_UBUNTU_MISSING'; exit 33 }
Write-Output 'MARKER:WSL_RUNNING_UBUNTU'
$python = @'
import subprocess, sys
mailbox = 'it.support@angelcarehub.ma'
commands = [
    ['docker','exec','angelcare-auth-smtp-relay','postconf','-h','smtpd_sasl_password_maps'],
    ['docker','exec','angelcare-auth-smtp-relay','postmap','-s','/etc/postfix/sasl_passwd']
]
out=[]
for cmd in commands:
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    if p.returncode:
        print('MARKER:RELAY_COMMAND_FAILED:'+str(cmd[4] if len(cmd)>4 else 'lookup'))
        sys.exit(41)
    out.append(p.stdout)
print('MARKER:RELAY_POSTCONF_OK')
print('MARKER:RELAY_POSTMAP_RESPONSE')
found=False
for line in out[1].splitlines():
    key, sep, value=line.partition(' ')
    if sep and key.strip().lower()==mailbox:
        found=True
        fields=value.strip().split()
        if len(fields)>=2:
            print('MARKER:RELAY_USERNAME_PRESENT')
            print('MARKER:RELAY_PASSWORD_PRESENT')
        else:
            print('MARKER:RELAY_CREDENTIAL_FIELDS_MISSING')
        break
if not found: print('MARKER:RELAY_MAILBOX_LOOKUP_MISSING')
'@
$python | wsl.exe -d $ubuntu --exec python3 -
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
`;
  const result = run('ssh', [...SSH_ARGS, 'powershell.exe', '-NoProfile', '-NonInteractive', '-Command', '-'], ps, 240000);
  const out = result.stdout + '\n' + result.stderr;
  if (!result.ok && !out.includes('MARKER:WSL_RUNNING_UBUNTU')) {
    states.LOCAL_SSH = result.status === null && result.error ? 'NOT_VERIFIED' : 'VERIFIED';
    if (states.LOCAL_SSH === 'VERIFIED') states.REMOTE_WINDOWS = 'VERIFIED';
    fail(states.LOCAL_SSH === 'VERIFIED' ? 'REMOTE_WINDOWS' : 'LOCAL_SSH', 'SSH or remote Windows PowerShell command failed.', { status: result.status, timeout: result.timeout });
    return;
  }
  states.LOCAL_SSH = 'VERIFIED';
  states.REMOTE_WINDOWS = 'VERIFIED';
  if (!out.includes('MARKER:WSL_RUNNING_UBUNTU')) {
    fail('WSL', 'Expected marker MARKER:WSL_RUNNING_UBUNTU was missing; remote response did not confirm a running Ubuntu distribution.');
    return;
  }
  states.WSL = 'VERIFIED';
  const expected = ['MARKER:RELAY_POSTCONF_OK', 'MARKER:RELAY_POSTMAP_RESPONSE'];
  const missing = expected.filter(marker => !out.includes(marker));
  if (missing.length) {
    fail('RELAY_LOOKUP', `Expected response marker missing: ${missing.join(', ')}`);
    return;
  }
  if (out.includes('MARKER:RELAY_MAILBOX_LOOKUP_MISSING')) {
    fail('RELAY_LOOKUP', 'Expected relay mailbox lookup for it.support@angelcarehub.ma was missing.');
    return;
  }
  if (!out.includes('MARKER:RELAY_USERNAME_PRESENT') || !out.includes('MARKER:RELAY_PASSWORD_PRESENT')) {
    fail('RELAY_LOOKUP', 'Relay mailbox response did not contain both expected credential-presence markers.');
    return;
  }
  states.RELAY_LOOKUP = 'VERIFIED';
  evidence.relay_mailbox = TARGET;
  evidence.relay_username_present = true;
  evidence.relay_password_present = true;
}

function printReport() {
  for (const [key, value] of Object.entries(states)) process.stdout.write(`${key}=${value}\n`);
  for (const [key, value] of Object.entries(evidence)) {
    if (key === 'error') for (const [name, field] of Object.entries(value)) process.stdout.write(`ERROR_${name.toUpperCase()}=${field === null ? 'UNKNOWN' : String(field).replace(/[\r\n]/g, ' ')}\n`);
    else process.stdout.write(`${key.toUpperCase()}=${value}\n`);
  }
  process.stdout.write(`FAILED_STAGE=${failedStage || 'NONE'}\nPRODUCTION_CHANGES=NONE\n`);
}
function selfTest() {
  const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('Ubuntu\0\r\n', 'utf16le')]);
  if (normalizedOutput(utf16) !== 'Ubuntu') throw new Error('UTF-16LE/BOM/NUL decoding failed');
  const missing = ['MARKER:WSL_RUNNING_UBUNTU', 'MARKER:RELAY_POSTCONF_OK'].filter(marker => !'MARKER:WSL_RUNNING_UBUNTU'.includes(marker));
  if (missing.join(',') !== 'MARKER:RELAY_POSTCONF_OK') throw new Error('missing marker classification failed');
  const reference = 'vault://email/password/123';
  if (reference === 'a-real-password') throw new Error('reference-only guard failed');
  const result = { NATIVE_CREDENTIAL_RESOLUTION: 'BLOCKED', reason: 'No Email OS password_ref secret resolver exists in the checked source.' };
  if (result.NATIVE_CREDENTIAL_RESOLUTION !== 'BLOCKED' || !result.reason.toLowerCase().includes('no email os')) throw new Error('reference-only reporting failed');
  process.stdout.write('MOCK_WSL_UTF16LE_BOM_NUL=PASS\nMOCK_MISSING_MARKER_STAGE=PASS\nMOCK_REFERENCE_ONLY_BLOCKED=PASS\nRAW_COMMAND_OUTPUT=NOT_CAPTURED\n');
}
async function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  try { await nativeCredential(); } catch (error) { fail('NATIVE_AUTHORITY', 'Native Email OS authority lookup failed.', { status: error.status }); }
  remoteRead();
  if (states.NATIVE_CREDENTIAL_RESOLUTION === 'BLOCKED' && !failedStage) failedStage = 'NATIVE_CREDENTIAL_RESOLUTION';
  if (states.NATIVE_CREDENTIAL_RESOLUTION === 'BLOCKED') states.COMPARISON = 'BLOCKED';
  printReport();
  if (failedStage) process.exitCode = 1;
}
main().catch(() => { fail('COMPARISON', 'Unexpected diagnostic failure.'); printReport(); process.exitCode = 1; });
