import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial', padding: 24 }}>
      <section style={{ maxWidth: 520, background: '#fff', padding: 28, borderRadius: 24, border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <h1 style={{ color: '#0f172a' }}>Accès refusé</h1>
        <p style={{ color: '#64748b', lineHeight: 1.6 }}>Votre rôle ne permet pas d’accéder à cette section.</p>
        <Link href="/" style={{ display: 'inline-flex', padding: '12px 16px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 900 }}>Retour</Link>
      </section>
    </main>
  )
}
