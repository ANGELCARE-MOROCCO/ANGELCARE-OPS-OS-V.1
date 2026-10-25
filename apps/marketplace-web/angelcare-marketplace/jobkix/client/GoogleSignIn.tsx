import type { Locale } from '../contracts';
import type { AuthIntent } from '../auth-navigation';
import s from '../jobkix.module.css';

// Official Google-produced complete sign-in button artwork (not a reconstructed logo).
// https://developers.google.com/identity/branding-guidelines
const OFFICIAL_GOOGLE_BUTTON = 'https://developers.google.com/static/identity/images/branding_guideline_sample_lt_rd_lg.png';
const CONTINUE_GOOGLE: Record<Locale, string> = {
 en:'Sign in with Google', fr:'Se connecter avec Google', es:'Iniciar sesión con Google',
 hi:'Google से साइन इन करें', tl:'Mag-sign in gamit ang Google',
 id:'Login dengan Google', ar:'تسجيل الدخول باستخدام Google'
};
const OR_EMAIL: Record<Locale, string> = {
 en:'or use your email', fr:'ou utilisez votre e-mail', es:'o usa tu correo electrónico',
 hi:'या अपने ईमेल का उपयोग करें', tl:'o gamitin ang iyong email',
 id:'atau gunakan email Anda', ar:'أو استخدم بريدك الإلكتروني'
};

export function GoogleSignIn({locale,intent,next,disabled=false}:{locale:Locale;intent:AuthIntent;next:string;disabled?:boolean}){
 const params = new URLSearchParams({locale,intent,next});
 const graphic = <img src={OFFICIAL_GOOGLE_BUTTON} alt="" width="360" height="76" decoding="async" referrerPolicy="no-referrer" />;
 return <div className={s.googleAuthArea}>
  {disabled
   ? <span className={s.googleAuthButton} aria-disabled="true" role="button" aria-label={CONTINUE_GOOGLE[locale]}>{graphic}</span>
   : <a className={s.googleAuthButton} href={'/api/jobkix/auth/google?'+params.toString()} rel="nofollow" aria-label={CONTINUE_GOOGLE[locale]}>{graphic}</a>}
  <div className={s.googleAuthDivider} aria-hidden="true"><span>{OR_EMAIL[locale]}</span></div>
 </div>;
}
