import PrintButtonInterceptor from './PrintButtonInterceptor'

export default function QuoteRequestDossierLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PrintButtonInterceptor />
      {children}
    </>
  )
}
