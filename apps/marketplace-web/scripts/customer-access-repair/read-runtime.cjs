'use strict';
// Read-only prerequisite for a runtime repair. No production writes or restarts.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const AUTH_READ = String.raw`
import json, subprocess, hashlib, os, re
visible = ['GOTRUE_SMTP_HOST','GOTRUE_SMTP_PORT','GOTRUE_SMTP_USER',
 'GOTRUE_SMTP_ADMIN_EMAIL','GOTRUE_SMTP_SENDER_NAME','GOTRUE_SITE_URL',
 'GOTRUE_URI_ALLOW_LIST','GOTRUE_EXTERNAL_EMAIL_ENABLED',
 'GOTRUE_MAILER_AUTOCONFIRM','GOTRUE_HOOK_SEND_EMAIL_ENABLED','GOTRUE_EXTERNAL_GOOGLE_ENABLED','GOTRUE_EXTERNAL_FACEBOOK_ENABLED','GOTRUE_EXTERNAL_APPLE_ENABLED','API_EXTERNAL_URL']
hidden = ['GOTRUE_SMTP_PASS','GOTRUE_HOOK_SEND_EMAIL_SECRET',
 'GOTRUE_HOOK_SEND_EMAIL_SECRETS','GOTRUE_HOOK_SEND_EMAIL_URI','GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID','GOTRUE_EXTERNAL_GOOGLE_SECRET']
def command(args):
 r = subprocess.run(args, capture_output=True, text=True, timeout=12)
 if r.returncode: raise RuntimeError('Docker read unavailable or permission denied')
 return r.stdout
def run():
 docker = ['docker']
 try: rows = command(docker + ['ps','--format','{{json .}}'])
 except Exception:
  docker = ['sudo','-n','docker']
  rows = command(docker + ['ps','--format','{{json .}}'])
 candidates = []
 for line in rows.splitlines():
  item = json.loads(line)
  if re.search(r'(supabase/(auth|gotrue)|(^|/)gotrue)(:|@|$)', item.get('Image',''), re.I):
   candidates.append(item)
 result = {'inspection':'READ_ONLY_COMPLETE','authContainers':[],'configurationChanges':False}
 for item in candidates[:8]:
  detail = json.loads(command(docker + ['inspect',item['ID']]))[0]
  env = dict(x.split('=',1) for x in detail.get('Config',{}).get('Env',[]) if '=' in x)
  labels = detail.get('Config',{}).get('Labels') or {}
  settings = {k:env.get(k) for k in visible if k in env}
  settings.update({k+'_PRESENT':bool(env.get(k)) for k in hidden})
  files = []
  for filename in labels.get('com.docker.compose.project.config_files','').split(','):
   filename = filename.strip()
   if not filename: continue
   entry = {'path':filename,'exists':os.path.isfile(filename)}
   if entry['exists']:
    with open(filename,'rb') as stream: entry['sha256']=hashlib.sha256(stream.read()).hexdigest()
   files.append(entry)
  result['authContainers'].append({'name':detail.get('Name','').lstrip('/'),
   'image':detail.get('Config',{}).get('Image'), 'settings':settings,
   'composeService':labels.get('com.docker.compose.service'),
   'composeProject':labels.get('com.docker.compose.project'),
   'composeWorkingDirectory':labels.get('com.docker.compose.project.working_dir'),
   'composeFiles':files})
 if not candidates: result['inspection']='NO_RUNNING_AUTH_CONTAINER_IDENTIFIED'
 return result
try: print(json.dumps(run()))
except Exception: print(json.dumps({'inspection':'UNAVAILABLE','reason':'Docker/Python access unavailable; no configuration changed','configurationChanges':False}))
`;

function readWindows(input) {
  const fs = require('node:fs');
  const path = require('node:path');
  const crypto = require('node:crypto');
  const { spawnSync } = require('node:child_process');
  const visible = ['DEFAULT_SMTP_HOST','DEFAULT_SMTP_PORT','DEFAULT_SMTP_SECURE',
    'DEFAULT_SMTP_USER','DEFAULT_FROM_EMAIL','EMAIL_OS_SMTP_HOST',
    'EMAIL_OS_SMTP_PORT','EMAIL_OS_SMTP_SECURE','EMAIL_OS_SMTP_USER','EMAIL_OS_FROM_EMAIL'];
  const hidden = ['DEFAULT_SMTP_PASS','EMAIL_OS_SMTP_PASS','EMAIL_BRIDGE_TOKEN','EMAIL_BRIDGE_ADMIN_TOKEN'];
  function safe(env) {
    const result = {};
    for (const key of visible) if (Object.hasOwn(env,key)) result[key] = env[key];
    for (const key of hidden) result[key+'_PRESENT'] = Boolean(env[key]);
    return result;
  }
  function pairs(rows) {
    const result = {};
    for (const row of rows || []) {
      if (typeof row !== 'string') continue;
      const index = row.indexOf('=');
      if (index > 0) result[row.slice(0,index)] = row.slice(index+1);
    }
    return result;
  }
  function dotenv(text) {
    const env = {};
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if (/^(["']).*\1$/.test(value)) value = value.slice(1,-1);
      else value = value.replace(/\s+#.*$/,'');
      env[match[1]] = value;
    }
    return env;
  }
  const ps = String.raw`
