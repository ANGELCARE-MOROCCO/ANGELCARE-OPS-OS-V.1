import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'
import { getFirstAllowedRoute } from '@/lib/auth/permissions'

type LoginUser = {
  id: string
  role?: string | null
  permissions?: string[] | null
}

export default function LoginPage() {
  async function loginAction(formData: FormData) {
    'use server'

    const username = String(formData.get('username') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')

    if (!username || !password) {
      throw new Error('Nom utilisateur et mot de passe obligatoires.')
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('login_app_user', {
      input_username: username,
      input_password: password,
    })

    if (error) throw new Error(error.message)

    const rpcUser = Array.isArray(data) ? (data[0] as LoginUser | undefined) : (data as LoginUser | null)

    if (!rpcUser?.id) {
      throw new Error('Identifiants incorrects.')
    }

    const { data: fullUser, error: fullUserError } = await supabase
      .from('app_users')
      .select('id, role, permissions')
      .eq('id', rpcUser.id)
      .single()

    if (fullUserError) throw new Error(fullUserError.message)

    const user = fullUser as LoginUser

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000)

    const { error: sessionError } = await supabase.from('app_sessions').insert({
      user_id: user.id,
      session_token: token,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) throw new Error(sessionError.message)

    await supabase
      .from('app_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    const cookieStore = await cookies()

    cookieStore.set(APP_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    })

    const redirectTo = getFirstAllowedRoute(user)
    redirect(redirectTo)
  }

  return (
    <main style={pageStyle}>
      <div style={backgroundImageStyle} />
      <div style={backgroundOverlayStyle} />

      <section style={shellStyle}>
        <div style={leftPanelStyle}>
          <div style={systemBadgeStyle}>ANGELCARE INTERNAL ACCESS</div>
          <h2 style={headlineStyle}>Operations OS sécurisé pour équipes autorisées.</h2>
          <p style={headlineTextStyle}>
            Connexion contrôlée par rôle, permissions et session interne. L’accès est réservé aux utilisateurs créés et validés par la direction.
          </p>

          <div style={signalGridStyle}>
            <div style={signalCardStyle}>
              <strong>OpsOS</strong>
              <span>Session contrôlée</span>
            </div>
            <div style={signalCardStyle}>
              <strong>12h</strong>
              <span>Expiration session</span>
            </div>
            <div style={signalCardStyle}>
              <strong>Role-based</strong>
              <span>Accès intelligent</span>
            </div>
          </div>
        </div>

        <section style={cardStyle}>
          <div style={brandRowStyle}>
            <div style={brandMarkStyle}>AC</div>
            <div>
              <div style={brandStyle}>AngelCare OpsOS</div>
              <div style={brandSubStyle}>Secure Team Gateway</div>
            </div>
          </div>

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
      </section>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  fontFamily: 'Inter, Arial, sans-serif',
  padding: 24,
  background: '#020617',
}

const backgroundImageStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: "url('/auth-bg.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  transform: 'scale(1.03)',
}

const backgroundOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(135deg, rgba(2,6,23,.88) 0%, rgba(15,23,42,.70) 42%, rgba(30,64,175,.62) 100%)',
  backdropFilter: 'blur(2px)',
}

const shellStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  width: '100%',
  maxWidth: 1120,
  display: 'grid',
  gridTemplateColumns: '1.1fr 430px',
  gap: 28,
  alignItems: 'center',
}

const leftPanelStyle: React.CSSProperties = {
  color: '#fff',
  padding: 12,
}

const systemBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '9px 13px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.12)',
  border: '1px solid rgba(255,255,255,.18)',
  color: '#dbeafe',
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: '.08em',
  marginBottom: 18,
}

const headlineStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 620,
  fontSize: 52,
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: '-.04em',
}

const headlineTextStyle: React.CSSProperties = {
  maxWidth: 610,
  color: '#cbd5e1',
  fontSize: 17,
  lineHeight: 1.75,
  fontWeight: 700,
  margin: '18px 0 26px',
}

const signalGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 12,
  maxWidth: 650,
}

const signalCardStyle: React.CSSProperties = {
  minHeight: 82,
  padding: 15,
  borderRadius: 20,
  background: 'rgba(255,255,255,.10)',
  border: '1px solid rgba(255,255,255,.16)',
  boxShadow: '0 24px 70px rgba(0,0,0,.20)',
  display: 'grid',
  gap: 5,
  color: '#fff',
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 430,
  background: 'rgba(255,255,255,.92)',
  backdropFilter: 'blur(20px)',
  borderRadius: 30,
  padding: 30,
  boxShadow: '0 34px 100px rgba(0,0,0,.36)',
  border: '1px solid rgba(255,255,255,.38)',
}

const brandRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 22,
}

const brandMarkStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 18,
  background: 'linear-gradient(135deg,#0f172a,#1d4ed8)',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 950,
  boxShadow: '0 16px 34px rgba(29,78,216,.28)',
}

const brandStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 950,
  fontSize: 15,
}

const brandSubStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: 800,
  fontSize: 12,
  marginTop: 2,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 30,
  fontWeight: 950,
}

const textStyle: React.CSSProperties = {
  color: '#64748b',
  lineHeight: 1.6,
  fontWeight: 700,
  margin: '10px 0 22px',
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
}

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const labelStyle: React.CSSProperties = {
  color: '#334155',
  fontWeight: 900,
  fontSize: 13,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 15px',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  color: '#0f172a',
  fontSize: 15,
  background: 'rgba(255,255,255,.84)',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 16,
  background: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
  color: '#fff',
  padding: '15px 16px',
  fontWeight: 950,
  cursor: 'pointer',
  marginTop: 4,
  boxShadow: '0 18px 34px rgba(15,23,42,.22)',
}

const securityBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 13,
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#475569',
  fontWeight: 800,
  fontSize: 13,
}