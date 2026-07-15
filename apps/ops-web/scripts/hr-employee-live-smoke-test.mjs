const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
const payload = {
  first_name: 'Smoke',
  last_name: `Employee ${Date.now()}`,
  email: `smoke.employee.${Date.now()}@angelcare.ma`,
  phone: '+212 6 12 34 56 78',
  national_id: `SMK${Date.now().toString().slice(-6)}`,
  department: 'Human Resources',
  position: 'HR Operations Specialist',
  city: 'Casablanca',
  work_city: 'Casablanca',
  branch_office: 'Casablanca Head Office',
  start_date: new Date().toISOString().slice(0, 10),
  contract_type: 'CDI',
  salary: '15000',
  currency: 'MAD',
  create_login_account: true,
  send_welcome_email: true,
}

const res = await fetch(`${base}/api/hr/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
const json = await res.json().catch(() => ({}))
console.log('/api/hr/employees', res.status, JSON.stringify(json, null, 2))
if (!res.ok || !json.ok) process.exit(1)
