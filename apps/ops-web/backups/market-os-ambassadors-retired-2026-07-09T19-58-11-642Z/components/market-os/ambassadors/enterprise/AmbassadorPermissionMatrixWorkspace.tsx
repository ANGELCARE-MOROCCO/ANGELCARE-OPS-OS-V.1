'use client';

import * as React from 'react';
import { ambassadorEnterpriseSnapshot } from './ambassador-enterprise-registry';

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const tones = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700'
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export default function AmbassadorPermissionMatrixWorkspace() {
  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='danger'>Permission Matrix</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>Ambassador Enterprise Permission Matrix</h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          High-risk action permissions that must be enforced server-side before live production execution.
        </p>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-100 text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-9500'>
              <tr>
                <th className='px-5 py-3'>Action</th>
                <th className='px-5 py-3'>Roles</th>
                <th className='px-5 py-3'>Risk</th>
                <th className='px-5 py-3'>Server Validation</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {ambassadorEnterpriseSnapshot.permissions.map((permission) => (
                <tr key={permission.id}>
                  <td className='px-5 py-4 font-medium text-slate-950'>{permission.action}</td>
                  <td className='px-5 py-4 text-slate-600'>{permission.allowedRoles.join(', ')}</td>
                  <td className='px-5 py-4'>
                    <Badge tone={permission.risk === 'critical' ? 'danger' : permission.risk === 'high' ? 'warning' : 'info'}>{permission.risk}</Badge>
                  </td>
                  <td className='px-5 py-4'>
                    <Badge tone={permission.requiresServerValidation ? 'danger' : 'success'}>
                      {permission.requiresServerValidation ? 'required' : 'optional'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
