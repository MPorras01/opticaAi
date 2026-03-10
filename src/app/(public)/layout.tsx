import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

type PublicLayoutProps = {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
