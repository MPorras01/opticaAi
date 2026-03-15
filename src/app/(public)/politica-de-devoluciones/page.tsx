import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'

import { cn } from '@/lib/utils'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600'],
})

export const metadata: Metadata = {
  title: 'Politica de Devoluciones · OpticaAI',
  description: 'Politica de devoluciones y cambios de OpticaAI.',
}

export default function PoliticaDeDevolucionesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
      <div className="max-w-3xl space-y-4">
        <p className={cn(dmSans.className, 'text-sm font-medium tracking-[0.24em] text-[#8A6A2F] uppercase')}>
          Legal
        </p>
        <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D] md:text-5xl')}>
          Politica de devoluciones
        </h1>
        <p className={cn(dmSans.className, 'text-base leading-7 text-[#66665F]')}>
          En OpticaAI buscamos que cada compra tenga claridad desde el primer momento. Esta pagina
          resume las condiciones generales de cambios y devoluciones para monturas, lentes y pedidos
          personalizados.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        <section className="rounded-3xl border border-[#E8E2D8] bg-white p-6">
          <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
            Cambios por defecto o error en el pedido
          </h2>
          <p className={cn(dmSans.className, 'mt-3 text-sm leading-7 text-[#66665F]')}>
            Si el producto llega con defecto de fabrica o no coincide con lo confirmado en el pedido,
            puedes solicitar revision y gestion de cambio. El caso debe reportarse en un plazo razonable
            desde la entrega e idealmente con evidencia fotografica.
          </p>
        </section>

        <section className="rounded-3xl border border-[#E8E2D8] bg-white p-6">
          <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
            Productos personalizados
          </h2>
          <p className={cn(dmSans.className, 'mt-3 text-sm leading-7 text-[#66665F]')}>
            Los pedidos con lentes formulados, adaptaciones especiales o configuraciones personalizadas
            requieren validacion tecnica. Por su naturaleza, pueden no aplicar a retracto libre una vez
            iniciada su fabricacion, salvo error atribuible a OpticaAI o defecto comprobado.
          </p>
        </section>

        <section className="rounded-3xl border border-[#E8E2D8] bg-[#F7F3EC] p-6">
          <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
            Como solicitar soporte
          </h2>
          <p className={cn(dmSans.className, 'mt-3 text-sm leading-7 text-[#66665F]')}>
            Escríbenos por WhatsApp con tu numero de pedido, nombre completo, motivo de la solicitud y
            evidencia del caso. Revisaremos cada solicitud y te indicaremos los siguientes pasos.
          </p>
        </section>
      </div>
    </div>
  )
}