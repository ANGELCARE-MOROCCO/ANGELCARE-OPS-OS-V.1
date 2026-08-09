const http = require('http');
const base = process.env.SAAS_FACTORY_BASE_URL || 'http://localhost:3000';
function request(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const url = new URL(pathname, base);
    const req = http.request(url, { method, headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {} }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data.slice(0, 500) }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}
(async () => {
  const checks = [
    ['GET','/api/saas-factory/panel/overview'],
    ['GET','/api/saas-factory/panel/options'],
    ['GET','/api/saas-factory/panel/apis'],
    ['GET','/api/saas-factory/panel/queues'],
    ['GET','/api/saas-factory/readiness/full'],
    ['POST','/api/saas-factory/panel/action',{ mode:'Run Readiness Check', page:'deployment' }],
  ];
  console.log('SAAS FACTORY PHASE 8 SMOKE');
  console.log('==========================');
  let failed = false;
  for (const [method,path,body] of checks) {
    try {
      const result = await request(method,path,body);
      const ok = result.status >= 200 && result.status < 300;
      console.log(`${ok ? '✓' : '✗'} ${method} ${path} ${result.status}`);
      if (!ok) { failed = true; console.log(result.data); }
    } catch (error) { failed = true; console.log(`✗ ${method} ${path} ${error.message}`); }
  }
  if (failed) process.exit(1);
  console.log('Ready.');
})();
