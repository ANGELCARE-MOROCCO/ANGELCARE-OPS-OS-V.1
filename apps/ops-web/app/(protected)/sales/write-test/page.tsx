
'use client'

import { useState } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel } from '@/app/components/erp/ERPPrimitives'

export default function SalesWriteTestPage() {
  const [result, setResult] = useState('Not tested yet.')

  async function runTest() {
    setResult('Testing real write...')
    try {
      const res = await fetch('/api/sales-terminal/debug-write')
      const json = await res.json()
      setResult(JSON.stringify(json, null, 2))
    } catch (error: any) {
      setResult(error?.message || 'Unknown error')
    }
  }

  return (
    <AppShell
      title="Sales Write Test"
      subtitle="Proves whether Sales Terminal can write real records to Supabase."
      breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Write Test' }]}
      actions={<PageAction href="/sales">Back to Sales</PageAction>}
    >
      <ERPPanel title="Real Database Write Probe" subtitle="Click once. It should create one test client and one test order.">
        <button onClick={runTest} style={{ border: 0, borderRadius: 14, background: '#0f172a', color: '#fff', padding: '14px 18px', fontWeight: 950, cursor: 'pointer' }}>
          Run Real Write Test
        </button>
        <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', background: '#020617', color: '#e2e8f0', borderRadius: 16, padding: 16 }}>
          {result}
        </pre>
      </ERPPanel>
    </AppShell>
  )
}
