'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'

export function AdminLogoutButton() {
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
  return <button type="button" onClick={logout} disabled={busy} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:10,padding:'10px 12px',border:'1px solid rgba(255,255,255,.14)',background:'transparent',color:'inherit',font:'inherit',fontSize:12,fontWeight:800,cursor:busy?'wait':'pointer',opacity:busy ? 0.6 : 1}}><LogOut size={15}/>{busy?'Déconnexion…':'Déconnexion'}</button>
}
