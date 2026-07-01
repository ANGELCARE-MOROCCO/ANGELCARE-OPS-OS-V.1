import AngelCareLogo from '@/components/brand/AngelCareLogo'
import { redirect } from 'next/navigation'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function loginErrorMessage(code?: string) {
  switch (code) {
    case 'missing_credentials':
      return 'Email et mot de passe obligatoires.'
    case 'invalid_credentials':
      return 'Identifiants TrainingHub incorrects.'
    case 'not_bridged':
      return "Ce compte Supabase Auth existe, mais il n'est pas encore relié à TrainingHub. Vérifiez core_user_profiles, core_memberships et le rôle."
    case 'inactive_profile':
      return 'Votre profil TrainingHub existe mais il est inactif.'
    case 'no_membership':
      return "Votre profil TrainingHub n'a aucune organisation active."
    case 'callback_failed':
      return "Le lien d'authentification TrainingHub n'a pas pu être validé."
    case 'session_required':
      return 'Connectez-vous à TrainingHub pour continuer.'
    default:
      return ''
  }
}

export default async function TrainingHubLoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {}
  const errorCode = firstParam(params.error)
  const message = loginErrorMessage(errorCode)
  const loggedOut = firstParam(params.logged_out) === '1'

  async function trainingHubLoginAction(formData: FormData) {
    'use server'

    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')

    if (!email || !password) {
      redirect('/traininghub/login?error=missing_credentials')
    }

    const supabase = await createTrainingHubUserClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user?.id) {
      redirect('/traininghub/login?error=invalid_credentials')
    }

    const { data: profile, error: profileError } = await supabase
      .from('core_user_profiles')
      .select('id, status')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (profileError || !profile?.id) {
      await supabase.auth.signOut()
      redirect('/traininghub/login?error=not_bridged')
    }

    if (profile.status !== 'active') {
      await supabase.auth.signOut()
      redirect('/traininghub/login?error=inactive_profile')
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('core_memberships')
      .select('id')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .limit(1)

    if (membershipError || !memberships?.length) {
      await supabase.auth.signOut()
      redirect('/traininghub/login?error=no_membership')
    }

    redirect('/traininghub')
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={leftPanelStyle}>
          <div style={eyebrowStyle}>ANGELCARE TRAININGHUB</div>
          <h1 style={headlineStyle}>Connexion dédiée Academy, partenaires & trainers.</h1>
          <p style={subTextStyle}>
            Cette porte d’accès est séparée de l’OpsOS interne. Elle utilise Supabase Auth, les profils TrainingHub, les organisations, les rôles RBAC et les droits commerciaux.
          </p>
          <div style={signalGridStyle}>
            <div style={signalCardStyle}><strong>Training OS</strong><span>Login séparé</span></div>
            <div style={signalCardStyle}><strong>RBAC</strong><span>Rôles avancés</span></div>
            <div style={signalCardStyle}><strong>RLS</strong><span>Isolation partenaires</span></div>
          </div>
        </div>

        <section style={cardStyle}>
          <div style={brandRowStyle}>
            <AngelCareLogo size="lg" showText />
            <div>
              <div style={brandStyle}>TrainingHub</div>
              <div style={brandSubStyle}>Dedicated Secure Gateway</div>
            </div>
          </div>

          <h2 style={titleStyle}>Connexion TrainingHub</h2>
          <p style={textStyle}>Accès Academy interne, partenaire école, trainer ou participant staff.</p>

          {loggedOut ? <div style={successBoxStyle}>Session TrainingHub fermée proprement.</div> : null}
          {message ? <div style={errorBoxStyle}>{message}</div> : null}

          <form action={trainingHubLoginAction} style={formStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Email TrainingHub</span>
              <input name="email" type="email" placeholder="ex: partenaires@angelcarehub.ma" autoComplete="email" style={inputStyle} />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Mot de passe</span>
              <input name="password" type="password" placeholder="••••••••" autoComplete="current-password" style={inputStyle} />
            </label>

            <button type="submit" style={buttonStyle}>Se connecter</button>
          </form>

          <div style={securityBoxStyle}>🔐 Supabase Auth • core_user_profiles • memberships • RBAC/RLS</div>
        </section>
      </section>
    </main>
  )
}

const pageStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: 'linear-gradient(135deg, #f8fafc 0%, #eef6ff 48%, #fefefe 100%)',
  fontFamily: 'Inter, Arial, sans-serif',
}

const shellStyle = {
  width: '100%',
  maxWidth: 1120,
  display: 'grid',
  gridTemplateColumns: '1.1fr 430px',
  gap: 28,
  alignItems: 'center',
}

const leftPanelStyle = { color: '#0f172a' }

const eyebrowStyle = {
  display: 'inline-flex',
  padding: '9px 13px',
  borderRadius: 999,
  background: '#ffffff',
  border: '1px solid #dbeafe',
  color: '#1d4ed8',
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: '.08em',
  marginBottom: 18,
}

const headlineStyle = {
  margin: 0,
  maxWidth: 640,
  fontSize: 52,
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: '-.045em',
  color: '#0f172a',
}

const subTextStyle = {
  maxWidth: 620,
  color: '#475569',
  fontSize: 17,
  lineHeight: 1.75,
  fontWeight: 700,
  margin: '18px 0 26px',
}

const signalGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 12,
  maxWidth: 650,
}

const signalCardStyle = {
  minHeight: 82,
  padding: 15,
  borderRadius: 20,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  boxShadow: '0 24px 70px rgba(15,23,42,.08)',
  display: 'grid',
  gap: 5,
  color: '#0f172a',
}

const cardStyle = {
  width: '100%',
  borderRadius: 30,
  background: '#ffffff',
  border: '1px solid #dbeafe',
  boxShadow: '0 30px 100px rgba(15,23,42,.14)',
  padding: 30,
}

const brandRowStyle = { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 24 }
const brandStyle = { fontSize: 18, fontWeight: 950, color: '#0f172a' }
const brandSubStyle = { fontSize: 12, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase' as const, letterSpacing: '.08em' }
const titleStyle = { margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 950, letterSpacing: '-.03em' }
const textStyle = { color: '#64748b', lineHeight: 1.6, fontWeight: 700, margin: '8px 0 18px' }
const formStyle = { display: 'grid', gap: 14 }
const fieldStyle = { display: 'grid', gap: 7 }
const labelStyle = { color: '#334155', fontSize: 13, fontWeight: 900 }
const inputStyle = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: 16,
  padding: '13px 14px',
  fontSize: 15,
  outline: 'none',
  color: '#0f172a',
  background: '#f8fafc',
}
const buttonStyle = {
  border: 0,
  borderRadius: 18,
  padding: '14px 16px',
  background: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
  fontSize: 15,
  boxShadow: '0 18px 45px rgba(29,78,216,.25)',
}
const securityBoxStyle = {
  marginTop: 16,
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: 13,
  color: '#475569',
  fontWeight: 800,
  fontSize: 13,
}
const errorBoxStyle = {
  marginBottom: 14,
  borderRadius: 16,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: 13,
  color: '#991b1b',
  fontWeight: 850,
  fontSize: 13,
}
const successBoxStyle = {
  marginBottom: 14,
  borderRadius: 16,
  background: '#ecfdf5',
  border: '1px solid #bbf7d0',
  padding: 13,
  color: '#166534',
  fontWeight: 850,
  fontSize: 13,
}
