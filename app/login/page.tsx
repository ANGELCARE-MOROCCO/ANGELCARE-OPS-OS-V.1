import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE, generateSessionToken } from '@/lib/auth/session'

export default function LoginPage() {
  async function loginAction(formData: FormData) {
    'use server'
    console.log('LOGIN ACTION TRIGGERED')
    const username = String(formData.get('username') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')

    if (!username || !password) throw new Error('Nom utilisateur et mot de passe obligatoires.')

    const supabase = await createClient()

    const { data: rawUser, error } = await supabase
  .rpc('login_app_user', {
    input_username: username,
    input_password: password,
  })
  .maybeSingle()

const user = rawUser as { id: string } | null

if (error) throw new Error(error.message)
if (!user) throw new Error('Identifiants incorrects.')

    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000)

    const { error: sessionError } = await supabase.from('app_sessions').insert([
      { user_id: user.id, session_token: token, expires_at: expiresAt.toISOString() },
    ])

    if (sessionError) throw new Error(sessionError.message)

    await supabase.from('app_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id)

    const cookieStore = await cookies()
    cookieStore.set(APP_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    })

    redirect('/')
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={brandStyle}>AngelCare OpsOS</div>
        <h1 style={titleStyle}>Connexion équipe</h1>
        <p style={textStyle}>Accès réservé aux utilisateurs créés par CEO ou Manager.</p>

        <form action={loginAction} style={formStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Nom utilisateur</span>
            <input name="username" placeholder="ex: sara.ops" autoComplete="username" style={inputStyle} />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Mot de passe</span>
            <input name="password" type="password" placeholder="••••••••" autoComplete="current-password" style={inputStyle} />
          </label>

          <button type="submit" style={buttonStyle}>Se connecter</button>
        </form>

        <div style={securityBoxStyle}>🔐 Session sécurisée • rôle contrôlé • accès interne AngelCare</div>
      </section>
    </main>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at top left,#1d4ed8 0,#0f172a 45%,#020617 100%)', fontFamily: 'Inter, Arial, sans-serif', padding: 24 }
const cardStyle: React.CSSProperties = { width: '100%', maxWidth: 430, background: '#fff', borderRadius: 28, padding: 30, boxShadow: '0 34px 90px rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.18)' }
const brandStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 950, fontSize: 13, marginBottom: 16 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 30, fontWeight: 950 }
const textStyle: React.CSSProperties = { color: '#64748b', lineHeight: 1.6, fontWeight: 700, margin: '10px 0 22px' }
const formStyle: React.CSSProperties = { display: 'grid', gap: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const labelStyle: React.CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '14px 15px', borderRadius: 14, border: '1px solid #cbd5e1', color: '#0f172a', fontSize: 15 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 16, background: '#0f172a', color: '#fff', padding: '15px 16px', fontWeight: 950, cursor: 'pointer', marginTop: 4 }
const securityBoxStyle: React.CSSProperties = { marginTop: 18, padding: 13, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 800, fontSize: 13 }
