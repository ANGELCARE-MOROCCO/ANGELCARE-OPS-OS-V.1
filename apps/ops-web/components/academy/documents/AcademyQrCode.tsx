export default function AcademyQrCode({ src, label = 'Scannez pour vérifier' }: { src?: string | null; label?: string }) {
  if (!src) return null
  return <div style={{display:'grid',gap:6,justifyItems:'center'}}>
    <img src={src} alt="Document QR verification code" style={{width:110,height:110,border:'1px solid #e2e8f0',borderRadius:8,padding:6,background:'#fff'}} />
    <small style={{fontSize:10,fontWeight:900,color:'#64748b',textTransform:'uppercase'}}>{label}</small>
  </div>
}
