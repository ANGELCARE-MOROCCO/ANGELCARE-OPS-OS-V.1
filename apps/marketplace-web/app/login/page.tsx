import { redirect } from 'next/navigation'

export default function Angelcare360LoginCompatibilityPage() {
  redirect('/angelcare-marketplace/[locale]/auth/login')
}
