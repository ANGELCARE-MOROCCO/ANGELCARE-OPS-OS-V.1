'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Account = {
  id: string;
  mailbox_name: string;
  email_address: string;
  department: string;
  owner_label: string;
  approval_required: boolean;
  status: string;
};

type Permission = {
  id?: string;
  user_id: string;
  account_id: string;
  can_read: boolean;
  can_send: boolean;
  can_approve: boolean;
  can_admin: boolean;
  temporary_until?: string | null;
  restricted_reason?: string | null;
};

async function api(path: string, payload?: unknown, method = 'POST') {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Request failed');
  return data?.data ?? data;
}

export default function MailboxPermissionsPanel({ userId, assignedBy }: { userId: string; assignedBy?: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Loading mailbox permissions...');

  useEffect(() => {
    Promise.all([
      api('/api/email-os/accounts', undefined, 'GET'),
      api(`/api/users/mailbox-permissions?user_id=${encodeURIComponent(userId)}`, undefined, 'GET'),
    ])
      .then(([accountsData, permissionData]) => {
        setAccounts(accountsData || []);
        const map: Record<string, Permission> = {};
        for (const p of permissionData || []) map[p.account_id] = p;
        setPermissions(map);
        setStatus('Ready');
      })
      .catch((error) => setStatus('Failed to load: ' + error.message));
  }, [userId]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return accounts.filter((account) => !q || `${account.mailbox_name} ${account.email_address} ${account.department}`.toLowerCase().includes(q));
  }, [accounts, query]);

  function current(account: Account): Permission {
    return permissions[account.id] || {
      user_id: userId,
      account_id: account.id,
      can_read: false,
      can_send: false,
      can_approve: false,
      can_admin: false,
      temporary_until: null,
      restricted_reason: account.approval_required ? 'Restricted mailbox' : null,
    };
  }

  function toggle(account: Account, key: keyof Pick<Permission, 'can_read'|'can_send'|'can_approve'|'can_admin'>) {
    const p = current(account);
    setPermissions((prev) => ({
      ...prev,
      [account.id]: { ...p, [key]: !p[key] },
    }));
  }

  async function saveAll() {
    setStatus('Saving mailbox assignments...');
    try {
      const rows = accounts.map((account) => current(account));
      await api('/api/users/mailbox-permissions/bulk', {
        user_id: userId,
        assigned_by: assignedBy || null,
        permissions: rows,
      });
      setStatus('Saved mailbox permissions.');
    } catch (error: any) {
      setStatus('Save failed: ' + error.message);
    }
  }

  return (
    <section style={{display:'grid',gap:16,padding:20,borderRadius:28,border:'1px solid #dbe3ee',background:'#fff'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div>
          <h2 style={{margin:0,fontSize:24,fontWeight:950,color:'#0f172a'}}>Mailbox permissions</h2>
          <p style={{margin:'6px 0 0',color:'#475569',fontWeight:700}}>
            Assign Email OS access from User Manager. Email OS consumes these permissions only.
          </p>
        </div>
        <button type="button" onClick={saveAll} style={{border:0,borderRadius:14,padding:'12px 16px',fontWeight:900,color:'#fff',background:'#2563eb'}}>
          Save mailbox assignments
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search mailbox, email, department..."
        style={{border:'1px solid #cbd5e1',borderRadius:14,padding:'12px 14px',fontWeight:700,color:'#0f172a'}}
      />

      <div style={{display:'grid',gap:10}}>
        {filtered.map((account) => {
          const p = current(account);
          return (
            <article key={account.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:14,alignItems:'center',padding:14,border:'1px solid #e2e8f0',borderRadius:18,background:'#f8fafc'}}>
              <div>
                <b style={{fontSize:16,color:'#0f172a'}}>{account.mailbox_name} · {account.email_address}</b>
                <p style={{margin:'4px 0 0',color:'#64748b',fontWeight:700}}>
                  {account.department} · {account.owner_label} · {account.status}
                </p>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {(['can_read','can_send','can_approve','can_admin'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(account, key)}
                    style={{
                      border:'1px solid #cbd5e1',
                      borderRadius:999,
                      padding:'8px 10px',
                      fontWeight:900,
                      background:p[key] ? '#0f172a' : '#fff',
                      color:p[key] ? '#fff' : '#0f172a',
                    }}
                  >
                    {key.replace('can_','')}: {p[key] ? 'yes' : 'no'}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div style={{padding:12,borderRadius:14,background:'#eff6ff',color:'#1e3a8a',fontWeight:800}}>
        {status}
      </div>
    </section>
  );
}
