'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Student = { id: string; name: string; code?: string | null }

export default function StudentDocumentVaultUpload({ students }: { students: Student[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const ordered = useMemo(() => [...students].sort((a,b)=>a.name.localeCompare(b.name,'fr')), [students])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(null); setSuccess(null)
    try {
      const form = new FormData(event.currentTarget)
      const response = await fetch('/api/angelcare360/student-documents', { method: 'POST', body: form })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Téléversement impossible.')
      setSuccess(`Document enregistré · ${payload.documentCode}`)
      event.currentTarget.reset()
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Téléversement impossible.')
    } finally { setBusy(false) }
  }

  return (
    <div style={{position:'relative'}}>
      <button type="button" onClick={()=>setOpen(v=>!v)} style={primaryButtonStyle}>Téléverser un document élève</button>
      {open ? <div style={panelStyle}>
        <div style={{fontWeight:950,fontSize:15,color:'#153052'}}>Coffre documentaire privé</div>
        <div style={{fontSize:11,color:'#6c7c92',lineHeight:1.5,margin:'5px 0 13px'}}>PDF, JPEG ou PNG · 15 MiB maximum · contrôle du contenu, empreinte SHA-256 et accès privé.</div>
        <form onSubmit={submit} style={{display:'grid',gap:9}}>
          <select required name="studentId" style={inputStyle} defaultValue=""><option value="" disabled>Choisir l’élève</option>{ordered.map(s=><option key={s.id} value={s.id}>{s.name}{s.code?` · ${s.code}`:''}</option>)}</select>
          <input required name="title" placeholder="Titre du document" style={inputStyle}/>
          <select name="category" style={inputStyle} defaultValue="dossier-eleve"><option value="dossier-eleve">Dossier élève</option><option value="identite">Identité</option><option value="medical">Santé / médical</option><option value="inscription">Inscription</option><option value="autorisation">Autorisation</option><option value="pedagogique">Pédagogique</option></select>
          <select name="visibility" style={inputStyle} defaultValue="internal"><option value="internal">Interne établissement</option><option value="family">Visible famille autorisée</option><option value="student">Visible élève</option><option value="restricted">Accès restreint</option></select>
          <input ref={fileRef} required name="file" type="file" accept="application/pdf,image/jpeg,image/png" style={inputStyle}/>
          {error ? <div style={{color:'#a8323e',fontSize:11,fontWeight:800}}>{error}</div> : null}
          {success ? <div style={{color:'#087151',fontSize:11,fontWeight:850}}>{success}</div> : null}
          <button disabled={busy} type="submit" style={{...primaryButtonStyle,opacity:busy?.65:1}}>{busy?'Sécurisation en cours…':'Sécuriser dans le coffre'}</button>
        </form>
      </div> : null}
    </div>
  )
}

const primaryButtonStyle: React.CSSProperties={border:0,borderRadius:14,padding:'11px 14px',background:'linear-gradient(135deg,#184f9d,#246ad3)',color:'#fff',fontWeight:900,cursor:'pointer',boxShadow:'0 10px 24px rgba(35,91,170,.18)'}
const panelStyle: React.CSSProperties={position:'absolute',zIndex:40,right:0,top:'calc(100% + 10px)',width:360,maxWidth:'86vw',padding:16,border:'1px solid #dbe5f1',borderRadius:20,background:'#fff',boxShadow:'0 24px 70px rgba(25,50,85,.2)'}
const inputStyle: React.CSSProperties={width:'100%',boxSizing:'border-box',border:'1px solid #d8e1ec',borderRadius:12,padding:'10px 11px',background:'#fbfdff',color:'#1a2f4d',fontSize:12}
