import { notFound } from 'next/navigation';
import { AngelCareLegalPage, legalMetadata } from '@/angelcare-marketplace/compliance/LegalPage';
import type { LegalLocale } from '@/angelcare-marketplace/compliance/legal-policy';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string }> };
async function localeFrom({ params }: Props): Promise<LegalLocale> { const { locale } = await params; if (!['fr', 'en', 'ar'].includes(locale)) notFound(); return locale as LegalLocale; }
export async function generateMetadata(props: Props) { return legalMetadata('privacy', await localeFrom(props)); }
export default async function Page(props: Props) { return <AngelCareLegalPage kind="privacy" locale={await localeFrom(props)} />; }
