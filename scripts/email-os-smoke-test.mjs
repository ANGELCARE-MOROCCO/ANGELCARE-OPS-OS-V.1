const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
async function post(path, body = {}) {
  const res = await fetch(base + path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json().catch(()=>({}));
  console.log(path, res.status, data.ok === false ? data.error : 'ok');
  if (!res.ok || data.ok === false) process.exitCode = 1;
}
await post('/api/email-os/accounts/seed-from-env');
await post('/api/email-os/accounts/test', { email:'supports@angelcare.ma' });
await post('/api/email-os/sync', { email:'supports@angelcare.ma', limit:5 });
await post('/api/email-os/outbox/retry', { limit:3 });
console.log('Email OS smoke test complete.');
