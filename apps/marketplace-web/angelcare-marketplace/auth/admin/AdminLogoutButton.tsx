'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'

export function AdminLogoutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false)
  async function logout() {
    if (busy) return
    setBusy(true)
    try {
      await fetch('/api/angelcare-marketplace/admin/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } finally {
      window.location.assign('/admin')
    }
  }
  return <button type="button" onClick={logout} disabled={busy} aria-label={busy ? 'Déconnexion en cours' : 'Déconnexion'} title={compact ? 'Déconnexion' : undefined} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:10,padding:'10px 12px',border:'1px solid #d8e2eb',borderRadius:9,background:'#fff',color:'#173650',font:'inherit',fontSize:12,fontWeight:800,cursor:busy?'wait':'pointer',opacity:busy ? 0.6 : 1}}><LogOut size={15}/>{compact?null:<span>{busy?'Déconnexion…':'Déconnexion'}</span>}</button>
}
