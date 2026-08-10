import Link from 'next/link'

export default function Angelcare360UnauthorizedPage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#f8fafc',
      padding: 32,
      fontFamily: 'Arial, sans-serif',
    }}>
      <section style={{
        width: 'min(640px, 100%)',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 24,
        padding: 32,
        boxShadow: '0 24px 70px rgba(15,23,42,.10)',
      }}>
        <div style={{fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: '.08em'}}>
          ANGELCARE 360
        </div>
        <h1 style={{fontSize: 28, margin: '12px 0', color: '#0f172a'}}>
          Accès non autorisé
        </h1>
        <p style={{color: '#475569', lineHeight: 1.6}}>
          Votre session est active, mais votre rôle ne possède pas l’autorisation requise pour cette zone.
        </p>
        <Link href="/angelcare-360-command-center" style={{color: '#1d4ed8', fontWeight: 800}}>
          Retour au Command Center
        </Link>
      </section>
    </main>
  )
}
