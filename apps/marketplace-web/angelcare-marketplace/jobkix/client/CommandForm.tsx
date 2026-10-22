'use client';
import { forwardRef,type ComponentPropsWithoutRef } from 'react';
import type { Locale } from '../contracts';
import { useInteractive } from './RuntimeClock';
import { t } from '../i18n';
/** Native DOM/layout is retained. Inert prevents pre-hydration submissions from
 * losing context; POST ensures a native fallback never puts authored fields in
 * the URL. API origin/session/input/version/idempotency guards are unchanged. */
export const CommandForm=forwardRef<HTMLFormElement,ComponentPropsWithoutRef<'form'>&{locale:Locale}>(function CommandForm({locale,onSubmit,children,...props},ref){
 const ready=useInteractive();
 return <form {...props} ref={ref} method={props.method||'post'} inert={!ready} aria-busy={!ready||props['aria-busy']} onSubmit={event=>{if(!ready){event.preventDefault();return;}onSubmit?.(event);}}>{children}<noscript><p>{t(locale,'unavailable')}</p></noscript></form>;
});