$ErrorActionPreference='Stop'
$s=Get-Service -Name 'angelcare-email-bridge'
$r=Get-ItemProperty -LiteralPath 'HKLM:\SYSTEM\CurrentControlSet\Services\angelcare-email-bridge\Parameters'
@{service=$s.Name;state=$s.Status.ToString();folder=$r.AppDirectory;application=$r.Application;arguments=$r.AppParameters;extra=@($r.AppEnvironmentExtra);environment=@($r.AppEnvironment)} | ConvertTo-Json -Depth 4 -Compress
`;
  const registry = spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(ps,'utf16le').toString('base64')],{encoding:'utf8',timeout:15000});
  if (registry.error || registry.status !== 0) throw Error('Email bridge service registration could not be read');
  const registration = JSON.parse(registry.stdout.replace(/^\uFEFF/,'').trim());
  const folder = registration.folder;
  if (!folder || !fs.existsSync(folder)) throw Error('Registered email bridge directory is unavailable');
  const environment = pairs(registration.environment);
  const extra = pairs(registration.extra);
  const sources = {};
  for (const filename of ['.env','.env.production','.env.local']) {
    const file = path.join(folder,filename);
    if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size > 1048576) continue;
    const bytes = fs.readFileSync(file);
    sources[filename] = {sha256:crypto.createHash('sha256').update(bytes).digest('hex'),settings:safe(dotenv(bytes.toString('utf8')))};
  }
  const server = path.join(folder,'server.js');
  let source = null;
  if (fs.existsSync(server) && fs.statSync(server).size <= 4194304) {
    const bytes = fs.readFileSync(server);
    const text = bytes.toString('utf8');
    source = {sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
      environmentKeys:[...new Set(text.match(/(?:DEFAULT|EMAIL_OS)_SMTP_[A-Z_]+|DEFAULT_FROM_EMAIL/g) || [])],
      usesDotenv:/dotenv/.test(text), hasSmtpTestEndpoint:text.includes('/admin/test/smtp'),
      hasSendEndpoint:text.includes('/send'),
      singularSupportLiteralPresent:text.includes('support@angelcarehub.ma'),
      pluralSupportsLiteralPresent:text.includes('supports@angelcarehub.ma')};
  }
  const result = {inspection:'READ_ONLY_COMPLETE', service:registration.service,
    state:registration.state,folder,node:registration.application,source,
    registrationEnvironment:safe(environment),registrationExtraEnvironment:safe(extra),
    envFiles:sources,authOnWindowsSubsystem:[],configurationChanges:false};
  // Enumerate running distributions only. Never start a stopped distribution.
  const list = spawnSync('wsl.exe',['--list','--running','--quiet'],{timeout:10000});
  if (!list.error && list.status === 0) {
    const bytes = list.stdout || Buffer.alloc(0);
    const names = bytes.toString(bytes.includes(0) ? 'utf16le':'utf8').replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    for (const name of names.slice(0,4)) {
      if (/docker-desktop|^\-/i.test(name)) continue;
      const read = spawnSync('wsl.exe',['--distribution',name,'--exec','python3','-'],{input:input.authRead,encoding:'utf8',timeout:55000,maxBuffer:1048576});
      let payload;
      try { payload = JSON.parse((read.stdout || '').trim()); }
      catch { payload = {inspection:'UNAVAILABLE',reason:'Python/Docker access unavailable; nothing changed'}; }
      result.authOnWindowsSubsystem.push({distribution:name,...payload});
      if ((payload.authContainers || []).length) break;
    }
  }
  console.log(JSON.stringify(result));
}

function safeReason(result) {
  if (result.error?.code === 'ETIMEDOUT') return 'Connection or inspection timed out';
  if (result.error) return 'Connection process unavailable';
  const text = String(result.stderr || '');
  if (/permission denied/i.test(text)) return 'SSH authentication denied';
  if (/host key verification failed/i.test(text)) return 'Host key verification failed; known_hosts unchanged';
  if (/timed out/i.test(text)) return 'SSH connection timed out';
  return 'Remote read unavailable; no production changes made';
}

function run() {
  const home = os.homedir();
  const report = {version:'ANGELCARE_CUSTOMER_ACCESS_RUNTIME_R4',checkedAt:new Date().toISOString(),
    canonicalSupportAddress:'supports@angelcarehub.ma',configurationChanges:false,
    emailsSent:0,serviceRestarts:0,repositoryChanges:false};
  console.log('[1/4] READ WINDOWS EMAIL BRIDGE CONFIGURATION');
  const key = path.join(home,'.ssh','angelcare_windows');
  if (fs.existsSync(key)) {
    const script = '('+readWindows.toString()+')('+JSON.stringify({authRead:AUTH_READ})+');';
    const read = spawnSync('ssh',['-F','/dev/null','-T','-p','22','-i',key,
      '-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes',
      '-o','ForwardAgent=no','-o','ClearAllForwardings=yes','-o','ConnectTimeout=8',
      'MonPC@192.168.1.84',
      'powershell.exe -NoProfile -NonInteractive -Command "& \'C:\\Program Files\\nodejs\\node.exe\' -"'],
      {input:script,encoding:'utf8',timeout:150000,maxBuffer:2097152});
    try { report.windows = JSON.parse(read.stdout.trim()); }
    catch { report.windows = {inspection:'UNAVAILABLE',reason:safeReason(read)}; }
  } else report.windows = {inspection:'UNAVAILABLE',reason:'Existing angelcare_windows SSH key not found; no key generated'};
  console.log('WINDOWS_INSPECTION='+report.windows.inspection);
  console.log('[2/4] READ SUPABASE AUTH CONFIGURATION');
  const wsl = report.windows.authOnWindowsSubsystem || [];
  report.authContainers = wsl.flatMap(x=>(x.authContainers || []).map(c=>({...c,source:'Windows WSL: '+x.distribution})));
  if (!report.authContainers.length) {
    const config = path.join(home,'.ssh','config');
    if (fs.existsSync(config) && /^\s*Host\s+[^\n]*\bangelcare-coolify\b/m.test(fs.readFileSync(config,'utf8'))) {
      const read = spawnSync('ssh',['-T','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes',
        '-o','ForwardAgent=no','-o','ClearAllForwardings=yes','-o','ConnectTimeout=8',
        'angelcare-coolify','python3 -'],{input:AUTH_READ,encoding:'utf8',timeout:65000,maxBuffer:1048576});
      try {
        const payload = JSON.parse(read.stdout.trim());
        report.authContainers = (payload.authContainers || []).map(c=>({...c,source:'Existing angelcare-coolify SSH alias'}));
        report.authRead = payload.inspection;
      } catch { report.authRead = safeReason(read); }
    } else report.authRead = 'No existing Coolify SSH alias available';
  }
  console.log('AUTH_CONTAINERS_READ='+report.authContainers.length);
  console.log('[3/4] SAVE PRIVATE CONFIGURATION REPORT');
  const downloads = path.join(home,'Downloads');
  fs.mkdirSync(downloads,{recursive:true});
  const file = path.join(downloads,'ANGELCARE_CUSTOMER_ACCESS_RUNTIME_'+report.checkedAt.replace(/[:.]/g,'-')+'.json');
  fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log('ATTACH='+file);
  console.log('[4/4] READ-ONLY CAPTURE COMPLETE');
  console.log('No passwords, bridge tokens or recovery links are included in the report.');
  console.log('No environment changes, restarts, SQL, dependency installation or builds performed.');
  if (report.windows.inspection !== 'READ_ONLY_COMPLETE' || !report.authContainers.length)
    console.log('RUNTIME_INSPECTION=INCOMPLETE; this report is not a repair or proof of email delivery.');
}
if (require.main === module) {
  try { run(); } catch { console.log('CAPTURE_STOPPED: read could not finish; no production changes performed.'); }
  console.log('TERMINAL_REMAINS_OPEN');
}
module.exports = {readWindows,AUTH_READ,safeReason};
