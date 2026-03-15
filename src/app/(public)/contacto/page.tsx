import type { Metadata } from 'next'
import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'

import { siteConfig } from '@/config/site.config'
import { cn } from '@/lib/utils'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

export const metadata: Metadata = {
  title: 'Contacto · OpticaAI',
  description: 'Canales de contacto y atencion de OpticaAI.',
}

export default function ContactoPage() {
  const whatsappNumber = siteConfig.whatsapp.number.replace(/\D/g, '')
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(siteConfig.whatsapp.message)}`

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
      <div className="max-w-2xl space-y-4">
        <p className={cn(dmSans.className, 'text-sm font-medium tracking-[0.24em] text-[#8A6A2F] uppercase')}>
          Contacto
        </p>
        <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D] md:text-5xl')}>
          Hablemos de tu proxima montura
        </h1>
        <p className={cn(dmSans.className, 'text-base leading-7 text-[#66665F]')}>
          Si necesitas asesoria para elegir gafas, soporte con tu pedido o ayuda con el probador
          virtual, te atendemos por WhatsApp y en nuestros canales digitales.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-[#E8E2D8] bg-white p-6 shadow-[0_20px_60px_rgba(15,15,13,0.06)]">
          <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
            Atencion directa
          </h2>
          <div className={cn(dmSans.className, 'mt-4 space-y-3 text-sm text-[#66665F]')}>
            <p>
              <span className="font-semibold text-[#0F0F0D]">WhatsApp:</span> +{whatsappNumber || '57'}
            </p>
            <p>
              <span className="font-semibold text-[#0F0F0D]">Horario:</span> {siteConfig.business.schedule}
            </p>
            <p>
              <span className="font-semibold text-[#0F0F0D]">Ciudad:</span> {siteConfig.business.city}
            </p>
            <p>
              <span className="font-semibold text-[#0F0F0D]">Direccion:</span> {siteConfig.business.address}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={cn(
                dmSans.className,
                'inline-flex items-center justify-center rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1FAE56]'
              )}
            >
              Escribir por WhatsApp
            </a>
            <Link
              href="/catalogo"
              className={cn(
                dmSans.className,
                'inline-flex items-center justify-center rounded-full border border-[#D9D1C5] px-5 py-2.5 text-sm font-semibold text-[#0F0F0D] transition hover:bg-[#F5F0E8]'
              )}
            >
              Ver catalogo
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-[#E8E2D8] bg-[#F7F3EC] p-6">
          <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
            En que te ayudamos
          </h2>
          <ul className={cn(dmSans.className, 'mt-4 space-y-3 text-sm leading-7 text-[#66665F]')}>
            <li>Asesoria para elegir monturas segun tu rostro y estilo.</li>
            <li>Soporte con pedidos web, seguimiento y entregas.</li>
            <li>Guia para usar el probador virtual y overlays AR.</li>
            <li>Orientacion sobre formulas, lentes y combinaciones de montura.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}