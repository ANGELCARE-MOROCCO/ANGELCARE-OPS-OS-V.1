import Link from 'next/link'

export function HRHero({ title, subtitle, actions }: any) {
  return (
    <section style={{
      borderRadius: 32,
      padding: 30,
      color: 'white',
      background: 'linear-gradient(135deg,#020617,#1e3a8a 55%,#6d28d9)',
      boxShadow: '0 28px 90px rgba(30,58,138,.34)',
      marginBottom: 24
    }}>
      <div style={{fontSize:12,fontWeight:950,letterSpacing:1.2,textTransform:'uppercase',opacity:.9}}>AngelCare HR MAX</div>
      <h1 style={{fontSize:44,lineHeight:1.05,margin:'12px 0 10px',fontWeight:950}}>{title}</h1>
      <p style={{fontSize:17,lineHeight:1.7,maxWidth:900,opacity:.86,margin:0,fontWeight:650}}>{subtitle}</p>
      {actions && <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:18}}>{actions}</div>}
    </section>
  )
}

export function HRButton({ href, children, variant='dark' }: any) {
  const style = {
    display:'inline-flex',
    alignItems:'center',
    justifyContent:'center',
    padding:'11px 14px',
    borderRadius:15,
    textDecoration:'none',
    fontWeight:950,
    background: variant === 'light' ? 'white' : variant === 'blue' ? '#2563eb' : '#0f172a',
    color: variant === 'light' ? '#0f172a' : 'white',
    border: variant === 'light' ? '1px solid #e2e8f0' : '1px solid transparent'
  }
  return href ? <Link href={href} style={style}>{children}</Link> : <button style={{...style,cursor:'pointer'}}>{children}</button>
}

export function HRMetric({ label, value, detail, tone='#2563eb' }: any) {
  return (
    <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:24,padding:20,boxShadow:'0 18px 60px rgba(15,23,42,.08)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:14}}>
        <div>
          <div style={{fontSize:12,fontWeight:950,textTransform:'uppercase',letterSpacing:.8,color:'#64748b'}}>{label}</div>
          <div style={{fontSize:34,fontWeight:950,color:'#0f172a',marginTop:8}}>{value}</div>
        </div>
        <div style={{width:48,height:48,borderRadius:18,background:tone,boxShadow:'0 14px 32px rgba(15,23,42,.18)'}} />
      </div>
      <p style={{margin:'10px 0 0',color:'#475569',fontWeight:700,lineHeight:1.45}}>{detail}</p>
    </div>
  )
}

export function HRGrid({ children, min=220 }: any) {
  return <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${min}px,1fr))`,gap:16}}>{children}</div>
}

export function HRPanel({ title, subtitle, children, right }: any) {
  return (
    <section style={{background:'rgba(255,255,255,.97)',border:'1px solid #e2e8f0',borderRadius:28,padding:22,boxShadow:'0 20px 70px rgba(15,23,42,.08)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'start',marginBottom:18}}>
        <div>
          <div style={{fontSize:12,fontWeight:950,color:'#2563eb',letterSpacing:1,textTransform:'uppercase'}}>Operational Control</div>
          <h2 style={{margin:'5px 0 3px',fontSize:24,color:'#0f172a'}}>{title}</h2>
          {subtitle && <p style={{margin:0,color:'#64748b',fontWeight:650,lineHeight:1.5}}>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

export function HRRow({ title, meta, status, href }: any) {
  const content = (
    <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
      <div style={{minWidth:0}}>
        <div style={{fontWeight:950,color:'#0f172a'}}>{title || 'Untitled record'}</div>
        <div style={{fontSize:13,color:'#64748b',fontWeight:700,marginTop:3}}>{meta || 'No metadata'}</div>
      </div>
      <span style={{background:'#eff6ff',color:'#1d4ed8',border:'1px solid #bfdbfe',borderRadius:999,padding:'6px 10px',fontSize:12,fontWeight:950,textTransform:'capitalize'}}>{status || 'open'}</span>
    </div>
  )
  return href ? <Link href={href} style={{textDecoration:'none'}}>{content}</Link> : content
}

export function HRInput({ name, label, type='text', required=false, defaultValue='', placeholder='' }: any) {
  return <label style={{display:'grid',gap:7,fontWeight:850,color:'#0f172a'}}>
    <span style={{fontSize:13}}>{label}</span>
    <input name={name} type={type} required={required} defaultValue={defaultValue || ''} placeholder={placeholder} style={{height:42,borderRadius:14,border:'1px solid #cbd5e1',padding:'0 12px',fontWeight:700,outline:'none'}} />
  </label>
}

export function HRTextarea({ name, label, defaultValue='', placeholder='' }: any) {
  return <label style={{display:'grid',gap:7,fontWeight:850,color:'#0f172a'}}>
    <span style={{fontSize:13}}>{label}</span>
    <textarea name={name} defaultValue={defaultValue || ''} placeholder={placeholder} rows={4} style={{borderRadius:14,border:'1px solid #cbd5e1',padding:12,fontWeight:700,outline:'none',resize:'vertical'}} />
  </label>
}

export function HRSelect({ name, label, options=[], defaultValue='' }: any) {
  return <label style={{display:'grid',gap:7,fontWeight:850,color:'#0f172a'}}>
    <span style={{fontSize:13}}>{label}</span>
    <select name={name} defaultValue={defaultValue || options[0] || ''} style={{height:42,borderRadius:14,border:'1px solid #cbd5e1',padding:'0 12px',fontWeight:800,outline:'none',background:'white'}}>
      {options.map((o:any)=><option key={String(o)} value={String(o)}>{String(o).replaceAll('_',' ')}</option>)}
    </select>
  </label>
}

export function HRSubmit({ children='Save' }: any) {
  return <button type="submit" style={{border:0,borderRadius:16,background:'#0f172a',color:'white',padding:'12px 16px',fontWeight:950,cursor:'pointer',boxShadow:'0 16px 34px rgba(15,23,42,.18)'}}>{children}</button>
}

export const formGrid: React.CSSProperties = {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}
