import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Facebook, Instagram, MessageCircle } from 'lucide-react'

import { siteConfig } from '@/config/site.config'
import { cn } from '@/lib/utils'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

const exploreLinks = [
  { label: 'Catalogo', href: '/catalogo' },
  { label: 'Probador Virtual', href: '/probador-virtual' },
  { label: 'Mi cuenta', href: '/cuenta' },
  { label: 'Contacto', href: '/contacto' },
]

const whatsappNumber = siteConfig.whatsapp.number.replace(/\D/g, '')
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(siteConfig.whatsapp.message)}`
const displayWhatsappNumber = whatsappNumber ? `+${whatsappNumber}` : 'WhatsApp'

const socialLinks = [
  { label: 'Instagram', href: siteConfig.social.instagram || '#', icon: Instagram },
  { label: 'Facebook', href: siteConfig.social.facebook || '#', icon: Facebook },
  { label: 'WhatsApp', href: whatsappHref, icon: MessageCircle },
]

export function Footer() {
  return (
    <footer className="bg-[#0F0F0D] text-[#FAFAF8]">
      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
          <section className="space-y-5">
            <Link
              href="/"
              className="inline-flex items-end gap-1 text-[#FAFAF8] transition-transform duration-300 hover:scale-[1.02]"
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

            <p
              className={cn(
                playfairDisplay.className,
                'max-w-xs text-lg leading-tight font-medium text-[#FAFAF8]'
              )}
            >
              Tu vision, nuestra pasion
            </p>

            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-10 items-center justify-center rounded-full border border-[#2A2A27] bg-[#171715] text-[#FAFAF8] transition duration-300 hover:scale-[1.02] hover:border-[#D4A853] hover:text-[#D4A853]"
                  >
                    <Icon className="size-4" />
                  </a>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#FAFAF8]')}>
              Explora
            </h3>
            <ul className={cn(dmSans.className, 'mt-5 space-y-3')}>
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group relative inline-flex text-[0.95rem] font-medium text-[#9A9A90] transition-colors duration-300 hover:text-[#FAFAF8]"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#D4A853] transition-transform duration-300 group-hover:scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#FAFAF8]')}>
              Encuentranos
            </h3>
            <div className={cn(dmSans.className, 'mt-5 space-y-3 text-[0.95rem] text-[#9A9A90]')}>
              <p>
                <span className="text-[#FAFAF8]">WhatsApp:</span>{' '}
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-300 hover:text-[#D4A853]"
                >
                  {displayWhatsappNumber}
                </a>
              </p>
              <p>
                <span className="text-[#FAFAF8]">Horario:</span> {siteConfig.business.schedule}
              </p>
              <p>
                <span className="text-[#FAFAF8]">Ciudad:</span> {siteConfig.business.city}
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 border-t border-[#E2DDD6]/35 pt-6 md:mt-12 md:pt-7">
          <div
            className={cn(
              dmSans.className,
              'flex flex-col gap-3 text-sm text-[#9A9A90] md:flex-row md:items-center md:justify-between'
            )}
          >
            <p>© 2025 OpticaAI. Todos los derechos reservados.</p>
            <div className="flex items-center gap-5">
              <Link
                href="/politica-de-devoluciones"
                className="transition-colors duration-300 hover:text-[#D4A853]"
              >
                Politica de devoluciones
              </Link>
              <Link
                href="/habeas-data"
                className="transition-colors duration-300 hover:text-[#D4A853]"
              >
                Habeas Data
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
