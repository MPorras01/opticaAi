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
  title: 'Habeas Data · OpticaAI',
  description: 'Tratamiento de datos personales en OpticaAI.',
}

export default function HabeasDataPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
      <div className="max-w-3xl space-y-4">
        <p className={cn(dmSans.className, 'text-sm font-medium tracking-[0.24em] text-[#8A6A2F] uppercase')}>
          Privacidad
        </p>
        <h1 className={cn(playfairDisplay.className, 'text-4xl font-semibold text-[#0F0F0D] md:text-5xl')}>
          Habeas Data
        </h1>
        <p className={cn(dmSans.className, 'text-base leading-7 text-[#66665F]')}>
          Esta pagina resume como OpticaAI trata los datos personales suministrados por clientes,
          visitantes y usuarios de la plataforma digital.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        <section className="rounded-3xl border border-[#E8E2D8] bg-white p-6">
          <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
            Datos que tratamos
          </h2>
          <p className={cn(dmSans.className, 'mt-3 text-sm leading-7 text-[#66665F]')}>
            Podemos tratar nombre, telefono, correo, direccion de entrega, datos del pedido y otra
            informacion compartida por el usuario para atencion comercial, soporte y gestion operativa.
          </p>
        </section>

        <section className="rounded-3xl border border-[#E8E2D8] bg-white p-6">
          <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
            Finalidades
          </h2>
          <p className={cn(dmSans.className, 'mt-3 text-sm leading-7 text-[#66665F]')}>
            La informacion se usa para procesar pedidos, responder solicitudes, hacer seguimiento de
            entregas, brindar acompanamiento comercial y mejorar la experiencia digital de la tienda.
          </p>
        </section>

        <section className="rounded-3xl border border-[#E8E2D8] bg-[#F7F3EC] p-6">
          <h2 className={cn(playfairDisplay.className, 'text-2xl font-semibold text-[#0F0F0D]')}>
            Derechos del titular
          </h2>
          <p className={cn(dmSans.className, 'mt-3 text-sm leading-7 text-[#66665F]')}>
            El titular puede solicitar consulta, actualizacion, correccion o eliminacion de sus datos,
            conforme a la normatividad aplicable. Para ello puede comunicarse por los canales oficiales
            de atencion publicados en la plataforma.
          </p>
        </section>
      </div>
    </div>
  )
}