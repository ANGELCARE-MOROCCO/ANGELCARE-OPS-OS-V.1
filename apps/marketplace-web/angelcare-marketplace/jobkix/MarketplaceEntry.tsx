import type { ReactNode } from 'react';
import s from './marketplace-entry.module.css';

/** The brand pair deliberately stays physically LTR in Arabic Marketplace.
 * This is a shortcut outside the twelve-storefront registry. */
export function MarketplaceBrandPair({children}:{children:ReactNode}){
 return <span className={s.pair} dir="ltr">{children}<a href="/jobkix/en" className={s.entry} aria-label="JOBKIX · GLOBAL CAREERS PLATFORM"><img src="/jobkix/brand/jobkix-logo-color.png" width={1349} height={518} alt="JOBKIX · GLOBAL CAREERS PLATFORM"/></a></span>;
}
