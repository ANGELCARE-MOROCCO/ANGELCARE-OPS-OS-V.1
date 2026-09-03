import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { authorizeDemoPin, DEMO_COOKIE } from '@/lib/sanila-demo/authority'

export const dynamic = 'force-dynamic'

export default async function SanilaDemoAccessPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const error = (await searchParams)?.error
  async function submit(formData: FormData) {
    'use server'
    const pin = String(formData.get('pin') || '').replace(/\s+/g, '')
    if (!/^\d{8}$/.test(pin)) redirect('/angelcare-marketplace/fr/sanila/demo-access?error=invalid')
    const requestHeaders = await headers()
    const result = await authorizeDemoPin(pin, { ip: requestHeaders.get('x-forwarded-for'), userAgent: requestHeaders.get('user-agent') })
    if (!result.ok) redirect('/angelcare-marketplace/fr/sanila/demo-access?error=invalid')
    const store = await cookies()
    store.set(DEMO_COOKIE, result.sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', priority: 'high', path: '/', maxAge: Math.max(60, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)) })
    redirect('/angelcare-360-command-center')
  }
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(145deg,#f5f8fb,#fff)', color: '#17324d', padding: 24 }}><form action={submit} style={{ width: 'min(100%,420px)', background: '#fff', border: '1px solid #dce6ef', borderRadius: 24, padding: 32, boxShadow: '0 24px 70px rgba(27,58,87,.12)' }}><div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.16em', color: '#55728e' }}>SANILA</div><h1 style={{ margin: '12px 0 8px', fontSize: 30 }}>Accès à votre démonstration</h1><p style={{ color: '#6f8192', lineHeight: 1.6, fontSize: 13 }}>Entrez le code d’accès transmis par AngelCare.</p>{error ? <p role="alert" style={{ color: '#a22e3a', background: '#fff1f2', padding: 10, borderRadius: 10, fontSize: 12 }}>Code invalide, expiré ou indisponible.</p> : null}<label style={{ display: 'grid', gap: 8, marginTop: 22, fontSize: 12, fontWeight: 800 }}><span>Code d’accès</span><input name="pin" inputMode="numeric" pattern="[0-9]{8}" minLength={8} maxLength={8} required autoComplete="one-time-code" style={{ height: 52, border: '1px solid #cbd9e5', borderRadius: 12, padding: '0 14px', fontSize: 20, letterSpacing: '.2em' }} /></label><button type="submit" style={{ width: '100%', marginTop: 20, height: 50, border: 0, borderRadius: 12, background: '#173f63', color: '#fff', fontWeight: 900 }}>Accéder à SANILA</button></form></main>
}
