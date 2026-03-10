'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Camera, LayoutDashboard, Menu, Package, ShoppingBag, Tag, Users } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'

import { signOutAction as logoutAction } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

type AdminShellProps = {
  adminName: string
  children: React.ReactNode
}

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isNew?: boolean
}

const principalItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
  { label: 'Clientes', href: '/admin/clientes', icon: Users },
]

const catalogItems: NavItem[] = [
  { label: 'Productos', href: '/admin/productos', icon: Package },
  { label: 'Categorias', href: '/admin/categorias', icon: Tag },
]

const toolItems: NavItem[] = [
  { label: 'Probador AR', href: '/admin/ar-studio', icon: Camera, isNew: true },
]

function getBreadcrumb(pathname: string): string[] {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) {
    return ['Admin']
  }

  return parts.map((part) =>
    part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace('Admin', 'Admin')
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  const sections: Array<{ title: string; items: NavItem[] }> = [
    { title: 'PRINCIPAL', items: principalItems },
    { title: 'CATALOGO', items: catalogItems },
    { title: 'HERRAMIENTAS', items: toolItems },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="flex h-full flex-col bg-[#0F0F0D] text-white">
      <div className="border-b border-[#242421] px-5 py-5">
        <Link href="/admin" className="inline-flex items-end gap-1">
          <span className={cn(dmSans.className, 'text-[1.35rem] font-medium')}>Optica</span>
          <span
            className={cn(
              playfairDisplay.className,
              'text-[1.45rem] font-semibold text-[#D4A853] italic'
            )}
          >
            AI
          </span>
        </Link>
      </div>

      <div className="space-y-7 px-3 py-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p
              className={cn(
                dmSans.className,
                'px-2 text-[0.68rem] font-semibold tracking-[0.12em] text-[#A6A69F]'
              )}
            >
              {section.title}
            </p>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        dmSans.className,
                        'group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/90 transition',
                        'hover:bg-[#1a1a1a] hover:text-white',
                        active && 'bg-[#1a1a1a] text-white'
                      )}
                    >
                      {active ? (
                        <span className="absolute top-1/2 left-0 h-7 w-[3px] -translate-y-1/2 rounded-r bg-[#D4A853]" />
                      ) : null}
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                      {item.isNew ? (
                        <span className="ml-auto rounded-full bg-[#D4A853] px-2 py-0.5 text-[0.62rem] font-semibold text-[#0F0F0D]">
                          Nuevo
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminShell({ adminName, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const breadcrumb = useMemo(() => getBreadcrumb(pathname), [pathname])

  return (
    <div className="min-h-screen bg-[#F7F5F1] text-[#0F0F0D]">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <div className="sticky top-0 h-screen">
            <SidebarContent pathname={pathname} />
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-[#E7E2D9] bg-white">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-3">
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger
                    render={<Button variant="outline" size="icon" className="md:hidden" />}
                  >
                    <Menu className="size-4" />
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[260px] border-r border-[#242421] bg-[#0F0F0D] p-0"
                  >
                    <SidebarContent pathname={pathname} />
                  </SheetContent>
                </Sheet>

                <div>
                  <p
                    className={cn(
                      dmSans.className,
                      'text-xs font-medium tracking-[0.14em] text-[#8D8D84] uppercase'
                    )}
                  >
                    Panel Admin
                  </p>
                  <p className={cn(dmSans.className, 'text-sm text-[#1D1D18]')}>
                    {breadcrumb.join(' / ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="inline-flex size-8 items-center justify-center rounded-full bg-[#EEE8DC] text-xs font-semibold text-[#0F0F0D]">
                    {adminName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={cn(dmSans.className, 'hidden text-sm font-medium md:inline')}>
                    {adminName}
                  </span>
                </div>

                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await logoutAction()
                      router.push('/login')
                      router.refresh()
                    })
                  }}
                  className={cn(
                    dmSans.className,
                    'text-xs font-semibold tracking-[0.08em] uppercase'
                  )}
                >
                  {isPending ? 'Saliendo...' : 'Logout'}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
