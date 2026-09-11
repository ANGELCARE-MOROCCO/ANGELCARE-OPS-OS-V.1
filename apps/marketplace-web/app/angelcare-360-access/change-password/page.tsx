import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { APP_SESSION_COOKIE, APP_SESSION_COOKIE_DOMAIN, getCurrentAppUser, hashPassword, verifyPassword } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function strongPassword(value: string) {
  return value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)
}

export default async function ChangePasswordPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentAppUser()
  if (!user) redirect('/angelcare-360-access/login')
  const params = (await searchParams) || {}
  const error = typeof params.error === 'string' ? params.error : ''

  async function changePassword(formData: FormData) {
    'use server'
    const current = await getCurrentAppUser()
    if (!current) redirect('/angelcare-360-access/login')
    const currentPassword = String(formData.get('currentPassword') || '')
    const password = String(formData.get('password') || '')
    const confirmation = String(formData.get('confirmation') || '')
    if (password !== confirmation) redirect('/angelcare-360-access/change-password?error=confirmation')
    if (!strongPassword(password)) redirect('/angelcare-360-access/change-password?error=policy')
    if (!(await verifyPassword(currentPassword, String((current as { password_hash?: unknown }).password_hash || '')))) {
      redirect('/angelcare-360-access/change-password?error=current')
    }
    if (await verifyPassword(password, String((current as { password_hash?: unknown }).password_hash || ''))) {
      redirect('/angelcare-360-access/change-password?error=reuse')
    }

    const db = await createServiceClient()
    const passwordHash = await hashPassword(password)
    const update = await db.from('app_users').update({ password_hash: passwordHash, must_change_password: false }).eq('id', current.id).select('id').single()
    if (update.error) redirect('/angelcare-360-access/change-password?error=save')
    const revoke = await db.from('app_sessions').delete().eq('user_id', current.id)
    if (revoke.error) redirect('/angelcare-360-access/change-password?error=session')
    const store = await cookies()
    store.set(APP_SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date(0) })
    if (APP_SESSION_COOKIE_DOMAIN) store.set(APP_SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', domain: APP_SESSION_COOKIE_DOMAIN, expires: new Date(0) })
    redirect('/angelcare-360-access/login?password_changed=1')
  }

  const messages: Record<string, string> = {
    confirmation: 'Les deux nouveaux mots de passe ne correspondent pas.',
    policy: '12 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial.',
    current: 'Le mot de passe actuel est incorrect.',
    reuse: 'Choisissez un mot de passe différent du mot de passe actuel.',
    save: 'Le nouveau mot de passe n’a pas pu être enregistré.',
    session: 'Le mot de passe a changé mais la révocation des sessions a échoué. Contactez AngelCare.',
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">SANILA · Sécurité du compte</p>
        <h1 className="mt-3 text-3xl font-semibold">Changer votre mot de passe</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Votre politique d’accès exige un nouveau mot de passe avant de poursuivre.</p>
        {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{messages[error] || 'Action impossible.'}</div> : null}
        <form action={changePassword} className="mt-7 space-y-4">
          <label className="block text-sm font-medium">Mot de passe actuel<input name="currentPassword" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label className="block text-sm font-medium">Nouveau mot de passe<input name="password" type="password" required autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label className="block text-sm font-medium">Confirmer<input name="confirmation" type="password" required autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <button type="submit" className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white">Enregistrer et reconnecter</button>
        </form>
      </section>
    </main>
  )
}
