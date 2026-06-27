import AngelCareLogo from '@/components/brand/AngelCareLogo'
import { redirect } from 'next/navigation'
import { loginCareLinkMobileAgent, careLinkMobileLoginErrorMessage } from '@/lib/carelink/mobile-login-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type LoginSearchParams = Promise<Record<string, string | string[] | undefined>>

const ADMIN_SUPPORT_PHONE_DISPLAY = '+212 5 37 58 14 62'
const ADMIN_SUPPORT_PHONE_LINK = '+212537581462'
const WHATSAPP_SUPPORT_MESSAGE =
  "Bonjour ANGELCARE, j'ai besoin d'assistance pour ma connexion CARELINK Mobile. Merci de m'aider pour l'accès agent terrain."
const WHATSAPP_SUPPORT_LINK = `https://wa.me/2126723211143?text=${encodeURIComponent(WHATSAPP_SUPPORT_MESSAGE)}`

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function sanitizeError(value: string | undefined) {
  if (!value) return ''
  return value.slice(0, 180)
}

function SupportAction({
  href,
  label,
  sublabel,
  variant = 'default',
}: {
  href: string
  label: string
  sublabel: string
  variant?: 'default' | 'whatsapp'
}) {
  const isExternal = href.startsWith('http')
  const tone =
    variant === 'whatsapp'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
      : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      className={`flex h-16 items-center justify-between rounded-2xl border px-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}
    >
      <span>
        <span className="block text-sm font-black leading-4">{label}</span>
        <span className="mt-1 block text-[11px] font-bold text-slate-500">{sublabel}</span>
      </span>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm">
        {variant === 'whatsapp' ? '↗' : '☎'}
      </span>
    </a>
  )
}

export default async function CareLinkMobileLoginPage({ searchParams }: { searchParams?: LoginSearchParams }) {
  const params = searchParams ? await searchParams : {}
  const errorMessage = sanitizeError(firstParam(params.error))

  async function loginAction(formData: FormData) {
    'use server'

    let redirectTo = '/carelink'

    try {
      const identifier = String(formData.get('identifier') || '')
      const password = String(formData.get('password') || '')
      const result = await loginCareLinkMobileAgent({ identifier, password })
      redirectTo = result.redirectTo
    } catch (error) {
      const message = encodeURIComponent(careLinkMobileLoginErrorMessage(error))
      redirect(`/carelink/login?error=${message}`)
    }

    redirect(redirectTo)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(219,234,254,.72),_transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 text-slate-950">
      <section className="w-full max-w-[430px] rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-[0_34px_95px_rgba(15,23,42,.14)] ring-1 ring-slate-100 backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-[26px] border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <AngelCareLogo size="md" showText />
          </div>

          <p className="mt-7 text-[11px] font-black uppercase tracking-[.28em] text-blue-700">
            CareLink AngelCare OS
          </p>
          <h1 className="mt-3 text-3xl font-black leading-none tracking-[-.055em] text-slate-950">
            Connexion agent
          </h1>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-5 text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <form action={loginAction} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-[.18em] text-slate-500">Login email</span>
            <input
              name="identifier"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="agent@angelcare.ma"
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-extrabold text-slate-950 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-[.18em] text-slate-500">Mot de passe</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-extrabold text-slate-950 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            />
          </label>

          <button
            type="submit"
            className="h-14 w-full rounded-2xl bg-slate-950 text-sm font-black uppercase tracking-[.2em] text-white shadow-[0_18px_42px_rgba(15,23,42,.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_22px_50px_rgba(15,23,42,.26)]"
          >
            Ouvrir CareLink
          </button>
        </form>

        <div className="mt-5 grid gap-3">
          <SupportAction
            href={`tel:${ADMIN_SUPPORT_PHONE_LINK}`}
            label="Appeler ANGELCARE Admin"
            sublabel={ADMIN_SUPPORT_PHONE_DISPLAY}
          />
          <SupportAction
            href={WHATSAPP_SUPPORT_LINK}
            label="WhatsApp Support"
            sublabel="Assistance login"
            variant="whatsapp"
          />
        </div>
      </section>
    </main>
  )
}
