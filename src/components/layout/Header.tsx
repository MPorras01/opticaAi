'use client'

import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Menu, MessageCircle, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CartDrawer } from '@/components/cart/CartDrawer'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import useCartStore from '@/stores/cart.store'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

const navItems = [
  { label: 'Catalogo', href: '/catalogo' },
  { label: 'Probador Virtual', href: '/probador-virtual' },
  { label: 'Contacto', href: '/contacto' },
]

function useScrolled(threshold = 10) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return isScrolled
}

export function Header() {
  const isScrolled = useScrolled()
  const openCart = useCartStore((state) => state.openCart)
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-[#E2DDD6] bg-[#FAFAF8]/95 transition-all duration-300',
        isScrolled && 'shadow-[0_12px_40px_-32px_rgba(15,15,13,0.45)] backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-[60px] w-full max-w-[1280px] items-center justify-between px-4 md:h-[72px] md:px-8">
        <Link
          href="/"
          className="group inline-flex items-end gap-1 text-[#0F0F0D] transition-transform duration-300 hover:scale-[1.02]"
          aria-label="Ir al inicio de OpticaAI"
        >
          <span
            className={cn(
              dmSans.className,
              'text-[1.35rem] leading-none font-medium tracking-tight'
            )}
          >
            Optica
          </span>
          <span
            className={cn(
              playfairDisplay.className,
              'text-[1.45rem] leading-none font-semibold text-[#D4A853] italic'
            )}
          >
            AI
          </span>
        </Link>

        <nav className="hidden md:block" aria-label="Navegacion principal">
          <ul className="flex items-center gap-10">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    dmSans.className,
                    'relative inline-flex text-[0.95rem] font-medium tracking-[0.02em] text-[#0F0F0D]/85 transition-colors duration-300 hover:text-[#0F0F0D]',
                    'after:absolute after:-bottom-1.5 after:left-0 after:h-[1px] after:w-full after:origin-left after:scale-x-0 after:bg-[#2C3E6B] after:transition-transform after:duration-300 hover:after:scale-x-100'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={openCart}
            className="relative rounded-full border border-[#E2DDD6] bg-[#F0EDE6] text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#ECE7DD]"
            aria-label="Abrir carrito"
          >
            <ShoppingBag className="size-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#D4A853] text-[0.65rem] leading-none font-semibold text-[#0F0F0D]">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Button>

          <Link href="/cuenta">
            <Button
              className={cn(
                dmSans.className,
                'hidden rounded-full bg-[#D4A853] px-4 text-[#0F0F0D] shadow-[0_14px_30px_-18px_rgba(212,168,83,0.95)] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C] sm:inline-flex'
              )}
            >
              Agendar cita
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger
              className="inline-flex size-9 items-center justify-center rounded-full border border-[#E2DDD6] bg-[#F0EDE6] text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#ECE7DD] md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[86%] border-l border-[#E2DDD6] bg-[#FAFAF8] p-0 text-[#0F0F0D] sm:max-w-[360px]"
            >
              <SheetHeader className="border-b border-[#E2DDD6] px-6 pt-6 pb-5">
                <Link
                  href="/"
                  className="inline-flex items-end gap-1"
                  aria-label="Ir al inicio de OpticaAI"
                >
                  <span className={cn(dmSans.className, 'text-[1.35rem] leading-none font-medium')}>
                    Optica
                  </span>
                  <span
                    className={cn(
                      playfairDisplay.className,
                      'text-[1.45rem] leading-none font-semibold text-[#D4A853] italic'
                    )}
                  >
                    AI
                  </span>
                </Link>
              </SheetHeader>

              <nav className="px-6 py-8" aria-label="Navegacion mobile">
                <ul className="space-y-5">
                  {navItems.map((item) => (
                    <li key={`mobile-${item.href}`}>
                      <SheetClose render={<Link href={item.href} />} className="group inline-flex">
                        <span
                          className={cn(
                            playfairDisplay.className,
                            'text-[1.95rem] leading-[1.05] font-medium text-[#0F0F0D] transition-colors duration-300 group-hover:text-[#2C3E6B]'
                          )}
                        >
                          {item.label}
                        </span>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>

              <SheetFooter className="mt-auto border-t border-[#E2DDD6] px-6 py-5">
                <SheetClose
                  render={<a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" />}
                  className={cn(
                    dmSans.className,
                    'inline-flex items-center justify-center gap-2 rounded-full bg-[#2C3E6B] px-4 py-2.5 text-sm font-medium text-[#FAFAF8] transition duration-300 hover:scale-[1.02] hover:bg-[#24355C]'
                  )}
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <CartDrawer />
    </header>
  )
}
